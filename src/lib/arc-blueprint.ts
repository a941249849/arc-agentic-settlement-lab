import type { ArcSettlementBlueprint } from "./types";

export const arcSettlementBlueprint: ArcSettlementBlueprint = {
  product: "Arc Trade Agent Settlement",
  version: "0.1.0",
  phase: "Testnet MVP - SME cross-border trade settlement on Arc",
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

  lifecycleStates: ["draft", "open", "budgeted", "funded", "submitted", "settled", "failed"],

  capabilities: [
    {
      name: "Trade settlement job store",
      status: "implemented",
      description:
        "Create and manage importer-agent trade settlement jobs with invoice, route, and compliance context.",
    },
    {
      name: "Offchain lifecycle state machine",
      status: "implemented",
      description:
        "Full draft -> open -> budgeted -> funded -> submitted -> settled/failed lifecycle for invoice-backed trade settlement.",
    },
    {
      name: "Deterministic receipt export",
      status: "implemented",
      description:
        "JSON and Markdown receipts with SHA-256 hash binding trade context, job id, parties, amount, deliverable hash, settlement mode, and agent identity.",
    },
    {
      name: "ERC-8183 onchain execution",
      status: "implemented",
      description:
        "Wallet transaction builder and verifier for AgenticCommerce: createJob, setBudget, approve, fund, submit, complete.",
    },
    {
      name: "ERC-8004 agent identity",
      status: "implemented",
      description:
        "IdentityRegistry read verification for agent owner and metadata URI. Live registration calldata preparation is implemented; connected wallet confirmation remains external.",
    },
    {
      name: "Circle Wallets / Agent Stack",
      status: "blueprint",
      description:
        "Policy-controlled agent treasury, server-side wallet execution, and paid-access primitives documented as the next live integration layer.",
    },
    {
      name: "Gateway nanopayments",
      status: "blueprint",
      description:
        "Gas-efficient paid API, data-product, invoice-document, and agent-to-service payment layer.",
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
      description: "QCAD/EURC -> USDC FX settlement via FxEscrow. Research-only extension.",
    },
  ],

  receiptSchema: {
    receiptVersion: "string - arc-settlement-v1",
    network: "string - Arc Testnet",
    jobId: "string - UUID",
    lifecycleStatus: "string - draft|open|budgeted|funded|submitted|settled|failed",
    clientAddress: "string - 0x...",
    providerAddress: "string - 0x...",
    evaluatorAddress: "string - 0x...",
    amount: "string - decimal USDC amount",
    currency: "string - USDC",
    tradeProfile:
      "object - { useCase, invoiceId, buyerCountry, supplierCountry, goodsOrService, complianceCheck, fundingSource, settlementRail }",
    budget: "object - { amount, txHash? } - provider setBudget amount and tx reference",
    deliverableHash: "string - SHA-256 or IPFS CID of deliverable artifact",
    onchainJobId: "string - ERC-8183 AgenticCommerce job id, present after live createJob",
    txHashes:
      "object - { create?, setBudget?, approve?, fund?, submit?, settle? } - Arc Testnet tx hashes",
    agentIdentity:
      "object - { standard, registryAddress, agentId, ownerAddress, metadataURI, registerTxHash?, isVerified, verifiedAt }",
    appKitFunding: "object - { capability, reference? } - Phase 5+",
    receiptHash: "string - SHA-256 of canonical receipt fields",
    settlementMode: "string - simulated|onchain-partial|onchain-verified",
    createdAt: "string - ISO-8601 timestamp",
  },
};
