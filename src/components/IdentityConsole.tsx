"use client";

import { useState } from "react";
import type { ArcAgentIdentity } from "@/lib/types";

interface RegistrationPlan {
  chainId: number;
  network: string;
  contractAddress: string;
  abiFunctionSignature: string;
  args: string[];
  calldata: string;
  explorerUrl: string;
}

interface Props {
  compact?: boolean;
  onVerified?: (identity: ArcAgentIdentity) => void;
}

export default function IdentityConsole({ compact = false, onVerified }: Props) {
  const [metadataURI, setMetadataURI] = useState(
    "ipfs://bafkreibdi6623n3xpf7ymk62ckb4bo75o3qemwkpfvp5i25j66itxvsoei"
  );
  const [agentId, setAgentId] = useState("");
  const [expectedOwnerAddress, setExpectedOwnerAddress] = useState("");
  const [registerTxHash, setRegisterTxHash] = useState("");
  const [compareMetadata, setCompareMetadata] = useState(false);
  const [registration, setRegistration] = useState<RegistrationPlan | null>(null);
  const [identity, setIdentity] = useState<ArcAgentIdentity | null>(null);
  const [checks, setChecks] = useState<{
    ownerMatches?: boolean;
    metadataMatches?: boolean;
  } | null>(null);
  const [loading, setLoading] = useState<"prepare" | "verify" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function prepare() {
    setLoading("prepare");
    setError(null);
    try {
      const res = await fetch("/api/arc-identity/prepare", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ metadataURI }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setRegistration(data.registration);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to prepare registration");
    } finally {
      setLoading(null);
    }
  }

  async function verify() {
    setLoading("verify");
    setError(null);
    setIdentity(null);
    setChecks(null);
    try {
      const res = await fetch("/api/arc-identity/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          agentId,
          expectedOwnerAddress: expectedOwnerAddress || undefined,
          expectedMetadataURI: compareMetadata && metadataURI ? metadataURI : undefined,
          registerTxHash: registerTxHash || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setIdentity(data.identity);
      setChecks(data.checks);
      onVerified?.(data.identity);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Identity verification failed");
    } finally {
      setLoading(null);
    }
  }

  return (
    <section className={`rounded-lg border border-slate-200 bg-slate-50 space-y-4 ${compact ? "p-3" : "p-4"}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-950">ERC-8004 Agent Identity</h2>
          <p className="text-xs text-slate-500 mt-1">
            Prepare `register(string)` calldata, then verify an existing Arc Testnet agent by
            reading `ownerOf` and `tokenURI` from IdentityRegistry.
          </p>
        </div>
        {!compact && (
          <span className="px-2 py-1 rounded-lg text-xs bg-sky-50 text-sky-700 border border-sky-200 whitespace-nowrap">
            Identity proof
          </span>
        )}
      </div>

      <div className={`grid gap-4 ${compact ? "" : "md:grid-cols-2"}`}>
        <div className="space-y-3">
          <label className="block space-y-1">
            <span className="text-xs text-slate-500">Metadata URI</span>
            <input
              value={metadataURI}
              onChange={(e) => setMetadataURI(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-950 text-sm font-mono focus:outline-none focus:border-emerald-500"
            />
          </label>
          <button
            onClick={prepare}
            disabled={loading === "prepare"}
            className="px-4 py-2 rounded-lg bg-slate-950 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-50"
          >
            {loading === "prepare" ? "Preparing..." : compact ? "Prepare calldata" : "Prepare Register Calldata"}
          </button>
        </div>

        <div className="space-y-3">
          <div className={`grid gap-3 ${compact ? "" : "md:grid-cols-2"}`}>
            <label className="block space-y-1">
              <span className="text-xs text-slate-500">Agent ID</span>
              <input
                value={agentId}
                onChange={(e) => setAgentId(e.target.value)}
                placeholder="e.g. 12"
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-950 text-sm font-mono focus:outline-none focus:border-emerald-500"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-slate-500">Expected owner</span>
              <input
                value={expectedOwnerAddress}
                onChange={(e) => setExpectedOwnerAddress(e.target.value)}
                placeholder="0x..."
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-950 text-sm font-mono focus:outline-none focus:border-emerald-500"
              />
            </label>
          </div>
          <label className="block space-y-1">
            <span className="text-xs text-slate-500">Register tx hash</span>
            <input
              value={registerTxHash}
              onChange={(e) => setRegisterTxHash(e.target.value)}
              placeholder="0x... optional"
              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-950 text-sm font-mono focus:outline-none focus:border-emerald-500"
            />
          </label>
          <label className="flex items-center gap-2 text-xs text-slate-500">
            <input
              type="checkbox"
              checked={compareMetadata}
              onChange={(e) => setCompareMetadata(e.target.checked)}
              className="accent-emerald-600"
            />
            Compare metadata URI during verification
          </label>
          <button
            onClick={verify}
            disabled={loading === "verify"}
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50"
          >
            {loading === "verify" ? "Verifying..." : "Verify Agent Onchain"}
          </button>
        </div>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      {registration && (
        <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-2">
          <div className="text-sm font-semibold text-slate-950">Registration Call</div>
          <div className="grid md:grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-500">Network: </span>
              <span className="text-slate-950">
                {registration.network} ({registration.chainId})
              </span>
            </div>
            <div>
              <span className="text-slate-500">Function: </span>
              <code className="text-sky-700">{registration.abiFunctionSignature}</code>
            </div>
          </div>
          <div className="text-xs">
            <span className="text-slate-500">Contract: </span>
            <code className="text-sky-700 break-all">{registration.contractAddress}</code>
          </div>
          <div className="text-xs">
            <span className="text-slate-500">Calldata: </span>
            <code className="text-emerald-700 break-all">{registration.calldata}</code>
          </div>
        </div>
      )}

      {identity && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-emerald-800">
              Verified ERC-8004 Agent #{identity.agentId}
            </div>
            {onVerified && (
              <span className="text-xs text-slate-500">Available for new jobs in this session</span>
            )}
          </div>
          <div className="grid md:grid-cols-2 gap-2 text-xs">
            <div className="min-w-0">
              <span className="text-slate-500">Owner: </span>
              <code className="block text-sky-700 truncate" title={identity.ownerAddress}>
                {identity.ownerAddress}
              </code>
            </div>
            <div className="min-w-0">
              <span className="text-slate-500">Metadata: </span>
              <code className="block text-sky-700 truncate" title={identity.metadataURI}>
                {identity.metadataURI}
              </code>
            </div>
          </div>
          {checks && (
            <div className="flex flex-wrap gap-2 text-xs">
              {checks.ownerMatches !== undefined && (
                <span
                  className={`px-2 py-1 rounded border ${
                    checks.ownerMatches
                      ? "border-emerald-300 text-emerald-800"
                      : "border-red-300 text-red-700"
                  }`}
                >
                  Owner match: {checks.ownerMatches ? "yes" : "no"}
                </span>
              )}
              {checks.metadataMatches !== undefined && (
                <span
                  className={`px-2 py-1 rounded border ${
                    checks.metadataMatches
                      ? "border-emerald-300 text-emerald-800"
                      : "border-red-300 text-red-700"
                  }`}
                >
                  Metadata match: {checks.metadataMatches ? "yes" : "no"}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {!compact && (
        <p className="text-xs text-slate-500">
          This page does not create wallets or submit transactions. Live registration still requires
          a wallet/Circle flow. The verifier only marks an identity as proven after Arc Testnet
          contract reads succeed.
        </p>
      )}
    </section>
  );
}
