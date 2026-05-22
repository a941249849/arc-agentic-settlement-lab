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
    <section className="rounded-xl border border-blue-800 bg-blue-950/20 p-5 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-white">ERC-8004 Agent Identity</h2>
          <p className="text-xs text-gray-400 mt-1">
            Prepare `register(string)` calldata, then verify an existing Arc Testnet agent by
            reading `ownerOf` and `tokenURI` from IdentityRegistry.
          </p>
        </div>
        {!compact && (
          <span className="px-2 py-1 rounded text-xs bg-blue-900/60 text-blue-300 border border-blue-700 whitespace-nowrap">
            Identity proof
          </span>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <label className="block space-y-1">
            <span className="text-xs text-gray-400">Metadata URI</span>
            <input
              value={metadataURI}
              onChange={(e) => setMetadataURI(e.target.value)}
              className="w-full px-3 py-2 rounded bg-gray-900 border border-gray-700 text-white text-sm font-mono focus:outline-none focus:border-blue-500"
            />
          </label>
          <button
            onClick={prepare}
            disabled={loading === "prepare"}
            className="px-4 py-2 rounded bg-blue-700 text-white text-sm font-semibold hover:bg-blue-600 disabled:opacity-50"
          >
            {loading === "prepare" ? "Preparing..." : "Prepare Register Calldata"}
          </button>
        </div>

        <div className="space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
            <label className="block space-y-1">
              <span className="text-xs text-gray-400">Agent ID</span>
              <input
                value={agentId}
                onChange={(e) => setAgentId(e.target.value)}
                placeholder="e.g. 12"
                className="w-full px-3 py-2 rounded bg-gray-900 border border-gray-700 text-white text-sm font-mono focus:outline-none focus:border-blue-500"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-gray-400">Expected owner</span>
              <input
                value={expectedOwnerAddress}
                onChange={(e) => setExpectedOwnerAddress(e.target.value)}
                placeholder="0x..."
                className="w-full px-3 py-2 rounded bg-gray-900 border border-gray-700 text-white text-sm font-mono focus:outline-none focus:border-blue-500"
              />
            </label>
          </div>
          <label className="block space-y-1">
            <span className="text-xs text-gray-400">Register tx hash</span>
            <input
              value={registerTxHash}
              onChange={(e) => setRegisterTxHash(e.target.value)}
              placeholder="0x... optional"
              className="w-full px-3 py-2 rounded bg-gray-900 border border-gray-700 text-white text-sm font-mono focus:outline-none focus:border-blue-500"
            />
          </label>
          <label className="flex items-center gap-2 text-xs text-gray-400">
            <input
              type="checkbox"
              checked={compareMetadata}
              onChange={(e) => setCompareMetadata(e.target.checked)}
              className="accent-blue-600"
            />
            Compare metadata URI during verification
          </label>
          <button
            onClick={verify}
            disabled={loading === "verify"}
            className="px-4 py-2 rounded bg-green-800 text-green-100 text-sm font-semibold hover:bg-green-700 disabled:opacity-50"
          >
            {loading === "verify" ? "Verifying..." : "Verify Agent Onchain"}
          </button>
        </div>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      {registration && (
        <div className="rounded-lg border border-gray-700 bg-gray-900 p-4 space-y-2">
          <div className="text-sm font-semibold text-white">Registration Call</div>
          <div className="grid md:grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-gray-500">Network: </span>
              <span className="text-white">
                {registration.network} ({registration.chainId})
              </span>
            </div>
            <div>
              <span className="text-gray-500">Function: </span>
              <code className="text-blue-300">{registration.abiFunctionSignature}</code>
            </div>
          </div>
          <div className="text-xs">
            <span className="text-gray-500">Contract: </span>
            <code className="text-blue-300 break-all">{registration.contractAddress}</code>
          </div>
          <div className="text-xs">
            <span className="text-gray-500">Calldata: </span>
            <code className="text-green-300 break-all">{registration.calldata}</code>
          </div>
        </div>
      )}

      {identity && (
        <div className="rounded-lg border border-green-800 bg-green-950/20 p-4 space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-green-300">
              Verified ERC-8004 Agent #{identity.agentId}
            </div>
            {onVerified && (
              <span className="text-xs text-gray-500">Available for new jobs in this session</span>
            )}
          </div>
          <div className="grid md:grid-cols-2 gap-2 text-xs">
            <div className="min-w-0">
              <span className="text-gray-500">Owner: </span>
              <code className="block text-blue-300 truncate" title={identity.ownerAddress}>
                {identity.ownerAddress}
              </code>
            </div>
            <div className="min-w-0">
              <span className="text-gray-500">Metadata: </span>
              <code className="block text-blue-300 truncate" title={identity.metadataURI}>
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
                      ? "border-green-700 text-green-300"
                      : "border-red-700 text-red-300"
                  }`}
                >
                  Owner match: {checks.ownerMatches ? "yes" : "no"}
                </span>
              )}
              {checks.metadataMatches !== undefined && (
                <span
                  className={`px-2 py-1 rounded border ${
                    checks.metadataMatches
                      ? "border-green-700 text-green-300"
                      : "border-red-700 text-red-300"
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
        <p className="text-xs text-gray-500">
          This page does not create wallets or submit transactions. Live registration still requires
          a wallet/Circle flow. The verifier only marks an identity as proven after Arc Testnet
          contract reads succeed.
        </p>
      )}
    </section>
  );
}
