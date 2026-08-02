"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CircleHelp, X } from "lucide-react";

/** `tour-seen:assets` + user → `tour-nudge-dismissed:assets:<userId>` (once per user). */
export function tourNudgeDismissKey(storageKey: string, userId?: string): string {
  const base = storageKey.replace(/^tour-seen:/, "tour-nudge-dismissed:");
  return userId ? `${base}:${userId}` : base;
}

/**
 * Soft hint + header pulse after the first-visit tour has been closed.
 * - Banner: shown once per user per page (auto-marked after first view).
 * - Pulse: stays on as an ongoing reminder that a step-by-step guide exists
 *   (pauses only while the tour overlay is open; clicking How it works does not stop it).
 */
export function useTourHint(storageKey: string, tourOpen: boolean, userId?: string) {
  const [showHint, setShowHint] = useState(false);
  const [showPulse, setShowPulse] = useState(false);
  const hintKey = tourNudgeDismissKey(storageKey, userId);
  /** Keep banner visible for this visit even after we persist "seen once". */
  const hintVisibleThisVisit = useRef(false);

  const markHintSeen = useCallback(() => {
    try {
      localStorage.setItem(hintKey, "1");
    } catch {
      /* ignore */
    }
  }, [hintKey]);

  const refresh = useCallback(() => {
    try {
      const seen = localStorage.getItem(storageKey) === "1";
      const hintAlreadySeen = localStorage.getItem(hintKey) === "1";
      // Persistent reminder — keep pulsing even after How it works is used.
      setShowPulse(!tourOpen && seen);

      if (tourOpen) {
        // Opening the guide closes the banner for this visit (already marked once-seen).
        hintVisibleThisVisit.current = false;
        setShowHint(false);
        return;
      }

      // Keep showing for the rest of this visit until dismiss / guide open.
      if (hintVisibleThisVisit.current) {
        setShowHint(true);
        return;
      }

      if (seen && !hintAlreadySeen) {
        hintVisibleThisVisit.current = true;
        markHintSeen(); // once per user — next visit will not show the banner
        setShowHint(true);
        return;
      }

      setShowHint(false);
    } catch {
      setShowHint(false);
      setShowPulse(false);
    }
  }, [storageKey, tourOpen, hintKey, markHintSeen]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const dismissHint = useCallback(() => {
    markHintSeen();
    hintVisibleThisVisit.current = false;
    setShowHint(false);
  }, [markHintSeen]);

  return { showHint, showPulse, dismissHint, refreshHint: refresh };
}

export function TourNudge({
  show,
  onDismiss,
  onStart,
}: {
  show: boolean;
  onDismiss: () => void;
  onStart: () => void;
}) {
  if (!show) return null;

  return (
    <div
      role="status"
      className="mb-4 flex flex-col gap-3 rounded-xl border border-[#2E7D9A]/35 bg-[#2E7D9A]/10 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-4"
    >
      <div className="flex min-w-0 items-start gap-2.5">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#2E7D9A]/20 text-[#7EC8DC] ring-1 ring-[#2E7D9A]/30">
          <CircleHelp className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-100">Need a refresher on this page?</p>
          <p className="mt-0.5 text-xs leading-relaxed text-slate-400">
            Open <span className="font-medium text-slate-300">How it works</span> anytime for a short
            interactive guide — or start it below.
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
        <button
          type="button"
          onClick={onStart}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#2E7D9A] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#256b85]"
        >
          <CircleHelp className="h-3.5 w-3.5" aria-hidden />
          Start guide
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-600/80 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
          aria-label="Dismiss tip"
        >
          <X className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Dismiss</span>
        </button>
      </div>
    </div>
  );
}

/** CTA for empty list states — always available, not gated on first-visit. */
export function TourEmptyCta({ onStart }: { onStart: () => void }) {
  return (
    <button
      type="button"
      onClick={onStart}
      className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-[#2E7D9A]/40 bg-[#2E7D9A]/10 px-3 py-1.5 text-xs font-medium text-[#7EC8DC] transition hover:border-[#2E7D9A]/60 hover:bg-[#2E7D9A]/15 hover:text-sky-200"
    >
      <CircleHelp className="h-3.5 w-3.5" aria-hidden />
      New here? See how this page works
    </button>
  );
}
