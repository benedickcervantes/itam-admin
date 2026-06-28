"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Drawer, Field, inputClass, selectClass } from "@/components/Drawer";
import { Header } from "@/components/Header";
import { fetchDepartments } from "@/lib/api/departments";
import { createUser, deleteUser, fetchUsers, updateUser } from "@/lib/api/users";
import { canWrite } from "@/lib/auth/permissions";
import { getStoredUser } from "@/lib/auth/session";
import { labelEnum } from "@/lib/labels";
import type { AdminUser, Department } from "@/lib/types";

export default function UsersPage() {
  const write = canWrite(getStoredUser());
  const [items, setItems] = useState<AdminUser[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [form, setForm] = useState<Record<string, string>>({ role: "VIEWER", fullName: "", email: "", password: "" });
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setItems(await fetchUsers());
  }, []);

  useEffect(() => {
    void load();
    fetchDepartments().then(setDepartments);
  }, [load]);

  const save = async () => {
    if (!write) return;
    setError("");
    try {
      if (editing) {
        const body: Record<string, string> = {
          fullName: form.fullName,
          role: form.role,
        };
        if (form.departmentId) body.departmentId = form.departmentId;
        if (form.password) body.password = form.password;
        await updateUser(editing.id, body);
      } else {
        const body: Record<string, string> = {
          fullName: form.fullName,
          email: form.email,
          password: form.password,
          role: form.role,
        };
        if (form.departmentId) body.departmentId = form.departmentId;
        await createUser(body);
      }
      setOpen(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    }
  };

  const openUser = (row: AdminUser) => {
    setEditing(row);
    setForm({ fullName: row.full_name, email: row.email, role: row.role, departmentId: row.department_id ?? "", password: "" });
    setOpen(true);
  };

  return (
    <>
      <Header title="Users" subtitle={write ? "Manage IT admins and viewer accounts" : "View user accounts (read-only)"} />
      <div className="page-content flex-1 overflow-y-auto">
        {write && (
          <button type="button" onClick={() => { setEditing(null); setForm({ role: "VIEWER", fullName: "", email: "", password: "" }); setOpen(true); }} className="mb-4 inline-flex items-center gap-2 rounded-lg bg-[#2E7D9A] px-4 py-2 text-sm text-white">
            <Plus className="h-4 w-4" /> New User
          </button>
        )}
        <div className="card overflow-hidden">
          <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Department</th>
                <th>Active</th>
                {write && <th />}
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.id} className={write ? "cursor-pointer" : ""} onClick={() => write && openUser(row)}>
                  <td>{row.full_name}</td>
                  <td>{row.email}</td>
                  <td>{labelEnum(row.role)}</td>
                  <td>{row.department?.name ?? "—"}</td>
                  <td>{row.is_active ? "Yes" : "No"}</td>
                  {write && (
                    <td onClick={(e) => e.stopPropagation()}>
                      <button type="button" onClick={() => void deleteUser(row.id).then(load)} className="text-red-400"><Trash2 className="h-4 w-4" /></button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </div>
      <Drawer open={open} title={editing ? editing.full_name : "New User"} onClose={() => setOpen(false)}>
        <div className="space-y-3">
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Field label="Full Name" required><input className={inputClass} value={form.fullName ?? ""} onChange={(e) => setForm({ ...form, fullName: e.target.value })} readOnly={!write} /></Field>
          <Field label="Email" required><input type="email" className={inputClass} value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} readOnly={!write || !!editing} /></Field>
          {write && (
            <Field label={editing ? "New Password (optional)" : "Password"} required={!editing}>
              <input type="password" className={inputClass} value={form.password ?? ""} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </Field>
          )}
          <Field label="Role">
            <select className={selectClass} value={form.role ?? "VIEWER"} onChange={(e) => setForm({ ...form, role: e.target.value })} disabled={!write}>
              <option value="IT_ADMIN">IT Admin</option>
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="VIEWER">Viewer</option>
            </select>
          </Field>
          <Field label="Department">
            <select className={selectClass} value={form.departmentId ?? ""} onChange={(e) => setForm({ ...form, departmentId: e.target.value })} disabled={!write}>
              <option value="">—</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </Field>
          {write && (
            <button type="button" onClick={() => void save()} className="w-full rounded-lg bg-[#2E7D9A] py-2 text-white">Save</button>
          )}
        </div>
      </Drawer>
    </>
  );
}
