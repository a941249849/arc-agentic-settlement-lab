# Arc Official Context For Engineering

This file is a compact local context pack for engineering agents that may not be able to browse Arc documentation during implementation.

Use it together with:

- [Arc Agentic Settlement Lab plan](./ARC_AGENTIC_SETTLEMENT_LAB_PLAN.md)
- [Arc Discord and X research notes](./ARC_DISCORD_X_RESEARCH_NOTES.md)
- Arc docs index: https://docs.arc.io/llms.txt

Do not treat this file as a replacement for final live verification. If web access is available, refresh official docs before shipping chain-interacting code.

## Core Arc Facts

Arc is an open Layer-1 blockchain purpose-built for programmable money.

Official high-level properties:

- USDC is the native gas token.
- Arc is EVM-compatible.
- Arc has sub-second deterministic finality.
- Arc supports opt-in privacy.
- Arc integrates directly with Circle's developer platform.
- Arc is currently available on testnet for this build path.

Engineering implications:

- Do not assume ETH is needed for gas.
- Display fees as USDC-denominated user costs.
- Use standard EVM tooling where possible: viem, ethers, Foundry, Hardhat.
- Use Arc Testnet first.
- Do not claim mainnet readiness unless official mainnet addresses and successful mainnet transactions are available.

## Arc Testnet Network

Use the official Arc connection docs before transaction work:

- Connect to Arc: https://docs.arc.io/arc/references/connect-to-arc.md
- Arc explorer: https://testnet.arcscan.app
- Faucet: https://faucet.circle.com
- Public RPC previously used in local testing: `https://rpc.testnet.arc.network`

Implementation notes:

- Wallets must hold Arc Testnet USDC to pay gas and interact with contracts.
- Transaction inclusion can fail or hang if gas fee settings are too low.
- If submitting raw transactions, set `maxFeePerGas` to at least `20 gwei` per official gas guidance.
- A small `maxPriorityFeePerGas`, for example `1 gwei`, can improve inclusion during congestion.

## Gas And Fees

Official gas/fee facts from Arc docs:

- Arc denominates transaction fees in USDC.
- Fee market uses EIP-1559 plus EWMA smoothing.
- Native gas accounting uses USDC with 18 decimals of precision.
- USDC ERC-20 interface uses 6 decimals for application-level balances and transfers.
- Do not mix native gas precision and ERC-20 transfer precision directly.

Common errors to handle:

- `transaction underpriced`: `maxFeePerGas` below minimum base fee floor.
- `intrinsic gas too low`: gas limit too low.
- `insufficient funds for gas * price + value`: wallet lacks enough USDC for value plus fees.

Product/UI implications:

- Show gas as a USDC cost.
- Treat pending receipt issues as a real state, not success.
- Link to Arcscan when tx hashes are available.

## Official Contract Addresses Needed For MVP

Always verify current addresses at:

https://docs.arc.io/arc/references/contract-addresses.md

### Stablecoins

Arc Testnet USDC:

```text
0x3600000000000000000000000000000000000000
```

Notes:

- Optional ERC-20 interface for interacting with the native USDC balance.
- Uses 6 decimals at the ERC-20 interface.
- Required for gas and application-level settlement.

Arc Testnet EURC:

```text
0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a
```

Notes:

- Uses 6 decimals.
- Relevant for later multi-currency settlement, not Phase 1.

### CCTP And Gateway

Arc Testnet CCTP domain:

```text
26
```

GatewayWallet:

```text
0x0077777d7EBA4688BDeF3E311b846F25870A19B9
```

GatewayMinter:

```text
0x0022222ABE238Cc2C7Bb1f21003F0a260052475B
```

Use these only when implementing App Kit, Unified Balance, or crosschain funding flows.

### StableFX

FxEscrow:

```text
0x867650F5eAe8df91445971f14d89fd84F0C9a9f8
```

Notes:

- StableFX should be later phase or research-only in the first delivery.
- StableFX requires Permit2 allowance for USDC before executing FX trades.
- StableFX has important compliance and product-boundary language; do not treat it as a simple retail swap unless official docs support that exact flow.

### Common Ethereum Contracts

CREATE2 Factory:

```text
0x4e59b44847b379578588920cA78FbF26c0B4956C
```

Multicall3:

```text
0xcA11bde05977b3631167028862bE2a173976CA11
```

Permit2:

```text
0x000000000022D473030F116dDEE9F6B43aC78BA3
```

