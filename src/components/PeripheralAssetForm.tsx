"use client";

import { useMemo } from "react";
import {
  BatteryCharging,
  Keyboard,
  Monitor,
  Mouse,
  Plug,
  Printer,
  User,
  type LucideIcon,
} from "lucide-react";
import { Field, inputClass } from "@/components/Drawer";
import { FormSection } from "@/components/FormSection";
import { optionsFromStrings, Select } from "@/components/Select";
import { labelEnum } from "@/lib/labels";
import { REFERENCE_DATA } from "@/lib/reference-data";
import type { Department } from "@/lib/types";

const ITEM_TYPE_ICONS: Record<string, LucideIcon> = {
  PRINTER: Printer,
  MONITOR: Monitor,
  KEYBOARD: Keyboard,
  MOUSE: Mouse,
  UPS: BatteryCharging,
  AVR: Plug,
};

export type PeripheralAssetFormProps = {
  form: Record<string, string | boolean>;
  set: (key: string, value: string | boolean) => void;
  write: boolean;
  departments: Department[];
  itemType: string;
};

export function PeripheralAssetForm({ form, set, write, departments, itemType }: PeripheralAssetFormProps) {
  const typeLabel = labelEnum(itemType);
  const ItemIcon = ITEM_TYPE_ICONS[itemType] ?? Printer;

  const departmentOptions = useMemo(
    () => [{ value: "", label: "Select department..." }, ...departments.map((d) => ({ value: d.id, label: d.name }))],
    [departments],
  );
  const assetStatusOptions = useMemo(
    () => optionsFromStrings([...REFERENCE_DATA.assetStatuses], { labelFn: labelEnum }),
    [],
  );
  const conditionOptions = useMemo(
    () => optionsFromStrings([...REFERENCE_DATA.conditions], { emptyLabel: "—" }),
    [],
  );

  const assignedTo = String(form.employeeName).trim();

  return (
    <div className="space-y-5">
      <FormSection id="peripheral-section-assignment" title="Assignment" icon={User}>
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Assigned To">
            <input
              className={inputClass}
              value={String(form.employeeName)}
              onChange={(e) => set("employeeName", e.target.value)}
              placeholder="Unassigned — leave blank for spare stock"
              readOnly={!write}
            />
          </Field>
          <Field label="Job Title">
            <input
              className={inputClass}
              value={String(form.jobTitle)}
              onChange={(e) => set("jobTitle", e.target.value)}
              placeholder={assignedTo ? undefined : "—"}
              readOnly={!write || !assignedTo}
            />
          </Field>
          <Field label="Department">
            <Select
              value={String(form.departmentId)}
              onChange={(v) => set("departmentId", v)}
              options={departmentOptions}
              placeholder="Select department..."
              disabled={!write}
            />
          </Field>
          <Field label="Status">
            <Select
              value={String(form.status)}
              onChange={(v) => set("status", v)}
              options={assetStatusOptions}
              disabled={!write}
            />
          </Field>
          {!assignedTo && (
            <p className="md:col-span-2 text-xs text-slate-500">
              No assignee yet — keep status as <span className="text-slate-300">Available</span> or{" "}
              <span className="text-slate-300">Reserved</span>. Assign later via Edit or Assignments.
            </p>
          )}
        </div>
      </FormSection>

      <FormSection id="peripheral-section-item" title={typeLabel} icon={ItemIcon}>
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Item Type">
            <div className={`${inputClass} flex items-center gap-2 text-slate-300`} aria-readonly>
              <ItemIcon className="h-4 w-4 text-[#2E7D9A]" />
              {typeLabel}
            </div>
          </Field>
          <Field label="Linked Workstation">
            <input
              className={inputClass}
              value={String(form.computerName)}
              onChange={(e) => set("computerName", e.target.value)}
              placeholder="e.g. WS-FINANCE-01"
              readOnly={!write}
            />
          </Field>
          <Field label={`${typeLabel} — Brand / Model`}>
            <input
              className={inputClass}
              value={String(form.laptopBrandModel)}
              onChange={(e) => set("laptopBrandModel", e.target.value)}
              placeholder="e.g. HP 115 Ink Tank Printer"
              readOnly={!write}
            />
          </Field>
          <Field label="Condition">
            <Select
              value={String(form.condition)}
              onChange={(v) => set("condition", v)}
              options={conditionOptions}
              disabled={!write}
            />
          </Field>
          <Field label="Serial Number">
            <input
              className={inputClass}
              value={String(form.serialNumber)}
              onChange={(e) => set("serialNumber", e.target.value)}
              readOnly={!write}
            />
          </Field>
        </div>
        <Field label="Notes">
          {write ? (
            <textarea
              className={`${inputClass} min-h-[5rem] max-h-60 resize-y overflow-y-auto whitespace-pre-wrap break-words`}
              rows={4}
              value={String(form.notes)}
              onChange={(e) => set("notes", e.target.value)}
            />
          ) : (
            <div
              className={`${inputClass} min-h-[5rem] max-h-60 overflow-y-auto whitespace-pre-wrap break-words text-slate-300`}
              role="textbox"
              aria-readonly
            >
              {String(form.notes).trim() || "—"}
            </div>
          )}
        </Field>
      </FormSection>
    </div>
  );
}

export default PeripheralAssetForm;
