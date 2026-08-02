"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { CircleHelp, X } from "lucide-react";

export type TourStep = {
  /** Optional id so the host page can react (e.g. open a form drawer). */
  id?: string;
  /** CSS selector for the element to highlight. Omit for a centered intro/outro card. */
  target?: string;
  title: string;
  content: string;
  /**
   * `dock-left` / `dock-right` park the card in free viewport space so it never
   * covers a wide drawer/form spotlight (use for New Asset form steps).
   */
  placement?: "top" | "bottom" | "left" | "right" | "auto" | "dock-left" | "dock-right";
  /**
   * Keep this step even if the target is not in the DOM yet (e.g. inside a drawer
   * the host will open when the step becomes active).
   */
  allowMissingTarget?: boolean;
};

type Rect = { top: number; left: number; width: number; height: number };

const PAD = 8;
const CARD_W = 340;
const CARD_H_EST = 280;
const GAP = 12;
const EDGE = 16;

function measure(selector: string | undefined): Rect | null {
  if (!selector || typeof document === "undefined") return null;
  const el = document.querySelector(selector);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width < 1 && r.height < 1) return null;
  return {
    top: r.top - PAD,
    left: r.left - PAD,
    width: r.width + PAD * 2,
    height: r.height + PAD * 2,
  };
}

