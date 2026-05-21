# Arc Agentic Settlement Lab

## Purpose

Arc Agentic Settlement Lab is the proposed Arc-side follow-up to AgentPay Intelligence Gateway.

The goal is not to build another stablecoin transfer demo. The goal is to demonstrate an agent-native financial workflow on Arc:

```text
agent identity -> job creation -> USDC escrow -> deliverable proof -> evaluator approval -> settlement receipt
```

This directly maps to Arc's current public builder direction:

- agentic economy infrastructure;
- machine-to-machine payments;
- real-time agent coordination;
- programmable USDC settlement;
- App Kit flows for bridge, send, swap, unified balance, and monetization;
- StableFX and multi-currency stablecoin finance.

## Strategic Positioning

### What Arc Appears To Want

Recent Arc messaging points toward production-style financial applications rather than isolated contract calls:

1. **Agentic economy**
   - AI-mediated marketplaces;
   - machine-to-machine payments;
   - real-time agent coordination;
   - agentic finance infrastructure.

2. **App Kits**
   - bridge USDC across supported chains;
   - send stablecoins;
   - add swap functionality;
   - support chain-abstracted balances;
   - configure built-in monetization.

3. **StableFX and multi-currency stablecoin finance**
   - USDC, EURC, QCAD, and other stablecoin rails;
   - onchain FX settlement;
   - payments, treasury, and settlement workflows.

4. **Developer grants**
   - Arc Testnet;
   - Circle Developer Platform;
   - Agentic Economy;
   - StableFX;
   - Borrowing and Lending.

### Product Wedge

The clearest wedge is:

```text
Agent job marketplace + Arc USDC escrow + deliverable receipts + optional App Kit funding path
```

This is more aligned with Arc than a generic transfer UI because it uses Arc's differentiators:

- stablecoin-denominated gas;
- deterministic finality;
- programmable settlement;
- Circle Wallets / Circle Developer Platform;
- ERC-8004 agent identity;
- ERC-8183 job lifecycle;
- App Kit monetization and liquidity primitives.

## Relation To The Existing AgentPay Project

The existing project proves:

```text
request -> 402 challenge -> payment credential -> Surf report -> Payment-Receipt
```

The Arc module should prove a different but complementary loop:

```text
client creates job -> agent/provider accepts work -> escrow is funded -> deliverable is submitted -> evaluator settles -> settlement receipt is exported
```

Comparison frame:

| Track | Core Primitive | Best-Fit Demo |
| --- | --- | --- |
| Tempo | MPP / paid API / payment UX | Agent pays for Surf-backed intelligence report |
| Arc | USDC settlement / agent identity / job escrow | Agent completes paid job and receives onchain settlement |
| x402 | HTTP paid resource | Generic paid endpoint |
| Confidential x402 | Private paid resource | Hidden-price paid endpoint |

## MVP Scope

### MVP Name

`Arc Agentic Settlement Lab`

### MVP User Story

A user creates a paid research or execution job for an AI agent. The job is funded in USDC on Arc Testnet. The agent submits a deliverable hash. The evaluator approves the work. The provider receives settlement. The app exports a receipt that binds:

- job id;
- client wallet;
- provider or agent wallet;
- evaluator wallet;
- escrow amount;
- deliverable hash;
- settlement transaction;
- timestamp;
- optional source/report artifact.

### MVP Screens

1. **Overview**
   - Explain the agent job settlement loop.
   - Show Arc capability mapping.
   - Show current network and contract readiness.

2. **Agent Registry**
   - Register or display agent identity.
   - Surface ERC-8004 identity, reputation, and validation concepts.
   - MVP can start as a read/write placeholder if credentials are not configured.

3. **Job Console**
   - Create job.
   - Select provider/agent.
   - Set evaluator.
   - Set USDC amount.
   - Set deliverable description.
   - Fund escrow.

4. **Deliverable**
   - Submit deliverable URI/hash.
   - Record status.
   - Let evaluator approve or reject.

5. **Settlement Receipt**
   - Display lifecycle timeline.
   - Display tx references.
   - Export JSON receipt.
   - Copy Markdown summary for public article/report.

6. **App Kit Funding Path**
   - Show optional bridge/send/swap/unified balance path.
   - MVP can expose this as a planned integration until App Kit credentials and wallet flow are configured.

## Architecture

### Frontend

Recommended first version:

- Next.js route or tab inside the existing AgentPay app.
- Keep the current design system.
- Add an `Arc Settlement Lab` mode.
- Do not reuse the Tempo Transactions UI copy; Arc needs its own product framing.

Core frontend state:

