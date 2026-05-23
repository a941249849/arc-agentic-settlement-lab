"use client";

import { useState } from "react";
import type {
  AgentReview,
  ArcAgentIdentity,
  ArcSettlementJob,
  ArcSettlementReceipt,
  CommerceUseCase,
  TradeProfile,
} from "@/lib/types";
import { useJobs, createJob, updateJob, fetchReceipt, deleteJob } from "@/hooks/useJobs";
import LifecycleBadge from "./LifecycleBadge";
import ReceiptExport from "./ReceiptExport";
import IdentityConsole from "./IdentityConsole";
import OnchainExecutionPanel from "./OnchainExecutionPanel";
import { ARC_TESTNET_EXPLORER, ARC_TESTNET_RPC, arcTestnet } from "@/lib/arc-chain";
import { AGENTIC_COMMERCE_CONTRACT, ARC_USDC } from "@/lib/arc-commerce";

interface CreateFormProps {
  onCreated: (job: ArcSettlementJob) => void;
  verifiedIdentity: ArcAgentIdentity | null;
}

interface JobCardProps {
  job: ArcSettlementJob;
  onUpdate: (job: ArcSettlementJob) => void;
  onDeleted: () => void;
  verifiedIdentity: ArcAgentIdentity | null;
  defaultExpanded?: boolean;
}

const NEXT_ACTIONS: Partial<
  Record<
    ArcSettlementJob["status"],
    { label: string; nextStatus: ArcSettlementJob["status"]; deliverableRequired?: boolean }[]
  >
> = {
  draft: [{ label: "Publish request", nextStatus: "open" }],
  open: [
    { label: "Set provider budget", nextStatus: "budgeted" },
    { label: "Stop settlement", nextStatus: "failed" },
  ],
  budgeted: [
    { label: "Mark escrow funded", nextStatus: "funded" },
    { label: "Stop settlement", nextStatus: "failed" },
  ],
  funded: [
    { label: "Submit deliverable", nextStatus: "submitted", deliverableRequired: true },
    { label: "Stop settlement", nextStatus: "failed" },
  ],
  submitted: [
    { label: "Complete settlement", nextStatus: "settled" },
    { label: "Reject settlement", nextStatus: "failed" },
  ],
};

const LIFECYCLE = [
  { key: "createTxHash", label: "Create job", role: "Client", status: "open" },
  { key: "setBudgetTxHash", label: "Set budget", role: "Provider", status: "budgeted" },
  { key: "approveTxHash", label: "Approve USDC", role: "Client", status: "budgeted" },
  { key: "fundTxHash", label: "Fund escrow", role: "Client", status: "funded" },
  { key: "submitTxHash", label: "Submit proof", role: "Provider", status: "submitted" },
  { key: "settleTxHash", label: "Complete", role: "Evaluator", status: "settled" },
] as const;

const SIDE_NAV = ["Settlements", "Agents", "Receipts", "Network"] as const;
type WorkspaceSection = (typeof SIDE_NAV)[number];

const SECTION_COPY: Record<WorkspaceSection, { eyebrow: string; title: string; body: string }> = {
  Settlements: {
    eyebrow: "Stablecoin commerce workspace",
    title: "Agentic trade settlement",
    body: "Coordinate buyer, supplier, and evaluator agents through USDC escrow, delivery proof, final approval, and a portable receipt.",
  },
  Agents: {
    eyebrow: "Agent workspace",
    title: "Identity and evaluator agents",
    body: "Attach an ERC-8004 identity, then run the evaluator agent against invoice context, delivery proof, and Arc execution evidence before release.",
  },
  Receipts: {
    eyebrow: "Evidence workspace",
    title: "Settlement receipts",
    body: "Review which settlements have complete onchain evidence and export receipt records for audit or challenge submission.",
  },
  Network: {
    eyebrow: "Arc network workspace",
    title: "Arc Testnet configuration",
    body: "Check the network metadata, explorer, RPC endpoint, and live contract addresses used by this workspace.",
  },
};

