const ASSESSMENT_BAR_COLORS: Record<string, string> = {
  OK_NO_ISSUES: "#10B981",
  NEEDS_UPGRADE: "#F59E0B",
  NEEDS_REPLACEMENT: "#F97316",
  CRITICAL_IMMEDIATE_ACTION: "#EF4444",
};

export function CountPill({ value, warnWhenPositive = true }: { value: number; warnWhenPositive?: boolean }) {
  const isWarning = warnWhenPositive && value > 0;
  const style = isWarning
    ? "bg-red-500/15 text-red-300 ring-red-500/30"
    : "bg-slate-700/50 text-slate-300 ring-slate-600/40";
  return (
    <span className={`inline-flex min-w-[2rem] justify-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${style}`}>
      {value}
    </span>
  );
}

export function PercentBar({ percent, colorKey }: { percent: number; colorKey?: string }) {
  const color = (colorKey && ASSESSMENT_BAR_COLORS[colorKey]) || "#2E7D9A";
  const width = Math.max(0, Math.min(100, Math.round(percent * 100)));
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-700/60">
        <div className="h-full rounded-full" style={{ width: `${width}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs text-slate-400">{width}%</span>
    </div>
  );
}
