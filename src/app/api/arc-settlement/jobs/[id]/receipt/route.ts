// GET /api/arc-settlement/jobs/[id]/receipt
// Generate and return a deterministic settlement receipt for the given job.

import { NextRequest, NextResponse } from "next/server";
import { jobStore } from "@/lib/job-store";
import { generateReceipt } from "@/lib/receipt";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const job = jobStore.get(id);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }
  const receipt = generateReceipt(job);
  return NextResponse.json({ receipt });
}
