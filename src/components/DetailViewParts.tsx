"use client";

import type { LucideIcon } from "lucide-react";
import { formatEnumLabel } from "@/components/Select";

export function fmtLabel(value?: string | null) {
  if (!value?.trim()) return null;
  return formatEnumLabel(value.trim());
}

export function DetailRow({ label, value }: { label: string; value?: string | null }) {
  const text = value?.trim();
  if (!text) return null;
  return (
    <div className="grid min-w-0 gap-0.5 border-b border-slate-700/35 py-2 last:border-0 sm:grid-cols-[7.5rem_minmax(0,1fr)] sm:gap-3 sm:py-2.5">
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="min-w-0 text-sm leading-relaxed break-words text-slate-100 [overflow-wrap:anywhere] whitespace-pre-wrap">
        {text}
      </dd>
    </div>
  );
}

export function DetailSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <section className="min-w-0 overflow-hidden rounded-xl border border-slate-700/70 bg-slate-900/30">
      <div className="flex items-center gap-2.5 border-b border-slate-700/50 bg-slate-800/35 px-4 py-2.5">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#2E7D9A]/15">
          <Icon className="h-3.5 w-3.5 text-[#2E7D9A]" />
        </span>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-300">{title}</h3>
      </div>
      <dl className="min-w-0 px-4 py-1">{children}</dl>
    </section>
  );
}

export function DetailNotes({ title = "Notes", value }: { title?: string; value?: string | null }) {
  if (!value?.trim()) return null;
  return (
    <section className="rounded-xl border border-slate-700/70 bg-slate-900/30 p-4">
      <h3 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-200 whitespace-pre-wrap break-words">{value}</p>
    </section>
  );
}
