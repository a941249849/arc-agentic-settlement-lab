import { createHash } from "crypto";
import { NextResponse } from "next/server";
import type { AgentReview, AgentReviewCheck, ArcSettlementJob } from "@/lib/types";
import { createPublicClient, createWalletClient, http, encodeFunctionData } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arcTestnet, ARC_TESTNET_RPC } from "@/lib/arc-chain";
import { AGENTIC_COMMERCE_CONTRACT, agenticCommerceAbi, toBytes32 } from "@/lib/arc-commerce";

const AGENT_PRIVATE_KEY = process.env.EVALUATOR_PRIVATE_KEY || "0x7e7e7e7e7e7e7e7e7e7e7e7e7e7e7e7e7e7e7e7e7e7e7e7e7e7e7e7e7e7e7e7e";
const AI_EVALUATOR_ADDRESS = "0x3C6E03FB0CAE74925098CfbfB09e173ee9a54B68";

type ReviewRequest = {
  job?: ArcSettlementJob;
  deliverableHash?: string;
};

type LlmReview = Pick<AgentReview, "summary" | "reasons" | "conditions">;

const POLICY_VERSION = "arc-evaluator-v1" as const;

function normalize(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function addCheck(checks: AgentReviewCheck[], check: AgentReviewCheck) {
  checks.push(check);
}

function checkAmount(job: ArcSettlementJob, checks: AgentReviewCheck[]) {
  const amount = Number(job.amount);
  if (Number.isFinite(amount) && amount > 0) {
    addCheck(checks, {
      label: "Settlement amount",
      status: "pass",
      detail: `${job.amount} ${job.currency} is valid for a payable settlement.`,
    });
    return;
  }
  addCheck(checks, {
    label: "Settlement amount",
    status: "fail",
    detail: "Amount must be greater than zero before the evaluator can approve release.",
  });
}

function checkTradeContext(job: ArcSettlementJob, checks: AgentReviewCheck[]) {
  const profile = job.tradeProfile;
  if (!profile) {
    addCheck(checks, {
      label: "Trade context",
      status: "fail",
      detail: "Missing invoice, parties, route, and goods or service context.",
    });
    return;
  }

  const missing = [
    ["invoice ID", profile.invoiceId],
    ["buyer country", profile.buyerCountry],
    ["supplier country", profile.supplierCountry],
    ["goods or service", profile.goodsOrService],
  ].filter(([, value]) => !normalize(value));

  if (missing.length) {
    addCheck(checks, {
      label: "Trade context",
      status: "fail",
      detail: `Missing ${missing.map(([label]) => label).join(", ")}.`,
    });
  } else {
    addCheck(checks, {
      label: "Trade context",
      status: "pass",
      detail: `${profile.invoiceId} covers ${profile.goodsOrService} from ${profile.supplierCountry} to ${profile.buyerCountry}.`,
    });
  }

  if (normalize(profile.buyerCountry).toLowerCase() === normalize(profile.supplierCountry).toLowerCase()) {
    addCheck(checks, {
      label: "Cross-border route",
      status: "warning",
      detail: "Buyer and supplier countries match, so this looks less like cross-border settlement.",
    });
  } else {
    addCheck(checks, {
      label: "Cross-border route",
      status: "pass",
      detail: "Buyer and supplier jurisdictions are distinct.",
    });
  }

  if (profile.complianceCheck === "needs-review") {
    addCheck(checks, {
      label: "Compliance state",
      status: "warning",
      detail: "Compliance is marked needs-review; evaluator should retain manual oversight.",
    });
  } else {
    addCheck(checks, {
      label: "Compliance state",
      status: "pass",
      detail: `Compliance state is ${profile.complianceCheck}.`,
    });
  }
}

function checkDeliverable(
  job: ArcSettlementJob,
  deliverableHash: string,
  checks: AgentReviewCheck[]
) {
  const value = normalize(deliverableHash || job.deliverableHash);
  if (!value) {
    addCheck(checks, {
      label: "Delivery proof",
      status: "fail",
      detail: "A sha256 or IPFS deliverable reference is required before settlement release.",
    });
    return;
  }

  if (value.startsWith("sha256:") || value.startsWith("ipfs://")) {
    addCheck(checks, {
      label: "Delivery proof",
      status: "pass",
      detail: "Deliverable uses a portable content reference.",
    });
    return;
  }

  addCheck(checks, {
    label: "Delivery proof",
    status: "warning",
    detail: "Deliverable exists, but does not use sha256: or ipfs:// format.",
  });
}

function checkBudget(job: ArcSettlementJob, checks: AgentReviewCheck[]) {
  if (!job.budgetAmount) {
    addCheck(checks, {
      label: "Escrow budget",
      status: job.status === "submitted" || job.status === "settled" ? "warning" : "fail",
      detail: "Provider budget is not recorded.",
    });
    return;
  }

  if (Number(job.budgetAmount) === Number(job.amount)) {
    addCheck(checks, {
      label: "Escrow budget",
      status: "pass",
      detail: "Budget matches the requested settlement amount.",
    });
    return;
  }

  addCheck(checks, {
    label: "Escrow budget",
    status: "warning",
    detail: `Budget ${job.budgetAmount} differs from requested amount ${job.amount}.`,
  });
}

function checkOnchainState(job: ArcSettlementJob, checks: AgentReviewCheck[]) {
  if (job.settlementMode === "simulated") {
    addCheck(checks, {
      label: "Arc execution evidence",
      status: "warning",
      detail: "Arc transaction evidence is not recorded yet. Execute on Arc Testnet before treating this as a final settlement.",
    });
    return;
  }

  if (job.submitTxHash) {
    addCheck(checks, {
      label: "Arc execution evidence",
      status: "pass",
      detail: "Submit transaction hash is recorded before release review.",
    });
  } else {
    addCheck(checks, {
      label: "Arc execution evidence",
      status: "warning",
      detail: "Onchain mode is active, but submit transaction hash is not recorded yet.",
    });
  }
}

function checkAgentIdentity(job: ArcSettlementJob, checks: AgentReviewCheck[]) {
  if (job.agentIdentity?.isVerified) {
    addCheck(checks, {
      label: "Agent identity",
      status: "pass",
      detail: `ERC-8004 agent #${job.agentIdentity.agentId} is attached and verified.`,
    });
    return;
  }

  addCheck(checks, {
    label: "Agent identity",
    status: "warning",
    detail: "No verified ERC-8004 identity is attached. The payment can be reviewed, but reputation is weaker.",
  });
}

function deterministicReview(job: ArcSettlementJob, deliverableHash: string): AgentReview {
  const checks: AgentReviewCheck[] = [];
  checkAmount(job, checks);
  checkTradeContext(job, checks);
  checkDeliverable(job, deliverableHash, checks);
  checkBudget(job, checks);
  checkOnchainState(job, checks);
  checkAgentIdentity(job, checks);

  const failCount = checks.filter((check) => check.status === "fail").length;
  const warningCount = checks.filter((check) => check.status === "warning").length;
  const confidence = Math.max(0.25, Math.min(0.98, 0.94 - failCount * 0.24 - warningCount * 0.06));
  const verdict = failCount > 0 ? "reject" : confidence >= 0.72 ? "approve" : "needs_review";
  const reviewedAt = new Date().toISOString();
  const reasons = checks
    .filter((check) => check.status !== "pass")
    .map((check) => `${check.label}: ${check.detail}`);
  const conditions =
    verdict === "approve"
      ? ["Release can proceed once the evaluator wallet signs the completion step."]
      : ["Resolve failed checks, rerun the AI evaluator, then release settlement."];

  const reviewBase = {
    policyVersion: POLICY_VERSION,
    jobId: job.id,
    onchainJobId: job.onchainJobId,
    status: job.status,
    amount: job.amount,
    currency: job.currency,
    tradeProfile: job.tradeProfile,
    deliverableHash: normalize(deliverableHash || job.deliverableHash),
    checks,
    verdict,
    confidence,
    reviewedAt,
  };
  const reviewHash = createHash("sha256").update(JSON.stringify(reviewBase)).digest("hex");

  return {
    agentName: "Arc Evaluator Agent",
    agentRole: "evaluator-agent",
    policyVersion: POLICY_VERSION,
    model: "deterministic-policy",
    verdict,
    confidence,
    summary:
      verdict === "approve"
        ? "Trade context, delivery evidence, and settlement controls are sufficient for evaluator release."
        : "The evaluator found missing or weak settlement evidence that must be resolved before release.",
    reasons: reasons.length ? reasons : ["All required settlement checks passed."],
    conditions,
    checks,
    reviewHash,
    reviewedAt,
  };
}

async function llmOverlay(job: ArcSettlementJob, base: AgentReview): Promise<LlmReview | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-5.1",
      input: [
        {
          role: "system",
          content:
            "You are an evaluator agent for Arc stablecoin commerce. Return strict JSON only with keys summary, reasons, conditions. Do not change verdicts or invent facts.",
        },
        {
          role: "user",
          content: JSON.stringify({
            job,
            deterministicReview: base,
          }),
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "arc_evaluator_overlay",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              summary: { type: "string" },
              reasons: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 6 },
              conditions: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 4 },
            },
            required: ["summary", "reasons", "conditions"],
          },
        },
      },
    }),
  });

  if (!response.ok) return null;
  const data = (await response.json()) as { output_text?: string };
  if (!data.output_text) return null;
  return JSON.parse(data.output_text) as LlmReview;
}

