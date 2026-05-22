import Link from "next/link";
import { arcSettlementBlueprint } from "@/lib/arc-blueprint";

const LIFECYCLE_STEPS = [
  {
    status: "draft",
    label: "Request",
    desc: "Buyer agent defines the service, data, report, API call, or task to purchase.",
  },
  {
    status: "open",
    label: "Accept",
    desc: "Provider accepts terms and prepares a budgeted settlement path.",
  },
  {
    status: "budgeted",
    label: "Budget",
    desc: "Provider calls setBudget before the buyer funds escrow.",
  },
  {
    status: "funded",
    label: "Escrow",
    desc: "USDC is approved and escrow funding tx evidence can be attached.",
  },
  {
    status: "submitted",
    label: "Deliver",
    desc: "Provider submits a deliverable hash for evaluator review.",
  },
  {
    status: "settled",
    label: "Settle",
    desc: "Evaluator approval releases payment and produces an auditable receipt.",
  },
];

const STACK = [
  {
    name: "USDC on Arc",
    status: "implemented",
    detail: "Primary settlement and gas-denominated rail for the MVP.",
  },
  {
    name: "ERC-8004 identity",
    status: "implemented",
    detail: "Reads IdentityRegistry owner and metadata from Arc Testnet.",
  },
  {
    name: "ERC-8183 job escrow",
    status: "implemented",
    detail: "Wallet-submitted createJob, setBudget, approve, fund, submit, complete.",
  },
  {
    name: "Circle Wallets",
    status: "next",
    detail: "Target path for agent-controlled treasury and non-crypto-native UX.",
  },
  {
    name: "Gateway / Nanopayments",
    status: "next",
    detail: "Target path for pay-per-report, paid API, and pay-per-inference access.",
  },
  {
    name: "CCTP / Bridge Kit",
    status: "optional",
    detail: "Relevant when the buyer funds from another chain or treasury account.",
  },
];

const STATUS_CLASS: Record<string, string> = {
  implemented: "border-green-700 bg-green-950/30 text-green-200",
  next: "border-blue-700 bg-blue-950/30 text-blue-200",
  optional: "border-gray-700 bg-gray-900 text-gray-300",
};

