import Link from "next/link";
import { arcSettlementBlueprint } from "@/lib/arc-blueprint";

const FLOW = [
  ["Create the deal", "buyer, supplier, amount, route, and release condition"],
  ["Lock USDC", "Arc escrow holds funds before the supplier is paid"],
  ["Submit proof", "delivery evidence is attached to the settlement"],
  ["Run evaluator", "the release agent approves or rejects payment"],
  ["Export receipt", "business context and Arc evidence are bound together"],
];

const DIFFERENCES = [
  ["Normal transfer", "A wallet sends tokens to another address. It proves movement, not the business reason."],
  ["This product", "USDC is locked first, proof is required, an evaluator decision gates release, and the receipt keeps the evidence."],
];

export default function OverviewPage() {
  const blueprint = arcSettlementBlueprint;

  return (
    <div className="min-h-screen bg-[#030712] px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-6xl space-y-10">
        <section className="grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div>
            <div className="inline-flex rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-sm font-semibold text-emerald-450">
              ArcEscrow · Agentic Letter of Credit · Arc Testnet
            </div>
            <h1 className="mt-5 max-w-3xl text-4xl font-bold tracking-tight text-slate-100 md:text-5xl leading-tight">
              Programmatic letters of credit for cross-border SME trade.
            </h1>
            <p className="mt-4 max-w-2xl text-base text-slate-400 leading-relaxed">
              ArcEscrow replaces slow bank L/C workflows with USDC escrow on Arc. Buyers lock funds,
              suppliers submit delivery proof, evaluator agents verify release conditions, and finance teams
              export auditable settlement receipts.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/jobs"
                className="rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-500 transition-colors shadow-lg shadow-sky-500/10 cursor-pointer"
              >
                Open deal room
              </Link>
              <Link
                href="/identity"
                className="rounded-lg border border-slate-800 bg-slate-900 px-5 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Verify agent proof
              </Link>
            </div>
          </div>

          <div className="glass-panel rounded-xl p-6 shadow-xl">
            <div className="text-sm font-semibold text-slate-100">One settlement lifecycle</div>
            <div className="mt-4 space-y-3">
              {FLOW.map(([title, detail], index) => (
                <div key={title} className="grid grid-cols-[32px_1fr] gap-3">
                  <div className="h-8 w-8 rounded-lg bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-200 flex items-center justify-center">
                    {index + 1}
                  </div>
                  <div className="border-b border-slate-900 pb-3">
                    <div className="text-sm font-semibold text-slate-250">{title}</div>
                    <div className="text-xs text-slate-450 mt-0.5">{detail}</div>
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
            <div key={title} className="glass-panel rounded-xl p-5">
              <div className="text-sm font-semibold text-slate-100">{title}</div>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">{detail}</p>
            </div>
          ))}
        </section>

        <section className="glass-panel rounded-xl p-5">
          <div className="text-lg font-semibold text-slate-100">Why this is not a normal transfer</div>
          <div className="mt-4 divide-y divide-slate-900">
            {DIFFERENCES.map(([label, value]) => (
              <div key={label} className="grid gap-2 py-3 text-sm md:grid-cols-[180px_1fr]">
                <div className="font-semibold text-slate-200">{label}</div>
                <div className="text-slate-400">{value}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="glass-panel rounded-xl p-5">
            <div className="text-sm font-semibold text-slate-100">AgenticCommerce escrow contract</div>
            <code className="mt-2 block break-all text-xs text-sky-400 font-mono">
              {blueprint.contracts.agenticCommerce}
            </code>
          </div>
          <div className="glass-panel rounded-xl p-5">
            <div className="text-sm font-semibold text-slate-100">IdentityRegistry contract</div>
            <code className="mt-2 block break-all text-xs text-sky-400 font-mono">
              {blueprint.contracts.identityRegistry}
            </code>
          </div>
        </section>
      </div>
    </div>
  );
}
