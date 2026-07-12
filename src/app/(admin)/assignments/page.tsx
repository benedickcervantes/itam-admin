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
import { AssignmentDetailView } from "@/components/AssignmentDetailView";
import { AssignmentForm } from "@/components/AssignmentForm";
import { Badge } from "@/components/Badge";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Drawer } from "@/components/Drawer";
import { FilterSearch, FilterSelect } from "@/components/FilterSelect";
import { Header } from "@/components/Header";
import { Pagination } from "@/components/Pagination";
import { CardGridSkeleton, TableSkeleton } from "@/components/TableSkeleton";
import { useSessionUser } from "@/components/SessionContext";
import { fetchAssets } from "@/lib/api/assets";
import {
  createAssignment,
  deleteAssignment,
  fetchAllAssignments,
  fetchAssignments,
  updateAssignment,
} from "@/lib/api/assignments";
import { verifyPassword } from "@/lib/api/auth";
import { fetchDepartments } from "@/lib/api/departments";
import { canWrite } from "@/lib/auth/permissions";
import { exportAssignmentsExcel, exportAssignmentsPdf } from "@/lib/export-assignments";
import { todayIso, validateAssignmentForm } from "@/lib/assignment-form";
import { labelEnum } from "@/lib/labels";
import type { Assignment, Asset, Department } from "@/lib/types";

type ViewMode = "table" | "grid";
type DrawerMode = "create" | "view" | "edit";

const VIEW_MODE_STORAGE_KEY = "assignments-view";

function readStoredViewMode(): ViewMode {
  if (typeof window === "undefined") return "table";
  const saved = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
  return saved === "grid" ? "grid" : "table";
}

function assignmentStatus(row: Assignment) {
  return row.returned_date ? "RETURNED" : "ACTIVE";
}

function emptyForm(assignedBy = ""): Record<string, string> {
  return {
    assetId: "",
    assignedTo: "",
    assignedDate: todayIso(),
    departmentId: "",
    assignedBy,
  };
}

function formFromRecord(row: Assignment): Record<string, string> {
  return {
    assetId: row.asset_id,
    assignedTo: row.assigned_to,
    assignedDate: row.assigned_date.slice(0, 10),
    returnedDate: row.returned_date?.slice(0, 10) ?? "",
    departmentId: row.department_id ?? "",
    assignedBy: row.assigned_by ?? "",
    notes: row.notes ?? "",
  };
}

