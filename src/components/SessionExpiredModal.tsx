"use client";

import { useEffect, useState } from "react";
import { LogIn, ShieldCheck } from "lucide-react";
import {
  goToLoginAfterSessionExpiry,
  isSessionExpiredModalPending,
  SESSION_EXPIRED_EVENT,
} from "@/lib/auth/session";

export default function SessionExpiredModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (isSessionExpiredModalPending()) {
      setOpen(true);
    }

    const onExpired = () => setOpen(true);
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
      role="presentation"
    >
      {/* Fully opaque base — no page text should bleed through */}
      <div className="absolute inset-0 bg-[#0B1220]" aria-hidden />
      <div
        className="absolute inset-0 bg-gradient-to-b from-[#0F172A] via-[#0F172A] to-[#0B1525]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(46,125,154,0.14)_0%,transparent_55%)]"
        aria-hidden
      />

      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="session-expired-title"
        aria-describedby="session-expired-message"
        className="relative w-full max-w-[420px] overflow-hidden rounded-2xl border border-slate-600/60 bg-[#1E293B] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.75)]"
      >
        <div className="h-1 w-full bg-gradient-to-r from-[#1E3A5F] via-[#2E7D9A] to-[#4FB0CE]" />

        <div className="px-6 pb-6 pt-7 sm:px-8 sm:pb-8 sm:pt-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#2E7D9A]/35 bg-[#0F172A] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
            <ShieldCheck className="h-7 w-7 text-[#4FB0CE]" strokeWidth={1.75} />
          </div>

          <div className="mt-5 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#4FB0CE]">
              Authentication required
            </p>
            <h2
              id="session-expired-title"
              className="mt-2 text-xl font-semibold tracking-tight text-white sm:text-[1.35rem]"
            >
              Your session has expired
            </h2>
            <p
              id="session-expired-message"
              className="mx-auto mt-3 max-w-[34ch] text-sm leading-relaxed text-slate-300"
            >
              For security, signed-in access ends after a period of inactivity. Please sign in again
              to continue working in IT Asset Management.
            </p>
          </div>

          <button
            type="button"
            autoFocus
            onClick={() => goToLoginAfterSessionExpiry()}
            className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#2E7D9A] text-sm font-semibold text-white shadow-[0_8px_24px_rgba(46,125,154,0.35)] transition-all duration-200 hover:bg-[#256f89] hover:shadow-[0_10px_28px_rgba(46,125,154,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4FB0CE]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1E293B] active:scale-[0.99]"
          >
            <LogIn className="h-4 w-4" />
            Sign in again
          </button>

          <p className="mt-4 text-center text-[11px] leading-relaxed text-slate-500">
            You will return to the secure login page.
          </p>
        </div>
      </div>
    </div>
  );
}
