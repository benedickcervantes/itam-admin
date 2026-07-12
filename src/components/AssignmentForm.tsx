"use client";

import { Calendar, FileText, History, Monitor, RotateCcw, User } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/Badge";
import { Field, inputClass, selectClass } from "@/components/Drawer";
import { todayIso, type AssignmentFormMode } from "@/lib/assignment-form";
import type { Asset, Department } from "@/lib/types";

function FormSection({
  id,
  title,
  description,
  icon: Icon,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-4 rounded-xl border border-slate-700/60 bg-slate-900/30">
      <div className="flex items-start gap-3 border-b border-slate-700/60 px-4 py-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#2E7D9A]/15 text-[#2E7D9A]">
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          {description && <p className="mt-0.5 text-xs text-slate-400">{description}</p>}
        </div>
      </div>
      <div className="space-y-4 p-4">{children}</div>
    </section>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-red-400">{message}</p>;
}

function AssetPreview({ asset }: { asset: Asset }) {
  return (
    <div className="rounded-lg border border-slate-700/60 bg-slate-950/40 px-3 py-2.5">
      <p className="font-mono text-xs font-medium text-[#2E7D9A]">{asset.asset_code}</p>
      <p className="mt-0.5 text-sm font-medium text-white">{asset.computer_name}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {asset.status && <Badge value={asset.status} compact />}
        {asset.department?.name && (
          <span className="text-xs text-slate-400">{asset.department.name}</span>
        )}
        {asset.assigned_to && (
          <span className="text-xs text-slate-500">Currently: {asset.assigned_to}</span>
        )}
      </div>
    </div>
  );
}

export function AssignmentForm({
  mode,
  form,
  onChange,
  assets,
  departments,
  fieldErrors = {},
  readOnly = false,
  assetLocked = false,
}: {
  mode: AssignmentFormMode;
  form: Record<string, string>;
  onChange: (form: Record<string, string>) => void;
  assets: Asset[];
  departments: Department[];
  fieldErrors?: Record<string, string>;
  readOnly?: boolean;
  assetLocked?: boolean;
}) {
  const set = (patch: Record<string, string>) => onChange({ ...form, ...patch });

  const selectedAsset = assets.find((a) => a.id === form.assetId);

  const handleAssetChange = (assetId: string) => {
    const asset = assets.find((a) => a.id === assetId);
    const patch: Record<string, string> = { assetId };
    if (mode === "create" && asset) {
      if (asset.department_id && !form.departmentId) patch.departmentId = asset.department_id;
      if (asset.assigned_to && !form.assignedTo) patch.assignedTo = asset.assigned_to;
    }
    set(patch);
  };

  const markReturnedToday = () => {
    set({ returnedDate: todayIso() });
  };

  const clearReturned = () => {
    set({ returnedDate: "" });
  };

  return (
    <div className="space-y-4">
      <FormSection
        id="assignment-asset"
        title="Asset & Assignee"
        description={mode === "create" ? "Choose the device and who receives it." : "Asset cannot be changed after creation."}
        icon={Monitor}
      >
        <Field label="Asset" required={mode === "create"}>
          <select
            className={`${selectClass} ${fieldErrors.assetId ? "border-red-500/60" : ""}`}
            value={form.assetId ?? ""}
            onChange={(e) => handleAssetChange(e.target.value)}
            disabled={readOnly || assetLocked}
          >
            <option value="">— Select asset —</option>
            {assets.map((a) => (
              <option key={a.id} value={a.id}>
                {a.asset_code} — {a.computer_name}
              </option>
            ))}
          </select>
          <FieldError message={fieldErrors.assetId} />
        </Field>

        {selectedAsset && <AssetPreview asset={selectedAsset} />}

        <Field label="Assigned To" required>
          <input
            className={`${inputClass} ${fieldErrors.assignedTo ? "border-red-500/60" : ""}`}
            value={form.assignedTo ?? ""}
            onChange={(e) => set({ assignedTo: e.target.value })}
            placeholder="e.g. Juan Dela Cruz"
            readOnly={readOnly}
            autoFocus={mode === "create" && !readOnly && !!form.assetId}
          />
          <FieldError message={fieldErrors.assignedTo} />
        </Field>

        <Field label="Department">
          <select
            className={`${selectClass} ${fieldErrors.departmentId ? "border-red-500/60" : ""}`}
            value={form.departmentId ?? ""}
            onChange={(e) => set({ departmentId: e.target.value })}
            disabled={readOnly}
          >
            <option value="">— Select department —</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-500">Optional. Auto-filled from the asset when available.</p>
          <FieldError message={fieldErrors.departmentId} />
        </Field>
      </FormSection>

      <FormSection
        id="assignment-timeline"
        title="Timeline"
        description="Set when the device was handed over. Add a return date when the asset is collected back."
        icon={Calendar}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Assigned Date" required>
            <input
              type="date"
              className={`${inputClass} ${fieldErrors.assignedDate ? "border-red-500/60" : ""}`}
              value={form.assignedDate ?? ""}
              onChange={(e) => set({ assignedDate: e.target.value })}
              readOnly={readOnly}
            />
            <FieldError message={fieldErrors.assignedDate} />
          </Field>

          <Field label="Returned Date">
            <input
              type="date"
              className={`${inputClass} ${fieldErrors.returnedDate ? "border-red-500/60" : ""}`}
              value={form.returnedDate ?? ""}
              onChange={(e) => set({ returnedDate: e.target.value })}
              readOnly={readOnly}
            />
            <FieldError message={fieldErrors.returnedDate} />
          </Field>
        </div>

        {!readOnly && (
          <div className="flex flex-wrap gap-2">
            {!form.returnedDate ? (
              <button
                type="button"
                onClick={markReturnedToday}
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-600 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:border-emerald-500/40 hover:text-emerald-300"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Mark returned today
              </button>
            ) : (
              <button
                type="button"
                onClick={clearReturned}
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-600 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:border-amber-500/40 hover:text-amber-300"
              >
                Clear return date
              </button>
            )}
          </div>
        )}

        {form.returnedDate && (
          <div className="flex items-center gap-2 rounded-lg border border-slate-600/40 bg-slate-950/30 px-3 py-2 text-xs text-slate-400">
            <History className="h-3.5 w-3.5 shrink-0" />
            Status will show as <Badge value="RETURNED" /> when a return date is set.
          </div>
        )}
      </FormSection>

      <FormSection
        id="assignment-details"
        title="Record Details"
        description="Who processed the assignment and any extra notes."
        icon={User}
      >
        <Field label="Assigned By">
          <input
            className={inputClass}
            value={form.assignedBy ?? ""}
            onChange={(e) => set({ assignedBy: e.target.value })}
            placeholder="IT staff name"
            readOnly={readOnly}
          />
        </Field>

        <Field label="Notes">
          <textarea
            className={inputClass}
            rows={3}
            value={form.notes ?? ""}
            onChange={(e) => set({ notes: e.target.value })}
            placeholder="Optional remarks, handover checklist, etc."
            readOnly={readOnly}
          />
        </Field>
      </FormSection>

      {mode === "create" && (
        <div className="flex items-start gap-2.5 rounded-lg border border-sky-500/20 bg-sky-500/5 px-3 py-2.5 text-xs text-sky-200/90">
          <FileText className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" />
          <p>
            A new assignment record will be created. The asset inventory is not automatically updated — update the asset record separately if needed.
          </p>
        </div>
      )}
    </div>
  );
}
