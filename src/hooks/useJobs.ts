"use client";

import { useState, useEffect, useCallback } from "react";
import type { ArcSettlementJob } from "@/lib/types";

async function fetchJobs(): Promise<ArcSettlementJob[]> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch("/api/arc-settlement/jobs", {
      cache: "no-store",
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.jobs as ArcSettlementJob[];
  } finally {
    window.clearTimeout(timeout);
  }
}

export function useJobs() {
  const [jobs, setJobs] = useState<ArcSettlementJob[]>([]);
  // Start as true so we don't flash an empty list before the first fetch
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    fetchJobs()
      .then((data) => {
        setJobs(data);
        setError(null);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to fetch jobs: unknown error"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let cancelled = false;
    // loading is already true from initial state; no need to set it again
    fetchJobs()
      .then((data) => {
        if (!cancelled) {
          setJobs(data);
          setError(null);
        }
      })
      .catch((e) => {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Failed to fetch jobs: unknown error");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
  const res = await fetch("/api/arc-settlement/jobs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  const { job } = await res.json();
  return job;
}

export async function updateJob(
  id: string,
  patch: Partial<ArcSettlementJob>
): Promise<ArcSettlementJob> {
  const res = await fetch(`/api/arc-settlement/jobs/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  const { job } = await res.json();
  return job;
}

export async function deleteJob(id: string): Promise<void> {
  const res = await fetch(`/api/arc-settlement/jobs/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
}

export async function fetchReceipt(id: string) {
  const res = await fetch(`/api/arc-settlement/jobs/${id}/receipt`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const { receipt } = await res.json();
  return receipt;
}
