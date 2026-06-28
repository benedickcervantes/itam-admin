"use client";

import { X } from "lucide-react";

export function Drawer({
  open,
  title,
  subtitle,
  onClose,
  children,
  toolbar,
  footer,
  wide,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  toolbar?: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-[2px]">
      <button type="button" className="flex-1" aria-label="Close drawer" onClick={onClose} />
      <div
        className={`flex h-full w-full flex-col bg-[#1E293B] shadow-2xl sm:max-w-xl ${wide ? "lg:max-w-4xl" : ""}`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-700 px-4 py-3 sm:px-5 sm:py-4">
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-white sm:text-lg">{title}</h2>
            {subtitle && <p className="mt-0.5 text-sm text-slate-400">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
        {toolbar && (
          <div className="shrink-0 border-b border-slate-700/60 px-4 py-2.5 sm:px-5">{toolbar}</div>
        )}
        <div data-drawer-scroll className="flex-1 overflow-y-auto p-4 sm:p-5">
          {children}
        </div>
        {footer && (
          <div className="border-t border-slate-700 bg-[#1E293B]/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:px-5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function Field({
  label,
  children,
  required,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-slate-300">
        {label}
        {required && <span className="text-red-400"> *</span>}
      </span>
      {children}
    </label>
  );
}

export const inputClass =
  "w-full rounded-lg border border-slate-600 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none focus:border-[#2E7D9A] focus:ring-1 focus:ring-[#2E7D9A]/40";

export const selectClass =
  "w-full appearance-none rounded-lg border border-slate-600 bg-slate-900/80 bg-[length:1rem] bg-[right_0.65rem_center] bg-no-repeat px-3 py-2.5 pr-9 text-sm text-white outline-none focus:border-[#2E7D9A] focus:ring-1 focus:ring-[#2E7D9A]/40 [background-image:url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2224%22 height=%2224%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%2394a3b8%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3E%3Cpath d=%22m6 9 6 6 6-6%22/%3E%3C/svg%3E')]";
