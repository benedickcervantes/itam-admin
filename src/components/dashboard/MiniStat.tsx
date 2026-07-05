import type { LucideIcon } from "lucide-react";
import { STAT_COLOR_STYLES, type StatColor } from "./colors";

type MiniStatProps = {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color?: StatColor;
};

export function MiniStat({ label, value, icon: Icon, color = "teal" }: MiniStatProps) {
  const style = STAT_COLOR_STYLES[color];
  return (
    <div className="flex items-center gap-3 rounded-lg bg-slate-900/40 px-3 py-2.5">
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${style.bg} ${style.text}`}
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-lg font-bold leading-tight text-white">{value}</p>
        <p className="truncate text-xs text-slate-400">{label}</p>
      </div>
    </div>
  );
}
