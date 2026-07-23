import { apiJson } from "./client";
import type { ActivityLog, Paginated } from "../types";
import { qs } from "../types";

export function fetchActivityLogs(query: Record<string, string | number | undefined> = {}) {
  return apiJson<Paginated<ActivityLog>>(`/api/v1/activity-logs${qs(query)}`, { auth: true });
}

export async function fetchAllActivityLogs(
  query: Record<string, string | number | undefined> = {},
): Promise<ActivityLog[]> {
  const limit = 100;
  const all: ActivityLog[] = [];
  let page = 1;
  let totalPages = 1;
  do {
    const res = await fetchActivityLogs({ ...query, page, limit });
    all.push(...res.items);
    totalPages = res.totalPages || 1;
    page += 1;
  } while (page <= totalPages);
  return all;
}
