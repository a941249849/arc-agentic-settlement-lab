// Arc Agentic Settlement Lab – type definitions
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

export interface ArcAgentIdentity {
  standard: "ERC-8004";
  registryAddress: string;
  agentId: string;
  ownerAddress: string;
  metadataURI: string;
  registerTxHash?: string;
  isVerified: boolean;
  verifiedAt: string;
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
  agentIdentity?: ArcAgentIdentity;
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
