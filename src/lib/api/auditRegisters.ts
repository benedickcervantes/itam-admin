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
