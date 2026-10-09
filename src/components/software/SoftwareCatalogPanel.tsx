"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/Badge";
import { TableSkeleton } from "@/components/TableSkeleton";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Drawer, Field, inputClass } from "@/components/Drawer";
import { TourEmptyCta } from "@/components/TourNudge";
import { verifyPassword } from "@/lib/api/auth";
import {
  createSoftware,
  deleteSoftware,
  fetchSoftwareCatalog,
  updateSoftware,
  type SoftwareCatalogItem,
  type SoftwareKind,
} from "@/lib/api/software";

type FormState = { name: string; kind: SoftwareKind; notes: string };

const EMPTY_FORM: FormState = { name: "", kind: "ADDITIONAL", notes: "" };

export function SoftwareCatalogPanel({
  write,
  tourForm = false,
  onStartTour,
}: {
  write: boolean;
  /** When true, the How it works tour is showing the add-software form. */
  tourForm?: boolean;
  onStartTour?: () => void;
}) {
  const [items, setItems] = useState<SoftwareCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<SoftwareCatalogItem | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SoftwareCatalogItem | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const tourOpenedForm = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setItems(await fetchSoftwareCatalog());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load software catalog");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (tourForm) {
      if (!tourOpenedForm.current && !drawerOpen) {
        setEditing(null);
        setForm(EMPTY_FORM);
        setError("");
        tourOpenedForm.current = true;
        setDrawerOpen(true);
      }
      return;
    }
    if (tourOpenedForm.current) {
      setDrawerOpen(false);
      tourOpenedForm.current = false;
    }
  }, [tourForm, drawerOpen]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError("");
    setDrawerOpen(true);
  };

  const openEdit = (item: SoftwareCatalogItem) => {
    setEditing(item);
    setForm({ name: item.name, kind: item.kind, notes: item.notes ?? "" });
    setError("");
    setDrawerOpen(true);
  };

  const save = async () => {
    const name = form.name.trim();
    if (!name) {
      setError("Software name is required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (editing) {
        await updateSoftware(editing.id, { name, kind: form.kind, notes: form.notes.trim() });
        setSuccess(`Updated ${name}.`);
      } else {
        await createSoftware({ name, kind: form.kind, notes: form.notes.trim() || undefined });
        setSuccess(`Added ${name}.`);
      }
      setDrawerOpen(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save software");
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
      await deleteSoftware(deleteTarget.id);
      setSuccess(`Deleted ${deleteTarget.name}.`);
      setDeleteTarget(null);
      await load();
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <p className="max-w-2xl text-sm text-slate-400">
          Standard software is required on every PC and laptop. Additional software, such as AutoCAD, is added only to the users who need it. Renaming updates every checklist. Deleting removes it from every computer.
        </p>
        {write && (
          <button
            type="button"
            data-tour="sw-catalog-new"
            onClick={openCreate}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[#2E7D9A] px-4 py-2 text-sm font-medium text-white hover:bg-[#256b85]"
          >
            <Plus className="h-4 w-4" />
            Add software
          </button>
        )}
      </div>

      {success && (
        <p className="rounded-lg border border-emerald-900/40 bg-emerald-950/30 px-3 py-2 text-sm text-emerald-300">
          {success}
        </p>
      )}
      {error && !drawerOpen && (
        <p className="rounded-lg border border-red-900/50 bg-red-950/40 px-3 py-2 text-sm text-red-300">{error}</p>
      )}

      <div className="card overflow-hidden" data-tour="sw-catalog-list">
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Software</th>
                <th>Type</th>
                <th>Notes</th>
                <th style={{ textAlign: "right" }}>On computers</th>
                {write && <th />}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeleton columns={write ? 5 : 4} />
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={write ? 5 : 4} className="py-8 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-1">
                      <span>No software yet</span>
                      {onStartTour && <TourEmptyCta onStart={onStartTour} />}
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id}>
                    <td className="font-medium text-white">{item.name}</td>
                    <td>
                      <Badge value={item.kind} />
                    </td>
                    <td className="cell-wrap text-slate-400">{item.notes?.trim() || "—"}</td>
                    <td style={{ textAlign: "right" }} className="text-slate-300">
                      {item.kind === "STANDARD" ? "Every PC" : item.assignment_count}
                    </td>
                    {write && (
                      <td>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEdit(item)}
                            className="rounded p-1 text-slate-300 hover:bg-slate-800 hover:text-white"
                            title="Edit software"
                            aria-label={`Edit ${item.name}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteError("");
                              setDeleteTarget(item);
                            }}
                            className="rounded p-1 text-red-400 hover:bg-red-950/40 hover:text-red-300"
                            title="Delete software"
                            aria-label={`Delete ${item.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Drawer
        open={drawerOpen}
        title={editing ? `Edit ${editing.name}` : "Add software"}
        subtitle={editing ? "Changes apply everywhere this software is used" : "Add it to the company catalog"}
        onClose={() => {
          if (!saving) setDrawerOpen(false);
        }}
        banner={
          error && drawerOpen ? (
            <p className="rounded-lg border border-red-900/50 bg-red-950/40 px-3 py-2 text-sm text-red-300">{error}</p>
          ) : undefined
        }
        footer={
          <div className="ml-auto flex items-center justify-end gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => setDrawerOpen(false)}
              className="inline-flex h-10 w-[9rem] items-center justify-center rounded-lg border border-slate-600 px-3 text-sm font-medium text-slate-200 hover:bg-slate-800 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              data-tour="sw-catalog-form-save"
              disabled={saving}
              onClick={() => void save()}
              className="inline-flex h-10 w-[9rem] items-center justify-center gap-1.5 rounded-lg bg-[#2E7D9A] px-3 text-sm font-medium text-white hover:bg-[#256b85] disabled:opacity-60"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? "Saving..." : editing ? "Save" : "Add"}
            </button>
          </div>
        }
      >
        <div className="space-y-4" data-tour="sw-catalog-form">
          <Field label="Name" required>
            <input
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. AutoCAD"
              className={inputClass}
            />
          </Field>
          <div data-tour="sw-catalog-form-type">
          <Field label="Type" required>
            <div className="inline-flex rounded-lg border border-slate-600/80 bg-slate-900/50 p-0.5" role="group" aria-label="Software type">
              {(
                [
                  ["STANDARD", "Standard"],
                  ["ADDITIONAL", "Additional"],
                ] as const
              ).map(([value, label]) => {
                const active = form.kind === value;
                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setForm((prev) => ({ ...prev, kind: value }))}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                      active ? "bg-[#2E7D9A] text-white" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-slate-500">
              {form.kind === "STANDARD"
                ? "Shows on every PC and laptop as Missing until IT marks it."
                : "Stays off computers until you add it to a specific user."}
            </p>
          </Field>
          </div>
          <Field label="Notes">
            <textarea
              value={form.notes}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              rows={3}
              placeholder="Optional. Example: Adobe Acrobat, or the approved printer driver."
              className={inputClass}
            />
          </Field>
        </div>
      </Drawer>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete software?"
        message={
          deleteTarget
            ? `Delete ${deleteTarget.name} from the catalog? It will be removed from every computer checklist. This cannot be undone.`
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
    </div>
  );
}
