// Arc Trade Agent Settlement – type definitions
// These types mirror the ERC-8183 job lifecycle concepts from the Arc docs.

export type JobStatus =
  | "draft"
  | "open"
  | "budgeted"
  | "funded"
  | "submitted"
  | "settled"
  | "failed";

export type SettlementMode = "simulated" | "onchain-partial" | "onchain-verified";

export type AgentReviewVerdict = "approve" | "reject" | "needs_review";
export type AgentReviewCheckStatus = "pass" | "warning" | "fail";

export type CommerceUseCase =
  | "cross-border-trade"
  | "service-procurement"
  | "invoice-finance"
  | "tokenized-asset-settlement"
  | "agentic-economy";

export interface TradeProfile {
  useCase: CommerceUseCase;
  invoiceId: string;
  buyerCountry: string;
  supplierCountry: string;
  goodsOrService: string;
  complianceCheck: "pending" | "passed" | "needs-review";
  fundingSource: "buyer-wallet" | "circle-wallets-planned" | "cctp-planned" | "gateway-planned";
  settlementRail: "USDC-on-Arc";
}

export interface ArcAgentIdentity {
  standard: "ERC-8004";
  registryAddress: string;
  agentId: string;
  ownerAddress: string;
  metadataURI: string;
  registerTxHash?: string;
  isVerified: boolean;
  verifiedAt: string;
  reputationScore?: number;
  feedbackCount?: number;
  validationStatus?: "Validated" | "Unverified" | "Pending" | "Failed";
  validatorAddress?: string;
}

export interface AgentReviewCheck {
  label: string;
  status: AgentReviewCheckStatus;
  detail: string;
}

export interface AgentReview {
  agentName: string;
  agentRole: "evaluator-agent";
  policyVersion: "arc-evaluator-v1";
  model: string;
  verdict: AgentReviewVerdict;
  confidence: number;
  summary: string;
  reasons: string[];
  conditions: string[];
  checks: AgentReviewCheck[];
  reviewHash: string;
  reviewedAt: string;
}

export interface ArcSettlementJob {
  id: string;
  status: JobStatus;
  clientAddress: string;
  providerAddress: string;
  evaluatorAddress: string;
  amount: string;
  currency: "USDC";
  description: string;
  tradeProfile?: TradeProfile;
  agentIdentity?: ArcAgentIdentity;
  agentReview?: AgentReview;
  onchainJobId?: string;
  budgetAmount?: string;
  deliverableHash?: string;
  /** ERC-8183 lifecycle tx hashes – only populated after live onchain execution */
  createTxHash?: string;
  setBudgetTxHash?: string;
  approveTxHash?: string;
  fundTxHash?: string;
  submitTxHash?: string;
  settleTxHash?: string;
  receiptHash?: string;
  createdAt: string;
  updatedAt: string;
  /** Whether this job has been executed on a real chain */
  settlementMode: SettlementMode;
}

/** Receipt produced at any point in the lifecycle */
export interface ArcSettlementReceipt {
  receiptVersion: "arc-settlement-v1";
  network: "Arc Testnet";
  jobId: string;
  onchainJobId?: string;
  lifecycleStatus: JobStatus;
  clientAddress: string;
  providerAddress: string;
  evaluatorAddress: string;
  amount: string;
  currency: "USDC";
  tradeProfile?: TradeProfile;
  budget: {
    amount: string;
    txHash?: string;
  };
  deliverableHash: string;
  txHashes: {
    create?: string;
    setBudget?: string;
    approve?: string;
    fund?: string;
    submit?: string;
    settle?: string;
  };
  agentIdentity?: ArcAgentIdentity;
  agentReview?: AgentReview;
  appKitFunding?: {
    capability: "bridge" | "send" | "swap" | "unified-balance";
    reference?: string;
  };
  /** Deterministic SHA-256 hex digest of the canonical receipt fields */
  receiptHash: string;
  settlementMode: SettlementMode;
  createdAt: string;
}

/** Blueprint endpoint response shape */
export interface ArcSettlementBlueprint {
  product: string;
  version: string;
  phase: string;
  network: "Arc Testnet";
  contracts: {
    usdc: string;
    eurc: string;
    agenticCommerce: string;
    identityRegistry: string;
    reputationRegistry: string;
    validationRegistry: string;
    fxEscrow: string;
    gatewayWallet: string;
    gatewayMinter: string;
    permit2: string;
    multicall3: string;
  };
  lifecycleStates: JobStatus[];
  capabilities: {
    name: string;
    status: "implemented" | "blueprint" | "future";
    description: string;
  }[];
  receiptSchema: Record<string, string>;
}
