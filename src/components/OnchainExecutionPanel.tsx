"use client";

import { useEffect, useMemo, useState } from "react";
import type { ArcSettlementJob } from "@/lib/types";
import { updateJob } from "@/hooks/useJobs";
import { ARC_TESTNET_EXPLORER, arcTestnet } from "@/lib/arc-chain";
import type { ArcCommerceAction } from "@/lib/arc-commerce";

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

type WalletProvider = {
  info: {
    uuid: string;
    name: string;
    icon?: string;
    rdns?: string;
  };
  provider: EthereumProvider;
};

type Eip6963ProviderEvent = Event & {
  detail?: WalletProvider;
};

declare global {
  interface Window {
    ethereum?: EthereumProvider;
    okxwallet?: EthereumProvider;
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

function walletErrorMessage(err: unknown, fallback: string) {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === "object" && err !== null) {
    const maybe = err as { message?: unknown; code?: unknown; data?: unknown };
    const parts = [
      typeof maybe.message === "string" ? maybe.message : null,
      maybe.code !== undefined ? `code=${String(maybe.code)}` : null,
      maybe.data !== undefined ? `data=${JSON.stringify(maybe.data)}` : null,
    ].filter(Boolean);
    if (parts.length) return parts.join(" ");
  }
  if (typeof err === "string" && err) return err;
  return fallback;
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
  const [wallets, setWallets] = useState<WalletProvider[]>([]);
  const [selectedWalletId, setSelectedWalletId] = useState<string>("");
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

  useEffect(() => {
    const discovered = new Map<string, WalletProvider>();

    function addWallet(wallet: WalletProvider) {
      discovered.set(wallet.info.uuid, wallet);
      setWallets(Array.from(discovered.values()));
      setSelectedWalletId((current) => current || wallet.info.uuid);
    }

    if (window.ethereum) {
      addWallet({
        info: { uuid: "legacy-window-ethereum", name: "Injected Wallet" },
        provider: window.ethereum,
      });
    }

    if (window.okxwallet) {
      addWallet({
        info: { uuid: "legacy-okx-wallet", name: "OKX Wallet" },
        provider: window.okxwallet,
      });
    }

    function onProvider(event: Event) {
      const detail = (event as Eip6963ProviderEvent).detail;
      if (detail?.provider && detail.info?.uuid) addWallet(detail);
    }

    window.addEventListener("eip6963:announceProvider", onProvider);
    window.dispatchEvent(new Event("eip6963:requestProvider"));

    return () => window.removeEventListener("eip6963:announceProvider", onProvider);
  }, []);

  const activeProvider = useMemo(() => {
    return wallets.find((wallet) => wallet.info.uuid === selectedWalletId)?.provider ?? null;
  }, [selectedWalletId, wallets]);

  const selectedWallet = wallets.find((wallet) => wallet.info.uuid === selectedWalletId);

  function requireProvider() {
    const provider = activeProvider ?? window.okxwallet ?? window.ethereum;
    if (!provider) {
      throw new Error(
        "No injected wallet found. Enable OKX Wallet, MetaMask, Tempo Wallet, or another EIP-1193 wallet for this site, then reload."
      );
    }
    return provider;
  }

  async function refreshChainId() {
    const provider = activeProvider ?? window.okxwallet ?? window.ethereum;
    if (!provider) return null;
    const id = (await provider.request({ method: "eth_chainId" })) as string;
    setChainId(id);
    return id;
  }

  async function addArcNetwork() {
    setRunning("add");
    setError(null);
    try {
      const provider = requireProvider();
      await provider.request({
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
      setError(walletErrorMessage(err, "Could not add Arc Testnet."));
    } finally {
      setRunning(null);
    }
  }

  async function switchToArcNetwork() {
    setRunning("switch");
    setError(null);
    try {
      const provider = requireProvider();
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: arcChainIdHex }],
      });
      await refreshChainId();
    } catch (err) {
      const message = walletErrorMessage(err, "");
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
    try {
      const provider = requireProvider();
      const accounts = (await provider.request({
        method: "eth_requestAccounts",
      })) as string[];
      setAccount(accounts[0] ?? null);
      await refreshChainId();
    } catch (err) {
      setError(walletErrorMessage(err, "Wallet connection failed."));
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
      if (!activeProvider || !account) {
        await connectWallet();
      }
      const provider = requireProvider();
      const from = account ?? (((await provider.request({ method: "eth_accounts" })) as string[])?.[0]);
      if (!from) throw new Error("Wallet account is not connected.");
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
        {wallets.length > 0 && (
          <select
            value={selectedWalletId}
            onChange={(event) => setSelectedWalletId(event.target.value)}
            className="px-3 py-1.5 rounded border border-gray-700 bg-gray-900 text-xs text-gray-200"
          >
            {wallets.map((wallet) => (
              <option key={wallet.info.uuid} value={wallet.info.uuid}>
                {wallet.info.name}
              </option>
            ))}
          </select>
        )}
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
          <span className="text-gray-500">Wallet: </span>
          <span className={selectedWallet ? "text-white" : "text-yellow-300"}>
            {selectedWallet?.info.name ?? "not detected"}
          </span>
        </div>
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
