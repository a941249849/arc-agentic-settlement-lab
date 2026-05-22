"use client";

import { useState } from "react";
import type { ArcAgentIdentity, ArcSettlementJob, ArcSettlementReceipt } from "@/lib/types";
import { useJobs, createJob, updateJob, fetchReceipt } from "@/hooks/useJobs";
import LifecycleBadge from "./LifecycleBadge";
import ReceiptExport from "./ReceiptExport";
import IdentityConsole from "./IdentityConsole";
import OnchainExecutionPanel from "./OnchainExecutionPanel";

// ──────────────────────────────────────────────
// Create Job Form
// ──────────────────────────────────────────────

interface CreateFormProps {
  onCreated: (job: ArcSettlementJob) => void;
  verifiedIdentity: ArcAgentIdentity | null;
}

function CreateJobForm({ onCreated, verifiedIdentity }: CreateFormProps) {
  const [form, setForm] = useState({
    clientAddress: "0x1111111111111111111111111111111111111111",
    providerAddress: "0x2222222222222222222222222222222222222222",
    evaluatorAddress: "0x3333333333333333333333333333333333333333",
    amount: "25.00",
    description:
      "Buyer agent purchases a market-intelligence report and pays the provider after evaluator approval.",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const job = await createJob({
        ...form,
        currency: "USDC",
        agentIdentity: verifiedIdentity ?? undefined,
      });
      setForm((f) => ({ ...f, description: "" }));
      onCreated(job);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create job");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        {(
          [
            { id: "clientAddress", label: "Client Address" },
            { id: "providerAddress", label: "Provider / Agent Address" },
            { id: "evaluatorAddress", label: "Evaluator / Auditor Address" },
            { id: "amount", label: "Amount (USDC)" },
          ] as const
        ).map(({ id, label }) => (
          <div key={id} className="space-y-1">
            <label htmlFor={id} className="block text-xs text-gray-400">
              {label}
            </label>
            <input
              id={id}
              value={form[id]}
              onChange={(e) => setForm((f) => ({ ...f, [id]: e.target.value }))}
              className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-600 text-white text-sm font-mono focus:outline-none focus:border-blue-500"
              required
            />
          </div>
        ))}
      </div>
      <div className="space-y-1">
        <label htmlFor="description" className="block text-xs text-gray-400">
          Job Description
        </label>
        <textarea
          id="description"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          rows={2}
          placeholder="Describe the service, API call, report, or deliverable the buyer agent is purchasing..."
          className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-600 text-white text-sm focus:outline-none focus:border-blue-500"
          required
        />
      </div>
      {error && <p className="text-red-400 text-xs">{error}</p>}
      {verifiedIdentity && (
        <div className="rounded-lg border border-green-800 bg-green-950/20 px-3 py-2 text-xs text-green-300">
          New job will include verified ERC-8004 agent #{verifiedIdentity.agentId}.
        </div>
      )}
      <button
        type="submit"
        disabled={submitting}
        className="px-5 py-2 rounded bg-blue-700 text-white text-sm font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50"
      >
        {submitting ? "Creating…" : "Create Job (draft)"}
      </button>
    </form>
  );
}

// ──────────────────────────────────────────────
// Job Row / Card
// ──────────────────────────────────────────────

interface JobCardProps {
  job: ArcSettlementJob;
  onUpdate: (updated: ArcSettlementJob) => void;
  verifiedIdentity: ArcAgentIdentity | null;
}

const NEXT_ACTIONS: Record<
  string,
  { label: string; nextStatus: ArcSettlementJob["status"]; deliverableRequired?: boolean }[]
> = {
  draft: [{ label: "Publish (→ open)", nextStatus: "open" }],
  open: [
    { label: "Provider Set Budget (→ budgeted)", nextStatus: "budgeted" },
    { label: "Fail", nextStatus: "failed" },
  ],
  budgeted: [
    { label: "Approve & Fund Escrow (→ funded)", nextStatus: "funded" },
    { label: "Fail", nextStatus: "failed" },
  ],
  funded: [
    {
      label: "Submit Deliverable (→ submitted)",
      nextStatus: "submitted",
      deliverableRequired: true,
    },
    { label: "Fail", nextStatus: "failed" },
  ],
  submitted: [
    { label: "Approve & Settle (→ settled)", nextStatus: "settled" },
    { label: "Reject (→ failed)", nextStatus: "failed" },
  ],
  settled: [],
  failed: [],
};

