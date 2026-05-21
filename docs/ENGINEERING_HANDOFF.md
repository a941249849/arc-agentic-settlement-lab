# Engineering Handoff

## Task

Use the documents in this repository to refine and implement the first version of Arc Agentic Settlement Lab.

Primary docs:

- `docs/ARC_AGENTIC_SETTLEMENT_LAB_PLAN.md`
- `docs/ARC_OFFICIAL_CONTEXT_FOR_ENGINEERING.md`
- `docs/ARC_DISCORD_X_RESEARCH_NOTES.md`

## Required First Scope

Implement Phase 1 and Phase 2 only:

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
   - `funded`;
   - `submitted`;
   - `settled`;
   - `failed`.
6. Deterministic receipt export.
7. Public docs and acceptance criteria.

Do not implement live wallet or contract execution in the first pass unless the lifecycle UX is already complete and reviewed.

## Implementation Rules

- Keep live and simulated states visibly separate.
- Require real transaction hashes before displaying any state as onchain verified.
- Do not store or expose Circle API keys, entity secrets, private keys, or mnemonics.
- Do not build a plain transfer demo.
- Keep the product framed around agent job settlement and receipt generation.
- Do not reduce the product to a wallet-to-wallet USDC transfer demo.
- Keep Agent Stack, nanopayments, App Kit, and StableFX as explicit roadmap/capability layers unless live credentials and verifiable tx/payment receipts are present.

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

## Review Focus

Review the plan for:

- alignment with Arc official primitives;
- engineering feasibility;
- missing state transitions;
- receipt integrity;
- security boundaries;
- whether the demo is meaningfully Arc-specific.
