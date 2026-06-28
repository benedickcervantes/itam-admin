"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/Badge";
import { Drawer, Field, inputClass, selectClass } from "@/components/Drawer";
import { Header } from "@/components/Header";
import { createMaintenance, deleteMaintenance, fetchMaintenance, updateMaintenance } from "@/lib/api/maintenance";
import { canWrite } from "@/lib/auth/permissions";
import { REFERENCE_DATA } from "@/lib/reference-data";
import { getStoredUser } from "@/lib/auth/session";
import type { MaintenanceRecord } from "@/lib/types";

export default function MaintenancePage() {
  const write = canWrite(getStoredUser());
  const [items, setItems] = useState<MaintenanceRecord[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MaintenanceRecord | null>(null);
  const [form, setForm] = useState<Record<string, string>>({ issue: "", status: "OPEN" });

  const load = useCallback(async () => {
    setItems((await fetchMaintenance()).items);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    const body = { ...form };
    Object.keys(body).forEach((k) => body[k] === "" && delete body[k]);
    if (editing) await updateMaintenance(editing.id, body);
    else await createMaintenance(body);
    setOpen(false);
    await load();
  };

  return (
    <>
      <Header title="Maintenance Log" subtitle="Repairs and actions (Open → In Progress → Completed)" />
      <div className="page-content flex-1 overflow-y-auto">
        {write && (
          <button type="button" onClick={() => { setEditing(null); setForm({ issue: "", status: "OPEN" }); setOpen(true); }} className="mb-4 inline-flex items-center gap-2 rounded-lg bg-[#2E7D9A] px-4 py-2 text-sm text-white">
            <Plus className="h-4 w-4" /> New Record
          </button>
        )}
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
                {write && <th />}
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.id} className="cursor-pointer" onClick={() => { setEditing(row); setForm({ computerName: row.computer_name ?? "", employee: row.employee ?? "", issue: row.issue, actionTaken: row.action_taken ?? "", status: row.status ?? "OPEN", performedBy: row.performed_by ?? "", notes: row.notes ?? "" }); setOpen(true); }}>
                  <td className="font-mono text-[#2E7D9A]">{row.record_code}</td>
                  <td>{row.computer_name ?? "—"}</td>
                  <td>{row.employee ?? "—"}</td>
                  <td>{row.issue}</td>
                  <td><Badge value={row.status} /></td>
                  {write && (
                    <td onClick={(e) => e.stopPropagation()}>
                      <button type="button" onClick={() => void deleteMaintenance(row.id).then(load)} className="text-red-400"><Trash2 className="h-4 w-4" /></button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </div>
      <Drawer open={open} title={editing ? editing.record_code : "New Maintenance"} onClose={() => setOpen(false)}>
        <div className="space-y-3">
          <Field label="Computer Name"><input className={inputClass} value={form.computerName ?? ""} onChange={(e) => setForm({ ...form, computerName: e.target.value })} readOnly={!write} /></Field>
          <Field label="Employee"><input className={inputClass} value={form.employee ?? ""} onChange={(e) => setForm({ ...form, employee: e.target.value })} readOnly={!write} /></Field>
          <Field label="Issue" required><textarea className={inputClass} rows={3} value={form.issue ?? ""} onChange={(e) => setForm({ ...form, issue: e.target.value })} readOnly={!write} /></Field>
          <Field label="Action Taken"><textarea className={inputClass} rows={2} value={form.actionTaken ?? ""} onChange={(e) => setForm({ ...form, actionTaken: e.target.value })} readOnly={!write} /></Field>
          <Field label="Status">
            <select className={selectClass} value={form.status ?? "OPEN"} onChange={(e) => setForm({ ...form, status: e.target.value })} disabled={!write}>
              {REFERENCE_DATA.maintenanceStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Performed By"><input className={inputClass} value={form.performedBy ?? ""} onChange={(e) => setForm({ ...form, performedBy: e.target.value })} readOnly={!write} /></Field>
          {write && <button type="button" onClick={() => void save()} className="w-full rounded-lg bg-[#2E7D9A] py-2 text-white">Save</button>}
        </div>
      </Drawer>
    </>
  );
}