function shortAddress(value: string) {
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function txUrl(hash: string) {
  return `${ARC_TESTNET_EXPLORER}/tx/${hash}`;
}

function txLabel(hash: string) {
  return `${hash.slice(0, 10)}...${hash.slice(-6)}`;
}

function jobTx(job: ArcSettlementJob, key: (typeof LIFECYCLE)[number]["key"]) {
  return job[key] as string | undefined;
}

function CreateJobForm({ onCreated, verifiedIdentity }: CreateFormProps) {
  const [form, setForm] = useState({
    clientAddress: "0x1111111111111111111111111111111111111111",
    providerAddress: "0x2222222222222222222222222222222222222222",
    evaluatorAddress: "0x3333333333333333333333333333333333333333",
    amount: "2500.00",
    description:
      "US importer agent pays a Singapore supplier for a verified trade document package after evaluator approval.",
    invoiceId: "ARC-INV-2026-002",
    buyerCountry: "United States",
    supplierCountry: "Singapore",
    goodsOrService: "Trade document verification package",
    useCase: "cross-border-trade" as CommerceUseCase,
    complianceCheck: "pending" as TradeProfile["complianceCheck"],
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const job = await createJob({
        clientAddress: form.clientAddress,
        providerAddress: form.providerAddress,
        evaluatorAddress: form.evaluatorAddress,
        amount: form.amount,
        description: form.description,
        currency: "USDC",
        tradeProfile: {
          useCase: form.useCase,
          invoiceId: form.invoiceId,
          buyerCountry: form.buyerCountry,
          supplierCountry: form.supplierCountry,
          goodsOrService: form.goodsOrService,
          complianceCheck: form.complianceCheck,
          fundingSource: "buyer-wallet",
          settlementRail: "USDC-on-Arc",
        },
        agentIdentity: verifiedIdentity ?? undefined,
      });
      setForm((f) => ({ ...f, description: "" }));
      onCreated(job);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create settlement");
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        {(
          [
            { id: "clientAddress", label: "Buyer / importer" },
            { id: "providerAddress", label: "Supplier / agent" },
            { id: "evaluatorAddress", label: "Evaluator" },
            { id: "amount", label: "Amount (USDC)" },
          ] as const
        ).map(({ id, label }) => (
          <label key={id} className="space-y-1 text-xs font-medium text-slate-500">
            {label}
            <input
              value={form[id]}
              onChange={(e) => setForm((f) => ({ ...f, [id]: e.target.value }))}
              className={`${inputClass} font-mono`}
              required
            />
          </label>
        ))}
      </div>

      <label className="space-y-1 text-xs font-medium text-slate-500 block">
        Settlement request
        <textarea
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          rows={2}
          className={inputClass}
          required
        />
      </label>

      <div className="grid md:grid-cols-2 gap-4">
        {(
          [
            { id: "invoiceId", label: "Invoice / order ID" },
            { id: "buyerCountry", label: "Buyer country" },
            { id: "supplierCountry", label: "Supplier country" },
            { id: "goodsOrService", label: "Goods or service" },
          ] as const
        ).map(({ id, label }) => (
          <label key={id} className="space-y-1 text-xs font-medium text-slate-500">
            {label}
            <input
              value={form[id]}
              onChange={(e) => setForm((f) => ({ ...f, [id]: e.target.value }))}
              className={inputClass}
              required
            />
          </label>
        ))}

        <label className="space-y-1 text-xs font-medium text-slate-500">
          Use case
          <select
            value={form.useCase}
            onChange={(e) => setForm((f) => ({ ...f, useCase: e.target.value as CommerceUseCase }))}
            className={inputClass}
          >
            <option value="cross-border-trade">Cross-border trade</option>
            <option value="service-procurement">Service procurement</option>
            <option value="invoice-finance">SME invoice finance</option>
            <option value="tokenized-asset-settlement">Tokenized asset settlement</option>
            <option value="agentic-economy">Agentic economy</option>
          </select>
        </label>

        <label className="space-y-1 text-xs font-medium text-slate-500">
          Compliance check
          <select
            value={form.complianceCheck}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                complianceCheck: e.target.value as TradeProfile["complianceCheck"],
              }))
            }
            className={inputClass}
          >
            <option value="pending">Pending</option>
            <option value="passed">Passed</option>
            <option value="needs-review">Needs review</option>
          </select>
        </label>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {submitting ? "Creating..." : "Create settlement"}
      </button>
    </form>
  );
}

