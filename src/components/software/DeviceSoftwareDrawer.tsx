"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/Badge";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Drawer, Field, inputClass, selectClass } from "@/components/Drawer";
import { Skeleton } from "@/components/TableSkeleton";
import {
  addSoftwareInstallation,
  fetchSoftwareCatalog,
  fetchSoftwareDevice,
  removeSoftwareInstallation,
  updateSoftwareInstallation,
  type SoftwareCatalogItem,
  type SoftwareChecklistItem,
  type SoftwareDeviceDetail,
  type SoftwareInstallStatus,
} from "@/lib/api/software";

const STATUS_OPTIONS: { value: SoftwareInstallStatus; label: string; active: string }[] = [
  { value: "INSTALLED", label: "Installed", active: "bg-emerald-600 text-white" },
  { value: "MISSING", label: "Missing", active: "bg-amber-600 text-white" },
  { value: "NOT_NEEDED", label: "Not needed", active: "bg-slate-600 text-white" },
];

export function DeviceSoftwareDrawer({
  assetId,
  write,
  onClose,
  onChanged,
}: {
  assetId: string | null;
  write: boolean;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [detail, setDetail] = useState<SoftwareDeviceDetail | null>(null);
  const [catalog, setCatalog] = useState<SoftwareCatalogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});
  const [selectedId, setSelectedId] = useState("");
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<SoftwareChecklistItem | null>(null);
  const [removing, setRemoving] = useState(false);

  const load = useCallback(async (id: string) => {
    setLoading(true);
    setError("");
    try {
      const [device, items] = await Promise.all([fetchSoftwareDevice(id), fetchSoftwareCatalog()]);
      setDetail(device);
      setCatalog(items);
      setNotesDraft(
        Object.fromEntries(device.items.map((item) => [item.software_id, item.notes ?? ""])),
      );
    } catch (e) {
      setDetail(null);
      setError(e instanceof Error ? e.message : "Failed to load software checklist");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!assetId) {
      setDetail(null);
      setError("");
      setSelectedId("");
      setNewName("");
      return;
    }
    void load(assetId);
  }, [assetId, load]);

  const available = useMemo(() => {
    const onDevice = new Set(detail?.items.map((item) => item.software_id) ?? []);
    return catalog.filter((item) => item.kind === "ADDITIONAL" && !onDevice.has(item.id));
  }, [catalog, detail]);

  const applyDetail = (next: SoftwareDeviceDetail, savedId?: string) => {
    setDetail(next);
    setNotesDraft((prev) => {
      const draft = { ...prev };
      for (const item of next.items) {
        if (item.software_id === savedId || !(item.software_id in draft)) {
          draft[item.software_id] = item.notes ?? "";
        }
      }
      for (const id of Object.keys(draft)) {
        if (!next.items.some((item) => item.software_id === id)) delete draft[id];
      }
      return draft;
    });
    onChanged();
  };

  const saveStatus = async (item: SoftwareChecklistItem, status: SoftwareInstallStatus) => {
    if (!assetId || !write || item.status === status) return;
    setSavingId(item.software_id);
    setError("");
    try {
      const next = await updateSoftwareInstallation(assetId, item.software_id, {
        status,
        notes: notesDraft[item.software_id] ?? item.notes ?? "",
      });
      applyDetail(next, item.software_id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update status");
    } finally {
      setSavingId(null);
    }
  };

  const saveNotes = async (item: SoftwareChecklistItem) => {
    if (!assetId || !write) return;
    const draft = (notesDraft[item.software_id] ?? "").trim();
    const current = (item.notes ?? "").trim();
    if (draft === current) return;
    setSavingId(item.software_id);
    setError("");
    try {
      const next = await updateSoftwareInstallation(assetId, item.software_id, {
        status: item.status,
        notes: draft,
      });
      applyDetail(next, item.software_id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save note");
    } finally {
      setSavingId(null);
    }
  };

  const addSoftware = async () => {
    if (!assetId || !write || adding) return;
    const name = newName.trim();
    if (!name && !selectedId) {
      setError("Choose software or enter a new name.");
      return;
    }
    setAdding(true);
    setError("");
    try {
      const next = await addSoftwareInstallation(assetId, name ? { name } : { softwareId: selectedId });
      setNewName("");
      setSelectedId("");
      applyDetail(next);
      const items = await fetchSoftwareCatalog();
      setCatalog(items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add software");
    } finally {
      setAdding(false);
    }
  };

  const confirmRemove = async () => {
    if (!assetId || !removeTarget || removing) return;
    setRemoving(true);
    setError("");
    try {
      const next = await removeSoftwareInstallation(assetId, removeTarget.software_id);
      setRemoveTarget(null);
      applyDetail(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to remove software");
    } finally {
      setRemoving(false);
    }
  };

  const asset = detail?.asset;
  const standards = detail?.items.filter((item) => item.kind === "STANDARD") ?? [];
  const extras = detail?.items.filter((item) => item.kind === "ADDITIONAL") ?? [];
  const met = standards.filter((item) => item.status !== "MISSING").length;

  return (
    <>
      <Drawer
        open={Boolean(assetId)}
        wide
        title={asset ? asset.computer_name : "Software checklist"}
        subtitle={
          asset
            ? [asset.asset_code, asset.assigned_to, asset.department].filter(Boolean).join(" · ")
            : "Standard software and extras for this computer"
        }
        onClose={onClose}
      >
        {loading && !detail ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-slate-700/70 bg-slate-900/40 p-3">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="mt-3 h-8 w-56" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {error && (
              <p className="rounded-lg border border-red-900/50 bg-red-950/40 px-3 py-2 text-sm text-red-300">
                {error}
              </p>
            )}
            {asset && (
              <div
                data-tour="sw-device-summary"
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-700/70 bg-slate-900/40 px-4 py-3"
              >
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Checklist</p>
                  <p className="mt-1 text-sm text-slate-200">
                    {met} of {standards.length} standard
                    <span className="text-slate-400"> · {extras.length} additional</span>
                    {asset.os ? <span className="text-slate-500"> · OS {asset.os}</span> : null}
                  </p>
                </div>
                <Badge value={met === standards.length ? "COMPLETE" : "MISSING"} />
              </div>
            )}

            <ChecklistGroup
              dataTour="sw-device-standard"
              title="Standard"
              hint="Required on every PC and laptop. Mark Not needed when it does not apply."
              items={standards}
              write={write}
              savingId={savingId}
              notesDraft={notesDraft}
              onNotes={(id, value) => setNotesDraft((prev) => ({ ...prev, [id]: value }))}
              onStatus={(item, status) => void saveStatus(item, status)}
              onNotesBlur={(item) => void saveNotes(item)}
            />

            <ChecklistGroup
              dataTour="sw-device-extra"
              title="Additional"
              hint="Only on this computer. AutoCAD and other department tools go here."
              items={extras}
              write={write}
              savingId={savingId}
              notesDraft={notesDraft}
              onNotes={(id, value) => setNotesDraft((prev) => ({ ...prev, [id]: value }))}
              onStatus={(item, status) => void saveStatus(item, status)}
              onNotesBlur={(item) => void saveNotes(item)}
              onRemove={write ? setRemoveTarget : undefined}
            />

            {write && (
              <div data-tour="sw-device-add" className="rounded-xl border border-slate-700/70 bg-slate-900/30 p-4">
                <p className="text-sm font-medium text-white">Add software to this computer</p>
                <p className="mt-1 text-xs text-slate-500">
                  Pick an existing additional app, or type a new name to add it to the catalog and this PC.
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Field label="From catalog">
                    <select
                      value={selectedId}
                      onChange={(e) => setSelectedId(e.target.value)}
                      className={selectClass}
                      disabled={Boolean(newName.trim())}
                    >
                      <option value="">Select software</option>
                      {available.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="New software">
                    <input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="e.g. AutoCAD"
                      className={inputClass}
                    />
                  </Field>
                </div>
                <button
                  type="button"
                  onClick={() => void addSoftware()}
                  disabled={adding}
                  className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[#2E7D9A] px-3 py-2 text-sm font-medium text-white hover:bg-[#256b85] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Add to this PC
                </button>
              </div>
            )}
          </div>
        )}
      </Drawer>

      <ConfirmDialog
        open={removeTarget !== null}
        title="Remove software from this PC?"
        message={
          removeTarget
            ? `${removeTarget.name} will be removed from this computer only. It stays in the catalog for other users.`
            : ""
        }
        confirmLabel="Remove"
        loadingLabel="Removing..."
        loading={removing}
        onCancel={() => {
          if (!removing) setRemoveTarget(null);
        }}
        onConfirm={() => void confirmRemove()}
      />
    </>
  );
}

function ChecklistGroup({
  dataTour,
  title,
  hint,
  items,
  write,
  savingId,
  notesDraft,
  onNotes,
  onStatus,
  onNotesBlur,
  onRemove,
}: {
  dataTour?: string;
  title: string;
  hint: string;
  items: SoftwareChecklistItem[];
  write: boolean;
  savingId: string | null;
  notesDraft: Record<string, string>;
  onNotes: (id: string, value: string) => void;
  onStatus: (item: SoftwareChecklistItem, status: SoftwareInstallStatus) => void;
  onNotesBlur: (item: SoftwareChecklistItem) => void;
  onRemove?: (item: SoftwareChecklistItem) => void;
}) {
  return (
    <section data-tour={dataTour}>
      <div className="mb-2">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <p className="text-xs text-slate-500">{hint}</p>
      </div>
      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-700 px-3 py-4 text-sm text-slate-500">
          None yet.
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => {
            const busy = savingId === item.software_id;
            return (
              <li key={item.software_id} className="rounded-xl border border-slate-700/70 bg-slate-900/40 p-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-white">{item.name}</p>
                      {busy && <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />}
                    </div>
                    {item.catalog_notes && (
                      <p className="mt-0.5 text-xs text-slate-500">{item.catalog_notes}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="inline-flex rounded-lg border border-slate-600/80 bg-slate-950/40 p-0.5" role="group" aria-label={`${item.name} status`}>
                      {STATUS_OPTIONS.map((opt) => {
                        const active = item.status === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            disabled={!write || busy}
                            aria-pressed={active}
                            onClick={() => onStatus(item, opt.value)}
                            className={`rounded-md px-2.5 py-1 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
                              active ? opt.active : "text-slate-400 hover:text-slate-200"
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                    {onRemove && item.removable && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => onRemove(item)}
                        className="rounded-lg p-1.5 text-red-400 hover:bg-red-950/40 hover:text-red-300 disabled:opacity-60"
                        title={`Remove ${item.name} from this PC`}
                        aria-label={`Remove ${item.name} from this PC`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
                <input
                  value={notesDraft[item.software_id] ?? ""}
                  onChange={(e) => onNotes(item.software_id, e.target.value)}
                  onBlur={() => onNotesBlur(item)}
                  disabled={!write || busy}
                  placeholder="Note, optional — e.g. Adobe Acrobat, HP LaserJet driver"
                  className={`${inputClass} mt-3`}
                />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