export default function OverviewPage() {
  const blueprint = arcSettlementBlueprint;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-12">
      <section className="grid lg:grid-cols-[1fr_0.9fr] gap-8 items-center">
        <div className="space-y-5">
          <div className="inline-flex flex-wrap items-center gap-2 px-3 py-1 rounded-full bg-blue-900/40 border border-blue-700 text-blue-300 text-sm">
            <span>The Stablecoins Commerce Stack Challenge</span>
            <span className="text-blue-600">/</span>
            <span>Agentic Economy Track</span>
          </div>
          <div className="space-y-3">
            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
              Agentic commerce settlement on Arc
            </h1>
            <p className="text-lg text-gray-400 max-w-2xl">
              A stablecoin commerce MVP where a buyer agent purchases a service, verifies agent
              identity, controls budget, funds USDC escrow, records deliverable evidence, and
              exports an auditable settlement receipt.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/jobs"
              className="px-5 py-2 rounded-lg bg-blue-700 text-white hover:bg-blue-600 transition-colors font-semibold"
            >
              Open Commerce Console
            </Link>
            <Link
              href="/challenge"
              className="px-5 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-800 transition-colors"
            >
              View Challenge Pack
            </Link>
            <a
              href="/api/arc-settlement"
              target="_blank"
              className="px-5 py-2 rounded-lg border border-gray-700 text-gray-400 hover:bg-gray-800 transition-colors"
            >
              API Blueprint
            </a>
          </div>
        </div>

        <div className="rounded-xl border border-gray-800 bg-gray-950 p-5">
          <div className="text-sm font-semibold text-white mb-4">Commerce stack flow</div>
          <div className="space-y-3">
            {[
              ["Buyer agent", "Defines task and budget"],
              ["Arc identity", "ERC-8004 verification"],
              ["USDC escrow", "ERC-8183 lifecycle"],
              ["Provider", "Submits deliverable proof"],
              ["Evaluator", "Approves settlement"],
              ["Receipt", "Portable audit trail"],
            ].map(([title, desc], index) => (
              <div key={title} className="flex items-center gap-3">
                <div className="h-8 w-8 shrink-0 rounded-full border border-blue-700 bg-blue-950 text-blue-200 flex items-center justify-center text-xs font-semibold">
                  {index + 1}
                </div>
                <div className="min-w-0 rounded-lg border border-gray-800 bg-gray-900 px-3 py-2 flex-1">
                  <div className="text-sm font-semibold text-white">{title}</div>
                  <div className="text-xs text-gray-500">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Why this matches the challenge</h2>
          <p className="text-sm text-gray-400 mt-1">
            The project targets the Agentic Economy track while staying close to the stablecoin
            commerce requirement: a functional frontend, backend APIs, Arc Testnet execution
            controls, and clear Circle product feedback.
          </p>
        </div>
        <div className="grid md:grid-cols-4 gap-4">
          {[
            ["Track", "Agentic Economy Experience on Arc"],
            ["Use case", "AI agent buys reports, APIs, data, or services"],
            ["Settlement", "USDC escrow with tx evidence and receipts"],
            ["Review angle", "Budget control, auditability, and developer feedback"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-gray-800 bg-gray-900 p-4">
              <div className="text-xs uppercase text-gray-500">{label}</div>
              <div className="text-sm font-semibold text-white mt-1">{value}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Stablecoin Commerce Stack</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {STACK.map((item) => (
            <div key={item.name} className={`rounded-lg border p-4 ${STATUS_CLASS[item.status]}`}>
              <div className="flex items-center justify-between gap-3">
                <div className="font-semibold text-sm">{item.name}</div>
                <div className="text-[11px] uppercase tracking-wide opacity-70">{item.status}</div>
              </div>
              <p className="text-xs opacity-80 mt-2">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Agentic Settlement Lifecycle</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {LIFECYCLE_STEPS.map((step, index) => (
            <div key={step.status} className="rounded-lg border border-gray-800 bg-gray-900 p-4">
              <div className="flex items-center gap-3">
                <span className="h-7 w-7 rounded bg-blue-950 border border-blue-800 text-blue-200 flex items-center justify-center text-xs font-semibold">
                  {index + 1}
                </span>
                <div className="text-sm font-semibold text-white">{step.label}</div>
              </div>
              <p className="text-xs text-gray-500 mt-3">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Implemented Arc Primitives</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="rounded-lg border border-blue-800 bg-blue-950/30 p-4 space-y-2">
            <div className="text-blue-300 font-semibold text-sm">ERC-8004 Agent Identity</div>
            <p className="text-xs text-gray-400">
              Verifies existing agent identity by reading Arc Testnet IdentityRegistry state.
            </p>
            <code className="block text-[11px] text-blue-300 break-all">
              {blueprint.contracts.identityRegistry}
            </code>
          </div>
          <div className="rounded-lg border border-green-800 bg-green-950/30 p-4 space-y-2">
            <div className="text-green-300 font-semibold text-sm">ERC-8183 AgenticCommerce</div>
            <p className="text-xs text-gray-400">
              Prepares wallet-submitted lifecycle calls and parses tx evidence after submission.
            </p>
            <code className="block text-[11px] text-green-300 break-all">
              {blueprint.contracts.agenticCommerce}
            </code>
          </div>
          <div className="rounded-lg border border-purple-800 bg-purple-950/30 p-4 space-y-2">
            <div className="text-purple-300 font-semibold text-sm">Circle Stack Path</div>
            <p className="text-xs text-gray-400">
              Circle Wallets, Gateway, Nanopayments, CCTP, and StableFX are documented as the next
              integration layer. The MVP does not overclaim gated product access.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-yellow-900/50 bg-yellow-950/20 p-4 text-xs text-yellow-200/70 space-y-1">
        <div className="font-semibold text-yellow-300">Current boundary</div>
        <ul className="list-disc list-inside space-y-0.5 text-yellow-200/60">
          <li>Arc Testnet ERC-8004 identity reads and ERC-8183 wallet execution controls are implemented.</li>
          <li>Jobs can remain simulated or become onchain-partial / onchain-verified only with tx hashes.</li>
          <li>Circle Wallets, Gateway, Nanopayments, CCTP, USYC, and StableFX are not falsely marked live.</li>
          <li>The strongest next gate is a real end-to-end Arc Testnet run and demo recording.</li>
        </ul>
      </section>
    </div>
  );
}
