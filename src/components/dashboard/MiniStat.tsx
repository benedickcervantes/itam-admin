import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { STAT_COLOR_STYLES, type StatColor } from "./colors";

type MiniStatProps = {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color?: StatColor;
  /** When set, the stat opens this page (e.g. IT Audit filtered to OK). */
  href?: string;
};

export function MiniStat({ label, value, icon: Icon, color = "teal", href }: MiniStatProps) {
  const style = STAT_COLOR_STYLES[color];
  const body = (
    <>
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${style.bg} ${style.text}`}
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-lg font-bold leading-tight text-white">{value}</p>
        <p className="truncate text-xs text-slate-400">{label}</p>
      </div>
    </>
  );

  const className = "flex items-center gap-3 rounded-lg bg-slate-900/40 px-3 py-2.5";
  if (href) {
    return (
      <Link
        href={href}
        className={`${className} transition hover:bg-slate-800/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D9A]/60`}
      >
        {body}
      </Link>
    );
  }

  return <div className={className}>{body}</div>;
}
