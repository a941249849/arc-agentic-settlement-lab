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
    <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-950">Trade Settlement Receipt</span>
          <span
            className={`px-2 py-0.5 rounded-lg text-xs border ${
              receipt.settlementMode === "onchain-verified"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : receipt.settlementMode === "onchain-partial"
                ? "bg-sky-50 text-sky-700 border-sky-200"
                : "bg-slate-100 text-slate-600 border-slate-200"
            }`}
          >
            {receipt.settlementMode === "onchain-verified"
              ? "Onchain verified"
              : receipt.settlementMode === "onchain-partial"
              ? "Partial onchain"
              : "Simulated"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Tab selector */}
          <div className="flex rounded-lg border border-slate-200 overflow-hidden text-xs">
            <button
              onClick={() => setTab("json")}
              className={`px-3 py-1 ${
                tab === "json" ? "bg-slate-950 text-white" : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              JSON
            </button>
            <button
              onClick={() => setTab("markdown")}
              className={`px-3 py-1 ${
                tab === "markdown" ? "bg-slate-950 text-white" : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              Markdown
            </button>
          </div>
          <button
            onClick={copy}
            className="px-3 py-1 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
          <button
            onClick={download}
            className="px-3 py-1 rounded-lg border border-emerald-200 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors"
          >
            Download
          </button>
        </div>
      </div>

      {/* Receipt hash */}
      <div className="px-4 py-2 bg-white border-b border-slate-200 flex items-center gap-2">
        <span className="text-xs text-slate-500">Receipt hash:</span>
        <code className="text-xs font-mono text-emerald-700 break-all">{receipt.receiptHash}</code>
      </div>

      {/* Content */}
      <pre className="p-4 overflow-auto text-xs font-mono text-slate-700 max-h-96 whitespace-pre-wrap">
        {content}
      </pre>
    </div>
  );
}
