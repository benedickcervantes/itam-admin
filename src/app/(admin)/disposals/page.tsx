"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  LayoutGrid,
  List,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/Badge";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DisposalDetailView } from "@/components/DisposalDetailView";
import { DisposalForm } from "@/components/DisposalForm";
import { Drawer } from "@/components/Drawer";
import { ActiveFilters } from "@/components/ActiveFilters";
import { FilterSearch, FilterSelect } from "@/components/FilterSelect";
import { Header } from "@/components/Header";
import { TourEmptyCta, TourNudge, useTourHint } from "@/components/TourNudge";
import { Pagination } from "@/components/Pagination";
import { SpotlightTour, shouldAutoStartTour, type TourStep } from "@/components/SpotlightTour";
import { CardGridSkeleton, TableSkeleton } from "@/components/TableSkeleton";
import { useSessionUser } from "@/components/SessionContext";
import { fetchAssets } from "@/lib/api/assets";
import { fetchEmployeeNames } from "@/lib/api/auditRegisters";
import {
  createDisposal,
  deleteDisposal,
  fetchAllDisposals,
  fetchDisposals,
  updateDisposal,
} from "@/lib/api/disposals";
import { verifyPassword } from "@/lib/api/auth";
import { canWrite } from "@/lib/auth/permissions";
import { DisposalExportColumnDialog } from "@/components/DisposalExportColumnDialog";
import {
  ALL_DISPOSAL_EXPORT_COLUMN_KEYS,
  exportDisposalsExcel,
  exportDisposalsPdf,
  type DisposalExportColumnKey,
} from "@/lib/export-disposals";
import { todayIso, validateDisposalForm } from "@/lib/disposal-form";
import { REFERENCE_DATA } from "@/lib/reference-data";
import { labelEnum } from "@/lib/labels";
import { DISPOSALS_TOUR_STORAGE_KEY, getDisposalsTourSteps } from "@/lib/tours/disposals";
import type { Asset, DisposalRecord } from "@/lib/types";

type ViewMode = "table" | "grid";
type DrawerMode = "create" | "view" | "edit";

const VIEW_MODE_STORAGE_KEY = "disposals-view";

function readStoredViewMode(): ViewMode {
  if (typeof window === "undefined") return "table";
  const saved = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
  return saved === "grid" ? "grid" : "table";
}

function emptyForm(): Record<string, string> {
  return { assetId: "", disposalDate: todayIso(), disposalReason: "" };
}

function formFromRecord(row: DisposalRecord): Record<string, string> {
  return {
    assetId: row.asset_id,
    disposalDate: row.disposal_date.slice(0, 10),
    disposalReason: row.disposal_reason,
    disposalMethod: row.disposal_method ?? "",
    certificateDocNo: row.certificate_doc_no ?? "",
    approvedBy: row.approved_by ?? "",
    witness: row.witness ?? "",
    notes: row.notes ?? "",
  };
}

