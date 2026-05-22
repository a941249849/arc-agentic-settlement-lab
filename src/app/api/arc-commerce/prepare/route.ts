import { NextRequest, NextResponse } from "next/server";
import { prepareCommerceTx, type ArcCommerceAction } from "@/lib/arc-commerce";
import { arcTestnet } from "@/lib/arc-chain";

export async function POST(req: NextRequest) {
  let body: {
    action?: ArcCommerceAction;
    providerAddress?: string;
    evaluatorAddress?: string;
    description?: string;
    expiredAt?: string;
    onchainJobId?: string;
    amount?: string;
    deliverableHash?: string;
    reason?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.action) {
    return NextResponse.json({ error: "action is required" }, { status: 422 });
  }

  try {
    const tx = prepareCommerceTx({ ...body, action: body.action });
    return NextResponse.json({
      chainId: arcTestnet.id,
      tx: {
        ...tx,
        value: "0x0",
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to prepare transaction" },
      { status: 422 }
    );
  }
}
