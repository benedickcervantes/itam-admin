"use client";

import { useCallback, useEffect, useState } from "react";
import { Eye, LayoutGrid, List, Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Badge } from "@/components/Badge";
import { AuditDetailView } from "@/components/AuditDetailView";
import { DeviceFormToolbar } from "@/components/DeviceFormToolbar";
import { DeviceInventoryForm } from "@/components/DeviceInventoryForm";
import { Drawer, inputClass, selectClass } from "@/components/Drawer";
import { Header } from "@/components/Header";
import {
  createAuditRegister,
  deleteAuditRegister,
  fetchAuditRegister,
  fetchAuditRegisters,
  updateAuditRegister,
  type AuditRegister,
} from "@/lib/api/auditRegisters";
import { fetchDepartments } from "@/lib/api/departments";
import { canWrite } from "@/lib/auth/permissions";
import { REFERENCE_DATA } from "@/lib/reference-data";
import { useSessionUser } from "@/components/SessionContext";
import { emptyForm, formStateFromAudit, prepareAuditPayload, ramSlotDefaults } from "@/lib/device-form";
import type { Department } from "@/lib/types";

type ViewMode = "table" | "grid";
type DrawerMode = "create" | "view" | "edit";

const VIEW_MODE_STORAGE_KEY = "audit-register-view";

function readStoredViewMode(): ViewMode {
  if (typeof window === "undefined") return "table";
  const saved = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
  return saved === "grid" ? "grid" : "table";
}

export default function AuditRegisterPage() {
  const user = useSessionUser();
  const write = canWrite(user);
  const [items, setItems] = useState<AuditRegister[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [auditStatus, setAuditStatus] = useState("");
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

  const changeViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchAuditRegisters({
        page,
        search: search || undefined,
        departmentId: departmentId || undefined,
        auditStatus: auditStatus || undefined,
      });
      setItems(res.items);
      setTotalPages(res.totalPages);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [page, search, departmentId, auditStatus]);

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput), 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [search, departmentId, auditStatus]);

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
    setSaving(true);
    setError("");
    setSuccess("");
    const body = prepareAuditPayload(form);
    try {
      if (editing) {
        const updated = await updateAuditRegister(editing.id, body);
        if (updated.asset) {
          if (updated.asset_created) {
            setSuccess(`Asset ${updated.asset.asset_code} created automatically.`);
          } else {
            setSuccess(`Matched existing asset ${updated.asset.asset_code} — no duplicate created.`);
          }
        }
      } else {
        const created = await createAuditRegister(body);
        if (created.asset) {
          if (created.asset_created) {
            setSuccess(`Asset ${created.asset.asset_code} created automatically.`);
          } else {
            setSuccess(`Matched existing asset ${created.asset.asset_code} — no duplicate created.`);
          }
        }
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

  const remove = async (row: AuditRegister) => {
    if (!confirm(`Delete audit ${row.audit_code}?`)) return;
    await deleteAuditRegister(row.id);
    await load();
  };

  const renderRowActions = (row: AuditRegister) => (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          void openView(row);
        }}
        className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-[#2E7D9A]"
        title="View record"
        aria-label="View record"
      >
        <Eye className="h-4 w-4" />
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
              void remove(row);
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

  const set = (key: string, value: string | boolean) => setForm((f) => ({ ...f, [key]: value }));

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
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search employee, computer, audit ID..."
              className={`${inputClass} pl-9`}
            />
          </div>
          <select
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            className={`${selectClass} w-full sm:w-auto sm:min-w-[10rem]`}
          >
            <option value="">All departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          <select
            value={auditStatus}
            onChange={(e) => setAuditStatus(e.target.value)}
            className={`${selectClass} w-full sm:w-auto sm:min-w-[10rem]`}
          >
            <option value="">All statuses</option>
            {REFERENCE_DATA.auditStatuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
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
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Audit ID</th>
                    <th>Employee</th>
                    <th>Job Title</th>
                    <th>Computer</th>
                    <th>Status</th>
                    <th>Assessment</th>
                    <th>Priority</th>
                    <th className="w-0">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="text-slate-400">
                        Loading...
                      </td>
                    </tr>
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
                        <td>{row.employee_name}</td>
                        <td>{row.job_title || "—"}</td>
                        <td>{row.computer_name}</td>
                        <td>
                          <Badge value={row.audit_status} />
                        </td>
                        <td>
                          <Badge value={row.overall_assessment} />
                        </td>
                        <td>
                          <Badge value={row.priority} />
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
              <p className="py-8 text-center text-sm text-slate-400">Loading...</p>
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
                        <dd className="truncate font-medium text-slate-200">{row.computer_name}</dd>
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
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mt-4 flex flex-col gap-3 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded border border-slate-600 px-3 py-1 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded border border-slate-600 px-3 py-1 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
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
                {saving ? "Saving..." : "Save Record"}
              </button>
            </div>
          ) : undefined
        }
      >
        {drawerMode === "view" && editing ? (
          detailLoading ? (
            <p className="py-12 text-center text-sm text-slate-400">Loading audit details...</p>
          ) : (
            <AuditDetailView audit={editing} />
          )
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
    </>
  );
}
