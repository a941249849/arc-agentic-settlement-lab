import Link from "next/link";
import { arcSettlementBlueprint } from "@/lib/arc-blueprint";

const HOW_TO_USE = [
  {
    title: "1. Create a trade",
    body: "Capture invoice ID, buyer country, supplier country, evaluator, and USDC amount.",
  },
  {
    title: "2. Control funds",
    body: "Provider sets a budget before the buyer funds escrow, matching real SME trade controls.",
  },
  {
    title: "3. Prove delivery",
    body: "Supplier submits a deliverable hash for the invoice document, service result, or trade proof.",
  },
  {
    title: "4. Export evidence",
    body: "Generate a receipt binding trade context, agent identity, escrow state, deliverable hash, and tx evidence.",
  },
];

const FLOW = [
  ["Importer agent", "Creates a trade settlement request"],
  ["Supplier agent", "Accepts terms and sets budget"],
  ["USDC escrow", "Locks settlement funds"],
  ["Trade proof", "Stores invoice or deliverable hash"],
  ["Evaluator", "Approves release"],
  ["Receipt", "Exports audit evidence"],
];

const DIFFERENCES = [
  ["Plain transfer", "Sends tokens from A to B with little invoice, compliance, or delivery context."],
  ["This app", "Tracks importer, supplier, country route, invoice ID, budget approval, escrow state, deliverable proof, and receipt evidence."],
];

const STATUS = [
  ["Ready to try", "Create trade settlements, verify agent identity, prepare Arc Testnet wallet transactions, and export receipts."],
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
            Arc Testnet · USDC · SME trade settlement
          </div>
          <div className="space-y-3">
            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
              Cross-border trade settlement for AI agents and SMEs.
            </h1>
            <p className="text-lg text-gray-400 max-w-2xl">
              Importer agents can create trade requests, suppliers can set budgets, USDC moves
              through escrow, delivery evidence is recorded, and the receipt explains the business
              context behind the stablecoin payment.
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
          <div className="text-sm font-semibold text-white mb-4">What happens in one trade</div>
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
            The goal is to turn a stablecoin transfer into a business settlement record. Instead of
            only asking whether money moved, the app records who acted, which trade was settled,
            which budget was approved, what was delivered, and what evidence proves settlement.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            ["For SMEs", "Settle cross-border invoices with USDC while retaining invoice and delivery context."],
            ["For suppliers", "Submit trade proof with a deliverable hash and receive settlement after approval."],
            ["For builders", "Test Arc identity, escrow lifecycle, and receipt patterns before adding Circle wallet rails."],
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
            <div className="text-green-300 font-semibold text-sm">Trade settlement</div>
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
