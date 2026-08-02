"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Loader2, Search, Users, X } from "lucide-react";
import { Field, inputClass, selectClass } from "@/components/Drawer";
import {
  fetchAssetsByUser,
  fetchDeviceHistoryAssignees,
  transferAssets,
} from "@/lib/api/device-history";
import { fetchAllAuditRegisters } from "@/lib/api/auditRegisters";
import { labelEnum } from "@/lib/labels";
import type { Asset, AuditRegister, Department } from "@/lib/types";

type TransferMode = "resign" | "new_pc";

function assetTransferLabel(a: Asset) {
  const kind = a.item_type || a.device_type;
  const kindLabel = kind ? labelEnum(kind) : null;
  const detail = a.brand_model?.trim() || a.monitor?.trim() || null;
  const title = detail || a.computer_name || a.asset_code;
  const meta = [
    kindLabel,
    detail && a.computer_name ? a.computer_name : null,
    a.department?.name,
  ]
    .filter(Boolean)
    .join(" · ");
  return { title, meta };
}

function auditSearchHaystack(a: AuditRegister): string {
  return [a.audit_code, a.computer_name, a.employee_name, a.department?.name ?? ""]
    .join(" ")
    .toLowerCase();
}

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

function UserSearchField({
  label,
  value,
  onChange,
  options,
  placeholder,
  hint,
  allowCustom = false,
  exclude = "",
  loading = false,
}: {
  label: string;
  value: string;
  onChange: (name: string) => void;
  options: string[];
  placeholder: string;
  hint?: string;
  allowCustom?: boolean;
  exclude?: string;
  loading?: boolean;
}) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        if (!allowCustom) setQuery(value);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, allowCustom, value]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const excludeNorm = exclude.trim().toLowerCase();
    return options
      .filter((n) => n.trim().toLowerCase() !== excludeNorm)
      .filter((n) => !q || n.toLowerCase().includes(q))
      .slice(0, 40);
  }, [options, query, exclude]);

  const commitCustom = () => {
    const next = query.trim();
    if (!next) {
      onChange("");
      return;
    }
    if (allowCustom) {
      onChange(next);
      setOpen(false);
      return;
    }
    const exact = options.find((n) => n.toLowerCase() === next.toLowerCase());
    if (exact) {
      onChange(exact);
      setQuery(exact);
      setOpen(false);
    } else {
      setQuery(value);
      setOpen(false);
    }
  };

  return (
    <Field label={label}>
      <div ref={rootRef} className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          className={`${inputClass} pl-9 pr-9`}
          value={query}
          placeholder={loading ? "Loading users…" : placeholder}
          disabled={loading}
          autoComplete="off"
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            if (allowCustom) onChange(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (filtered.length === 1) {
                onChange(filtered[0]);
                setQuery(filtered[0]);
                setOpen(false);
              } else {
                commitCustom();
              }
            }
          }}
          onBlur={() => {
            if (allowCustom) commitCustom();
          }}
        />
        {query ? (
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 hover:bg-slate-800 hover:text-slate-300"
            aria-label="Clear"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setQuery("");
              onChange("");
              setOpen(false);
            }}
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
        {open && (
          <ul className="absolute z-30 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-slate-600 bg-slate-900 py-1 shadow-xl">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-slate-500">
                {allowCustom ? "Press Enter to use this name" : "No matching users"}
              </li>
            ) : (
              filtered.map((name) => (
                <li key={name}>
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm text-white hover:bg-slate-800"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      onChange(name);
                      setQuery(name);
                      setOpen(false);
                    }}
                  >
                    {name}
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
      </div>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </Field>
  );
}

