import type { ItamUser } from "./session";

export function canWrite(user: ItamUser | null): boolean {
  return user?.role === "IT_ADMIN" || user?.role === "SUPER_ADMIN";
}

export function canManageUsers(user: ItamUser | null): boolean {
  return canWrite(user);
}

export function canViewUsers(user: ItamUser | null): boolean {
  return !!user;
}

export function isViewer(user: ItamUser | null): boolean {
  return user?.role === "VIEWER";
}
