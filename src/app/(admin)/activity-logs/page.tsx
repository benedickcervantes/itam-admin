"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { Badge } from "@/components/Badge";
import { FilterSearch, FilterSelect } from "@/components/FilterSelect";
import { Header } from "@/components/Header";
import { Pagination } from "@/components/Pagination";
import { TableSkeleton } from "@/components/TableSkeleton";
import { useSessionUser } from "@/components/SessionContext";
import { fetchActivityLogs } from "@/lib/api/activity-logs";
import { canViewActivityLogs } from "@/lib/auth/permissions";
import { labelEnum } from "@/lib/labels";
import type { ActivityFieldChange, ActivityLog } from "@/lib/types";

const ACTIONS = [
  "CREATE",
  "UPDATE",
  "DELETE",
  "LOGIN_SUCCESS",
  "LOGIN_FAILURE",
  "PASSWORD_VERIFY_SUCCESS",
  "PASSWORD_VERIFY_FAILURE",
] as const;

const ENTITY_TYPES = [
  "Auth",
  "User",
  "Asset",
  "AssetPeripheralMove",
  "AuditRegister",
  "DeviceHistory",
  "DeviceHistoryTransfer",
  "MaintenanceRecord",
  "DisposalRecord",
  "Supplier",
] as const;

function formatDateTime(value?: string) {
  if (!value) return "—";
  return new Date(value).toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatChangeValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return value || "—";
  if (typeof value === "boolean" || typeof value === "number") return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function ChangesPanel({ changes }: { changes: ActivityFieldChange[] }) {
  if (!changes.length) {
    return <p className="text-sm text-slate-400">No field changes recorded.</p>;
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-700/60">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-900/80 text-xs uppercase tracking-wide text-slate-400">
          <tr>
            <th className="px-3 py-2 font-medium">Field</th>
            <th className="px-3 py-2 font-medium">Before</th>
            <th className="px-3 py-2 font-medium">After</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700/50">
          {changes.map((change) => (
            <tr key={change.field} className="bg-slate-900/40">
              <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-[#4FB0CE]">
                {change.field}
              </td>
              <td className="max-w-xs break-words px-3 py-2 text-slate-400">
                {formatChangeValue(change.before)}
              </td>
              <td className="max-w-xs break-words px-3 py-2 text-slate-200">
                {formatChangeValue(change.after)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ActivityLogsPage() {
  const user = useSessionUser();
  const router = useRouter();
  const allowed = canViewActivityLogs(user);

  const [items, setItems] = useState<ActivityLog[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (user && !allowed) {
      router.replace("/dashboard");
    }
  }, [user, allowed, router]);

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput), 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [search, actionFilter, entityFilter, fromDate, toDate]);

  const load = useCallback(async () => {
    if (!allowed) return;
    setLoading(true);
    try {
      const res = await fetchActivityLogs({
        page,
        limit: 20,
        search: search || undefined,
        action: actionFilter || undefined,
        entityType: entityFilter || undefined,
        from: fromDate ? `${fromDate}T00:00:00.000Z` : undefined,
        to: toDate ? `${toDate}T23:59:59.999Z` : undefined,
      });
      setItems(res.items);
      setTotalPages(res.totalPages || 1);
      setTotal(res.total);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load activity logs");
    } finally {
      setLoading(false);
    }
  }, [allowed, page, search, actionFilter, entityFilter, fromDate, toDate]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!allowed) {
    return (
      <div className="flex flex-1 items-center justify-center text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Header
        title="Activity Logs"
        subtitle="Monitor user actions with before/after field changes"
      />

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-3 sm:p-6">
        <div className="flex flex-wrap items-end gap-3">
          <FilterSearch
            value={searchInput}
            onChange={setSearchInput}
            placeholder="Search actor, summary, entity…"
            className="min-w-[14rem] flex-1"
          />
          <FilterSelect label="Action" value={actionFilter} onChange={setActionFilter}>
            <option value="">All actions</option>
            {ACTIONS.map((action) => (
              <option key={action} value={action}>
                {labelEnum(action)}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect label="Entity" value={entityFilter} onChange={setEntityFilter}>
            <option value="">All entities</option>
            {ENTITY_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </FilterSelect>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-400">From</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="rounded-lg border border-slate-600 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none focus:border-[#2E7D9A] focus:ring-1 focus:ring-[#2E7D9A]/40"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-400">To</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="rounded-lg border border-slate-600 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none focus:border-[#2E7D9A] focus:ring-1 focus:ring-[#2E7D9A]/40"
            />
          </label>
        </div>

        <div className="flex items-center justify-between text-sm text-slate-400">
          <span>
            {total} log{total === 1 ? "" : "s"}
          </span>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </div>
        )}

        {items.length === 0 && !loading ? (
          <div className="rounded-xl border border-dashed border-slate-700 px-4 py-12 text-center text-sm text-slate-400">
            No activity logs match your filters.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-700/60">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-900/80 text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="w-8 px-3 py-3" />
                    <th className="px-3 py-3 font-medium">Time</th>
                    <th className="px-3 py-3 font-medium">Actor</th>
                    <th className="px-3 py-3 font-medium">Action</th>
                    <th className="px-3 py-3 font-medium">Entity</th>
                    <th className="px-3 py-3 font-medium">Summary</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {loading ? (
                    <TableSkeleton rows={8} columns={6} />
                  ) : items.map((row) => {
                    const expanded = expandedId === row.id;
                    const changes = Array.isArray(row.changes) ? row.changes : [];
                    return (
                      <tr key={row.id} className="align-top">
                        <td colSpan={6} className="p-0">
                          <button
                            type="button"
                            onClick={() => setExpandedId(expanded ? null : row.id)}
                            className="flex w-full items-start gap-0 text-left transition-colors hover:bg-slate-800/40"
                          >
                            <span className="flex w-10 shrink-0 items-center justify-center px-3 py-3 text-slate-500">
                              {expanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </span>
                            <span className="grid min-w-0 flex-1 grid-cols-1 gap-x-0 sm:grid-cols-[10rem_12rem_8rem_10rem_1fr] md:grid-cols-[11rem_13rem_9rem_11rem_1fr]">
                              <span className="truncate px-3 py-3 text-slate-300">
                                {formatDateTime(row.created_at)}
                              </span>
                              <span className="min-w-0 px-3 py-3">
                                <span className="block truncate font-medium text-white">
                                  {row.actor_name || row.actor_email || "—"}
                                </span>
                                {row.actor_name && row.actor_email && (
                                  <span className="block truncate text-xs text-slate-400">
                                    {row.actor_email}
                                  </span>
                                )}
                              </span>
                              <span className="px-3 py-3">
                                <Badge value={row.action} />
                              </span>
                              <span className="min-w-0 px-3 py-3">
                                <span className="block truncate text-slate-200">
                                  {row.entity_type}
                                </span>
                                {row.entity_label && (
                                  <span className="block truncate text-xs text-slate-400">
                                    {row.entity_label}
                                  </span>
                                )}
                              </span>
                              <span className="px-3 py-3 text-slate-300">{row.summary}</span>
                            </span>
                          </button>
                          {expanded && (
                            <div className="space-y-3 border-t border-slate-700/50 bg-slate-950/40 px-4 py-4 sm:px-12">
                              <div className="flex flex-wrap gap-4 text-xs text-slate-400">
                                {row.ip_address && <span>IP: {row.ip_address}</span>}
                                {row.entity_id && (
                                  <span className="font-mono">ID: {row.entity_id}</span>
                                )}
                                <span>
                                  {changes.length} field change
                                  {changes.length === 1 ? "" : "s"}
                                </span>
                              </div>
                              <ChangesPanel changes={changes} />
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  );
}
