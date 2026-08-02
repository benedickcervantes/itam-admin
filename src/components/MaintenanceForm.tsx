"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Calendar,
  ClipboardList,
  HardDrive,
  Info,
  Search,
  User,
  Wrench,
  X,
} from "lucide-react";
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

const STATUS_ACCENT: Record<MaintenanceStatus, string> = {
  OPEN: "border-sky-500/50 bg-sky-500/10 ring-sky-500/25",
  IN_PROGRESS: "border-amber-500/50 bg-amber-500/10 ring-amber-500/25",
  COMPLETED: "border-emerald-500/50 bg-emerald-500/10 ring-emerald-500/25",
  CANCELLED: "border-slate-500/50 bg-slate-500/10 ring-slate-500/25",
};

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
      className={`w-full rounded-xl border p-2.5 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
        selected
          ? `${STATUS_ACCENT[status]} ring-1`
          : "border-slate-700 bg-slate-900/40 hover:border-slate-600"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-white">{meta.label}</span>
        <Badge value={status} compact />
      </div>
      <p className="mt-1 text-xs leading-snug text-slate-400">{meta.description}</p>
    </button>
  );
}

function AssetPreview({
  asset,
  onUseAssignee,
  canUseAssignee,
}: {
  asset: Asset;
  onUseAssignee?: () => void;
  canUseAssignee?: boolean;
}) {
  return (
    <div className="rounded-lg border border-[#2E7D9A]/25 bg-gradient-to-br from-[#2E7D9A]/10 to-slate-950/40 px-3 py-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-mono text-xs font-medium text-[#2E7D9A]">{asset.asset_code}</p>
          <p className="mt-0.5 truncate text-sm font-medium text-white">{asset.computer_name}</p>
        </div>
        <HardDrive className="h-4 w-4 shrink-0 text-[#2E7D9A]/80" />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {asset.status && <Badge value={asset.status} compact />}
        {asset.device_type && (
          <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[11px] text-slate-300">
            {asset.device_type}
          </span>
        )}
        {asset.department?.name && (
          <span className="text-xs text-slate-400">{asset.department.name}</span>
        )}
      </div>
      {(asset.brand_model || asset.assigned_to) && (
        <dl className="mt-2 space-y-1 text-xs">
          {asset.brand_model && (
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">Model</dt>
              <dd className="truncate text-slate-300">{asset.brand_model}</dd>
            </div>
          )}
          {asset.assigned_to && (
            <div className="flex items-center justify-between gap-2">
              <dt className="text-slate-500">Assigned</dt>
              <dd className="flex min-w-0 items-center gap-2">
                <span className="truncate text-slate-300">{asset.assigned_to}</span>
                {canUseAssignee && onUseAssignee && (
                  <button
                    type="button"
                    onClick={onUseAssignee}
                    className="shrink-0 text-[11px] font-medium text-[#2E7D9A] hover:text-[#4a9bb8]"
                  >
                    Use
                  </button>
                )}
              </dd>
            </div>
          )}
        </dl>
      )}
      {asset.status === "UNDER_REPAIR" && (
        <p className="mt-2 text-[11px] text-amber-300/90">
          This asset is already marked Under Repair in inventory.
        </p>
      )}
    </div>
  );
}

function assetSearchText(asset: Asset) {
  return [
    asset.asset_code,
    asset.computer_name,
    asset.assigned_to,
    asset.department?.name,
    asset.brand_model,
    asset.device_type,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function MaintenanceForm({
  mode,
  form,
  onChange,
  assets = [],
  assetsLoading = false,
  fieldErrors = {},
  readOnly = false,
}: {
  mode: MaintenanceFormMode;
  form: Record<string, string>;
  onChange: (form: Record<string, string>) => void;
  assets?: Asset[];
  assetsLoading?: boolean;
  fieldErrors?: Record<string, string>;
  readOnly?: boolean;
}) {
  const set = (patch: Record<string, string>) => onChange({ ...form, ...patch });
  const issueLen = form.issue?.length ?? 0;
  const actionLen = form.actionTaken?.length ?? 0;
  const status = (form.status ?? "OPEN") as MaintenanceStatus;
  const selectedAsset = assets.find((a) => a.computer_name === form.computerName);
  const orphanComputerName =
    form.computerName?.trim() &&
    !assets.some((a) => a.computer_name === form.computerName)
      ? form.computerName
      : null;

  const [assetQuery, setAssetQuery] = useState("");
  const [assetOpen, setAssetOpen] = useState(false);
  const assetRootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!assetOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (assetRootRef.current && !assetRootRef.current.contains(e.target as Node)) {
        setAssetOpen(false);
        setAssetQuery("");
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [assetOpen]);

  const filteredAssets = useMemo(() => {
    const q = assetQuery.trim().toLowerCase();
    const list = !q
      ? assets
      : assets.filter((a) => assetSearchText(a).includes(q));
    return list.slice(0, 50);
  }, [assets, assetQuery]);

  const handleStatusChange = (next: MaintenanceStatus) => {
    const patch: Record<string, string> = { status: next };
    if (next === "COMPLETED" && !form.dateClosed) patch.dateClosed = todayIso();
    if ((next === "OPEN" || next === "IN_PROGRESS") && mode === "create") patch.dateClosed = "";
    set(patch);
  };

  const selectAsset = (asset: Asset) => {
    const patch: Record<string, string> = {
      computerName: asset.computer_name,
      auditId: asset.audit_id ?? "",
    };
    if (mode === "create") {
      if (asset.assigned_to) patch.employee = asset.assigned_to;
    } else if (!form.employee?.trim() && asset.assigned_to) {
      patch.employee = asset.assigned_to;
    }
    set(patch);
    setAssetQuery("");
    setAssetOpen(false);
  };

  const clearAsset = () => {
    set({ computerName: "", auditId: "" });
    setAssetQuery("");
    setAssetOpen(false);
  };

  const displayAssetValue = selectedAsset
    ? `${selectedAsset.asset_code} — ${selectedAsset.computer_name}`
    : orphanComputerName
      ? `${orphanComputerName} (not in Assets)`
      : "";

  return (
    <div className="space-y-4">
      {mode === "create" && (
        <div className="flex items-start gap-2.5 rounded-lg border border-sky-500/20 bg-sky-500/5 px-3 py-2.5 text-xs text-sky-200/90">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" />
          <p>
            Log hands-on repair or preventive service on an asset. Day-to-day user concerns stay in
            your IT ticketing system — record here what was done to the machine.
          </p>
        </div>
      )}

      <FormSection
        id="maintenance-device"
        dataTour="service-form-device"
        title="Asset & User"
        description="Search inventory, then confirm who the device belongs to."
        icon={User}
      >
        <Field label="Computer / Asset" required>
          <div ref={assetRootRef} className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              className={`${inputClass} pl-9 pr-9 ${fieldErrors.computerName ? "border-red-500/60" : ""}`}
              value={assetOpen || !displayAssetValue ? assetQuery : displayAssetValue}
              placeholder={
                assetsLoading
                  ? "Loading assets…"
                  : "Search by asset code, computer, user, or department…"
              }
              disabled={readOnly || assetsLoading}
              autoComplete="off"
              autoFocus={mode === "create" && !readOnly}
              onFocus={() => {
                if (readOnly) return;
                setAssetOpen(true);
                setAssetQuery("");
              }}
              onChange={(e) => {
                setAssetQuery(e.target.value);
                setAssetOpen(true);
                if (form.computerName) {
                  set({ computerName: "", auditId: "" });
                }
              }}
            />
            {(form.computerName || assetQuery) && !readOnly && (
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 hover:bg-slate-800 hover:text-slate-300"
                aria-label="Clear asset"
                onMouseDown={(e) => e.preventDefault()}
                onClick={clearAsset}
              >
                <X className="h-4 w-4" />
              </button>
            )}
            {assetOpen && !readOnly && (
              <ul className="absolute z-30 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-slate-600 bg-slate-900 py-1 shadow-xl">
                {assetsLoading ? (
                  <li className="px-3 py-2 text-sm text-slate-500">Loading assets…</li>
                ) : filteredAssets.length === 0 ? (
                  <li className="px-3 py-2 text-sm text-slate-500">
                    {assetQuery.trim() ? "No matching assets" : "No assets available"}
                  </li>
                ) : (
                  filteredAssets.map((a) => (
                    <li key={a.id}>
                      <button
                        type="button"
                        className="flex w-full flex-col px-3 py-2 text-left text-sm hover:bg-slate-800"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => selectAsset(a)}
                      >
                        <span className="font-mono text-[#2E7D9A]">{a.asset_code}</span>
                        <span className="text-white">{a.computer_name}</span>
                        <span className="text-xs text-slate-400">
                          {[a.assigned_to, a.department?.name, a.device_type]
                            .filter(Boolean)
                            .join(" · ") || "Unassigned"}
                        </span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>
          <p className="text-xs text-slate-500">
            Pulled from Asset Dashboard inventory
            {assets.length > 0 ? ` · ${assets.length} assets` : ""}.
          </p>
          <FieldError message={fieldErrors.computerName} />
        </Field>

        {selectedAsset && (
          <AssetPreview
            asset={selectedAsset}
            canUseAssignee={
              !readOnly &&
              !!selectedAsset.assigned_to &&
              selectedAsset.assigned_to !== form.employee?.trim()
            }
            onUseAssignee={() => {
              if (selectedAsset.assigned_to) set({ employee: selectedAsset.assigned_to });
            }}
          />
        )}
        {!selectedAsset && orphanComputerName && (
          <p className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-200/90">
            “{orphanComputerName}” is not in the current Assets list. You can keep it or pick another
            asset above.
          </p>
        )}

        <Field label="Employee / User">
          <input
            className={inputClass}
            value={form.employee ?? ""}
            onChange={(e) => set({ employee: e.target.value })}
            placeholder="Usually filled from the selected asset"
            readOnly={readOnly}
          />
        </Field>
      </FormSection>

      <FormSection
        id="maintenance-issue"
        dataTour="service-form-issue"
        title="Fault & Work Done"
        description="What was wrong with the asset, and what IT physically did."
        icon={Wrench}
      >
        <Field label="Issue / Service reason" required>
          <textarea
            className={`${inputClass} ${fieldErrors.issue ? "border-red-500/60" : ""}`}
            rows={3}
            value={form.issue ?? ""}
            onChange={(e) => set({ issue: e.target.value })}
            placeholder="e.g. Power board failed; laptop sent for board repair"
            readOnly={readOnly}
          />
          <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
            <span>Asset fault, audit finding, or planned preventive service.</span>
            <span className={issueLen < 5 ? "text-amber-400/80" : "text-slate-500"}>{issueLen}</span>
          </div>
          <FieldError message={fieldErrors.issue} />
        </Field>

        <Field label="Action Taken" required={status === "COMPLETED"}>
          <textarea
            className={`${inputClass} ${fieldErrors.actionTaken ? "border-red-500/60" : ""}`}
            rows={3}
            value={form.actionTaken ?? ""}
            onChange={(e) => set({ actionTaken: e.target.value })}
            placeholder="Parts replaced, reimage, cleaning, vendor RMA, preventive checkup…"
            readOnly={readOnly}
          />
          <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
            <span>
              {status === "COMPLETED"
                ? "Required when marking Completed."
                : "Fill in as work progresses; required on Completed."}
            </span>
            {actionLen > 0 && <span>{actionLen}</span>}
          </div>
          <FieldError message={fieldErrors.actionTaken} />
        </Field>

        <Field label="Notes">
          <textarea
            className={inputClass}
            rows={2}
            value={form.notes ?? ""}
            onChange={(e) => set({ notes: e.target.value })}
            placeholder="Parts ordered, follow-ups, ticket reference (optional)…"
            readOnly={readOnly}
          />
        </Field>
      </FormSection>

      <FormSection
        id="maintenance-status"
        dataTour="service-form-status"
        title="Status & Timeline"
        description="Track service progress and who performed the work."
        icon={Calendar}
      >
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-300">Status</p>
          <div className="grid gap-2 sm:grid-cols-2">
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
            {(status === "COMPLETED" || status === "CANCELLED") && !form.dateClosed && (
              <p className="text-xs text-amber-300/80">Recommended when status is {status === "COMPLETED" ? "Completed" : "Cancelled"}.</p>
            )}
            <FieldError message={fieldErrors.dateClosed} />
          </Field>
        </div>

        <Field label="Performed By">
          <div className="relative">
            <ClipboardList className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              className={`${inputClass} pl-9`}
              value={form.performedBy ?? ""}
              onChange={(e) => set({ performedBy: e.target.value })}
              placeholder="Technician or IT staff name"
              readOnly={readOnly}
            />
          </div>
        </Field>
      </FormSection>
    </div>
  );
}
