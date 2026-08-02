"use client";

import { useEffect } from "react";
import { forceSessionExpiredLogout } from "@/lib/auth/session";

/** Logout after this long with no user interaction (token may still be valid). */
export const IDLE_SESSION_MS = 60 * 60 * 1000; // 1 hour

const LAST_ACTIVITY_KEY = "itam_last_activity_at";
const ACTIVITY_EVENTS = [
  "mousedown",
  "mousemove",
  "keydown",
  "scroll",
  "touchstart",
  "click",
  "wheel",
] as const;

function markActivity() {
  try {
    localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
  } catch {
    /* private mode */
  }
}

function readLastActivity(): number {
  try {
    const raw = localStorage.getItem(LAST_ACTIVITY_KEY);
    if (!raw) return Date.now();
    const n = Number(raw);
    return Number.isFinite(n) ? n : Date.now();
  } catch {
    return Date.now();
  }
}

export function clearIdleActivityMarker() {
  try {
    localStorage.removeItem(LAST_ACTIVITY_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Watches for human activity while logged into admin routes.
 * After {@link IDLE_SESSION_MS} without interaction → session-expired modal.
 */
export default function IdleSessionWatcher() {
  useEffect(() => {
    markActivity();

    let lastMoveAt = 0;
    const onActivity = (event: Event) => {
      if (event.type === "mousemove") {
        const now = Date.now();
        // Throttle mousemove so we don't hammer storage.
        if (now - lastMoveAt < 2000) return;
        lastMoveAt = now;
      }
      markActivity();
    };

    const checkIdle = () => {
      if (Date.now() - readLastActivity() >= IDLE_SESSION_MS) {
        forceSessionExpiredLogout();
      }
    };

    for (const name of ACTIVITY_EVENTS) {
      window.addEventListener(name, onActivity, { capture: true, passive: true });
    }

    // Background tabs throttle timers; re-check when the user returns.
    const onVisibility = () => {
      if (document.visibilityState === "visible") checkIdle();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", checkIdle);

    // Other tabs share activity via last-activity timestamp.
    const onStorage = (event: StorageEvent) => {
      if (event.key === LAST_ACTIVITY_KEY) {
        // Peer tab was active — no action needed; next check uses updated value.
      }
    };
    window.addEventListener("storage", onStorage);

    const intervalId = window.setInterval(checkIdle, 30_000);
    checkIdle();

    return () => {
      for (const name of ACTIVITY_EVENTS) {
        window.removeEventListener(name, onActivity, true);
      }
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", checkIdle);
      window.removeEventListener("storage", onStorage);
      window.clearInterval(intervalId);
    };
  }, []);

  return null;
}
