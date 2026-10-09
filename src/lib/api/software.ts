import { apiJson } from "./client";
import { qs, type Paginated } from "../types";

export type SoftwareKind = "STANDARD" | "ADDITIONAL";
export type SoftwareInstallStatus = "INSTALLED" | "MISSING" | "NOT_NEEDED";
export type SoftwareCompliance = "COMPLETE" | "MISSING";

export type SoftwareCatalogItem = {
  id: string;
  name: string;
  kind: SoftwareKind;
  sort_order: number;
  notes?: string | null;
  assignment_count: number;
  created_at: string;
  updated_at: string;
};

export type SoftwareDeviceRow = {
  id: string;
  asset_code: string;
  computer_name: string;
  assigned_to?: string | null;
  department?: string | null;
  standard_total: number;
  standard_installed: number;
  standard_missing: number;
  standard_not_needed: number;
  additional_count: number;
  compliance: SoftwareCompliance;
  missing_software: string[];
};

export type SoftwareChecklistItem = {
  software_id: string;
  name: string;
  kind: SoftwareKind;
  sort_order: number;
  catalog_notes?: string | null;
  status: SoftwareInstallStatus;
  notes?: string | null;
  removable: boolean;
};

export type SoftwareDeviceDetail = {
  asset: {
    id: string;
    asset_code: string;
    computer_name: string;
    assigned_to?: string | null;
    department?: string | null;
    os?: string | null;
  };
  items: SoftwareChecklistItem[];
};

export type SoftwareSummary = {
  computers: number;
  complete: number;
  missing: number;
  with_extras: number;
  by_software: {
    id: string;
    name: string;
    kind: SoftwareKind;
    installed: number;
    missing: number;
    not_needed: number;
    applicable: number;
  }[];
  by_department: {
    department: string;
    computers: number;
    complete: number;
    missing: number;
  }[];
  gaps: {
    asset_id: string;
    asset_code: string;
    computer_name: string;
    assigned_to?: string | null;
    department?: string | null;
    missing_software: string[];
  }[];
};

export function fetchSoftwareCatalog() {
  return apiJson<SoftwareCatalogItem[]>("/api/v1/software/catalog", { auth: true });
}

export function createSoftware(body: { name: string; kind?: SoftwareKind; notes?: string }) {
  return apiJson<SoftwareCatalogItem>("/api/v1/software/catalog", {
    method: "POST",
    auth: true,
    body: JSON.stringify(body),
  });
}

export function updateSoftware(
  id: string,
  body: { name?: string; kind?: SoftwareKind; notes?: string | null },
) {
  return apiJson<SoftwareCatalogItem>(`/api/v1/software/catalog/${id}`, {
    method: "PATCH",
    auth: true,
    body: JSON.stringify(body),
  });
}

export function deleteSoftware(id: string) {
  return apiJson<{ success: boolean }>(`/api/v1/software/catalog/${id}`, {
    method: "DELETE",
    auth: true,
  });
}

export function fetchSoftwareSummary() {
  return apiJson<SoftwareSummary>("/api/v1/software/summary", { auth: true });
}

export function fetchSoftwareDevices(query: Record<string, string | number | undefined> = {}) {
  return apiJson<Paginated<SoftwareDeviceRow>>(`/api/v1/software/devices${qs(query)}`, { auth: true });
}

export function fetchSoftwareDevice(assetId: string) {
  return apiJson<SoftwareDeviceDetail>(`/api/v1/software/devices/${assetId}`, { auth: true });
}

export function updateSoftwareInstallation(
  assetId: string,
  softwareId: string,
  body: { status: SoftwareInstallStatus; notes?: string | null },
) {
  return apiJson<SoftwareDeviceDetail>(`/api/v1/software/devices/${assetId}/items/${softwareId}`, {
    method: "PUT",
    auth: true,
    body: JSON.stringify(body),
  });
}

export function addSoftwareInstallation(
  assetId: string,
  body: { softwareId?: string; name?: string; status?: SoftwareInstallStatus },
) {
  return apiJson<SoftwareDeviceDetail>(`/api/v1/software/devices/${assetId}/items`, {
    method: "POST",
    auth: true,
    body: JSON.stringify(body),
  });
}

export function removeSoftwareInstallation(assetId: string, softwareId: string) {
  return apiJson<SoftwareDeviceDetail>(`/api/v1/software/devices/${assetId}/items/${softwareId}`, {
    method: "DELETE",
    auth: true,
  });
}
