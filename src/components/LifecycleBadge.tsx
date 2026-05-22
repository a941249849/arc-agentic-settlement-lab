import type { JobStatus, SettlementMode } from "@/lib/types";

interface Props {
  status: JobStatus;
  mode?: SettlementMode;
  size?: "sm" | "md";
}

const STATUS_STYLES: Record<JobStatus, string> = {
  draft: "bg-gray-700 text-gray-300 border-gray-600",
  open: "bg-sky-900/70 text-sky-300 border-sky-700",
  budgeted: "bg-violet-900/70 text-violet-300 border-violet-700",
  funded: "bg-indigo-900/70 text-indigo-300 border-indigo-700",
  submitted: "bg-yellow-900/70 text-yellow-300 border-yellow-700",
  settled: "bg-green-900/70 text-green-300 border-green-700",
  failed: "bg-red-900/70 text-red-400 border-red-700",
};

const STATUS_MARKS: Record<JobStatus, string> = {
  draft: "DR",
  open: "OP",
  budgeted: "BD",
  funded: "FD",
  submitted: "SB",
  settled: "ST",
  failed: "FL",
};

export default function LifecycleBadge({ status, mode, size = "md" }: Props) {
  const base =
    size === "sm"
      ? "inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-medium"
      : "inline-flex items-center gap-1.5 px-3 py-1 rounded border text-sm font-semibold";

  return (
    <span className={`${base} ${STATUS_STYLES[status]}`}>
      <span className="font-mono text-[10px] opacity-80">{STATUS_MARKS[status]}</span>
      <span className="capitalize">{status}</span>
      {mode && (
        <span className="ml-1 opacity-70 font-normal">
          ·{" "}
          {mode === "onchain-verified"
            ? "Onchain"
            : mode === "onchain-partial"
            ? "Partial"
            : "Sim"}
        </span>
      )}
    </span>
  );
}
