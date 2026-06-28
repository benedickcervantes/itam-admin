"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Drawer, Field, inputClass } from "@/components/Drawer";
import { Header } from "@/components/Header";
import { createAssignment, deleteAssignment, fetchAssignments, updateAssignment } from "@/lib/api/assignments";
import { fetchAssets } from "@/lib/api/assets";
import { canWrite } from "@/lib/auth/permissions";
import { getStoredUser } from "@/lib/auth/session";
import type { Assignment, Asset } from "@/lib/types";

export default function AssignmentsPage() {
  const write = canWrite(getStoredUser());
  const [items, setItems] = useState<Assignment[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Assignment | null>(null);
  const [form, setForm] = useState<Record<string, string>>({ assetId: "", assignedTo: "", assignedDate: new Date().toISOString().slice(0, 10) });

  const load = useCallback(async () => {
    setItems((await fetchAssignments()).items);
  }, []);

  useEffect(() => {
    void load();
    fetchAssets({ limit: 200 }).then((r) => setAssets(r.items));
  }, [load]);

  const save = async () => {
    const body = { ...form };
    Object.keys(body).forEach((k) => body[k] === "" && delete body[k]);
    if (editing) await updateAssignment(editing.id, body);
    else await createAssignment(body);
    setOpen(false);
    await load();
  };

  return (
    <>
      <Header title="Assignment History" subtitle="Device assignment timeline by employee" />
      <div className="page-content flex-1 overflow-y-auto">
        {write && (
          <button type="button" onClick={() => { setEditing(null); setForm({ assetId: "", assignedTo: "", assignedDate: new Date().toISOString().slice(0, 10) }); setOpen(true); }} className="mb-4 inline-flex items-center gap-2 rounded-lg bg-[#2E7D9A] px-4 py-2 text-sm text-white">
            <Plus className="h-4 w-4" /> New Assignment
          </button>
        )}
        <div className="card overflow-hidden">
          <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Record ID</th>
                <th>Asset</th>
                <th>Assigned To</th>
                <th>Assigned Date</th>
                <th>Returned</th>
                {write && <th />}
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.id} className="cursor-pointer" onClick={() => { setEditing(row); setForm({ assetId: row.asset_id, assignedTo: row.assigned_to, assignedDate: row.assigned_date.slice(0, 10), returnedDate: row.returned_date?.slice(0, 10) ?? "", notes: row.notes ?? "" }); setOpen(true); }}>
                  <td className="font-mono text-[#2E7D9A]">{row.record_code}</td>
                  <td>{row.asset?.computer_name ?? row.asset?.asset_code}</td>
                  <td>{row.assigned_to}</td>
                  <td>{row.assigned_date.slice(0, 10)}</td>
                  <td>{row.returned_date?.slice(0, 10) ?? "—"}</td>
                  {write && (
                    <td onClick={(e) => e.stopPropagation()}>
                      <button type="button" onClick={() => void deleteAssignment(row.id).then(load)} className="text-red-400"><Trash2 className="h-4 w-4" /></button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </div>
      <Drawer open={open} title={editing ? editing.record_code : "New Assignment"} onClose={() => setOpen(false)}>
        <div className="space-y-3">
          <Field label="Asset" required>
            <select className={inputClass} value={form.assetId} onChange={(e) => setForm({ ...form, assetId: e.target.value })} disabled={!write}>
              <option value="">Select asset...</option>
              {assets.map((a) => <option key={a.id} value={a.id}>{a.asset_code} — {a.computer_name}</option>)}
            </select>
          </Field>
          <Field label="Assigned To" required><input className={inputClass} value={form.assignedTo ?? ""} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })} readOnly={!write} /></Field>
          <Field label="Assigned Date"><input type="date" className={inputClass} value={form.assignedDate ?? ""} onChange={(e) => setForm({ ...form, assignedDate: e.target.value })} readOnly={!write} /></Field>
          <Field label="Returned Date"><input type="date" className={inputClass} value={form.returnedDate ?? ""} onChange={(e) => setForm({ ...form, returnedDate: e.target.value })} readOnly={!write} /></Field>
          <Field label="Notes"><textarea className={inputClass} rows={3} value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} readOnly={!write} /></Field>
          {write && <button type="button" onClick={() => void save()} className="w-full rounded-lg bg-[#2E7D9A] py-2 text-white">Save</button>}
        </div>
      </Drawer>
    </>
  );
}
