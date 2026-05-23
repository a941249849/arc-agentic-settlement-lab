// GET /api/arc-settlement/jobs/[id]/receipt
// POST /api/arc-settlement/jobs/[id]/receipt
// Generate and return a deterministic, verified settlement receipt for the given job.

import { NextRequest, NextResponse } from "next/server";
import { jobStore } from "@/lib/job-store";
import { generateReceipt } from "@/lib/receipt";
import type { ArcSettlementJob } from "@/lib/types";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const job = jobStore.get(id);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }
  const receipt = await generateReceipt(job);
  return NextResponse.json({ receipt });
}

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  let body: { job?: ArcSettlementJob };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const job = body.job;
  if (!job) {
    return NextResponse.json({ error: "Missing job object in body" }, { status: 400 });
  }

  // Ensure ID matches
  if (job.id !== id) {
    return NextResponse.json({ error: "Job ID mismatch" }, { status: 422 });
  }

  try {
    const receipt = await generateReceipt(job);
    return NextResponse.json({ receipt });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Receipt generation failed" },
      { status: 500 }
    );
  }
}

