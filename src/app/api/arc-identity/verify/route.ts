import { NextRequest, NextResponse } from "next/server";
import { verifyAgentIdentity } from "@/lib/arc-identity";

export async function POST(req: NextRequest) {
  let body: {
    agentId?: string;
    expectedOwnerAddress?: string;
    expectedMetadataURI?: string;
    registerTxHash?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.agentId?.trim()) {
    return NextResponse.json({ error: "agentId is required" }, { status: 422 });
  }

  try {
    const result = await verifyAgentIdentity({
      agentId: body.agentId.trim(),
      expectedOwnerAddress: body.expectedOwnerAddress?.trim() || undefined,
      expectedMetadataURI: body.expectedMetadataURI?.trim() || undefined,
      registerTxHash: body.registerTxHash?.trim() || undefined,
    });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Identity verification failed",
      },
      { status: 422 }
    );
  }
}
