export const API_BASE_URL = (process.env.NEXT_PUBLIC_BACKEND_URL ?? "").replace(
  /\/$/,
  "",
);

/** Server-only — never use NEXT_PUBLIC_ for the API key in production. */
function serverApiKey(): string {
  return process.env.BACKEND_API_KEY ?? process.env.FRONTEND_API_KEY ?? "";
}

export function resolveBackendFetchUrl(path: string): string {
  const pathPart = path.startsWith("/") ? path : `/${path}`;
  if (!API_BASE_URL) {
    throw new Error("Set NEXT_PUBLIC_BACKEND_URL in .env.local");
  }
  if (typeof window === "undefined") {
    return `${API_BASE_URL}${pathPart}`;
  }
  return pathPart;
}

import { clearSession, getAccessToken } from "../auth/session";

export function getStoredAccessToken(): string | null {
  return getAccessToken();
}

export function normalizeErrorMessage(payload: unknown, fallback: string): string {
  if (payload && typeof payload === "object") {
    const message = (payload as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message.trim();
    if (Array.isArray(message) && typeof message[0] === "string") return message[0];
  }
  return fallback;
}

type ApiFetchOptions = RequestInit & {
  auth?: boolean;
  accessToken?: string;
};

export async function apiFetch(path: string, options: ApiFetchOptions = {}) {
  const url = resolveBackendFetchUrl(path);
  const headers = new Headers(options.headers ?? {});
  if (typeof window === "undefined") {
    const apiKey = serverApiKey();
    if (!apiKey) throw new Error("Set BACKEND_API_KEY in .env.local (server-only)");
    headers.set("x-api-key", apiKey);
  }
  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (options.auth) {
    const token = options.accessToken ?? getStoredAccessToken();
    if (!token) throw new Error("Authentication required.");
    headers.set("Authorization", `Bearer ${token}`);
  }
  return fetch(url, { ...options, headers });
}

export async function apiJson<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const res = await apiFetch(path, options);
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && options.auth && typeof window !== "undefined") {
      clearSession();
    }
    throw new Error(normalizeErrorMessage(payload, `Request failed (${res.status})`));
  }
  return payload as T;
}
