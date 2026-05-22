import { NextResponse } from "next/server";
import { getCommerceJob } from "@/lib/arc-commerce";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  try {
    const job = await getCommerceJob(id);
    return NextResponse.json({ job });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to read ERC-8183 job" },
      { status: 422 }
    );
  }
}
