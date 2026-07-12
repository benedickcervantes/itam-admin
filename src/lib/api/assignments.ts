import { apiJson } from "./client";
import type { Assignment, Paginated } from "../types";
import { qs } from "../types";

export function fetchAssignments(query: Record<string, string | number | undefined> = {}) {
  return apiJson<Paginated<Assignment>>(`/api/v1/assignments${qs(query)}`, { auth: true });
}

export async function fetchAllAssignments(
  query: Record<string, string | number | undefined> = {},
): Promise<Assignment[]> {
  const limit = 100;
  const all: Assignment[] = [];
  let page = 1;
  let totalPages = 1;
  do {
    const res = await fetchAssignments({ ...query, page, limit });
    all.push(...res.items);
    totalPages = res.totalPages || 1;
    page += 1;
  } while (page <= totalPages);
  return all;
}

export function fetchAssignment(id: string) {
  return apiJson<Assignment>(`/api/v1/assignments/${id}`, { auth: true });
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
