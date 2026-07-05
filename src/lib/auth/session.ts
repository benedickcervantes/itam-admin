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
}

export function clearSession() {
  localStorage.removeItem(REMEMBER_KEY);
  clearSessionFromBothStorages();
}

export function getRememberMePreference(): boolean {
  return readRememberPreference();
}
