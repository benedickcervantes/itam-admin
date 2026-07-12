"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Loader2, X } from "lucide-react";

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  loading = false,
  error,
  requirePassword = false,
  passwordLabel = "Enter your password to confirm",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  error?: string;
  requirePassword?: boolean;
  passwordLabel?: string;
  onConfirm: (password: string) => void;
  onCancel: () => void;
}) {
  const [password, setPassword] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setPassword("");
      if (requirePassword) {
        const timer = window.setTimeout(() => inputRef.current?.focus(), 50);
        return () => window.clearTimeout(timer);
      }
    }
  }, [open, requirePassword]);

  if (!open) return null;

  const canConfirm = !loading && (!requirePassword || password.length > 0);

  const submit = () => {
    if (!canConfirm) return;
    onConfirm(password);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
        aria-label="Close dialog"
        onClick={onCancel}
        disabled={loading}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
        className="relative w-full max-w-md rounded-xl border border-slate-700 bg-[#1E293B] p-5 shadow-2xl"
      >
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="absolute right-3 top-3 rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-950/50 text-red-400">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="min-w-0 pr-6">
            <h2 id="confirm-dialog-title" className="text-base font-semibold text-white">
              {title}
            </h2>
            <p id="confirm-dialog-message" className="mt-2 text-sm text-slate-400">
              {message}
            </p>
          </div>
        </div>

        {requirePassword && (
          <div className="mt-4">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-slate-300">{passwordLabel}</span>
              <input
                ref={inputRef}
                type="password"
                autoComplete="current-password"
                value={password}
                disabled={loading}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    submit();
                  }
                }}
                placeholder="Password"
                className="w-full rounded-lg border border-slate-600 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none focus:border-[#2E7D9A] focus:ring-1 focus:ring-[#2E7D9A]/40 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </label>
          </div>
        )}

        {error && (
          <p className="mt-3 rounded-lg border border-red-900/50 bg-red-950/40 px-3 py-2 text-sm text-red-400">
            {error}
          </p>
        )}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-600 px-4 text-sm font-medium text-slate-200 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!canConfirm}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-medium text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Deleting..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