function attachFinalHash(job: ArcSettlementJob, review: AgentReview): AgentReview {
  const hashableReview = { ...review, reviewHash: "" };
  const reviewHash = createHash("sha256")
    .update(
      JSON.stringify({
        jobId: job.id,
        onchainJobId: job.onchainJobId,
        review: hashableReview,
      })
    )
    .digest("hex");
  return { ...review, reviewHash };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ReviewRequest;
    if (!body.job?.id) {
      return NextResponse.json({ error: "Missing settlement job" }, { status: 400 });
    }

    const base = deterministicReview(body.job, body.deliverableHash ?? "");
    const overlay = await llmOverlay(body.job, base).catch(() => null);
    const review: AgentReview = overlay
      ? { ...base, ...overlay, model: process.env.OPENAI_MODEL || "gpt-5.1" }
      : base;

    const attachedReview = attachFinalHash(body.job, review);

    // AI Agent Autonomous Settlement Release logic
    const isAiEvaluator =
      body.job.evaluatorAddress?.toLowerCase() === AI_EVALUATOR_ADDRESS.toLowerCase();
    
    let autoReleaseStatus = "none";
    let settleTxHash: string | undefined = undefined;
    let newStatus = body.job.status;
    let autoReleaseError: string | undefined = undefined;

    if (isAiEvaluator && review.verdict === "approve" && body.job.status === "submitted" && body.job.onchainJobId) {
      try {
        const account = privateKeyToAccount(AGENT_PRIVATE_KEY as `0x${string}`);
        const publicClient = createPublicClient({
          chain: arcTestnet,
          transport: http(ARC_TESTNET_RPC),
        });

        const balance = await publicClient.getBalance({ address: account.address });
        // Gas threshold: 2 * 10^15 wei (approx 0.002 USDC on Arc native gas)
        const gasLimitThreshold = BigInt(2000000000000000); 

        if (balance < gasLimitThreshold) {
          autoReleaseStatus = "insufficient-gas";
        } else {
          const walletClient = createWalletClient({
            account,
            chain: arcTestnet,
            transport: http(ARC_TESTNET_RPC),
          });

          const completeTx = {
            to: AGENTIC_COMMERCE_CONTRACT as `0x${string}`,
            data: encodeFunctionData({
              abi: agenticCommerceAbi,
              functionName: "complete",
              args: [BigInt(body.job.onchainJobId), toBytes32("approved"), "0x"],
            }),
          };

          const hash = await walletClient.sendTransaction({
            to: completeTx.to,
            data: completeTx.data,
          });

          const receipt = await publicClient.waitForTransactionReceipt({ hash });
          if (receipt.status === "success") {
            autoReleaseStatus = "success";
            settleTxHash = hash;
            newStatus = "settled";
          } else {
            autoReleaseStatus = "failed";
            autoReleaseError = "Transaction reverted on Arc Testnet";
          }
        }
      } catch (err) {
        autoReleaseStatus = "failed";
        autoReleaseError = err instanceof Error ? err.message : "Auto-release execution failed";
      }
    }

    return NextResponse.json({
      review: attachedReview,
      autoReleaseStatus,
      settleTxHash,
      status: newStatus,
      error: autoReleaseError,
      agentAddress: AI_EVALUATOR_ADDRESS,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Agent review failed" },
      { status: 500 }
    );
  }
}
