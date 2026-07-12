import { apiJson } from "./client";
import type { ItamUser } from "../auth/session";

export async function login(email: string, password: string, rememberMe = true) {
  return apiJson<{ accessToken: string; user: ItamUser }>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password, rememberMe }),
  });
}

export async function fetchProfile() {
  return apiJson<ItamUser>("/api/v1/auth/profile", { auth: true });
}

export async function verifyPassword(password: string) {
  return apiJson<{ valid: boolean }>("/api/v1/auth/verify-password", {
    method: "POST",
    auth: true,
    body: JSON.stringify({ password }),
  });
}
