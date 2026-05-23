import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Submission Pack - Arc Trade Agent Settlement",
  description:
    "Submission-oriented overview for an SME cross-border trade settlement product on Arc.",
};

const LIVE_DEMO_URL = "https://arc-agentic-settlement-lab.vercel.app";
const ARCSCAN_URL = "https://testnet.arcscan.app";
const IDENTITY_REGISTRY = "0x8004A818BFB912233c491871b3d84c89A494BD9e";
const AGENTIC_COMMERCE_CONTRACT = "0x0747EEf0706327138c69792bF28Cd525089e4583";

const PRODUCTS = [
  {
    name: "USDC",
    status: "Implemented",
    detail: "Primary settlement asset and Arc Testnet gas-denominated rail.",
  },
  {
    name: "Arc ERC-8004",
    status: "Implemented",
    detail: "Agent identity verification through IdentityRegistry reads.",
  },
  {
    name: "Arc ERC-8183",
    status: "Implemented",
    detail: "Budgeted job lifecycle and wallet-submitted settlement controls.",
  },
  {
    name: "Circle Wallets",
    status: "Next integration",
    detail: "Best path for agent-controlled treasury and non-crypto-native onboarding.",
  },
  {
    name: "Gateway / Nanopayments",
    status: "Next integration",
    detail: "Best path for pay-per-report, API access, and pay-per-inference agent flows.",
  },
  {
    name: "CCTP / Bridge Kit",
    status: "Optional",
    detail: "Useful if the buyer funds from another chain or centralized treasury.",
  },
  {
    name: "USYC / StableFX",
    status: "Gated / conceptual",
    detail: "Documented as optional enterprise extensions, not claimed as live MVP features.",
  },
];

const REQUIREMENTS = [
  ["Title and short description", "Ready in README and challenge pack"],
  ["Track submitted for", "Best Agentic Economy Experience on Arc"],
  ["Circle Developer Account email", "Owner-provided at submission time"],
  ["Circle products used on Arc", "USDC live; Wallets/Gateway/Nanopayments documented as next integration"],
  ["Functional MVP", "Frontend, backend APIs, Arc identity reads, ERC-8183 tx builder, receipts"],
  ["Architecture diagram", "Included below and in docs"],
  ["Video demonstration", "⚠️ Pending — required before final submission"],
  ["Arc Testnet tx evidence", "⚠️ Pending — complete one end-to-end wallet-signed run"],
  ["GitHub repository", "Public repo with setup, boundaries, and docs"],
  ["Demo URL", "Vercel production deployment"],
  ["Circle Product Feedback", "Included on this page and in docs"],
];

const FEEDBACK = [
  {
    title: "Why these products",
    points: [
      "USDC on Arc is the direct settlement unit for invoice-backed cross-border trade.",
      "ERC-8004 gives the agent a verifiable identity before it can receive or execute paid work.",
      "ERC-8183 gives the business process a budgeted escrow lifecycle instead of a plain token transfer.",
      "Circle Wallets and Gateway are the right next layer for policy-controlled agent spending and high-frequency paid access.",
    ],
  },
  {
    title: "What worked well",
    points: [
      "Arc Testnet contract reads make identity proof easy to expose in product UI.",
      "USDC-denominated lifecycle state is easier for users to understand than gas-token abstractions.",
      "The ERC-8183 model maps well to real service procurement: budget, fund, deliver, approve, settle.",
    ],
  },
  {
    title: "What could improve",
    points: [
      "Explorer and RPC behavior should make transaction propagation and receipt availability more predictable for demos.",
      "Circle Wallets, Gateway, and Nanopayments would benefit from a single Arc-focused quickstart that shows a full buyer-agent payment path.",
      "Reference apps should include a receipt/audit pattern, not only the raw escrow or payment transaction.",
    ],
  },
  {
    title: "Recommendations",
    points: [
      "Publish an end-to-end Agentic Economy reference app combining Wallets, Gateway/Nanopayments, ERC-8004, and ERC-8183.",
      "Provide test identities, funded test wallets, and deterministic sample jobs for hackathon teams.",
      "Add a standard settlement receipt schema for stablecoin commerce workflows.",
    ],
  },
];

