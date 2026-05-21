# Arc Agentic Settlement Lab

Independent planning repository for an Arc-focused agentic settlement project.

The goal is to build an Arc-native workflow, not a generic stablecoin transfer demo:

```text
agent identity -> job creation -> USDC escrow -> deliverable proof -> evaluator approval -> settlement receipt
```

## Documents

- [Arc Agentic Settlement Lab plan](docs/ARC_AGENTIC_SETTLEMENT_LAB_PLAN.md)
- [Arc official context for engineering](docs/ARC_OFFICIAL_CONTEXT_FOR_ENGINEERING.md)
- [Arc Discord and X research notes](docs/ARC_DISCORD_X_RESEARCH_NOTES.md)
- [Engineering handoff](docs/ENGINEERING_HANDOFF.md)

## Initial Build Boundary

The first implementation should cover Phase 1 and Phase 2 only:

- product shell;
- official Arc primitive mapping;
- in-memory job lifecycle;
- deterministic settlement receipt export;
- clear simulated vs onchain state labels.

Live Arc Testnet contract execution should be added only after the offchain lifecycle is stable.

## Public Repo Hygiene

- Do not commit API keys, entity secrets, private keys, mnemonics, local logs, or browser session data.
- Do not claim onchain completion without transaction hashes.
- Keep Circle Wallets, App Kit, StableFX, and ERC-8183 claims aligned with official docs.
