"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  LayoutGrid,
  List,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/Badge";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Drawer } from "@/components/Drawer";
import { FilterSearch, FilterSelect } from "@/components/FilterSelect";
import { Header } from "@/components/Header";
import { Pagination } from "@/components/Pagination";
import { CardGridSkeleton, TableSkeleton } from "@/components/TableSkeleton";
import { MaintenanceDetailView } from "@/components/MaintenanceDetailView";
import { MaintenanceForm } from "@/components/MaintenanceForm";
import { useSessionUser } from "@/components/SessionContext";
import {
  createMaintenance,
  deleteMaintenance,
  fetchAllMaintenance,
  fetchMaintenance,
  updateMaintenance,
} from "@/lib/api/maintenance";
import { fetchAllAssets } from "@/lib/api/assets";
import { verifyPassword } from "@/lib/api/auth";
import { canWrite } from "@/lib/auth/permissions";
import { MaintenanceExportColumnDialog } from "@/components/MaintenanceExportColumnDialog";
import {
  ALL_MAINTENANCE_EXPORT_COLUMN_KEYS,
  exportMaintenanceExcel,
  exportMaintenancePdf,
  type MaintenanceExportColumnKey,
} from "@/lib/export-maintenance";
import { todayIso, validateMaintenanceForm } from "@/lib/maintenance-form";
import { REFERENCE_DATA } from "@/lib/reference-data";
import { labelEnum } from "@/lib/labels";
import type { Asset, MaintenanceRecord } from "@/lib/types";

type ViewMode = "table" | "grid";
type DrawerMode = "create" | "view" | "edit";

const VIEW_MODE_STORAGE_KEY = "maintenance-view";

function readStoredViewMode(): ViewMode {
  if (typeof window === "undefined") return "table";
  const saved = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
  return saved === "grid" ? "grid" : "table";
}

function emptyForm(performedBy = ""): Record<string, string> {
  return {
    computerName: "",
    auditId: "",
    employee: "",
    issue: "",
    actionTaken: "",
    status: "OPEN",
    dateOpened: todayIso(),
    dateClosed: "",
    performedBy,
    notes: "",
  };
}

function formFromRecord(row: MaintenanceRecord): Record<string, string> {
  return {
    computerName: row.computer_name ?? "",
    auditId: row.audit_id ?? "",
    employee: row.employee ?? "",
    issue: row.issue,
    actionTaken: row.action_taken ?? "",
    status: row.status ?? "OPEN",
    dateOpened: row.date_opened?.slice(0, 10) ?? "",
    dateClosed: row.date_closed?.slice(0, 10) ?? "",
    performedBy: row.performed_by ?? "",
    notes: row.notes ?? "",
  };
}