function StatusPill({ status }: { status: string }) {
  const color = status === "Implemented" ? "text-green-300 border-green-700 bg-green-950/30" : status === "Optional" || status.startsWith("Gated") ? "text-gray-300 border-gray-700 bg-gray-900" : "text-blue-300 border-blue-700 bg-blue-950/30";
  return <span className={`px-2 py-0.5 rounded border text-[11px] ${color}`}>{status}</span>;
}

export default function ChallengePage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-10">
      <section className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/40 border border-blue-700 text-blue-300 text-sm">
          The Stablecoins Commerce Stack Challenge
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-white">
          Submission evidence pack
        </h1>
        <p className="text-gray-400 max-w-3xl">
          This page frames the product across SME trade workflow, cross-border settlement, and
          agentic economy: an importer agent settles a supplier invoice with USDC on Arc, verifies
          agent identity, uses a budgeted ERC-8183 lifecycle, and produces an auditable receipt.
        </p>
        <div className="flex flex-wrap gap-3 pt-1">
          <a
            href={LIVE_DEMO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-1.5 rounded bg-blue-700 text-white text-sm font-semibold hover:bg-blue-600 transition-colors"
          >
            Live Demo ↗
          </a>
          <a
            href={`${LIVE_DEMO_URL}/jobs`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-1.5 rounded border border-gray-600 text-gray-300 text-sm hover:bg-gray-800 transition-colors"
          >
            Deal Room ↗
          </a>
          <a
            href={ARCSCAN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-1.5 rounded border border-gray-700 text-gray-400 text-sm hover:bg-gray-800 transition-colors"
          >
            Arcscan ↗
          </a>
          <a
            href="https://github.com/a941249849/arc-agentic-settlement-lab"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-1.5 rounded border border-gray-700 text-gray-400 text-sm hover:bg-gray-800 transition-colors"
          >
            GitHub ↗
          </a>
        </div>
      </section>

      <section className="rounded-lg border border-amber-800 bg-amber-950/20 p-5 space-y-3">
        <div className="flex items-center gap-3">
          <span className="px-2 py-0.5 rounded border border-amber-600 text-amber-300 text-xs font-semibold">READY WITH CHANGES</span>
          <span className="text-sm font-semibold text-white">Submission verdict</span>
        </div>
        <div className="grid md:grid-cols-2 gap-4 text-xs">
          <div>
            <div className="text-amber-300 font-semibold mb-1">Top blockers before submission</div>
            <ul className="list-disc list-inside text-amber-200/70 space-y-1">
              <li>No live Arc Testnet tx hashes yet — the full ERC-8183 sequence has not been wallet-signed and recorded.</li>
              <li>No demo video. A short screen recording showing the job console flow and identity read is required.</li>
              <li>Circle Wallets, Gateway, Nanopayments, CCTP, USYC, and StableFX are not integrated — these must not be claimed as live.</li>
            </ul>
          </div>
          <div>
            <div className="text-green-300 font-semibold mb-1">Defensible live claims</div>
            <ul className="list-disc list-inside text-green-200/70 space-y-1">
              <li>USDC on Arc — settlement asset and gas rail used throughout the lifecycle.</li>
              <li>ERC-8004 agent identity — <code>ownerOf</code> and <code>tokenURI</code> reads from Arc Testnet IdentityRegistry.</li>
              <li>ERC-8183 lifecycle — calldata preparation for all six lifecycle actions, wallet tx submission, and receipt parsing.</li>
              <li>Deterministic settlement receipt — JSON and Markdown with receipt hash and deliverable hash binding.</li>
            </ul>
          </div>
        </div>
        <div className="text-xs text-amber-200/50">
          Minimum path to <span className="text-green-300 font-semibold">READY</span>: complete one end-to-end wallet-signed run on Arc Testnet and record a short demo video.
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-4">
        {[
          ["Track", "Best Agentic Economy Experience on Arc"],
          ["Business flow", "SME cross-border trade settlement with escrow and audit receipt"],
          ["Submission status", "MVP ready; final tx evidence and demo video pending"],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-gray-800 bg-gray-900 p-4">
            <div className="text-xs uppercase text-gray-500">{label}</div>
            <div className="text-sm font-semibold text-white mt-1">{value}</div>
          </div>
        ))}
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Architecture</h2>
        <div className="grid lg:grid-cols-[1fr_1.2fr] gap-4">
          <div className="rounded-lg border border-gray-800 bg-gray-900 p-4 space-y-3">
            {[
              ["User / business", "Defines service need and authorizes spend"],
              ["Buyer agent", "Creates job, checks budget, routes payment"],
              ["Provider agent", "Accepts work and submits deliverable proof"],
              ["Evaluator", "Approves or rejects settlement"],
              ["Receipt layer", "Exports evidence for audit and review"],
            ].map(([title, body]) => (
              <div key={title} className="rounded border border-gray-800 bg-gray-950 p-3">
                <div className="text-sm font-semibold text-white">{title}</div>
                <div className="text-xs text-gray-500 mt-1">{body}</div>
              </div>
            ))}
          </div>
          <div className="rounded-lg border border-blue-900 bg-blue-950/20 p-4">
            <div className="grid grid-cols-2 gap-3 text-xs">
              {[
                ["Circle / Arc layer", "USDC, Arc Testnet, ERC-8004, ERC-8183"],
                ["Wallet layer", "Injected wallet now; Circle Wallets next"],
                ["Payment layer", "ERC-8183 escrow now; Gateway/Nanopayments next"],
                ["Cross-chain layer", "CCTP / Bridge Kit when external funding is required"],
                ["Enterprise extensions", "USYC cash management and StableFX FX routing"],
                ["Evidence layer", "tx hashes, deliverable hash, receipt hash, identity proof"],
              ].map(([title, body]) => (
                <div key={title} className="rounded-lg border border-blue-900 bg-gray-950/70 p-3">
                  <div className="text-blue-300 font-semibold">{title}</div>
                  <div className="text-gray-400 mt-1">{body}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Products and primitives</h2>
        <div className="grid md:grid-cols-2 gap-3">
          {PRODUCTS.map((product) => (
            <div key={product.name} className="rounded-lg border border-gray-800 bg-gray-900 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="font-semibold text-white text-sm">{product.name}</div>
                <StatusPill status={product.status} />
              </div>
              <p className="text-xs text-gray-500 mt-2">{product.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Live contract addresses</h2>
        <p className="text-xs text-gray-500">These Arc Testnet contracts are used by the MVP. Click to verify on Arcscan.</p>
        <div className="grid md:grid-cols-2 gap-3">
          {[
            {
              name: "ERC-8004 IdentityRegistry",
              address: IDENTITY_REGISTRY,
              standard: "Agent identity proof",
            },
            {
              name: "ERC-8183 AgenticCommerce",
              address: AGENTIC_COMMERCE_CONTRACT,
              standard: "Job lifecycle and escrow",
            },
          ].map(({ name, address, standard }) => (
            <div key={name} className="rounded-lg border border-gray-800 bg-gray-900 p-4 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="font-semibold text-white text-sm">{name}</div>
                <span className="text-[11px] text-gray-500">{standard}</span>
              </div>
              <a
                href={`${ARCSCAN_URL}/address/${address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block font-mono text-[11px] text-blue-400 hover:underline break-all"
              >
                {address} ↗
              </a>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Submission checklist</h2>
        <div className="rounded-lg border border-gray-800 bg-gray-900 divide-y divide-gray-800">
          {REQUIREMENTS.map(([label, value]) => (
            <div key={label} className="grid md:grid-cols-[0.9fr_1.5fr] gap-3 p-3 text-sm">
              <div className="text-gray-300 font-medium">{label}</div>
              <div className="text-gray-500">{value}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Circle Product Feedback</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {FEEDBACK.map((group) => (
            <div key={group.title} className="rounded-lg border border-gray-800 bg-gray-900 p-4">
              <div className="text-sm font-semibold text-white">{group.title}</div>
              <ul className="list-disc list-inside text-xs text-gray-500 mt-3 space-y-1">
                {group.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-yellow-900/50 bg-yellow-950/20 p-4 text-xs text-yellow-200/70 space-y-1">
        <div className="font-semibold text-yellow-300">Submission honesty gate</div>
        <ul className="list-disc list-inside space-y-0.5 text-yellow-200/60">
          <li>Do not select USYC or StableFX as live products unless access is granted and a working flow is shown.</li>
          <li>Do not claim Circle Wallets or Gateway live integration until the project signs and verifies that path.</li>
          <li>For the current submission, the defensible live claim is USDC on Arc with ERC-8004 and ERC-8183 workflow evidence.</li>
        </ul>
      </section>
    </div>
  );
}
