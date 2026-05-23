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

function deriveStatusFromEvidence(job: ArcSettlementJob): JobStatus {
  if (!job.createTxHash || !job.onchainJobId) return "draft";
  if (job.settleTxHash) return "settled";
  if (job.submitTxHash) return "submitted";
  if (job.fundTxHash) return "funded";
  if (job.setBudgetTxHash) return "budgeted";
  return "open";
}

function normalizeJob(job: ArcSettlementJob): ArcSettlementJob {
  const status = deriveStatusFromEvidence(job);
  const settlementMode =
    status === "draft"
      ? "simulated"
      : job.settleTxHash && job.createTxHash && job.setBudgetTxHash && job.approveTxHash && job.fundTxHash && job.submitTxHash
      ? "onchain-verified"
      : "onchain-partial";

  if (status === job.status && settlementMode === job.settlementMode) return job;

  return {
    ...job,
    status,
    settlementMode,
    updatedAt: job.updatedAt ?? job.createdAt,
  };
}

function readJobs(): ArcSettlementJob[] {
  if (typeof window === "undefined") return [];
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  try {
    const parsed = JSON.parse(stored) as ArcSettlementJob[];
    if (!Array.isArray(parsed)) throw new Error("Stored jobs are not an array");
    const jobs = sortJobs(parsed.filter((job) => !isLegacySeedJob(job)).map(normalizeJob));
    if (JSON.stringify(jobs) !== JSON.stringify(sortJobs(parsed))) writeJobs(jobs);
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
    const startingArcExecution =
      existing.status === "draft" && patch.status === "open" && Boolean(patch.createTxHash);
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

export async function fetchReceipt(id: string): Promise<ArcSettlementReceipt> {
  const job = readJobs().find((item) => item.id === id);
  if (!job) throw new Error("Job not found");

  const res = await fetch(`/api/arc-settlement/jobs/${id}/receipt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ job }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? "Failed to fetch verified receipt");
  }
  return data.receipt;
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


