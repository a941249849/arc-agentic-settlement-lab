import type { JobStatus, SettlementMode } from "@/lib/types";

interface Props {
  status: JobStatus;
  mode?: SettlementMode;
  size?: "sm" | "md";
}

const STATUS_STYLES: Record<JobStatus, string> = {
  draft: "bg-slate-100 text-slate-600 border-slate-200",
  open: "bg-sky-50 text-sky-700 border-sky-200",
  budgeted: "bg-violet-50 text-violet-700 border-violet-200",
  funded: "bg-indigo-50 text-indigo-700 border-indigo-200",
  submitted: "bg-amber-50 text-amber-700 border-amber-200",
  settled: "bg-emerald-50 text-emerald-700 border-emerald-200",
  failed: "bg-red-50 text-red-700 border-red-200",
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
      ? "inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-xs font-medium"
      : "inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border text-sm font-semibold";

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
            : "Pending tx"}
        </span>
      )}
    </span>
  );
}
