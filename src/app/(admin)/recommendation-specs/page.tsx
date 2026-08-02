"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  ChevronDown,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  Pencil,
  Printer,
} from "lucide-react";
import { Drawer } from "@/components/Drawer";
import { Header } from "@/components/Header";
import { TourEmptyCta, TourNudge, useTourHint } from "@/components/TourNudge";
import { SpotlightTour, shouldAutoStartTour, type TourStep } from "@/components/SpotlightTour";
import { Skeleton, TableSkeleton } from "@/components/TableSkeleton";
import {
  buildUpdateBody,
  formFromSpec,
  validateSpecForm,
  type SpecFormState,
} from "@/lib/recommendation-spec-form";
import { useSessionUser } from "@/components/SessionContext";
import {
  fetchRecommendationSpecs,
  updateRecommendationSpec,
} from "@/lib/api/recommendation-specs";
import { canWrite } from "@/lib/auth/permissions";
import {
  exportRecommendationSpecsExcel,
  exportRecommendationSpecsPdf,
  printRecommendationSpecs,
  type RecommendationSpecExportRow,
} from "@/lib/export-recommendation-specs";
import {
  RECOMMENDATION_SPECS_TOUR_STORAGE_KEY,
  getRecommendationSpecsTourSteps,
} from "@/lib/tours/recommendation-specs";
import type {
  RecommendationSpec,
  RecommendationSpecItem,
  SpecAudience,
  SpecDeviceType,
} from "@/lib/types";

const RecommendationSpecForm = dynamic(
  () =>
    import("@/components/RecommendationSpecForm").then((m) => m.RecommendationSpecForm),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    ),
  },
);

function audienceLabel(audience: SpecAudience) {
  return audience === "ENGINEER" ? "Engineer" : "Non-Engineer";
}

function deviceLabel(device: SpecDeviceType) {
  return device === "LAPTOP" ? "Laptop" : "Desktop";
}

function buildComparisonRows(
  minimum: RecommendationSpecItem[],
  recommended: RecommendationSpecItem[],
): RecommendationSpecExportRow[] {
  const byComponent = new Map<
    string,
    RecommendationSpecExportRow & { order: number }
  >();

  minimum.forEach((row, i) => {
    byComponent.set(row.component.toLowerCase(), {
      component: row.component,
      minimum: row.specification,
      recommended: "",
      order: i,
    });
  });

  recommended.forEach((row, i) => {
    const key = row.component.toLowerCase();
    const existing = byComponent.get(key);
    if (existing) {
      existing.recommended = row.specification;
    } else {
      byComponent.set(key, {
        component: row.component,
        minimum: "",
        recommended: row.specification,
        order: minimum.length + i,
      });
    }
  });

  return [...byComponent.values()]
    .sort((a, b) => a.order - b.order)
    .map(({ component, minimum: min, recommended: rec }) => ({
      component,
      minimum: min,
      recommended: rec,
    }));
}