export default function DisposalsPage() {
  const user = useSessionUser();
  const write = canWrite(user);
  const [items, setItems] = useState<DisposalRecord[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [employees, setEmployees] = useState<string[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>("create");
  const [editing, setEditing] = useState<DisposalRecord | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>(readStoredViewMode);
  const [exporting, setExporting] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DisposalRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [tourOpen, setTourOpen] = useState(false);
  const { showHint, showPulse, dismissHint } = useTourHint(DISPOSALS_TOUR_STORAGE_KEY, tourOpen, user.id);
  const startTour = () => {
    dismissHint();
    setTourOpen(true);
  };
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const loadSeq = useRef(0);
  const tourAutoStarted = useRef(false);
  const tourOpenedForm = useRef(false);

  const changeViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
  };

  useEffect(() => {
    if (!exportMenuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setExportMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [exportMenuOpen]);

  const buildFilterSummary = () => {
    const parts: string[] = [];
    if (search) parts.push(`Search: "${search}"`);
    if (methodFilter) parts.push(`Method: ${labelEnum(methodFilter)}`);
    return parts.length ? parts.join(" · ") : "None (all records)";
  };

  const buildExportFilterSummary = (columns: DisposalExportColumnKey[]) => {
    const parts = [buildFilterSummary()];
    if (columns.length < ALL_DISPOSAL_EXPORT_COLUMN_KEYS.length) {
      parts.push(`Columns: ${columns.length} of ${ALL_DISPOSAL_EXPORT_COLUMN_KEYS.length}`);
    }
    return parts.join(" · ");
  };

  const runExport = async (
    format: "excel" | "pdf",
    columns: DisposalExportColumnKey[] = ALL_DISPOSAL_EXPORT_COLUMN_KEYS,
  ) => {
    if (exporting) return;
    if (columns.length === 0) {
      setError("Select at least one column to export.");
      setExportDialogOpen(true);
      return;
    }
    setExportMenuOpen(false);
    setExporting(true);
    setError("");
    setSuccess("");
    try {
      const rows = await fetchAllDisposals({
        search: search || undefined,
        disposalMethod: methodFilter || undefined,
      });
      if (rows.length === 0) {
        setError("No disposal records match the current filters to export.");
        return;
      }
      const filterSummary = buildExportFilterSummary(columns);
      if (format === "excel") {
        await exportDisposalsExcel(rows, filterSummary, columns);
      } else {
        exportDisposalsPdf(rows, filterSummary, columns);
      }
      const label = format === "excel" ? "Excel" : "PDF";
      setSuccess(
        `Exported ${rows.length} disposal ${rows.length === 1 ? "record" : "records"} to ${label} (${columns.length} column${columns.length === 1 ? "" : "s"}).`,
      );
      setExportDialogOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed");
    } finally {
      setExporting(false);
    }
  };

  const load = useCallback(async () => {
    const seq = ++loadSeq.current;
    setLoading(true);
    try {
      const res = await fetchDisposals({
        page,
        search: search || undefined,
        disposalMethod: methodFilter || undefined,
      });
      if (seq !== loadSeq.current) return;
      if (res.totalPages > 0 && page > res.totalPages) {
        setPage(1);
        return;
      }
      setItems(res.items);
      setTotalPages(Math.max(1, res.totalPages || 1));
      setError("");
    } catch (e) {
      if (seq !== loadSeq.current) return;
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      if (seq === loadSeq.current) setLoading(false);
    }
  }, [page, search, methodFilter]);

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [search, methodFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!success) return;
    const timer = window.setTimeout(() => setSuccess(""), 5000);
    return () => window.clearTimeout(timer);
  }, [success]);

  useEffect(() => {
    fetchAssets({ limit: 200 }).then((r) => setAssets(r.items)).catch(() => {});
  }, []);

  const loadEmployees = useCallback(() => {
    fetchEmployeeNames()
      .then(setEmployees)
      .catch(() => setEmployees([]));
  }, []);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  // First visit: auto-start the spotlight tour once loading settles.
  useEffect(() => {
    if (tourAutoStarted.current || loading) return;
    if (!shouldAutoStartTour(DISPOSALS_TOUR_STORAGE_KEY)) return;
    tourAutoStarted.current = true;
    const t = window.setTimeout(() => setTourOpen(true), 450);
    return () => window.clearTimeout(t);
  }, [loading]);

  const openCreate = () => {
    loadEmployees();
    setEditing(null);
    setForm(emptyForm());
    setDrawerMode("create");
    setSaving(false);
    setError("");
    setFieldErrors({});
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSaving(false);
    setDrawerMode("create");
    setError("");
    setFieldErrors({});
  };

  const tourSteps = useMemo(() => getDisposalsTourSteps(write), [write]);

  const handleTourStepChange = useCallback(
    (step: TourStep | null) => {
      const needsForm = Boolean(step?.id?.startsWith("disp-form"));
      if (needsForm) {
        if (!tourOpenedForm.current) {
          loadEmployees();
          setEditing(null);
          setForm(emptyForm());
          setSaving(false);
          setError("");
          setFieldErrors({});
          tourOpenedForm.current = true;
        }
        setDrawerMode("create");
        setDrawerOpen(true);
        return;
      }
      if (tourOpenedForm.current) {
        setDrawerOpen(false);
        setSaving(false);
        setDrawerMode("create");
        setError("");
        setFieldErrors({});
        tourOpenedForm.current = false;
      }
    },
    [loadEmployees],
  );

  const openView = (row: DisposalRecord) => {
    setEditing(row);
    setForm(formFromRecord(row));
    setDrawerMode("view");
    setSaving(false);
    setError("");
    setFieldErrors({});
    setDrawerOpen(true);
  };

  const openEditForm = (row: DisposalRecord) => {
    loadEmployees();
    setEditing(row);
    setForm(formFromRecord(row));
    setDrawerMode("edit");
    setSaving(false);
    setError("");
    setFieldErrors({});
    setDrawerOpen(true);
  };

  const save = async () => {
    if (!write || saving) return;
    const mode = editing ? "edit" : "create";
    const errors = validateDisposalForm(form, mode);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setError("Please fix the highlighted fields.");
      return;
    }

    setSaving(true);
    setError("");
    const body = { ...form };
    Object.keys(body).forEach((k) => body[k] === "" && delete body[k]);
    try {
      if (editing) await updateDisposal(editing.id, body);
      else await createDisposal(body);
      setDrawerOpen(false);
      setDrawerMode("create");
      setSuccess(editing ? `Updated ${editing.record_code}.` : "Disposal record created.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async (password: string) => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await verifyPassword(password);
      await deleteDisposal(deleteTarget.id);
      const code = deleteTarget.record_code;
      setDeleteTarget(null);
      setError("");
      setSuccess(`Deleted ${code}.`);
      await load();
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const renderRowActions = (row: DisposalRecord, tourTarget = false) => (
    <div className="flex items-center gap-1" {...(tourTarget ? { "data-tour": "disp-actions" } : {})}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          openView(row);
        }}
        className={
          write
            ? "rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-[#2E7D9A]"
            : "inline-flex items-center gap-1.5 rounded-md border border-slate-700 px-2 py-1 text-xs font-medium text-slate-300 transition hover:border-[#2E7D9A]/50 hover:text-[#2E7D9A]"
        }
        title="View record"
        aria-label="View record"
      >
        <Eye className="h-4 w-4" />
        {!write && <span>View</span>}
      </button>
      {write && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openEditForm(row);
            }}
            className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-[#2E7D9A]"
            title="Edit record"
            aria-label="Edit record"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteError("");
              setDeleteTarget(row);
            }}
            className="rounded p-1 text-red-400 hover:bg-red-950/40 hover:text-red-300"
            title="Delete record"
            aria-label="Delete record"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </>
      )}
    </div>
  );

  return (
    <>
      <Header
        title="Disposals"
        subtitle="Retired and disposed assets with certificate tracking"
        onHowItWorks={startTour}
        howItWorksPulse={showPulse}
      />
      <div className="page-content flex-1 overflow-y-auto">
        <TourNudge show={showHint} onDismiss={dismissHint} onStart={startTour} />
        <div className="mb-4 space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <div data-tour="disp-search" className="w-full sm:flex-1">
            <FilterSearch
              value={searchInput}
              onChange={setSearchInput}
              placeholder="Search record, asset, computer, brand, serial, reason..."
              className="w-full"
            />
          </div>
          <div data-tour="disp-filters" className="w-full sm:w-auto">
            <FilterSelect
              label="Method"
              value={methodFilter}
              onChange={(v) => {
                setPage(1);
                setMethodFilter(v);
              }}
              className="w-full sm:w-auto"
            >
              <option value="">All methods</option>
              {REFERENCE_DATA.disposalMethods.map((s) => (
                <option key={s} value={s}>
                  {labelEnum(s)}
                </option>
              ))}
            </FilterSelect>
          </div>
          <div
            data-tour="disp-view-mode"
            className="inline-flex rounded-lg border border-slate-600 p-0.5"
            role="group"
            aria-label="View mode"
          >
            <button
              type="button"
              onClick={() => changeViewMode("table")}
              aria-pressed={viewMode === "table"}
              title="Table view"
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition ${
                viewMode === "table" ? "bg-[#2E7D9A] text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <List className="h-4 w-4" />
              <span className="hidden sm:inline">Table</span>
            </button>
            <button
              type="button"
              onClick={() => changeViewMode("grid")}
              aria-pressed={viewMode === "grid"}
              title="Grid view"
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition ${
                viewMode === "grid" ? "bg-[#2E7D9A] text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
              <span className="hidden sm:inline">Grid</span>
            </button>
          </div>
          <div className="relative w-full sm:w-auto" ref={exportMenuRef} data-tour="disp-export">
            <button
              type="button"
              onClick={() => setExportMenuOpen((o) => !o)}
              disabled={exporting}
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
                  onClick={() => {
                    setExportMenuOpen(false);
                    setExportDialogOpen(true);
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-200 hover:bg-slate-800"
                >
                  <Download className="h-4 w-4 text-[#2E7D9A]" />
                  Customize columns...
                  <span className="ml-auto text-xs text-slate-500">
                    {ALL_DISPOSAL_EXPORT_COLUMN_KEYS.length} columns
                  </span>
                </button>
                <div className="border-t border-slate-800" />
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
          {write && (
            <button
              type="button"
              data-tour="disp-new"
              onClick={openCreate}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#2E7D9A] px-4 py-2 text-sm font-medium text-white sm:w-auto"
            >
              <Plus className="h-4 w-4" /> New Disposal
            </button>
          )}
        </div>
          <ActiveFilters
            filters={[
              ...(search
                ? [
                    {
                      key: "search",
                      label: "Search",
                      value: search,
                      onRemove: () => {
                        setSearchInput("");
                        setSearch("");
                        setPage(1);
                      },
                    },
                  ]
                : []),
              ...(methodFilter
                ? [
                    {
                      key: "method",
                      label: "Method",
                      value: labelEnum(methodFilter),
                      onRemove: () => {
                        setMethodFilter("");
                        setPage(1);
                      },
                    },
                  ]
                : []),
            ]}
            onClearAll={() => {
              setSearchInput("");
              setSearch("");
              setMethodFilter("");
              setPage(1);
            }}
          />
        </div>

        {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
        {success && <p className="mb-3 text-sm text-emerald-400">{success}</p>}

        {viewMode === "table" ? (
          <div className="card overflow-hidden" data-tour="disp-list">
            <div className="table-scroll">
              <table className="data-table data-table--fixed" style={{ minWidth: "68rem" }}>
                <colgroup>
                  <col style={{ width: "8%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "14%" }} />
                  <col style={{ width: "14%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "22%" }} />
                  <col style={{ width: "12%" }} />
                  <col style={{ width: "10%" }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>Record ID</th>
                    <th>Asset ID</th>
                    <th className="cell-wrap">Computer</th>
                    <th className="cell-wrap">Department</th>
                    <th>Date</th>
                    <th className="cell-wrap">Reason</th>
                    <th>Method</th>
                    <th>{write ? "Actions" : "View"}</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <TableSkeleton columns={8} />
                  ) : items.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-slate-400">
                        <div className="flex flex-col items-start gap-1 py-1">
                          <span>No disposal records found.</span>
                          <TourEmptyCta onStart={startTour} />
                        </div>
                      </td>
                    </tr>
                  ) : (
                    items.map((row, rowIndex) => (
                      <tr key={row.id} className="cursor-pointer" onClick={() => openView(row)}>
                        <td className="font-mono text-[#2E7D9A]">{row.record_code}</td>
                        <td className="font-mono text-slate-300">{row.asset?.asset_code ?? "—"}</td>
                        <td className="cell-wrap font-medium text-white">
                          {row.asset?.computer_name ?? row.computer_name ?? "—"}
                        </td>
                        <td className="cell-wrap">{row.asset?.department?.name ?? "—"}</td>
                        <td className="text-slate-300">{row.disposal_date.slice(0, 10)}</td>
                        <td className="cell-wrap text-slate-300">{row.disposal_reason}</td>
                        <td>
                          <Badge value={row.disposal_method} />
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          {renderRowActions(row, rowIndex === 0)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div data-tour="disp-list">
            {loading ? (
              <CardGridSkeleton />
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center py-8">
                <p className="text-center text-sm text-slate-400">No disposal records found.</p>
                <TourEmptyCta onStart={startTour} />
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((row, rowIndex) => (
                  <article
                    key={row.id}
                    className="card cursor-pointer p-4 transition hover:border-[#2E7D9A]/50 hover:bg-slate-800/40"
                    onClick={() => openView(row)}
                  >
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-mono text-sm font-medium text-[#2E7D9A]">{row.record_code}</p>
                        <p className="mt-1 truncate text-base font-medium text-white">
                          {row.asset?.computer_name ?? row.asset?.asset_code ?? "—"}
                        </p>
                        <p className="font-mono text-xs text-slate-500">{row.asset?.asset_code}</p>
                      </div>
                      <div onClick={(e) => e.stopPropagation()}>
                        {renderRowActions(row, rowIndex === 0)}
                      </div>
                    </div>
                    <p className="line-clamp-2 text-sm text-slate-300">{row.disposal_reason}</p>
                    <dl className="mt-3 space-y-2 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <dt className="text-slate-500">Department</dt>
                        <dd className="truncate text-slate-300">{row.asset?.department?.name ?? "—"}</dd>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <dt className="text-slate-500">Disposal Date</dt>
                        <dd className="text-slate-300">{row.disposal_date.slice(0, 10)}</dd>
                      </div>
                      {row.certificate_doc_no && (
                        <div className="flex items-center justify-between gap-2">
                          <dt className="text-slate-500">Certificate</dt>
                          <dd className="truncate font-mono text-slate-300">{row.certificate_doc_no}</dd>
                        </div>
                      )}
                    </dl>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {row.disposal_method && <Badge value={row.disposal_method} />}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      <Drawer
        open={drawerOpen}
        title={
          !editing
            ? "New Disposal"
            : drawerMode === "edit"
              ? `Edit ${editing.record_code}`
              : `View ${editing.record_code}`
        }
        subtitle={
          !editing
            ? "Record a retired or disposed asset"
            : drawerMode === "edit"
              ? "Update disposal record details"
              : "Disposal record summary"
        }
        onClose={closeDrawer}
        dataTour={drawerMode === "create" && !editing ? "disp-form-drawer" : undefined}
        banner={
          drawerMode !== "view" && error ? (
            <p className="rounded-lg border border-red-900/50 bg-red-950/40 px-3 py-2 text-sm text-red-400">
              {error}
            </p>
          ) : undefined
        }
        footer={
          drawerMode === "view" && editing && write ? (
            <div className="ml-auto flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeDrawer}
                className="inline-flex h-10 w-[9rem] shrink-0 items-center justify-center rounded-lg border border-slate-600 px-3 text-sm font-medium leading-none text-slate-200 hover:bg-slate-800"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => setDrawerMode("edit")}
                className="inline-flex h-10 w-[9rem] shrink-0 items-center justify-center rounded-lg bg-[#2E7D9A] px-3 text-sm font-medium leading-none text-white hover:bg-[#256b85]"
              >
                Edit
              </button>
            </div>
          ) : drawerMode !== "view" && write ? (
            <div className="ml-auto flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={closeDrawer}
                className="inline-flex h-10 w-[9rem] shrink-0 items-center justify-center rounded-lg border border-slate-600 px-3 text-sm font-medium leading-none text-slate-200 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                data-tour={!editing ? "disp-form-save" : undefined}
                onClick={() => void save()}
                className="inline-flex h-10 w-[9rem] shrink-0 items-center justify-center gap-1.5 rounded-lg border border-transparent bg-[#2E7D9A] px-3 text-sm font-medium leading-none text-white hover:bg-[#256b85] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving && <Loader2 className="h-4 w-4 shrink-0 animate-spin" />}
                {saving ? "Saving..." : drawerMode === "create" ? "Create Disposal" : "Save Changes"}
              </button>
            </div>
          ) : undefined
        }
      >
        {drawerMode === "view" && editing ? (
          <DisposalDetailView record={editing} />
        ) : (
          <DisposalForm
            mode={drawerMode === "create" ? "create" : "edit"}
            form={form}
            onChange={setForm}
            assets={assets}
            employees={employees}
            fieldErrors={fieldErrors}
            readOnly={!write}
            assetLocked={!!editing}
          />
        )}
      </Drawer>

      <DisposalExportColumnDialog
        open={exportDialogOpen}
        filterSummary={buildFilterSummary()}
        exporting={exporting}
        onClose={() => {
          if (!exporting) setExportDialogOpen(false);
        }}
        onExport={(format, columns) => void runExport(format, columns)}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete disposal record?"
        message={
          deleteTarget
            ? `Are you sure you want to delete disposal record ${deleteTarget.record_code}? This action cannot be undone.`
            : ""
        }
        requirePassword
        error={deleteError}
        loading={deleting}
        onCancel={() => {
          if (!deleting) {
            setDeleteTarget(null);
            setDeleteError("");
          }
        }}
        onConfirm={(password) => void confirmDelete(password)}
      />

      <SpotlightTour
        open={tourOpen}
        steps={tourSteps}
        storageKey={DISPOSALS_TOUR_STORAGE_KEY}
        onStepChange={handleTourStepChange}
        onClose={() => setTourOpen(false)}
      />
    </>
  );
}
