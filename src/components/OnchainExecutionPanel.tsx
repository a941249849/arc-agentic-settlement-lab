"use client";

import { useState } from "react";
import { decodeEventLog, type Hex } from "viem";
import type { ArcSettlementJob } from "@/lib/types";
import { updateJob } from "@/hooks/useJobs";
import { ARC_TESTNET_EXPLORER } from "@/lib/arc-chain";
import { agenticCommerceAbi, type ArcCommerceAction } from "@/lib/arc-commerce";
import { useArcWallet, walletErrorMessage } from "./ArcWalletProvider";

interface Props {
  job: ArcSettlementJob;
  deliverableHash: string;
  onUpdate: (updated: ArcSettlementJob) => void;
}

const ACTION_LABELS: Record<ArcCommerceAction, string> = {
  createJob: "Open settlement room",
  setBudget: "Confirm supplier budget",
  approve: "Authorize USDC",
  fund: "Lock funds in escrow",
  submit: "Submit delivery proof",
  complete: "Release payment",
};

const TECHNICAL_LABELS: Record<ArcCommerceAction, string> = {
  createJob: "createJob",
  setBudget: "setBudget",
  approve: "USDC approve",
  fund: "fund",
  submit: "submit",
  complete: "complete",
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
  if (!job.onchainJobId) return ["createJob"];
  if (!job.setBudgetTxHash) return ["setBudget"];
  if (!job.approveTxHash) return ["approve"];
  if (!job.fundTxHash) return ["fund"];
  if (!job.submitTxHash) return ["submit"];
  if (!job.settleTxHash && job.agentReview?.verdict === "approve") return ["complete"];
  return [];
}

function actionHelp(action?: ArcCommerceAction) {
  if (action === "createJob") return "Create the Arc settlement record that binds the buyer, supplier, evaluator, invoice, and payment amount.";
  if (action === "setBudget") return "Record the supplier budget so the escrow amount is tied to the business request.";
  if (action === "approve") return "Authorize the settlement contract to move the selected USDC amount.";
  if (action === "fund") return "Move USDC into escrow instead of sending it directly to the supplier.";
  if (action === "submit") return "Attach the delivery proof to the settlement before any release decision.";
  if (action === "complete") return "Release escrow only after the evaluator agent has approved the delivery evidence.";
  return "The payment has enough Arc evidence for this stage.";
}

function nextSigner(action?: ArcCommerceAction) {
  if (action === "createJob" || action === "approve" || action === "fund") return "buyer";
  if (action === "setBudget" || action === "submit") return "supplier";
  if (action === "complete") return "evaluator";
  return "none";
}

function normalizeReceiptStatus(status: unknown) {
  if (status === "success" || status === "0x1" || status === 1) return "success";
  if (status === "reverted" || status === "0x0" || status === 0) return "reverted";
  return "unknown";
}

