import { NextRequest, NextResponse } from "next/server";
import { prepareAgentRegistration } from "@/lib/arc-identity";

export async function POST(req: NextRequest) {
  let body: { metadataURI?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.metadataURI?.trim()) {
    return NextResponse.json({ error: "metadataURI is required" }, { status: 422 });
  }

  return NextResponse.json({
    registration: prepareAgentRegistration(body.metadataURI.trim()),
  });
}

