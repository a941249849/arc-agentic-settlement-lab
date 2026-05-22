// GET    /api/arc-settlement/jobs/[id]  – get one job
// PATCH  /api/arc-settlement/jobs/[id]  – update job status / lifecycle evidence
// DELETE /api/arc-settlement/jobs/[id]  – delete one job

import { NextRequest, NextResponse } from "next/server";
import { jobStore, isValidTransition, VALID_TRANSITIONS } from "@/lib/job-store";
import type { ArcAgentIdentity, JobStatus, TradeProfile } from "@/lib/types";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const job = jobStore.get(id);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }
  return NextResponse.json({ job });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const job = jobStore.get(id);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  let body: {
    status?: JobStatus;
    agentIdentity?: ArcAgentIdentity;
    tradeProfile?: TradeProfile;
    budgetAmount?: string;
    deliverableHash?: string;
    createTxHash?: string;
    setBudgetTxHash?: string;
    approveTxHash?: string;
    fundTxHash?: string;
    submitTxHash?: string;
    settleTxHash?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Validate state transition if a new status is requested
  if (body.status && body.status !== job.status) {
    if (!isValidTransition(job.status, body.status)) {
      return NextResponse.json(
        {
          error: `Invalid transition: ${job.status} → ${body.status}`,
          validTransitions: VALID_TRANSITIONS[job.status],
        },
        { status: 422 }
      );
    }
  }

  const updated = jobStore.update(id, body);
  return NextResponse.json({ job: updated });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const deleted = jobStore.delete(id);
  if (!deleted) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
