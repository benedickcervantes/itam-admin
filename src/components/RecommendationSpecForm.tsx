"use client";

import { Plus, Trash2 } from "lucide-react";
import { Field, inputClass } from "@/components/Drawer";
import {
  createEmptySpecRow,
  type SpecFormState,
  type SpecItemFormRow,
} from "@/lib/recommendation-spec-form";
import type { SpecTier } from "@/lib/types";

export type { SpecFormState, SpecItemFormRow } from "@/lib/recommendation-spec-form";
export {
  buildUpdateBody,
  formFromSpec,
  validateSpecForm,
} from "@/lib/recommendation-spec-form";

function TierEditor({
  label,
  tier,
  rows,
  onChange,
}: {
  label: string;
  tier: SpecTier;
  rows: SpecItemFormRow[];
  onChange: (rows: SpecItemFormRow[]) => void;
}) {
  const tierRows = rows.filter((r) => r.tier === tier);

  function updateRow(key: string, patch: Partial<SpecItemFormRow>) {
    onChange(rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function removeRow(key: string) {
    onChange(rows.filter((r) => r.key !== key));
  }

  function addRow() {
    onChange([...rows, createEmptySpecRow(tier)]);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-white">{label}</h3>
        <button
          type="button"
          onClick={addRow}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-600 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:border-[#2E7D9A]/50 hover:bg-[#2E7D9A]/10"
        >
          <Plus className="h-3.5 w-3.5" />
          Add row
        </button>
      </div>
      {tierRows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-700 px-3 py-4 text-center text-xs text-slate-500">
          No components yet. Add a row to define specs.
        </p>
      ) : (
        <div className="space-y-3">
          {tierRows.map((row) => (
            <div
              key={row.key}
              className="space-y-2 rounded-lg border border-slate-700/80 bg-slate-900/40 p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <Field label="Component" required>
                    <input
                      className={inputClass}
                      value={row.component}
                      onChange={(e) => updateRow(row.key, { component: e.target.value })}
                      placeholder="e.g. Processor"
                    />
                  </Field>
                </div>
                <button
                  type="button"
                  onClick={() => removeRow(row.key)}
                  className="mt-6 rounded-lg p-2 text-slate-400 hover:bg-red-500/10 hover:text-red-300"
                  aria-label="Remove row"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <Field label="Specification" required>
                <textarea
                  className={`${inputClass} min-h-[4.5rem] resize-y`}
                  value={row.specification}
                  onChange={(e) => updateRow(row.key, { specification: e.target.value })}
                  placeholder="e.g. Intel Core i5 (13th Gen+) / AMD Ryzen 5 (7000 series+)"
                />
              </Field>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function RecommendationSpecForm({
  form,
  onChange,
}: {
  form: SpecFormState;
  onChange: (next: SpecFormState) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Title" required>
          <input
            className={inputClass}
            value={form.title}
            onChange={(e) => onChange({ ...form, title: e.target.value })}
          />
        </Field>
        <Field label="For (roles / departments)">
          <input
            className={inputClass}
            value={form.forRoles}
            onChange={(e) => onChange({ ...form, forRoles: e.target.value })}
            placeholder="e.g. Admin, Finance, Sales…"
          />
        </Field>
      </div>

      <TierEditor
        label="Minimum Requirements"
        tier="MINIMUM"
        rows={form.items}
        onChange={(items) => onChange({ ...form, items })}
      />
      <TierEditor
        label="Recommended Requirements"
        tier="RECOMMENDED"
        rows={form.items}
        onChange={(items) => onChange({ ...form, items })}
      />
    </div>
  );
}
