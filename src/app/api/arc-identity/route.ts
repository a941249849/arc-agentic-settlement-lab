import { NextResponse } from "next/server";
import {
  IDENTITY_REGISTRY,
  REPUTATION_REGISTRY,
  VALIDATION_REGISTRY,
} from "@/lib/arc-identity";
import { ARC_TESTNET_EXPLORER, ARC_TESTNET_RPC, arcTestnet } from "@/lib/arc-chain";

export function GET() {
  return NextResponse.json({
    product: "Arc Agentic Commerce Settlement",
    phase: "Challenge MVP - ERC-8004 Identity Proof",
    network: arcTestnet.name,
    chainId: arcTestnet.id,
    rpcUrl: ARC_TESTNET_RPC,
    explorerUrl: ARC_TESTNET_EXPLORER,
    contracts: {
      identityRegistry: IDENTITY_REGISTRY,
      reputationRegistry: REPUTATION_REGISTRY,
      validationRegistry: VALIDATION_REGISTRY,
    },
    supportedActions: [
      "prepare register(string) calldata",
      "verify ownerOf(agentId)",
      "verify tokenURI(agentId)",
      "attach verified identity to settlement jobs",
    ],
  });
}
