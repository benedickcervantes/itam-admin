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
import { AuditDetailView } from "@/components/AuditDetailView";
import { DeviceFormToolbar } from "@/components/DeviceFormToolbar";
import { DeviceInventoryForm } from "@/components/DeviceInventoryForm";
import { Drawer, inputClass, selectClass } from "@/components/Drawer";
import { FilterSearch, FilterSelect } from "@/components/FilterSelect";
import { Header } from "@/components/Header";
import { Pagination } from "@/components/Pagination";
import { CardGridSkeleton, TableSkeleton } from "@/components/TableSkeleton";
import {
  createAuditRegister,
  deleteAuditRegister,
  fetchAllAuditRegisters,
  fetchAuditRegister,
  fetchAuditRegisters,
  updateAuditRegister,
  type AuditRegister,
} from "@/lib/api/auditRegisters";
import { verifyPassword } from "@/lib/api/auth";
import { AuditExportColumnDialog } from "@/components/AuditExportColumnDialog";
import {
  ALL_AUDIT_EXPORT_COLUMN_KEYS,
  exportAuditsExcel,
  exportAuditsPdf,
  type AuditExportColumnKey,
} from "@/lib/export-audit";
import { fetchDepartments } from "@/lib/api/departments";
import { canWrite } from "@/lib/auth/permissions";
import { REFERENCE_DATA } from "@/lib/reference-data";
import { useSessionUser } from "@/components/SessionContext";
import { emptyForm, formStateFromAudit, prepareAuditPayload, ramSlotDefaults, validateAuditForm } from "@/lib/device-form";
import { formatItemsNeededList, ITEMS_NEEDED_TABLE_LABEL, labelEnum } from "@/lib/labels";
import type { Department } from "@/lib/types";

type ViewMode = "table" | "grid";
type DrawerMode = "create" | "view" | "edit";

const VIEW_MODE_STORAGE_KEY = "audit-register-view";

function readStoredViewMode(): ViewMode {
  if (typeof window === "undefined") return "table";
  const saved = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
  return saved === "grid" ? "grid" : "table";
}

function auditNotesLabel(assessment?: string | null) {
  return assessment === "NEEDS_REPLACEMENT" ? "Replacement Notes" : "Upgrade Notes";
}

const ITEMS_NEEDED_FILTER_OPTIONS = [
  ...REFERENCE_DATA.upgradeComponents,
  ...REFERENCE_DATA.replacementOnlyComponents,
] as const;

