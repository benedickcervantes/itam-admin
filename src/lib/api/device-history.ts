import { apiJson } from "./client";
import type { DeviceHistory, Paginated } from "../types";
import { qs } from "../types";

export function fetchDeviceHistory(query: Record<string, string | number | undefined> = {}) {
  return apiJson<Paginated<DeviceHistory>>(`/api/v1/device-history${qs(query)}`, { auth: true });
}

export async function fetchAllDeviceHistory(
  query: Record<string, string | number | undefined> = {},
): Promise<DeviceHistory[]> {
  const limit = 100;
  const all: DeviceHistory[] = [];
  let page = 1;
  let totalPages = 1;
  do {
    const res = await fetchDeviceHistory({ ...query, page, limit });
    all.push(...res.items);
    totalPages = res.totalPages || 1;
    page += 1;
  } while (page <= totalPages);
  return all;
}

export function fetchDeviceHistoryRecord(id: string) {
  return apiJson<DeviceHistory>(`/api/v1/device-history/${id}`, { auth: true });
}

export function createDeviceHistory(body: Record<string, unknown>) {
  return apiJson<DeviceHistory>("/api/v1/device-history", {
    method: "POST",
    auth: true,
    body: JSON.stringify(body),
  });
}

export function updateDeviceHistory(id: string, body: Record<string, unknown>) {
  return apiJson<DeviceHistory>(`/api/v1/device-history/${id}`, {
    method: "PATCH",
    auth: true,
    body: JSON.stringify(body),
  });
}

export function deleteDeviceHistory(id: string) {
  return apiJson<{ success: boolean }>(`/api/v1/device-history/${id}`, {
    method: "DELETE",
    auth: true,
  });
}

export function fetchDeviceHistoryAssignees() {
  return apiJson<string[]>("/api/v1/device-history/assignees", { auth: true });
}

export function fetchAssetsByUser(assignedTo: string) {
  return apiJson<{ items: import("../types").Asset[]; total: number }>(
    `/api/v1/device-history/by-user${qs({ assignedTo })}`,
    { auth: true },
  );
}

export function transferAssets(body: {
  fromUser: string;
  toUser: string;
  /** If set, only these assets are transferred. */
  assetIds?: string[];
  departmentId?: string;
  notes?: string;
}) {
  return apiJson<{
    success: boolean;
    fromUser: string;
    toUser: string;
    transferred: number;
    auditsUpdated?: number;
    assetCodes: string[];
  }>("/api/v1/device-history/transfer", {
    method: "POST",
    auth: true,
    body: JSON.stringify(body),
  });
}
