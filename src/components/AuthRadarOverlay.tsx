"use client";

import { useEffect, useRef, useState, type ComponentType, type ReactNode } from "react";
import { Check } from "lucide-react";

export type RadarBlip = {
  label: string;
  icon: ComponentType<{ className?: string }>;
};

/** Positions around the radar dial (percent from top-left of the radar box). */
const BLIP_SLOTS = [
  { top: "18%", left: "68%" },
  { top: "62%", left: "78%" },
  { top: "72%", left: "28%" },
  { top: "22%", left: "22%" },
] as const;

const STEP_DURATION = 580;
const FINISH_DELAY = 520;

export default function AuthRadarOverlay({
  blips,
  title,
  subtitle,
  doneTitle,
  doneSubtitle,
  centerIcon,
  zClassName = "z-50",
  onComplete,
}: {
  blips: RadarBlip[];
  title: string;
  subtitle: string;
  doneTitle: string;
  doneSubtitle: string;
  centerIcon: ReactNode;
  zClassName?: string;
  onComplete: () => void;
}) {
  const [foundCount, setFoundCount] = useState(0);
  const [done, setDone] = useState(false);
  const completedRef = useRef(false);

  useEffect(() => {
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const timers: ReturnType<typeof setTimeout>[] = [];

    const finish = () => {
      if (completedRef.current) return;
      completedRef.current = true;
      onComplete();
    };

    if (reduceMotion) {
      setFoundCount(blips.length);
      setDone(true);
      timers.push(setTimeout(finish, 400));
      return () => timers.forEach(clearTimeout);
    }

    blips.forEach((_, index) => {
      timers.push(
        setTimeout(() => setFoundCount(index + 1), STEP_DURATION * (index + 1)),
      );
    });

    const total = STEP_DURATION * blips.length;
    timers.push(setTimeout(() => setDone(true), total));
    timers.push(setTimeout(finish, total + FINISH_DELAY));

    return () => timers.forEach(clearTimeout);
  }, [blips.length, onComplete]);

  const progress = Math.min(100, Math.round((foundCount / blips.length) * 100));

  return (
    <div
      className={`fixed inset-0 ${zClassName} flex items-center justify-center bg-[#0F172A]/95 backdrop-blur-xl login-overlay-fade`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,rgba(46,125,154,0.22),transparent_58%)]" />

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center px-6 text-center">
        {/* Radar dial */}
        <div className="relative mb-6 flex h-52 w-52 items-center justify-center sm:h-56 sm:w-56">
          <div className="radar-dial absolute inset-0 rounded-full border border-[#2E7D9A]/35 bg-[#0B1220]/80 shadow-[inset_0_0_40px_rgba(46,125,154,0.12)]">
            <span className="absolute inset-[18%] rounded-full border border-[#2E7D9A]/25" />
            <span className="absolute inset-[36%] rounded-full border border-[#2E7D9A]/20" />
            <span className="absolute inset-[54%] rounded-full border border-[#2E7D9A]/15" />
            <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-[#2E7D9A]/15" />
            <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-[#2E7D9A]/15" />

            {!done && (
              <span className="radar-sweep absolute inset-0 rounded-full" aria-hidden />
            )}

            {blips.map((blip, index) => {
              const slot = BLIP_SLOTS[index % BLIP_SLOTS.length];
              const visible = index < foundCount;
              const Icon = blip.icon;
              if (!visible) return null;
              return (
                <span
                  key={blip.label}
                  className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
                  style={{ top: slot.top, left: slot.left }}
                  title={blip.label}
                >
                  <span className="radar-blip flex h-8 w-8 items-center justify-center rounded-full border border-[#4FB0CE]/50 bg-[#1E3A5F]/90 text-[#4FB0CE] shadow-[0_0_14px_rgba(79,176,206,0.45)]">
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                </span>
              );
            })}
          </div>

          <span className="relative z-20 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2E7D9A] to-[#1E3A5F] text-white shadow-lg shadow-[#2E7D9A]/35 ring-1 ring-white/10">
            {done ? (
              <Check className="h-8 w-8 login-overlay-check" strokeWidth={3} />
            ) : (
              centerIcon
            )}
          </span>
        </div>

        <h2 className="text-xl font-bold text-white sm:text-2xl">
          {done ? doneTitle : title}
        </h2>
        <p className="mt-1.5 text-sm text-slate-400">
          {done ? doneSubtitle : subtitle}
        </p>

        <div className="mt-5 flex items-center gap-2 text-xs font-medium tracking-wide text-[#4FB0CE]">
          <span className="inline-flex h-1.5 w-1.5 rounded-full bg-[#4FB0CE] shadow-[0_0_8px_rgba(79,176,206,0.8)]" />
          {done
            ? `${blips.length} contacts locked`
            : `${foundCount} / ${blips.length} contacts on scope`}
        </div>

        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-800/80">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#2E7D9A] to-[#4FB0CE] shadow-[0_0_12px_rgba(79,176,206,0.6)] transition-[width] duration-500 ease-out"
            style={{ width: `${done ? 100 : progress}%` }}
          />
        </div>

        <ul className="mt-6 w-full space-y-2 text-left">
          {blips.map((blip, index) => {
            const isFound = index < foundCount;
            const isActive = index === foundCount && !done;
            const Icon = blip.icon;
            return (
              <li
                key={blip.label}
                className={`flex items-center gap-3 rounded-xl border px-3.5 py-2 text-sm transition-all duration-300 ${
                  isFound
                    ? "border-[#2E7D9A]/30 bg-[#1E3A5F]/30 text-white"
                    : isActive
                      ? "border-[#2E7D9A]/40 bg-[#1E3A5F]/15 text-slate-200"
                      : "border-slate-700/40 bg-slate-800/15 text-slate-500"
                }`}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors duration-300 ${
                    isFound
                      ? "bg-[#2E7D9A]/25 text-[#4FB0CE]"
                      : isActive
                        ? "bg-[#2E7D9A]/15 text-[#4FB0CE] radar-blip-pulse"
                        : "bg-slate-700/30 text-slate-500"
                  }`}
                >
                  {isFound ? (
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  ) : (
                    <Icon className="h-3.5 w-3.5" />
                  )}
                </span>
                <span className="font-medium leading-snug">{blip.label}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
