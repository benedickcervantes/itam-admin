export type ItamUser = {
  id: string;
  email: string;
  fullName: string;
  role: string;
  departmentId: string | null;
  departmentName: string | null;
};

const TOKEN_KEY = "itam_access_token";
const USER_KEY = "itam_user";
const REMEMBER_KEY = "itam_remember_me";
/** Skip the session-restore overlay once (e.g. after login / restore animation). */
const SKIP_SESSION_OVERLAY_KEY = "itam_skip_session_overlay";
/** Shown once on the login page after forced expiry logout. */
const SESSION_REASON_KEY = "itam_session_reason";
/** Keeps the modal open across a lost event (listener race). */
const SESSION_EXPIRED_OPEN_KEY = "itam_session_expired_open";

/** Dispatched when the access token is no longer valid. */
export const SESSION_EXPIRED_EVENT = "itam:session-expired";

let handlingSessionExpiry = false;

export function markSkipSessionOverlay() {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(SKIP_SESSION_OVERLAY_KEY, "1");
}

export function consumeSkipSessionOverlay(): boolean {
  if (typeof window === "undefined") return false;
  const skip = sessionStorage.getItem(SKIP_SESSION_OVERLAY_KEY) === "1";
  if (skip) sessionStorage.removeItem(SKIP_SESSION_OVERLAY_KEY);
  return skip;
}

function readRememberPreference(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(REMEMBER_KEY) !== "false";
}

function clearSessionFromBothStorages() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): ItamUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY) ?? sessionStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ItamUser;
  } catch {
    return null;
  }
}

export function persistSession(accessToken: string, user: ItamUser, remember?: boolean) {
  const usePersistentStorage = remember ?? readRememberPreference();
  localStorage.setItem(REMEMBER_KEY, usePersistentStorage ? "true" : "false");
  clearSessionFromBothStorages();

  const storage = usePersistentStorage ? localStorage : sessionStorage;
  storage.setItem(TOKEN_KEY, accessToken);
  storage.setItem(USER_KEY, JSON.stringify(user));

  // Drop any leftover expired-modal flag from a previous force/demo.
  try {
    sessionStorage.removeItem(SESSION_EXPIRED_OPEN_KEY);
  } catch {
    /* ignore */
  }
}

export function clearSession() {
  localStorage.removeItem(REMEMBER_KEY);
  localStorage.removeItem("itam_last_activity_at");
  clearSessionFromBothStorages();
}

/**
 * Clear credentials and open the session-expired modal (user confirms with Go to sign in).
 * On the login page, only clears session — the form handles its own notice.
 * Safe to call multiple times (e.g. parallel 401s).
 */
export function forceSessionExpiredLogout() {
  if (typeof window === "undefined") return;

  const path = window.location.pathname;
  if (path === "/" || path === "") {
    clearSession();
    return;
  }

  try {
    if (sessionStorage.getItem(SESSION_EXPIRED_OPEN_KEY) === "1") {
      // Already showing — re-notify in case the listener attached late.
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
      return;
    }
    sessionStorage.setItem(SESSION_EXPIRED_OPEN_KEY, "1");
  } catch {
    if (handlingSessionExpiry) return;
  }

  handlingSessionExpiry = true;
  clearSession();

  // Defer so SessionExpiredModal has time to mount and subscribe.
  window.setTimeout(() => {
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
  }, 50);
}

export function isSessionExpiredModalPending(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(SESSION_EXPIRED_OPEN_KEY) === "1";
  } catch {
    return false;
  }
}

/** Full navigation to login after the user acknowledges session expiry. */
export function goToLoginAfterSessionExpiry() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(SESSION_EXPIRED_OPEN_KEY);
    sessionStorage.setItem(SESSION_REASON_KEY, "expired");
  } catch {
    /* private mode / quota */
  }
  window.location.href = "/";
}

/** Returns true once if the user was auto-logged out due to an expired session. */
export function consumeSessionExpiredNotice(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (sessionStorage.getItem(SESSION_REASON_KEY) !== "expired") return false;
    sessionStorage.removeItem(SESSION_REASON_KEY);
    return true;
  } catch {
    return false;
  }
}

export function getRememberMePreference(): boolean {
  return readRememberPreference();
}
