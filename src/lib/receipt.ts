// Deterministic receipt generation for Arc Agentic Settlement Lab
// Uses Node.js built-in crypto – server-side only, do not import in client components.

import { createHash } from "crypto";
import type { ArcSettlementJob, ArcSettlementReceipt } from "./types";
export { receiptToMarkdown } from "./receipt-format";

// ERC-8004 / ERC-8183 Arc Testnet contract addresses (from docs).
const ARC_IDENTITY_REGISTRY = "0x8004A818BFB912233c491871b3d84c89A494BD9e";

/**
 * Produce a deterministic SHA-256 receipt hash from the canonical receipt fields.
 * The hash covers all fields that matter for settlement integrity.
 */
function hashReceipt(canonical: Omit<ArcSettlementReceipt, "receiptHash">): string {
  const payload = JSON.stringify({
    jobId: canonical.jobId,
    lifecycleStatus: canonical.lifecycleStatus,
    clientAddress: canonical.clientAddress,
    providerAddress: canonical.providerAddress,
    evaluatorAddress: canonical.evaluatorAddress,
    amount: canonical.amount,
    currency: canonical.currency,
    deliverableHash: canonical.deliverableHash,
    txHashes: canonical.txHashes,
    settlementMode: canonical.settlementMode,
    createdAt: canonical.createdAt,
  });
  return createHash("sha256").update(payload).digest("hex");
}

/** Generate a receipt for a given job. */
export function generateReceipt(job: ArcSettlementJob): ArcSettlementReceipt {
  const base: Omit<ArcSettlementReceipt, "receiptHash"> = {
    receiptVersion: "arc-settlement-v1",
    network: "Arc Testnet",
    jobId: job.id,
    lifecycleStatus: job.status,
    clientAddress: job.clientAddress,
    providerAddress: job.providerAddress,
    evaluatorAddress: job.evaluatorAddress,
    amount: job.amount,
    currency: job.currency,
    deliverableHash: job.deliverableHash ?? "",
    txHashes: {
      create: job.createTxHash,
      fund: job.fundTxHash,
      submit: job.submitTxHash,
      settle: job.settleTxHash,
    },
    agentIdentity: {
      standard: "ERC-8004",
      registryAddress: ARC_IDENTITY_REGISTRY,
      agentId: undefined,
    },
    settlementMode: job.settlementMode,
    createdAt: job.createdAt,
  };

  const receiptHash = hashReceipt(base);
  return { ...base, receiptHash };
}
