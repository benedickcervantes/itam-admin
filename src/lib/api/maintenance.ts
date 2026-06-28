import { apiJson } from "./client";
import type { MaintenanceRecord, Paginated } from "../types";
import { qs } from "../types";

export function fetchMaintenance(query: Record<string, string | number | undefined> = {}) {
  return apiJson<Paginated<MaintenanceRecord>>(`/api/v1/maintenance${qs(query)}`, { auth: true });
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
