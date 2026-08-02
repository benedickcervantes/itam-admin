"use client";

import { useMemo } from "react";
import {
  AlertCircle,
  Building2,
  CalendarDays,
  CheckCircle2,
  FileSignature,
  HardDrive,
  Loader2,
  StickyNote,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/Badge";
import { Field, inputClass, selectClass } from "@/components/Drawer";
import { labelEnum } from "@/lib/labels";
import type { Asset } from "@/lib/types";

function FormSection({
  title,
  description,
  icon: Icon,
  children,
  aside,
  dataTour,
}: {
  title: string;
  description?: string;
  icon: LucideIcon;
  children: React.ReactNode;
  aside?: React.ReactNode;
  dataTour?: string;
}) {
  return (
    <section
      data-tour={dataTour}
      className="rounded-xl border border-slate-700/60 bg-slate-900/30"
    >
      <div className="flex items-start justify-between gap-3 border-b border-slate-700/60 px-4 py-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#2E7D9A]/15 text-[#2E7D9A]">
            <Icon className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-white">{title}</h3>
            {description && <p className="mt-0.5 text-xs text-slate-400">{description}</p>}
          </div>
        </div>
        {aside}
      </div>
      <div className="space-y-4 p-4">{children}</div>
    </section>
  );
}

function AssetRow({ asset }: { asset: Asset }) {
  const type = asset.device_type || asset.item_type || "OTHER";
  return (
    <li className="flex items-center gap-3 rounded-lg border border-slate-700/50 bg-slate-950/50 px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs font-medium text-[#2E7D9A]">{asset.asset_code}</span>
          <Badge value={type} compact />
        </div>
        <p className="mt-0.5 truncate text-sm text-white">
          {asset.brand_model || asset.computer_name || "—"}
        </p>
        {asset.computer_name && asset.brand_model && (
          <p className="truncate text-xs text-slate-500">{asset.computer_name}</p>
        )}
      </div>
      {asset.condition && <Badge value={asset.condition} compact />}
    </li>
  );
}

export function GenerateContractForm({
  assignees,
  employeeName,
  jobTitle,
  departmentName,
  dateIssued,
  notes,
  previewAssets,
  assetsLoading,
  formError,
  onEmployeeNameChange,
  onJobTitleChange,
  onDepartmentNameChange,
  onDateIssuedChange,
  onNotesChange,
}: {
  assignees: string[];
  employeeName: string;
  jobTitle: string;
  departmentName: string;
  dateIssued: string;
  notes: string;
  previewAssets: Asset[];
  assetsLoading: boolean;
  formError: string;
  onEmployeeNameChange: (value: string) => void;
  onJobTitleChange: (value: string) => void;
  onDepartmentNameChange: (value: string) => void;
  onDateIssuedChange: (value: string) => void;
  onNotesChange: (value: string) => void;
}) {
  const hasEmployee = Boolean(employeeName.trim());
  const ready = hasEmployee && !assetsLoading && previewAssets.length > 0;
  const noAssets = hasEmployee && !assetsLoading && previewAssets.length === 0;

  const employeeOptions = useMemo(() => {
    const set = new Set(assignees);
    if (employeeName.trim()) set.add(employeeName.trim());
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [assignees, employeeName]);

  const laptopCount = previewAssets.filter((a) => a.device_type === "LAPTOP").length;
  const desktopCount = previewAssets.filter(
    (a) => a.device_type === "DESKTOP" || a.device_type === "ALL_IN_ONE",
  ).length;
  const peripheralCount = Math.max(0, previewAssets.length - laptopCount - desktopCount);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[#2E7D9A]/25 bg-gradient-to-br from-[#2E7D9A]/15 via-slate-900/40 to-slate-900/20 px-4 py-3.5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#2E7D9A]/20 text-[#4FB0CE] ring-1 ring-[#2E7D9A]/30">
            <FileSignature className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white">New Company Device Agreement</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">
              Select an employee with assigned ITAM assets. The PDF fills Section IX automatically
              and saves under the contracts bucket as the next <span className="text-slate-300">DCA-XXXX</span>.
            </p>
          </div>
        </div>
      </div>

      <div
        className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${
          ready
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
            : noAssets
              ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
              : "border-slate-700/70 bg-slate-900/50 text-slate-400"
        }`}
      >
        {assetsLoading ? (
          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
        ) : ready ? (
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
        ) : noAssets ? (
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
        ) : (
          <UserRound className="h-3.5 w-3.5 shrink-0" />
        )}
        <span>
          {assetsLoading
            ? "Loading assigned assets…"
            : ready
              ? `Ready to generate · ${previewAssets.length} asset${previewAssets.length === 1 ? "" : "s"} will be included`
              : noAssets
                ? "No assets assigned to this employee in ITAM"
                : "Choose an employee to continue"}
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <FormSection
            dataTour="dca-form-employee"
            title="Employee"
            description="Pulled from ITAM assignees with assigned assets"
            icon={UserRound}
          >
            <Field label="Assigned to" required>
              <select
                value={employeeName}
                onChange={(e) => onEmployeeNameChange(e.target.value)}
                className={selectClass}
              >
                <option value="">Select employee…</option>
                {employeeOptions.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </Field>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <Field label="Position">
                <div className="relative">
                  <Building2 className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                  <input
                    value={jobTitle}
                    onChange={(e) => onJobTitleChange(e.target.value)}
                    placeholder="Auto from ITAM"
                    className={`${inputClass} pl-9`}
                  />
                </div>
              </Field>
              <Field label="Department">
                <input
                  value={departmentName}
                  onChange={(e) => onDepartmentNameChange(e.target.value)}
                  placeholder="Auto from ITAM"
                  className={inputClass}
                />
              </Field>
            </div>
          </FormSection>

          <FormSection
            dataTour="dca-form-details"
            title="Agreement details"
            description="Shown on the employee box of the PDF"
            icon={CalendarDays}
          >
            <Field label="Date issued">
              <input
                type="date"
                value={dateIssued}
                onChange={(e) => onDateIssuedChange(e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Internal notes (optional)">
              <div className="relative">
                <StickyNote className="pointer-events-none absolute left-3 top-3 h-3.5 w-3.5 text-slate-500" />
                <textarea
                  value={notes}
                  onChange={(e) => onNotesChange(e.target.value)}
                  rows={3}
                  placeholder="Optional note for IT records only"
                  className={`${inputClass} resize-none pl-9`}
                />
              </div>
            </Field>
          </FormSection>
        </div>

        <FormSection
          dataTour="dca-form-assets"
          title="Assets to include"
          description="Section IX will list these from the live inventory"
          icon={HardDrive}
          aside={
            ready ? (
              <span className="rounded-full bg-[#2E7D9A]/15 px-2.5 py-0.5 text-xs font-medium text-[#7ec8e0] ring-1 ring-[#2E7D9A]/30">
                {previewAssets.length}
              </span>
            ) : null
          }
        >
          {!hasEmployee ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-700 px-4 py-10 text-center">
              <HardDrive className="mb-2 h-8 w-8 text-slate-600" />
              <p className="text-sm text-slate-400">Select an employee to preview assets</p>
            </div>
          ) : assetsLoading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading from ITAM…
            </div>
          ) : noAssets ? (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-3 text-sm text-amber-200">
              No assigned assets for this name. Assign assets in ITAM first, then generate.
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                {laptopCount > 0 && (
                  <span className="rounded-md bg-slate-800 px-2 py-1 text-xs text-slate-300 ring-1 ring-slate-700">
                    {laptopCount} laptop{laptopCount === 1 ? "" : "s"}
                  </span>
                )}
                {desktopCount > 0 && (
                  <span className="rounded-md bg-slate-800 px-2 py-1 text-xs text-slate-300 ring-1 ring-slate-700">
                    {desktopCount} desktop{desktopCount === 1 ? "" : "s"}
                  </span>
                )}
                {peripheralCount > 0 && (
                  <span className="rounded-md bg-slate-800 px-2 py-1 text-xs text-slate-300 ring-1 ring-slate-700">
                    {peripheralCount} peripheral{peripheralCount === 1 ? "" : "s"}
                  </span>
                )}
              </div>
              <ul className="max-h-[22rem] space-y-2 overflow-y-auto pr-0.5">
                {previewAssets.map((asset) => (
                  <AssetRow key={asset.id} asset={asset} />
                ))}
              </ul>
              <p className="text-[11px] text-slate-500">
                Types:{" "}
                {[...new Set(previewAssets.map((a) => labelEnum(a.device_type || a.item_type || "OTHER")))].join(
                  ", ",
                )}
              </p>
            </>
          )}
        </FormSection>
      </div>

      {formError && (
        <div className="flex items-start gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2.5 text-sm text-red-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}
    </div>
  );
}
