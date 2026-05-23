"use client";

import { useState } from "react";
import type {
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
import { ARC_TESTNET_EXPLORER } from "@/lib/arc-chain";

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

const SIDE_NAV = ["Settlements", "Agents", "Receipts", "Network"];

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

  const actions = NEXT_ACTIONS[job.status] ?? [];
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

  const verifiedCount = jobs.filter((job) => job.settlementMode === "onchain-verified").length;
  const totalValue = jobs.reduce((sum, job) => sum + Number(job.amount || 0), 0);

  function handleCreated(job: ArcSettlementJob) {
    setActiveJobId(job.id);
    refresh();
    setShowCreate(false);
  }

  function handleUpdate() {
    refresh();
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
                {SIDE_NAV.map((item, index) => (
                  <button
                    key={item}
                    className={`w-full rounded-lg px-3 py-2 text-left text-sm font-semibold ${
                      index === 0
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
                    Stablecoin commerce workspace
                  </div>
                  <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                    Agentic trade settlement
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm text-slate-500">
                    Coordinate buyer, supplier, and evaluator agents through USDC escrow, delivery
                    proof, final approval, and a portable receipt.
                  </p>
                </div>
                <button
                  onClick={() => setShowCreate((value) => !value)}
                  className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  {showCreate ? "Close form" : "New settlement"}
                </button>
              </div>

              <div className="mb-6 grid md:grid-cols-3 gap-3">
                {[
                  ["Settlements", jobs.length.toString()],
                  ["Verified receipts", verifiedCount.toString()],
                  ["Tracked value", `$${totalValue.toLocaleString(undefined, { maximumFractionDigits: 3 })}`],
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
                    <div className="text-base font-semibold text-slate-950">Create settlement</div>
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
                <div className="text-sm font-semibold text-slate-950">What makes it different</div>
                <div className="mt-3 space-y-3 text-sm text-slate-600">
                  <p>It is not a balance wallet or checkout page.</p>
                  <p>Every payment is tied to a trade context, agent roles, escrow state, delivery proof, and final receipt.</p>
                </div>
              </section>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
