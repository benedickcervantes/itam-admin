import { apiJson } from "./client";
import type { ItamUser } from "../auth/session";

export async function login(email: string, password: string) {
  return apiJson<{ accessToken: string; user: ItamUser }>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function fetchProfile() {
  return apiJson<ItamUser>("/api/v1/auth/profile", { auth: true });
}