function parseJobIdFromLogs(logs: unknown) {
  if (!Array.isArray(logs)) return undefined;
  for (const log of logs) {
    const item = log as { data?: Hex; topics?: Hex[] };
    if (!item.data || !Array.isArray(item.topics) || item.topics.length === 0) continue;
    try {
      const decoded = decodeEventLog({
        abi: agenticCommerceAbi,
        data: item.data,
        topics: item.topics as [Hex, ...Hex[]],
      });
      if (decoded.eventName === "JobCreated") {
        return decoded.args.jobId.toString();
      }
    } catch {
      continue;
    }
  }
  return undefined;
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

  async function waitForParsedTx(provider: ReturnType<typeof getProvider>, hash: string) {
    for (let i = 0; i < 36; i++) {
      const res = await fetch(`/api/arc-commerce/tx/${hash}`);
      if (res.ok) {
        const data = await res.json();
        return data.tx as { status: "success" | "reverted"; jobId?: string };
      }
      const walletReceipt = (await provider
        .request({
          method: "eth_getTransactionReceipt",
          params: [hash],
        })
        .catch(() => null)) as { status?: unknown; logs?: unknown } | null;
      if (walletReceipt) {
        const status = normalizeReceiptStatus(walletReceipt.status);
        if (status === "unknown") {
          await new Promise((resolve) => setTimeout(resolve, 2000));
          continue;
        }
        return {
          status,
          jobId: parseJobIdFromLogs(walletReceipt.logs),
        };
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
    throw new Error(
      "Wallet returned a transaction hash, but neither Arc RPC nor wallet RPC returned a receipt yet. Use Read getJob() or retry verification after propagation."
    );
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
      const parsed = await waitForParsedTx(provider, hash);
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
  const nextAction = actions[0];

  const expectedAddress = nextAction
    ? nextSigner(nextAction) === "buyer"
      ? job.clientAddress
      : nextSigner(nextAction) === "supplier"
      ? job.providerAddress
      : nextSigner(nextAction) === "evaluator"
      ? job.evaluatorAddress
      : ""
    : "";

  const isRoleMismatch =
    nextAction &&
    account &&
    expectedAddress &&
    account.toLowerCase() !== expectedAddress.toLowerCase();

  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-4 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-slate-950">Settlement action</div>
          <p className="text-xs text-slate-600 mt-1">
            The app captures each wallet transaction automatically. No manual hash copy is required.
          </p>
        </div>
      </div>

      {isRoleMismatch && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-xs text-red-700 space-y-2">
          <div className="font-bold flex items-center gap-1">
            <span>⚠️ Connected Wallet Role Mismatch</span>
          </div>
          <p>
            The next action <strong>{ACTION_LABELS[nextAction]}</strong> requires the <strong>{nextSigner(nextAction).toUpperCase()}</strong> account:
          </p>
          <code className="block p-2 font-mono break-all text-[11px] bg-red-100 rounded border border-red-200 select-all">
            {expectedAddress}
          </code>
          <p className="mt-1">
            Your currently connected wallet address is:
          </p>
          <code className="block p-2 font-mono break-all text-[11px] bg-red-100 rounded border border-red-200">
            {account}
          </code>
          <p className="mt-2 text-red-600 font-semibold">
            Please switch to the correct account in your OKX or MetaMask browser extension to proceed.
          </p>
        </div>
      )}

      {nextAction ? (
        <div className="rounded-lg border border-emerald-200 bg-white p-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-base font-semibold text-slate-950">{ACTION_LABELS[nextAction]}</div>
              <p className="mt-1 max-w-2xl text-sm text-slate-600">{actionHelp(nextAction)}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="rounded-lg bg-slate-100 px-2 py-1 text-slate-600">
                  Signer: {nextSigner(nextAction)}
                </span>
                <span className="rounded-lg bg-slate-100 px-2 py-1 text-slate-600">
                  Wallet: {selectedWallet?.info.name ?? "OKX or MetaMask"}
                </span>
                <span
                  className={`rounded-lg px-2 py-1 ${
                    isArcNetwork ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {isArcNetwork ? "Arc Testnet ready" : "Switches to Arc Testnet before signing"}
                </span>
              </div>
            </div>
            <button
              onClick={() => execute(nextAction)}
              disabled={running !== null || walletRunning !== null || !!isRoleMismatch}
              className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {running === nextAction ? "Waiting for wallet..." : ACTION_LABELS[nextAction]}
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-emerald-200 bg-white p-4 text-sm font-semibold text-emerald-700">
          {job.submitTxHash && !job.settleTxHash && job.agentReview?.verdict !== "approve"
            ? "Delivery proof is onchain. Run evaluator review to unlock release."
            : "All required settlement actions for this stage are recorded."}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
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

      <details className="rounded-lg border border-slate-200 bg-white p-3">
        <summary className="cursor-pointer text-xs font-semibold text-slate-700">
          Advanced Arc execution trail
        </summary>
        <div className="mt-3 grid gap-2 text-xs md:grid-cols-2">
          <div>
            <span className="text-slate-500">Wallet chain: </span>
            <span className={isArcNetwork ? "text-emerald-700" : "text-amber-700"}>
              {isArcNetwork ? "Arc Testnet" : chainId ?? "unknown"}
            </span>
          </div>
          <div>
            <span className="text-slate-500">ERC-8183 job ID: </span>
            <span className="text-slate-950">{job.onchainJobId ?? "not created"}</span>
          </div>
          {actions.map((action) => (
            <div key={action} className="text-slate-500">
              Next contract call: <span className="font-semibold text-slate-950">{TECHNICAL_LABELS[action]}</span>
            </div>
          ))}
        </div>
      </details>

      {lastTx && (
        <a
          href={`${ARC_TESTNET_EXPLORER}/tx/${lastTx.hash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-xs text-emerald-700 hover:underline"
        >
          Last transaction captured automatically: {shortHash(lastTx.hash)}
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