## Agentic Economy Primitives

Official page:

https://docs.arc.io/build/agentic-economy.md

Arc frames agentic economy applications as systems where AI agents operate as first-class economic participants.

Arc points developers to:

- ERC-8004 for agent identity, reputation events, and credential verification.
- ERC-8183 for job lifecycle, escrow funding, deliverable submission, evaluation, and USDC settlement.

### ERC-8004 Agent Identity

Official tutorial:

https://docs.arc.io/arc/tutorials/register-your-first-ai-agent.md

Arc Testnet contracts:

```text
IdentityRegistry:   0x8004A818BFB912233c491871b3d84c89A494BD9e
ReputationRegistry: 0x8004B663056A597Dffe9eCcC1965A193B7388713
ValidationRegistry: 0x8004Cb1BF31DAf7788923b405b754f57acEB4272
```

MVP handling:

- Phase 1/2 may show these as planned or read-only official references.
- Do not claim live agent registration unless a real transaction hash is captured.
- If implementing live registration, prefer the official Circle Wallets path first.

### ERC-8183 Job Lifecycle

Official tutorial:

https://docs.arc.io/arc/tutorials/create-your-first-erc-8183-job.md

Arc Testnet reference contract:

```text
AgenticCommerce: 0x0747EEf0706327138c69792bF28Cd525089e4583
```

Official lifecycle concepts:

- create job;
- fund escrow with USDC;
- submit deliverable hash;
- evaluator approves/completes settlement.

MVP handling:

- Phase 1/2 should mirror this lifecycle offchain first.
- Live chain execution belongs in Phase 3.
- Receipt must distinguish simulated lifecycle from onchain settlement.

## Circle Wallets Path

Arc tutorials heavily use Circle Developer-Controlled Wallets.

Expected credentials:

```text
CIRCLE_API_KEY
CIRCLE_ENTITY_SECRET
```

Official quickstarts create Arc Testnet wallets with:

```text
blockchains: ["ARC-TESTNET"]
accountType: "SCA"
```

Use this path when the goal is grant-aligned and server-driven.

Important boundary:

- Never commit Circle API keys or entity secrets.
- Do not expose entity secret in frontend code.
- Add a server-side only credential check before enabling live Circle Wallet execution.

## App Kit Context

Official overview:

https://docs.arc.io/app-kit.md

App Kit lets developers combine payment and liquidity capabilities:

- Bridge: transfer USDC across chains.
- Send: transfer tokens between wallets on the same chain.
- Swap: exchange tokens on the same blockchain.
- Unified Balance: combine USDC from multiple chains into one chain-agnostic spendable balance.
- Monetization: collect fees in app flows.

Install packages:

```bash
npm install @circle-fin/app-kit
npm install @circle-fin/adapter-viem-v2 viem
```

Other adapters:

```bash
npm install @circle-fin/adapter-ethers-v6 ethers
npm install @circle-fin/adapter-circle-wallets
```

Swap requires a free kit key from Circle Console:

```text
KIT_KEY
```

### Supported Capabilities On Arc Testnet

Official supported blockchains page says Arc Testnet supports:

- Send;
- Bridge;
- Swap;
- Unified Balance.

Important note:

- Among testnets, Arc Testnet supports Swap for USDC, EURC, and cirBTC only.
- App Kit chain identifier is case-sensitive: `Arc_Testnet`.

MVP handling:

- Phase 1/2 should show App Kit as a planned funding/monetization layer.
- Do not implement App Kit execution unless credentials and funded wallet flow are available.

## Circle Agent Stack And Gateway Nanopayments

Recent Arc/Circle announcements position Agent Stack as financial infrastructure for autonomous economic actors.

Components to account for in product design:

- Agent Wallets for controlled access to USDC.
- Agent Marketplace for discovering services.
- Circle CLI for repeatable financial actions.
- Gateway nanopayments for gas-efficient paid API and data-product access.
- Circle Skills for agent-oriented builder workflows.

Engineering handling:

- Phase 1/2 should expose this as a capability map, not as a fake live payment.
- A later nanopayment path must verify buyer funding, seller acceptance, and a real payment receipt.
- Treat x402, MPP, AP2, and nanopayments as payment-negotiation/funding layers that can feed into Arc settlement receipts.

Useful URLs:

- https://agents.circle.com
- https://www.circle.com/blog/introducing-circle-agent-stack-financial-infrastructure-for-the-agentic-economy
- https://developers.circle.com/gateway/nanopayments

