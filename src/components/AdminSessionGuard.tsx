"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SessionProvider } from "@/components/SessionContext";
import SessionLoadingOverlay from "@/components/SessionLoadingOverlay";
import { fetchProfile } from "@/lib/api/auth";
import {
  clearSession,
  consumeSkipSessionOverlay,
  getAccessToken,
  getStoredUser,
  persistSession,
} from "@/lib/auth/session";
import type { ItamUser } from "@/lib/auth/session";

export default function AdminSessionGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<ItamUser | null>(null);
  const [ready, setReady] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayDone, setOverlayDone] = useState(false);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.replace("/");
      return;
    }

    const skipOverlay = consumeSkipSessionOverlay();
    if (skipOverlay) {
      setOverlayDone(true);
    } else {
      setShowOverlay(true);
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

  const handleOverlayComplete = useCallback(() => {
    setOverlayDone(true);
  }, []);

  const canEnter = ready && !!user && (!showOverlay || overlayDone);

  if (!canEnter) {
    if (showOverlay && !overlayDone) {
      return (
        <div className="relative min-h-dvh w-full bg-[#0F172A]">
          <SessionLoadingOverlay
            userName={user?.fullName ?? getStoredUser()?.fullName}
            onComplete={handleOverlayComplete}
          />
        </div>
      );
    }

    return <div className="min-h-dvh w-full bg-[#0F172A]" />;
  }

  return <SessionProvider user={user}>{children}</SessionProvider>;
}
