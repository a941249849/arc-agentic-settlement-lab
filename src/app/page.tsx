// Overview page – Arc Agentic Settlement Lab
// Server component: fetches blueprint data at render time.

import Link from "next/link";
import type { ArcSettlementBlueprint } from "@/lib/types";

async function getBlueprint(): Promise<ArcSettlementBlueprint> {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const res = await fetch(`${base}/api/arc-settlement`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to load blueprint: HTTP ${res.status}`);
  }
  return res.json();
}

const LIFECYCLE_STEPS = [
  {
    status: "draft",
    icon: "✏️",
    label: "Draft",
    desc: "Job record created offchain. Parties set: client, provider, evaluator.",
  },
  {
    status: "open",
    icon: "📋",
    label: "Open",
    desc: "Job posted. Provider accepted terms. Awaiting funding.",
  },
  {
    status: "funded",
    icon: "💰",
    label: "Funded",
    desc: "USDC escrow deposited. Phase 3+: real AgenticCommerce fundJob() tx.",
  },
  {
    status: "submitted",
    icon: "📦",
    label: "Submitted",
    desc: "Provider submitted deliverable hash. Evaluator reviewing.",
  },
  {
    status: "settled",
    icon: "✅",
    label: "Settled",
    desc: "Evaluator approved. Provider paid. Settlement receipt generated.",
  },
  {
    status: "failed",
    icon: "❌",
    label: "Failed",
    desc: "Any party triggered failure. Funds returned (Phase 3+).",
  },
];

const CAPABILITY_COLORS: Record<string, string> = {
  implemented: "bg-green-900/40 border-green-700 text-green-300",
  blueprint: "bg-blue-900/40 border-blue-700 text-blue-300",
  future: "bg-gray-800/40 border-gray-700 text-gray-400",
};
const CAPABILITY_LABELS: Record<string, string> = {
  implemented: "✅ Implemented",
  blueprint: "🔷 Blueprint",
  future: "🔘 Future",
};

export default async function OverviewPage() {
  const blueprint = await getBlueprint();

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-12">
      {/* Hero */}
      <section className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/40 border border-blue-700 text-blue-300 text-sm">
          <span>🔵 Simulated</span>
          <span className="text-blue-600">·</span>
          <span>Phase 1/2 – Offchain Lifecycle</span>
        </div>
        <h1 className="text-4xl font-bold text-white">Arc Agentic Settlement Lab</h1>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto">
          Agent-native financial workflow on Arc: verifiable job creation, USDC escrow,
          deliverable proof, evaluator approval, and deterministic settlement receipt.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap text-sm">
          <Link
            href="/jobs"
            className="px-5 py-2 rounded-lg bg-blue-700 text-white hover:bg-blue-600 transition-colors font-semibold"
          >
            Open Job Console →
          </Link>
          <a
            href="/api/arc-settlement"
            target="_blank"
            className="px-5 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-800 transition-colors"
          >
            API Blueprint ↗
          </a>
        </div>
      </section>

      {/* Lifecycle */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">ERC-8183 Job Lifecycle</h2>
        <p className="text-sm text-gray-400">
          Mirrors the Arc AgenticCommerce standard. Phase 1/2 is fully offchain (simulated).
          Phase 3 adds live Arc Testnet execution.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {LIFECYCLE_STEPS.map((step) => (
            <div
              key={step.status}
              className="rounded-lg border border-gray-700 bg-gray-900 p-3 text-center space-y-1"
            >
              <div className="text-2xl">{step.icon}</div>
              <div className="text-xs font-semibold text-white">{step.label}</div>
              <div className="text-xs text-gray-500">{step.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Capability matrix */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Capability Matrix</h2>
        <div className="grid md:grid-cols-2 gap-3">
          {blueprint.capabilities.map((cap) => (
            <div
              key={cap.name}
              className={`rounded-lg border p-4 space-y-1 ${CAPABILITY_COLORS[cap.status]}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">{cap.name}</span>
                <span className="text-xs px-2 py-0.5 rounded border border-current/30 bg-black/20">
                  {CAPABILITY_LABELS[cap.status]}
                </span>
              </div>
              <p className="text-xs opacity-80">{cap.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Arc primitive mapping */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Arc Official Primitives</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="rounded-lg border border-blue-800 bg-blue-950/30 p-4 space-y-2">
            <div className="text-blue-300 font-semibold text-sm">ERC-8004 · Agent Identity</div>
            <div className="text-xs text-gray-400 space-y-1">
              <div>
                IdentityRegistry:{" "}
                <code className="text-blue-300">{blueprint.contracts.identityRegistry}</code>
              </div>
              <div>
                ReputationRegistry:{" "}
                <code className="text-blue-300">{blueprint.contracts.reputationRegistry}</code>
              </div>
              <div>
                ValidationRegistry:{" "}
                <code className="text-blue-300">{blueprint.contracts.validationRegistry}</code>
              </div>
            </div>
            <div className="text-xs text-blue-500">🔷 Blueprint – Phase 4</div>
          </div>

          <div className="rounded-lg border border-green-800 bg-green-950/30 p-4 space-y-2">
            <div className="text-green-300 font-semibold text-sm">ERC-8183 · Job Lifecycle</div>
            <div className="text-xs text-gray-400 space-y-1">
              <div>
                AgenticCommerce:{" "}
                <code className="text-green-300">{blueprint.contracts.agenticCommerce}</code>
              </div>
              <div>
                USDC (native gas):{" "}
                <code className="text-green-300">{blueprint.contracts.usdc}</code>
              </div>
            </div>
            <div className="text-xs text-green-600">
              ✅ Offchain simulation implemented · Phase 3 = live
            </div>
          </div>

          <div className="rounded-lg border border-purple-800 bg-purple-950/30 p-4 space-y-2">
            <div className="text-purple-300 font-semibold text-sm">App Kit · Funding Path</div>
            <div className="text-xs text-gray-400 space-y-1">
              <div>
                GatewayWallet:{" "}
                <code className="text-purple-300">{blueprint.contracts.gatewayWallet}</code>
              </div>
              <div>
                GatewayMinter:{" "}
                <code className="text-purple-300">{blueprint.contracts.gatewayMinter}</code>
              </div>
              <div>Capabilities: bridge · send · swap · unified-balance</div>
            </div>
            <div className="text-xs text-purple-500">🔷 Blueprint – Phase 5</div>
          </div>
        </div>
      </section>

      {/* Settlement flow narrative */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Settlement Flow</h2>
        <div className="rounded-lg border border-gray-700 bg-gray-900 p-6">
          <div className="flex flex-wrap gap-2 items-center text-sm text-gray-300">
            {[
              "Agent identity (ERC-8004)",
              "→",
              "Job creation",
              "→",
              "USDC escrow",
              "→",
              "Deliverable proof",
              "→",
              "Evaluator approval",
              "→",
              "Settlement receipt",
            ].map((item, i) => (
              <span
                key={i}
                className={
                  item === "→"
                    ? "text-gray-600"
                    : "px-2 py-1 rounded bg-gray-800 text-white text-xs font-mono"
                }
              >
                {item}
              </span>
            ))}
          </div>
        </div>
        <p className="text-sm text-gray-500">
          This workflow is Arc-specific: it requires agent identity, on-chain escrow, verifiable
          deliverables, and a deterministic settlement receipt. It is not a generic USDC transfer
          demo.
        </p>
      </section>

      {/* Network info */}
      <section className="grid md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-gray-700 bg-gray-900 p-4 space-y-2">
          <div className="text-sm font-semibold text-white">Network</div>
          <div className="text-xs text-gray-400 space-y-1">
            <div>
              Chain: <span className="text-white">Arc Testnet</span>
            </div>
            <div>
              Gas token: <span className="text-white">USDC (native)</span>
            </div>
            <div>
              RPC:{" "}
              <code className="text-blue-300">https://rpc.testnet.arc.network</code>
            </div>
            <div>
              Explorer:{" "}
              <a
                href="https://testnet.arcscan.app"
                className="text-blue-400 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                testnet.arcscan.app ↗
              </a>
            </div>
            <div>
              Faucet:{" "}
              <a
                href="https://faucet.circle.com"
                className="text-blue-400 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                faucet.circle.com ↗
              </a>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-700 bg-gray-900 p-4 space-y-2">
          <div className="text-sm font-semibold text-white">Phase Roadmap</div>
          <div className="text-xs space-y-1">
            {[
              { phase: "Phase 1/2", label: "Product shell + offchain lifecycle", done: true },
              { phase: "Phase 3", label: "Arc Testnet ERC-8183 execution", done: false },
              { phase: "Phase 4", label: "ERC-8004 agent identity", done: false },
              { phase: "Phase 5", label: "Agent Stack, wallet policy, and App Kit funding", done: false },
              { phase: "Phase 6", label: "StableFX / QCAD multi-currency", done: false },
            ].map((r) => (
              <div key={r.phase} className="flex items-center gap-2">
                <span className={r.done ? "text-green-400" : "text-gray-600"}>
                  {r.done ? "✅" : "○"}
                </span>
                <span className="text-gray-500">{r.phase}:</span>
                <span className={r.done ? "text-white" : "text-gray-500"}>{r.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="rounded-lg border border-yellow-900/50 bg-yellow-950/20 p-4 text-xs text-yellow-200/70 space-y-1">
        <div className="font-semibold text-yellow-300">⚠️ Phase 1/2 Boundaries</div>
        <ul className="list-disc list-inside space-y-0.5 text-yellow-200/60">
          <li>All jobs are simulated offchain. No real Arc Testnet transactions are executed.</li>
          <li>Settlement receipts are deterministic but not anchored to any blockchain.</li>
          <li>App Kit, Circle Wallets, and ERC-8004 features are blueprint only.</li>
          <li>No secrets, API keys, private keys, or mnemonics are stored or transmitted.</li>
          <li>Not financial advice. Not a production system.</li>
        </ul>
      </section>
    </div>
  );
}