export default function MaintenancePage() {
  const user = useSessionUser();
  const write = canWrite(user);
  const [items, setItems] = useState<MaintenanceRecord[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [assetsLoading, setAssetsLoading] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>("create");
  const [editing, setEditing] = useState<MaintenanceRecord | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>(readStoredViewMode);
  const [exporting, setExporting] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MaintenanceRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const exportMenuRef = useRef<HTMLDivElement>(null);

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
    if (status) parts.push(`Status: ${labelEnum(status)}`);
    return parts.length ? parts.join(" · ") : "None (all records)";
  };

  const buildExportFilterSummary = (columns: MaintenanceExportColumnKey[]) => {
    const parts = [buildFilterSummary()];
    if (columns.length < ALL_MAINTENANCE_EXPORT_COLUMN_KEYS.length) {
      parts.push(`Columns: ${columns.length} of ${ALL_MAINTENANCE_EXPORT_COLUMN_KEYS.length}`);
    }
    return parts.join(" · ");
  };

  const runExport = async (
    format: "excel" | "pdf",
    columns: MaintenanceExportColumnKey[] = ALL_MAINTENANCE_EXPORT_COLUMN_KEYS,
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
      const rows = await fetchAllMaintenance({
        search: search || undefined,
        status: status || undefined,
      });
      if (rows.length === 0) {
        setError("No service/repair records match the current filters to export.");
        return;
      }
      const filterSummary = buildExportFilterSummary(columns);
      if (format === "excel") {
        await exportMaintenanceExcel(rows, filterSummary, columns);
      } else {
        exportMaintenancePdf(rows, filterSummary, columns);
      }
      const label = format === "excel" ? "Excel" : "PDF";
      setSuccess(
        `Exported ${rows.length} service/repair ${rows.length === 1 ? "record" : "records"} to ${label} (${columns.length} column${columns.length === 1 ? "" : "s"}).`,
      );
      setExportDialogOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed");
    } finally {
      setExporting(false);
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchMaintenance({
        page,
        search: search || undefined,
        status: status || undefined,
      });
      setItems(res.items);
      setTotalPages(res.totalPages);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput), 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [search, status]);

  useEffect(() => {
    void load();
  }, [load]);

  const loadAssets = useCallback(() => {
    setAssetsLoading(true);
    fetchAllAssets()
      .then(setAssets)
      .catch(() => setAssets([]))
      .finally(() => setAssetsLoading(false));
  }, []);

  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

  useEffect(() => {
    if (!success) return;
    const timer = window.setTimeout(() => setSuccess(""), 5000);
    return () => window.clearTimeout(timer);
  }, [success]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm(user.fullName));
    setDrawerMode("create");
    setSaving(false);
    setError("");
    setFieldErrors({});
    setDrawerOpen(true);
    loadAssets();
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSaving(false);
    setDrawerMode("create");
    setError("");
    setFieldErrors({});
  };

  const openView = (row: MaintenanceRecord) => {
    setEditing(row);
    setForm(formFromRecord(row));
    setDrawerMode("view");
    setSaving(false);
    setError("");
    setFieldErrors({});
    setDrawerOpen(true);
  };

  const openEditForm = (row: MaintenanceRecord) => {
    setEditing(row);
    setForm(formFromRecord(row));
    setDrawerMode("edit");
    setSaving(false);
    setError("");
    setFieldErrors({});
    setDrawerOpen(true);
    loadAssets();
  };

  const save = async () => {
    if (!write || saving) return;
    const mode = editing ? "edit" : "create";
    const errors = validateMaintenanceForm(form, mode);
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
      if (editing) await updateMaintenance(editing.id, body);
      else await createMaintenance(body);
      setDrawerOpen(false);
      setDrawerMode("create");
      setSuccess(editing ? `Updated ${editing.record_code}.` : "Service/repair record created.");
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
      await deleteMaintenance(deleteTarget.id);
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

  const renderRowActions = (row: MaintenanceRecord) => (
    <div className="flex items-center gap-1">
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
        title="Asset Service / Repair Log"
        subtitle="Hands-on repair and service history for assets — not a helpdesk ticket queue"
      />
      <div className="page-content flex-1 overflow-y-auto">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <FilterSearch
            value={searchInput}
            onChange={setSearchInput}
            placeholder="Search record ID, computer, employee, issue..."
            className="min-w-0 flex-1"
          />
          <FilterSelect label="Status" value={status} onChange={setStatus} className="w-full sm:w-auto">
            <option value="">All statuses</option>
            {REFERENCE_DATA.maintenanceStatuses.map((s) => (
              <option key={s} value={s}>
                {labelEnum(s)}
              </option>
            ))}
          </FilterSelect>
          <div className="inline-flex rounded-lg border border-slate-600 p-0.5" role="group" aria-label="View mode">
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
          <div className="relative w-full sm:w-auto" ref={exportMenuRef}>
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
                    {ALL_MAINTENANCE_EXPORT_COLUMN_KEYS.length} columns
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
              onClick={openCreate}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#2E7D9A] px-4 py-2 text-sm font-medium text-white sm:w-auto"
            >
              <Plus className="h-4 w-4" /> New Service Log
            </button>
          )}
        </div>

        {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
        {success && <p className="mb-3 text-sm text-emerald-400">{success}</p>}

        {viewMode === "table" ? (
          <div className="card overflow-hidden">
            <div className="table-scroll">
              <table className="data-table data-table--fixed" style={{ minWidth: "68rem" }}>
                <colgroup>
                  <col style={{ width: "8%" }} />
                  <col style={{ width: "12%" }} />
                  <col style={{ width: "14%" }} />
                  <col style={{ width: "14%" }} />
                  <col style={{ width: "22%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "10%" }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>Record ID</th>
                    <th className="cell-wrap">Computer</th>
                    <th className="cell-wrap">Employee</th>
                    <th className="cell-wrap">Department</th>
                    <th className="cell-wrap">Issue</th>
                    <th>Status</th>
                    <th>Opened</th>
                    <th>{write ? "Actions" : "View"}</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <TableSkeleton columns={8} />
                  ) : items.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-slate-400">
                        No service/repair records found.
                      </td>
                    </tr>
                  ) : (
                    items.map((row) => (
                      <tr key={row.id} className="cursor-pointer" onClick={() => openView(row)}>
                        <td className="font-mono text-[#2E7D9A]">{row.record_code}</td>
                        <td className="cell-wrap font-medium text-white">{row.computer_name ?? "—"}</td>
                        <td className="cell-wrap text-slate-300">{row.employee ?? "—"}</td>
                        <td className="cell-wrap">{row.audit_register?.department?.name ?? "—"}</td>
                        <td className="cell-wrap text-slate-300">{row.issue}</td>
                        <td>
                          <Badge value={row.status} />
                        </td>
                        <td className="text-slate-300">{row.date_opened?.slice(0, 10) ?? "—"}</td>
                        <td onClick={(e) => e.stopPropagation()}>{renderRowActions(row)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div>
            {loading ? (
              <CardGridSkeleton />
            ) : items.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">No service/repair records found.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((row) => (
                  <article
                    key={row.id}
                    className="card cursor-pointer p-4 transition hover:border-[#2E7D9A]/50 hover:bg-slate-800/40"
                    onClick={() => openView(row)}
                  >
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-mono text-sm font-medium text-[#2E7D9A]">{row.record_code}</p>
                        <p className="mt-1 truncate text-base font-medium text-white">{row.computer_name ?? "—"}</p>
                        <p className="truncate text-sm text-slate-400">{row.employee ?? "—"}</p>
                      </div>
                      <div onClick={(e) => e.stopPropagation()}>{renderRowActions(row)}</div>
                    </div>
                    <p className="line-clamp-2 text-sm text-slate-300">{row.issue}</p>
                    <dl className="mt-3 space-y-2 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <dt className="text-slate-500">Department</dt>
                        <dd className="truncate text-slate-300">{row.audit_register?.department?.name ?? "—"}</dd>
                      </div>
                      {row.date_opened && (
                        <div className="flex items-center justify-between gap-2">
                          <dt className="text-slate-500">Opened</dt>
                          <dd className="text-slate-300">{row.date_opened.slice(0, 10)}</dd>
                        </div>
                      )}
                    </dl>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <Badge value={row.status} />
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      <Drawer
        open={drawerOpen}
        title={
          !editing
            ? "New Service Log"
            : drawerMode === "edit"
              ? `Edit ${editing.record_code}`
              : `View ${editing.record_code}`
        }
        subtitle={
          !editing
            ? "Log hands-on repair or preventive service on an asset"
            : drawerMode === "edit"
              ? "Update service/repair record details"
              : "Service/repair record summary"
        }
        onClose={closeDrawer}
        banner={
          drawerMode !== "view" && error ? (
            <p className="rounded-lg border border-red-900/50 bg-red-950/40 px-3 py-2 text-sm text-red-400">
              {error}
            </p>
          ) : undefined
        }
        footer={
          drawerMode === "view" && editing && write ? (
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
          ) : drawerMode !== "view" && write ? (
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
                {saving ? "Saving..." : drawerMode === "create" ? "Create Log" : "Save Changes"}
              </button>
            </div>
          ) : undefined
        }
      >
        {drawerMode === "view" && editing ? (
          <MaintenanceDetailView record={editing} />
        ) : (
          <MaintenanceForm
            mode={drawerMode === "create" ? "create" : "edit"}
            form={form}
            onChange={setForm}
            assets={assets}
            assetsLoading={assetsLoading}
            fieldErrors={fieldErrors}
            readOnly={!write}
          />
        )}
      </Drawer>

      <MaintenanceExportColumnDialog
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
        title="Delete service/repair record?"
        message={
          deleteTarget
            ? `Are you sure you want to delete service/repair record ${deleteTarget.record_code}? This action cannot be undone.`
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
    </>
  );
}
