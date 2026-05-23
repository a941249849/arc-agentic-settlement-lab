"use client";

import { useState } from "react";
import type { ArcSettlementJob } from "@/lib/types";
import { updateJob } from "@/hooks/useJobs";
import { ARC_TESTNET_EXPLORER } from "@/lib/arc-chain";
import type { ArcCommerceAction } from "@/lib/arc-commerce";
import { useArcWallet, walletErrorMessage } from "./ArcWalletProvider";

interface Props {
  job: ArcSettlementJob;
  deliverableHash: string;
  onUpdate: (updated: ArcSettlementJob) => void;
}

const ACTION_LABELS: Record<ArcCommerceAction, string> = {
  createJob: "Create Onchain Job",
  setBudget: "Set Budget",
  approve: "Approve USDC",
  fund: "Fund Escrow",
  submit: "Submit Deliverable",
  complete: "Complete Job",
};

function shortHash(hash: string) {
  return `${hash.slice(0, 10)}...${hash.slice(-6)}`;
}

function nextPatch(
  action: ArcCommerceAction,
  txHash: string,
  job: ArcSettlementJob,
  parsedJobId?: string,
  deliverableHash?: string
): Partial<ArcSettlementJob> {
  const base: Partial<ArcSettlementJob> = { settlementMode: "onchain-partial" };

  if (action === "createJob") {
    return {
      ...base,
      status: "open",
      createTxHash: txHash,
      onchainJobId: parsedJobId ?? job.onchainJobId,
    };
  }
  if (action === "setBudget") {
    return { ...base, status: "budgeted", setBudgetTxHash: txHash, budgetAmount: job.amount };
  }
  if (action === "approve") {
    return { ...base, approveTxHash: txHash };
  }
  if (action === "fund") {
    return { ...base, status: "funded", fundTxHash: txHash };
  }
  if (action === "submit") {
    return { ...base, status: "submitted", submitTxHash: txHash, deliverableHash };
  }
  // Only mark onchain-verified when all prior lifecycle tx hashes are present,
  // confirming the full ERC-8183 sequence was executed on Arc Testnet.
  const allPriorTxPresent =
    job.createTxHash &&
    job.setBudgetTxHash &&
    job.approveTxHash &&
    job.fundTxHash &&
    job.submitTxHash;
  return {
    status: "settled",
    settleTxHash: txHash,
    settlementMode: allPriorTxPresent ? "onchain-verified" : "onchain-partial",
  };
}

function recommendedActions(job: ArcSettlementJob): ArcCommerceAction[] {
  if (job.status === "settled" && job.settlementMode === "simulated" && !job.createTxHash) return [];
  if (!job.onchainJobId) return ["createJob"];
  if (!job.setBudgetTxHash) return ["setBudget"];
  if (!job.approveTxHash) return ["approve"];
  if (!job.fundTxHash) return ["fund"];
  if (!job.submitTxHash) return ["submit"];
  if (!job.settleTxHash && job.agentReview?.verdict === "approve") return ["complete"];
  return [];
}

