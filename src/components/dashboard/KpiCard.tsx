import type { LucideIcon } from "lucide-react";
import { STAT_COLOR_STYLES, type StatColor } from "./colors";

type KpiCardProps = {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  color?: StatColor;
};

export function KpiCard({ label, value, hint, icon: Icon, color = "teal" }: KpiCardProps) {
  const style = STAT_COLOR_STYLES[color];
  return (
    <div className="card flex items-start gap-3 p-4">
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${style.bg} ${style.text}`}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
        <p className="kpi-value mt-1">{value}</p>
        {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      </div>
    </div>
  );
}
