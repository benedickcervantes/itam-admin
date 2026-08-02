"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRightLeft,
  ChevronDown,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  LayoutGrid,
  List,
  Loader2,
  Pencil,
  Trash2,
} from "lucide-react";
import { AssignmentDetailView } from "@/components/AssignmentDetailView";
import { AssignmentForm } from "@/components/AssignmentForm";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Drawer } from "@/components/Drawer";
import { ActiveFilters } from "@/components/ActiveFilters";
import { FilterSearch, FilterSelect } from "@/components/FilterSelect";
import { Header } from "@/components/Header";
import { TourEmptyCta, TourNudge, useTourHint } from "@/components/TourNudge";
import { Pagination } from "@/components/Pagination";
import { SpotlightTour, shouldAutoStartTour, type TourStep } from "@/components/SpotlightTour";
import { CardGridSkeleton, TableSkeleton } from "@/components/TableSkeleton";
import { useSessionUser } from "@/components/SessionContext";
import { fetchAssets } from "@/lib/api/assets";
import {
  deleteDeviceHistory,
  fetchAllDeviceHistory,
  fetchDeviceHistory,
  updateDeviceHistory,
} from "@/lib/api/device-history";
import { verifyPassword } from "@/lib/api/auth";
import { fetchDepartments } from "@/lib/api/departments";
import { canWrite } from "@/lib/auth/permissions";
import { AssignmentExportColumnDialog } from "@/components/AssignmentExportColumnDialog";
import {
  ALL_ASSIGNMENT_EXPORT_COLUMN_KEYS,
  exportAssignmentsExcel,
  exportAssignmentsPdf,
  type AssignmentExportColumnKey,
} from "@/lib/export-assignments";
import { validateAssignmentForm } from "@/lib/assignment-form";
import { TransferAssetsForm } from "@/components/TransferAssetsForm";
import {
  DEVICE_HISTORY_TOUR_STORAGE_KEY,
  getDeviceHistoryTourSteps,
} from "@/lib/tours/device-history";
import type { DeviceHistory, Asset, Department } from "@/lib/types";

type ViewMode = "table" | "grid";
type DrawerMode = "view" | "edit" | "transfer";

const VIEW_MODE_STORAGE_KEY = "device-history-view";

function readStoredViewMode(): ViewMode {
  if (typeof window === "undefined") return "table";
  const saved = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
  return saved === "grid" ? "grid" : "table";
}

function formFromRecord(row: DeviceHistory): Record<string, string> {
  return {
    assetId: row.asset_id,
    assignedTo: row.assigned_to,
    assignedDate: row.assigned_date.slice(0, 10),
    returnedDate: row.returned_date?.slice(0, 10) ?? "-",
    departmentId: row.department_id ?? "-",
    assignedBy: row.assigned_by ?? "-",
    notes: row.notes ?? "-",
  };
}

/** Plain-language badge for tech and non-tech users. */
function historyStatusBadge(row: DeviceHistory): { label: string; className: string } {
  if (!row.returned_date) {
    return {
      label: "Current",
      className: "text-emerald-400/90",
    };
  }
  const notes = (row.notes ?? "").toLowerCase();
  const releasedToStock =
    /released to available|released to reserved|moved to spare|spare stock|available from/i.test(
      notes,
    );
  if (releasedToStock) {
    return {
      label: "Available",
      className: "text-sky-400/90",
    };
  }
  return {
    label: "Previous",
    className: "text-amber-400/90",
  };
}

