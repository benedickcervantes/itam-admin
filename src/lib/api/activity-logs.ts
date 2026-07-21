import { apiJson } from "./client";
import type { ActivityLog, Paginated } from "../types";
import { qs } from "../types";

export function fetchActivityLogs(query: Record<string, string | number | undefined> = {}) {
  return apiJson<Paginated<ActivityLog>>(`/api/v1/activity-logs${qs(query)}`, { auth: true });
}
