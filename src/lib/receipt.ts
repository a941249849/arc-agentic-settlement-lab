// Deterministic receipt generation for Arc Agentic Settlement Lab
// Uses Node.js built-in crypto – server-side only, do not import in client components.

import { createHash } from "crypto";
import type { ArcSettlementJob, ArcSettlementReceipt } from "./types";
export { receiptToMarkdown } from "./receipt-format";

/**
 * Produce a deterministic SHA-256 receipt hash from the canonical receipt fields.
 * The hash covers all fields that matter for settlement integrity.
 *
 * Key ordering is deterministic because the object literal is constructed with a
 * fixed key sequence in source code.  All string values are already stable types.
 * Nested txHashes may be sparse; undefined values are omitted by JSON.stringify
 * which is consistent across calls given the same input.
 */
function hashReceipt(canonical: Omit<ArcSettlementReceipt, "receiptHash">): string {
  // Build a stable serialisation with an explicit, fixed key order.
  const ordered = [
    ["jobId", canonical.jobId],
    ["lifecycleStatus", canonical.lifecycleStatus],
    ["clientAddress", canonical.clientAddress],
    ["providerAddress", canonical.providerAddress],
    ["evaluatorAddress", canonical.evaluatorAddress],
    ["amount", canonical.amount],
    ["currency", canonical.currency],
    ["budget", canonical.budget],
    ["deliverableHash", canonical.deliverableHash],
    ["txHashes", canonical.txHashes],
    ["agentIdentity", canonical.agentIdentity],
    ["settlementMode", canonical.settlementMode],
    ["createdAt", canonical.createdAt],
  ] as const;
  const payload = JSON.stringify(Object.fromEntries(ordered));
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
    budget: {
      amount: job.budgetAmount ?? job.amount,
      txHash: job.setBudgetTxHash,
    },
    deliverableHash: job.deliverableHash ?? "",
    txHashes: {
      create: job.createTxHash,
      setBudget: job.setBudgetTxHash,
      approve: job.approveTxHash,
      fund: job.fundTxHash,
      submit: job.submitTxHash,
      settle: job.settleTxHash,
    },
    agentIdentity: job.agentIdentity,
    settlementMode: job.settlementMode,
    createdAt: job.createdAt,
  };

  const receiptHash = hashReceipt(base);
  return { ...base, receiptHash };
}
