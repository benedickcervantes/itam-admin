"use client";

import { useCallback, useEffect, useState } from "react";
import { Eye, LayoutGrid, List, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/Badge";
import { Drawer, Field, inputClass, selectClass } from "@/components/Drawer";
import { FilterSearch, FilterSelect } from "@/components/FilterSelect";
import { Header } from "@/components/Header";
import { MaintenanceDetailView } from "@/components/MaintenanceDetailView";
import { useSessionUser } from "@/components/SessionContext";
import { createMaintenance, deleteMaintenance, fetchMaintenance, updateMaintenance } from "@/lib/api/maintenance";
import { canWrite } from "@/lib/auth/permissions";
import { REFERENCE_DATA } from "@/lib/reference-data";
import { labelEnum } from "@/lib/labels";
import type { MaintenanceRecord } from "@/lib/types";

type ViewMode = "table" | "grid";
type DrawerMode = "create" | "view" | "edit";

const VIEW_MODE_STORAGE_KEY = "maintenance-view";

function readStoredViewMode(): ViewMode {
  if (typeof window === "undefined") return "table";
  const saved = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
  return saved === "grid" ? "grid" : "table";
}

function emptyForm(): Record<string, string> {
  return { issue: "", status: "OPEN" };
}

function formFromRecord(row: MaintenanceRecord): Record<string, string> {
  return {
    computerName: row.computer_name ?? "",
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
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>(readStoredViewMode);

  const changeViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
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

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setDrawerMode("create");
    setSaving(false);
    setError("");
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSaving(false);
    setDrawerMode("create");
    setError("");
  };

  const openView = (row: MaintenanceRecord) => {
    setEditing(row);
    setForm(formFromRecord(row));
    setDrawerMode("view");
    setSaving(false);
    setError("");
    setDrawerOpen(true);
  };

  const openEditForm = (row: MaintenanceRecord) => {
    setEditing(row);
    setForm(formFromRecord(row));
    setDrawerMode("edit");
    setSaving(false);
    setError("");
    setDrawerOpen(true);
  };

  const save = async () => {
    if (saving) return;
    setSaving(true);
    setError("");
    const body = { ...form };
    Object.keys(body).forEach((k) => body[k] === "" && delete body[k]);
    try {
      if (editing) await updateMaintenance(editing.id, body);
      else await createMaintenance(body);
      setDrawerOpen(false);
      setDrawerMode("create");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row: MaintenanceRecord) => {
    if (!confirm(`Delete maintenance record ${row.record_code}?`)) return;
    await deleteMaintenance(row.id);
    await load();
  };

  const renderRowActions = (row: MaintenanceRecord) => (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          openView(row);
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

  return (
    <>
      <Header title="Maintenance Log" subtitle="Repairs and actions (Open → In Progress → Completed)" />
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
          {write && (
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#2E7D9A] px-4 py-2 text-sm font-medium text-white sm:w-auto"
            >
              <Plus className="h-4 w-4" /> New Record
            </button>
          )}
        </div>

        {error && <p className="mb-3 text-sm text-red-400">{error}</p>}

        {viewMode === "table" ? (
          <div className="card overflow-hidden">
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Record ID</th>
                    <th>Computer</th>
                    <th>Employee</th>
                    <th>Issue</th>
                    <th>Status</th>
                    <th className="w-0">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="text-slate-400">
                        Loading...
                      </td>
                    </tr>
                  ) : items.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-slate-400">
                        No maintenance records found.
                      </td>
                    </tr>
                  ) : (
                    items.map((row) => (
                      <tr key={row.id} className="cursor-pointer" onClick={() => openView(row)}>
                        <td className="font-mono text-[#2E7D9A]">{row.record_code}</td>
                        <td className="font-medium text-white">{row.computer_name ?? "—"}</td>
                        <td className="text-slate-300">{row.employee ?? "—"}</td>
                        <td className="max-w-xs truncate text-slate-300">{row.issue}</td>
                        <td>
                          <Badge value={row.status} />
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
              <p className="py-8 text-center text-sm text-slate-400">No maintenance records found.</p>
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
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <Badge value={row.status} />
                    </div>
                    {(row.date_opened || row.performed_by) && (
                      <dl className="mt-3 space-y-1 text-sm">
                        {row.date_opened && (
                          <div className="flex items-center justify-between gap-2">
                            <dt className="text-slate-500">Opened</dt>
                            <dd className="text-slate-300">{row.date_opened.slice(0, 10)}</dd>
                          </div>
                        )}
                        {row.performed_by && (
                          <div className="flex items-center justify-between gap-2">
                            <dt className="text-slate-500">Performed By</dt>
                            <dd className="truncate text-slate-300">{row.performed_by}</dd>
                          </div>
                        )}
                      </dl>
                    )}
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
            ? "New Maintenance"
            : drawerMode === "edit"
              ? `Edit ${editing.record_code}`
              : `View ${editing.record_code}`
        }
        subtitle={
          !editing
            ? "Log a repair or maintenance action"
            : drawerMode === "edit"
              ? "Update maintenance record details"
              : "Maintenance record summary"
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
                {saving ? "Saving..." : "Save Record"}
              </button>
            </div>
          ) : undefined
        }
      >
        {drawerMode === "view" && editing ? (
          <MaintenanceDetailView record={editing} />
        ) : (
          <div className="space-y-3">
            <Field label="Computer Name">
              <input
                className={inputClass}
                value={form.computerName ?? ""}
                onChange={(e) => setForm({ ...form, computerName: e.target.value })}
                readOnly={!write}
              />
            </Field>
            <Field label="Employee">
              <input
                className={inputClass}
                value={form.employee ?? ""}
                onChange={(e) => setForm({ ...form, employee: e.target.value })}
                readOnly={!write}
              />
            </Field>
            <Field label="Issue" required>
              <textarea
                className={inputClass}
                rows={3}
                value={form.issue ?? ""}
                onChange={(e) => setForm({ ...form, issue: e.target.value })}
                readOnly={!write}
              />
            </Field>
            <Field label="Action Taken">
              <textarea
                className={inputClass}
                rows={2}
                value={form.actionTaken ?? ""}
                onChange={(e) => setForm({ ...form, actionTaken: e.target.value })}
                readOnly={!write}
              />
            </Field>
            <Field label="Status">
              <select
                className={selectClass}
                value={form.status ?? "OPEN"}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                disabled={!write}
              >
                {REFERENCE_DATA.maintenanceStatuses.map((s) => (
                  <option key={s} value={s}>
                    {labelEnum(s)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Date Opened">
              <input
                type="date"
                className={inputClass}
                value={form.dateOpened ?? ""}
                onChange={(e) => setForm({ ...form, dateOpened: e.target.value })}
                readOnly={!write}
              />
            </Field>
            <Field label="Date Closed">
              <input
                type="date"
                className={inputClass}
                value={form.dateClosed ?? ""}
                onChange={(e) => setForm({ ...form, dateClosed: e.target.value })}
                readOnly={!write}
              />
            </Field>
            <Field label="Performed By">
              <input
                className={inputClass}
                value={form.performedBy ?? ""}
                onChange={(e) => setForm({ ...form, performedBy: e.target.value })}
                readOnly={!write}
              />
            </Field>
            <Field label="Notes">
              <textarea
                className={inputClass}
                rows={2}
                value={form.notes ?? ""}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                readOnly={!write}
              />
            </Field>
          </div>
        )}
      </Drawer>
    </>
  );
}
