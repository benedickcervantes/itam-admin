"use client";

import {
  CheckCircle2,
  CircleDot,
  Wrench,
  BookmarkCheck,
  Archive,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { labelEnum } from "@/lib/labels";

type AssetStatusRow = { status: string; count: number };

type StatusMeta = {
  icon: LucideIcon;
  accent: string;
  soft: string; // translucent tint for icon backdrop
};

const STATUS_META: Record<string, StatusMeta> = {
  IN_USE: { icon: CircleDot, accent: "#0EA5E9", soft: "rgba(14,165,233,0.12)" },
  AVAILABLE: { icon: CheckCircle2, accent: "#10B981", soft: "rgba(16,185,129,0.12)" },
  UNDER_REPAIR: { icon: Wrench, accent: "#F59E0B", soft: "rgba(245,158,11,0.12)" },
  RESERVED: { icon: BookmarkCheck, accent: "#8B5CF6", soft: "rgba(139,92,246,0.12)" },
  RETIRED: { icon: Archive, accent: "#94A3B8", soft: "rgba(148,163,184,0.12)" },
  DISPOSED: { icon: Trash2, accent: "#EF4444", soft: "rgba(239,68,68,0.12)" },
};

const STATUS_ORDER = ["IN_USE", "AVAILABLE", "UNDER_REPAIR", "RESERVED", "RETIRED", "DISPOSED"];

const FALLBACK: StatusMeta = { icon: CircleDot, accent: "#64748B", soft: "rgba(100,116,139,0.12)" };

export function AssetStatusGlance({ data = [] }: { data?: AssetStatusRow[] }) {
  const counts = new Map(data.map((row) => [row.status, row.count]));
  const total = data.reduce((sum, row) => sum + row.count, 0);

  const ordered = [
    ...STATUS_ORDER.filter((s) => counts.has(s)),
    ...data.map((r) => r.status).filter((s) => !STATUS_ORDER.includes(s)),
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
      {ordered.map((status) => {
        const meta = STATUS_META[status] ?? FALLBACK;
        const Icon = meta.icon;
        const count = counts.get(status) ?? 0;
        const share = total === 0 ? 0 : Math.round((count / total) * 100);
        return (
          <div
            key={status}
            className="group relative flex flex-col overflow-hidden rounded-xl border border-slate-700/60 bg-slate-800/40 p-4 transition-colors hover:border-slate-600"
          >
            <span
              className="absolute inset-y-0 left-0 w-[3px]"
              style={{ backgroundColor: meta.accent }}
            />

            <div className="flex items-center">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-lg"
                style={{ backgroundColor: meta.soft, color: meta.accent }}
              >
                <Icon className="h-[18px] w-[18px]" />
              </span>
            </div>

            <p className="mt-4 text-[2rem] font-semibold leading-none tracking-tight text-white tabular-nums">
              {count.toLocaleString()}
            </p>
            <p className="mt-1.5 text-[11px] font-medium uppercase tracking-wider text-slate-400">
              {labelEnum(status)}
            </p>

            <div className="mt-3 h-1 overflow-hidden rounded-full bg-slate-700/40">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${share}%`, backgroundColor: meta.accent }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