export default function AssignmentsPage() {
  const user = useSessionUser();
  const write = canWrite(user);
  const [items, setItems] = useState<Assignment[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>("create");
  const [editing, setEditing] = useState<Assignment | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>(readStoredViewMode);
  const [exporting, setExporting] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Assignment | null>(null);
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
    if (statusFilter === "active") parts.push("Status: Active");
    if (statusFilter === "returned") parts.push("Status: Returned");
    if (departmentId) {
      parts.push(`Department: ${departments.find((d) => d.id === departmentId)?.name ?? departmentId}`);
    }
    return parts.length ? parts.join(" · ") : "None (all records)";
  };

  const runExport = async (format: "excel" | "pdf") => {
    if (exporting) return;
    setExportMenuOpen(false);
    setExporting(true);
    setError("");
    setSuccess("");
    try {
      const rows = await fetchAllAssignments({
        search: search || undefined,
        status: statusFilter || undefined,
        departmentId: departmentId || undefined,
      });
      if (rows.length === 0) {
        setError("No assignments match the current filters to export.");
        return;
      }
      if (format === "excel") {
        await exportAssignmentsExcel(rows, buildFilterSummary());
      } else {
        exportAssignmentsPdf(rows, buildFilterSummary());
      }
      const label = format === "excel" ? "Excel" : "PDF";
      setSuccess(`Exported ${rows.length} assignment ${rows.length === 1 ? "record" : "records"} to ${label}.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed");
    } finally {
      setExporting(false);
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchAssignments({
        page,
        search: search || undefined,
        status: statusFilter || undefined,
        departmentId: departmentId || undefined,
      });
      setItems(res.items);
      setTotalPages(res.totalPages);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, departmentId]);

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput), 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, departmentId]);

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

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm(user.fullName));
    setDrawerMode("create");
    setSaving(false);
    setError("");
    setFieldErrors({});
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSaving(false);
    setDrawerMode("create");
    setError("");
    setFieldErrors({});
  };

  const openView = (row: Assignment) => {
    setEditing(row);
    setForm(formFromRecord(row));
    setDrawerMode("view");
    setSaving(false);
    setError("");
    setFieldErrors({});
    setDrawerOpen(true);
  };

  const openEditForm = (row: Assignment) => {
    setEditing(row);
    setForm(formFromRecord(row));
    setDrawerMode("edit");
    setSaving(false);
    setError("");
    setFieldErrors({});
    setDrawerOpen(true);
  };

  const save = async () => {
    if (!write || saving) return;
    const mode = editing ? "edit" : "create";
    const errors = validateAssignmentForm(form, mode);
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
      if (editing) await updateAssignment(editing.id, body);
      else await createAssignment(body);
      setDrawerOpen(false);
      setDrawerMode("create");
      setSuccess(editing ? `Updated ${editing.record_code}.` : "Assignment record created.");
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
      await deleteAssignment(deleteTarget.id);
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

  const renderRowActions = (row: Assignment) => (
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
      <Header title="Assignments" subtitle="Device assignment history by employee" />
      <div className="page-content flex-1 overflow-y-auto">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <FilterSearch
            value={searchInput}
            onChange={setSearchInput}
            placeholder="Search record ID, asset, employee, assigned by..."
            className="min-w-0 flex-1"
          />
          <FilterSelect label="Status" value={statusFilter} onChange={setStatusFilter} className="w-full sm:w-auto">
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="returned">Returned</option>
          </FilterSelect>
          <FilterSelect label="Department" value={departmentId} onChange={setDepartmentId} className="w-full sm:w-auto">
            <option value="">All departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
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
                className="absolute right-0 z-20 mt-1 w-full min-w-[11rem] overflow-hidden rounded-lg border border-slate-700 bg-slate-900 shadow-lg sm:w-auto"
              >
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
              <Plus className="h-4 w-4" /> New Assignment
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
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "14%" }} />
                  <col style={{ width: "16%" }} />
                  <col style={{ width: "14%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "6%" }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>Record ID</th>
                    <th>Asset ID</th>
                    <th className="cell-wrap">Computer</th>
                    <th className="cell-wrap">Assigned To</th>
                    <th className="cell-wrap">Department</th>
                    <th>Assigned</th>
                    <th>Returned</th>
                    <th>Status</th>
                    <th>{write ? "Actions" : "View"}</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <TableSkeleton columns={9} />
                  ) : items.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">
                        No assignment records found.
                      </td>
                    </tr>
                  ) : (
                    items.map((row) => (
                      <tr key={row.id} className="cursor-pointer" onClick={() => openView(row)}>
                        <td className="font-mono text-[#2E7D9A]">{row.record_code}</td>
                        <td className="font-mono text-slate-300">{row.asset?.asset_code ?? "—"}</td>
                        <td className="cell-wrap font-medium text-white">{row.asset?.computer_name ?? "—"}</td>
                        <td className="cell-wrap text-slate-300">{row.assigned_to}</td>
                        <td className="cell-wrap text-slate-400">{row.department?.name ?? "—"}</td>
                        <td className="text-slate-300">{row.assigned_date.slice(0, 10)}</td>
                        <td className="text-slate-400">{row.returned_date?.slice(0, 10) ?? "—"}</td>
                        <td>
                          <Badge value={assignmentStatus(row)} />
                        </td>
                        <td onClick={(e) => e.stopPropagation()} className="w-0">
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
              <p className="py-8 text-center text-sm text-slate-400">No assignment records found.</p>
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
                        <p className="mt-1 truncate text-base font-medium text-white">{row.assigned_to}</p>
                        <p className="truncate text-sm text-slate-400">
                          {row.asset?.computer_name ?? row.asset?.asset_code ?? "—"}
                        </p>
                      </div>
                      <div onClick={(e) => e.stopPropagation()}>{renderRowActions(row)}</div>
                    </div>
                    <dl className="space-y-2 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <dt className="text-slate-500">Department</dt>
                        <dd className="truncate text-slate-300">{row.department?.name ?? "—"}</dd>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <dt className="text-slate-500">Assigned</dt>
                        <dd className="text-slate-300">{row.assigned_date.slice(0, 10)}</dd>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <dt className="text-slate-500">Returned</dt>
                        <dd className="text-slate-300">{row.returned_date?.slice(0, 10) ?? "—"}</dd>
                      </div>
                    </dl>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <Badge value={assignmentStatus(row)} />
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
            ? "New Assignment"
            : drawerMode === "edit"
              ? `Edit ${editing.record_code}`
              : `View ${editing.record_code}`
        }
        subtitle={
          !editing
            ? "Record a device assignment to an employee"
            : drawerMode === "edit"
              ? "Update assignment details"
              : "Assignment record summary"
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
                {saving ? "Saving..." : drawerMode === "create" ? "Create Assignment" : "Save Changes"}
              </button>
            </div>
          ) : undefined
        }
      >
        {drawerMode === "view" && editing ? (
          <AssignmentDetailView record={editing} />
        ) : (
          <AssignmentForm
            mode={drawerMode === "create" ? "create" : "edit"}
            form={form}
            onChange={setForm}
            assets={assets}
            departments={departments}
            fieldErrors={fieldErrors}
            readOnly={!write}
            assetLocked={!!editing}
          />
        )}
      </Drawer>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete assignment record?"
        message={
          deleteTarget
            ? `Are you sure you want to delete assignment record ${deleteTarget.record_code}? This action cannot be undone.`
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
