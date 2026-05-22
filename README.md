# Arc Agentic Settlement Lab

Agent-native financial workflow on Arc: verifiable agent identity, job creation, provider budget setting, USDC escrow, deliverable proof, evaluator approval, and deterministic settlement receipt.

```text
agent identity -> job creation -> provider sets budget -> USDC escrow -> deliverable proof -> evaluator approval -> settlement receipt
```

## Implemented (Phase 2)

- **Product shell** — Next.js app with Arc-branded UI
- **`/api/arc-settlement`** — Blueprint endpoint: Arc contract addresses, capability matrix, lifecycle states, receipt schema
- **`/api/arc-identity`** — ERC-8004 IdentityRegistry context and contract addresses
- **`/api/arc-identity/prepare`** — Prepare `register(string metadataURI)` calldata for wallet submission
- **`/api/arc-identity/verify`** — Read `ownerOf(agentId)` and `tokenURI(agentId)` from Arc Testnet
- **`/api/arc-settlement/jobs`** — In-memory job store: create and list jobs
- **`/api/arc-settlement/jobs/:id`** — Get and update job status
- **`/api/arc-settlement/jobs/:id/receipt`** — Generate deterministic settlement receipt
- **Offchain lifecycle state machine** — current scaffold: `draft → open → budgeted → funded → submitted → settled / failed`
- **Agent identity proof binding** — verified ERC-8004 identity can be attached to jobs and exported in receipts
- **Deterministic receipt export** — SHA-256 hashed JSON receipt + Markdown export
- **UI labels** — Blueprint / Simulated / Onchain-verified states visibly separated
- **Research context** — Arc Discord/X and official-doc context retained for follow-up implementation

The scaffold now includes the strategy-review correction: provider `setBudget` is modeled as the explicit `budgeted` lifecycle state before escrow funding. Phase 2 adds real Arc Testnet read verification for ERC-8004 identity, while wallet registration and ERC-8183 settlement execution remain external/blueprint-only.

## Strategy Review Verdict

Copilot's official-doc review returned `GO WITH CHANGES`.

Required corrections before further product implementation:

- include the ERC-8183 `setBudget` step;
- move ERC-8004 agent identity before live ERC-8183 settlement;
- acknowledge and differentiate from Circle's official `arc-escrow` reference app;
- treat Phase 1/2 as a scaffold, not the public proof point;
- separate Circle Agent Stack / x402 nanopayments from ERC-8183 job settlement;
- do not present opt-in privacy / ArcaneVM as a live implementation target.

See [Copilot Arc Strategy Review](docs/COPILOT_ARC_STRATEGY_REVIEW.md).

## Future Work

| Phase | Feature | Status |
|-------|---------|--------|
| Phase 2 | ERC-8004 identity proof and receipt binding | ✅ Implemented |
| Phase 3 | Live Arc Testnet ERC-8183 lifecycle: createJob, setBudget, approve, fund, submit, complete | 🔷 Blueprint |
| Phase 4 | App Kit funding and monetization path | 🔷 Blueprint |
| Phase 5 | Embedded wallets and policy signing | 🔷 Blueprint |
| Phase 6 | StableFX multi-currency settlement (QCAD/EURC → USDC) | 🔘 Future |

## Documents

- [Arc Agentic Settlement Lab plan](docs/ARC_AGENTIC_SETTLEMENT_LAB_PLAN.md)
- [Arc official context for engineering](docs/ARC_OFFICIAL_CONTEXT_FOR_ENGINEERING.md)
- [Arc Discord and X research notes](docs/ARC_DISCORD_X_RESEARCH_NOTES.md)
- [Copilot Arc strategy review](docs/COPILOT_ARC_STRATEGY_REVIEW.md)
- [Engineering handoff](docs/ENGINEERING_HANDOFF.md)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### API

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/arc-settlement` | Blueprint: contracts, capabilities, lifecycle, receipt schema |
| `GET` | `/api/arc-identity` | ERC-8004 identity verifier context |
| `POST` | `/api/arc-identity/prepare` | Prepare IdentityRegistry `register(string)` calldata |
| `POST` | `/api/arc-identity/verify` | Verify `ownerOf` and `tokenURI` for an existing agent ID |
| `GET` | `/api/arc-settlement/jobs` | List all jobs |
| `POST` | `/api/arc-settlement/jobs` | Create a new job |
| `GET` | `/api/arc-settlement/jobs/:id` | Get a job |
| `PATCH` | `/api/arc-settlement/jobs/:id` | Update job status, provider budget, tx evidence, or deliverable hash |
| `GET` | `/api/arc-settlement/jobs/:id/receipt` | Generate deterministic receipt |

### Receipt Schema

```ts
type ArcSettlementReceipt = {
  receiptVersion: "arc-settlement-v1";
  network: "Arc Testnet";
  jobId: string;
  lifecycleStatus: "draft" | "open" | "budgeted" | "funded" | "submitted" | "settled" | "failed";
  clientAddress: string;
  providerAddress: string;
  evaluatorAddress: string;
  amount: string;
  currency: "USDC";
  deliverableHash: string;
  budget: { amount: string; txHash?: string };
  txHashes: {
    create?: string;
    setBudget?: string;
    approve?: string;
    fund?: string;
    submit?: string;
    settle?: string;
  };
  agentIdentity?: {
    standard: "ERC-8004";
    registryAddress: string;
    agentId: string;
    ownerAddress: string;
    metadataURI: string;
    registerTxHash?: string;
    isVerified: boolean;
    verifiedAt: string;
  };
  receiptHash: string;          // SHA-256 of canonical fields
  settlementMode: "simulated" | "onchain-verified";
  createdAt: string;
};
```

## Public Repo Hygiene

- Do not commit API keys, entity secrets, private keys, mnemonics, local logs, or browser session data.
- Do not claim onchain completion without transaction hashes.
- Keep Circle Wallets, App Kit, StableFX, and ERC-8183 claims aligned with official Arc docs.
- Settlement remains simulated until Phase 3. ERC-8004 verifier reads Arc Testnet but does not submit wallet transactions.
