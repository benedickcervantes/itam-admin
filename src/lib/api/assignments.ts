import { apiJson } from "./client";
import type { Assignment, Paginated } from "../types";
import { qs } from "../types";

export function fetchAssignments(query: Record<string, string | number | undefined> = {}) {
  return apiJson<Paginated<Assignment>>(`/api/v1/assignments${qs(query)}`, { auth: true });
}

export function createAssignment(body: Record<string, unknown>) {
  return apiJson<Assignment>("/api/v1/assignments", { method: "POST", auth: true, body: JSON.stringify(body) });
}

export function updateAssignment(id: string, body: Record<string, unknown>) {
  return apiJson<Assignment>(`/api/v1/assignments/${id}`, { method: "PATCH", auth: true, body: JSON.stringify(body) });
}

export function deleteAssignment(id: string) {
  return apiJson<{ success: boolean }>(`/api/v1/assignments/${id}`, { method: "DELETE", auth: true });
}