function JobCard({ job, onUpdate, verifiedIdentity }: JobCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [deliverableHash, setDeliverableHash] = useState(job.deliverableHash ?? "");
  const [actionError, setActionError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<ArcSettlementReceipt | null>(null);
  const [loadingReceipt, setLoadingReceipt] = useState(false);

  async function transition(
    nextStatus: ArcSettlementJob["status"],
    needsDeliverable?: boolean
  ) {
    setActionError(null);
    if (needsDeliverable && !deliverableHash.trim()) {
      setActionError("Please enter a deliverable hash before submitting.");
      return;
    }
    try {
      const patch: Partial<ArcSettlementJob> = { status: nextStatus };
      if (nextStatus === "budgeted") {
        patch.budgetAmount = job.amount;
      }
      if (needsDeliverable && deliverableHash.trim()) {
        patch.deliverableHash = deliverableHash.trim();
      }
      const updated = await updateJob(job.id, patch);
      onUpdate(updated);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Update failed");
    }
  }

  async function loadReceipt() {
    setLoadingReceipt(true);
    try {
      const r = await fetchReceipt(job.id);
      setReceipt(r);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Receipt fetch failed");
    } finally {
      setLoadingReceipt(false);
    }
  }

  async function attachIdentity() {
    if (!verifiedIdentity) return;
    setActionError(null);
    try {
      const updated = await updateJob(job.id, { agentIdentity: verifiedIdentity });
      onUpdate(updated);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Identity attach failed");
    }
  }

  const actions = NEXT_ACTIONS[job.status] ?? [];

  return (
    <div className="rounded-xl border border-gray-700 bg-gray-900 overflow-hidden">
      {/* Card header */}
      <button
        className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-800/50 transition-colors"
        onClick={() => setExpanded((e) => !e)}
      >
        <LifecycleBadge status={job.status} mode={job.settlementMode} size="sm" />
        <span className="font-mono text-xs text-gray-500">{job.id.slice(0, 8)}…</span>
        <span className="text-sm text-white truncate flex-1">{job.description}</span>
        <span className="text-xs text-gray-500">
          {job.amount} {job.currency}
        </span>
        <span className="text-gray-600 text-xs">{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <div className="border-t border-gray-700 px-4 py-4 space-y-4">
          {/* Parties */}
          <div className="grid md:grid-cols-3 gap-3 text-xs">
            {[
              { label: "Client", value: job.clientAddress },
              { label: "Provider", value: job.providerAddress },
              { label: "Evaluator", value: job.evaluatorAddress },
            ].map(({ label, value }) => (
              <div key={label} className="min-w-0">
                <span className="text-gray-500">{label}: </span>
                <code className="block mt-1 text-blue-300 truncate" title={value}>
                  {value}
                </code>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-gray-500">Requested amount: </span>
              <span className="text-white">
                {job.amount} {job.currency}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Provider budget: </span>
              <span className={job.budgetAmount ? "text-violet-300" : "text-gray-600"}>
                {job.budgetAmount ? `${job.budgetAmount} ${job.currency}` : "Not set"}
              </span>
            </div>
          </div>

          <div className="rounded-lg border border-gray-800 bg-gray-950/60 p-3 text-xs space-y-2">
            <div className="font-semibold text-gray-300">Agent identity</div>
            {job.agentIdentity ? (
              <div className="grid md:grid-cols-3 gap-2">
                <div>
                  <span className="text-gray-500">Agent ID: </span>
                  <span className="text-green-300">#{job.agentIdentity.agentId}</span>
                </div>
                <div className="min-w-0">
                  <span className="text-gray-500">Owner: </span>
                  <code
                    className="block text-blue-300 truncate"
                    title={job.agentIdentity.ownerAddress}
                  >
                    {job.agentIdentity.ownerAddress}
                  </code>
                </div>
                <div className="min-w-0">
                  <span className="text-gray-500">Metadata: </span>
                  <code
                    className="block text-blue-300 truncate"
                    title={job.agentIdentity.metadataURI}
                  >
                    {job.agentIdentity.metadataURI}
                  </code>
                </div>
              </div>
            ) : verifiedIdentity ? (
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-gray-500">
                  Verified agent #{verifiedIdentity.agentId} is available for this session.
                </span>
                <button
                  onClick={attachIdentity}
                  className="px-3 py-1 rounded bg-green-800 text-green-100 hover:bg-green-700"
                >
                  Attach Verified Agent
                </button>
              </div>
            ) : (
              <span className="text-gray-600">
                No ERC-8004 agent attached. Verify an agent above before treating this job as
                identity-backed.
              </span>
            )}
          </div>

          {/* Deliverable input (only when funded) */}
          {job.status === "funded" && (
            <div className="space-y-1">
              <label className="text-xs text-gray-400">Deliverable Hash (SHA-256 or IPFS CID)</label>
              <input
                value={deliverableHash}
                onChange={(e) => setDeliverableHash(e.target.value)}
                placeholder="e.g. sha256:abc123… or ipfs://Qm…"
                className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-600 text-white text-sm font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
          )}

          {/* Existing deliverable hash */}
          {job.deliverableHash && job.status !== "funded" && (
            <div className="text-xs">
              <span className="text-gray-500">Deliverable: </span>
              <code className="text-yellow-300 break-all">{job.deliverableHash}</code>
            </div>
          )}

          <OnchainExecutionPanel
            job={job}
            deliverableHash={deliverableHash || job.deliverableHash || ""}
            onUpdate={onUpdate}
          />

          {/* Action buttons */}
          {actions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {actions.map((action) => (
                <button
                  key={action.nextStatus}
                  onClick={() => transition(action.nextStatus, action.deliverableRequired)}
                  className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
                    action.nextStatus === "failed"
                      ? "border border-red-700 text-red-400 hover:bg-red-900/30"
                      : action.nextStatus === "settled"
                      ? "bg-green-800 text-green-100 hover:bg-green-700"
                      : "bg-blue-700 text-white hover:bg-blue-600"
                  }`}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}

          {actionError && <p className="text-red-400 text-xs">{actionError}</p>}

          {/* Receipt */}
          <div>
            <button
              onClick={loadReceipt}
              disabled={loadingReceipt}
              className="px-4 py-1.5 rounded border border-gray-600 text-xs text-gray-300 hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              {loadingReceipt ? "Loading…" : "📄 Generate Receipt"}
            </button>
          </div>

          {receipt && <ReceiptExport receipt={receipt} />}

          {/* Timestamps */}
          <div className="flex gap-4 text-xs text-gray-600">
            <span>Created: {new Date(job.createdAt).toLocaleString()}</span>
            <span>Updated: {new Date(job.updatedAt).toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// Main Job Console
// ──────────────────────────────────────────────

export default function JobConsole() {
  const { jobs, loading, error, refresh } = useJobs();
  const [showCreate, setShowCreate] = useState(false);
  const [verifiedIdentity, setVerifiedIdentity] = useState<ArcAgentIdentity | null>(null);

  function handleCreated() {
    refresh();
    setShowCreate(false);
  }

  function handleUpdate() {
    refresh();
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Agentic Commerce Console</h1>
          <p className="text-sm text-gray-400 mt-1">
            Create a buyer-agent service purchase, set a provider budget, fund USDC escrow, submit
            deliverable evidence, and export a settlement receipt.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-2 py-1 rounded text-xs bg-blue-900/40 border border-blue-700 text-blue-300">
            Wallet execution · Identity reads enabled
          </span>
          <button
            onClick={() => setShowCreate((s) => !s)}
            className="px-4 py-2 rounded bg-blue-700 text-white text-sm font-semibold hover:bg-blue-600 transition-colors"
          >
            {showCreate ? "Cancel" : "+ New Job"}
          </button>
        </div>
      </div>

      <IdentityConsole compact onVerified={setVerifiedIdentity} />

      <section className="rounded-xl border border-cyan-800 bg-cyan-950/20 p-5 text-sm text-cyan-100">
        <div className="font-semibold text-white mb-2">Challenge scenario</div>
        <div className="grid md:grid-cols-4 gap-3 text-xs">
          <div className="rounded-lg border border-cyan-900 bg-gray-950/60 p-3">
            <div className="text-cyan-300 font-semibold">Buyer agent</div>
            <p className="text-gray-400 mt-1">Requests a report, dataset, API result, or service.</p>
          </div>
          <div className="rounded-lg border border-cyan-900 bg-gray-950/60 p-3">
            <div className="text-cyan-300 font-semibold">Budget control</div>
            <p className="text-gray-400 mt-1">Provider calls setBudget before escrow funding.</p>
          </div>
          <div className="rounded-lg border border-cyan-900 bg-gray-950/60 p-3">
            <div className="text-cyan-300 font-semibold">USDC escrow</div>
            <p className="text-gray-400 mt-1">Arc Testnet tx hashes can be bound to the job.</p>
          </div>
          <div className="rounded-lg border border-cyan-900 bg-gray-950/60 p-3">
            <div className="text-cyan-300 font-semibold">Receipt</div>
            <p className="text-gray-400 mt-1">Auditable proof for agent identity and settlement.</p>
          </div>
        </div>
      </section>

      {/* Create form */}
      {showCreate && (
        <div className="rounded-xl border border-blue-800 bg-blue-950/20 p-6">
          <h2 className="text-base font-semibold text-white mb-4">
            Create New Agentic Commerce Job
          </h2>
          <CreateJobForm onCreated={handleCreated} verifiedIdentity={verifiedIdentity} />
        </div>
      )}

      {/* Lifecycle legend */}
      <div className="flex flex-wrap gap-2 text-xs text-gray-500">
        <span>Lifecycle:</span>
        {(["draft", "open", "budgeted", "funded", "submitted", "settled", "failed"] as const).map(
          (s) => (
            <LifecycleBadge key={s} status={s} size="sm" />
          )
        )}
      </div>

      {/* Job list */}
      {loading ? (
        <p className="text-gray-500 text-sm">Loading jobs…</p>
      ) : error ? (
        <p className="text-red-400 text-sm">Error: {error}</p>
      ) : jobs.length === 0 ? (
        <p className="text-gray-500 text-sm">No jobs yet. Create one above.</p>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onUpdate={handleUpdate}
              verifiedIdentity={verifiedIdentity}
            />
          ))}
        </div>
      )}

      {/* Blueprint notice */}
      <div className="rounded-lg border border-gray-800 bg-gray-900/40 p-4 text-xs text-gray-600 space-y-1">
        <div className="font-semibold text-gray-500">Current Boundary / Challenge Features</div>
        <ul className="list-disc list-inside space-y-0.5">
          <li>✅ ERC-8004 identity verifier reads ownerOf/tokenURI from Arc Testnet</li>
          <li>
            ✅ Wallet-submitted ERC-8183 AgenticCommerce execution on Arc Testnet (
            <code>0x0747EEf0706327138c69792bF28Cd525089e4583</code>)
          </li>
          <li>✅ Official lifecycle includes provider setBudget before escrow funding</li>
          <li>🔷 Circle Wallets integration for server-driven escrow funding</li>
          <li>🔷 Gateway nanopayments for pay-per-report or pay-per-inference services</li>
          <li>🔷 Dynamic or Turnkey-style embedded wallet and policy signing path</li>
          <li>🔷 App Kit bridge / send / swap for chain-abstracted funding</li>
          <li>🔷 ERC-8004 agent identity registration</li>
        </ul>
      </div>
    </div>
  );
}
