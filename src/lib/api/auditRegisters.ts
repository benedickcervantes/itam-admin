import { apiJson } from "./client";
import type { AuditRegister, Paginated } from "../types";
import { qs as buildQs } from "../types";

export type AuditQuery = {
  page?: number;
  limit?: number;
  search?: string;
  departmentId?: string;
  upgradeComponent?: string;
  auditStatus?: string;
  overallAssessment?: string;
  priority?: string;
};

export function fetchAuditRegisters(query: AuditQuery = {}) {
  return apiJson<Paginated<AuditRegister>>(`/api/v1/audit-registers${buildQs(query)}`, { auth: true });
}

/**
 * Fetch every audit record matching the given filters by paging through the
 * API (used for exports). Ignores the `page`/`limit` in `query` and walks all
 * pages using the maximum server page size.
 */
export async function fetchAllAuditRegisters(query: AuditQuery = {}): Promise<AuditRegister[]> {
  const limit = 100;
  const all: AuditRegister[] = [];
  let page = 1;
  let totalPages = 1;
  do {
    const res = await fetchAuditRegisters({ ...query, page, limit });
    all.push(...res.items);
    totalPages = res.totalPages || 1;
    page += 1;
  } while (page <= totalPages);
  return all;
}

export function fetchAuditRegister(id: string) {
  return apiJson<AuditRegister>(`/api/v1/audit-registers/${id}`, { auth: true });
}

export function createAuditRegister(body: Record<string, unknown>) {
  return apiJson<AuditRegister>("/api/v1/audit-registers", { method: "POST", auth: true, body: JSON.stringify(body) });
}

export function updateAuditRegister(id: string, body: Record<string, unknown>) {
  return apiJson<AuditRegister>(`/api/v1/audit-registers/${id}`, { method: "PATCH", auth: true, body: JSON.stringify(body) });
}

export function deleteAuditRegister(id: string) {
  return apiJson<{ success: boolean }>(`/api/v1/audit-registers/${id}`, { method: "DELETE", auth: true });
}

export type { AuditRegister, Paginated };