export default function DeviceHistoryPage() {
  const user = useSessionUser();
  const write = canWrite(user);
  const [items, setItems] = useState<DeviceHistory[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  /** active = current only; returned = closed moves; all = both. Default all so releases/moves are visible. */
  const [statusFilter, setStatusFilter] = useState<"active" | "returned" | "all">("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>("view");
  const [editing, setEditing] = useState<DeviceHistory | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>(readStoredViewMode);
  const [exporting, setExporting] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DeviceHistory | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [tourOpen, setTourOpen] = useState(false);
  const { showHint, showPulse, dismissHint } = useTourHint(DEVICE_HISTORY_TOUR_STORAGE_KEY, tourOpen, user.id);
  const startTour = () => {
    dismissHint();
    setTourOpen(true);
  };
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const loadSeq = useRef(0);
  const tourAutoStarted = useRef(false);
  const tourOpenedTransfer = useRef(false);

  const changeViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
  };

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

  const buildFilterSummary = () => {
    const parts: string[] = [];
    if (search) parts.push(`Search: "${search}"`);
    if (statusFilter === "returned") {
      parts.push("Show: Previous / Available");
    } else if (statusFilter === "active") {
      parts.push("Show: Current only");
    }
    if (departmentId) {
      parts.push(`Department: ${departments.find((d) => d.id === departmentId)?.name ?? departmentId}`);
    }
    return parts.length ? parts.join(" ? ") : "None (all records)";
  };

  const buildExportFilterSummary = (columns: AssignmentExportColumnKey[]) => {
    const parts = [buildFilterSummary()];
    if (columns.length < ALL_ASSIGNMENT_EXPORT_COLUMN_KEYS.length) {
      parts.push(`Columns: ${columns.length} of ${ALL_ASSIGNMENT_EXPORT_COLUMN_KEYS.length}`);
    }
    return parts.join(" ? ");
  };

  const runExport = async (
    format: "excel" | "pdf",
    columns: AssignmentExportColumnKey[] = ALL_ASSIGNMENT_EXPORT_COLUMN_KEYS,
  ) => {
    if (exporting) return;
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
      const rows = await fetchAllDeviceHistory({
        search: search || undefined,
        departmentId: departmentId || undefined,
      });
      if (rows.length === 0) {
        setError("No device history records match the current filters to export.");
        return;
      }
      const filterSummary = buildExportFilterSummary(columns);
      if (format === "excel") {
        await exportAssignmentsExcel(rows, filterSummary, columns);
      } else {
        exportAssignmentsPdf(rows, filterSummary, columns);
      }
      const label = format === "excel" ? "Excel" : "PDF";
      setSuccess(
        `Exported ${rows.length} history ${rows.length === 1 ? "record" : "records"} to ${label} (${columns.length} column${columns.length === 1 ? "" : "s"}).`,
      );
      setExportDialogOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed");
    } finally {
      setExporting(false);
    }
  };

  const load = useCallback(async () => {
    const seq = ++loadSeq.current;
    setLoading(true);
    try {
      const res = await fetchDeviceHistory({
        page,
        search: search || undefined,
        departmentId: departmentId || undefined,
        status: statusFilter,
      });
      if (seq !== loadSeq.current) return;
      if (res.totalPages > 0 && page > res.totalPages) {
        setPage(1);
        return;
      }
      setItems(res.items);
      setTotalPages(Math.max(1, res.totalPages || 1));
      setError("");
    } catch (e) {
      if (seq !== loadSeq.current) return;
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      if (seq === loadSeq.current) setLoading(false);
    }
  }, [page, search, departmentId, statusFilter]);

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [search, departmentId, statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!success) return;
    const timer = window.setTimeout(() => setSuccess(""), 5000);
    return () => window.clearTimeout(timer);
  }, [success]);

  useEffect(() => {
    fetchAssets({ limit: 200 }).then((r) => setAssets(r.items)).catch(() => {});
    fetchDepartments().then(setDepartments).catch(() => {});
  }, []);

  // First visit: auto-start the spotlight tour once loading settles.
  useEffect(() => {
    if (tourAutoStarted.current || loading) return;
    if (!shouldAutoStartTour(DEVICE_HISTORY_TOUR_STORAGE_KEY)) return;
    tourAutoStarted.current = true;
    const t = window.setTimeout(() => setTourOpen(true), 450);
    return () => window.clearTimeout(t);
  }, [loading]);

  const openTransfer = () => {
    setEditing(null);
    setDrawerMode("transfer");
    setSaving(false);
    setError("");
    setFieldErrors({});
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSaving(false);
    setDrawerMode("view");
    setError("");
    setFieldErrors({});
  };

  const tourSteps = useMemo(() => getDeviceHistoryTourSteps(write), [write]);

  const handleTourStepChange = useCallback((step: TourStep | null) => {
    const needsTransfer = Boolean(step?.id?.startsWith("history-transfer"));
    if (needsTransfer) {
      if (!tourOpenedTransfer.current) {
        setEditing(null);
        setSaving(false);
        setError("");
        setFieldErrors({});
        tourOpenedTransfer.current = true;
      }
      setDrawerMode("transfer");
      setDrawerOpen(true);
      return;
    }
    if (tourOpenedTransfer.current) {
      setDrawerOpen(false);
      setSaving(false);
      setDrawerMode("view");
      setError("");
      setFieldErrors({});
      tourOpenedTransfer.current = false;
    }
  }, []);

  const openView = (row: DeviceHistory) => {
    setEditing(row);
    setForm(formFromRecord(row));
    setDrawerMode("view");
    setSaving(false);
    setError("");
    setFieldErrors({});
    setDrawerOpen(true);
  };

  const openEditForm = (row: DeviceHistory) => {
    setEditing(row);
    setForm(formFromRecord(row));
    setDrawerMode("edit");
    setSaving(false);
    setError("");
    setFieldErrors({});
    setDrawerOpen(true);
  };

  const save = async () => {
    if (!write || saving || !editing) return;
    const errors = validateAssignmentForm(form, "edit");
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setError("Please fix the highlighted fields.");
      return;
    }

    setSaving(true);
    setError("");
    const body = { ...form };
    Object.keys(body).forEach((k) => body[k] === "" && delete body[k]);
    try {
      await updateDeviceHistory(editing.id, body);
      setDrawerOpen(false);
      setDrawerMode("view");
      setSuccess(`Updated ${editing.record_code}.`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async (password: string) => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await verifyPassword(password);
      await deleteDeviceHistory(deleteTarget.id);
      const code = deleteTarget.record_code;
      setDeleteTarget(null);
      setError("");
      setSuccess(`Deleted ${code}.`);
      await load();
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const renderRowActions = (row: DeviceHistory, tourTarget = false) => (
    <div className="flex items-center gap-1" {...(tourTarget ? { "data-tour": "history-actions" } : {})}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          openView(row);
        }}
        className={
          write
            ? "rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-[#2E7D9A]"
            : "inline-flex items-center gap-1.5 rounded-md border border-slate-700 px-2 py-1 text-xs font-medium text-slate-300 transition hover:border-[#2E7D9A]/50 hover:text-[#2E7D9A]"
        }
        title="View record"
        aria-label="View record"
      >
        <Eye className="h-4 w-4" />
        {!write && <span>View</span>}
      </button>
      {write && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openEditForm(row);
            }}
            className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-[#2E7D9A]"
            title="Edit record"
            aria-label="Edit record"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteError("");
              setDeleteTarget(row);
            }}
            className="rounded p-1 text-red-400 hover:bg-red-950/40 hover:text-red-300"
            title="Delete record"
            aria-label="Delete record"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </>
      )}
    </div>
  );

  return (
    <>
      <Header
        title="Device History"
        subtitle="When someone resigns or changes, transfer all their assets to the new user"
        onHowItWorks={startTour}
        howItWorksPulse={showPulse}
      />
      <div className="page-content flex-1 overflow-y-auto">
        <TourNudge show={showHint} onDismiss={dismissHint} onStart={startTour} />
        <div className="mb-4 space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <div data-tour="history-search" className="w-full sm:flex-1">
            <FilterSearch
              value={searchInput}
              onChange={setSearchInput}
              placeholder="Search record, asset, employee, brand, serial..."
              className="w-full"
            />
          </div>
          <div
            data-tour="history-filters"
            className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-end"
          >
            <FilterSelect
              label="Department"
              value={departmentId}
              onChange={(v) => {
                setPage(1);
                setDepartmentId(v);
              }}
              className="w-full sm:w-auto"
            >
              <option value="">All departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect
              label="Show"
              value={statusFilter}
              onChange={(v) => {
                setPage(1);
                setStatusFilter(v as "active" | "returned" | "all");
              }}
              className="w-full sm:w-auto"
            >
              <option value="all">All records</option>
              <option value="active">Current only</option>
              <option value="returned">Previous / Available</option>
            </FilterSelect>
          </div>
          <div
            data-tour="history-view-mode"
            className="inline-flex rounded-lg border border-slate-600 p-0.5"
            role="group"
            aria-label="View mode"
          >
            <button
              type="button"
              onClick={() => changeViewMode("table")}
              aria-pressed={viewMode === "table"}
              title="Table view"
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition ${
                viewMode === "table" ? "bg-[#2E7D9A] text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <List className="h-4 w-4" />
              <span className="hidden sm:inline">Table</span>
            </button>
            <button
              type="button"
              onClick={() => changeViewMode("grid")}
              aria-pressed={viewMode === "grid"}
              title="Grid view"
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition ${
                viewMode === "grid" ? "bg-[#2E7D9A] text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
              <span className="hidden sm:inline">Grid</span>
            </button>
          </div>
          <div className="relative w-full sm:w-auto" ref={exportMenuRef} data-tour="history-export">
            <button
              type="button"
              onClick={() => setExportMenuOpen((o) => !o)}
              disabled={exporting}
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
                    {ALL_ASSIGNMENT_EXPORT_COLUMN_KEYS.length} columns
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
          {write && (
            <button
              type="button"
              data-tour="history-transfer"
              onClick={openTransfer}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#2E7D9A] px-4 py-2 text-sm font-medium text-white sm:w-auto"
            >
              <ArrowRightLeft className="h-4 w-4" /> Transfer to new user
            </button>
          )}
        </div>
          <ActiveFilters
            filters={[
              ...(search
                ? [
                    {
                      key: "search",
                      label: "Search",
                      value: search,
                      onRemove: () => {
                        setSearchInput("");
                        setSearch("");
                        setPage(1);
                      },
                    },
                  ]
                : []),
              ...(departmentId
                ? [
                    {
                      key: "department",
                      label: "Department",
                      value: departments.find((d) => d.id === departmentId)?.name ?? "Department",
                      onRemove: () => {
                        setDepartmentId("");
                        setPage(1);
                      },
                    },
                  ]
                : []),
              ...(statusFilter !== "all"
                ? [
                    {
                      key: "show",
                      label: "Show",
                      value:
                        statusFilter === "active" ? "Current only" : "Previous / Available",
                      onRemove: () => {
                        setStatusFilter("all");
                        setPage(1);
                      },
                    },
                  ]
                : []),
            ]}
            onClearAll={() => {
              setSearchInput("");
              setSearch("");
              setDepartmentId("");
              setStatusFilter("all");
              setPage(1);
            }}
          />
        </div>

        {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
        {success && <p className="mb-3 text-sm text-emerald-400">{success}</p>}

        {viewMode === "table" ? (
          <div className="card overflow-hidden" data-tour="history-list">
            <div className="table-scroll">
              <table className="data-table data-table--fixed" style={{ minWidth: "68rem" }}>
                <colgroup>
                  <col style={{ width: "8%" }} />
                  <col style={{ width: "8%" }} />
                  <col style={{ width: "16%" }} />
                  <col style={{ width: "12%" }} />
                  <col style={{ width: "14%" }} />
                  <col style={{ width: "12%" }} />
                  <col style={{ width: "12%" }} />
                  <col style={{ width: "8%" }} />
                  <col style={{ width: "10%" }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>Record ID</th>
                    <th>Asset ID</th>
                    <th className="cell-wrap">Brand/Model</th>
                    <th className="cell-wrap">Computer</th>
                    <th className="cell-wrap">Assigned To</th>
                    <th className="cell-wrap">Last User</th>
                    <th className="cell-wrap">Department</th>
                    <th>Assigned</th>
                    <th>{write ? "Actions" : "View"}</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <TableSkeleton columns={9} />
                  ) : items.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-slate-400">
                        <div className="flex flex-col items-start gap-1 py-1">
                          <span>No device history records found.</span>
                          <TourEmptyCta onStart={startTour} />
                        </div>
                      </td>
                    </tr>
                  ) : (
                    items.map((row, rowIndex) => {
                      const status = historyStatusBadge(row);
                      return (
                      <tr key={row.id} className="cursor-pointer" onClick={() => openView(row)}>
                        <td className="font-mono text-[#2E7D9A]">{row.record_code}</td>
                        <td className="font-mono text-slate-300">{row.asset?.asset_code ?? "—"}</td>
                        <td className="cell-wrap font-medium text-white">{row.asset?.brand_model?.trim() || "—"}</td>
                        <td className="cell-wrap text-slate-300">{row.computer_name ?? row.asset?.computer_name ?? "—"}</td>
                        <td className="cell-wrap text-slate-300">{row.assigned_to ?? "—"}</td>
                        <td className="cell-wrap text-slate-300">{row.last_user ?? "—"}</td>
                        <td className="cell-wrap">{row.department?.name ?? "—"}</td>
                        <td className="text-slate-300">
                          <span className="block">{row.assigned_date.slice(0, 10)}</span>
                          <span
                            className={`mt-0.5 block text-[10px] font-medium uppercase tracking-wide ${status.className}`}
                          >
                            {status.label}
                          </span>
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          {renderRowActions(row, rowIndex === 0)}
                        </td>
                      </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div data-tour="history-list">
            {loading ? (
              <CardGridSkeleton />
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center py-8">
                <p className="text-center text-sm text-slate-400">No device history records found.</p>
                <TourEmptyCta onStart={startTour} />
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((row, rowIndex) => {
                  const status = historyStatusBadge(row);
                  return (
                  <article
                    key={row.id}
                    className="card cursor-pointer p-4 transition hover:border-[#2E7D9A]/50 hover:bg-slate-800/40"
                    onClick={() => openView(row)}
                  >
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-mono text-sm font-medium text-[#2E7D9A]">{row.record_code}</p>
                        <p className="mt-1 truncate text-base font-medium text-white">
                          {row.asset?.brand_model?.trim() || row.asset?.computer_name || "—"}
                        </p>
                        <p className="truncate font-mono text-xs text-slate-400">
                          {row.asset?.asset_code ?? "—"}
                          {(row.computer_name || row.asset?.computer_name)
                            ? ` · ${row.computer_name || row.asset?.computer_name}`
                            : ""}
                        </p>
                        <p className="truncate text-sm text-slate-400">{row.assigned_to}</p>
                        <p
                          className={`mt-1 text-[10px] font-medium uppercase tracking-wide ${status.className}`}
                        >
                          {status.label}
                        </p>
                        {row.notes?.trim() ? (
                          <p className="mt-1 line-clamp-2 text-xs text-slate-500">{row.notes}</p>
                        ) : null}
                      </div>
                      <div onClick={(e) => e.stopPropagation()}>
                        {renderRowActions(row, rowIndex === 0)}
                      </div>
                    </div>
                    <dl className="space-y-2 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <dt className="text-slate-500">Last User</dt>
                        <dd className="truncate text-slate-300">{row.last_user ?? "-"}</dd>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <dt className="text-slate-500">Department</dt>
                        <dd className="truncate text-slate-300">{row.department?.name ?? "-"}</dd>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <dt className="text-slate-500">Assigned</dt>
                        <dd className="text-slate-300">{row.assigned_date.slice(0, 10)}</dd>
                      </div>
                    </dl>
                  </article>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      <Drawer
        open={drawerOpen}
        dataTour={drawerMode === "transfer" ? "history-transfer-drawer" : undefined}
        title={
          drawerMode === "transfer"
            ? "Transfer assets to new user"
            : drawerMode === "edit" && editing
              ? `Edit ${editing.record_code}`
              : editing
                ? `View ${editing.record_code}`
                : "Device History"
        }
        subtitle={
          drawerMode === "transfer"
            ? "All assets under the current user move to the replacement"
            : drawerMode === "edit"
              ? "Correct a history record if needed"
              : "Device history summary"
        }
        onClose={closeDrawer}
        banner={
          (drawerMode === "edit" || drawerMode === "transfer") && error ? (
            <p className="rounded-lg border border-red-900/50 bg-red-950/40 px-3 py-2 text-sm text-red-400">
              {error}
            </p>
          ) : undefined
        }
        footer={
          drawerMode === "transfer" ? (
            <div className="ml-auto flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeDrawer}
                className="inline-flex h-10 w-[9rem] shrink-0 items-center justify-center rounded-lg border border-slate-600 px-3 text-sm font-medium leading-none text-slate-200 hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          ) : drawerMode === "view" && editing && write ? (
            <div className="ml-auto flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeDrawer}
                className="inline-flex h-10 w-[9rem] shrink-0 items-center justify-center rounded-lg border border-slate-600 px-3 text-sm font-medium leading-none text-slate-200 hover:bg-slate-800"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => setDrawerMode("edit")}
                className="inline-flex h-10 w-[9rem] shrink-0 items-center justify-center rounded-lg bg-[#2E7D9A] px-3 text-sm font-medium leading-none text-white hover:bg-[#256b85]"
              >
                Edit
              </button>
            </div>
          ) : drawerMode === "edit" && write ? (
            <div className="ml-auto flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={closeDrawer}
                className="inline-flex h-10 w-[9rem] shrink-0 items-center justify-center rounded-lg border border-slate-600 px-3 text-sm font-medium leading-none text-slate-200 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void save()}
                className="inline-flex h-10 w-[9rem] shrink-0 items-center justify-center gap-1.5 rounded-lg border border-transparent bg-[#2E7D9A] px-3 text-sm font-medium leading-none text-white hover:bg-[#256b85] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving && <Loader2 className="h-4 w-4 shrink-0 animate-spin" />}
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          ) : undefined
        }
      >
        {drawerMode === "transfer" ? (
          <TransferAssetsForm
            departments={departments}
            onError={setError}
            onDone={(message) => {
              setError("");
              setSuccess(message);
              setDrawerOpen(false);
              setDrawerMode("view");
              void load();
            }}
          />
        ) : drawerMode === "view" && editing ? (
          <AssignmentDetailView record={editing} />
        ) : (
          <AssignmentForm
            mode="edit"
            form={form}
            onChange={setForm}
            assets={assets}
            departments={departments}
            fieldErrors={fieldErrors}
            readOnly={!write}
            assetLocked
          />
        )}
      </Drawer>

      <AssignmentExportColumnDialog
        open={exportDialogOpen}
        filterSummary={buildFilterSummary()}
        exporting={exporting}
        onClose={() => {
          if (!exporting) setExportDialogOpen(false);
        }}
        onExport={(format, columns) => void runExport(format, columns)}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete device history record?"
        message={
          deleteTarget
            ? `Are you sure you want to delete device history record ${deleteTarget.record_code}? This action cannot be undone.`
            : ""
        }
        requirePassword
        error={deleteError}
        loading={deleting}
        onCancel={() => {
          if (!deleting) {
            setDeleteTarget(null);
            setDeleteError("");
          }
        }}
        onConfirm={(password) => void confirmDelete(password)}
      />

      <SpotlightTour
        open={tourOpen}
        steps={tourSteps}
        storageKey={DEVICE_HISTORY_TOUR_STORAGE_KEY}
        onStepChange={handleTourStepChange}
        onClose={() => setTourOpen(false)}
      />
    </>
  );
}
