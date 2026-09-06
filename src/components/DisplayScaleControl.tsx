"use client";

import { Check, Info, Scaling } from "lucide-react";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useDisplayScale } from "@/components/DisplayScaleContext";
import {
  DISPLAY_SCALE_EVENT,
  DISPLAY_SCALE_OPTIONS,
  getDisplaySizeLabel,
  type DisplayScaleMode,
  type DisplayScalePercent,
} from "@/lib/display-scale";

const PANEL_WIDTH = 320;
const PANEL_GAP = 8;

function usePanelPosition(
  open: boolean,
  anchorRef: React.RefObject<HTMLElement | null>,
  placement: "down" | "up",
) {
  const [style, setStyle] = useState<React.CSSProperties>({ visibility: "hidden" });

  useLayoutEffect(() => {
    if (!open || !anchorRef.current) return;

    const update = () => {
      const rect = anchorRef.current!.getBoundingClientRect();
      const width = Math.min(PANEL_WIDTH, window.innerWidth - 16);
      const left = Math.min(Math.max(8, rect.right - width), window.innerWidth - width - 8);
      const openUp =
        placement === "up" ||
        (window.innerHeight - rect.bottom < 280 && rect.top > window.innerHeight - rect.bottom);

      setStyle(
        openUp
          ? {
              position: "fixed",
              left,
              width,
              bottom: window.innerHeight - rect.top + PANEL_GAP,
              visibility: "visible",
            }
          : {
              position: "fixed",
              left,
              width,
              top: rect.bottom + PANEL_GAP,
              visibility: "visible",
            },
      );
    };

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    window.addEventListener(DISPLAY_SCALE_EVENT, update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
      window.removeEventListener(DISPLAY_SCALE_EVENT, update);
    };
  }, [open, anchorRef, placement]);

  return style;
}

function ScalePanel({
  scale,
  mode,
  recommended,
  onSelect,
  onSelectAuto,
  listId,
}: {
  scale: DisplayScalePercent;
  mode: DisplayScaleMode;
  recommended: DisplayScalePercent;
  onSelect: (value: DisplayScalePercent) => void;
  onSelectAuto: () => void;
  listId: string;
}) {
  const displaySize = getDisplaySizeLabel();
  const autoSelected = mode === "auto";

  return (
    <div className="rounded-xl border border-slate-600/80 bg-[#1E293B] shadow-2xl ring-1 ring-black/30">
      <div className="border-b border-slate-700/70 px-3.5 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Display</p>
        <p className="mt-0.5 text-sm font-semibold text-white">Scale & layout</p>
      </div>

      <div className="px-3.5 py-3">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#2E7D9A]/15 text-[#7EC8DC] ring-1 ring-[#2E7D9A]/30">
            <Scaling className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white">Scale</p>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-400">
              Auto-detects this screen, then zooms out when the display is small.
            </p>
          </div>
        </div>

        <p className="mt-3 flex items-start gap-1.5 text-[11px] leading-relaxed text-[#7EC8DC]">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          Detected {displaySize || "this display"}. Recommended {recommended}%.
        </p>
      </div>

      <ul id={listId} role="listbox" aria-label="Display scale" className="border-t border-slate-700/70 p-1.5">
        <li role="option" aria-selected={autoSelected}>
          <button
            type="button"
            onClick={onSelectAuto}
            className={`relative flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${
              autoSelected ? "bg-[#2E7D9A]/15 text-white" : "text-slate-200 hover:bg-slate-700/50"
            }`}
          >
            {autoSelected && (
              <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-r-full bg-[#4FB0CE]" aria-hidden />
            )}
            <span className="min-w-0 flex-1">
              Auto
              <span className="ml-1.5 text-xs font-normal text-[#7EC8DC]">({recommended}%)</span>
            </span>
            {autoSelected && <Check className="h-4 w-4 shrink-0 text-[#4FB0CE]" aria-hidden />}
          </button>
        </li>
        {DISPLAY_SCALE_OPTIONS.map((option) => {
          const selected = !autoSelected && option === scale;
          const isRecommended = option === recommended;
          return (
            <li key={option} role="option" aria-selected={selected}>
              <button
                type="button"
                onClick={() => onSelect(option)}
                className={`relative flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${
                  selected
                    ? "bg-[#2E7D9A]/15 text-white"
                    : "text-slate-200 hover:bg-slate-700/50"
                }`}
              >
                {selected && (
                  <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-r-full bg-[#4FB0CE]" aria-hidden />
                )}
                <span className="min-w-0 flex-1 tabular-nums">
                  {option}%
                  {isRecommended && (
                    <span className="ml-1.5 text-xs font-normal text-[#7EC8DC]">(Recommended)</span>
                  )}
                </span>
                {selected && <Check className="h-4 w-4 shrink-0 text-[#4FB0CE]" aria-hidden />}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ScalePopover({
  open,
  onClose,
  anchorRef,
  placement,
  children,
}: {
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
  placement: "down" | "up";
  children: React.ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const panelStyle = usePanelPosition(open, anchorRef, placement);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDoc = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!anchorRef.current?.contains(target) && !panelRef.current?.contains(target)) {
        onClose();
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, anchorRef]);

  if (!mounted || !open) return null;

  return createPortal(
    <div ref={panelRef} style={panelStyle} className="z-[80]">
      {children}
    </div>,
    document.body,
  );
}

export function HeaderDisplayScaleButton() {
  const { scale, mode, recommended, setScale, setAuto } = useDisplayScale();
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listId = useId();

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((value) => !value)}
        className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-xs font-medium transition sm:px-2.5 sm:text-sm ${
          open
            ? "border-[#2E7D9A]/70 bg-[#2E7D9A]/15 text-white"
            : "border-slate-600/80 bg-slate-800/60 text-slate-200 hover:border-[#2E7D9A]/50 hover:bg-slate-800 hover:text-white"
        }`}
        title={mode === "auto" ? `Auto scale ${scale}% for this display` : `Manual display scale ${scale}%`}
        aria-label={mode === "auto" ? `Auto display scale ${scale} percent` : `Display scale ${scale} percent`}
      >
        <Scaling className="h-4 w-4 text-[#7EC8DC]" aria-hidden />
        <span className="hidden tabular-nums sm:inline">{mode === "auto" ? `Auto ${scale}%` : `${scale}%`}</span>
      </button>
      <ScalePopover open={open} onClose={() => setOpen(false)} anchorRef={buttonRef} placement="down">
        <ScalePanel
          scale={scale}
          mode={mode}
          recommended={recommended}
          listId={listId}
          onSelect={setScale}
          onSelectAuto={setAuto}
        />
      </ScalePopover>
    </>
  );
}