export default function AuditRegisterPage() {
  const user = useSessionUser();
  const write = canWrite(user);
  const [items, setItems] = useState<AuditRegister[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [itemNeeded, setItemNeeded] = useState("");
  const [auditStatus, setAuditStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>("create");
  const [editing, setEditing] = useState<AuditRegister | null>(null);
  const [form, setForm] = useState(() => emptyForm());
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>(readStoredViewMode);
  const [exporting, setExporting] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AuditRegister | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const loadSeq = useRef(0);

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
    if (itemNeeded) parts.push(`Items needed: ${labelEnum(itemNeeded)}`);
    if (auditStatus) parts.push(`Status: ${auditStatus}`);
    if (priority) parts.push(`Priority: ${labelEnum(priority)}`);
    return parts.length ? parts.join(" · ") : "None (all records)";
  };

  const buildExportFilterSummary = (columns: AuditExportColumnKey[]) => {
    const parts = [buildFilterSummary()];
    if (columns.length < ALL_AUDIT_EXPORT_COLUMN_KEYS.length) {
      parts.push(`Columns: ${columns.length} of ${ALL_AUDIT_EXPORT_COLUMN_KEYS.length}`);
    }
    return parts.join(" · ");
  };

  const runExport = async (
    format: "excel" | "pdf",
    columns: AuditExportColumnKey[] = ALL_AUDIT_EXPORT_COLUMN_KEYS,
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
      const rows = await fetchAllAuditRegisters({
        search: search || undefined,
        upgradeComponent: itemNeeded || undefined,
        auditStatus: auditStatus || undefined,
        priority: priority || undefined,
      });
      if (rows.length === 0) {
        setError("No audit records match the current filters to export.");
        return;
      }
      const filterSummary = buildExportFilterSummary(columns);
      if (format === "excel") {
        await exportAuditsExcel(rows, filterSummary, columns);
      } else {
        exportAuditsPdf(rows, filterSummary, columns);
      }
      const label = format === "excel" ? "Excel" : "PDF";
      setSuccess(
        `Exported ${rows.length} audit ${rows.length === 1 ? "record" : "records"} to ${label} (${columns.length} column${columns.length === 1 ? "" : "s"}).`,
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
      const res = await fetchAuditRegisters({
        page,
        search: search || undefined,
        upgradeComponent: itemNeeded || undefined,
        auditStatus: auditStatus || undefined,
        priority: priority || undefined,
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
  }, [page, search, itemNeeded, auditStatus, priority]);

  const setFilterAndResetPage = useCallback((apply: () => void) => {
    setPage(1);
    apply();
  }, []);

  useEffect(() => {
    if (!success) return;
    const timer = window.setTimeout(() => setSuccess(""), 5000);
    return () => window.clearTimeout(timer);
  }, [success]);

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [search, itemNeeded, auditStatus, priority]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    fetchDepartments().then(setDepartments).catch(() => {});
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setDrawerMode("create");
    setSaving(false);
    setError("");
    setSuccess("");
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSaving(false);
    setDrawerMode("create");
    setError("");
    setSuccess("");
  };

  const loadAuditDetail = async (row: AuditRegister) => {
    setEditing(row);
    setForm(formStateFromAudit(row));
    setDetailLoading(true);
    try {
      const full = await fetchAuditRegister(row.id);
      setEditing(full);
      setForm(formStateFromAudit(full));
    } catch {
      /* keep list row data */
    } finally {
      setDetailLoading(false);
    }
  };

  const openView = async (row: AuditRegister) => {
    setDrawerMode("view");
    setSaving(false);
    setError("");
    setSuccess("");
    setDrawerOpen(true);
    await loadAuditDetail(row);
  };

  const openEditForm = async (row: AuditRegister) => {
    setDrawerMode("edit");
    setSaving(false);
    setError("");
    setSuccess("");
    setDrawerOpen(true);
    await loadAuditDetail(row);
  };

  const save = async () => {
    if (saving) return;
    setError("");
    setSuccess("");
    const validationError = validateAuditForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }
    setSaving(true);
    const body = prepareAuditPayload(form);
    try {
      const result = editing
        ? await updateAuditRegister(editing.id, body)
        : await createAuditRegister(body);
      if (result.assets && result.assets.length > 0) {
        const codes = result.assets.map((a) => a.asset_code).join(", ");
        const label = result.assets.length === 1 ? "asset record" : "asset records";
        setSuccess(`${result.assets.length} ${label} saved to the Asset Dashboard (${codes}).`);
      }
      setDrawerOpen(false);
      setDrawerMode("create");
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
      await deleteAuditRegister(deleteTarget.id);
      const code = deleteTarget.audit_code;
      setDeleteTarget(null);
      setError("");
      setSuccess(`Audit record ${code} deleted.`);
      await load();
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const renderRowActions = (row: AuditRegister) => (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          void openView(row);
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
              void openEditForm(row);
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

  const set = (key: string, value: string | boolean) =>
    setForm((f) => {
      const next = { ...f, [key]: value };
      if (key === "employeeName") {
        const name = String(value).trim();
        const unassigned = !name || /^unassigned$/i.test(name);
        if (unassigned) {
          // Same defaults as Asset Dashboard when Available / no assignee.
          next.jobTitle = "";
          next.departmentId = "";
          next.employeeStatus = "";
        }
      }
      return next;
    });

  const onDeviceTypeChange = (deviceType: string) => {
    const defaults = ramSlotDefaults(deviceType);
    setForm((f) => ({
      ...f,
      deviceType,
      ramSlotsTotal: defaults.total,
      ramFormFactor: defaults.formFactor,
    }));
  };

  return (
    <>
      <Header title="IT Audit Register" subtitle="Employee device audits with peripherals and assessment" />
      <div className="page-content flex-1 overflow-y-auto">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <FilterSearch
            value={searchInput}
            onChange={setSearchInput}
            placeholder="Search code, employee, computer, brand, job title..."
            className="w-full sm:flex-1"
          />
          <FilterSelect
            label="Items needed"
            value={itemNeeded}
            onChange={(v) => setFilterAndResetPage(() => setItemNeeded(v))}
            className="w-full sm:w-auto"
          >
            <option value="">All items needed</option>
            {ITEMS_NEEDED_FILTER_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {labelEnum(item)}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect
            label="Status"
            value={auditStatus}
            onChange={(v) => setFilterAndResetPage(() => setAuditStatus(v))}
            className="w-full sm:w-auto"
          >
            <option value="">All statuses</option>
            {REFERENCE_DATA.auditStatuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect
            label="Priority"
            value={priority}
            onChange={(v) => setFilterAndResetPage(() => setPriority(v))}
            className="w-full sm:w-auto"
          >
            <option value="">All priorities</option>
            {REFERENCE_DATA.priorities.map((p) => (
              <option key={p} value={p}>
                {labelEnum(p)}
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
                    {ALL_AUDIT_EXPORT_COLUMN_KEYS.length} columns
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
              <Plus className="h-4 w-4" /> New Audit
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
                  <col style={{ width: "15%" }} />
                  <col style={{ width: "19%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "13%" }} />
                  <col style={{ width: "15%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "10%" }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>Audit ID</th>
                    <th className="cell-wrap">Employee</th>
                    <th className="cell-wrap">Computer</th>
                    <th>Status</th>
                    <th>Assessment</th>
                    <th className="cell-wrap">{ITEMS_NEEDED_TABLE_LABEL}</th>
                    <th>Priority</th>
                    <th>{write ? "Actions" : "View"}</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <TableSkeleton columns={8} />
                  ) : items.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-slate-400">
                        No audit records found.
                      </td>
                    </tr>
                  ) : (
                    items.map((row) => (
                      <tr key={row.id} className="cursor-pointer" onClick={() => void openView(row)}>
                        <td className="font-mono text-[#2E7D9A]">{row.audit_code}</td>
                        <td className="cell-wrap text-slate-300">{row.employee_name}</td>
                        <td className={`cell-wrap ${row.computer_name?.trim() ? "font-medium text-white" : "text-slate-300"}`}>
                          {row.computer_name?.trim() || "—"}
                        </td>
                        <td>
                          <Badge value={row.audit_status} />
                        </td>
                        <td>
                          <Badge value={row.overall_assessment} />
                        </td>
                        <td className="cell-wrap text-slate-300">
                          {row.upgrade_components && row.upgrade_components.length > 0
                            ? formatItemsNeededList(row.upgrade_components)
                            : "—"}
                        </td>
                        <td>
                          <Badge value={row.priority} />
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          {renderRowActions(row)}
                        </td>
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
              <p className="py-8 text-center text-sm text-slate-400">No audit records found.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((row) => (
                  <article
                    key={row.id}
                    className="card cursor-pointer p-4 transition hover:border-[#2E7D9A]/50 hover:bg-slate-800/40"
                    onClick={() => void openView(row)}
                  >
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-mono text-sm font-medium text-[#2E7D9A]">{row.audit_code}</p>
                        <p className="mt-1 truncate text-base font-medium text-white">{row.employee_name}</p>
                        <p className="truncate text-sm text-slate-400">{row.job_title || "—"}</p>
                      </div>
                      <div onClick={(e) => e.stopPropagation()}>{renderRowActions(row)}</div>
                    </div>
                    <dl className="space-y-2 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <dt className="text-slate-500">Computer</dt>
                        <dd className="truncate font-medium text-slate-200">{row.computer_name || "—"}</dd>
                      </div>
                      {row.audit_date && (
                        <div className="flex items-center justify-between gap-2">
                          <dt className="text-slate-500">Audit Date</dt>
                          <dd className="text-slate-300">{row.audit_date}</dd>
                        </div>
                      )}
                    </dl>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <Badge value={row.audit_status} />
                      <Badge value={row.overall_assessment} />
                      <Badge value={row.priority} />
                    </div>
                    {row.upgrade_notes?.trim() && (
                      <p
                        className="mt-3 line-clamp-3 break-words text-sm text-slate-400"
                        title={row.upgrade_notes}
                      >
                        <span className="text-slate-500">{auditNotesLabel(row.overall_assessment)}: </span>
                        <span className="text-slate-300">{row.upgrade_notes}</span>
                      </p>
                    )}
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
            ? "New Audit Record"
            : drawerMode === "edit"
              ? `Edit ${editing.audit_code}`
              : `View ${editing.audit_code}`
        }
        subtitle={
          !editing
            ? "Capture employee device assessment"
            : drawerMode === "edit"
              ? "Update hardware audit details"
              : "Hardware audit summary"
        }
        onClose={closeDrawer}
        wide
        toolbar={drawerMode !== "view" ? <DeviceFormToolbar mode="audit" /> : undefined}
        banner={
          drawerMode !== "view" && (error || success) ? (
            <p
              className={`rounded-lg border px-3 py-2 text-sm ${
                error
                  ? "border-red-900/50 bg-red-950/40 text-red-400"
                  : "border-emerald-900/50 bg-emerald-950/40 text-emerald-400"
              }`}
            >
              {error || success}
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
                onClick={() => {
                  if (editing) setForm(formStateFromAudit(editing));
                  setDrawerMode("edit");
                }}
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
                {saving ? "Saving..." : "Save Record"}
              </button>
            </div>
          ) : undefined
        }
      >
        {detailLoading ? (
          <p className="py-12 text-center text-sm text-slate-400">Loading audit details...</p>
        ) : drawerMode === "view" && editing ? (
          <AuditDetailView audit={editing} />
        ) : (
          <DeviceInventoryForm
            mode="audit"
            form={form}
            set={set}
            onDeviceTypeChange={onDeviceTypeChange}
            write={write}
            departments={departments}
          />
        )}
      </Drawer>

      <AuditExportColumnDialog
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
        title="Delete audit record?"
        message={
          deleteTarget
            ? `Are you sure you want to delete audit ${deleteTarget.audit_code} for ${deleteTarget.employee_name}? This action cannot be undone.`
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
