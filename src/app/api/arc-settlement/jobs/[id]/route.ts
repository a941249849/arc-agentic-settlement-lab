// GET   /api/arc-settlement/jobs/[id]  – get one job
// PATCH /api/arc-settlement/jobs/[id]  – update job status / deliverable hash

import { NextRequest, NextResponse } from "next/server";
import { jobStore, isValidTransition } from "@/lib/job-store";
import type { JobStatus } from "@/lib/types";

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
    deliverableHash?: string;
    createTxHash?: string;
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
          validTransitions: [],
        },
        { status: 422 }
      );
    }
  }

  const updated = jobStore.update(id, body);
  return NextResponse.json({ job: updated });
}
