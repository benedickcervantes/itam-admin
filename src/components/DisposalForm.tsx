"use client";

import { FileCheck, FileText, ShieldCheck, Trash2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/Badge";
import { Field, inputClass, selectClass } from "@/components/Drawer";
import { REFERENCE_DATA } from "@/lib/reference-data";
import {
  DISPOSAL_METHOD_META,
  type DisposalFormMode,
  type DisposalMethod,
} from "@/lib/disposal-form";
import type { Asset } from "@/lib/types";

function FormSection({
  id,
  title,
  description,
  icon: Icon,
  children,
  dataTour,
}: {
  id: string;
  title: string;
  description?: string;
  icon: LucideIcon;
  children: React.ReactNode;
  dataTour?: string;
}) {
  return (
    <section
      id={id}
      data-tour={dataTour}
      className="scroll-mt-4 rounded-xl border border-slate-700/60 bg-slate-900/30"
    >
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
      </div>
    </div>
  );
}

function employeeOptions(names: string[], current?: string) {
  const unique = new Set(names);
  const value = current?.trim();
  if (value) unique.add(value);
  return [...unique].sort((a, b) => a.localeCompare(b));
}

function MethodCard({
  method,
  selected,
  disabled,
  onSelect,
}: {
  method: DisposalMethod;
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
}) {
  const meta = DISPOSAL_METHOD_META[method];
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className={`w-full rounded-xl border p-3 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
        selected
          ? "border-[#2E7D9A]/60 bg-[#2E7D9A]/10 ring-1 ring-[#2E7D9A]/30"
          : "border-slate-700 bg-slate-900/40 hover:border-slate-600"
      }`}
    >
      <p className="text-sm font-medium text-white">{meta.label}</p>
      <p className="mt-1 text-xs leading-relaxed text-slate-400">{meta.description}</p>
    </button>
  );
}

export function DisposalForm({
  mode,
  form,
  onChange,
  assets,
  employees = [],
  fieldErrors = {},
  readOnly = false,
  assetLocked = false,
}: {
  mode: DisposalFormMode;
  form: Record<string, string>;
  onChange: (form: Record<string, string>) => void;
  assets: Asset[];
  employees?: string[];
  fieldErrors?: Record<string, string>;
  readOnly?: boolean;
  assetLocked?: boolean;
}) {
  const set = (patch: Record<string, string>) => onChange({ ...form, ...patch });
  const selectedAsset = assets.find((a) => a.id === form.assetId);
  const reasonLen = form.disposalReason?.length ?? 0;
  const approvedByOptions = employeeOptions(employees, form.approvedBy);
  const witnessOptions = employeeOptions(employees, form.witness);

  return (
    <div className="space-y-4">
      <FormSection
        id="disposal-asset"
        dataTour="disp-form-asset"
        title="Asset"
        description={mode === "create" ? "Select the asset being retired from inventory." : "Asset cannot be changed after creation."}
        icon={Trash2}
      >
        <Field label="Asset" required={mode === "create"}>
          <select
            className={`${selectClass} ${fieldErrors.assetId ? "border-red-500/60" : ""}`}
            value={form.assetId ?? ""}
            onChange={(e) => set({ assetId: e.target.value })}
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
      </FormSection>

      <FormSection
        id="disposal-details"
        dataTour="disp-form-details"
        title="Disposal Details"
        description="When and why the asset left active inventory."
        icon={FileText}
      >
        <Field label="Disposal Date" required>
          <input
            type="date"
            className={`${inputClass} ${fieldErrors.disposalDate ? "border-red-500/60" : ""}`}
            value={form.disposalDate ?? ""}
            onChange={(e) => set({ disposalDate: e.target.value })}
            readOnly={readOnly}
            autoFocus={mode === "create" && !readOnly && !!form.assetId}
          />
          <FieldError message={fieldErrors.disposalDate} />
        </Field>

        <Field label="Reason" required>
          <textarea
            className={`${inputClass} ${fieldErrors.disposalReason ? "border-red-500/60" : ""}`}
            rows={3}
            value={form.disposalReason ?? ""}
            onChange={(e) => set({ disposalReason: e.target.value })}
            placeholder="e.g. End of life — unit no longer boots, parts unavailable"
            readOnly={readOnly}
          />
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Be specific for audit and compliance records.</span>
            <span className={reasonLen < 5 ? "text-amber-400/80" : "text-slate-500"}>{reasonLen} chars</span>
          </div>
          <FieldError message={fieldErrors.disposalReason} />
        </Field>

        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-300">Disposal Method</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {REFERENCE_DATA.disposalMethods.map((method) => (
              <MethodCard
                key={method}
                method={method}
                selected={form.disposalMethod === method}
                disabled={readOnly}
                onSelect={() => set({ disposalMethod: method })}
              />
            ))}
          </div>
          {form.disposalMethod && (
            <button
              type="button"
              disabled={readOnly}
              onClick={() => set({ disposalMethod: "" })}
              className="text-xs text-slate-500 hover:text-slate-300 disabled:opacity-50"
            >
              Clear method selection
            </button>
          )}
        </div>
      </FormSection>

      <FormSection
        id="disposal-documentation"
        dataTour="disp-form-docs"
        title="Documentation & Approval"
        description="Certificate numbers and sign-off for compliance tracking."
        icon={FileCheck}
      >
        <Field label="Certificate / Doc No.">
          <input
            className={inputClass}
            value={form.certificateDocNo ?? ""}
            onChange={(e) => set({ certificateDocNo: e.target.value })}
            placeholder="e.g. CERT-2026-0042"
            readOnly={readOnly}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Approved By">
            <select
              className={selectClass}
              value={form.approvedBy ?? ""}
              onChange={(e) => set({ approvedBy: e.target.value })}
              disabled={readOnly}
            >
              <option value="">— Select employee —</option>
              {approvedByOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Witness By">
            <select
              className={selectClass}
              value={form.witness ?? ""}
              onChange={(e) => set({ witness: e.target.value })}
              disabled={readOnly}
            >
              <option value="">— Select employee —</option>
              {witnessOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Notes">
          <textarea
            className={inputClass}
            rows={2}
            value={form.notes ?? ""}
            onChange={(e) => set({ notes: e.target.value })}
            placeholder="Additional disposal notes"
            readOnly={readOnly}
          />
        </Field>
      </FormSection>

      {mode === "create" && (
        <div className="flex items-start gap-2.5 rounded-lg border border-sky-500/20 bg-sky-500/5 px-3 py-2.5 text-xs text-sky-200/90">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" />
          <p>
            Keep certificate or document numbers on file. Disposal records support audit trails and asset retirement reporting.
          </p>
        </div>
      )}
    </div>
  );
}
