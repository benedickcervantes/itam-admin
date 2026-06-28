"use client";

import { createContext, useContext } from "react";
import type { ItamUser } from "@/lib/auth/session";

const SessionContext = createContext<ItamUser | null>(null);

export function SessionProvider({ user, children }: { user: ItamUser; children: React.ReactNode }) {
  return <SessionContext.Provider value={user}>{children}</SessionContext.Provider>;
}

export function useSessionUser(): ItamUser {
  const user = useContext(SessionContext);
  if (!user) {
    throw new Error("useSessionUser must be used within SessionProvider");
  }
  return user;
}
