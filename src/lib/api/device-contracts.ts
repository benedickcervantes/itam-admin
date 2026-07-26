import { apiFetch, apiJson, normalizeErrorMessage } from "./client";
import type { DeviceContract, Paginated } from "../types";
import { qs } from "../types";

export function fetchDeviceContracts(query: Record<string, string | number | undefined> = {}) {
  return apiJson<Paginated<DeviceContract>>(`/api/v1/device-contracts${qs(query)}`, {
    auth: true,
  });
}

export function generateDeviceContract(body: {
  employeeName: string;
  jobTitle?: string;
  departmentName?: string;
  dateIssued?: string;
  notes?: string;
}) {
  return apiJson<DeviceContract>("/api/v1/device-contracts/generate", {
    method: "POST",
    auth: true,
    body: JSON.stringify(body),
  });
}

export function deleteDeviceContract(id: string) {
  return apiJson<{ success: boolean }>(`/api/v1/device-contracts/${id}`, {
    method: "DELETE",
    auth: true,
  });
}

async function downloadBlob(path: string, fallbackName: string) {
  const res = await apiFetch(path, { auth: true });
  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(
      normalizeErrorMessage(payload, `Download failed (${res.status})`, res.status),
    );
  }
  const blob = await res.blob();
  const disposition = res.headers.get("Content-Disposition") || "";
  const match = disposition.match(/filename="?([^"]+)"?/i);
  const filename = match?.[1] || fallbackName;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function downloadDeviceContract(id: string) {
  return downloadBlob(`/api/v1/device-contracts/${id}/download/pdf`, "contract.pdf");
}

async function fetchAuthBlob(path: string, fallbackMsg: string): Promise<Blob> {
  const res = await apiFetch(path, { auth: true });
  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(normalizeErrorMessage(payload, fallbackMsg, res.status));
  }
  return res.blob();
}

export function fetchContractTemplateBlob() {
  return fetchAuthBlob("/api/v1/device-contracts/template", "Failed to load template");
}

export function fetchDeviceContractFileBlob(id: string) {
  return fetchAuthBlob(`/api/v1/device-contracts/${id}/download/pdf`, "Failed to load PDF");
}
