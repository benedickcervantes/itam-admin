"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SessionProvider } from "@/components/SessionContext";
import { fetchProfile } from "@/lib/api/auth";
import { clearSession, getAccessToken, persistSession } from "@/lib/auth/session";
import type { ItamUser } from "@/lib/auth/session";

export default function AdminSessionGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<ItamUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.replace("/");
      return;
    }
    fetchProfile()
      .then((profile) => {
        persistSession(token, profile);
        setUser(profile);
        setReady(true);
      })
      .catch(() => {
        clearSession();
        router.replace("/");
      });
  }, [router]);

  if (!ready || !user) {
    return (
      <div className="flex h-dvh items-center justify-center bg-[#0F172A] text-slate-300">
        Loading session...
      </div>
    );
  }

  return <SessionProvider user={user}>{children}</SessionProvider>;
}