/** Clip highlight to the visible viewport so huge tables don't swallow the screen. */
function visibleRect(rect: Rect): Rect {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const top = Math.max(EDGE, rect.top);
  const left = Math.max(EDGE, rect.left);
  const right = Math.min(vw - EDGE, rect.left + rect.width);
  const bottom = Math.min(vh - EDGE, rect.top + rect.height);
  return {
    top,
    left,
    width: Math.max(40, right - left),
    height: Math.max(40, bottom - top),
  };
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

type Placement = "top" | "bottom" | "left" | "right" | "center" | "dock-left" | "dock-right";

function overlaps(a: Rect, b: Rect, pad = 8): boolean {
  return !(
    a.left + a.width + pad <= b.left ||
    b.left + b.width + pad <= a.left ||
    a.top + a.height + pad <= b.top ||
    b.top + b.height + pad <= a.top
  );
}

/** Park the card in free viewport space so it never covers the spotlight. */
function dockStyle(rect: Rect | null, maxW: number, prefer: "left" | "right" | "auto"): React.CSSProperties {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const base: React.CSSProperties = {
    position: "fixed",
    width: maxW,
    maxHeight: vh - EDGE * 2,
    overflowY: "auto",
  };

  if (!rect) {
    return { ...base, top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
  }

  const spaceLeft = rect.left - EDGE;
  const spaceRight = vw - (rect.left + rect.width) - EDGE;
  const spaceBottom = vh - (rect.top + rect.height) - EDGE;
  const spaceTop = rect.top - EDGE;
  const midTop = clamp(rect.top + rect.height / 2 - CARD_H_EST / 2, EDGE, vh - CARD_H_EST - EDGE);

  const tryLeft = prefer === "left" || prefer === "auto";
  const tryRight = prefer === "right" || prefer === "auto";

  if (tryLeft && spaceLeft >= maxW + GAP) {
    return { ...base, top: midTop, left: EDGE };
  }
  if (tryRight && spaceRight >= maxW + GAP) {
    return { ...base, top: midTop, left: vw - maxW - EDGE };
  }
  // Opposite side if preferred side is too tight.
  if (!tryLeft && spaceLeft >= maxW + GAP) {
    return { ...base, top: midTop, left: EDGE };
  }
  if (!tryRight && spaceRight >= maxW + GAP) {
    return { ...base, top: midTop, left: vw - maxW - EDGE };
  }
  if (spaceBottom >= CARD_H_EST) {
    return {
      ...base,
      top: clamp(rect.top + rect.height + GAP, EDGE, vh - CARD_H_EST - EDGE),
      left: EDGE,
    };
  }
  if (spaceTop >= CARD_H_EST) {
    return { ...base, top: EDGE, left: EDGE };
  }
  // Narrow / mobile: pin to bottom-left, clear of the spotlight as much as possible.
  return { ...base, top: "auto", bottom: EDGE, left: EDGE };
}

function pickPlacement(preferred: TourStep["placement"], rect: Rect | null): Placement {
  if (!rect) return "center";
  if (preferred === "dock-left" || preferred === "dock-right") return preferred;

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const spaceBelow = vh - (rect.top + rect.height);
  const spaceAbove = rect.top;
  const spaceRight = vw - (rect.left + rect.width);
  const spaceLeft = rect.left;

  // Tall/wide targets: dock beside free space instead of centering over the highlight.
  if (rect.height > vh * 0.45 || rect.width > vw * 0.7) {
    if (spaceLeft >= CARD_W + GAP) return "dock-left";
    if (spaceRight >= CARD_W + GAP) return "dock-right";
    return "dock-left";
  }

  if (preferred && preferred !== "auto") {
    if (preferred === "bottom" && spaceBelow >= CARD_H_EST) return "bottom";
    if (preferred === "top" && spaceAbove >= CARD_H_EST) return "top";
    if (preferred === "right" && spaceRight >= CARD_W + GAP) return "right";
    if (preferred === "left" && spaceLeft >= CARD_W + GAP) return "left";
  }

  if (spaceBelow >= CARD_H_EST) return "bottom";
  if (spaceAbove >= CARD_H_EST) return "top";
  if (spaceRight >= CARD_W + GAP) return "right";
  if (spaceLeft >= CARD_W + GAP) return "left";
  return "dock-left";
}

function cardStyle(rect: Rect | null, placement: Placement): React.CSSProperties {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const maxW = Math.min(CARD_W, vw - EDGE * 2);
  const maxH = vh - EDGE * 2;

  const base: React.CSSProperties = {
    position: "fixed",
    width: maxW,
    maxHeight: maxH,
    overflowY: "auto",
  };

  if (placement === "dock-left") return dockStyle(rect, maxW, "left");
  if (placement === "dock-right") return dockStyle(rect, maxW, "right");

  if (!rect || placement === "center") {
    // Center only when it won't cover the spotlight; otherwise dock away.
    if (rect) {
      const candidate: Rect = {
        top: vh / 2 - CARD_H_EST / 2,
        left: vw / 2 - maxW / 2,
        width: maxW,
        height: CARD_H_EST,
      };
      if (overlaps(candidate, rect)) return dockStyle(rect, maxW, "auto");
    }
    return {
      ...base,
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
    };
  }

  let style: React.CSSProperties;

  if (placement === "bottom") {
    style = {
      ...base,
      top: clamp(rect.top + rect.height + GAP, EDGE, vh - CARD_H_EST - EDGE),
      left: clamp(rect.left + rect.width / 2 - maxW / 2, EDGE, vw - maxW - EDGE),
    };
  } else if (placement === "top") {
    style = {
      ...base,
      top: clamp(rect.top - CARD_H_EST - GAP, EDGE, vh - CARD_H_EST - EDGE),
      left: clamp(rect.left + rect.width / 2 - maxW / 2, EDGE, vw - maxW - EDGE),
    };
  } else if (placement === "right") {
    style = {
      ...base,
      top: clamp(rect.top, EDGE, vh - CARD_H_EST - EDGE),
      left: clamp(rect.left + rect.width + GAP, EDGE, vw - maxW - EDGE),
    };
  } else {
    style = {
      ...base,
      top: clamp(rect.top, EDGE, vh - CARD_H_EST - EDGE),
      left: clamp(rect.left - maxW - GAP, EDGE, vw - maxW - EDGE),
    };
  }

  // If clamping pushed the card onto the highlight, dock into free space instead.
  const cardRect: Rect = {
    top: typeof style.top === "number" ? style.top : EDGE,
    left: typeof style.left === "number" ? style.left : EDGE,
    width: maxW,
    height: CARD_H_EST,
  };
  if (overlaps(cardRect, rect)) return dockStyle(rect, maxW, "auto");
  return style;
}

export function SpotlightTour({
  open,
  steps,
  onClose,
  storageKey,
  onStepChange,
}: {
  open: boolean;
  steps: TourStep[];
  onClose: () => void;
  /** When set, closing the tour marks it as seen so it won't auto-start again. */
  storageKey?: string;
  /** Fires when the active step changes; `null` when the tour closes. */
  onStepChange?: (step: TourStep | null, index: number) => void;
}) {
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [tick, setTick] = useState(0);

  // Re-resolve available targets when the tour opens (skips missing DOM nodes,
  // unless the step opts into allowMissingTarget for deferred UI like drawers).
  const activeSteps = useMemo(() => {
    if (!open) return steps;
    void tick;
    return steps.filter(
      (s) => !s.target || s.allowMissingTarget || Boolean(document.querySelector(s.target)),
    );
  }, [open, steps, tick]);

  const step = activeSteps[index];
  const isLast = index >= activeSteps.length - 1;
  const isFirst = index <= 0;

  const finish = useCallback(() => {
    if (storageKey) {
      try {
        localStorage.setItem(storageKey, "1");
      } catch {
        /* ignore quota / private mode */
      }
    }
    onClose();
  }, [onClose, storageKey]);

  const refresh = useCallback(() => {
    if (!step) return;
    const raw = measure(step.target);
    setRect(raw ? visibleRect(raw) : null);
  }, [step]);

  useEffect(() => {
    if (!open) return;
    setIndex(0);
    setTick((n) => n + 1);
  }, [open]);

  useEffect(() => {
    if (!open) {
      onStepChange?.(null, -1);
      return;
    }
    if (step) onStepChange?.(step, index);
    // Depend on step identity fields, not object reference (host may recreate steps arrays).
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: id/target/index
  }, [open, index, step?.id, step?.target, onStepChange]);

  useLayoutEffect(() => {
    if (!open || !step) return;

    const el = step.target ? document.querySelector(step.target) : null;
    if (el instanceof HTMLElement) {
      // Prefer start so tall tables don't push the card off-screen via center scroll.
      el.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
    }
    const t = window.setTimeout(refresh, 280);
    refresh();
    return () => window.clearTimeout(t);
  }, [open, step, index, refresh]);

  // Wait for deferred targets (drawer / form) to mount after onStepChange opens them.
  useEffect(() => {
    if (!open || !step?.target || !step.allowMissingTarget) return;
    if (rect) return;
    const started = Date.now();
    const id = window.setInterval(() => {
      refresh();
      if (Date.now() - started > 2500) window.clearInterval(id);
    }, 80);
    return () => window.clearInterval(id);
  }, [open, step, rect, refresh]);

  useEffect(() => {
    if (!open) return;
    const onResize = () => refresh();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, [open, refresh]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        finish();
      } else if (e.key === "ArrowRight" || e.key === "Enter") {
        e.preventDefault();
        if (isLast) finish();
        else setIndex((i) => Math.min(activeSteps.length - 1, i + 1));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setIndex((i) => Math.max(0, i - 1));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, isLast, finish, activeSteps.length]);

  useEffect(() => {
    if (!open) return;
    if (index > activeSteps.length - 1) setIndex(Math.max(0, activeSteps.length - 1));
  }, [open, index, activeSteps.length]);

  if (!open || !step || activeSteps.length === 0) return null;

  const placement = pickPlacement(step.placement, rect);
  const hasTarget = Boolean(step.target && rect);

  return (
    <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-labelledby="spotlight-tour-title">
      {/* Dim: solid when no target; cutout uses box-shadow alone so the hole stays clear. */}
      {!hasTarget && <div className="absolute inset-0 bg-slate-950/70" aria-hidden />}

      {hasTarget && rect && (
        <div
          aria-hidden
          className="pointer-events-none absolute rounded-xl ring-2 ring-[#2E7D9A] transition-all duration-200"
          style={{
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            boxShadow: "0 0 0 9999px rgb(2 6 23 / 0.72)",
            background: "transparent",
          }}
        />
      )}

      <div
        className="z-[81] rounded-xl border border-slate-600/80 bg-[#1E293B] p-4 shadow-2xl shadow-black/50"
        style={cardStyle(hasTarget ? rect : null, placement)}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#2E7D9A]/20 text-[#7EC8DC]">
              <CircleHelp className="h-4 w-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                Step {index + 1} of {activeSteps.length}
              </p>
              <h2 id="spotlight-tour-title" className="truncate text-base font-semibold text-white">
                {step.title}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={finish}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
            aria-label="Close tour"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mb-4 text-sm leading-relaxed text-slate-300">{step.content}</p>

        <div className="mb-4 flex flex-wrap gap-1.5" aria-hidden>
          {activeSteps.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? "w-5 bg-[#2E7D9A]" : i < index ? "w-1.5 bg-[#2E7D9A]/50" : "w-1.5 bg-slate-600"
              }`}
            />
          ))}
        </div>

        <div className="sticky bottom-0 flex items-center justify-between gap-2 bg-[#1E293B] pt-1">
          <button
            type="button"
            onClick={finish}
            className="rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          >
            Skip
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isFirst}
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              className="rounded-lg border border-slate-600 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => {
                if (isLast) finish();
                else setIndex((i) => Math.min(activeSteps.length - 1, i + 1));
              }}
              className="rounded-lg bg-[#2E7D9A] px-3 py-2 text-sm font-medium text-white hover:bg-[#256b85]"
            >
              {isLast ? "Done" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Returns true if the tour has not been marked seen yet. */
export function shouldAutoStartTour(storageKey: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(storageKey) !== "1";
  } catch {
    return false;
  }
}
