import type { ArcSettlementBlueprint } from "./types";

export const arcSettlementBlueprint: ArcSettlementBlueprint = {
  product: "Arc Agentic Settlement Lab",
  version: "0.1.0",
  phase: "Phase 1/2 - Offchain Lifecycle",
  network: "Arc Testnet",

  contracts: {
    usdc: "0x3600000000000000000000000000000000000000",
    eurc: "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a",
    agenticCommerce: "0x0747EEf0706327138c69792bF28Cd525089e4583",
    identityRegistry: "0x8004A818BFB912233c491871b3d84c89A494BD9e",
    reputationRegistry: "0x8004B663056A597Dffe9eCcC1965A193B7388713",
    validationRegistry: "0x8004Cb1BF31DAf7788923b405b754f57acEB4272",
    fxEscrow: "0x867650F5eAe8df91445971f14d89fd84F0C9a9f8",
    gatewayWallet: "0x0077777d7EBA4688BDeF3E311b846F25870A19B9",
    gatewayMinter: "0x0022222ABE238Cc2C7Bb1f21003F0a260052475B",
    permit2: "0x000000000022D473030F116dDEE9F6B43aC78BA3",
    multicall3: "0xcA11bde05977b3631167028862bE2a173976CA11",
  },

  lifecycleStates: ["draft", "open", "funded", "submitted", "settled", "failed"],

  capabilities: [
    {
      name: "In-memory job store",
      status: "implemented",
      description: "Create and manage settlement jobs in server memory (Phase 1/2).",
    },
    {
      name: "Offchain lifecycle state machine",
      status: "implemented",
      description:
        "Full draft -> open -> funded -> submitted -> settled/failed lifecycle without wallet execution.",
    },
    {
      name: "Deterministic receipt export",
      status: "implemented",
      description:
        "JSON and Markdown receipts with SHA-256 hash binding job id, parties, amount, deliverable hash, and settlement mode.",
    },
    {
      name: "ERC-8183 onchain execution",
      status: "blueprint",
      description:
        "Live AgenticCommerce contract calls on Arc Testnet. Planned for Phase 3 with Circle Wallets or viem.",
    },
    {
      name: "ERC-8004 agent identity",
      status: "blueprint",
      description:
        "IdentityRegistry, ReputationRegistry, ValidationRegistry calls. Planned for Phase 4.",
    },
    {
      name: "Circle Agent Stack",
      status: "blueprint",
      description:
        "Agent Wallets, Agent Marketplace, Circle CLI, and agent-oriented USDC workflows. Planned after the offchain lifecycle is stable.",
    },
    {
      name: "Gateway nanopayments",
      status: "blueprint",
      description:
        "Gas-efficient paid API, data-product, and agent-to-service payment layer. Requires real buyer/seller setup before live use.",
    },
    {
      name: "Embedded wallet and policy signing",
      status: "blueprint",
      description:
        "Dynamic or Turnkey-style onboarding, account abstraction, delegated signing, and role-based settlement approvals.",
    },
    {
      name: "App Kit funding path",
      status: "blueprint",
      description:
        "Bridge / send / swap / unified balance via @circle-fin/app-kit. Planned for Phase 5.",
    },
    {
      name: "StableFX multi-currency settlement",
      status: "future",
      description: "QCAD/EURC -> USDC FX settlement via FxEscrow. Research only at Phase 1/2.",
    },
  ],

  receiptSchema: {
    receiptVersion: "string - arc-settlement-v1",
    network: "string - Arc Testnet",
    jobId: "string - UUID",
    lifecycleStatus: "string - draft|open|funded|submitted|settled|failed",
    clientAddress: "string - 0x...",
    providerAddress: "string - 0x...",
    evaluatorAddress: "string - 0x...",
    amount: "string - decimal USDC amount",
    currency: "string - USDC",
    deliverableHash: "string - SHA-256 or IPFS CID of deliverable artifact",
    txHashes: "object - { create?, fund?, submit?, settle? } - Arc Testnet tx hashes",
    agentIdentity:
      "object - { standard: ERC-8004, registryAddress, agentId? } - Phase 4+",
    appKitFunding: "object - { capability, reference? } - Phase 5+",
    receiptHash: "string - SHA-256 of canonical receipt fields",
    settlementMode: "string - simulated|onchain-verified",
    createdAt: "string - ISO-8601 timestamp",
  },
};
