import { apiJson } from "./client";
import type { DisposalRecord, Paginated } from "../types";
import { qs } from "../types";

export function fetchDisposals(query: Record<string, string | number | undefined> = {}) {
  return apiJson<Paginated<DisposalRecord>>(`/api/v1/disposals${qs(query)}`, { auth: true });
}

export async function fetchAllDisposals(
  query: Record<string, string | number | undefined> = {},
): Promise<DisposalRecord[]> {
  const limit = 100;
  const all: DisposalRecord[] = [];
  let page = 1;
  let totalPages = 1;
  do {
    const res = await fetchDisposals({ ...query, page, limit });
    all.push(...res.items);
    totalPages = res.totalPages || 1;
    page += 1;
  } while (page <= totalPages);
  return all;
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
