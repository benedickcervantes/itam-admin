"use client";

import { useCallback, useEffect, useMemo, useRef, useState, Fragment } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Download,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Loader2,
  RefreshCw,
  X,
} from "lucide-react";
import { ActivityLogExportColumnDialog } from "@/components/ActivityLogExportColumnDialog";
import { Badge } from "@/components/Badge";
import { FilterSearch, FilterSelect } from "@/components/FilterSelect";
import { Header } from "@/components/Header";
import { Pagination } from "@/components/Pagination";
import { TableSkeleton } from "@/components/TableSkeleton";
import { useSessionUser } from "@/components/SessionContext";
import { fetchActivityLogs, fetchAllActivityLogs } from "@/lib/api/activity-logs";
import { fetchUsers } from "@/lib/api/users";
import {
  ACTIVITY_ACTIONS,
  ACTIVITY_ENTITY_TYPES,
  daysAgoLocalDateInput,
  entityDeepLink,
  labelEntityType,
  localDayEndIso,
  localDayStartIso,
  toLocalDateInput,
} from "@/lib/activity-log-ui";
import { canViewActivityLogs } from "@/lib/auth/permissions";
import {
  ALL_ACTIVITY_LOG_EXPORT_COLUMN_KEYS,
  exportActivityLogsExcel,
  exportActivityLogsPdf,
  type ActivityLogExportColumnKey,
} from "@/lib/export-activity-logs";
import { labelEnum } from "@/lib/labels";
import type { ActivityFieldChange, ActivityLog, AdminUser } from "@/lib/types";

