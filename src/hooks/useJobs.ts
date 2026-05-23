"use client";

import { useState, useEffect, useCallback } from "react";
import type { ArcSettlementJob, ArcSettlementReceipt, JobStatus } from "@/lib/types";

const STORAGE_KEY = "arc-agentic-settlement-jobs-v1";

const VALID_TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  draft: ["open", "failed"],
  open: ["budgeted", "failed"],
  budgeted: ["funded", "failed"],
  funded: ["submitted", "failed"],
  submitted: ["settled", "failed"],
  settled: [],
  failed: [],
};

function sortJobs(jobs: ArcSettlementJob[]) {
  return [...jobs].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

function isLegacySeedJob(job: ArcSettlementJob) {
  return (
    job.clientAddress === "0x1111111111111111111111111111111111111111" &&
    job.providerAddress === "0x2222222222222222222222222222222222222222" &&
    job.evaluatorAddress === "0x3333333333333333333333333333333333333333" &&
    job.settlementMode === "simulated" &&
    !job.createTxHash
  );
}

function readJobs(): ArcSettlementJob[] {
  if (typeof window === "undefined") return [];
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  try {
    const parsed = JSON.parse(stored) as ArcSettlementJob[];
    if (!Array.isArray(parsed)) throw new Error("Stored jobs are not an array");
    const jobs = sortJobs(parsed.filter((job) => !isLegacySeedJob(job)));
    if (jobs.length !== parsed.length) writeJobs(jobs);
    return jobs;
  } catch {
    writeJobs([]);
    return [];
  }
}

function writeJobs(jobs: ArcSettlementJob[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sortJobs(jobs)));
}

function updateStoredJob(
  id: string,
  patch: Partial<ArcSettlementJob>
): ArcSettlementJob {
  const jobs = readJobs();
  const existing = jobs.find((job) => job.id === id);
  if (!existing) throw new Error("Job not found");

  if (patch.status && patch.status !== existing.status) {
    const startingArcExecution = patch.status === "open" && Boolean(patch.createTxHash);
    const valid = startingArcExecution || VALID_TRANSITIONS[existing.status]?.includes(patch.status);
    if (!valid) throw new Error(`Invalid transition: ${existing.status} -> ${patch.status}`);
  }

  const updated: ArcSettlementJob = {
    ...existing,
    ...patch,
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
  };
  writeJobs(jobs.map((job) => (job.id === id ? updated : job)));
  return updated;
}

function orderedReceiptPayload(canonical: Omit<ArcSettlementReceipt, "receiptHash">) {
  return {
    jobId: canonical.jobId,
    onchainJobId: canonical.onchainJobId,
    lifecycleStatus: canonical.lifecycleStatus,
    clientAddress: canonical.clientAddress,
    providerAddress: canonical.providerAddress,
    evaluatorAddress: canonical.evaluatorAddress,
    amount: canonical.amount,
    currency: canonical.currency,
    tradeProfile: canonical.tradeProfile,
    budget: canonical.budget,
    deliverableHash: canonical.deliverableHash,
    txHashes: canonical.txHashes,
    agentIdentity: canonical.agentIdentity,
    agentReview: canonical.agentReview,
    settlementMode: canonical.settlementMode,
    createdAt: canonical.createdAt,
  };
}

async function sha256Hex(value: string) {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function generateClientReceipt(job: ArcSettlementJob): Promise<ArcSettlementReceipt> {
  const base: Omit<ArcSettlementReceipt, "receiptHash"> = {
    receiptVersion: "arc-settlement-v1",
    network: "Arc Testnet",
    jobId: job.id,
    onchainJobId: job.onchainJobId,
    lifecycleStatus: job.status,
    clientAddress: job.clientAddress,
    providerAddress: job.providerAddress,
    evaluatorAddress: job.evaluatorAddress,
    amount: job.amount,
    currency: job.currency,
    tradeProfile: job.tradeProfile,
    budget: {
      amount: job.budgetAmount ?? job.amount,
      txHash: job.setBudgetTxHash,
    },
    deliverableHash: job.deliverableHash ?? "",
    txHashes: {
      create: job.createTxHash,
      setBudget: job.setBudgetTxHash,
      approve: job.approveTxHash,
      fund: job.fundTxHash,
      submit: job.submitTxHash,
      settle: job.settleTxHash,
    },
    agentIdentity: job.agentIdentity,
    agentReview: job.agentReview,
    settlementMode: job.settlementMode,
    createdAt: job.createdAt,
  };

  const receiptHash = await sha256Hex(JSON.stringify(orderedReceiptPayload(base)));
  return { ...base, receiptHash };
}

export function useJobs() {
  const [jobs, setJobs] = useState<ArcSettlementJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    try {
      setJobs(readJobs());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(refresh, 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  return { jobs, loading, error, refresh };
}

export async function createJob(
  data: Pick<
    ArcSettlementJob,
    | "clientAddress"
    | "providerAddress"
    | "evaluatorAddress"
    | "amount"
    | "currency"
    | "description"
    | "tradeProfile"
    | "agentIdentity"
  >
): Promise<ArcSettlementJob> {
  const jobs = readJobs();
  const now = new Date().toISOString();
  const job: ArcSettlementJob = {
    ...data,
    id: crypto.randomUUID(),
    status: "draft",
    createdAt: now,
    updatedAt: now,
    settlementMode: "simulated",
  };
  writeJobs([job, ...jobs]);
  return job;
}

export async function updateJob(
  id: string,
  patch: Partial<ArcSettlementJob>
): Promise<ArcSettlementJob> {
  return updateStoredJob(id, patch);
}

export async function deleteJob(id: string): Promise<void> {
  writeJobs(readJobs().filter((job) => job.id !== id));
}

export async function fetchReceipt(id: string) {
  const job = readJobs().find((item) => item.id === id);
  if (!job) throw new Error("Job not found");
  return generateClientReceipt(job);
}
