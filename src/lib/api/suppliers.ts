import { apiJson } from "./client";
import type { Paginated, Supplier } from "../types";
import { qs } from "../types";

export function fetchSuppliers(query: Record<string, string | number | undefined> = {}) {
  return apiJson<Paginated<Supplier>>(`/api/v1/suppliers${qs(query)}`, { auth: true });
}

export async function fetchAllSuppliers(
  query: Record<string, string | number | undefined> = {},
): Promise<Supplier[]> {
  const limit = 100;
  const all: Supplier[] = [];
  let page = 1;
  let totalPages = 1;
  do {
    const res = await fetchSuppliers({ ...query, page, limit });
    all.push(...res.items);
    totalPages = res.totalPages || 1;
    page += 1;
  } while (page <= totalPages);
  return all;
}

export function createSupplier(body: Record<string, unknown>) {
  return apiJson<Supplier>("/api/v1/suppliers", {
    method: "POST",
    auth: true,
    body: JSON.stringify(body),
  });
}

export function updateSupplier(id: string, body: Record<string, unknown>) {
  return apiJson<Supplier>(`/api/v1/suppliers/${id}`, {
    method: "PATCH",
    auth: true,
    body: JSON.stringify(body),
  });
}

export function deleteSupplier(id: string) {
  return apiJson<{ success: boolean }>(`/api/v1/suppliers/${id}`, {
    method: "DELETE",
    auth: true,
  });
}
