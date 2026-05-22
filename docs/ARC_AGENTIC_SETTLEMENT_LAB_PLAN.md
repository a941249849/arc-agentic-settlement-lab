# Arc Agentic Settlement Lab

## Purpose

Arc Agentic Settlement Lab is the proposed Arc-side follow-up to AgentPay Intelligence Gateway.

The goal is not to build another stablecoin transfer demo. The goal is to demonstrate an agent-native financial workflow on Arc:

```text
agent identity -> job creation -> provider sets budget -> USDC escrow -> deliverable proof -> evaluator approval -> settlement receipt
```

## Strategy Review Status

Copilot completed an official-doc strategy review in `docs/COPILOT_ARC_STRATEGY_REVIEW.md`.

Verdict:

```text
GO WITH CHANGES
```

Accepted corrections:

- ERC-8183 is a valid core wedge, but the lifecycle must include provider `setBudget`.
- ERC-8004 agent identity should move before live ERC-8183 execution, not after it.
- The current Phase 1/2 prototype is an internal scaffold, not the public proof point.
- Circle's official `arc-escrow` reference app must be acknowledged and differentiated from.
- Circle Agent Stack / x402 / Gateway nanopayments are paid-access or funding primitives, not synonyms for ERC-8183 job settlement.
- ArcaneVM / opt-in privacy is roadmap-only and must not be treated as live implementation scope.

This directly maps to Arc's current public builder direction:

- agentic economy infrastructure;
- machine-to-machine payments;
- real-time agent coordination;
- programmable USDC settlement;
- Circle Agent Stack, Agent Wallets, Agent Marketplace, and nanopayments;
- App Kit flows for bridge, send, swap, unified balance, and monetization;
- Dynamic and Turnkey style embedded wallet / policy signing infrastructure;
- StableFX and multi-currency stablecoin finance.

## Strategic Positioning

### What Arc Appears To Want

Recent Arc messaging points toward production-style financial applications rather than isolated contract calls:

1. **Agentic economy**
   - AI-mediated marketplaces;
   - machine-to-machine payments;
   - real-time agent coordination;
   - agentic finance infrastructure.

2. **Circle Agent Stack and nanopayments**
   - Agent Wallets for controlled USDC access;
   - Agent Marketplace for service discovery;
   - Circle CLI for repeatable financial actions;
   - Gateway nanopayments for paid APIs, data products, and agent-to-service payments;
   - x402 / MPP / AP2 as adjacent payment-negotiation protocols;
   - distinct from ERC-8183 job escrow and settlement.

3. **App Kits**
   - bridge USDC across supported chains;
   - send stablecoins;
   - add swap functionality;
   - support chain-abstracted balances;
   - configure built-in monetization.

4. **Embedded wallet and signing infrastructure**
   - email, SMS, social, passkey, and external-wallet onboarding;
   - non-custodial embedded wallets;
   - policy-based signing controls;
   - delegated backend-assisted actions;
   - role-based treasury, payout, and approval flows.

5. **StableFX and multi-currency stablecoin finance**
   - USDC, EURC, QCAD, and other regulated stablecoin rails;
   - onchain FX settlement;
   - CAD/USD and other settlement corridors;
   - payments, treasury, payroll, B2B settlement, and cross-border workflows.

6. **Developer grants**
   - Arc Testnet;
   - Circle Developer Platform;
   - Agentic Economy;
   - StableFX;
   - Borrowing and Lending.
   - strong integrations;
   - clear paths to users and usage;
   - expanded USDC utility.

### Product Wedge

The clearest wedge is:

```text
Agent identity + Arc ERC-8183 job escrow + provider budget setting + deliverable receipts + optional App Kit funding path
```

This is more aligned with Arc than a generic transfer UI because it uses Arc's differentiators:

- stablecoin-denominated gas;
- deterministic finality;
- programmable settlement;
- Circle Wallets / Circle Developer Platform;
- Agent Wallets, Agent Marketplace, and Gateway nanopayments;
- ERC-8004 agent identity;
- ERC-8183 job lifecycle;
- App Kit monetization and liquidity primitives.