function PillGroup<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-slate-400">{label}</span>
      <div
        role="tablist"
        aria-label={label}
        className="inline-flex rounded-lg border border-slate-600/80 bg-slate-900/50 p-0.5"
      >
        {options.map((opt) => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(opt.value)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-[#2E7D9A] text-white shadow-sm"
                  : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-200"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SpecComparisonTable({ rows }: { rows: RecommendationSpecExportRow[] }) {
  return (
    <section
      data-tour="specs-table"
      className="overflow-hidden rounded-xl border border-slate-700/60 bg-[#1E293B]/60 print:border-slate-300 print:bg-white"
    >
      <div className="flex items-center justify-between gap-2 border-b border-slate-700/60 px-4 py-3 print:border-slate-300">
        <h3 className="text-sm font-semibold text-white print:text-slate-900">
          Requirements comparison
        </h3>
        <span className="rounded-full bg-[#2E7D9A]/15 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[#4FB0CE] ring-1 ring-[#2E7D9A]/30 print:bg-slate-100 print:text-slate-700 print:ring-slate-300">
          {rows.length} component{rows.length === 1 ? "" : "s"}
        </span>
      </div>
      {rows.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-slate-500">No components defined.</p>
      ) : (
        <table className="data-table data-table--fixed">
          <thead>
            <tr>
              <th className="cell-wrap w-[18%]">Component</th>
              <th className="cell-wrap w-[41%]">Minimum</th>
              <th className="cell-wrap w-[41%]">Recommended</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.component}>
                <td className="cell-wrap align-top font-medium text-slate-200 print:text-slate-900">
                  {row.component}
                </td>
                <td className="cell-wrap align-top text-slate-300 print:text-slate-700">
                  {row.minimum || "—"}
                </td>
                <td className="cell-wrap align-top text-slate-300 print:text-slate-700">
                  {row.recommended || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function RecommendationSpecsSkeleton() {
  return (
    <div className="space-y-4 print:hidden" aria-busy="true" aria-label="Loading recommendation specs">
      <div className="rounded-xl border border-slate-700/60 bg-[#1E293B]/60 px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="mt-3 h-6 w-72 max-w-full" />
        <Skeleton className="mt-2 h-4 w-96 max-w-full" />
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-700/60 bg-[#1E293B]/60">
        <div className="flex items-center justify-between gap-2 border-b border-slate-700/60 px-4 py-3">
          <Skeleton className="h-4 w-44" />
          <Skeleton className="h-5 w-24 rounded-full" />
        </div>
        <table className="data-table data-table--fixed">
          <thead>
            <tr>
              <th className="w-[18%]">Component</th>
              <th className="w-[41%]">Minimum</th>
              <th className="w-[41%]">Recommended</th>
            </tr>
          </thead>
          <tbody>
            <TableSkeleton columns={3} rows={10} />
          </tbody>
        </table>
      </section>
    </div>
  );
}

export default function RecommendationSpecsPage() {
  const user = useSessionUser();
  const write = canWrite(user);
  const [items, setItems] = useState<RecommendationSpec[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [audience, setAudience] = useState<SpecAudience>("NON_ENGINEER");
  const [deviceType, setDeviceType] = useState<SpecDeviceType>("LAPTOP");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<SpecFormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const { showHint, showPulse, dismissHint } = useTourHint(RECOMMENDATION_SPECS_TOUR_STORAGE_KEY, tourOpen, user.id);
  const startTour = () => {
    dismissHint();
    setTourOpen(true);
  };
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const tourAutoStarted = useRef(false);
  const tourOpenedForm = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchRecommendationSpecs();
      setItems(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load recommendation specs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // First visit: auto-start the spotlight tour once loading settles.
  useEffect(() => {
    if (tourAutoStarted.current || loading) return;
    if (!shouldAutoStartTour(RECOMMENDATION_SPECS_TOUR_STORAGE_KEY)) return;
    tourAutoStarted.current = true;
    const t = window.setTimeout(() => setTourOpen(true), 450);
    return () => window.clearTimeout(t);
  }, [loading]);

  useEffect(() => {
    if (!exportMenuOpen) return;
    function onDocClick(e: MouseEvent) {
      if (!exportMenuRef.current?.contains(e.target as Node)) {
        setExportMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [exportMenuOpen]);

  const active = useMemo(
    () => items.find((s) => s.audience === audience && s.device_type === deviceType) ?? null,
    [items, audience, deviceType],
  );

  const comparisonRows = useMemo(
    () =>
      buildComparisonRows(
        (active?.items ?? []).filter((i) => i.tier === "MINIMUM"),
        (active?.items ?? []).filter((i) => i.tier === "RECOMMENDED"),
      ),
    [active],
  );

  function exportMeta() {
    if (!active) return null;
    return {
      title: active.title,
      audience: audienceLabel(active.audience),
      deviceType: deviceLabel(active.device_type),
      forRoles: active.for_roles,
      updatedAt: active.updated_at,
    };
  }

  async function runExport(kind: "excel" | "pdf") {
    const meta = exportMeta();
    if (!meta || comparisonRows.length === 0) return;
    setExportMenuOpen(false);
    setExporting(true);
    try {
      if (kind === "excel") {
        await exportRecommendationSpecsExcel(meta, comparisonRows);
      } else {
        exportRecommendationSpecsPdf(meta, comparisonRows);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed");
    } finally {
      setExporting(false);
    }
  }

  function handlePrint() {
    const meta = exportMeta();
    if (!meta) return;
    try {
      printRecommendationSpecs(meta, comparisonRows);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Print failed");
    }
  }

  function openEdit() {
    if (!active) return;
    setForm(formFromSpec(active));
    setSaveError(null);
    setEditing(true);
  }

  const tourSteps = useMemo(() => getRecommendationSpecsTourSteps(write), [write]);

  const handleTourStepChange = useCallback(
    (step: TourStep | null) => {
      const needsForm = Boolean(step?.id?.startsWith("specs-form"));
      if (needsForm) {
        if (!active) return;
        if (!tourOpenedForm.current) {
          setForm(formFromSpec(active));
          setSaveError(null);
          tourOpenedForm.current = true;
        }
        setEditing(true);
        return;
      }
      if (tourOpenedForm.current) {
        if (!saving) {
          setEditing(false);
          setForm(null);
        }
        tourOpenedForm.current = false;
      }
    },
    [active, saving],
  );

  async function handleSave() {
    if (!active || !form) return;
    const validation = validateSpecForm(form);
    if (validation) {
      setSaveError(validation);
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const updated = await updateRecommendationSpec(active.id, buildUpdateBody(form));
      setItems((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      setEditing(false);
      setForm(null);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="print:hidden">
        <Header
          title="Recommendation Specs"
          subtitle="Standard equipment specs for laptop and desktop procurement"
          onHowItWorks={startTour}
          howItWorksPulse={showPulse}
        />
      </div>
      <div className="page-content flex-1 space-y-4 overflow-y-auto">
        <TourNudge show={showHint} onDismiss={dismissHint} onStart={startTour} />
        <div className="flex flex-col gap-3 rounded-xl border border-slate-700/60 bg-[#1E293B]/60 p-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:p-4 print:hidden">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <div data-tour="specs-audience">
              <PillGroup
                label="Audience"
                value={audience}
                onChange={setAudience}
                options={[
                  { value: "NON_ENGINEER", label: "Non-Engineer" },
                  { value: "ENGINEER", label: "Engineer" },
                ]}
              />
            </div>
            <div data-tour="specs-device">
              <PillGroup
                label="Device type"
                value={deviceType}
                onChange={setDeviceType}
                options={[
                  { value: "LAPTOP", label: "Laptop" },
                  { value: "DESKTOP", label: "Desktop" },
                ]}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <button
              type="button"
              data-tour="specs-print"
              onClick={handlePrint}
              disabled={loading || !active || comparisonRows.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Printer className="h-4 w-4" />
              Print
            </button>
            <div className="relative" ref={exportMenuRef} data-tour="specs-export">
              <button
                type="button"
                onClick={() => setExportMenuOpen((o) => !o)}
                disabled={loading || exporting || !active || comparisonRows.length === 0}
                aria-haspopup="menu"
                aria-expanded={exportMenuOpen}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                {exporting ? "Exporting..." : "Export"}
                {!exporting && <ChevronDown className="h-4 w-4" />}
              </button>
              {exportMenuOpen && !exporting && (
                <div
                  role="menu"
                  className="absolute right-0 z-20 mt-1 w-full min-w-[14rem] overflow-hidden rounded-lg border border-slate-700 bg-slate-900 shadow-lg sm:w-auto"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => void runExport("excel")}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-200 hover:bg-slate-800"
                  >
                    <FileSpreadsheet className="h-4 w-4 text-emerald-400" /> Export as Excel
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => void runExport("pdf")}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-200 hover:bg-slate-800"
                  >
                    <FileText className="h-4 w-4 text-red-400" /> Export as PDF
                  </button>
                </div>
              )}
            </div>
            {write && active && (
              <button
                type="button"
                data-tour="specs-edit"
                onClick={openEdit}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#2E7D9A] px-4 py-2 text-sm font-medium text-white hover:bg-[#256b85]"
              >
                <Pencil className="h-4 w-4" />
                Edit specs
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <RecommendationSpecsSkeleton />
        ) : error ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-6 text-center text-sm text-red-300 print:hidden">
            {error}
          </div>
        ) : !active ? (
          <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-700 px-4 py-12 text-center text-sm text-slate-500 print:hidden">
            <p>
              No catalog found for {audienceLabel(audience)} · {deviceLabel(deviceType)}. Run the
              backend seed to populate default specs.
            </p>
            <TourEmptyCta onStart={startTour} />
          </div>
        ) : (
          <div className="space-y-4">
            <div
              data-tour="specs-summary"
              className="rounded-xl border border-slate-700/60 bg-[#1E293B]/60 px-4 py-4 sm:px-5 print:border-slate-300 print:bg-white"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#2E7D9A]/15 px-2.5 py-0.5 text-[11px] font-medium text-[#4FB0CE] ring-1 ring-[#2E7D9A]/30 print:bg-slate-100 print:text-slate-700 print:ring-slate-300">
                  {audienceLabel(active.audience)}
                </span>
                <span className="rounded-full bg-slate-500/15 px-2.5 py-0.5 text-[11px] font-medium text-slate-300 ring-1 ring-slate-500/30 print:bg-slate-100 print:text-slate-700 print:ring-slate-300">
                  {deviceLabel(active.device_type)}
                </span>
              </div>
              <h2 className="mt-2 text-lg font-semibold text-white print:text-slate-900">{active.title}</h2>
              {active.for_roles && (
                <p className="mt-1 text-sm text-slate-300 print:text-slate-700">
                  <span className="text-slate-500 print:text-slate-500">For:</span> {active.for_roles}
                </p>
              )}
            </div>

            <SpecComparisonTable rows={comparisonRows} />
          </div>
        )}
      </div>

      <Drawer
        open={editing && !!form}
        dataTour={editing && form ? "specs-form-drawer" : undefined}
        title="Edit recommendation specs"
        subtitle={active ? `${audienceLabel(active.audience)} · ${deviceLabel(active.device_type)}` : undefined}
        onClose={() => {
          if (saving) return;
          setEditing(false);
          setForm(null);
        }}
        wide
        footer={
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            {saveError && (
              <p className="flex-1 text-sm text-red-300 sm:self-center">{saveError}</p>
            )}
            <button
              type="button"
              disabled={saving}
              onClick={() => {
                setEditing(false);
                setForm(null);
              }}
              className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              data-tour="specs-form-save"
              disabled={saving}
              onClick={() => void handleSave()}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#2E7D9A] px-4 py-2 text-sm font-medium text-white hover:bg-[#256b85] disabled:opacity-60"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save changes
            </button>
          </div>
        }
      >
        {form && <RecommendationSpecForm form={form} onChange={setForm} />}
      </Drawer>

      <div className="print:hidden">
        <SpotlightTour
          open={tourOpen}
          steps={tourSteps}
          storageKey={RECOMMENDATION_SPECS_TOUR_STORAGE_KEY}
          onStepChange={handleTourStepChange}
          onClose={() => setTourOpen(false)}
        />
      </div>
    </div>
  );
}
