import { apiJson } from "./client";
import type { DisposalRecord, Paginated } from "../types";
import { qs } from "../types";

export function fetchDisposals(query: Record<string, string | number | undefined> = {}) {
  return apiJson<Paginated<DisposalRecord>>(`/api/v1/disposals${qs(query)}`, { auth: true });
}

export function createDisposal(body: Record<string, unknown>) {
  return apiJson<DisposalRecord>("/api/v1/disposals", { method: "POST", auth: true, body: JSON.stringify(body) });
}

export function updateDisposal(id: string, body: Record<string, unknown>) {
  return apiJson<DisposalRecord>(`/api/v1/disposals/${id}`, { method: "PATCH", auth: true, body: JSON.stringify(body) });
}

export function deleteDisposal(id: string) {
  return apiJson<{ success: boolean }>(`/api/v1/disposals/${id}`, { method: "DELETE", auth: true });
}
