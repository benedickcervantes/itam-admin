"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRightLeft, Loader2, Search, X } from "lucide-react";
import { Field, inputClass, selectClass } from "@/components/Drawer";
import { movePeripheral } from "@/lib/api/assets";
import { fetchAllAuditRegisters } from "@/lib/api/auditRegisters";
import { labelEnum } from "@/lib/labels";
import type { Asset, AuditRegister, Department } from "@/lib/types";

type DestinationMode = "audit" | "spare";

function auditSearchHaystack(a: AuditRegister): string {
  return [a.audit_code, a.computer_name, a.employee_name, a.department?.name ?? ""]
    .join(" ")
    .toLowerCase();
}

/** Every query token must appear somewhere in code / computer / employee / dept. */
function auditMatchesQuery(a: AuditRegister, query: string): boolean {
  const tokens = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  if (tokens.length === 0) return true;
  const hay = auditSearchHaystack(a);
  return tokens.every((t) => hay.includes(t));
}

export function MovePeripheralForm({
  asset,
  departments,
  onDone,
  onError,
}: {
  asset: Asset;
  departments: Department[];
  onDone: (message: string) => void;
  onError: (message: string) => void;
}) {
  const [mode, setMode] = useState<DestinationMode>("audit");
  const [auditQuery, setAuditQuery] = useState("");
  const [allAudits, setAllAudits] = useState<AuditRegister[]>([]);
  const [selectedAudit, setSelectedAudit] = useState<AuditRegister | null>(null);
  const [auditOpen, setAuditOpen] = useState(false);
  const [loadingAudits, setLoadingAudits] = useState(false);
  const [auditLoadError, setAuditLoadError] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [computerName, setComputerName] = useState(asset.computer_name ?? "");
  const [departmentId, setDepartmentId] = useState(asset.department_id ?? "");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const auditRootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!auditOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (auditRootRef.current && !auditRootRef.current.contains(e.target as Node)) {
        setAuditOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [auditOpen]);

  // Prefetch audits once so employee / computer / audit-code search all work.
  useEffect(() => {
    if (mode !== "audit") return;
    let cancelled = false;
    setLoadingAudits(true);
    setAuditLoadError("");
    fetchAllAuditRegisters({ limit: 100 })
      .then((items) => {
        if (cancelled) return;
        setAllAudits(items.filter((a) => a.id !== asset.audit_id));
      })
      .catch((e) => {
        if (cancelled) return;
        setAllAudits([]);
        setAuditLoadError(e instanceof Error ? e.message : "Failed to load audits");
      })
      .finally(() => {
        if (!cancelled) setLoadingAudits(false);
      });
    return () => {
      cancelled = true;
    };
  }, [mode, asset.audit_id]);

  const auditResults = useMemo(() => {
    const q = auditQuery.trim();
    const matched = q
      ? allAudits.filter((a) => auditMatchesQuery(a, q))
      : allAudits;
    return matched.slice(0, 40);
  }, [allAudits, auditQuery]);

  useEffect(() => {
    if (selectedAudit) {
      setAssignedTo(selectedAudit.employee_name);
      setDepartmentId(selectedAudit.department_id);
    }
  }, [selectedAudit]);

  const typeLabel = labelEnum(asset.item_type ?? "OTHER");

  const canSubmit = useMemo(() => {
    if (saving) return false;
    if (mode === "audit") return !!selectedAudit;
    return computerName.trim().length > 0;
  }, [saving, mode, selectedAudit, computerName]);

  const submit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    try {
      const updated = await movePeripheral(asset.id, {
        ...(mode === "spare"
          ? {
              unlink: true,
              computerName: computerName.trim(),
              assignedTo: assignedTo.trim() || undefined,
              departmentId: departmentId || undefined,
            }
          : {
              targetAuditId: selectedAudit!.id,
              assignedTo: assignedTo.trim() || undefined,
              departmentId: departmentId || undefined,
            }),
        notes: notes.trim() || undefined,
      });
      const dest =
        mode === "spare"
          ? `spare stock (${updated.computer_name})`
          : `${updated.computer_name} / ${updated.assigned_to ?? "unassigned"}`;
      onDone(`Moved ${asset.asset_code} → ${dest}. Asset number unchanged.`);
    } catch (e) {
      onError(e instanceof Error ? e.message : "Move failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-3 text-sm">
        <p className="font-mono text-[#2E7D9A]">{asset.asset_code}</p>
        <p className="mt-1 font-medium text-white">
          {typeLabel}
          {asset.brand_model ? ` — ${asset.brand_model}` : ""}
        </p>
        <p className="mt-1 text-slate-400">
          Currently: {asset.computer_name}
          {asset.assigned_to ? ` · ${asset.assigned_to}` : " · Unassigned"}
          {asset.audit_register?.audit_code ? ` · ${asset.audit_register.audit_code}` : ""}
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Asset number stays the same. Only this peripheral moves — the primary device and siblings are not renamed.
        </p>
      </div>

      <Field label="Destination">
        <div className="inline-flex rounded-lg border border-slate-600 p-0.5">
          <button
            type="button"
            onClick={() => setMode("audit")}
            className={`rounded-md px-3 py-1.5 text-sm transition ${
              mode === "audit" ? "bg-[#2E7D9A] text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Another workstation
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("spare");
              setSelectedAudit(null);
            }}
            className={`rounded-md px-3 py-1.5 text-sm transition ${
              mode === "spare" ? "bg-[#2E7D9A] text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Spare / unlink
          </button>
        </div>
      </Field>

      {mode === "audit" ? (
        <Field label="Target audit / workstation">
          <div ref={auditRootRef} className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              className={`${inputClass} pl-9 pr-9`}
              value={
                selectedAudit
                  ? `${selectedAudit.audit_code} — ${selectedAudit.computer_name} (${selectedAudit.employee_name})`
                  : auditQuery
              }
              placeholder={
                loadingAudits
                  ? "Loading audits…"
                  : "Search by employee, computer, or audit code…"
              }
              disabled={loadingAudits}
              autoComplete="off"
              onFocus={() => {
                if (selectedAudit) {
                  setSelectedAudit(null);
                  setAuditQuery("");
                }
                setAuditOpen(true);
              }}
              onChange={(e) => {
                setSelectedAudit(null);
                setAuditQuery(e.target.value);
                setAuditOpen(true);
              }}
            />
            {(auditQuery || selectedAudit) && (
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 hover:bg-slate-800 hover:text-slate-300"
                aria-label="Clear"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setSelectedAudit(null);
                  setAuditQuery("");
                  setAssignedTo("");
                }}
              >
                <X className="h-4 w-4" />
              </button>
            )}
            {auditOpen && !selectedAudit && (
              <ul className="absolute z-30 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-slate-600 bg-slate-900 py-1 shadow-xl">
                {loadingAudits ? (
                  <li className="flex items-center gap-2 px-3 py-2 text-sm text-slate-500">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading audits…
                  </li>
                ) : auditLoadError ? (
                  <li className="px-3 py-2 text-sm text-red-400">{auditLoadError}</li>
                ) : auditResults.length === 0 ? (
                  <li className="px-3 py-2 text-sm text-slate-500">
                    {auditQuery.trim() ? "No matching audits" : "No other audits available"}
                  </li>
                ) : (
                  auditResults.map((a) => (
                    <li key={a.id}>
                      <button
                        type="button"
                        className="flex w-full flex-col px-3 py-2 text-left text-sm hover:bg-slate-800"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setSelectedAudit(a);
                          setAuditQuery("");
                          setAuditOpen(false);
                        }}
                      >
                        <span className="font-mono text-[#2E7D9A]">{a.audit_code}</span>
                        <span className="text-white">{a.computer_name}</span>
                        <span className="text-xs text-slate-400">
                          {a.employee_name}
                          {a.department?.name ? ` · ${a.department.name}` : ""}
                        </span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Type any part of the employee name, computer name, or audit code.
          </p>
        </Field>
      ) : (
        <Field label="Spare name / tag">
          <input
            className={inputClass}
            value={computerName}
            onChange={(e) => setComputerName(e.target.value)}
            placeholder="e.g. FLOOR2-SHARED-PRN"
          />
        </Field>
      )}

      <Field label={mode === "spare" ? "Assigned To (optional)" : "Assigned To"}>
        <input
          className={inputClass}
          value={assignedTo}
          onChange={(e) => setAssignedTo(e.target.value)}
          placeholder={mode === "spare" ? "Leave blank for unassigned stock" : "Defaults from target audit"}
        />
      </Field>

      <Field label="Department">
        <select
          className={selectClass}
          value={departmentId}
          onChange={(e) => setDepartmentId(e.target.value)}
        >
          <option value="">Shared — all departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Notes (optional)">
        <textarea
          className={`${inputClass} min-h-[4.5rem] resize-y`}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Swapped printer with another desk"
        />
      </Field>

      <button
        type="button"
        disabled={!canSubmit}
        onClick={() => void submit()}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#2E7D9A] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#256b85] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ArrowRightLeft className="h-4 w-4" />
        )}
        {saving ? "Moving…" : "Move peripheral"}
      </button>
    </div>
  );
}
