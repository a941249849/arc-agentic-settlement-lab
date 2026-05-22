import Link from "next/link";
import { arcSettlementBlueprint } from "@/lib/arc-blueprint";

const HOW_TO_USE = [
  {
    title: "1. Verify an agent",
    body: "Read an existing ERC-8004 identity from Arc Testnet so the service provider is not just a random address.",
  },
  {
    title: "2. Create a service job",
    body: "Describe what the buyer agent wants to purchase: a report, dataset, API result, model response, or other service.",
  },
  {
    title: "3. Move funds through escrow",
    body: "Use the ERC-8183 lifecycle: set budget, approve USDC, fund escrow, submit work, and complete settlement.",
  },
  {
    title: "4. Export the receipt",
    body: "Generate a receipt that binds the buyer, provider, amount, deliverable hash, agent identity, and tx evidence.",
  },
];

const FLOW = [
  ["Buyer agent", "Creates a purchase request"],
  ["Provider", "Accepts work and sets budget"],
  ["USDC escrow", "Locks settlement funds"],
  ["Deliverable", "Stores proof of completed work"],
  ["Evaluator", "Approves release"],
  ["Receipt", "Exports audit evidence"],
];

const DIFFERENCES = [
  ["Plain transfer", "Sends tokens from A to B with little business context."],
  ["This app", "Tracks who the agent is, what was bought, budget approval, escrow state, deliverable proof, and receipt evidence."],
];

const STATUS = [
  ["Ready to try", "Create service jobs, verify agent identity, prepare Arc Testnet wallet transactions, and export receipts."],
  ["Onchain evidence", "A job becomes fully verified only after all lifecycle transaction hashes are recorded."],
  ["Planned rails", "Circle Wallets, Gateway / Nanopayments, CCTP, USYC, and StableFX are integration targets."],
];

export default function OverviewPage() {
  const blueprint = arcSettlementBlueprint;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-12">
      <section className="grid lg:grid-cols-[1fr_0.9fr] gap-8 items-center">
        <div className="space-y-5">
          <div className="inline-flex flex-wrap items-center gap-2 px-3 py-1 rounded-full bg-blue-900/40 border border-blue-700 text-blue-300 text-sm">
            Arc Testnet · USDC · Agent service settlement
          </div>
          <div className="space-y-3">
            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
              Agent payments with context, escrow, and proof.
            </h1>
            <p className="text-lg text-gray-400 max-w-2xl">
              This app is a testnet workflow for agent-paid services. A buyer agent requests work,
              a provider sets a budget, USDC moves through escrow, the deliverable is recorded, and
              the final receipt shows the business context behind the payment.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/jobs"
              className="px-5 py-2 rounded-lg bg-blue-700 text-white hover:bg-blue-600 transition-colors font-semibold"
            >
              Try the workflow
            </Link>
            <Link
              href="/identity"
              className="px-5 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-800 transition-colors"
            >
              Verify agent identity
            </Link>
          </div>
        </div>

        <div className="rounded-xl border border-gray-800 bg-gray-950 p-5">
          <div className="text-sm font-semibold text-white mb-4">What happens in one payment</div>
          <div className="space-y-3">
            {FLOW.map(([title, desc], index) => (
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
          <h2 className="text-xl font-semibold text-white">What this is for</h2>
          <p className="text-sm text-gray-400 mt-1">
            The goal is to make agent payments understandable and auditable. Instead of only asking
            whether money moved, the app records who acted, what was purchased, what budget was
            approved, what was delivered, and what evidence proves settlement.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            ["For users", "Understand what an agent paid for before trusting the payment result."],
            ["For providers", "Submit work with a deliverable hash and receive settlement after approval."],
            ["For builders", "Test Arc identity, escrow lifecycle, and receipt patterns before adding production wallet rails."],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-gray-800 bg-gray-900 p-4">
              <div className="text-sm font-semibold text-white">{label}</div>
              <p className="text-xs text-gray-500 mt-2">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">How to use it</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
          {HOW_TO_USE.map((step) => (
            <div key={step.title} className="rounded-lg border border-gray-800 bg-gray-900 p-4">
              <div className="text-sm font-semibold text-white">{step.title}</div>
              <p className="text-xs text-gray-500 mt-2">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">How this differs from a normal transfer</h2>
        <div className="rounded-lg border border-gray-800 bg-gray-900 divide-y divide-gray-800">
          {DIFFERENCES.map(([label, value]) => (
            <div key={label} className="grid md:grid-cols-[0.4fr_1.6fr] gap-3 p-4 text-sm">
              <div className="font-semibold text-gray-300">{label}</div>
              <div className="text-gray-500">{value}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">What is implemented now</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="rounded-lg border border-blue-800 bg-blue-950/30 p-4 space-y-2">
            <div className="text-blue-300 font-semibold text-sm">Agent identity</div>
            <p className="text-xs text-gray-400">
              Reads ERC-8004 IdentityRegistry state from Arc Testnet.
            </p>
            <code className="block text-[11px] text-blue-300 break-all">
              {blueprint.contracts.identityRegistry}
            </code>
          </div>
          <div className="rounded-lg border border-green-800 bg-green-950/30 p-4 space-y-2">
            <div className="text-green-300 font-semibold text-sm">Service settlement</div>
            <p className="text-xs text-gray-400">
              Prepares ERC-8183 job lifecycle calls for connected wallet confirmation.
            </p>
            <code className="block text-[11px] text-green-300 break-all">
              {blueprint.contracts.agenticCommerce}
            </code>
          </div>
          <div className="rounded-lg border border-purple-800 bg-purple-950/30 p-4 space-y-2">
            <div className="text-purple-300 font-semibold text-sm">Receipt evidence</div>
            <p className="text-xs text-gray-400">
              Exports JSON and Markdown receipts with receipt hash, deliverable hash, identity,
              lifecycle status, and transaction slots.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Current status</h2>
        <div className="grid md:grid-cols-3 gap-3">
          {STATUS.map(([label, value]) => (
            <div key={label} className="rounded-lg border border-gray-800 bg-gray-900 p-4">
              <div className="text-sm font-semibold text-white">{label}</div>
              <p className="text-xs text-gray-500 mt-2">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-yellow-900/50 bg-yellow-950/20 p-4 text-xs text-yellow-200/70 space-y-1">
        <div className="font-semibold text-yellow-300">Testnet boundary</div>
        <ul className="list-disc list-inside space-y-0.5 text-yellow-200/60">
          <li>This is not a production payment system.</li>
          <li>Only mark a job as onchain verified after every required Arc Testnet tx hash is present.</li>
          <li>Circle Wallets, Gateway, Nanopayments, CCTP, USYC, and StableFX are future integrations unless explicitly added and verified.</li>
        </ul>
      </section>
    </div>
  );
}
