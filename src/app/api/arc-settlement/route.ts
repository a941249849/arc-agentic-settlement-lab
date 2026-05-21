// GET /api/arc-settlement
// Returns the Arc Agentic Settlement Lab blueprint: Arc contract addresses,
// lifecycle states, capability matrix, and receipt schema.

import { NextResponse } from "next/server";
import { arcSettlementBlueprint } from "@/lib/arc-blueprint";

export function GET() {
  return NextResponse.json(arcSettlementBlueprint);
}