export function TransferAssetsForm({
  departments,
  onDone,
  onError,
}: {
  departments: Department[];
  onDone: (message: string) => void;
  onError: (message: string) => void;
}) {
  const [mode, setMode] = useState<TransferMode>("resign");
  const [assignees, setAssignees] = useState<string[]>([]);
  const [fromUser, setFromUser] = useState("");
  const [toUser, setToUser] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [notes, setNotes] = useState("");
  const [preview, setPreview] = useState<Asset[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loadingAssignees, setLoadingAssignees] = useState(true);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [saving, setSaving] = useState(false);

  const [auditQuery, setAuditQuery] = useState("");
  const [allAudits, setAllAudits] = useState<AuditRegister[]>([]);
  const [selectedAudit, setSelectedAudit] = useState<AuditRegister | null>(null);
  const [auditOpen, setAuditOpen] = useState(false);
  const [loadingAudits, setLoadingAudits] = useState(false);
  const [auditLoadError, setAuditLoadError] = useState("");
  const auditRootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingAssignees(true);
      try {
        const names = await fetchDeviceHistoryAssignees();
        if (!cancelled) setAssignees(names);
      } catch (e) {
        if (!cancelled) onError(e instanceof Error ? e.message : "Failed to load users");
      } finally {
        if (!cancelled) setLoadingAssignees(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [onError]);

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

  useEffect(() => {
    if (mode !== "new_pc") return;
    let cancelled = false;
    setLoadingAudits(true);
    setAuditLoadError("");
    fetchAllAuditRegisters({ limit: 100 })
      .then((items) => {
        if (!cancelled) setAllAudits(items);
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
  }, [mode]);

  useEffect(() => {
    if (!fromUser.trim()) {
      setPreview([]);
      setSelectedIds(new Set());
      return;
    }
    let cancelled = false;
    const t = setTimeout(() => {
      void (async () => {
        setLoadingPreview(true);
        try {
          const res = await fetchAssetsByUser(fromUser.trim());
          if (!cancelled) {
            setPreview(res.items);
            setSelectedIds(new Set(res.items.map((a) => a.id)));
          }
        } catch (e) {
          if (!cancelled) {
            setPreview([]);
            setSelectedIds(new Set());
            onError(e instanceof Error ? e.message : "Failed to load assets");
          }
        } finally {
          if (!cancelled) setLoadingPreview(false);
        }
      })();
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [fromUser, onError]);

  // Same person, new PC — keep replacement name in sync with current user.
  useEffect(() => {
    if (mode === "new_pc" && fromUser.trim()) {
      setToUser(fromUser.trim());
    }
  }, [mode, fromUser]);

  useEffect(() => {
    if (mode === "new_pc" && selectedAudit) {
      setDepartmentId(selectedAudit.department_id ?? "");
      // Keep the same employee name — new PC only; do not rename from the audit row.
      if (fromUser.trim()) setToUser(fromUser.trim());
    }
  }, [mode, selectedAudit, fromUser]);

  const auditResults = useMemo(() => {
    const q = auditQuery.trim();
    const matched = q ? allAudits.filter((a) => auditMatchesQuery(a, q)) : allAudits;
    return matched.slice(0, 40);
  }, [allAudits, auditQuery]);

  const selectedCount = selectedIds.size;
  const allSelected = preview.length > 0 && selectedCount === preview.length;

  const toggleAsset = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(preview.map((a) => a.id)));
  };

  const sameUser =
    !!fromUser.trim() &&
    !!toUser.trim() &&
    fromUser.trim().toLowerCase() === toUser.trim().toLowerCase();

  const canSubmit =
    !!fromUser.trim() &&
    !!toUser.trim() &&
    selectedCount > 0 &&
    !saving &&
    (mode === "new_pc"
      ? !!selectedAudit && sameUser
      : !sameUser);

  const submit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    try {
      const res = await transferAssets({
        fromUser: fromUser.trim(),
        toUser: toUser.trim(),
        assetIds: [...selectedIds],
        departmentId: departmentId || undefined,
        notes: notes.trim() || undefined,
        ...(mode === "new_pc" && selectedAudit
          ? { targetAuditId: selectedAudit.id }
          : {}),
      });
      const dest = res.targetComputerName
        ? ` → ${res.targetComputerName}`
        : ` from ${res.fromUser} to ${res.toUser}`;
      onDone(
        `Transferred ${res.transferred} asset${res.transferred === 1 ? "" : "s"}` +
          (res.auditsUpdated
            ? ` and updated ${res.auditsUpdated} IT Audit record${res.auditsUpdated === 1 ? "" : "s"}`
            : "") +
          (res.targetComputerName
            ? ` for ${res.toUser}${dest}.`
            : `${dest}.`),
      );
    } catch (e) {
      onError(e instanceof Error ? e.message : "Transfer failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-sky-500/20 bg-sky-500/5 px-3 py-2.5 text-xs text-sky-200/90">
        <p className="font-medium text-sky-200">
          {mode === "new_pc" ? "Same person, new computer" : "Resign / change user"}
        </p>
        <p className="mt-1">
          {mode === "new_pc"
            ? "Pick the employee and their new IT Audit workstation. Select the laptop/desktop plus printers and other peripherals to move together — Device History and IT Audit fields update even when the name stays the same."
            : "Search the current user, then the replacement. Uncheck any devices that should stay with the current user — only selected assets move."}
        </p>
      </div>

      <Field label="Transfer type">
        <div
          data-tour="history-transfer-type"
          className="inline-flex rounded-lg border border-slate-600 p-0.5"
        >
          <button
            type="button"
            onClick={() => {
              setMode("resign");
              setSelectedAudit(null);
              setAuditQuery("");
            }}
            className={`rounded-md px-3 py-1.5 text-sm transition ${
              mode === "resign" ? "bg-[#2E7D9A] text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Different user
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("new_pc");
              if (fromUser.trim()) setToUser(fromUser.trim());
            }}
            className={`rounded-md px-3 py-1.5 text-sm transition ${
              mode === "new_pc" ? "bg-[#2E7D9A] text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Same user, new PC
          </button>
        </div>
      </Field>

      <div data-tour="history-transfer-from">
        <UserSearchField
          label={mode === "new_pc" ? "Employee" : "Current user (resigning / leaving)"}
          value={fromUser}
          onChange={setFromUser}
          options={assignees}
          loading={loadingAssignees}
          placeholder="Type to search current user…"
          hint="Must already have assigned assets."
        />
      </div>

      {mode === "resign" ? (
        <UserSearchField
          label="New user (replacement)"
          value={toUser}
          onChange={setToUser}
          options={assignees}
          loading={loadingAssignees}
          exclude={fromUser}
          allowCustom
          placeholder="Type to search or enter new name…"
          hint="Pick from the list or type a brand-new employee name."
        />
      ) : (
        <Field label="New workstation (IT Audit)">
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
                    {auditQuery.trim() ? "No matching audits" : "No audits available"}
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
            Create the new IT Audit for the new PC first, then select it here. Printers and other
            peripherals in the selection move with the user.
          </p>
        </Field>
      )}

      <Field label="Department (optional)">
        <select
          className={selectClass}
          value={departmentId}
          onChange={(e) => setDepartmentId(e.target.value)}
        >
          <option value="">Keep each asset’s department</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Notes (optional)">
        <textarea
          className={inputClass}
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={
            mode === "new_pc"
              ? "e.g. PC upgrade — moved with printer/monitor"
              : "e.g. Resignation — devices reassigned"
          }
        />
      </Field>

      <section
        data-tour="history-transfer-assets"
        className="rounded-xl border border-slate-700/60 bg-slate-900/30"
      >
        <div className="flex items-center justify-between gap-2 border-b border-slate-700/60 px-4 py-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-[#2E7D9A]" />
            <h3 className="text-sm font-semibold text-white">
              Assets under this user
              {!loadingPreview && fromUser
                ? ` (${selectedCount}/${preview.length} selected)`
                : ""}
            </h3>
          </div>
          {preview.length > 0 && !loadingPreview ? (
            <button
              type="button"
              onClick={toggleAll}
              className="text-xs font-medium text-[#2E7D9A] hover:text-[#4a9bb8]"
            >
              {allSelected ? "Deselect all" : "Select all"}
            </button>
          ) : null}
        </div>
        <div className="max-h-64 overflow-y-auto p-3">
          {loadingPreview ? (
            <p className="flex items-center gap-2 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </p>
          ) : !fromUser ? (
            <p className="text-sm text-slate-500">Search and select a current user to preview assets.</p>
          ) : preview.length === 0 ? (
            <p className="text-sm text-slate-500">No assets assigned to this user.</p>
          ) : (
            <ul className="space-y-2">
              {preview.map((a) => {
                const checked = selectedIds.has(a.id);
                const { title, meta } = assetTransferLabel(a);
                return (
                  <li key={a.id}>
                    <label
                      className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2 text-sm transition ${
                        checked
                          ? "border-[#2E7D9A]/50 bg-[#2E7D9A]/10"
                          : "border-slate-700/60 bg-slate-950/40 hover:border-slate-600"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 rounded border-slate-600 bg-slate-900 text-[#2E7D9A] focus:ring-[#2E7D9A]"
                        checked={checked}
                        onChange={() => toggleAsset(a.id)}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block font-mono text-xs text-[#2E7D9A]">{a.asset_code}</span>
                        <span className="block font-medium text-white">{title}</span>
                        <span className="block text-xs text-slate-400">
                          {meta || "-"}
                        </span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      <button
        type="button"
        data-tour="history-transfer-submit"
        disabled={!canSubmit}
        onClick={() => void submit()}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#2E7D9A] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#256b85] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
        {saving
          ? "Transferring…"
          : mode === "new_pc"
            ? `Move ${selectedCount || ""} asset${selectedCount === 1 ? "" : "s"} to new PC`
            : `Transfer ${selectedCount || ""} asset${selectedCount === 1 ? "" : "s"}`}
      </button>
    </div>
  );
}