## Embedded Wallets And Policy Signing

Arc has highlighted Dynamic and Turnkey as wallet/signing infrastructure for builders.

Product implications:

- browser-extension-only UX is not enough for public or enterprise users;
- user onboarding should eventually support embedded wallets;
- settlement flows should model roles and approvals;
- backend-assisted actions should be narrowed by policy, not unlimited signing authority.

Phase 1/2 handling:

- represent the roles in data and UI:
  - client;
  - provider or agent;
  - evaluator;
  - optional treasury approver.
- do not implement live delegated signing until a provider is chosen and tested.

Useful URLs:

- https://docs.arc.io/arc/tools/account-abstraction
- https://www.dynamic.xyz/docs/overview/authentication/dynamic-auth/auth-methods
- https://www.dynamic.xyz/docs/react/wallets/embedded-wallets/mpc/setup
- https://www.dynamic.xyz/docs/recipes/integrations/swaps/circle-gateway
- https://community.arc.network/home/blogs/arc-turnkey-wallet-and-signing-infrastructure-for-builders-on-arc

## Stablecoin FX Context

Official page:

https://docs.arc.io/build/stablecoin-fx.md

Arc's Stablecoin FX direction emphasizes:

- real-time settlement;
- transparent pricing;
- multi-stablecoin pairs such as USDC and EURC;
- QCAD as a CAD-denominated stablecoin rail on Arc Testnet;
- CAD/USD settlement corridor use cases;
- predictable USDC-denominated fees;
- crosschain liquidity through App Kit bridge and swap;
- fee monetization.

MVP handling:

- StableFX should be later phase or research-only in the first delivery.
- The immediate Arc Agentic Settlement Lab should focus on agent job settlement, not FX.
- Add StableFX only after the ERC-8183 lifecycle is stable.
- QCAD should be treated as a Phase 6 extension unless official execution steps are verified.

## Recommended Local Implementation Order

If an engineering agent cannot browse the internet, implement in this order:

1. Read `docs/ARC_AGENTIC_SETTLEMENT_LAB_PLAN.md`.
2. Read this context file.
3. Build Phase 1/2 only:
   - `Arc Settlement Lab` UI;
   - `/api/arc-settlement`;
   - in-memory job store;
   - offchain lifecycle state machine;
   - deterministic receipt export.
4. Include capability mapping for Agent Stack, nanopayments, App Kit, Dynamic/Turnkey, and StableFX without pretending those integrations are live.
5. Keep live transaction controls disabled unless required environment variables exist.
6. Add clear labels:
   - `Blueprint`;
   - `Simulated`;
   - `Onchain verified`.
7. Require real tx hashes before marking anything as onchain settled.

## Acceptance Criteria For Phase 1/2

- Build and lint pass.
- `/api/arc-settlement` returns official Arc primitive mapping.
- UI shows the lifecycle:
  - draft;
  - open;
  - funded;
  - submitted;
  - settled.
- Receipt export includes:
  - job id;
  - client address;
  - provider address;
  - evaluator address;
  - amount;
  - currency;
  - deliverable hash;
  - receipt hash;
  - lifecycle status;
  - simulated vs onchain flag.
- Public docs do not claim live chain execution.
- No API keys, entity secrets, private keys, mnemonics, or local logs are committed.

## Source URLs

- Arc docs index: https://docs.arc.io/llms.txt
- Connect to Arc: https://docs.arc.io/arc/references/connect-to-arc.md
- Contract addresses: https://docs.arc.io/arc/references/contract-addresses.md
- Gas and fees: https://docs.arc.io/arc/references/gas-and-fees.md
- Agentic Economy: https://docs.arc.io/build/agentic-economy.md
- Register AI Agent: https://docs.arc.io/arc/tutorials/register-your-first-ai-agent.md
- Create ERC-8183 Job: https://docs.arc.io/arc/tutorials/create-your-first-erc-8183-job.md
- App Kit overview: https://docs.arc.io/app-kit.md
- App Kit install: https://docs.arc.io/app-kit/tutorials/installation.md
- App Kit supported blockchains: https://docs.arc.io/app-kit/references/supported-blockchains.md
- Unified Balance: https://docs.arc.io/app-kit/unified-balance.md
- Stablecoin FX: https://docs.arc.io/build/stablecoin-fx.md
- Circle Agent Stack: https://agents.circle.com
- Gateway Nanopayments: https://developers.circle.com/gateway/nanopayments
