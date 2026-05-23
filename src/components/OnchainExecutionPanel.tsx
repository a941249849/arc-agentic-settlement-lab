"use client";

import { useState } from "react";
import type { ArcSettlementJob } from "@/lib/types";
import { updateJob } from "@/hooks/useJobs";
import { ARC_TESTNET_EXPLORER, arcTestnet } from "@/lib/arc-chain";
import type { ArcCommerceAction } from "@/lib/arc-commerce";

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

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
  if (!job.onchainJobId) return ["createJob"];
  if (!job.setBudgetTxHash) return ["setBudget"];
  if (!job.approveTxHash) return ["approve"];
  if (!job.fundTxHash) return ["fund"];
  if (!job.submitTxHash) return ["submit"];
  if (!job.settleTxHash) return ["complete"];
  return [];
}

export default function OnchainExecutionPanel({ job, deliverableHash, onUpdate }: Props) {
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [running, setRunning] = useState<ArcCommerceAction | "verify" | "connect" | "switch" | "add" | null>(null);
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

  const arcChainIdHex = `0x${arcTestnet.id.toString(16)}`;

  async function refreshChainId() {
    if (!window.ethereum) return null;
    const id = (await window.ethereum.request({ method: "eth_chainId" })) as string;
    setChainId(id);
    return id;
  }

  async function addArcNetwork() {
    if (!window.ethereum) {
      setError("No injected wallet found. Use OKX Wallet, MetaMask, or another EIP-1193 wallet.");
      return;
    }
    setRunning("add");
    setError(null);
    try {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: arcChainIdHex,
            chainName: arcTestnet.name,
            nativeCurrency: arcTestnet.nativeCurrency,
            rpcUrls: arcTestnet.rpcUrls.default.http,
            blockExplorerUrls: [ARC_TESTNET_EXPLORER],
          },
        ],
      });
      await refreshChainId();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add Arc Testnet.");
    } finally {
      setRunning(null);
    }
  }

  async function switchToArcNetwork() {
    if (!window.ethereum) {
      setError("No injected wallet found. Use OKX Wallet, MetaMask, or another EIP-1193 wallet.");
      return;
    }
    setRunning("switch");
    setError(null);
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: arcChainIdHex }],
      });
      await refreshChainId();
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (message.includes("4902") || message.toLowerCase().includes("unrecognized")) {
        await addArcNetwork();
        return;
      }
      setError(message || "Could not switch to Arc Testnet.");
    } finally {
      setRunning(null);
    }
  }

  async function connectWallet() {
    setRunning("connect");
    setError(null);
    if (!window.ethereum) {
      setError("No injected wallet found. Use OKX Wallet, MetaMask, or another EIP-1193 wallet.");
      setRunning(null);
      return;
    }
    try {
    const accounts = (await window.ethereum.request({
      method: "eth_requestAccounts",
    })) as string[];
    setAccount(accounts[0] ?? null);
      await refreshChainId();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wallet connection failed.");
    } finally {
      setRunning(null);
    }
  }

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
      if (!window.ethereum || !account) {
        await connectWallet();
      }
      const from = account ?? (((await window.ethereum?.request({ method: "eth_accounts" })) as string[])?.[0]);
      if (!window.ethereum || !from) throw new Error("Wallet account is not connected.");
      const currentChainId = await refreshChainId();
      if (currentChainId?.toLowerCase() !== arcChainIdHex.toLowerCase()) {
        throw new Error("Wallet is not on Arc Testnet. Use 'Switch to Arc' before signing.");
      }
      if (action === "submit" && !deliverableHash.trim()) {
        throw new Error("Deliverable hash is required before submitting onchain.");
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

      const hash = (await window.ethereum.request({
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
      setError(err instanceof Error ? err.message : "Onchain execution failed");
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

  return (
    <div className="rounded-lg border border-green-900 bg-green-950/10 p-4 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-green-300">Arc Testnet transaction steps</div>
          <p className="text-xs text-gray-500 mt-1">
            Connect a wallet on Arc Testnet and submit each payment step. The receipt becomes fully
            verified only after every required transaction hash is recorded.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={connectWallet}
          disabled={running !== null}
          className="px-3 py-1.5 rounded border border-green-800 text-xs text-green-300 hover:bg-green-900/30 disabled:opacity-50"
        >
          {running === "connect"
            ? "Connecting..."
            : account
            ? `${account.slice(0, 6)}...${account.slice(-4)}`
            : "Connect Wallet"}
        </button>
        <button
          onClick={switchToArcNetwork}
          disabled={running !== null}
          className="px-3 py-1.5 rounded border border-blue-800 text-xs text-blue-300 hover:bg-blue-900/30 disabled:opacity-50"
        >
          {running === "switch" ? "Switching..." : "Switch to Arc"}
        </button>
        <button
          onClick={addArcNetwork}
          disabled={running !== null}
          className="px-3 py-1.5 rounded border border-gray-700 text-xs text-gray-300 hover:bg-gray-800 disabled:opacity-50"
        >
          {running === "add" ? "Adding..." : "Add Arc Network"}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {actions.length ? (
          actions.map((action) => (
            <button
              key={action}
              onClick={() => execute(action)}
              disabled={running !== null}
              className="px-3 py-1.5 rounded bg-green-800 text-green-100 text-xs font-semibold hover:bg-green-700 disabled:opacity-50"
            >
              {running === action ? "Waiting..." : ACTION_LABELS[action]}
            </button>
          ))
        ) : (
          <span className="text-xs text-green-300">All ERC-8183 actions have tx evidence.</span>
        )}
        {job.onchainJobId && (
          <button
            onClick={verifyJob}
            disabled={running !== null}
            className="px-3 py-1.5 rounded border border-gray-700 text-xs text-gray-300 hover:bg-gray-800 disabled:opacity-50"
          >
            {running === "verify" ? "Verifying..." : "Read getJob()"}
          </button>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-2 text-xs">
        <div>
          <span className="text-gray-500">Wallet chain: </span>
          <span className={chainId?.toLowerCase() === arcChainIdHex.toLowerCase() ? "text-green-300" : "text-yellow-300"}>
            {chainId ?? "unknown"}
          </span>
        </div>
        <div>
          <span className="text-gray-500">Receipt state: </span>
          <span className="text-white">{job.settlementMode}</span>
        </div>
        <div>
          <span className="text-gray-500">ERC-8183 job ID: </span>
          <span className="text-white">{job.onchainJobId ?? "not created"}</span>
        </div>
        <div>
          <span className="text-gray-500">Next signer: </span>
          <span className="text-white">
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
          className="block text-xs text-blue-400 hover:underline"
        >
          Last {lastTx.action}: {shortHash(lastTx.hash)}
        </a>
      )}

      {chainJob && (
        <div className="rounded border border-gray-800 bg-gray-950/60 p-3 text-xs grid md:grid-cols-3 gap-2">
          <div>
            <span className="text-gray-500">Status: </span>
            <span className="text-green-300">{chainJob.statusName}</span>
          </div>
          <div>
            <span className="text-gray-500">Budget: </span>
            <span className="text-white">{chainJob.budget} USDC</span>
          </div>
          <div>
            <span className="text-gray-500">Job ID: </span>
            <span className="text-white">{chainJob.id}</span>
          </div>
        </div>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