## Differentiation From Arc Escrow

Arc's official docs link Circle's `arc-escrow` reference app:

```text
https://github.com/circlefin/arc-escrow
```

This project should not replicate that reference app. Differentiation target:

- UI-first settlement console rather than only script/template execution;
- ERC-8004 identity, reputation, and validation surfaced as product state;
- role-separated client/provider/evaluator workflow;
- deterministic JSON and Markdown receipt export;
- public builder narrative explaining why Arc's USDC gas, deterministic finality, and agentic standards matter.

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

A user creates a paid research or execution job for a registered AI agent. The provider sets a budget. The client funds USDC escrow on Arc Testnet. The agent submits a deliverable hash. The evaluator approves the work. The provider receives settlement. The app exports a receipt that binds:

- job id;
- ERC-8004 agent id;
- client wallet;
- provider or agent wallet;
- evaluator wallet;
- provider budget;
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

7. **Agent Stack Readiness**
   - Show how the workflow can later connect to Agent Wallets, Agent Marketplace discovery, and Gateway nanopayments.
   - Keep this as a capability map in Phase 1/2 unless official credentials and funded flows are available.

8. **Wallet Policy Readiness**
   - Show role separation between client, provider, evaluator, and optional treasury approver.
   - Map future Dynamic/Turnkey integration for embedded wallets and policy-scoped signing.

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
  status: "draft" | "open" | "budgeted" | "funded" | "submitted" | "settled" | "failed";
  clientAddress: string;
  providerAddress: string;
  evaluatorAddress: string;
  amount: string;
  budgetAmount?: string;
  currency: "USDC";
  description: string;
  deliverableHash?: string;
  createTxHash?: string;
  setBudgetTxHash?: string;
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

#### Path C: Agent Stack / Gateway Nanopayments

Use Circle Agent Stack and Gateway nanopayments for paid service access or usage-based job funding.

Pros:

- directly aligned with Arc's current agentic economy messaging;
- fits paid APIs, data products, and agent-to-service payments;
- can connect this project back to the existing AgentPay / MPP work.

Cons:

- requires Gateway/nanopayment account setup;
- not a replacement for ERC-8183 escrow settlement;
- easy to overclaim if the app only simulates payment authorizations.

Recommended handling:

