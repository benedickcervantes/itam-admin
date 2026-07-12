"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, LayoutGrid, List, Loader2, Pencil, Plus, UserX } from "lucide-react";
import { Badge } from "@/components/Badge";
import { Drawer } from "@/components/Drawer";
import { UserDetailView, UserForm } from "@/components/UserForm";
import { FilterSearch, FilterSelect } from "@/components/FilterSelect";
import { Header } from "@/components/Header";
import { Pagination } from "@/components/Pagination";
import { CardGridSkeleton, TableSkeleton } from "@/components/TableSkeleton";
import { useSessionUser } from "@/components/SessionContext";
import { fetchDepartments } from "@/lib/api/departments";
import { createUser, deleteUser, fetchUsers, updateUser } from "@/lib/api/users";
import { canWrite } from "@/lib/auth/permissions";
import { labelEnum } from "@/lib/labels";
import { validateUserForm } from "@/lib/user-form";
import type { AdminUser, Department } from "@/lib/types";

type ViewMode = "table" | "grid";
type DrawerMode = "create" | "view" | "edit";

const VIEW_MODE_STORAGE_KEY = "users-view";
const PAGE_SIZE = 20;
const ROLES = ["SUPER_ADMIN", "IT_ADMIN", "VIEWER"] as const;

function readStoredViewMode(): ViewMode {
  if (typeof window === "undefined") return "table";
  const saved = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
  return saved === "grid" ? "grid" : "table";
}

function emptyForm(): Record<string, string> {
  return { role: "VIEWER", fullName: "", email: "", password: "", confirmPassword: "", departmentId: "", isActive: "true" };
}

function formFromUser(row: AdminUser): Record<string, string> {
  return {
    fullName: row.full_name,
    email: row.email,
    role: row.role,
    departmentId: row.department_id ?? "",
    password: "",
    confirmPassword: "",
    isActive: row.is_active ? "true" : "false",
  };
}

function userInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function formatDate(value?: string) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" });
}

