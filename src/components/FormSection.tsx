"use client";

import { ChevronDown, type LucideIcon } from "lucide-react";
import { useState, type ReactNode } from "react";

export function FormSection({
  id,
  title,
  icon: Icon,
  children,
  defaultOpen = true,
}: {
  id?: string;
  title: string;
  icon?: LucideIcon;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section
      id={id}
      className={`overflow-hidden rounded-xl border border-slate-700/70 bg-slate-900/25 ${id ? "scroll-mt-3" : ""}`}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 border-b border-slate-700/50 bg-slate-800/35 px-4 py-3 text-left transition hover:bg-slate-800/55"
      >
        {Icon && (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#2E7D9A]/15">
            <Icon className="h-4 w-4 text-[#2E7D9A]" />
          </span>
        )}
        <h3 className="flex-1 text-sm font-semibold text-white">{title}</h3>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <div className="space-y-4 p-4">{children}</div>}
    </section>
  );
}

export function Subsection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-3 rounded-lg border border-slate-700/50 bg-slate-950/25 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#2E7D9A]/90">{title}</p>
      {children}
    </div>
  );
}

export function RecordedPreview({ label, value }: { label: string; value: string }) {
  const empty = !value || value === "—";
  return (
    <p className="rounded-md border border-slate-700/40 bg-slate-900/40 px-3 py-2 text-xs text-slate-500">
      <span className="font-medium text-slate-400">{label}:</span>{" "}
      <span
        className={`mt-1 block max-h-28 overflow-y-auto whitespace-pre-wrap break-words ${
          empty ? "text-slate-500" : "text-slate-200"
        }`}
      >
        {empty ? "Not specified" : value}
      </span>
    </p>
  );
}