```text
Model this as a future funding layer.
Do not block Phase 1/2 on nanopayment execution.
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
- provider budget setting;
- USDC approval;
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
- include `setBudget(jobId, amount, optParams)` before escrow funding;
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

### Circle Agent Stack / Gateway Nanopayments

Recent Arc announcements point builders toward Agent Wallets, Agent Marketplace, Circle CLI, and Gateway nanopayments.

Use this for:

- paid service discovery;
- usage-based job funding;
- agent-to-service payments;
- connecting x402 or MPP-style paid endpoints to Arc settlement receipts.

MVP requirement:

- include this as a roadmap/capability map;
- do not fake nanopayment receipts;
- if implemented later, require a funded Gateway buyer/seller flow and verifiable payment receipt.

### Embedded Wallets And Policy-Based Signing

Arc is highlighting Dynamic and Turnkey integrations for onboarding, embedded wallets, account abstraction, and policy-scoped signing.

Use this for:

- onboarding non-crypto users;
- client/provider/evaluator role separation;
- delegated backend-assisted actions;
- treasury approvals;
- safer scheduled payouts or settlement automation.

MVP requirement:

- represent roles clearly in the data model and UI;
- keep live signing disabled until a provider integration is chosen and verified.

### StableFX / Multi-Currency Settlement

StableFX is relevant as a later multi-currency extension:

```text
client pays in QCAD/EURC -> FX quote/settlement -> provider receives USDC
```

The first public proof should not depend on StableFX. Keep it as Phase 6 unless the official execution path is fully available and stable on testnet.

## Implementation Phases

### Phase 1: Research-Backed Product Shell And Scaffold

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
- public docs state that Phase 1 is a scaffold, not the final public proof.

### Phase 2: ERC-8004 Agent Identity

Deliverables:

- register provider agent on Arc Testnet;
- display agent identity and metadata URI;
- record or read reputation event;
- link job settlement to agent identity.

Acceptance:

- agent registry tx hash captured;
- Arcscan link resolves;
- UI shows identity/reputation status;
- receipt schema includes agent identity reference.

### Phase 3: Arc Testnet ERC-8183 Job Lifecycle

Deliverables:

- connect Circle Wallets or viem;
- create ERC-8183 job on Arc Testnet;
- provider calls `setBudget`;
- client approves USDC;
- client funds escrow;
- provider submits deliverable;
- evaluator completes job;
- capture tx hashes.

Acceptance:

- explorer links resolve;
- receipt includes real tx hashes for create, budget, approve, fund, submit, and complete;
- receipt includes ERC-8004 agent id and ERC-8183 job id;
- no transaction remains stuck/pending without error explanation;
- docs include exact environment variables and funding steps.

### Phase 4: App Kit Funding

Deliverables:

- bridge/send/swap/unified balance path;
- optional app monetization fee;
- stable funding path into the ERC-8183 job.

Acceptance:

- App Kit call completes on testnet;
- wallet policy and signing boundaries are explicit;
- user sees funding source, destination, amount, and tx reference;
- receipt binds funding path to job settlement.

### Phase 5: Embedded Wallets And Policy Signing

Deliverables:

- Dynamic or Turnkey embedded wallet path;
- policy-scoped signing / approval design;
- role-scoped client/provider/evaluator permissions;
- optional backend-assisted actions.

Acceptance:

- wallet policy and signing boundaries are explicit;
- no delegated signer has unlimited authority;
- user-controlled wallet ownership remains clear.

### Phase 6: StableFX / QCAD Extension

Deliverables:

- QCAD/EURC/USDC scenario;
- CAD/USD settlement corridor scenario;
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
    setBudget?: string;
    approve?: string;
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
5. Required lifecycle correction: provider setBudget before funding.
6. Differentiation from Circle's official arc-escrow reference app.
7. App Kit: funding, liquidity, and monetization.
8. Circle Agent Stack / x402 / nanopayments as adjacent paid-access rails, not job settlement.
9. Wallet policy: embedded wallets, approvals, and delegated signing.
10. Demo walkthrough: register agent -> create job -> set budget -> fund escrow -> submit deliverable -> settle -> export receipt.
9. Comparison with Tempo MPP and x402.
10. StableFX/QCAD as the multi-currency extension.
11. What still needs production hardening.

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

## Recommended Next Engineering Task

Update the existing Phase 1 scaffold so it matches the strategy-review corrections before adding live chain execution:

- add `budgeted` / `setBudget` to the offchain lifecycle;
- update receipt schema and UI copy for `setBudget`;
- add `arc-escrow` differentiation to the public app copy;
- separate Agent Stack / x402 / nanopayments from ERC-8183 job settlement in the UI;
- keep Phase 1 explicitly labeled as scaffold, not final public proof.

After that, plan Phase 2 as live ERC-8004 agent registration, then Phase 3 as live ERC-8183 execution with Arcscan links.

## References

- Arc Agentic Economy: https://docs.arc.io/build/agentic-economy.md
- Arc Discord and X Research Notes: ./ARC_DISCORD_X_RESEARCH_NOTES.md
- Register your first AI agent: https://docs.arc.io/arc/tutorials/register-your-first-ai-agent.md
- Create your first ERC-8183 job: https://docs.arc.io/arc/tutorials/create-your-first-erc-8183-job.md
- Arc App Kit: https://docs.arc.io/app-kit.md
- Unified Balance: https://docs.arc.io/app-kit/unified-balance.md
- Stablecoin FX: https://docs.arc.io/build/stablecoin-fx
- Circle Developer Grants event: https://community.arc.network/public/events/circle-developer-grants-building-on-arc-and-the-circle-developer-platform-o6p6ge6b4n
