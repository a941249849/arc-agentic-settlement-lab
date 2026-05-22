# Engineering Handoff

## Task

Use the documents in this repository to refine and implement the first version of Arc Agentic Settlement Lab.

Primary docs:

- `docs/ARC_AGENTIC_SETTLEMENT_LAB_PLAN.md`
- `docs/ARC_OFFICIAL_CONTEXT_FOR_ENGINEERING.md`
- `docs/ARC_DISCORD_X_RESEARCH_NOTES.md`
- `docs/COPILOT_ARC_STRATEGY_REVIEW.md`

## Required First Scope

The current app implements a Phase 2 scaffold: ERC-8004 identity read verification plus offchain ERC-8183 lifecycle modeling. Do not present it as live settlement execution.

Next implementation scope should be planned in this order:

1. Wallet-submitted ERC-8004 agent registration.
2. ERC-8183 live Arc Testnet job lifecycle.
3. App Kit funding path.
4. Wallet policy / embedded wallet path.
5. StableFX / QCAD extension.

The ERC-8183 lifecycle must include:

- `createJob`;
- provider `setBudget`;
- USDC `approve`;
- `fund`;
- `submitDeliverable`;
- evaluator `completeJob`.

The current Phase 1 scaffold contains:

1. `Arc Settlement Lab` product surface.
2. `/api/arc-settlement` blueprint endpoint.
3. Arc capability map covering:
   - ERC-8004 agent identity;
   - ERC-8183 job lifecycle;
   - Circle Agent Stack / Agent Wallets;
   - Gateway nanopayments;
   - App Kit funding and monetization;
   - Dynamic/Turnkey embedded wallet and policy signing;
   - StableFX/QCAD as a later extension.
4. In-memory job store.
5. Offchain lifecycle state machine:
   - `draft`;
   - `open`;
   - `budgeted`;
   - `funded`;
   - `submitted`;
   - `settled`;
   - `failed`.
6. Deterministic receipt export.
7. Public docs and acceptance criteria.

The scaffold already includes `budgeted` / provider `setBudget` in the UI, API patch surface, receipt schema, and deterministic receipt export. The next engineering gate is ERC-8004 agent identity before live ERC-8183 settlement execution.

Phase 2 also includes:

- `/api/arc-identity`;
- `/api/arc-identity/prepare` for `register(string)` calldata;
- `/api/arc-identity/verify` for real Arc Testnet `ownerOf` / `tokenURI` reads;
- Job/receipt binding for verified ERC-8004 identity.

The remaining gate before live ERC-8183 execution is wallet-submitted ERC-8004 registration plus an actual `agentId` tied to the provider identity.

Do not implement live wallet or contract execution in the first pass unless the lifecycle UX is already complete and reviewed.

## Implementation Rules

- Keep live and simulated states visibly separate.
- Require real transaction hashes before displaying any state as onchain verified.
- Do not store or expose Circle API keys, entity secrets, private keys, or mnemonics.
- Do not build a plain transfer demo.
- Keep the product framed around agent job settlement and receipt generation.
- Do not reduce the product to a wallet-to-wallet USDC transfer demo.
- Keep Agent Stack / x402 / nanopayments separate from ERC-8183 job settlement. They are paid-access/funding primitives, not job-escrow primitives.
- Acknowledge Circle's official `arc-escrow` reference app and differentiate from it.
- Do not present opt-in privacy / ArcaneVM as live; it is roadmap-only in current official docs.

## Acceptance Criteria

- Project installs and builds.
- Lint/typecheck pass.
- The UI demonstrates the full offchain lifecycle.
- Receipt export includes:
  - job id;
  - lifecycle status;
  - client address;
  - provider address;
  - evaluator address;
  - amount;
  - currency;
  - deliverable hash;
  - receipt hash;
  - simulated vs onchain flag.
- Documentation explains which features are blueprint-only and which are implemented.
- Onchain-verified mode requires Arcscan links for every relevant transaction.
- Live ERC-8183 receipts must include both ERC-8004 agent ID and ERC-8183 job ID.

## Review Focus

Review the plan for:

- alignment with Arc official primitives;
- engineering feasibility;
- missing state transitions;
- receipt integrity;
- security boundaries;
- whether the demo is meaningfully Arc-specific.
