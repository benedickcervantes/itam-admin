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

const STATUS_MESSAGES: Record<number, string> = {
  400: "Please check your input and try again.",
  401: "Your session has expired. Please sign in again.",
  403: "You don’t have permission to perform this action.",
  404: "The requested item could not be found.",
  408: "The request timed out. Please try again.",
  409: "This action conflicts with existing data. Please refresh and try again.",
  422: "Please check your input and try again.",
  429: "You’re making requests too quickly. Please wait a moment and try again.",
  500: "Something went wrong on our end. Please try again later.",
  502: "The server is temporarily unavailable. Please try again later.",
  503: "The service is temporarily unavailable. Please try again later.",
  504: "The server took too long to respond. Please try again.",
};

/** NestJS / framework messages that should not be shown raw to end users. */
const TECHNICAL_MESSAGE_PATTERNS: Array<{ test: RegExp; status?: number; message: string }> = [
  {
    test: /throttler|too many requests|rate.?limit/i,
    status: 429,
    message: STATUS_MESSAGES[429],
  },
  {
    test: /unauthorized|jwt expired|invalid token|authentication required/i,
    status: 401,
    message: STATUS_MESSAGES[401],
  },
  {
    test: /forbidden|access denied/i,
    status: 403,
    message: STATUS_MESSAGES[403],
  },
  {
    test: /internal server error|econnrefused|networkerror|failed to fetch/i,
    message: STATUS_MESSAGES[500],
  },
];

function stripExceptionPrefix(message: string): string {
  return message.replace(/^[A-Za-z]+Exception:\s*/i, "").trim();
}

function isTechnicalMessage(message: string): boolean {
  return (
    /^[A-Za-z]+Exception\b/i.test(message) ||
    TECHNICAL_MESSAGE_PATTERNS.some(({ test }) => test.test(message))
  );
}

function friendlyMessageFor(raw: string, status?: number): string {
  const cleaned = stripExceptionPrefix(raw);
  for (const rule of TECHNICAL_MESSAGE_PATTERNS) {
    if (rule.test.test(raw) || rule.test.test(cleaned)) {
      return rule.message;
    }
  }
  if (status && STATUS_MESSAGES[status] && isTechnicalMessage(raw)) {
    return STATUS_MESSAGES[status];
  }
  if (cleaned) return cleaned;
  if (status && STATUS_MESSAGES[status]) return STATUS_MESSAGES[status];
  return "Something went wrong. Please try again.";
}

export function normalizeErrorMessage(
  payload: unknown,
  fallback: string,
  status?: number,
): string {
  let raw = "";
  if (payload && typeof payload === "object") {
    const message = (payload as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) raw = message.trim();
    else if (Array.isArray(message) && typeof message[0] === "string") raw = message[0];
  }
  if (!raw) raw = fallback;
  return friendlyMessageFor(raw, status);
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
  let res: Response;
  try {
    res = await apiFetch(path, options);
  } catch (err) {
    if (err instanceof Error && /authentication required/i.test(err.message)) {
      throw new Error(STATUS_MESSAGES[401]);
    }
    throw new Error("Unable to reach the server. Check your connection and try again.");
  }
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && options.auth && typeof window !== "undefined") {
      clearSession();
    }
    throw new Error(
      normalizeErrorMessage(payload, STATUS_MESSAGES[res.status] ?? `Request failed (${res.status})`, res.status),
    );
  }
  return payload as T;
}
