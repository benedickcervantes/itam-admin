import type { ItamUser } from "./session";

export function canWrite(user: ItamUser | null): boolean {
  return user?.role === "IT_ADMIN" || user?.role === "SUPER_ADMIN";
}

export function canManageUsers(user: ItamUser | null): boolean {
  return canWrite(user);
}

/** User directory is admin-only (emails, roles, account status). */
export function canViewUsers(user: ItamUser | null): boolean {
  return canWrite(user);
}

export function canViewActivityLogs(user: ItamUser | null): boolean {
  return user?.role === "IT_ADMIN" || user?.role === "SUPER_ADMIN";
}

export function isViewer(user: ItamUser | null): boolean {
  return user?.role === "VIEWER";
}
