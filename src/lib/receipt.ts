// Deterministic receipt generation for Arc Trade Agent Settlement.
// Uses Node.js built-in crypto – server-side only, do not import in client components.

import { createHash } from "crypto";
import { createPublicClient, http, type Hex } from "viem";
import { arcTestnet, ARC_TESTNET_RPC } from "./arc-chain";
import {
  agenticCommerceAbi,
  AGENTIC_COMMERCE_CONTRACT,
  ARC_USDC,
  getCommerceJob,
} from "./arc-commerce";
import type { ArcSettlementJob, ArcSettlementReceipt, JobStatus, SettlementMode } from "./types";
export { receiptToMarkdown } from "./receipt-format";

const publicClient = createPublicClient({
  chain: arcTestnet,
  transport: http(ARC_TESTNET_RPC),
});

/**
 * Verify transaction hashes against Arc Testnet and sync state from the blockchain.
 */
export async function verifyOnchainEvidence(job: ArcSettlementJob): Promise<{
  verifiedMode: SettlementMode;
  verifiedStatus: JobStatus;
  verifiedBudgetAmount: string;
}> {
  if (!job.createTxHash || !job.onchainJobId) {
    return {
      verifiedMode: "simulated",
      verifiedStatus: "draft",
      verifiedBudgetAmount: job.budgetAmount ?? job.amount,
    };
  }

  let verifiedMode: SettlementMode = "onchain-partial";
  let verifiedStatus: JobStatus = job.status;
  let verifiedBudgetAmount = job.budgetAmount ?? job.amount;

  try {
    // 1. Verify createTxHash
    const createReceipt = await publicClient.getTransactionReceipt({ hash: job.createTxHash as Hex });
    const createOk =
      createReceipt.status === "success" &&
      createReceipt.to?.toLowerCase() === AGENTIC_COMMERCE_CONTRACT.toLowerCase();

    if (!createOk) {
      throw new Error("Invalid or failed job creation transaction");
    }

    // 2. Fetch the current state from the contract using getJob()
    const chainJob = await getCommerceJob(job.onchainJobId);

    // Map contract job status to local JobStatus
    // 0: Open, 1: Funded, 2: Submitted, 3: Completed, 4: Rejected, 5: Expired
    if (chainJob.status === 0) {
      verifiedStatus = job.setBudgetTxHash ? "budgeted" : "open";
    } else if (chainJob.status === 1) {
      verifiedStatus = "funded";
    } else if (chainJob.status === 2) {
      verifiedStatus = "submitted";
    } else if (chainJob.status === 3) {
      verifiedStatus = "settled";
    } else {
      verifiedStatus = "failed";
    }

    verifiedBudgetAmount = chainJob.budget;

    // 3. Verify other transaction hashes if present
    let setBudgetOk = false;
    if (job.setBudgetTxHash) {
      const receipt = await publicClient.getTransactionReceipt({ hash: job.setBudgetTxHash as Hex });
      setBudgetOk =
        receipt.status === "success" &&
        receipt.to?.toLowerCase() === AGENTIC_COMMERCE_CONTRACT.toLowerCase();
    }

    let approveOk = false;
    if (job.approveTxHash) {
      const receipt = await publicClient.getTransactionReceipt({ hash: job.approveTxHash as Hex });
      approveOk =
        receipt.status === "success" && receipt.to?.toLowerCase() === ARC_USDC.toLowerCase();
    }

    let fundOk = false;
    if (job.fundTxHash) {
      const receipt = await publicClient.getTransactionReceipt({ hash: job.fundTxHash as Hex });
      fundOk =
        receipt.status === "success" &&
        receipt.to?.toLowerCase() === AGENTIC_COMMERCE_CONTRACT.toLowerCase();
    }

    let submitOk = false;
    if (job.submitTxHash) {
      const receipt = await publicClient.getTransactionReceipt({ hash: job.submitTxHash as Hex });
      submitOk =
        receipt.status === "success" &&
        receipt.to?.toLowerCase() === AGENTIC_COMMERCE_CONTRACT.toLowerCase();
    }

    let settleOk = false;
    if (job.settleTxHash) {
      const receipt = await publicClient.getTransactionReceipt({ hash: job.settleTxHash as Hex });
      settleOk =
        receipt.status === "success" &&
        receipt.to?.toLowerCase() === AGENTIC_COMMERCE_CONTRACT.toLowerCase();
    }

    // Check if fully verified (all steps completed onchain)
    if (createOk && setBudgetOk && approveOk && fundOk && submitOk && settleOk) {
      verifiedMode = "onchain-verified";
    }
  } catch (err) {
    console.error("Onchain verification failed: ", err);
    verifiedMode = "onchain-partial";
  }

  return {
    verifiedMode,
    verifiedStatus,
    verifiedBudgetAmount,
  };
}

/**
 * Produce a deterministic SHA-256 receipt hash from the canonical receipt fields.
 */
function hashReceipt(canonical: Omit<ArcSettlementReceipt, "receiptHash">): string {
  const ordered = [
    ["jobId", canonical.jobId],
    ["onchainJobId", canonical.onchainJobId],
    ["lifecycleStatus", canonical.lifecycleStatus],
    ["clientAddress", canonical.clientAddress],
    ["providerAddress", canonical.providerAddress],
    ["evaluatorAddress", canonical.evaluatorAddress],
    ["amount", canonical.amount],
    ["currency", canonical.currency],
    ["tradeProfile", canonical.tradeProfile],
    ["budget", canonical.budget],
    ["deliverableHash", canonical.deliverableHash],
    ["txHashes", canonical.txHashes],
    ["agentIdentity", canonical.agentIdentity],
    ["agentReview", canonical.agentReview],
    ["settlementMode", canonical.settlementMode],
    ["createdAt", canonical.createdAt],
  ] as const;
  const payload = JSON.stringify(Object.fromEntries(ordered));
  return createHash("sha256").update(payload).digest("hex");
}

/** Generate a receipt for a given job. */
export async function generateReceipt(job: ArcSettlementJob): Promise<ArcSettlementReceipt> {
  // Verify evidence onchain first
  const { verifiedMode, verifiedStatus, verifiedBudgetAmount } = await verifyOnchainEvidence(job);

  const base: Omit<ArcSettlementReceipt, "receiptHash"> = {
    receiptVersion: "arc-settlement-v1",
    network: "Arc Testnet",
    jobId: job.id,
    onchainJobId: job.onchainJobId,
    lifecycleStatus: verifiedStatus,
    clientAddress: job.clientAddress,
    providerAddress: job.providerAddress,
    evaluatorAddress: job.evaluatorAddress,
    amount: job.amount,
    currency: job.currency,
    tradeProfile: job.tradeProfile,
    budget: {
      amount: verifiedBudgetAmount,
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
    agentReview: job.agentReview,
    settlementMode: verifiedMode,
    createdAt: job.createdAt,
  };

  const receiptHash = hashReceipt(base);
  return { ...base, receiptHash };
}