export default function OnchainExecutionPanel({ job, deliverableHash, onUpdate }: Props) {
  const {
    activeProvider,
    account,
    chainId,
    arcChainIdHex,
    isArcNetwork,
    running: walletRunning,
    connectWallet,
    ensureArcNetwork,
    refreshChainId,
    getProvider,
    selectedWallet,
  } = useArcWallet();
  const [running, setRunning] = useState<ArcCommerceAction | "verify" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastTx, setLastTx] = useState<{ hash: string; action: ArcCommerceAction } | null>(null);
  const [chainJob, setChainJob] = useState<{
    id: string;
    budget: string;
    statusName: string;
    client: string;
    provider: string;
    evaluator: string;
  } | null>(null);

  async function waitForParsedTx(hash: string) {
    for (let i = 0; i < 30; i++) {
      const res = await fetch(`/api/arc-commerce/tx/${hash}`);
      if (res.ok) {
        const data = await res.json();
        return data.tx as { status: "success" | "reverted"; jobId?: string };
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
    throw new Error("Transaction was submitted, but Arc RPC did not return a receipt in time.");
  }

  async function execute(action: ArcCommerceAction) {
    setError(null);
    setRunning(action);
    try {
      if (!activeProvider || !account) {
        await connectWallet();
      }
      const provider = activeProvider ?? getProvider();
      const from = account ?? (((await provider.request({ method: "eth_accounts" })) as string[])?.[0]);
      if (!from) throw new Error("Wallet account is not connected.");
      const currentChainId = await refreshChainId();
      if (currentChainId?.toLowerCase() !== arcChainIdHex.toLowerCase()) {
        await ensureArcNetwork();
      }
      if (action === "submit" && !deliverableHash.trim()) {
        throw new Error("Deliverable hash is required before submitting onchain.");
      }
      if (action === "complete" && job.agentReview?.verdict !== "approve") {
        throw new Error("AI evaluator approval is required before completing settlement.");
      }

      const prepared = await fetch("/api/arc-commerce/prepare", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action,
          providerAddress: job.providerAddress,
          evaluatorAddress: job.evaluatorAddress,
          description: job.description,
          onchainJobId: job.onchainJobId,
          amount: job.budgetAmount ?? job.amount,
          deliverableHash,
          reason: "deliverable-approved",
        }),
      });
      const preparedData = await prepared.json();
      if (!prepared.ok) throw new Error(preparedData.error ?? `HTTP ${prepared.status}`);

      const hash = (await provider.request({
        method: "eth_sendTransaction",
        params: [{ from, ...preparedData.tx }],
      })) as string;

      setLastTx({ hash, action });
      const parsed = await waitForParsedTx(hash);
      if (parsed.status !== "success") throw new Error("Transaction reverted on Arc Testnet.");

      const updated = await updateJob(
        job.id,
        nextPatch(action, hash, job, parsed.jobId, deliverableHash.trim())
      );
      onUpdate(updated);
    } catch (err) {
      setError(walletErrorMessage(err, "Onchain execution failed"));
    } finally {
      setRunning(null);
    }
  }

  async function verifyJob() {
    if (!job.onchainJobId) return;
    setRunning("verify");
    setError(null);
    try {
      const res = await fetch(`/api/arc-commerce/jobs/${job.onchainJobId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setChainJob(data.job);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not verify ERC-8183 job");
    } finally {
      setRunning(null);
    }
  }

  const actions = recommendedActions(job);
  const localSettlementLocked =
    job.status === "settled" && job.settlementMode === "simulated" && !job.createTxHash;

  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-4 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-slate-950">Arc Testnet transaction steps</div>
          <p className="text-xs text-slate-500 mt-1">
            Uses the global wallet from the top-right menu. Connect once, then submit each payment
            step from this settlement record.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {localSettlementLocked ? (
          <span className="text-xs font-semibold text-amber-700">
            This settlement is already completed as a local receipt. Create a new settlement to run
            the Arc onchain path.
          </span>
        ) : actions.length ? (
          actions.map((action) => (
            <button
              key={action}
              onClick={() => execute(action)}
              disabled={running !== null || walletRunning !== null}
              className="px-3 py-1.5 rounded-lg bg-slate-950 text-white text-xs font-semibold hover:bg-slate-800 disabled:opacity-50"
            >
              {running === action ? "Waiting..." : ACTION_LABELS[action]}
            </button>
          ))
        ) : (
          <span className="text-xs font-semibold text-emerald-700">
            {job.submitTxHash && !job.settleTxHash && job.agentReview?.verdict !== "approve"
              ? "Run AI evaluator review before completing settlement."
              : "All ERC-8183 actions have tx evidence."}
          </span>
        )}
        {job.onchainJobId && (
          <button
            onClick={verifyJob}
            disabled={running !== null || walletRunning !== null}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {running === "verify" ? "Verifying..." : "Read getJob()"}
          </button>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-2 text-xs">
        <div>
          <span className="text-slate-500">Wallet: </span>
          <span className={selectedWallet ? "text-slate-950" : "text-amber-700"}>
            {selectedWallet?.info.name ?? "not detected"}
          </span>
        </div>
        <div>
          <span className="text-slate-500">Wallet chain: </span>
          <span className={isArcNetwork ? "text-emerald-700" : "text-amber-700"}>
            {isArcNetwork ? "Arc Testnet" : chainId ?? "unknown"}
          </span>
        </div>
        <div>
          <span className="text-slate-500">Receipt state: </span>
          <span className="text-slate-950">{job.settlementMode}</span>
        </div>
        <div>
          <span className="text-slate-500">ERC-8183 job ID: </span>
          <span className="text-slate-950">{job.onchainJobId ?? "not created"}</span>
        </div>
        <div>
          <span className="text-slate-500">Next signer: </span>
          <span className="text-slate-950">
            {!job.onchainJobId
              ? "client"
              : !job.setBudgetTxHash
              ? "provider"
              : !job.approveTxHash || !job.fundTxHash
              ? "client"
              : !job.submitTxHash
              ? "provider"
              : !job.settleTxHash
              ? "evaluator"
              : "done"}
          </span>
        </div>
      </div>

      {lastTx && (
        <a
          href={`${ARC_TESTNET_EXPLORER}/tx/${lastTx.hash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-xs text-emerald-700 hover:underline"
        >
          Last {lastTx.action}: {shortHash(lastTx.hash)}
        </a>
      )}

      {chainJob && (
        <div className="rounded-lg border border-slate-200 bg-white p-3 text-xs grid md:grid-cols-3 gap-2">
          <div>
            <span className="text-slate-500">Status: </span>
            <span className="text-emerald-700">{chainJob.statusName}</span>
          </div>
          <div>
            <span className="text-slate-500">Budget: </span>
            <span className="text-slate-950">{chainJob.budget} USDC</span>
          </div>
          <div>
            <span className="text-slate-500">Job ID: </span>
            <span className="text-slate-950">{chainJob.id}</span>
          </div>
        </div>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
