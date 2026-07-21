"use client";

import { Building2, Contact, FileText, Tags } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Field, inputClass, selectClass } from "@/components/Drawer";
import { REFERENCE_DATA } from "@/lib/reference-data";
import { labelEnum } from "@/lib/labels";
import {
  parseCategoriesCsv,
  SUPPLIER_CATEGORY_META,
  type SupplierCategory,
} from "@/lib/supplier-form";

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

export function SupplierForm({
  form,
  onChange,
  fieldErrors = {},
  readOnly = false,
}: {
  form: Record<string, string>;
  onChange: (form: Record<string, string>) => void;
  fieldErrors?: Record<string, string>;
  readOnly?: boolean;
}) {
  const set = (patch: Record<string, string>) => onChange({ ...form, ...patch });
  const selected = parseCategoriesCsv(form.categories);

  const toggleCategory = (category: SupplierCategory) => {
    if (readOnly) return;
    const next = selected.includes(category)
      ? selected.filter((c) => c !== category)
      : [...selected, category];
    set({ categories: next.join(",") });
  };

  return (
    <div className="space-y-4">
      <FormSection
        id="supplier-company"
        title="Company"
        description="Basic supplier identity used across IT procurement."
        icon={Building2}
      >
        <Field label="Supplier Name" required>
          <input
            className={`${inputClass} ${fieldErrors.name ? "border-red-500/60" : ""}`}
            value={form.name ?? ""}
            onChange={(e) => set({ name: e.target.value })}
            placeholder="e.g. ABC Technology Trading"
            disabled={readOnly}
          />
          <FieldError message={fieldErrors.name} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Status" required>
            <select
              className={`${selectClass} ${fieldErrors.status ? "border-red-500/60" : ""}`}
              value={form.status ?? "ACTIVE"}
              onChange={(e) => set({ status: e.target.value })}
              disabled={readOnly}
            >
              {REFERENCE_DATA.supplierStatuses.map((s) => (
                <option key={s} value={s}>
                  {labelEnum(s)}
                </option>
              ))}
            </select>
            <FieldError message={fieldErrors.status} />
          </Field>
          <Field label="Website">
            <input
              className={`${inputClass} ${fieldErrors.website ? "border-red-500/60" : ""}`}
              value={form.website ?? ""}
              onChange={(e) => set({ website: e.target.value })}
              placeholder="https://example.com"
              disabled={readOnly}
            />
            <FieldError message={fieldErrors.website} />
          </Field>
        </div>
      </FormSection>

      <FormSection
        id="supplier-contact"
        title="Contact"
        description="Primary person and channels for quotes and support."
        icon={Contact}
      >
        <Field label="Contact Person">
          <input
            className={inputClass}
            value={form.contactPerson ?? ""}
            onChange={(e) => set({ contactPerson: e.target.value })}
            placeholder="Full name"
            disabled={readOnly}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Email">
            <input
              type="email"
              className={`${inputClass} ${fieldErrors.email ? "border-red-500/60" : ""}`}
              value={form.email ?? ""}
              onChange={(e) => set({ email: e.target.value })}
              placeholder="sales@example.com"
              disabled={readOnly}
            />
            <FieldError message={fieldErrors.email} />
          </Field>
          <Field label="Phone">
            <input
              className={inputClass}
              value={form.phone ?? ""}
              onChange={(e) => set({ phone: e.target.value })}
              placeholder="+63 ..."
              disabled={readOnly}
            />
          </Field>
        </div>
        <Field label="Address">
          <textarea
            className={`${inputClass} min-h-[4.5rem] resize-y`}
            value={form.address ?? ""}
            onChange={(e) => set({ address: e.target.value })}
            placeholder="Office or warehouse address"
            disabled={readOnly}
          />
        </Field>
      </FormSection>

      <FormSection
        id="supplier-categories"
        title="Supply Categories"
        description="What IT assets this supplier can provide."
        icon={Tags}
      >
        <div className="grid gap-2 sm:grid-cols-2">
          {REFERENCE_DATA.supplierCategories.map((category) => {
            const meta = SUPPLIER_CATEGORY_META[category];
            const checked = selected.includes(category);
            return (
              <label
                key={category}
                className={`flex cursor-pointer gap-3 rounded-xl border p-3 transition ${
                  checked
                    ? "border-[#2E7D9A]/60 bg-[#2E7D9A]/10 ring-1 ring-[#2E7D9A]/30"
                    : "border-slate-700 bg-slate-900/40 hover:border-slate-600"
                } ${readOnly ? "cursor-default opacity-80" : ""}`}
              >
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={checked}
                  onChange={() => toggleCategory(category)}
                  disabled={readOnly}
                />
                <span>
                  <span className="block text-sm font-medium text-white">{meta.label}</span>
                  <span className="mt-0.5 block text-xs text-slate-400">{meta.description}</span>
                </span>
              </label>
            );
          })}
        </div>
      </FormSection>

      <FormSection id="supplier-notes" title="Notes" description="Optional procurement notes." icon={FileText}>
        <Field label="Notes">
          <textarea
            className={`${inputClass} min-h-[5rem] resize-y`}
            value={form.notes ?? ""}
            onChange={(e) => set({ notes: e.target.value })}
            placeholder="Payment terms, preferred brands, SLA notes..."
            disabled={readOnly}
          />
        </Field>
      </FormSection>
    </div>
  );
}
