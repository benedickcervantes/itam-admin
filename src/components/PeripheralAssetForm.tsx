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
import {
  SPARE_PERIPHERAL_ITEM_TYPES,
  type AssetCategory,
} from "@/lib/device-form";
import type { Department } from "@/lib/types";

const ITEM_TYPE_ICONS: Record<string, LucideIcon> = {
  PRINTER: Printer,
  MONITOR: Monitor,
  KEYBOARD: Keyboard,
  MOUSE: Mouse,
  UPS: BatteryCharging,
  AVR: Plug,
};

const NAME_PLACEHOLDERS: Record<string, string> = {
  PRINTER: "e.g. FLOOR2-SHARED-PRN",
  KEYBOARD: "e.g. SPARE-KB-01",
  MOUSE: "e.g. SPARE-MS-01",
  MONITOR: "e.g. SPARE-MON-01",
};

const BRAND_PLACEHOLDERS: Record<string, string> = {
  PRINTER: "e.g. HP 115 Ink Tank Printer",
  KEYBOARD: "e.g. Logitech K120",
  MOUSE: "e.g. Logitech M90",
  MONITOR: "e.g. Dell P2422H",
};

export type PeripheralAssetFormProps = {
  form: Record<string, string | boolean>;
  set: (key: string, value: string | boolean) => void;
  write: boolean;
  departments: Department[];
  itemType: string;
  /** When true, fields are tuned for a new spare / shared peripheral. */
  createMode?: boolean;
  onAssetCategoryChange?: (category: AssetCategory) => void;
};

export function PeripheralAssetForm({
  form,
  set,
  write,
  departments,
  itemType,
  createMode = false,
  onAssetCategoryChange,
}: PeripheralAssetFormProps) {
  const typeLabel = labelEnum(itemType);
  const ItemIcon = ITEM_TYPE_ICONS[itemType] ?? Printer;
  const assetCategory = String(form.assetCategory || "spare_peripheral") as AssetCategory;

  const departmentOptions = useMemo(
    () => [
      { value: "", label: "Shared — all departments" },
      ...departments.map((d) => ({ value: d.id, label: d.name })),
    ],
    [departments],
  );
  const assetStatusOptions = useMemo(
    () => optionsFromStrings([...REFERENCE_DATA.assetStatuses], { labelFn: labelEnum }),
    [],
  );
  const employeeStatusOptions = useMemo(
    () => optionsFromStrings([...REFERENCE_DATA.employeeStatuses], { labelFn: labelEnum }),
    [],
  );
  const conditionOptions = useMemo(
    () => optionsFromStrings([...REFERENCE_DATA.conditions], { emptyLabel: "—" }),
    [],
  );
  const spareItemTypeOptions = useMemo(
    () =>
      SPARE_PERIPHERAL_ITEM_TYPES.map((t) => ({
        value: t,
        label: labelEnum(t),
      })),
    [],
  );

  const assignedTo = String(form.employeeName).trim();

  return (
    <div className="space-y-5">
      {createMode && onAssetCategoryChange && (
        <div className="rounded-xl border border-slate-700/60 bg-slate-900/40 p-4">
          <Field label="Asset Category">
            <Select
              value={assetCategory}
              onChange={(v) => {
                const category = v as AssetCategory;
                set("assetCategory", category);
                onAssetCategoryChange(category);
              }}
              options={[
                { value: "end_user", label: "End User Device" },
                { value: "infrastructure", label: "Infrastructure" },
                { value: "spare_peripheral", label: "Spare / Shared Peripheral" },
              ]}
              disabled={!write}
            />
          </Field>
        </div>
      )}

      {createMode && (
        <p className="rounded-lg border border-slate-700/80 bg-slate-900/50 px-3 py-2 text-sm text-slate-400">
          Leave <span className="text-slate-300">Assigned To</span> and{" "}
          <span className="text-slate-300">Department</span> blank to keep this as spare stock (
          <span className="text-slate-300">Available</span> or{" "}
          <span className="text-slate-300">Reserved</span>) for any department.
        </p>
      )}

      <FormSection id="peripheral-section-assignment" title="Assignment" icon={User}>
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Assigned To">
            <input
              className={inputClass}
              value={String(form.employeeName)}
              onChange={(e) => set("employeeName", e.target.value)}
              placeholder="Unassigned — leave blank for spare / reserved stock"
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
              placeholder="Shared — all departments"
              disabled={!write}
            />
          </Field>
          <Field label="Employee Status">
            <Select
              value={String(form.employeeStatus)}
              onChange={(v) => set("employeeStatus", v)}
              options={employeeStatusOptions}
              disabled={!write}
            />
          </Field>
          <Field label="Asset Status">
            <Select
              value={String(form.status)}
              onChange={(v) => set("status", v)}
              options={assetStatusOptions}
              disabled={!write}
            />
          </Field>
          {!assignedTo && (
            <p className="md:col-span-2 text-xs text-slate-500">
              No assignee — keep asset status as <span className="text-slate-300">Available</span> or{" "}
              <span className="text-slate-300">Reserved</span>. Assign later via Edit.
            </p>
          )}
        </div>
      </FormSection>

      <FormSection id="peripheral-section-item" title={typeLabel} icon={ItemIcon}>
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Item Type" required={createMode}>
            {createMode && write ? (
              <Select
                value={itemType}
                onChange={(v) => set("itemType", v)}
                options={spareItemTypeOptions}
              />
            ) : (
              <div className={`${inputClass} flex items-center gap-2 text-slate-300`} aria-readonly>
                <ItemIcon className="h-4 w-4 text-[#2E7D9A]" />
                {typeLabel}
              </div>
            )}
          </Field>
          <Field
            label={createMode ? `${typeLabel} Name / Tag` : "Linked Workstation"}
            required={createMode}
          >
            <input
              className={inputClass}
              value={String(form.computerName)}
              onChange={(e) => set("computerName", e.target.value)}
              placeholder={
                createMode
                  ? NAME_PLACEHOLDERS[itemType] ?? "e.g. SPARE-01"
                  : "e.g. WS-FINANCE-01"
              }
              readOnly={!write}
            />
          </Field>
          <Field label={`${typeLabel} — Brand / Model`} required={createMode}>
            <input
              className={inputClass}
              value={String(form.laptopBrandModel)}
              onChange={(e) => set("laptopBrandModel", e.target.value)}
              placeholder={BRAND_PLACEHOLDERS[itemType] ?? "e.g. Brand Model"}
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
              placeholder={
                createMode
                  ? `Optional — e.g. spare ${typeLabel.toLowerCase()} stock, IT storage`
                  : undefined
              }
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