export default function UsersPage() {
  const sessionUser = useSessionUser();
  const write = canWrite(sessionUser);
  const [items, setItems] = useState<AdminUser[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>("create");
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [viewMode, setViewMode] = useState<ViewMode>(readStoredViewMode);

  const changeViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await fetchUsers());
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    fetchDepartments().then(setDepartments).catch(() => {});
  }, [load]);

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput), 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [search, roleFilter, departmentFilter, activeFilter]);

  useEffect(() => {
    if (!success) return;
    const timer = window.setTimeout(() => setSuccess(""), 5000);
    return () => window.clearTimeout(timer);
  }, [success]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((row) => {
      if (q && !row.full_name.toLowerCase().includes(q) && !row.email.toLowerCase().includes(q)) return false;
      if (roleFilter && row.role !== roleFilter) return false;
      if (departmentFilter && row.department_id !== departmentFilter) return false;
      if (activeFilter === "active" && !row.is_active) return false;
      if (activeFilter === "inactive" && row.is_active) return false;
      return true;
    });
  }, [items, search, roleFilter, departmentFilter, activeFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const stats = useMemo(() => ({
    total: items.length,
    active: items.filter((u) => u.is_active).length,
    admins: items.filter((u) => u.role === "IT_ADMIN" || u.role === "SUPER_ADMIN").length,
    viewers: items.filter((u) => u.role === "VIEWER").length,
  }), [items]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
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

  const openView = (row: AdminUser) => {
    setEditing(row);
    setForm(formFromUser(row));
    setDrawerMode("view");
    setSaving(false);
    setError("");
    setFieldErrors({});
    setDrawerOpen(true);
  };

  const openEditForm = (row: AdminUser) => {
    setEditing(row);
    setForm(formFromUser(row));
    setDrawerMode("edit");
    setSaving(false);
    setError("");
    setFieldErrors({});
    setDrawerOpen(true);
  };

  const save = async () => {
    if (!write || saving) return;
    const mode = editing ? "edit" : "create";
    const errors = validateUserForm(form, mode);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setError("Please fix the highlighted fields.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      if (editing) {
        const body: Record<string, unknown> = {
          fullName: form.fullName.trim(),
          role: form.role,
          isActive: form.isActive === "true",
          departmentId: form.departmentId || null,
        };
        if (form.password) body.password = form.password;
        await updateUser(editing.id, body);
        setSuccess(`Updated ${form.fullName.trim()}.`);
      } else {
        const body: Record<string, string> = {
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          password: form.password,
          role: form.role,
        };
        if (form.departmentId) body.departmentId = form.departmentId;
        await createUser(body);
        setSuccess(`Created account for ${form.fullName.trim()}.`);
      }
      closeDrawer();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const deactivate = async (row: AdminUser) => {
    if (!write) return;
    if (row.id === sessionUser.id) {
      setError("You cannot deactivate your own account.");
      return;
    }
    if (!confirm(`Deactivate ${row.full_name}? They will no longer be able to sign in.`)) return;
    try {
      await deleteUser(row.id);
      setSuccess(`Deactivated ${row.full_name}.`);
      setError("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Deactivate failed");
    }
  };

  const renderRowActions = (row: AdminUser) => (
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
        title="View user"
        aria-label="View user"
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
            className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-amber-300"
            title="Edit user"
            aria-label="Edit user"
          >
            <Pencil className="h-4 w-4" />
          </button>
          {row.is_active && row.id !== sessionUser.id && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                void deactivate(row);
              }}
              className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-red-400"
              title="Deactivate user"
              aria-label="Deactivate user"
            >
              <UserX className="h-4 w-4" />
            </button>
          )}
        </>
      )}
    </div>
  );


  return (
    <>
      <Header
        title="User Management"
        subtitle={write ? "Create and manage IT admin and viewer accounts" : "View user accounts (read-only)"}
      />
      <div className="page-content flex-1 overflow-y-auto">
        <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="card px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Total Users</p>
            <p className="mt-1 text-2xl font-semibold text-white">{stats.total}</p>
          </div>
          <div className="card px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Active</p>
            <p className="mt-1 text-2xl font-semibold text-emerald-300">{stats.active}</p>
          </div>
          <div className="card px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Admins</p>
            <p className="mt-1 text-2xl font-semibold text-sky-300">{stats.admins}</p>
          </div>
          <div className="card px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Viewers</p>
            <p className="mt-1 text-2xl font-semibold text-slate-300">{stats.viewers}</p>
          </div>
        </div>

        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <FilterSearch value={searchInput} onChange={setSearchInput} placeholder="Search name or email…" className="w-full sm:w-64" />
            <FilterSelect label="Role" value={roleFilter} onChange={setRoleFilter} className="w-full sm:w-auto">
              <option value="">All roles</option>
              {ROLES.map((role) => (
                <option key={role} value={role}>{labelEnum(role)}</option>
              ))}
            </FilterSelect>
            <FilterSelect label="Department" value={departmentFilter} onChange={setDepartmentFilter} className="w-full sm:w-auto">
              <option value="">All departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </FilterSelect>
            <FilterSelect label="Status" value={activeFilter} onChange={setActiveFilter} className="w-full sm:w-auto">
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </FilterSelect>
          </div>
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-lg border border-slate-700 bg-slate-800/60 p-0.5">
              <button
                type="button"
                onClick={() => changeViewMode("table")}
                aria-pressed={viewMode === "table"}
                className={`rounded-md p-1.5 ${viewMode === "table" ? "bg-sky-500/20 text-sky-300" : "text-slate-400"}`}
              >
                <List className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => changeViewMode("grid")}
                aria-pressed={viewMode === "grid"}
                className={`rounded-md p-1.5 ${viewMode === "grid" ? "bg-sky-500/20 text-sky-300" : "text-slate-400"}`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
            {write && (
              <button type="button" onClick={openCreate} className="inline-flex items-center gap-2 rounded-lg bg-[#2E7D9A] px-4 py-2 text-sm text-white">
                <Plus className="h-4 w-4" /> New User
              </button>
            )}
          </div>
        </div>

        {success && <p className="mb-3 text-sm text-emerald-400">{success}</p>}
        {error && !drawerOpen && <p className="mb-3 text-sm text-red-400">{error}</p>}

        {loading ? (
          viewMode === "grid" ? (
            <CardGridSkeleton count={8} />
          ) : (
            <div className="card overflow-hidden">
              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Department</th>
                      <th>Status</th>
                      <th>Joined</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    <TableSkeleton columns={7} />
                  </tbody>
                </table>
              </div>
            </div>
          )
        ) : filtered.length === 0 ? (
          <div className="card flex flex-col items-center justify-center px-6 py-16 text-center">
            <p className="text-lg font-medium text-slate-300">No users found</p>
            <p className="mt-1 text-sm text-slate-500">
              {items.length === 0 ? "Create the first user account to get started." : "Try adjusting your search or filters."}
            </p>
            {write && items.length === 0 && (
              <button type="button" onClick={openCreate} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#2E7D9A] px-4 py-2 text-sm text-white">
                <Plus className="h-4 w-4" /> New User
              </button>
            )}
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {paged.map((row) => (
              <div key={row.id} className="card p-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sky-500/15 text-sm font-semibold text-sky-300">
                    {userInitials(row.full_name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-white">{row.full_name}</p>
                    <p className="truncate text-sm text-slate-400">{row.email}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge value={row.role} />
                      <Badge value={row.is_active ? "ACTIVE" : "INACTIVE"} />
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      {row.department?.name ?? "No department"} · Joined {formatDate(row.created_at)}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex justify-end border-t border-slate-700/60 pt-3">
                  {renderRowActions(row)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Department</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th style={{ width: write ? 120 : 80 }} />
                  </tr>
                </thead>
                <tbody>
                  {paged.map((row) => (
                    <tr
                      key={row.id}
                      className="cursor-pointer"
                      onClick={() => (write ? openEditForm(row) : openView(row))}
                    >
                      <td className="font-medium text-white">{row.full_name}</td>
                      <td>{row.email}</td>
                      <td><Badge value={row.role} /></td>
                      <td>{row.department?.name ?? "—"}</td>
                      <td><Badge value={row.is_active ? "ACTIVE" : "INACTIVE"} /></td>
                      <td className="text-slate-400">{formatDate(row.created_at)}</td>
                      <td onClick={(e) => e.stopPropagation()}>{renderRowActions(row)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        )}
      </div>

      <Drawer
        open={drawerOpen}
        title={
          drawerMode === "create"
            ? "New User"
            : editing?.full_name ?? "User"
        }
        subtitle={
          drawerMode === "create"
            ? "Create a new admin or viewer account"
            : drawerMode === "edit"
              ? "Update account details and permissions"
              : "Account summary"
        }
        onClose={closeDrawer}
        banner={
          error && drawerOpen ? (
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
                className="inline-flex h-10 min-w-[9rem] shrink-0 items-center justify-center gap-2 rounded-lg bg-[#2E7D9A] px-4 text-sm font-medium leading-none text-white hover:bg-[#256b85] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {drawerMode === "create" ? "Create User" : "Save Changes"}
              </button>
            </div>
          ) : undefined
        }
      >
        {drawerMode === "view" && editing ? (
          <UserDetailView
            user={editing}
            canEdit={write}
            onEdit={() => setDrawerMode("edit")}
          />
        ) : (
          <UserForm
            mode={drawerMode === "create" ? "create" : "edit"}
            form={form}
            onChange={setForm}
            departments={departments}
            actorRole={sessionUser.role}
            sessionUserId={sessionUser.id}
            editingId={editing?.id}
            fieldErrors={fieldErrors}
          />
        )}
      </Drawer>
    </>
  );
}
