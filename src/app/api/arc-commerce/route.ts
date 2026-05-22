import { NextResponse } from "next/server";
import { arcTestnet, ARC_TESTNET_EXPLORER, ARC_TESTNET_RPC } from "@/lib/arc-chain";
import { AGENTIC_COMMERCE_CONTRACT, ARC_USDC } from "@/lib/arc-commerce";

export function GET() {
  return NextResponse.json({
    product: "Arc Agentic Commerce Settlement",
    phase: "Challenge MVP - ERC-8183 Wallet Execution",
    network: arcTestnet.name,
    chainId: arcTestnet.id,
    rpcUrl: ARC_TESTNET_RPC,
    explorerUrl: ARC_TESTNET_EXPLORER,
    contracts: {
      agenticCommerce: AGENTIC_COMMERCE_CONTRACT,
      usdc: ARC_USDC,
    },
    actions: ["createJob", "setBudget", "approve", "fund", "submit", "complete"],
  });
}
