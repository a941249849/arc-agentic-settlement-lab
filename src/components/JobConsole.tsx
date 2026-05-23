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
import { createJob, deleteJob, fetchReceipt, updateJob, useJobs } from "@/hooks/useJobs";
import IdentityConsole from "./IdentityConsole";
import OnchainExecutionPanel from "./OnchainExecutionPanel";
import ReceiptExport from "./ReceiptExport";
import { useArcWallet } from "./ArcWalletProvider";
import { ARC_TESTNET_EXPLORER, arcTestnet } from "@/lib/arc-chain";
import { AGENTIC_COMMERCE_CONTRACT, ARC_USDC } from "@/lib/arc-commerce";

interface CreateDealFormProps {
  onCreated: (job: ArcSettlementJob) => void;
  verifiedIdentity: ArcAgentIdentity | null;
}

interface DealRoomProps {
  job: ArcSettlementJob;
  onUpdate: () => void;
  onDeleted: () => void;
  verifiedIdentity: ArcAgentIdentity | null;
  defaultExpanded?: boolean;
}

const EVIDENCE_STEPS = [
  { key: "createTxHash", label: "Deal opened", meaning: "Arc settlement room created" },
  { key: "setBudgetTxHash", label: "Budget agreed", meaning: "Supplier amount recorded" },
  { key: "approveTxHash", label: "USDC authorized", meaning: "Buyer approved escrow spend" },
  { key: "fundTxHash", label: "Escrow funded", meaning: "Funds locked before release" },
  { key: "submitTxHash", label: "Proof submitted", meaning: "Delivery evidence attached" },
  { key: "settleTxHash", label: "Payment released", meaning: "Evaluator approved settlement" },
] as const;

