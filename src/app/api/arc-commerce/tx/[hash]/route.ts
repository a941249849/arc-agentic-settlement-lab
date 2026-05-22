import { NextResponse } from "next/server";
import { isHex } from "viem";
import { inspectCommerceTx } from "@/lib/arc-commerce";

type Params = { params: Promise<{ hash: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { hash } = await params;
  if (!isHex(hash)) {
    return NextResponse.json({ error: "Invalid transaction hash" }, { status: 422 });
  }

  try {
    const tx = await inspectCommerceTx(hash);
    return NextResponse.json({ tx });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Transaction not indexed yet" },
      { status: 404 }
    );
  }
}
