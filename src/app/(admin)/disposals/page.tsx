"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Drawer, Field, inputClass, selectClass } from "@/components/Drawer";
import { Header } from "@/components/Header";
import { fetchAssets } from "@/lib/api/assets";
import { createDisposal, deleteDisposal, fetchDisposals, updateDisposal } from "@/lib/api/disposals";
import { canWrite } from "@/lib/auth/permissions";
import { REFERENCE_DATA } from "@/lib/reference-data";
import { getStoredUser } from "@/lib/auth/session";
import type { Asset, DisposalRecord } from "@/lib/types";

export default function DisposalsPage() {
  const write = canWrite(getStoredUser());
  const [items, setItems] = useState<DisposalRecord[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<DisposalRecord | null>(null);
  const [form, setForm] = useState<Record<string, string>>({ assetId: "", disposalDate: new Date().toISOString().slice(0, 10), disposalReason: "" });

  const load = useCallback(async () => {
    setItems((await fetchDisposals()).items);
  }, []);

  useEffect(() => {
    void load();
    fetchAssets({ limit: 200 }).then((r) => setAssets(r.items));
  }, [load]);

  const save = async () => {
    const body = { ...form };
    Object.keys(body).forEach((k) => body[k] === "" && delete body[k]);
    if (editing) await updateDisposal(editing.id, body);
    else await createDisposal(body);
    setOpen(false);
    await load();
  };

  return (
    <>
      <Header title="Disposal Log" subtitle="Retired and disposed assets with certificate tracking" />
      <div className="page-content flex-1 overflow-y-auto">
        {write && (
          <button type="button" onClick={() => { setEditing(null); setForm({ assetId: "", disposalDate: new Date().toISOString().slice(0, 10), disposalReason: "" }); setOpen(true); }} className="mb-4 inline-flex items-center gap-2 rounded-lg bg-[#2E7D9A] px-4 py-2 text-sm text-white">
            <Plus className="h-4 w-4" /> New Disposal
          </button>
        )}
        <div className="card overflow-hidden">
          <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Record ID</th>
                <th>Asset</th>
                <th>Date</th>
                <th>Reason</th>
                <th>Method</th>
                {write && <th />}
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.id} className="cursor-pointer" onClick={() => { setEditing(row); setForm({ assetId: row.asset_id, disposalDate: row.disposal_date.slice(0, 10), disposalReason: row.disposal_reason, disposalMethod: row.disposal_method ?? "", certificateDocNo: row.certificate_doc_no ?? "", approvedBy: row.approved_by ?? "" }); setOpen(true); }}>
                  <td className="font-mono text-[#2E7D9A]">{row.record_code}</td>
                  <td>{row.asset?.computer_name ?? row.asset?.asset_code}</td>
                  <td>{row.disposal_date.slice(0, 10)}</td>
                  <td>{row.disposal_reason}</td>
                  <td>{row.disposal_method ?? "—"}</td>
                  {write && (
                    <td onClick={(e) => e.stopPropagation()}>
                      <button type="button" onClick={() => void deleteDisposal(row.id).then(load)} className="text-red-400"><Trash2 className="h-4 w-4" /></button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </div>
      <Drawer open={open} title={editing ? editing.record_code : "New Disposal"} onClose={() => setOpen(false)}>
        <div className="space-y-3">
          <Field label="Asset" required>
            <select className={inputClass} value={form.assetId} onChange={(e) => setForm({ ...form, assetId: e.target.value })} disabled={!write || !!editing}>
              <option value="">Select asset...</option>
              {assets.map((a) => <option key={a.id} value={a.id}>{a.asset_code} — {a.computer_name}</option>)}
            </select>
          </Field>
          <Field label="Disposal Date" required><input type="date" className={inputClass} value={form.disposalDate ?? ""} onChange={(e) => setForm({ ...form, disposalDate: e.target.value })} readOnly={!write} /></Field>
          <Field label="Reason" required><textarea className={inputClass} rows={2} value={form.disposalReason ?? ""} onChange={(e) => setForm({ ...form, disposalReason: e.target.value })} readOnly={!write} /></Field>
          <Field label="Method">
            <select className={selectClass} value={form.disposalMethod ?? ""} onChange={(e) => setForm({ ...form, disposalMethod: e.target.value })} disabled={!write}>
              <option value="">—</option>
              {REFERENCE_DATA.disposalMethods.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Certificate / Doc No."><input className={inputClass} value={form.certificateDocNo ?? ""} onChange={(e) => setForm({ ...form, certificateDocNo: e.target.value })} readOnly={!write} /></Field>
          {write && <button type="button" onClick={() => void save()} className="w-full rounded-lg bg-[#2E7D9A] py-2 text-white">Save</button>}
        </div>
      </Drawer>
    </>
  );
}