function shortAddress(value: string) {
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function txUrl(hash: string) {
  return `${ARC_TESTNET_EXPLORER}/tx/${hash}`;
}

function txLabel(hash: string) {
  return `${hash.slice(0, 10)}...${hash.slice(-6)}`;
}

function jobTx(job: ArcSettlementJob, key: (typeof EVIDENCE_STEPS)[number]["key"]) {
  return job[key] as string | undefined;
}

function txCount(job: ArcSettlementJob) {
  return EVIDENCE_STEPS.filter((step) => Boolean(jobTx(job, step.key))).length;
}

function releaseState(job: ArcSettlementJob) {
  if (job.status === "settled") return "Released";
  if (job.agentReview?.verdict === "approve") return "Approved for release";
  if (job.status === "submitted") return "Awaiting evaluator";
  if (job.status === "funded") return "Escrow funded";
  if (job.createTxHash) return "Opening escrow";
  return "Draft deal";
}

function releaseCopy(job: ArcSettlementJob) {
  if (job.status === "settled") return "Payment has been released after delivery proof and evaluator approval.";
  if (job.agentReview?.verdict === "approve") return "Evaluator approved the proof. The next wallet action releases escrow.";
  if (job.status === "submitted") return "Delivery proof is onchain. Run the evaluator decision before release.";
  if (job.status === "funded") return "Funds are locked. The supplier now submits delivery proof.";
  if (job.createTxHash) return "The deal exists on Arc. Continue until funds are locked in escrow.";
  return "Create a business settlement first. No payment is final until Arc evidence exists.";
}

function evaluatorModeLabel(review?: AgentReview) {
  if (!review) return "Policy evaluator";
  return review.model === "deterministic-policy" ? "Policy evaluator" : "AI-enhanced evaluator";
}

function CreateDealForm({ onCreated, verifiedIdentity }: CreateDealFormProps) {
  const { account, isArcNetwork, connectWallet, running: walletRunning } = useArcWallet();
  const [form, setForm] = useState({
    clientAddress: "",
    providerAddress: "",
    evaluatorAddress: "",
    amount: "0.001",
    description:
      "US importer releases payment to a Singapore supplier only after verified trade documents are delivered.",
    invoiceId: "ARC-NEW-DEAL",
    buyerCountry: "United States",
    supplierCountry: "Singapore",
    goodsOrService: "Verified trade document package",
    useCase: "cross-border-trade" as CommerceUseCase,
    complianceCheck: "pending" as TradeProfile["complianceCheck"],
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function useConnectedWallet() {
    setError(null);
    try {
      const nextAccount = account ?? (await connectWallet());
      if (!nextAccount) throw new Error("Wallet account is not connected.");
      setForm((current) => ({
        ...current,
        clientAddress: nextAccount,
        providerAddress: nextAccount,
        evaluatorAddress: nextAccount,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wallet connection failed");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const clientAddress = form.clientAddress || account || "";
      const providerAddress = form.providerAddress || account || "";
      const evaluatorAddress = form.evaluatorAddress || account || "";
      const invoiceId =
        form.invoiceId === "ARC-NEW-DEAL"
          ? `ARC-${Date.now().toString(36).toUpperCase()}`
          : form.invoiceId;
      if (!clientAddress || !providerAddress || !evaluatorAddress) {
        throw new Error("Connect a wallet or fill buyer, supplier, and evaluator addresses.");
      }
      const job = await createJob({
        clientAddress,
        providerAddress,
        evaluatorAddress,
        amount: form.amount,
        description: form.description,
        currency: "USDC",
        tradeProfile: {
          useCase: form.useCase,
          invoiceId,
          buyerCountry: form.buyerCountry,
          supplierCountry: form.supplierCountry,
          goodsOrService: form.goodsOrService,
          complianceCheck: form.complianceCheck,
          fundingSource: "buyer-wallet",
          settlementRail: "USDC-on-Arc",
        },
        agentIdentity: verifiedIdentity ?? undefined,
      });
      onCreated(job);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create deal");
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-slate-850 bg-slate-900/50 px-3 py-2 text-sm text-slate-100 shadow-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20 transition-all placeholder-slate-500";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-lg border border-sky-500/10 bg-sky-500/5 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-100">Deal roles</div>
            <div className="mt-1 text-xs text-slate-400">
              For testnet, one wallet can act as buyer, supplier, and evaluator. In production these are separate parties or agents.
            </div>
          </div>
          <button
            type="button"
            onClick={useConnectedWallet}
            disabled={walletRunning !== null}
            className="rounded-lg bg-sky-600 px-3 py-2 text-xs font-semibold text-white hover:bg-sky-500 transition-colors cursor-pointer disabled:opacity-50"
          >
            {account ? "Use connected wallet" : "Connect and autofill"}
          </button>
        </div>
        <div className="mt-2 text-xs text-slate-400">
          {account ? (
            <>
              Connected: <code className="text-sky-300">{shortAddress(account)}</code>{" "}
              <span className={isArcNetwork ? "text-emerald-450 font-medium" : "text-amber-450 font-medium"}>
                {isArcNetwork ? "Arc Testnet ready" : "Switch to Arc Testnet before signing"}
              </span>
            </>
          ) : (
            "Connect OKX Wallet or MetaMask from the top-right menu."
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {(
          [
            { id: "clientAddress", label: "Buyer / payer" },
            { id: "providerAddress", label: "Supplier / receiver" },
            { id: "evaluatorAddress", label: "Evaluator / release agent" },
            { id: "amount", label: "Escrow amount (USDC)" },
          ] as const
        ).map(({ id, label }) => (
          <label key={id} className="space-y-1 text-xs font-medium text-slate-400 block">
            {label}
            <input
              value={
                form[id] ||
                ((id === "clientAddress" || id === "providerAddress" || id === "evaluatorAddress") && account
                  ? account
                  : "")
              }
              onChange={(e) => setForm((current) => ({ ...current, [id]: e.target.value }))}
              className={`${inputClass} font-mono`}
              required
            />
          </label>
        ))}
      </div>

      <label className="block space-y-1 text-xs font-medium text-slate-400">
        Release condition
        <textarea
          value={form.description}
          onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))}
          rows={3}
          className={inputClass}
          required
        />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        {(
          [
            { id: "invoiceId", label: "Deal / invoice ID" },
            { id: "buyerCountry", label: "Buyer country" },
            { id: "supplierCountry", label: "Supplier country" },
            { id: "goodsOrService", label: "Goods or service" },
          ] as const
        ).map(({ id, label }) => (
          <label key={id} className="space-y-1 text-xs font-medium text-slate-400 block">
            {label}
            <input
              value={form[id]}
              onChange={(e) => setForm((current) => ({ ...current, [id]: e.target.value }))}
              className={inputClass}
              required
            />
          </label>
        ))}

        <label className="space-y-1 text-xs font-medium text-slate-400 block">
          Use case
          <select
            value={form.useCase}
            onChange={(e) => setForm((current) => ({ ...current, useCase: e.target.value as CommerceUseCase }))}
            className={`${inputClass} [&>option]:bg-slate-950 [&>option]:text-slate-100`}
          >
            <option value="cross-border-trade">Cross-border trade</option>
            <option value="service-procurement">Service procurement</option>
            <option value="invoice-finance">SME invoice finance</option>
            <option value="tokenized-asset-settlement">Tokenized asset settlement</option>
            <option value="agentic-economy">Agentic economy</option>
          </select>
        </label>

        <label className="space-y-1 text-xs font-medium text-slate-400 block">
          Compliance state
          <select
            value={form.complianceCheck}
            onChange={(e) =>
              setForm((current) => ({
                ...current,
                complianceCheck: e.target.value as TradeProfile["complianceCheck"],
              }))
            }
            className={`${inputClass} [&>option]:bg-slate-950 [&>option]:text-slate-100`}
          >
            <option value="pending">Pending</option>
            <option value="passed">Passed</option>
            <option value="needs-review">Needs review</option>
          </select>
        </label>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-50 transition-colors shadow-lg shadow-sky-500/10 cursor-pointer"
      >
        {submitting ? "Creating deal..." : "Create deal room"}
      </button>
    </form>
  );
}

function EvidenceRail({ job }: { job: ArcSettlementJob }) {
  const currentStepIndex = EVIDENCE_STEPS.findIndex((step) => !jobTx(job, step.key));
  const activeIndex = currentStepIndex === -1 ? EVIDENCE_STEPS.length : currentStepIndex;

  return (
    <div className="relative pl-6 border-l border-slate-800 space-y-4 py-2">
      {EVIDENCE_STEPS.map((step, index) => {
        const hash = jobTx(job, step.key);
        const isCompleted = Boolean(hash);
        const isActive = index === activeIndex;

        return (
          <div key={step.key} className="relative group">
            {/* Glowing dot */}
            <span className={`absolute -left-[31px] top-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full border transition-all duration-300 ${
              isCompleted
                ? "bg-emerald-500 border-emerald-450 text-slate-950 shadow-md shadow-emerald-500/20"
                : isActive
                ? "bg-sky-500 border-sky-400 text-slate-950 pulse-glow-cyan"
                : "bg-slate-950 border-slate-800 text-slate-550"
            }`}>
              {isCompleted ? (
                <svg className="h-2.5 w-2.5 text-slate-950" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <span className="text-[10px] font-bold">{index + 1}</span>
              )}
            </span>

            <div className={`p-3 rounded-xl border transition-all duration-300 ${
              isCompleted
                ? "bg-emerald-500/5 border-emerald-500/10 text-slate-100"
                : isActive
                ? "bg-sky-500/5 border-sky-500/20 text-slate-100 shadow-md shadow-sky-500/5"
                : "bg-slate-950/20 border-slate-900/60 text-slate-400"
            }`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className={`text-xs font-semibold ${isCompleted ? "text-emerald-400" : isActive ? "text-sky-400" : "text-slate-400"}`}>
                  {step.label}
                </div>
                {isActive && (
                  <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-sky-500/10 text-sky-400 border border-sky-500/20">
                    Awaiting Action
                  </span>
                )}
              </div>
              <div className="mt-1 text-[11px] text-slate-400">{step.meaning}</div>
              {hash && (
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span className="text-[9px] text-slate-500 font-mono">Tx:</span>
                  <a
                    href={txUrl(hash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate font-mono text-[9px] text-sky-450 hover:text-sky-400 hover:underline transition-colors max-w-[160px]"
                  >
                    {txLabel(hash)}
                  </a>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ReviewPanel({
  job,
  deliverableHash,
  onUpdate,
}: {
  job: ArcSettlementJob;
  deliverableHash: string;
  onUpdate: () => void;
}) {
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const review = job.agentReview;
  const canReview = job.status === "submitted" || job.status === "settled";
  const verdictClass =
    review?.verdict === "approve"
      ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-300"
      : review?.verdict === "reject"
      ? "border-red-500/20 bg-red-500/5 text-red-300"
      : "border-amber-500/20 bg-amber-500/5 text-amber-300";

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
      await updateJob(job.id, { agentReview: data.review as AgentReview });
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Evaluator review failed");
    } finally {
      setRunning(false);
    }
  }

  return (
    <section className={`rounded-lg border p-4 ${review ? verdictClass : "border-slate-850 bg-slate-900/10"}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-100">Evaluator decision</div>
          <p className="mt-1 text-xs text-slate-400">
            {evaluatorModeLabel(review)} checks the deal context, escrow amount, delivery proof, Arc evidence, and agent identity before release.
          </p>
        </div>
        <button
          onClick={runReview}
          disabled={running || !canReview}
          className="rounded-lg bg-sky-600 px-3 py-2 text-xs font-semibold text-white hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-50 transition-colors shadow-lg shadow-sky-500/10 cursor-pointer"
        >
          {running ? "Reviewing..." : review ? "Rerun decision" : "Run evaluator"}
        </button>
      </div>

      {!canReview && (
        <p className="mt-3 text-xs text-slate-550">
          The evaluator unlocks after delivery proof is submitted on Arc. This prevents approving an unpaid or unproven deal.
        </p>
      )}

      {review && (
        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-900 border border-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-100">
              {review.verdict.replace("_", " ")}
            </span>
            <span className="text-xs font-semibold text-slate-300">{Math.round(review.confidence * 100)}% confidence</span>
            <code className="break-all text-[10px] text-slate-500">{review.reviewHash}</code>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">{review.summary}</p>
          <div className="grid gap-2">
            {review.checks.map((check) => (
              <div key={`${check.label}-${check.status}`} className="rounded-lg border border-slate-900 bg-slate-900/20 p-3 text-xs">
                <div className="font-semibold text-slate-200">
                  {check.status.toUpperCase()} · {check.label}
                </div>
                <div className="mt-1 text-slate-400">{check.detail}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && <p className="mt-3 text-xs text-red-400">{error}</p>}
    </section>
  );
}

function DealRoom({ job, onUpdate, onDeleted, verifiedIdentity, defaultExpanded }: DealRoomProps) {
  const [expanded, setExpanded] = useState(Boolean(defaultExpanded));
  const [deliverableHash, setDeliverableHash] = useState(job.deliverableHash ?? "");
  const [receipt, setReceipt] = useState<ArcSettlementReceipt | null>(null);
  const [loadingReceipt, setLoadingReceipt] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const evidenceCount = txCount(job);
  const profile = job.tradeProfile;
  const route = profile ? `${profile.buyerCountry} -> ${profile.supplierCountry}` : "Custom route";

  async function attachIdentity() {
    if (!verifiedIdentity) return;
    try {
      await updateJob(job.id, { agentIdentity: verifiedIdentity });
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Identity attach failed");
    }
  }

  async function loadReceipt() {
    if (evidenceCount === 0) {
      setError("Receipt unlocks after at least one Arc transaction is recorded.");
      return;
    }
    setLoadingReceipt(true);
    setError(null);
    try {
      setReceipt(await fetchReceipt(job.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Receipt generation failed");
    } finally {
      setLoadingReceipt(false);
    }
  }

  async function handleDelete() {
    await deleteJob(job.id);
    onDeleted();
  }

  return (
    <section className="glass-panel rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded((value) => !value)}
        className="w-full px-5 py-4 text-left focus:outline-none focus:ring-1 focus:ring-sky-500/20"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-lg bg-slate-900 border border-slate-800 px-2 py-0.5 text-xs font-semibold text-slate-200">
                {releaseState(job)}
              </span>
              <span className="font-mono text-xs text-slate-500">{profile?.invoiceId ?? job.id.slice(0, 8)}</span>
            </div>
            <div className="mt-2 text-base font-semibold text-slate-100">{job.description}</div>
            <div className="mt-1 text-xs text-slate-400">{route}</div>
          </div>
          <div className="text-right">
            <div className="text-xl font-semibold text-slate-100">
              {job.amount} <span className="text-sm text-slate-400">USDC</span>
            </div>
            <div className="text-xs text-slate-500">{evidenceCount}/6 Arc evidence events</div>
          </div>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-900 p-5 bg-slate-950/20">
          <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
            <div className="space-y-5">
              <section className="rounded-lg border border-sky-500/10 bg-sky-500/5 p-4">
                <div className="text-sm font-semibold text-sky-400">What this deal is doing</div>
                <p className="mt-1 text-sm text-slate-300">{releaseCopy(job)}</p>
                <div className="mt-3 grid gap-2 text-xs md:grid-cols-3">
                  <div className="rounded-lg bg-slate-900/40 border border-slate-850 p-3">
                    <div className="font-semibold text-slate-200">Not a transfer</div>
                    <div className="mt-1 text-slate-400">Funds move through escrow and release conditions.</div>
                  </div>
                  <div className="rounded-lg bg-slate-900/40 border border-slate-850 p-3">
                    <div className="font-semibold text-slate-200">Proof required</div>
                    <div className="mt-1 text-slate-400">Supplier must submit delivery evidence before release.</div>
                  </div>
                  <div className="rounded-lg bg-slate-900/40 border border-slate-850 p-3">
                    <div className="font-semibold text-slate-200">Decision recorded</div>
                    <div className="mt-1 text-slate-400">Evaluator verdict is added to the final receipt.</div>
                  </div>
                </div>
              </section>

              <section className="rounded-lg border border-slate-850 bg-slate-900/10 p-4">
                <div className="mb-3 text-sm font-semibold text-slate-100">Deal terms</div>
                <div className="grid gap-3 text-sm md:grid-cols-2">
                  <div>
                    <div className="text-xs text-slate-500">Buyer</div>
                    <code className="text-xs text-sky-350">{shortAddress(job.clientAddress)}</code>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Supplier</div>
                    <code className="text-xs text-sky-350">{shortAddress(job.providerAddress)}</code>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Evaluator</div>
                    <code className="text-xs text-sky-350">{shortAddress(job.evaluatorAddress)}</code>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Use case</div>
                    <div className="font-medium text-slate-300">{profile?.useCase ?? "custom"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Goods or service</div>
                    <div className="font-medium text-slate-300">{profile?.goodsOrService ?? "Not specified"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Compliance state</div>
                    <div className="font-medium text-slate-300">{profile?.complianceCheck ?? "pending"}</div>
                  </div>
                </div>
              </section>

              <section className="rounded-lg border border-slate-850 bg-slate-900/10 p-4">
                <div className="mb-3 text-sm font-semibold text-slate-100">Escrow and proof</div>
                <OnchainExecutionPanel
                  job={job}
                  deliverableHash={deliverableHash || job.deliverableHash || ""}
                  onUpdate={onUpdate}
                />
                <div className="mt-4 rounded-lg border border-slate-900 bg-slate-900/30 p-4">
                  {job.status === "funded" ? (
                    <label className="block space-y-1 text-xs font-medium text-slate-400">
                      Delivery proof
                      <div className="flex gap-2 mt-1">
                        <input
                          value={deliverableHash}
                          onChange={(e) => setDeliverableHash(e.target.value)}
                          placeholder="sha256:... or ipfs://..."
                          className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 font-mono text-sm text-slate-100 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20"
                        />
                        <button
                          type="button"
                          onClick={() => setDeliverableHash("sha256:verified-trade-document-package")}
                          className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          Sample
                        </button>
                      </div>
                    </label>
                  ) : (
                    <div className="text-sm text-slate-400">
                      {job.deliverableHash ? (
                        <>
                          Delivery proof: <code className="break-all text-sky-300 font-mono">{job.deliverableHash}</code>
                        </>
                      ) : (
                        "Delivery proof entry unlocks after escrow is funded."
                      )}
                    </div>
                  )}
                </div>
              </section>

              <ReviewPanel job={job} deliverableHash={deliverableHash} onUpdate={onUpdate} />

              {error && <p className="text-xs text-red-400">{error}</p>}
            </div>

            <aside className="space-y-5">
              <section className="rounded-lg border border-slate-850 bg-slate-900/20 p-4">
                <div className="text-sm font-semibold text-slate-100">Evidence receipt</div>
                <p className="mt-1 text-xs text-slate-400">
                  Exports business context, escrow lifecycle, delivery proof, evaluator verdict, and Arc tx references.
                </p>
                <button
                  onClick={loadReceipt}
                  disabled={loadingReceipt || evidenceCount === 0}
                  className="mt-3 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 shadow-lg shadow-emerald-500/10"
                >
                  {loadingReceipt ? "Generating..." : "Generate receipt"}
                </button>
              </section>

              {receipt && <ReceiptExport receipt={receipt} />}

              <section className="rounded-lg border border-slate-850 bg-slate-900/10 p-4">
                <div className="mb-3 text-sm font-semibold text-slate-100">Arc evidence trail</div>
                <EvidenceRail job={job} />
              </section>

              {job.agentIdentity ? (
                <section className="rounded-lg border border-emerald-500/10 bg-emerald-500/5 p-3 text-xs text-emerald-400 border border-emerald-500/20">
                  ERC-8004 agent #{job.agentIdentity.agentId} verified for {shortAddress(job.agentIdentity.ownerAddress)}
                </section>
              ) : verifiedIdentity ? (
                <button
                  onClick={attachIdentity}
                  className="w-full rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-all cursor-pointer"
                >
                  Attach verified agent #{verifiedIdentity.agentId}
                </button>
              ) : null}

              <button onClick={handleDelete} className="text-xs font-semibold text-red-400 hover:text-red-350 hover:underline transition-colors cursor-pointer block">
                Delete deal
              </button>
            </aside>
          </div>
        </div>
      )}
    </section>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <section className="rounded-xl border border-dashed border-slate-800 bg-slate-950/20 p-8 text-center">
      <div className="mx-auto max-w-xl">
        <div className="text-base font-semibold text-slate-100">Create an escrow-backed deal</div>
        <p className="mt-2 text-sm text-slate-400">
          Start with a buyer, supplier, release condition, and USDC amount. The payment is only released after proof and evaluator approval.
        </p>
        <button
          onClick={onCreate}
          className="mt-4 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500 transition-colors shadow-lg shadow-sky-500/10 cursor-pointer"
        >
          Create deal
        </button>
      </div>
    </section>
  );
}

export default function JobConsole() {
  const { jobs, loading, error, refresh } = useJobs();
  const [showCreate, setShowCreate] = useState(false);
  const [verifiedIdentity, setVerifiedIdentity] = useState<ArcAgentIdentity | null>(null);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const { account, isArcNetwork, connectWallet, running } = useArcWallet();

  const totalValue = jobs.reduce((sum, job) => sum + Number(job.amount || 0), 0);
  const lockedDeals = jobs.filter((job) => job.status === "funded" || job.status === "submitted").length;
  const releasedDeals = jobs.filter((job) => job.status === "settled").length;
  const activeDeal = jobs.find((job) => job.id === activeJobId);

  function handleCreated(job: ArcSettlementJob) {
    setActiveJobId(job.id);
    setShowCreate(false);
    refresh();
  }

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 pb-12">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <section className="mb-6 glass-panel rounded-2xl p-6 md:p-8 shadow-xl bg-slate-950/40 backdrop-blur-md">
          <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-sky-400">
                Arc agentic escrow
              </div>
              <h1 className="mt-2 max-w-3xl text-3xl font-semibold tracking-tight text-slate-100 md:text-4xl">
                Stablecoin payments that wait for proof.
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
                This is not a wallet transfer page. It creates a business deal room where USDC is locked in Arc escrow,
                the supplier submits delivery proof, an evaluator agent makes a release decision, and the final receipt
                binds business context with chain evidence.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  onClick={() => setShowCreate((value) => !value)}
                  className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500 transition-colors shadow-lg shadow-sky-500/10 cursor-pointer"
                >
                  {showCreate ? "Close deal form" : "Create deal"}
                </button>
                <button
                  onClick={() => connectWallet().catch(() => undefined)}
                  disabled={running !== null}
                  className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-350 hover:bg-slate-800 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {account ? (isArcNetwork ? "Wallet ready" : "Switch wallet to Arc") : "Connect wallet"}
                </button>
              </div>
            </div>

            <div className="rounded-xl bg-slate-900/50 border border-slate-850 p-5">
              <div className="text-xs font-bold uppercase tracking-wider text-sky-450">Why Arc matters</div>
              <div className="mt-3 space-y-3 text-xs text-slate-400 leading-relaxed">
                <p>USDC is the fee unit and settlement asset, so payment accounting stays dollar-native.</p>
                <p>Deterministic finality lets the receipt treat confirmed escrow actions as final business evidence.</p>
                <p>ERC-8004 and ERC-8183 map agent identity and job settlement into the same workflow.</p>
              </div>
              <a
                href={ARC_TESTNET_EXPLORER}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Open Arcscan
              </a>
            </div>
          </div>
        </section>

        <section className="mb-6 grid gap-3 grid-cols-2 md:grid-cols-4">
          {[
            ["Deals", jobs.length.toString()],
            ["Escrow active", lockedDeals.toString()],
            ["Released", releasedDeals.toString()],
            ["Tracked value", `$${totalValue.toLocaleString(undefined, { maximumFractionDigits: 3 })}`],
          ].map(([label, value]) => (
            <div key={label} className="glass-panel rounded-xl p-4">
              <div className="text-xs text-slate-550">{label}</div>
              <div className="mt-1 text-2xl font-bold text-slate-100">{value}</div>
            </div>
          ))}
        </section>

        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <main className="space-y-5">
            {showCreate && (
              <section className="glass-panel rounded-xl p-5 shadow-lg">
                <div className="mb-4">
                  <div className="text-base font-semibold text-slate-100">New deal room</div>
                  <div className="mt-1 text-xs text-slate-400">
                    Define the business condition first. Arc transactions only execute after the deal is clear.
                  </div>
                </div>
                <CreateDealForm onCreated={handleCreated} verifiedIdentity={verifiedIdentity} />
              </section>
            )}

            {loading ? (
              <p className="text-sm text-slate-400">Loading deals...</p>
            ) : error ? (
              <p className="text-sm text-red-400">Error: {error}</p>
            ) : jobs.length === 0 ? (
              <EmptyState onCreate={() => setShowCreate(true)} />
            ) : (
              <div className="space-y-4">
                {jobs.map((job) => (
                  <DealRoom
                     key={job.id}
                     job={job}
                     onUpdate={refresh}
                     onDeleted={refresh}
                     verifiedIdentity={verifiedIdentity}
                     defaultExpanded={job.id === (activeDeal?.id ?? activeJobId)}
                  />
                ))}
              </div>
            )}
          </main>

          <aside className="space-y-5">
            <section className="glass-panel rounded-xl p-5">
              <div className="text-sm font-semibold text-slate-100">Evaluator agent</div>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                This is the release gate. It reviews the deal terms, escrow evidence, delivery proof, and agent proof before the final payment action becomes available.
              </p>
              <div className="mt-3 grid gap-2 text-xs text-slate-400">
                <div className="rounded-lg bg-slate-900/40 border border-slate-850 p-2.5">Checks invoice context and route.</div>
                <div className="rounded-lg bg-slate-900/40 border border-slate-850 p-2.5">Checks escrow budget and delivery proof.</div>
                <div className="rounded-lg bg-slate-900/40 border border-slate-850 p-2.5">Checks Arc tx evidence before release.</div>
              </div>
              <p className="mt-3 text-[11px] text-slate-550 leading-relaxed">
                Default mode is deterministic policy review. If an OpenAI API key is configured, the same verdict can be enriched with a clearer AI-written explanation.
              </p>
            </section>

            <section className="glass-panel rounded-xl p-5">
              <div className="mb-3 text-sm font-semibold text-slate-100">Agent identity</div>
              <IdentityConsole compact onVerified={setVerifiedIdentity} />
            </section>

            <section className="glass-panel rounded-xl p-5 text-xs text-slate-400">
              <div className="text-sm font-semibold text-slate-100">Execution contracts</div>
              <div className="mt-3 space-y-2">
                <div>
                  <span className="text-slate-500">Network: </span>
                  <span className="font-semibold text-slate-300">{arcTestnet.name}</span>
                </div>
                <div>
                  <span className="text-slate-500">USDC: </span>
                  <code className="break-all text-sky-400 font-mono">{ARC_USDC}</code>
                </div>
                <div>
                  <span className="text-slate-500">Settlement: </span>
                  <code className="break-all text-sky-400 font-mono">{AGENTIC_COMMERCE_CONTRACT}</code>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