```ts
type ArcSettlementJob = {
  id: string;
  status: "draft" | "open" | "funded" | "submitted" | "settled" | "failed";
  clientAddress: string;
  providerAddress: string;
  evaluatorAddress: string;
  amount: string;
  currency: "USDC";
  description: string;
  deliverableHash?: string;
  createTxHash?: string;
  fundTxHash?: string;
  submitTxHash?: string;
  settleTxHash?: string;
  receiptHash?: string;
  createdAt: string;
  updatedAt: string;
};
```

### Backend

Recommended first version:

- `GET /api/arc-settlement`
  - returns product plan, contract addresses, network status, and accepted lifecycle states.

- `POST /api/arc-settlement/jobs`
  - creates an offchain job record.
  - initially deterministic/in-memory if no durable store is configured.

- `POST /api/arc-settlement/jobs/:id/receipt`
  - produces a JSON receipt for the current job state.

Later production version:

- persistent store;
- idempotency keys;
- Circle Wallets integration;
- Arc Testnet contract execution;
- event indexing;
- receipt snapshot hashing.

### Chain Interaction

There are two candidate execution paths.

#### Path A: Circle Wallets First

Use Circle Developer-Controlled Wallets because Arc docs use this path heavily in quickstarts.

Pros:

- aligned with Circle Developer Platform;
- easier for grant narrative;
- works with Arc Testnet wallet/account abstraction flow;
- good for server-driven demo automation.

Cons:

- requires Circle API key and entity secret;
- more backend-heavy;
- less wallet-native for public users.

#### Path B: Viem / User Wallet First

Use viem with a connected wallet.

Pros:

- simpler public developer surface;
- easier to reason about transaction hashes;
- can keep secrets out of the server.

Cons:

- user must fund and sign;
- may not match Circle's preferred App Kit / Wallets path as closely.

Recommended MVP:

```text
Implement Path A as the primary grant-aligned path.
Keep Path B as a fallback developer mode.
```

## Arc Official Primitives To Map

### ERC-8004 Agent Identity

Arc docs provide testnet contracts for:

- `IdentityRegistry`;
- `ReputationRegistry`;
- `ValidationRegistry`.

Use this for:

- registering an AI agent;
- recording reputation events;
- proving the provider is not just a random wallet;
- displaying credential/reputation state in the UI.

MVP requirement:

- show the registry addresses and intended calls;
- implement read-only or mock-safe state if credentials are unavailable;
- do not claim live registration until a tx hash is captured.

### ERC-8183 Job Lifecycle

Arc docs provide an AgenticCommerce reference implementation for:

- job creation;
- escrow funding;
- deliverable submission;
- evaluation;
- settlement.

Use this for:

- the core Arc demo;
- the settlement receipt;
- the public article angle.

MVP requirement:

- mirror the ERC-8183 lifecycle in the app UI;
- make every state transition explicit;
- bind receipt output to the job state and deliverable hash.

### App Kit

App Kit supports:

- bridge;
- send;
- swap;
- unified balance;
- monetization.

Use this for:

- funding the job from a chain-abstracted USDC balance;
- optional swap into the needed stablecoin;
- built-in application fee/monetization;
- showing why Arc is more than a single-chain transfer flow.

MVP requirement:

- include an App Kit funding panel as a blueprint;
- do not claim live App Kit execution until `KIT_KEY`, adapter setup, and funded wallet flow are verified.

### StableFX / Multi-Currency Settlement

StableFX is relevant as a second-phase module:

```text
client pays in QCAD/EURC -> FX quote/settlement -> provider receives USDC
```

MVP should mention this as Phase 2, not include it in the first shipped scope unless the official SDK/API path is fully available.

## Implementation Phases

### Phase 1: Research-Backed Product Shell

Deliverables:

- `Arc Settlement Lab` UI tab or standalone route;
- `/api/arc-settlement` blueprint endpoint;
- public docs describing official Arc primitive mapping;
- lifecycle diagram;
- receipt schema.

Acceptance:

- app builds;
- route returns structured plan JSON;
- UI clearly distinguishes blueprint state from live tx state;
- no unsupported claims.

### Phase 2: Offchain Job Lifecycle

Deliverables:

- create job;
- update job status;
- submit deliverable hash;
- generate settlement receipt;
- export Markdown.

Acceptance:

- full lifecycle can be simulated without wallet credentials;
- receipt contains deterministic hash;
- UX demonstrates the product loop end to end.

### Phase 3: Arc Testnet Contract Execution

Deliverables:

- connect Circle Wallets or viem;
- create/fund ERC-8183 job on Arc Testnet;
- submit deliverable;
- settle job;
- capture tx hashes.

