import type { SpecTier } from "@/lib/types";

export type SpecItemFormRow = {
  key: string;
  tier: SpecTier;
  component: string;
  specification: string;
  /** Preserved on save; not shown in UI. */
  notes: string;
};

export type SpecFormState = {
  title: string;
  forRoles: string;
  /** Preserved on save; not shown in UI. */
  notes: string;
  items: SpecItemFormRow[];
};

function newKey() {
  return `row-${Math.random().toString(36).slice(2, 10)}`;
}

export function formFromSpec(spec: {
  title: string;
  for_roles?: string | null;
  notes?: string | null;
  items: Array<{
    tier: SpecTier;
    component: string;
    specification: string;
    notes?: string | null;
  }>;
}): SpecFormState {
  return {
    title: spec.title ?? "",
    forRoles: spec.for_roles ?? "",
    notes: spec.notes ?? "",
    items: [...spec.items]
      .sort((a, b) => {
        if (a.tier !== b.tier) return a.tier === "MINIMUM" ? -1 : 1;
        return 0;
      })
      .map((item) => ({
        key: newKey(),
        tier: item.tier,
        component: item.component,
        specification: item.specification,
        notes: item.notes ?? "",
      })),
  };
}

export function buildUpdateBody(form: SpecFormState) {
  const minimum = form.items.filter((r) => r.tier === "MINIMUM");
  const recommended = form.items.filter((r) => r.tier === "RECOMMENDED");
  return {
    title: form.title.trim(),
    forRoles: form.forRoles.trim() || null,
    notes: form.notes.trim() || null,
    items: [
      ...minimum.map((row, i) => ({
        tier: "MINIMUM" as const,
        sortOrder: i,
        component: row.component.trim(),
        specification: row.specification.trim(),
        notes: row.notes.trim() || null,
      })),
      ...recommended.map((row, i) => ({
        tier: "RECOMMENDED" as const,
        sortOrder: i,
        component: row.component.trim(),
        specification: row.specification.trim(),
        notes: row.notes.trim() || null,
      })),
    ],
  };
}

export function validateSpecForm(form: SpecFormState): string | null {
  if (!form.title.trim()) return "Title is required.";
  if (form.items.length === 0) return "Add at least one component row.";
  for (const row of form.items) {
    if (!row.component.trim()) return "Each row needs a component name.";
    if (!row.specification.trim()) return "Each row needs a specification.";
  }
  return null;
}

export function createEmptySpecRow(tier: SpecTier): SpecItemFormRow {
  return {
    key: newKey(),
    tier,
    component: "",
    specification: "",
    notes: "",
  };
}
