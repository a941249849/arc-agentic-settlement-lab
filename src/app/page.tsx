import Link from "next/link";
import { arcSettlementBlueprint } from "@/lib/arc-blueprint";

const FLOW = [
  ["Buyer agent", "opens a settlement request"],
  ["Supplier agent", "sets budget and submits proof"],
  ["USDC escrow", "locks value on Arc Testnet"],
  ["Evaluator", "approves completion"],
  ["Receipt", "exports business and tx evidence"],
];

const DIFFERENCES = [
  ["Payment app", "Optimizes for balance, send, receive, checkout, or invoice links."],
  ["This workspace", "Optimizes for trade context, agent roles, escrow lifecycle, delivery proof, and audit receipts."],
];

export default function OverviewPage() {
  const blueprint = arcSettlementBlueprint;

  return (
    <div className="min-h-screen bg-[#f7f9f8] px-4 py-10 text-slate-950">
      <div className="mx-auto max-w-6xl space-y-10">
        <section className="grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div>
            <div className="inline-flex rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
              Arc Testnet · USDC settlement · Agentic commerce
            </div>
            <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight md:text-5xl">
              A settlement workspace for AI-agent trade workflows.
            </h1>
            <p className="mt-4 max-w-2xl text-base text-slate-600">
              Create a cross-border trade request, lock USDC in escrow, attach delivery evidence,
              complete evaluator approval, and export a receipt with every Arc transaction hash.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/jobs"
                className="rounded-lg bg-slate-950 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Open workspace
              </Link>
              <Link
                href="/identity"
                className="rounded-lg border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Verify agent identity
              </Link>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-sm font-semibold text-slate-950">One settlement lifecycle</div>
            <div className="mt-4 space-y-3">
              {FLOW.map(([title, detail], index) => (
                <div key={title} className="grid grid-cols-[32px_1fr] gap-3">
                  <div className="h-8 w-8 rounded-lg bg-slate-950 text-xs font-semibold text-white flex items-center justify-center">
                    {index + 1}
                  </div>
                  <div className="border-b border-slate-100 pb-3">
                    <div className="text-sm font-semibold text-slate-950">{title}</div>
                    <div className="text-xs text-slate-500">{detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {[
            ["USDC-native rail", "Arc uses stablecoin-native fees and deterministic settlement for finance workflows."],
            ["Agent roles", "Buyer, supplier, and evaluator are tracked separately instead of collapsing into one transfer."],
            ["Portable evidence", "Receipts bind invoice context, lifecycle status, delivery proof, and tx hashes."],
          ].map(([title, detail]) => (
            <div key={title} className="rounded-lg border border-slate-200 bg-white p-5">
              <div className="text-sm font-semibold text-slate-950">{title}</div>
              <p className="mt-2 text-sm text-slate-500">{detail}</p>
            </div>
          ))}
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="text-lg font-semibold text-slate-950">How it differs from a normal transfer</div>
          <div className="mt-4 divide-y divide-slate-100">
            {DIFFERENCES.map(([label, value]) => (
              <div key={label} className="grid gap-2 py-3 text-sm md:grid-cols-[180px_1fr]">
                <div className="font-semibold text-slate-950">{label}</div>
                <div className="text-slate-500">{value}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="text-sm font-semibold text-slate-950">AgenticCommerce contract</div>
            <code className="mt-2 block break-all text-xs text-emerald-700">
              {blueprint.contracts.agenticCommerce}
            </code>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="text-sm font-semibold text-slate-950">IdentityRegistry contract</div>
            <code className="mt-2 block break-all text-xs text-sky-700">
              {blueprint.contracts.identityRegistry}
            </code>
          </div>
        </section>
      </div>
    </div>
  );
}
