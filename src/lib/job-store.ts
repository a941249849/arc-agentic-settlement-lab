// In-memory job store for Arc Agentic Commerce Settlement.
// In a production deployment this would be replaced with a persistent database.

import { randomUUID } from "crypto";
import type { ArcSettlementJob, JobStatus } from "./types";

// Singleton store – lives for the lifetime of the Node.js process.
const jobs = new Map<string, ArcSettlementJob>();

/** Seed a couple of demo jobs so the UI has something to show on first load. */
function seed() {
  if (jobs.size > 0) return;
  const now = new Date().toISOString();

  const demo: Omit<ArcSettlementJob, "id"> = {
    status: "open",
    clientAddress: "0x1111111111111111111111111111111111111111",
    providerAddress: "0x2222222222222222222222222222222222222222",
    evaluatorAddress: "0x3333333333333333333333333333333333333333",
    amount: "25.00",
    currency: "USDC",
    description:
      "Buyer agent purchases a market-intelligence report, locks a USDC budget, and releases payment after deliverable verification.",
    createdAt: now,
    updatedAt: now,
    settlementMode: "simulated",
  };

  const id = randomUUID();
  jobs.set(id, { ...demo, id });
}

seed();

export const jobStore = {
  /** Return all jobs sorted newest-first */
  list(): ArcSettlementJob[] {
    return [...jobs.values()].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  get(id: string): ArcSettlementJob | undefined {
    return jobs.get(id);
  },

  create(
    data: Omit<ArcSettlementJob, "id" | "status" | "createdAt" | "updatedAt" | "settlementMode">
  ): ArcSettlementJob {
    const now = new Date().toISOString();
    const job: ArcSettlementJob = {
      ...data,
      id: randomUUID(),
      status: "draft",
      createdAt: now,
      updatedAt: now,
      settlementMode: "simulated",
    };
    jobs.set(job.id, job);
    return job;
  },

  /** Apply a partial update.  Returns the updated job or undefined when not found. */
  update(
    id: string,
    patch: Partial<
      Omit<ArcSettlementJob, "id" | "createdAt">
    >
  ): ArcSettlementJob | undefined {
    const job = jobs.get(id);
    if (!job) return undefined;
    const updated: ArcSettlementJob = {
      ...job,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    jobs.set(id, updated);
    return updated;
  },

  delete(id: string): boolean {
    return jobs.delete(id);
  },
};

/** Valid lifecycle state-machine transitions */
export const VALID_TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  draft: ["open", "failed"],
  open: ["budgeted", "failed"],
  budgeted: ["funded", "failed"],
  funded: ["submitted", "failed"],
  submitted: ["settled", "failed"],
  settled: [],
  failed: [],
};

export function isValidTransition(from: JobStatus, to: JobStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}
