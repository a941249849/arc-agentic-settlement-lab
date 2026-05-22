// Client-safe receipt formatting utilities (no Node.js built-ins)
import type { ArcSettlementReceipt } from "./types";

/**
 * Render a Markdown summary of the receipt suitable for public articles or reports.
 */
export function receiptToMarkdown(receipt: ArcSettlementReceipt): string {
  const statusBadge =
    receipt.settlementMode === "onchain-verified"
      ? "Onchain verified"
      : receipt.settlementMode === "onchain-partial"
      ? "Partial onchain"
      : "Simulated";

  const txEntries = Object.entries(receipt.txHashes).filter(([, v]) => v);
  const txSection = txEntries.length
    ? `## Transaction References\n\n${txEntries.map(([k, v]) => `- **${k}**: \`${v}\``).join("\n")}\n`
    : "";

  return `# Arc Agentic Settlement Receipt

| Field | Value |
|---|---|
| Receipt version | \`${receipt.receiptVersion}\` |
| Network | ${receipt.network} |
| Job ID | \`${receipt.jobId}\` |
| ERC-8183 job ID | \`${receipt.onchainJobId ?? "—"}\` |
| Lifecycle status | **${receipt.lifecycleStatus}** |
| Settlement mode | ${statusBadge} |

## Parties

| Role | Address |
|---|---|
| Client | \`${receipt.clientAddress}\` |
| Provider | \`${receipt.providerAddress}\` |
| Evaluator | \`${receipt.evaluatorAddress}\` |

## Settlement

| Field | Value |
|---|---|
| Amount | ${receipt.amount} ${receipt.currency} |
| Provider budget | ${receipt.budget.amount} ${receipt.currency} |
| Deliverable hash | \`${receipt.deliverableHash || "—"}\` |
| Receipt hash | \`${receipt.receiptHash}\` |
| Created at | ${receipt.createdAt} |

${txSection}
## Agent Identity

- Standard: **${receipt.agentIdentity?.standard ?? "—"}**
- Registry: \`${receipt.agentIdentity?.registryAddress ?? "—"}\`
- Agent ID: \`${receipt.agentIdentity?.agentId ?? "—"}\`
- Owner: \`${receipt.agentIdentity?.ownerAddress ?? "—"}\`
- Metadata URI: \`${receipt.agentIdentity?.metadataURI ?? "—"}\`
- Verified: **${receipt.agentIdentity?.isVerified ? "yes" : "no"}**

---

*This receipt was produced by Arc Agentic Commerce Settlement (ERC-8004 identity proof plus ERC-8183 wallet execution controls).
Live ERC-8183 settlement requires real transaction hashes from Arc Testnet.*
`;
}
