// Client-safe receipt formatting utilities (no Node.js built-ins)
import type { ArcSettlementReceipt } from "./types";

/**
 * Render a Markdown summary of the receipt suitable for public articles or reports.
 */
export function receiptToMarkdown(receipt: ArcSettlementReceipt): string {
  const statusBadge =
    receipt.settlementMode === "onchain-verified"
      ? "✅ Onchain verified"
      : "🔵 Simulated";

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

---

*This receipt was produced by Arc Agentic Settlement Lab (Phase 1/2 – offchain simulation).
Live onchain settlement requires real transaction hashes from Arc Testnet.*
`;
}
