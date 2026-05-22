"use client";

import { useState } from "react";
import type { ArcSettlementReceipt } from "@/lib/types";
import { receiptToMarkdown } from "@/lib/receipt-format";

interface Props {
  receipt: ArcSettlementReceipt;
}

export default function ReceiptExport({ receipt }: Props) {
  const [tab, setTab] = useState<"json" | "markdown">("json");
  const [copied, setCopied] = useState(false);

  const content =
    tab === "json"
      ? JSON.stringify(receipt, null, 2)
      : receiptToMarkdown(receipt);

  async function copy() {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function download() {
    const ext = tab === "json" ? "json" : "md";
    const mime = tab === "json" ? "application/json" : "text/markdown";
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `arc-receipt-${receipt.jobId.slice(0, 8)}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="rounded-xl border border-gray-700 bg-gray-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gray-800/60">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white">Settlement Receipt</span>
          <span
            className={`px-2 py-0.5 rounded text-xs border ${
              receipt.settlementMode === "onchain-verified"
                ? "bg-green-900/60 text-green-300 border-green-700"
                : receipt.settlementMode === "onchain-partial"
                ? "bg-emerald-900/60 text-emerald-300 border-emerald-700"
                : "bg-blue-900/60 text-blue-300 border-blue-700"
            }`}
          >
            {receipt.settlementMode === "onchain-verified"
              ? "✅ Onchain verified"
              : receipt.settlementMode === "onchain-partial"
              ? "🟢 Partial onchain"
              : "🔵 Simulated"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Tab selector */}
          <div className="flex rounded border border-gray-600 overflow-hidden text-xs">
            <button
              onClick={() => setTab("json")}
              className={`px-3 py-1 ${
                tab === "json" ? "bg-blue-700 text-white" : "text-gray-400 hover:bg-gray-700"
              }`}
            >
              JSON
            </button>
            <button
              onClick={() => setTab("markdown")}
              className={`px-3 py-1 ${
                tab === "markdown" ? "bg-blue-700 text-white" : "text-gray-400 hover:bg-gray-700"
              }`}
            >
              Markdown
            </button>
          </div>
          <button
            onClick={copy}
            className="px-3 py-1 rounded border border-gray-600 text-xs text-gray-300 hover:bg-gray-700 transition-colors"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
          <button
            onClick={download}
            className="px-3 py-1 rounded border border-blue-700 text-xs text-blue-300 hover:bg-blue-900/40 transition-colors"
          >
            Download
          </button>
        </div>
      </div>

      {/* Receipt hash */}
      <div className="px-4 py-2 bg-gray-800/30 border-b border-gray-700 flex items-center gap-2">
        <span className="text-xs text-gray-500">Receipt hash:</span>
        <code className="text-xs font-mono text-green-400 break-all">{receipt.receiptHash}</code>
      </div>

      {/* Content */}
      <pre className="p-4 overflow-auto text-xs font-mono text-gray-300 max-h-96 whitespace-pre-wrap">
        {content}
      </pre>
    </div>
  );
}
