import { apiJson } from "./client";
import type { AdminUser } from "../types";

export function fetchUsers() {
  return apiJson<AdminUser[]>("/api/v1/users", { auth: true });
}

export function createUser(body: Record<string, unknown>) {
  return apiJson<AdminUser>("/api/v1/users", { method: "POST", auth: true, body: JSON.stringify(body) });
}

export function updateUser(id: string, body: Record<string, unknown>) {
  return apiJson<AdminUser>(`/api/v1/users/${id}`, { method: "PATCH", auth: true, body: JSON.stringify(body) });
}

export function deleteUser(id: string) {
  return apiJson<{ success: boolean }>(`/api/v1/users/${id}`, { method: "DELETE", auth: true });
}
