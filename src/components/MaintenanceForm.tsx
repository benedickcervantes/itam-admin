"use client";

import { Calendar, ClipboardList, User, Wrench } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/Badge";
import { Field, inputClass } from "@/components/Drawer";
import { REFERENCE_DATA } from "@/lib/reference-data";
import {
  MAINTENANCE_STATUS_META,
  todayIso,
  type MaintenanceFormMode,
  type MaintenanceStatus,
} from "@/lib/maintenance-form";

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

function StatusCard({
  status,
  selected,
  disabled,
  onSelect,
}: {
  status: MaintenanceStatus;
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
}) {
  const meta = MAINTENANCE_STATUS_META[status];
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
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-white">{meta.label}</span>
        <Badge value={status} compact />
      </div>
      <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{meta.description}</p>
    </button>
  );
}

export function MaintenanceForm({
  mode,
  form,
  onChange,
  fieldErrors = {},
  readOnly = false,
}: {
  mode: MaintenanceFormMode;
  form: Record<string, string>;
  onChange: (form: Record<string, string>) => void;
  fieldErrors?: Record<string, string>;
  readOnly?: boolean;
}) {
  const set = (patch: Record<string, string>) => onChange({ ...form, ...patch });
  const issueLen = form.issue?.length ?? 0;
  const status = (form.status ?? "OPEN") as MaintenanceStatus;

  const handleStatusChange = (next: MaintenanceStatus) => {
    const patch: Record<string, string> = { status: next };
    if (next === "COMPLETED" && !form.dateClosed) patch.dateClosed = todayIso();
    if (next === "OPEN" && mode === "create") patch.dateClosed = "";
    set(patch);
  };

  return (
    <div className="space-y-4">
      <FormSection
        id="maintenance-device"
        title="Device & Requester"
        description="Identify the computer and who reported the issue."
        icon={User}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Computer Name">
            <input
              className={inputClass}
              value={form.computerName ?? ""}
              onChange={(e) => set({ computerName: e.target.value })}
              placeholder="e.g. IT-LAP-042"
              readOnly={readOnly}
              autoFocus={mode === "create" && !readOnly}
            />
          </Field>

          <Field label="Employee">
            <input
              className={inputClass}
              value={form.employee ?? ""}
              onChange={(e) => set({ employee: e.target.value })}
              placeholder="Who reported the issue"
              readOnly={readOnly}
            />
          </Field>
        </div>
      </FormSection>

      <FormSection
        id="maintenance-issue"
        title="Issue & Resolution"
        description="Describe the problem and what was done to fix it."
        icon={Wrench}
      >
        <Field label="Issue" required>
          <textarea
            className={`${inputClass} ${fieldErrors.issue ? "border-red-500/60" : ""}`}
            rows={4}
            value={form.issue ?? ""}
            onChange={(e) => set({ issue: e.target.value })}
            placeholder="e.g. Laptop will not power on after Windows update"
            readOnly={readOnly}
          />
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Include symptoms, error messages, or when it started.</span>
            <span className={issueLen < 5 ? "text-amber-400/80" : "text-slate-500"}>{issueLen} chars</span>
          </div>
          <FieldError message={fieldErrors.issue} />
        </Field>

        <Field label="Action Taken">
          <textarea
            className={`${inputClass} ${fieldErrors.actionTaken ? "border-red-500/60" : ""}`}
            rows={3}
            value={form.actionTaken ?? ""}
            onChange={(e) => set({ actionTaken: e.target.value })}
            placeholder="Parts replaced, software reinstalled, etc."
            readOnly={readOnly}
          />
          {status === "COMPLETED" && (
            <p className="text-xs text-amber-300/80">Required when status is Completed.</p>
          )}
          <FieldError message={fieldErrors.actionTaken} />
        </Field>
      </FormSection>

      <FormSection
        id="maintenance-status"
        title="Status & Timeline"
        description="Track progress and when the ticket was opened or closed."
        icon={Calendar}
      >
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-300">Status</p>
          <div className="grid gap-2">
            {REFERENCE_DATA.maintenanceStatuses.map((s) => (
              <StatusCard
                key={s}
                status={s}
                selected={status === s}
                disabled={readOnly}
                onSelect={() => handleStatusChange(s)}
              />
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Date Opened">
            <input
              type="date"
              className={`${inputClass} ${fieldErrors.dateOpened ? "border-red-500/60" : ""}`}
              value={form.dateOpened ?? ""}
              onChange={(e) => set({ dateOpened: e.target.value })}
              readOnly={readOnly}
            />
            <FieldError message={fieldErrors.dateOpened} />
          </Field>

          <Field label="Date Closed">
            <input
              type="date"
              className={`${inputClass} ${fieldErrors.dateClosed ? "border-red-500/60" : ""}`}
              value={form.dateClosed ?? ""}
              onChange={(e) => set({ dateClosed: e.target.value })}
              readOnly={readOnly}
            />
            <FieldError message={fieldErrors.dateClosed} />
          </Field>
        </div>

        <Field label="Performed By">
          <input
            className={inputClass}
            value={form.performedBy ?? ""}
            onChange={(e) => set({ performedBy: e.target.value })}
            placeholder="Technician or IT staff name"
            readOnly={readOnly}
          />
        </Field>
      </FormSection>

      <FormSection
        id="maintenance-notes"
        title="Additional Notes"
        icon={ClipboardList}
      >
        <Field label="Notes">
          <textarea
            className={inputClass}
            rows={2}
            value={form.notes ?? ""}
            onChange={(e) => set({ notes: e.target.value })}
            placeholder="Follow-up items, parts ordered, etc."
            readOnly={readOnly}
          />
        </Field>
      </FormSection>

      {mode === "create" && (
        <div className="flex items-start gap-2.5 rounded-lg border border-sky-500/20 bg-sky-500/5 px-3 py-2.5 text-xs text-sky-200/90">
          <Wrench className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" />
          <p>
            New tickets start as Open. Update status and action taken as work progresses so the maintenance log stays accurate.
          </p>
        </div>
      )}
    </div>
  );
}