const PAGE_SIZE_OPTIONS = [20, 50, 100] as const;

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

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async (e) => {
        e.stopPropagation();
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1500);
        } catch {
          setCopied(false);
        }
      }}
      className="inline-flex items-center gap-1 rounded-md border border-slate-700 px-1.5 py-0.5 text-[11px] font-medium text-slate-400 hover:border-[#2E7D9A]/50 hover:text-[#2E7D9A]"
      title={`Copy ${label}`}
      aria-label={`Copy ${label}`}
    >
      {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export default function ActivityLogsPage() {
  const user = useSessionUser();
  const router = useRouter();
  const allowed = canViewActivityLogs(user);

  const [items, setItems] = useState<ActivityLog[]>([]);
  const [actors, setActors] = useState<AdminUser[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");
  const [actorFilter, setActorFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZE_OPTIONS)[number]>(20);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [dateError, setDateError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const hasActiveFilters = Boolean(
    searchInput || search || actionFilter || entityFilter || actorFilter || fromDate || toDate,
  );

  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);

  const dateRangeInvalid = Boolean(fromDate && toDate && fromDate > toDate);

  useEffect(() => {
    if (user && !allowed) {
      router.replace("/dashboard");
    }
  }, [user, allowed, router]);

  useEffect(() => {
    if (!allowed) return;
    fetchUsers()
      .then((rows) => {
        setActors([...rows].sort((a, b) => a.full_name.localeCompare(b.full_name)));
      })
      .catch(() => {});
  }, [allowed]);

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput), 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [search, actionFilter, entityFilter, actorFilter, fromDate, toDate, pageSize]);

  useEffect(() => {
    if (dateRangeInvalid) {
      setDateError("From date must be on or before To date.");
    } else {
      setDateError("");
    }
  }, [dateRangeInvalid]);

  useEffect(() => {
    if (!success) return;
    const timer = window.setTimeout(() => setSuccess(""), 5000);
    return () => window.clearTimeout(timer);
  }, [success]);

  useEffect(() => {
    if (!exportMenuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setExportMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [exportMenuOpen]);

  const queryParams = useMemo(() => {
    if (dateRangeInvalid) return null;
    return {
      search: search || undefined,
      action: actionFilter || undefined,
      entityType: entityFilter || undefined,
      actorUserId: actorFilter || undefined,
      from: fromDate ? localDayStartIso(fromDate) : undefined,
      to: toDate ? localDayEndIso(toDate) : undefined,
    };
  }, [search, actionFilter, entityFilter, actorFilter, fromDate, toDate, dateRangeInvalid]);

  const load = useCallback(async () => {
    if (!allowed || !queryParams) return;
    setLoading(true);
    try {
      const res = await fetchActivityLogs({
        ...queryParams,
        page,
        limit: pageSize,
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
  }, [allowed, queryParams, page, pageSize]);

  useEffect(() => {
    void load();
  }, [load]);

  const clearFilters = () => {
    setSearchInput("");
    setSearch("");
    setActionFilter("");
    setEntityFilter("");
    setActorFilter("");
    setFromDate("");
    setToDate("");
    setPage(1);
    setExpandedId(null);
  };

  const applyPreset = (preset: "today" | "7d" | "30d") => {
    const today = toLocalDateInput(new Date());
    if (preset === "today") {
      setFromDate(today);
      setToDate(today);
    } else if (preset === "7d") {
      setFromDate(daysAgoLocalDateInput(6));
      setToDate(today);
    } else {
      setFromDate(daysAgoLocalDateInput(29));
      setToDate(today);
    }
  };

  const buildFilterSummary = () => {
    const parts: string[] = [];
    if (search) parts.push(`Search: "${search}"`);
    if (actionFilter) parts.push(`Action: ${labelEnum(actionFilter)}`);
    if (entityFilter) parts.push(`Entity: ${labelEntityType(entityFilter)}`);
    if (actorFilter) {
      const actor = actors.find((a) => a.id === actorFilter);
      parts.push(`Actor: ${actor?.full_name ?? actorFilter}`);
    }
    if (fromDate) parts.push(`From: ${fromDate}`);
    if (toDate) parts.push(`To: ${toDate}`);
    return parts.length ? parts.join(" · ") : "None (all records)";
  };

  const buildExportFilterSummary = (columns: ActivityLogExportColumnKey[]) => {
    const parts = [buildFilterSummary()];
    if (columns.length < ALL_ACTIVITY_LOG_EXPORT_COLUMN_KEYS.length) {
      parts.push(`Columns: ${columns.length} of ${ALL_ACTIVITY_LOG_EXPORT_COLUMN_KEYS.length}`);
    }
    return parts.join(" · ");
  };

  const runExport = async (
    format: "excel" | "pdf",
    columns: ActivityLogExportColumnKey[] = ALL_ACTIVITY_LOG_EXPORT_COLUMN_KEYS,
  ) => {
    if (exporting || !queryParams) return;
    if (columns.length === 0) {
      setError("Select at least one column to export.");
      setExportDialogOpen(true);
      return;
    }
    setExportMenuOpen(false);
    setExporting(true);
    setError("");
    setSuccess("");
    try {
      const rows = await fetchAllActivityLogs(queryParams);
      if (rows.length === 0) {
        setError("No activity logs match the current filters to export.");
        return;
      }
      const filterSummary = buildExportFilterSummary(columns);
      if (format === "excel") {
        await exportActivityLogsExcel(rows, filterSummary, columns);
      } else {
        exportActivityLogsPdf(rows, filterSummary, columns);
      }
      const label = format === "excel" ? "Excel" : "PDF";
      setSuccess(
        `Exported ${rows.length} log${rows.length === 1 ? "" : "s"} to ${label} (${columns.length} column${columns.length === 1 ? "" : "s"}).`,
      );
      setExportDialogOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed");
    } finally {
      setExporting(false);
    }
  };

  if (!allowed) {
    return (
      <>
        <Header title="Activity Logs" subtitle="Redirecting…" />
        <div className="page-content flex flex-1 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      </>
    );
  }

  return (
    <>
      <Header
        title="Activity Logs"
        subtitle="Monitor user actions with before/after field changes"
      />

      <div className="page-content flex-1 overflow-y-auto">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <FilterSearch
            value={searchInput}
            onChange={setSearchInput}
            placeholder="Search actor, summary, entity…"
            className="min-w-0 flex-1"
          />
          <FilterSelect label="Action" value={actionFilter} onChange={setActionFilter} className="w-full sm:w-auto">
            <option value="">All actions</option>
            {ACTIVITY_ACTIONS.map((action) => (
              <option key={action} value={action}>
                {labelEnum(action)}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect label="Entity" value={entityFilter} onChange={setEntityFilter} className="w-full sm:w-auto">
            <option value="">All entities</option>
            {ACTIVITY_ENTITY_TYPES.map((type) => (
              <option key={type} value={type}>
                {labelEntityType(type)}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect label="Actor" value={actorFilter} onChange={setActorFilter} className="w-full sm:w-auto">
            <option value="">All actors</option>
            {actors.map((actor) => (
              <option key={actor.id} value={actor.id}>
                {actor.full_name}
              </option>
            ))}
          </FilterSelect>
          <label className="flex w-full flex-col gap-1 sm:w-auto">
            <span className="text-xs font-medium text-slate-400">From</span>
            <input
              type="date"
              value={fromDate}
              max={toDate || undefined}
              onChange={(e) => setFromDate(e.target.value)}
              className={`rounded-lg border bg-slate-900/80 px-3 py-2 text-sm text-white outline-none focus:border-[#2E7D9A] focus:ring-1 focus:ring-[#2E7D9A]/40 ${
                dateError ? "border-red-500/60" : "border-slate-600"
              }`}
            />
          </label>
          <label className="flex w-full flex-col gap-1 sm:w-auto">
            <span className="text-xs font-medium text-slate-400">To</span>
            <input
              type="date"
              value={toDate}
              min={fromDate || undefined}
              onChange={(e) => setToDate(e.target.value)}
              className={`rounded-lg border bg-slate-900/80 px-3 py-2 text-sm text-white outline-none focus:border-[#2E7D9A] focus:ring-1 focus:ring-[#2E7D9A]/40 ${
                dateError ? "border-red-500/60" : "border-slate-600"
              }`}
            />
          </label>
          <div className="inline-flex rounded-lg border border-slate-600 p-0.5" role="group" aria-label="Date presets">
            {(
              [
                ["today", "Today"],
                ["7d", "7d"],
                ["30d", "30d"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => applyPreset(key)}
                className="rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-400 transition hover:bg-slate-800 hover:text-white"
              >
                {label}
              </button>
            ))}
          </div>
          <FilterSelect
            label="Page size"
            value={String(pageSize)}
            onChange={(v) => setPageSize(Number(v) as (typeof PAGE_SIZE_OPTIONS)[number])}
            className="w-full sm:w-auto"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size} / page
              </option>
            ))}
          </FilterSelect>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-600 px-3 py-2 text-sm font-medium text-slate-300 hover:border-slate-500 hover:bg-slate-800 hover:text-white sm:w-auto"
            >
              <X className="h-4 w-4" />
              Clear filters
            </button>
          )}
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading || dateRangeInvalid}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-600 px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <div className="relative w-full sm:w-auto" ref={exportMenuRef}>
            <button
              type="button"
              onClick={() => setExportMenuOpen((o) => !o)}
              disabled={exporting || dateRangeInvalid}
              aria-haspopup="menu"
              aria-expanded={exportMenuOpen}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {exporting ? "Exporting..." : "Export"}
              {!exporting && <ChevronDown className="h-4 w-4" />}
            </button>
            {exportMenuOpen && !exporting && (
              <div
                role="menu"
                className="absolute right-0 z-20 mt-1 w-full min-w-[14rem] overflow-hidden rounded-lg border border-slate-700 bg-slate-900 shadow-lg sm:w-auto"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setExportMenuOpen(false);
                    setExportDialogOpen(true);
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-200 hover:bg-slate-800"
                >
                  <Download className="h-4 w-4 text-[#2E7D9A]" />
                  Customize columns...
                  <span className="ml-auto text-xs text-slate-500">
                    {ALL_ACTIVITY_LOG_EXPORT_COLUMN_KEYS.length} columns
                  </span>
                </button>
                <div className="border-t border-slate-800" />
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => void runExport("excel")}
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-200 hover:bg-slate-800"
                >
                  <FileSpreadsheet className="h-4 w-4 text-emerald-400" /> Export as Excel
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => void runExport("pdf")}
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-200 hover:bg-slate-800"
                >
                  <FileText className="h-4 w-4 text-red-400" /> Export as PDF
                </button>
              </div>
            )}
          </div>
        </div>

        {dateError && <p className="mb-3 text-sm text-red-400">{dateError}</p>}
        {success && <p className="mb-3 text-sm text-emerald-400">{success}</p>}
        {error && (
          <div className="mb-3 flex flex-wrap items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            <span className="flex-1">{error}</span>
            <button
              type="button"
              onClick={() => void load()}
              className="inline-flex items-center gap-1.5 rounded-md border border-red-500/40 px-2 py-1 text-xs font-medium hover:bg-red-500/10"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="card overflow-hidden">
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: 40 }} />
                    <th>Time</th>
                    <th>Actor</th>
                    <th>Action</th>
                    <th>Entity</th>
                    <th>Summary</th>
                  </tr>
                </thead>
                <tbody>
                  <TableSkeleton rows={8} columns={6} />
                </tbody>
              </table>
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="card flex flex-col items-center justify-center px-6 py-16 text-center">
            <p className="text-lg font-medium text-slate-300">
              {hasActiveFilters ? "No matching activity logs" : "No activity logs yet"}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {hasActiveFilters
                ? "Try adjusting your search, filters, or date range."
                : "User actions will appear here once people start using the system."}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-slate-600 px-3 py-1.5 text-sm font-medium text-slate-300 hover:bg-slate-800"
              >
                <X className="h-4 w-4" /> Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: 40 }} />
                    <th>Time</th>
                    <th>Actor</th>
                    <th>Action</th>
                    <th>Entity</th>
                    <th>Summary</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((row) => {
                    const expanded = expandedId === row.id;
                    const changes = Array.isArray(row.changes) ? row.changes : [];
                    const deepLink = entityDeepLink(row.entity_type, row.entity_label);
                    return (
                      <Fragment key={row.id}>
                        <tr
                          className="cursor-pointer align-top hover:bg-slate-800/40"
                          onClick={() => setExpandedId(expanded ? null : row.id)}
                        >
                          <td className="text-slate-500">
                            <button
                              type="button"
                              className="rounded p-1 hover:bg-slate-800 hover:text-white"
                              aria-expanded={expanded}
                              aria-label={expanded ? "Collapse details" : "Expand details"}
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedId(expanded ? null : row.id);
                              }}
                            >
                              {expanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </button>
                          </td>
                          <td className="whitespace-nowrap text-slate-300">
                            {formatDateTime(row.created_at)}
                          </td>
                          <td>
                            <p className="font-medium text-white">
                              {row.actor_name || row.actor_email || "—"}
                            </p>
                            {row.actor_name && row.actor_email && (
                              <p className="text-xs text-slate-400">{row.actor_email}</p>
                            )}
                          </td>
                          <td>
                            <Badge value={row.action} />
                          </td>
                          <td>
                            <p className="text-slate-200">{labelEntityType(row.entity_type)}</p>
                            {row.entity_label && (
                              <p className="text-xs text-slate-400">{row.entity_label}</p>
                            )}
                          </td>
                          <td className="text-slate-300">{row.summary}</td>
                        </tr>
                        {expanded && (
                          <tr className="bg-slate-950/40">
                            <td colSpan={6} className="!p-0">
                              <div className="space-y-3 border-t border-slate-700/50 px-4 py-4 sm:px-6">
                                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                                  {row.ip_address && (
                                    <span className="inline-flex items-center gap-1.5">
                                      IP: <span className="font-mono text-slate-300">{row.ip_address}</span>
                                      <CopyButton value={row.ip_address} label="IP address" />
                                    </span>
                                  )}
                                  {row.entity_id && (
                                    <span className="inline-flex items-center gap-1.5">
                                      ID:{" "}
                                      <span className="font-mono text-slate-300">{row.entity_id}</span>
                                      <CopyButton value={row.entity_id} label="entity ID" />
                                    </span>
                                  )}
                                  <span>
                                    {changes.length} field change
                                    {changes.length === 1 ? "" : "s"}
                                  </span>
                                  {deepLink && (
                                    <Link
                                      href={deepLink}
                                      onClick={(e) => e.stopPropagation()}
                                      className="inline-flex items-center gap-1 rounded-md border border-slate-700 px-2 py-0.5 text-[11px] font-medium text-[#4FB0CE] hover:border-[#2E7D9A]/50 hover:text-[#2E7D9A]"
                                    >
                                      Open {labelEntityType(row.entity_type)}
                                      <ExternalLink className="h-3 w-3" />
                                    </Link>
                                  )}
                                </div>
                                <ChangesPanel changes={changes} />
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && total > 0 && (
          <>
            <p className="mt-3 text-sm text-slate-400">
              Showing{" "}
              <span className="font-semibold text-slate-200">
                {rangeStart}–{rangeEnd}
              </span>{" "}
              of <span className="font-semibold text-slate-200">{total}</span>
            </p>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </div>

      <ActivityLogExportColumnDialog
        open={exportDialogOpen}
        filterSummary={buildFilterSummary()}
        exporting={exporting}
        onClose={() => {
          if (!exporting) setExportDialogOpen(false);
        }}
        onExport={(format, columns) => void runExport(format, columns)}
      />
    </>
  );
}