Acceptance:

- explorer links resolve;
- receipt includes real tx hashes;
- no transaction remains stuck/pending without error explanation;
- docs include exact environment variables and funding steps.

### Phase 4: ERC-8004 Agent Identity

Deliverables:

- register provider agent;
- display agent identity;
- record or read reputation event;
- link job settlement to agent identity.

Acceptance:

- agent registry tx hash captured;
- UI shows identity/reputation status;
- job receipt includes agent identity reference.

### Phase 5: App Kit Funding

Deliverables:

- bridge/send/swap/unified balance path;
- optional app monetization fee;
- stable funding path into the ERC-8183 job.

Acceptance:

- App Kit call completes on testnet;
- user sees funding source, destination, amount, and tx reference;
- receipt binds funding path to job settlement.

### Phase 6: StableFX Extension

Deliverables:

- QCAD/EURC/USDC scenario;
- offchain quote / onchain PvP settlement research;
- treasury or cross-border payout framing.

Acceptance:

- only ship if official API/contract path is available and testnet behavior is stable;
- otherwise keep as research report.

## Receipt Schema

```ts
type ArcSettlementReceipt = {
  receiptVersion: "arc-settlement-v1";
  network: "Arc Testnet";
  jobId: string;
  lifecycleStatus: string;
  clientAddress: string;
  providerAddress: string;
  evaluatorAddress: string;
  amount: string;
  currency: "USDC";
  deliverableHash: string;
  txHashes: {
    create?: string;
    fund?: string;
    submit?: string;
    settle?: string;
  };
  agentIdentity?: {
    standard: "ERC-8004";
    registryAddress: string;
    agentId?: string;
  };
  appKitFunding?: {
    capability: "bridge" | "send" | "swap" | "unified-balance";
    reference?: string;
  };
  receiptHash: string;
  createdAt: string;
};
```

## Public Narrative

Suggested article thesis:

> Tempo shows how agents can pay for APIs. Arc shows how agents can take jobs, prove work, and settle in USDC. The next layer is not another wallet screen; it is verifiable economic workflow for autonomous agents.

Outline:

1. Why stablecoin transfer demos are not enough.
2. Arc's agentic economy direction.
3. ERC-8004: agent identity and reputation.
4. ERC-8183: job escrow and settlement.
5. App Kit: funding, liquidity, and monetization.
6. Demo walkthrough: create job -> fund escrow -> submit deliverable -> settle -> export receipt.
7. Comparison with Tempo MPP and x402.
8. What still needs production hardening.

## Risks And Boundaries

- Do not claim mainnet readiness; build on Arc Testnet first.
- Do not claim live App Kit execution until credentials and tx hashes are captured.
- Do not store Circle API keys, entity secrets, or wallet private keys in the repository.
- Do not treat mock lifecycle completion as onchain settlement.
- Do not position this as investment, grant guarantee, or token expectation.
- Add compliance disclaimer for financial workflows, especially StableFX, lending, and cross-border settlement.

## Engineering Review Checklist

Reviewers should check:

1. Does the app demonstrate an Arc-specific workflow, not a generic transfer?
2. Are live vs simulated states clearly separated?
3. Are Arc official primitives mapped accurately?
4. Are secrets server-only and absent from public output?
5. Are tx hashes required before claiming onchain completion?
6. Is the receipt schema sufficient to prove job lifecycle and settlement?
7. Can the MVP be completed without blocking on StableFX?
8. Is App Kit treated as a funding/monetization layer rather than unrelated decoration?

## Recommended First Engineering Task

Build Phase 1 and Phase 2 only:

- add `Arc Settlement Lab` tab;
- add `/api/arc-settlement`;
- implement in-memory job lifecycle;
- implement receipt export;
- add docs and acceptance criteria;
- avoid real wallet execution until the lifecycle UX is complete.

This gives a coherent public artifact quickly and creates a stable base for Circle Wallets / ERC-8183 integration.

## References

- Arc Agentic Economy: https://docs.arc.io/build/agentic-economy.md
- Register your first AI agent: https://docs.arc.io/arc/tutorials/register-your-first-ai-agent.md
- Create your first ERC-8183 job: https://docs.arc.io/arc/tutorials/create-your-first-erc-8183-job.md
- Arc App Kit: https://docs.arc.io/app-kit.md
- Unified Balance: https://docs.arc.io/app-kit/unified-balance.md
- Stablecoin FX: https://docs.arc.io/build/stablecoin-fx
- Circle Developer Grants event: https://community.arc.network/public/events/circle-developer-grants-building-on-arc-and-the-circle-developer-platform-o6p6ge6b4n
