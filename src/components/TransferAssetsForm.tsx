"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Loader2, Search, Users, X } from "lucide-react";
import { Field, inputClass, selectClass } from "@/components/Drawer";
import {
  fetchAssetsByUser,
  fetchDeviceHistoryAssignees,
  transferAssets,
} from "@/lib/api/device-history";
import { labelEnum } from "@/lib/labels";
import type { Asset, Department } from "@/lib/types";

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
            if (e.key === "Escape") {
              setOpen(false);
              if (!allowCustom) setQuery(value);
            }
          }}
          onBlur={() => {
            // delay so click on option can register
            window.setTimeout(() => {
              if (!rootRef.current?.contains(document.activeElement)) {
                commitCustom();
              }
            }, 120);
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
              setOpen(true);
            }}
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
        {open && !loading && (
          <ul className="absolute z-30 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-slate-600 bg-slate-900 py-1 shadow-xl">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-slate-500">
                {allowCustom && query.trim()
                  ? `Press Enter to use “${query.trim()}”`
                  : "No matching user"}
              </li>
            ) : (
              filtered.map((name) => (
                <li key={name}>
                  <button
                    type="button"
                    className={`flex w-full px-3 py-2 text-left text-sm hover:bg-slate-800 ${
                      name === value ? "bg-[#2E7D9A]/15 text-white" : "text-slate-200"
                    }`}
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

  const canSubmit =
    !!fromUser.trim() &&
    !!toUser.trim() &&
    fromUser.trim().toLowerCase() !== toUser.trim().toLowerCase() &&
    selectedCount > 0 &&
    !saving;

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
      });
      onDone(
        `Transferred ${res.transferred} asset${res.transferred === 1 ? "" : "s"}` +
          (res.auditsUpdated
            ? ` and updated ${res.auditsUpdated} IT Audit record${res.auditsUpdated === 1 ? "" : "s"}`
            : "") +
          ` from ${res.fromUser} to ${res.toUser}.`,
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
        <p className="font-medium text-sky-200">Resign / change user</p>
        <p className="mt-1">
          Search the current user, then the replacement. Uncheck any devices that should stay with
          the current user — only selected assets move.
        </p>
      </div>

      <UserSearchField
        label="Current user (resigning / leaving)"
        value={fromUser}
        onChange={setFromUser}
        options={assignees}
        loading={loadingAssignees}
        placeholder="Type to search current user…"
        hint="Must already have assigned assets."
      />

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
          placeholder="e.g. Resignation — devices reassigned"
        />
      </Field>

      <section className="rounded-xl border border-slate-700/60 bg-slate-900/30">
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
        disabled={!canSubmit}
        onClick={() => void submit()}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#2E7D9A] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#256b85] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
        {saving
          ? "Transferring…"
          : `Transfer ${selectedCount || ""} asset${selectedCount === 1 ? "" : "s"}`}
      </button>
    </div>
  );
}