function SettlementActivity({ job }: { job: ArcSettlementJob }) {
  return (
    <div className="space-y-3">
      {LIFECYCLE.map((step) => {
        const hash = jobTx(job, step.key);
        return (
          <div key={step.key} className="grid grid-cols-[28px_1fr] gap-3">
            <div
              className={`mt-1 h-7 w-7 rounded-full border flex items-center justify-center text-xs ${
                hash
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-slate-50 text-slate-400"
              }`}
            >
              {hash ? "✓" : "·"}
            </div>
            <div className="min-w-0 border-b border-slate-100 pb-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-semibold text-slate-950">{step.label}</div>
                  <div className="text-xs text-slate-500">{step.role}</div>
                </div>
                {hash ? (
                  <a
                    href={txUrl(hash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs text-emerald-700 hover:underline"
                  >
                    {txLabel(hash)}
                  </a>
                ) : (
                  <span className="text-xs text-slate-400">Waiting</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function reviewStyles(verdict: AgentReview["verdict"]) {
  if (verdict === "approve") {
    return {
      panel: "border-emerald-200 bg-emerald-50",
      text: "text-emerald-800",
      badge: "bg-emerald-600 text-white",
    };
  }
  if (verdict === "reject") {
    return {
      panel: "border-red-200 bg-red-50",
      text: "text-red-800",
      badge: "bg-red-600 text-white",
    };
  }
  return {
    panel: "border-amber-200 bg-amber-50",
    text: "text-amber-800",
    badge: "bg-amber-500 text-white",
  };
}

function checkDot(status: AgentReview["checks"][number]["status"]) {
  if (status === "pass") return "bg-emerald-500";
  if (status === "fail") return "bg-red-500";
  return "bg-amber-500";
}

function AgentReviewPanel({
  job,
  deliverableHash,
  onUpdate,
}: {
  job: ArcSettlementJob;
  deliverableHash: string;
  onUpdate: (job: ArcSettlementJob) => void;
}) {
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const review = job.agentReview;
  const styles = review ? reviewStyles(review.verdict) : null;
  const canReview =
    job.status === "submitted" ||
    job.status === "settled" ||
    Boolean(deliverableHash.trim() || job.deliverableHash);

  async function runReview() {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch("/api/agent-review", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          job,
          deliverableHash: deliverableHash || job.deliverableHash || "",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      const updated = await updateJob(job.id, { agentReview: data.review as AgentReview });
      onUpdate(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Evaluator review failed");
    } finally {
      setRunning(false);
    }
  }

  return (
    <section
      className={`rounded-lg border p-4 ${
        styles?.panel ?? "border-slate-200 bg-white"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-950">AI evaluator agent</div>
          <p className="mt-1 text-xs text-slate-500">
            Reviews invoice context, delivery proof, budget, identity, and Arc execution evidence
            before release.
          </p>
        </div>
        <button
          onClick={runReview}
          disabled={running || !canReview}
          className="rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {running ? "Reviewing..." : review ? "Rerun review" : "Run review"}
        </button>
      </div>

      {!canReview && (
        <p className="mt-3 text-xs text-slate-500">
          Submit or enter a deliverable hash before the evaluator can make a release decision.
        </p>
      )}

      {review && styles && (
        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${styles.badge}`}>
              {review.verdict.replace("_", " ")}
            </span>
            <span className={`text-xs font-semibold ${styles.text}`}>
              {Math.round(review.confidence * 100)}% confidence
            </span>
            <code className="break-all text-xs text-slate-500">{review.reviewHash}</code>
          </div>
          <p className="text-sm text-slate-700">{review.summary}</p>
          <div className="grid gap-2">
            {review.checks.map((check) => (
              <div key={`${check.label}-${check.status}`} className="flex gap-2 text-xs">
                <span className={`mt-1.5 h-2 w-2 rounded-full ${checkDot(check.status)}`} />
                <div>
                  <div className="font-semibold text-slate-900">{check.label}</div>
                  <div className="text-slate-500">{check.detail}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-lg border border-white/70 bg-white/70 p-3 text-xs text-slate-600">
            <div className="font-semibold text-slate-950">Release condition</div>
            <div className="mt-1">{review.conditions.join(" ")}</div>
          </div>
        </div>
      )}

      {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
    </section>
  );
}

function ReceiptSummary({
  jobs,
  onSelect,
}: {
  jobs: ArcSettlementJob[];
  onSelect: (job: ArcSettlementJob) => void;
}) {
  const receiptReadyJobs = jobs.filter(
    (job) => job.settlementMode === "onchain-verified" || job.settlementMode === "onchain-partial"
  );

  if (receiptReadyJobs.length === 0) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="text-base font-semibold text-slate-950">No onchain receipts yet</div>
        <p className="mt-2 text-sm text-slate-500">
          Run the Arc Testnet execution steps on a settlement. Receipts become useful once tx hashes
          are attached to the lifecycle.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      {receiptReadyJobs.map((job) => (
        <button
          key={job.id}
          onClick={() => onSelect(job)}
          className="w-full rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm hover:border-emerald-200 hover:bg-emerald-50/40"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <LifecycleBadge status={job.status} mode={job.settlementMode} size="sm" />
              <div className="mt-2 text-sm font-semibold text-slate-950">{job.description}</div>
              <div className="mt-1 text-xs text-slate-500">
                {job.tradeProfile?.invoiceId ?? job.id.slice(0, 8)} · {job.amount} USDC
              </div>
              <div className="mt-2 text-xs text-slate-500">
                Evaluator:{" "}
                <span className="font-semibold text-slate-800">
                  {job.agentReview?.verdict ?? "not reviewed"}
                </span>
              </div>
            </div>
            <div className="text-right text-xs text-slate-500">
              {LIFECYCLE.filter((step) => jobTx(job, step.key)).length}/6 tx hashes
            </div>
          </div>
        </button>
      ))}
    </section>
  );
}

function NetworkPanel() {
  const rows = [
    ["Network", arcTestnet.name],
    ["Chain ID", String(arcTestnet.id)],
    ["Native fee unit", `${arcTestnet.nativeCurrency.symbol} (${arcTestnet.nativeCurrency.decimals} decimals)`],
    ["RPC", ARC_TESTNET_RPC],
    ["Explorer", ARC_TESTNET_EXPLORER],
    ["USDC", ARC_USDC],
    ["AgenticCommerce", AGENTIC_COMMERCE_CONTRACT],
  ];

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="mb-4 text-base font-semibold text-slate-950">Arc Testnet details</div>
      <div className="divide-y divide-slate-100">
        {rows.map(([label, value]) => (
          <div key={label} className="grid gap-2 py-3 text-sm md:grid-cols-[180px_1fr]">
            <div className="font-medium text-slate-500">{label}</div>
            <code className="break-all text-slate-950">{value}</code>
          </div>
        ))}
      </div>
      <a
        href={ARC_TESTNET_EXPLORER}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
      >
        Open Arcscan
      </a>
    </section>
  );
}

function JobCard({ job, onUpdate, onDeleted, verifiedIdentity, defaultExpanded }: JobCardProps) {
  const [expanded, setExpanded] = useState(Boolean(defaultExpanded));
  const [deliverableHash, setDeliverableHash] = useState(job.deliverableHash ?? "");
  const [actionError, setActionError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<ArcSettlementReceipt | null>(null);
  const [loadingReceipt, setLoadingReceipt] = useState(false);
  const [showOnchain, setShowOnchain] = useState(false);

  async function transition(
    nextStatus: ArcSettlementJob["status"],
    needsDeliverable?: boolean
  ) {
    setActionError(null);
    if (needsDeliverable && !deliverableHash.trim()) {
      setActionError("Enter a deliverable hash before submitting.");
      return;
    }
    if (nextStatus === "settled" && job.agentReview?.verdict !== "approve") {
      setActionError("Run the AI evaluator and get approval before completing settlement.");
      return;
    }
    try {
      const patch: Partial<ArcSettlementJob> = { status: nextStatus };
      if (nextStatus === "budgeted") patch.budgetAmount = job.amount;
      if (needsDeliverable && deliverableHash.trim()) patch.deliverableHash = deliverableHash.trim();
      const updated = await updateJob(job.id, patch);
      onUpdate(updated);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Update failed");
    }
  }

  async function loadReceipt() {
    setLoadingReceipt(true);
    try {
      const nextReceipt = await fetchReceipt(job.id);
      setReceipt(nextReceipt);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Receipt fetch failed");
    } finally {
      setLoadingReceipt(false);
    }
  }

  async function attachIdentity() {
    if (!verifiedIdentity) return;
    try {
      const updated = await updateJob(job.id, { agentIdentity: verifiedIdentity });
      onUpdate(updated);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Identity attach failed");
    }
  }

  async function handleDelete() {
    await deleteJob(job.id);
    onDeleted();
  }

  const reviewApproved = job.agentReview?.verdict === "approve";
  const actions = (NEXT_ACTIONS[job.status] ?? []).filter(
    (action) => action.nextStatus !== "settled" || reviewApproved
  );
  const txCount = LIFECYCLE.filter((step) => jobTx(job, step.key)).length;
  const route = job.tradeProfile
    ? `${job.tradeProfile.buyerCountry} → ${job.tradeProfile.supplierCountry}`
    : "Custom route";

  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <button
        className="w-full px-4 py-4 text-left focus:outline-none focus:ring-2 focus:ring-emerald-200"
        onClick={() => setExpanded((value) => !value)}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <LifecycleBadge status={job.status} mode={job.settlementMode} size="sm" />
              <span className="font-mono text-xs text-slate-400">{job.id.slice(0, 8)}…</span>
            </div>
            <div className="mt-2 text-base font-semibold text-slate-950">{job.description}</div>
            <div className="mt-1 text-xs text-slate-500">{route}</div>
          </div>
          <div className="text-right">
            <div className="text-xl font-semibold text-slate-950">
              {job.amount} <span className="text-sm text-slate-500">USDC</span>
            </div>
            <div className="text-xs text-slate-500">{txCount}/6 onchain steps</div>
          </div>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 px-4 pb-4">
          <div className="grid gap-5 pt-4">
            <div className="space-y-5">
              <section>
                <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Trade parties
                </div>
                <div className="grid md:grid-cols-3 gap-3">
                  {[
                    ["Buyer", job.clientAddress],
                    ["Supplier", job.providerAddress],
                    ["Evaluator", job.evaluatorAddress],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <div className="text-xs text-slate-500">{label}</div>
                      <code className="mt-1 block truncate text-xs text-slate-900" title={value}>
                        {shortAddress(value)}
                      </code>
                    </div>
                  ))}
                </div>
              </section>

              {job.tradeProfile && (
                <section className="grid md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-xs text-slate-500">Invoice</div>
                    <code className="text-slate-950">{job.tradeProfile.invoiceId}</code>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Settlement rail</div>
                    <div className="font-medium text-slate-950">{job.tradeProfile.settlementRail}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Budget</div>
                    <div className="font-medium text-slate-950">
                      {job.budgetAmount ?? "Not set"} {job.budgetAmount ? "USDC" : ""}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Compliance</div>
                    <div className="font-medium text-slate-950">{job.tradeProfile.complianceCheck}</div>
                  </div>
                </section>
              )}

              {job.agentIdentity ? (
                <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">
                  ERC-8004 agent #{job.agentIdentity.agentId} verified for {shortAddress(job.agentIdentity.ownerAddress)}
                </section>
              ) : verifiedIdentity ? (
                <button
                  onClick={attachIdentity}
                  className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
                >
                  Attach verified agent #{verifiedIdentity.agentId}
                </button>
              ) : null}

              {job.status === "funded" && (
                <label className="block space-y-1 text-xs font-medium text-slate-500">
                  Deliverable hash
                  <div className="flex gap-2">
                    <input
                      value={deliverableHash}
                      onChange={(e) => setDeliverableHash(e.target.value)}
                      placeholder="sha256:... or ipfs://..."
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm text-slate-900 outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => setDeliverableHash("sha256:verified-trade-document-package")}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Sample
                    </button>
                  </div>
                </label>
              )}

              {job.deliverableHash && job.status !== "funded" && (
                <div className="text-xs">
                  <span className="text-slate-500">Deliverable: </span>
                  <code className="break-all text-slate-900">{job.deliverableHash}</code>
                </div>
              )}

              <AgentReviewPanel
                job={job}
                deliverableHash={deliverableHash}
                onUpdate={onUpdate}
              />

              <section className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-950">Onchain execution</div>
                    <div className="text-xs text-slate-500">
                      Wallet-signed ERC-8183 settlement on Arc Testnet.
                    </div>
                  </div>
                  <button
                    onClick={() => setShowOnchain((value) => !value)}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    {showOnchain ? "Hide controls" : "Execute next step"}
                  </button>
                </div>
                {showOnchain && (
                  <OnchainExecutionPanel
                    job={job}
                    deliverableHash={deliverableHash || job.deliverableHash || ""}
                    onUpdate={onUpdate}
                  />
                )}
              </section>

              {actions.length > 0 && (
                <section className="flex flex-wrap gap-2">
                  {actions.map((action) => (
                    <button
                      key={action.nextStatus}
                      onClick={() => transition(action.nextStatus, action.deliverableRequired)}
                      className={`rounded-lg px-3 py-2 text-xs font-semibold ${
                        action.nextStatus === "failed"
                          ? "border border-red-200 text-red-700 hover:bg-red-50"
                          : "bg-slate-950 text-white hover:bg-slate-800"
                      }`}
                    >
                      {action.label}
                    </button>
                  ))}
                </section>
              )}

              {job.status === "submitted" && !reviewApproved && (
                <p className="text-xs text-amber-700">
                  AI evaluator approval is required before local or onchain completion.
                </p>
              )}

              {actionError && <p className="text-xs text-red-600">{actionError}</p>}
            </div>

            <aside className="space-y-5">
              <section>
                <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Settlement activity
                </div>
                <SettlementActivity job={job} />
              </section>

              <section className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-950">Evidence receipt</div>
                    <div className="mt-1 text-xs text-slate-500">
                      Export the business record after tx hashes are recorded.
                    </div>
                  </div>
                  <button
                    onClick={loadReceipt}
                    disabled={loadingReceipt}
                    className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {loadingReceipt ? "Loading..." : "Generate"}
                  </button>
                </div>
              </section>

              {receipt && <ReceiptExport receipt={receipt} />}

              <button
                onClick={handleDelete}
                className="text-xs font-semibold text-red-600 hover:underline"
              >
                Delete settlement
              </button>
            </aside>
          </div>
        </div>
      )}
    </div>
  );
}

export default function JobConsole() {
  const { jobs, loading, error, refresh } = useJobs();
  const [showCreate, setShowCreate] = useState(false);
  const [verifiedIdentity, setVerifiedIdentity] = useState<ArcAgentIdentity | null>(null);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<WorkspaceSection>("Settlements");

  const approvedReviewCount = jobs.filter((job) => job.agentReview?.verdict === "approve").length;
  const totalValue = jobs.reduce((sum, job) => sum + Number(job.amount || 0), 0);
  const section = SECTION_COPY[activeSection];

  function handleCreated(job: ArcSettlementJob) {
    setActiveJobId(job.id);
    refresh();
    setShowCreate(false);
  }

  function handleUpdate() {
    refresh();
  }

  function selectReceiptJob(job: ArcSettlementJob) {
    setActiveJobId(job.id);
    setActiveSection("Settlements");
  }

  return (
    <div className="min-h-screen bg-[#f7f9f8] text-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="grid lg:grid-cols-[240px_1fr_340px] min-h-[760px]">
            <aside className="hidden border-b border-slate-200 bg-white p-5 lg:block lg:border-b-0 lg:border-r">
              <div className="mb-8 flex items-center gap-2">
                <div className="h-9 w-9 rounded-lg bg-slate-950 text-white flex items-center justify-center font-bold">
                  A
                </div>
                <div>
                  <div className="text-sm font-bold">Arc Settlement</div>
                  <div className="text-xs text-slate-500">Agentic trade desk</div>
                </div>
              </div>
              <nav className="space-y-1">
                {SIDE_NAV.map((item) => (
                  <button
                    key={item}
                    onClick={() => setActiveSection(item)}
                    className={`w-full rounded-lg px-3 py-2 text-left text-sm font-semibold ${
                      activeSection === item
                        ? "bg-emerald-50 text-emerald-700"
                        : "text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </nav>
              <div className="mt-8 border-t border-slate-100 pt-5 text-xs text-slate-500">
                Built for USDC-native settlement, deterministic finality, and auditable agent
                workflows on Arc.
              </div>
            </aside>

            <main className="bg-[#fbfcfb] p-5 md:p-7">
              <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                    {section.eyebrow}
                  </div>
                  <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                    {section.title}
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm text-slate-500">
                    {section.body}
                  </p>
                </div>
                {activeSection === "Settlements" && (
                  <button
                    onClick={() => setShowCreate((value) => !value)}
                    className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    {showCreate ? "Close form" : "New settlement"}
                  </button>
                )}
              </div>

              <div className="mb-6 grid grid-cols-2 gap-2 lg:hidden">
                {SIDE_NAV.map((item) => (
                  <button
                    key={item}
                    onClick={() => setActiveSection(item)}
                    className={`rounded-lg border px-3 py-2 text-sm font-semibold ${
                      activeSection === item
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-white text-slate-500"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>

              {activeSection === "Settlements" && (
                <>
                  <div className="mb-6 grid md:grid-cols-3 gap-3">
                    {[
                      ["Settlements", jobs.length.toString()],
                      ["AI approved", approvedReviewCount.toString()],
                      [
                        "Tracked value",
                        `$${totalValue.toLocaleString(undefined, { maximumFractionDigits: 3 })}`,
                      ],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-lg border border-slate-200 bg-white p-4">
                        <div className="text-xs text-slate-500">{label}</div>
                        <div className="mt-1 text-2xl font-semibold text-slate-950">{value}</div>
                      </div>
                    ))}
                  </div>

                  {showCreate && (
                    <section className="mb-6 rounded-lg border border-slate-200 bg-white p-5">
                      <div className="mb-4">
                        <div className="text-base font-semibold text-slate-950">
                          Create settlement
                        </div>
                        <div className="text-xs text-slate-500">
                          Use the same wallet for all roles when testing a full single-signer flow.
                        </div>
                      </div>
                      <CreateJobForm onCreated={handleCreated} verifiedIdentity={verifiedIdentity} />
                    </section>
                  )}

                  {loading ? (
                    <p className="text-sm text-slate-500">Loading settlements...</p>
                  ) : error ? (
                    <p className="text-sm text-red-600">Error: {error}</p>
                  ) : jobs.length === 0 ? (
                    <p className="text-sm text-slate-500">No settlements yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {jobs.map((job) => (
                        <JobCard
                          key={job.id}
                          job={job}
                          onUpdate={handleUpdate}
                          onDeleted={refresh}
                          verifiedIdentity={verifiedIdentity}
                          defaultExpanded={job.id === activeJobId}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}

              {activeSection === "Agents" && (
                <section className="space-y-4">
                  <IdentityConsole onVerified={setVerifiedIdentity} />
                  {verifiedIdentity && (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                      Verified agent #{verifiedIdentity.agentId} is ready to attach to new
                      settlements.
                    </div>
                  )}
                </section>
              )}

              {activeSection === "Receipts" && (
                <ReceiptSummary jobs={jobs} onSelect={selectReceiptJob} />
              )}

              {activeSection === "Network" && <NetworkPanel />}
            </main>

            <aside className="border-t border-slate-200 bg-white p-5 lg:border-l lg:border-t-0">
              <section className="mb-6 rounded-lg bg-slate-950 p-5 text-white">
                <div className="text-xs font-semibold uppercase tracking-wide text-emerald-300">
                  Arc Testnet
                </div>
                <div className="mt-2 text-xl font-semibold">USDC-native settlement rail</div>
                <p className="mt-2 text-sm text-slate-300">
                  Predictable dollar fees, EVM compatibility, and sub-second deterministic
                  settlement for real-world finance workflows.
                </p>
                <a
                  href={ARC_TESTNET_EXPLORER}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex rounded-lg bg-white px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-slate-100"
                >
                  Open Arcscan
                </a>
              </section>

              <section className="mb-6">
                <div className="mb-3 text-sm font-semibold text-slate-950">Agent identity</div>
                <IdentityConsole compact onVerified={setVerifiedIdentity} />
              </section>

              <section className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm font-semibold text-slate-950">Release controls</div>
                <div className="mt-3 space-y-3 text-sm text-slate-600">
                  <p>Funds are released only after the evaluator agent approves the delivery evidence.</p>
                  <p>The receipt records trade context, agent verdict, review hash, and Arc transaction evidence.</p>
                  <p>Arc Testnet execution can be run from the same settlement record when wallet signing is available.</p>
                </div>
              </section>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
