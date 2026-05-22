// GET  /api/arc-settlement/jobs  – list all jobs
// POST /api/arc-settlement/jobs  – create a new job

import { NextRequest, NextResponse } from "next/server";
import { jobStore } from "@/lib/job-store";
import type { ArcSettlementJob } from "@/lib/types";

export function GET() {
  return NextResponse.json({ jobs: jobStore.list() });
}

export async function POST(req: NextRequest) {
  let body: Partial<ArcSettlementJob>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    clientAddress,
    providerAddress,
    evaluatorAddress,
    amount,
    currency,
    description,
    tradeProfile,
    agentIdentity,
  } = body;

  if (!clientAddress || !providerAddress || !evaluatorAddress || !amount || !description) {
    return NextResponse.json(
      {
        error:
          "Required fields: clientAddress, providerAddress, evaluatorAddress, amount, description",
      },
      { status: 422 }
    );
  }

  const job = jobStore.create({
    clientAddress,
    providerAddress,
    evaluatorAddress,
    amount,
    currency: currency ?? "USDC",
    description,
    tradeProfile,
    agentIdentity,
  });

  return NextResponse.json({ job }, { status: 201 });
}
