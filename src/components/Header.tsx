"use client";

import { CircleHelp, Eye, Menu } from "lucide-react";
import { useMobileNav } from "@/components/MobileNavContext";
import { getStoredUser } from "@/lib/auth/session";
import { isViewer } from "@/lib/auth/permissions";

export function Header({
  title,
  subtitle,
  onHowItWorks,
  howItWorksPulse = false,
}: {
  title: string;
  subtitle?: string;
  /** When set, shows a How it works control that starts the page tour. */
  onHowItWorks?: () => void;
  /** Soft attention when a page tip is nudging users toward the tour. */
  howItWorksPulse?: boolean;
}) {
  const user = getStoredUser();
  const mobileNav = useMobileNav();

  return (
    <header className="shrink-0 border-b border-slate-700/60 bg-[#0F172A]/80 px-3 py-3 backdrop-blur sm:px-6 sm:py-4">
      <div className="flex items-start justify-between gap-2 sm:gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-2 sm:gap-3">
          {mobileNav && (
            <button
              type="button"
              onClick={mobileNav.toggle}
              className="mt-0.5 shrink-0 rounded-lg p-2 text-slate-300 hover:bg-slate-800 hover:text-white lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold text-white sm:text-xl">{title}</h1>
            {subtitle && <p className="mt-0.5 line-clamp-2 text-xs text-slate-400 sm:text-sm">{subtitle}</p>}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {onHowItWorks && (
            <button
              key={howItWorksPulse ? "how-it-works-pulse" : "how-it-works"}
              type="button"
              onClick={onHowItWorks}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-xs font-medium transition sm:px-2.5 sm:text-sm ${
                howItWorksPulse
                  ? "how-it-works-pulse border-[#2E7D9A]/70 bg-[#2E7D9A]/15 text-white shadow-[0_0_0_1px_rgba(46,125,154,0.35)]"
                  : "border-slate-600/80 bg-slate-800/60 text-slate-200 hover:border-[#2E7D9A]/50 hover:bg-slate-800 hover:text-white"
              }`}
              title="Interactive guide for this page"
              aria-label="How it works — start interactive guide"
            >
              <CircleHelp className="h-4 w-4 text-[#7EC8DC]" aria-hidden />
              <span className="hidden sm:inline">How it works</span>
            </button>
          )}
          {isViewer(user) && (
            <span
              className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-slate-600/80 bg-slate-800/80 px-2 py-1 text-slate-300 sm:gap-2 sm:px-2.5 sm:py-1.5"
              title="You can browse records but cannot create, edit, or delete"
              aria-label="View-only access: browse records only; create, edit, and delete are disabled"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded bg-slate-700/80 ring-1 ring-slate-600/80">
                <Eye className="h-3 w-3 text-[#7EC8DC]" aria-hidden />
              </span>
              <span className="flex min-w-0 flex-col leading-tight">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-200 sm:text-[11px]">
                  View only
                </span>
                <span className="hidden text-[9px] text-slate-400 sm:block">Read access</span>
              </span>
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
