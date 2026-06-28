"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "lucide-react";
import { clearSession, getStoredUser } from "@/lib/auth/session";
import { canViewUsers } from "@/lib/auth/permissions";
import { useMobileNav } from "@/components/MobileNavContext";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/audit-register", label: "IT Audit Register", icon: ClipboardList },
  { href: "/assets", label: "Assets", icon: HardDrive },
  { href: "/assignments", label: "Assignments", icon: History },
  { href: "/maintenance", label: "Maintenance", icon: Wrench },
  { href: "/disposals", label: "Disposals", icon: Trash2 },
];

export function Sidebar() {
  const pathname = usePathname();
  const user = getStoredUser();
  const mobileNav = useMobileNav();
  const mobileOpen = mobileNav?.open ?? false;

  const closeMobile = () => mobileNav?.close();

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
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
            <div className="flex min-w-0 items-center gap-2">
              <Monitor className="h-6 w-6 shrink-0 text-[#2E7D9A]" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">IT Asset Management</p>
                <p className="truncate text-xs text-slate-400">Hardware Inventory</p>
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
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                onClick={closeMobile}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                  active
                    ? "bg-[#2E7D9A]/20 text-white ring-1 ring-[#2E7D9A]/40"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{label}</span>
              </Link>
            );
          })}
          {canViewUsers(user) && (
            <Link
              href="/users"
              onClick={closeMobile}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                pathname === "/users"
                  ? "bg-[#2E7D9A]/20 text-white ring-1 ring-[#2E7D9A]/40"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Users className="h-4 w-4 shrink-0" />
              <span className="truncate">Users</span>
            </Link>
          )}
        </nav>

        <div className="border-t border-slate-700/60 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <p className="truncate text-sm font-medium text-white">{user?.fullName}</p>
          <p className="truncate text-xs text-slate-400">{user?.departmentName ?? user?.role}</p>
          <button
            type="button"
            onClick={() => {
              clearSession();
              window.location.href = "/";
            }}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
