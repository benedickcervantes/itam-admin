import { apiJson } from "./client";
import type { MaintenanceRecord, Paginated } from "../types";
import { qs } from "../types";

export function fetchMaintenance(query: Record<string, string | number | undefined> = {}) {
  return apiJson<Paginated<MaintenanceRecord>>(`/api/v1/maintenance${qs(query)}`, { auth: true });
}

export async function fetchAllMaintenance(
  query: Record<string, string | number | undefined> = {},
): Promise<MaintenanceRecord[]> {
  const limit = 100;
  const all: MaintenanceRecord[] = [];
  let page = 1;
  let totalPages = 1;
  do {
    const res = await fetchMaintenance({ ...query, page, limit });
    all.push(...res.items);
    totalPages = res.totalPages || 1;
    page += 1;
  } while (page <= totalPages);
  return all;
}

export function fetchMaintenanceRecord(id: string) {
  return apiJson<MaintenanceRecord>(`/api/v1/maintenance/${id}`, { auth: true });
}

export function createMaintenance(body: Record<string, unknown>) {
  return apiJson<MaintenanceRecord>("/api/v1/maintenance", { method: "POST", auth: true, body: JSON.stringify(body) });
}

export function updateMaintenance(id: string, body: Record<string, unknown>) {
  return apiJson<MaintenanceRecord>(`/api/v1/maintenance/${id}`, { method: "PATCH", auth: true, body: JSON.stringify(body) });
}

export function deleteMaintenance(id: string) {
  return apiJson<{ success: boolean }>(`/api/v1/maintenance/${id}`, { method: "DELETE", auth: true });
}
