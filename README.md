# Arc Agentic Settlement Lab

Agent-native financial workflow on Arc: verifiable job creation, USDC escrow, deliverable proof, evaluator approval, and deterministic settlement receipt.

```text
agent identity → job creation → USDC escrow → deliverable proof → evaluator approval → settlement receipt
```

## Implemented (Phase 1/2)

- **Product shell** — Next.js app with Arc-branded UI
- **`/api/arc-settlement`** — Blueprint endpoint: Arc contract addresses, capability matrix, lifecycle states, receipt schema
- **`/api/arc-settlement/jobs`** — In-memory job store: create and list jobs
- **`/api/arc-settlement/jobs/:id`** — Get and update job status
- **`/api/arc-settlement/jobs/:id/receipt`** — Generate deterministic settlement receipt
- **Offchain lifecycle state machine** — `draft → open → funded → submitted → settled / failed`
- **Deterministic receipt export** — SHA-256 hashed JSON receipt + Markdown export
- **UI labels** — Blueprint / Simulated / Onchain-verified states visibly separated

## Future Work (Phase 3+)

| Phase | Feature | Status |
|-------|---------|--------|
| Phase 3 | Arc Testnet ERC-8183 contract execution via AgenticCommerce | 🔷 Blueprint |
| Phase 3 | Circle Developer-Controlled Wallets integration | 🔷 Blueprint |
| Phase 4 | ERC-8004 agent identity registration and reputation | 🔷 Blueprint |
| Phase 5 | App Kit bridge / send / swap / unified-balance funding | 🔷 Blueprint |
| Phase 6 | StableFX multi-currency settlement (QCAD/EURC → USDC) | 🔘 Future |

## Documents

- [Arc Agentic Settlement Lab plan](docs/ARC_AGENTIC_SETTLEMENT_LAB_PLAN.md)
- [Arc official context for engineering](docs/ARC_OFFICIAL_CONTEXT_FOR_ENGINEERING.md)
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
| `GET` | `/api/arc-settlement/jobs` | List all jobs |
| `POST` | `/api/arc-settlement/jobs` | Create a new job |
| `GET` | `/api/arc-settlement/jobs/:id` | Get a job |
| `PATCH` | `/api/arc-settlement/jobs/:id` | Update job status or deliverable hash |
| `GET` | `/api/arc-settlement/jobs/:id/receipt` | Generate deterministic receipt |

### Receipt Schema

```ts
type ArcSettlementReceipt = {
  receiptVersion: "arc-settlement-v1";
  network: "Arc Testnet";
  jobId: string;
  lifecycleStatus: "draft" | "open" | "funded" | "submitted" | "settled" | "failed";
  clientAddress: string;
  providerAddress: string;
  evaluatorAddress: string;
  amount: string;
  currency: "USDC";
  deliverableHash: string;
  txHashes: { create?: string; fund?: string; submit?: string; settle?: string };
  agentIdentity?: { standard: "ERC-8004"; registryAddress: string; agentId?: string };
  receiptHash: string;          // SHA-256 of canonical fields
  settlementMode: "simulated" | "onchain-verified";
  createdAt: string;
};
```

## Public Repo Hygiene

- Do not commit API keys, entity secrets, private keys, mnemonics, local logs, or browser session data.
- Do not claim onchain completion without transaction hashes.
- Keep Circle Wallets, App Kit, StableFX, and ERC-8183 claims aligned with official Arc docs.
- All Phase 1/2 settlement is simulated. No real transactions are executed.
