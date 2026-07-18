"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  ClipboardList,
  HardDrive,
  History,
  LayoutDashboard,
  LogOut,
  Monitor,
  Trash2,
  Users,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react";
import { clearSession, getStoredUser } from "@/lib/auth/session";
import { canViewUsers } from "@/lib/auth/permissions";
import { useMobileNav } from "@/components/MobileNavContext";
import SignOutOverlay from "@/components/SignOutOverlay";

type NavEntry = { href: string; label: string; icon: LucideIcon };

const NAV: NavEntry[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/audit-register", label: "IT Audit Register", icon: ClipboardList },
  { href: "/assets", label: "Assets", icon: HardDrive },
  { href: "/device-history", label: "Device History", icon: History },
  { href: "/maintenance", label: "Maintenance", icon: Wrench },
  { href: "/disposals", label: "Disposals", icon: Trash2 },
];

function initialsOf(name?: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function NavItem({
  href,
  label,
  icon: Icon,
  active,
  onClick,
}: NavEntry & { active: boolean; onClick: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
        active
          ? "bg-[#2E7D9A]/15 text-white"
          : "text-slate-400 hover:bg-slate-800/70 hover:text-white"
      }`}
    >
      <span
        className={`absolute left-0 top-1/2 h-5 -translate-y-1/2 rounded-r-full bg-[#2E7D9A] transition-all ${
          active ? "w-1 opacity-100" : "w-0 opacity-0"
        }`}
      />
      <Icon
        className={`h-[18px] w-[18px] shrink-0 transition-colors ${
          active ? "text-[#4FB0CE]" : "text-slate-500 group-hover:text-slate-300"
        }`}
      />
      <span className="truncate">{label}</span>
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const user = getStoredUser();
  const mobileNav = useMobileNav();
  const mobileOpen = mobileNav?.open ?? false;
  const [signingOut, setSigningOut] = useState(false);

  const closeMobile = () => mobileNav?.close();
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      {signingOut && (
        <SignOutOverlay
          onComplete={() => {
            clearSession();
            window.location.href = "/";
          }}
        />
      )}

      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          aria-label="Close navigation"
          onClick={closeMobile}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 max-w-[85vw] shrink-0 flex-col border-r border-slate-700/60 bg-[#1E293B] text-slate-100 transition-transform duration-200 ease-out lg:static lg:z-auto lg:max-w-none lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="border-b border-slate-700/60 px-4 py-4 sm:px-5 sm:py-5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#2E7D9A] to-[#1E3A5F] text-white shadow-lg shadow-[#2E7D9A]/20 ring-1 ring-white/10">
                <Monitor className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">IT Asset Management</p>
                <p className="truncate text-[11px] uppercase tracking-wider text-slate-400">
                  Hardware Inventory
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={closeMobile}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          <p className="px-3 pb-1.5 pt-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            Menu
          </p>
          {NAV.map((item) => (
            <NavItem
              key={item.href}
              {...item}
              active={isActive(item.href)}
              onClick={closeMobile}
            />
          ))}
          {canViewUsers(user) && (
            <>
              <p className="px-3 pb-1.5 pt-4 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                Administration
              </p>
              <NavItem
                href="/users"
                label="Users"
                icon={Users}
                active={isActive("/users")}
                onClick={closeMobile}
              />
            </>
          )}
        </nav>

        <div className="border-t border-slate-700/60 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="flex items-center gap-3 rounded-lg bg-slate-800/50 px-3 py-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2E7D9A]/20 text-sm font-semibold text-[#4FB0CE] ring-1 ring-[#2E7D9A]/30">
              {initialsOf(user?.fullName)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">{user?.fullName ?? "—"}</p>
              <p className="truncate text-xs text-slate-400">
                {user?.departmentName ?? user?.role}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              closeMobile();
              setSigningOut(true);
            }}
            disabled={signingOut}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
