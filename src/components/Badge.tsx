import { labelEnum } from "@/lib/labels";

const STYLES: Record<string, string> = {
  OK_NO_ISSUES: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  NEEDS_UPGRADE: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
  NEEDS_REPLACEMENT: "bg-orange-500/15 text-orange-300 ring-orange-500/30",
  CRITICAL_IMMEDIATE_ACTION: "bg-red-500/15 text-red-300 ring-red-500/30",
  COMPLETE: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  PENDING: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
  INCOMPLETE: "bg-red-500/15 text-red-300 ring-red-500/30",
  OPEN: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
  IN_PROGRESS: "bg-sky-500/15 text-sky-300 ring-sky-500/30",
  COMPLETED: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  HIGH: "bg-orange-500/15 text-orange-300 ring-orange-500/30",
  IMMEDIATE: "bg-red-500/15 text-red-300 ring-red-500/30",
};

export function Badge({ value }: { value?: string | null }) {
  if (!value) return <span className="text-slate-500">—</span>;
  const style = STYLES[value] ?? "bg-slate-700/50 text-slate-200 ring-slate-600/40";
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${style}`}>
      {labelEnum(value)}
    </span>
  );
}
