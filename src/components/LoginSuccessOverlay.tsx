"use client";

import { useEffect, useRef, useState, type ComponentType } from "react";
import {
  Check,
  Laptop,
  Loader2,
  ScanLine,
  Server,
  ShieldCheck,
} from "lucide-react";

type Step = {
  label: string;
  icon: ComponentType<{ className?: string }>;
};

const STEPS: Step[] = [
  { label: "Verifying credentials", icon: ShieldCheck },
  { label: "Syncing hardware inventory", icon: Server },
  { label: "Scanning asset registry", icon: ScanLine },
  { label: "Preparing your workspace", icon: Laptop },
];

const STEP_DURATION = 620;
const FINISH_DELAY = 520;

export default function LoginSuccessOverlay({
  userName,
  onComplete,
}: {
  userName?: string | null;
  onComplete: () => void;
}) {
  const [activeStep, setActiveStep] = useState(0);
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
      setActiveStep(STEPS.length);
      setDone(true);
      timers.push(setTimeout(finish, 400));
      return () => timers.forEach(clearTimeout);
    }

    STEPS.forEach((_, index) => {
      timers.push(
        setTimeout(() => setActiveStep(index + 1), STEP_DURATION * (index + 1)),
      );
    });

    const total = STEP_DURATION * STEPS.length;
    timers.push(setTimeout(() => setDone(true), total));
    timers.push(setTimeout(finish, total + FINISH_DELAY));

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  const progress = Math.min(100, Math.round((activeStep / STEPS.length) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/95 backdrop-blur-xl login-overlay-fade">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(46,125,154,0.18),transparent_60%)]" />

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center px-6 text-center">
        {/* Central hub icon */}
        <div className="relative mb-8 flex h-24 w-24 items-center justify-center">
          <span className="login-overlay-ring absolute inset-0 rounded-full border border-[#2E7D9A]/40" />
          <span
            className="login-overlay-ring absolute inset-0 rounded-full border border-[#2E7D9A]/25"
            style={{ animationDelay: "0.6s" }}
          />
          <span className="absolute inset-2 rounded-full bg-[#2E7D9A]/15 blur-md login-overlay-glow" />
          <span className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2E7D9A] to-[#1E3A5F] text-white shadow-lg shadow-[#2E7D9A]/30 ring-1 ring-white/10 transition-transform duration-500">
            {done ? (
              <Check className="h-8 w-8 login-overlay-check" strokeWidth={3} />
            ) : (
              <Server className="h-8 w-8" />
            )}
          </span>
        </div>

        <h2 className="text-xl font-bold text-white sm:text-2xl">
          {done
            ? userName
              ? `Welcome, ${userName.split(" ")[0]}`
              : "You're all set"
            : "Signing you in"}
        </h2>
        <p className="mt-1.5 text-sm text-slate-400">
          {done
            ? "Opening your IT asset dashboard…"
            : "Getting your asset management portal ready"}
        </p>

        {/* Progress bar */}
        <div className="mt-7 h-1.5 w-full overflow-hidden rounded-full bg-slate-800/80">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#2E7D9A] to-[#4FB0CE] shadow-[0_0_12px_rgba(79,176,206,0.6)] transition-[width] duration-500 ease-out"
            style={{ width: `${done ? 100 : progress}%` }}
          />
        </div>

        {/* Step list */}
        <ul className="mt-7 w-full space-y-2.5 text-left">
          {STEPS.map((step, index) => {
            const isDone = index < activeStep;
            const isActive = index === activeStep && !done;
            const Icon = step.icon;
            return (
              <li
                key={step.label}
                className={`flex items-center gap-3 rounded-xl border px-3.5 py-2.5 text-sm transition-all duration-300 ${
                  isDone
                    ? "border-[#2E7D9A]/30 bg-[#1E3A5F]/30 text-white"
                    : isActive
                      ? "border-[#2E7D9A]/40 bg-[#1E3A5F]/20 text-slate-200"
                      : "border-slate-700/40 bg-slate-800/20 text-slate-500"
                }`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors duration-300 ${
                    isDone
                      ? "bg-[#2E7D9A]/20 text-[#4FB0CE]"
                      : isActive
                        ? "bg-[#2E7D9A]/15 text-[#4FB0CE]"
                        : "bg-slate-700/30 text-slate-500"
                  }`}
                >
                  {isDone ? (
                    <Check className="h-4 w-4" strokeWidth={3} />
                  ) : isActive ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </span>
                <span className="font-medium">{step.label}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
