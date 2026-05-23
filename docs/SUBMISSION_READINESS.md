# Submission Readiness

## Product direction

**ArcEscrow - Agentic Letter of Credit** targets the overlap between three official themes:

- cross-border stablecoin payment and remittance;
- SME financing and trade workflow;
- agentic economy.

The product is not positioned as a generic transfer UI. It is an invoice-backed settlement workflow where an importer agent creates a trade request, a supplier agent sets a USDC budget, funds move through ERC-8183 escrow on Arc, the supplier submits deliverable proof, an evaluator approves settlement, and the final receipt binds trade context, identity, lifecycle state, and transaction evidence.

## Defensible live claims

- USDC-denominated settlement workflow on Arc Testnet.
- ERC-8004 IdentityRegistry reads for agent owner and metadata verification.
- ERC-8183 AgenticCommerce transaction preparation and wallet-submitted execution path.
- Trade receipt export with invoice ID, buyer/supplier countries, goods or service, compliance status, deliverable hash, tx hash slots, and receipt hash.
- Public frontend and backend APIs deployed on Vercel.

## Do not overclaim

- Do not claim Circle Wallets execution until API credentials and server-side wallet flow are integrated.
- Do not claim Gateway / Nanopayments execution until paid access or payment challenge flow is live.
- Do not claim CCTP, USYC, or StableFX execution until a working transaction path exists.
- Do not mark a receipt as `onchain-verified` unless the complete ERC-8183 transaction sequence is recorded.

## Final submission gate

Before submitting as a finished product, capture one full Arc Testnet run:

1. `createJob`
2. `setBudget`
3. `approve`
4. `fund`
5. `submit`
6. `complete`

Record the tx hashes, verify them through Arcscan or the app's tx parser, export the receipt, and record a short video showing the trade console, identity verifier, onchain steps, and receipt.

## Next integrations

- Circle Wallets: policy-controlled agent treasury and server-side signing.
- Gateway / Nanopayments: paid document/report/API access before trade settlement.
- CCTP / Bridge Kit: buyer funds originating outside Arc.
- StableFX: FX-aware supplier payout or local currency quoting.
- USYC: treasury or compliant yield extension for idle SME balances.
