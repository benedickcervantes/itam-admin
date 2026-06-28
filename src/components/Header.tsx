"use client";

import { Menu } from "lucide-react";
import { useMobileNav } from "@/components/MobileNavContext";
import { getStoredUser } from "@/lib/auth/session";
import { isViewer } from "@/lib/auth/permissions";

export function Header({ title, subtitle }: { title: string; subtitle?: string }) {
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
        {isViewer(user) && (
          <span className="max-w-[45%] shrink-0 truncate rounded-full bg-amber-500/15 px-2 py-1 text-[10px] font-medium text-amber-300 ring-1 ring-amber-500/30 sm:max-w-none sm:px-3 sm:text-xs">
            Read-only
          </span>
        )}
      </div>
    </header>
  );
}
