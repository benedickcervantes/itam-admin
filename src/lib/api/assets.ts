import { apiJson } from "./client";
import type { Asset, Paginated } from "../types";
import { qs } from "../types";

export function fetchAssets(query: Record<string, string | number | undefined> = {}) {
  return apiJson<Paginated<Asset>>(`/api/v1/assets${qs(query)}`, { auth: true });
}

/**
 * Fetch every asset matching the given filters by paging through the API
 * (used for exports). Ignores `page`/`limit` in `query`.
 */
export async function fetchAllAssets(
  query: Record<string, string | number | undefined> = {},
): Promise<Asset[]> {
  const limit = 100;
  const all: Asset[] = [];
  let page = 1;
  let totalPages = 1;
  do {
    const res = await fetchAssets({ ...query, page, limit });
    all.push(...res.items);
    totalPages = res.totalPages || 1;
    page += 1;
  } while (page <= totalPages);
  return all;
}

export function fetchAsset(id: string) {
  return apiJson<Asset>(`/api/v1/assets/${id}`, { auth: true });
}

export function createAsset(body: Record<string, unknown>) {
  return apiJson<Asset>("/api/v1/assets", { method: "POST", auth: true, body: JSON.stringify(body) });
}

export function updateAsset(id: string, body: Record<string, unknown>) {
  return apiJson<Asset>(`/api/v1/assets/${id}`, { method: "PATCH", auth: true, body: JSON.stringify(body) });
}

export function deleteAsset(id: string) {
  return apiJson<{ success: boolean }>(`/api/v1/assets/${id}`, { method: "DELETE", auth: true });
}
