"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  Download,
  Eye,
  FileSignature,
  FileText,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
  Users,
} from "lucide-react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Drawer } from "@/components/Drawer";
import { ActiveFilters } from "@/components/ActiveFilters";
import { FilterSearch, FilterSelect } from "@/components/FilterSelect";
import { GenerateContractForm } from "@/components/GenerateContractForm";
import { Header } from "@/components/Header";
import { Pagination } from "@/components/Pagination";
import { TableSkeleton } from "@/components/TableSkeleton";
import { useSessionUser } from "@/components/SessionContext";
import { verifyPassword } from "@/lib/api/auth";
import {
  deleteDeviceContract,
  downloadDeviceContract,
  fetchContractTemplateBlob,
  fetchDeviceContractFileBlob,
  fetchDeviceContracts,
  generateDeviceContract,
} from "@/lib/api/device-contracts";
import { fetchAssetsByUser, fetchDeviceHistoryAssignees } from "@/lib/api/device-history";
import { canWrite } from "@/lib/auth/permissions";
import type { Asset, DeviceContract } from "@/lib/types";

type DrawerMode = "generate" | "view";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  return value.slice(0, 10);
}

function downloadBlobFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Hide Chrome PDF toolbar (includes “Save to Google Drive”). */
function pdfEmbedSrc(url: string) {
  return `${url}#toolbar=0&navpanes=0&scrollbar=1`;
}

export default function ContractsPage() {
  const user = useSessionUser();
  const write = canWrite(user);

  const [items, setItems] = useState<DeviceContract[]>([]);
  const [assignees, setAssignees] = useState<string[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [templateOpen, setTemplateOpen] = useState(true);
  const [templateUrl, setTemplateUrl] = useState<string | null>(null);
  const [templateBlob, setTemplateBlob] = useState<Blob | null>(null);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [templateError, setTemplateError] = useState("");
  const [templateLoaded, setTemplateLoaded] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>("generate");
  const [viewing, setViewing] = useState<DeviceContract | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");

  const [employeeName, setEmployeeName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [departmentName, setDepartmentName] = useState("");
  const [dateIssued, setDateIssued] = useState(todayIso);
  const [notes, setNotes] = useState("");
  const [previewAssets, setPreviewAssets] = useState<Asset[]>([]);
  const [assetsLoading, setAssetsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<DeviceContract | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const uniqueEmployeesOnPage = useMemo(
    () => new Set(items.map((r) => r.employee_name)).size,
    [items],
  );
  const assetsOnPage = useMemo(
    () => items.reduce((sum, r) => sum + (r.asset_count || 0), 0),
    [items],
  );

  const employeeOptions = useMemo(() => {
    const set = new Set<string>([...assignees, ...items.map((r) => r.employee_name)]);
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [assignees, items]);

  const loadSeq = useRef(0);

  const load = useCallback(async () => {
    const seq = ++loadSeq.current;
    setLoading(true);
    setError("");
    try {
      const res = await fetchDeviceContracts({
        page,
        limit: 20,
        search: search || undefined,
        employeeName: employeeFilter || undefined,
      });
      if (seq !== loadSeq.current) return;
      if ((res.totalPages || 0) > 0 && page > (res.totalPages || 1)) {
        setPage(1);
        return;
      }
      setItems(res.items);
      setTotalPages(Math.max(1, res.totalPages || 1));
      setTotal(res.total || 0);
    } catch (err) {
      if (seq !== loadSeq.current) return;
      setError(err instanceof Error ? err.message : "Failed to load contracts");
    } finally {
      if (seq === loadSeq.current) setLoading(false);
    }
  }, [page, search, employeeFilter]);

  useEffect(() => {
    const t = window.setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [search, employeeFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!success) return;
    const t = window.setTimeout(() => setSuccess(""), 5000);
    return () => window.clearTimeout(t);
  }, [success]);

  useEffect(() => {
    fetchDeviceHistoryAssignees()
      .then(setAssignees)
      .catch(() => setAssignees([]));
  }, []);

  const loadTemplate = useCallback(async (force = false) => {
    if (templateLoading) return;
    if (templateLoaded && !force) return;
    setTemplateLoading(true);
    setTemplateError("");
    try {
      const blob = await fetchContractTemplateBlob();
      const url = URL.createObjectURL(blob);
      setTemplateBlob(blob);
      setTemplateUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
      setTemplateLoaded(true);
    } catch (err) {
      setTemplateError(err instanceof Error ? err.message : "Failed to load template");
    } finally {
      setTemplateLoading(false);
    }
  }, [templateLoaded, templateLoading]);

  useEffect(() => {
    if (templateOpen) void loadTemplate(false);
  }, [templateOpen, loadTemplate]);

  useEffect(() => {
    return () => {
      if (templateUrl) URL.revokeObjectURL(templateUrl);
    };
  }, [templateUrl]);

  useEffect(() => {
    if (!employeeName.trim()) {
      setPreviewAssets([]);
      setJobTitle("");
      setDepartmentName("");
      return;
    }
    let cancelled = false;
    setAssetsLoading(true);
    fetchAssetsByUser(employeeName.trim())
      .then((res) => {
        if (cancelled) return;
        setPreviewAssets(res.items);
        const withJob = res.items.find((a) => a.job_title);
        const withDept = res.items.find((a) => a.department?.name);
        setJobTitle(withJob?.job_title || "");
        setDepartmentName(withDept?.department?.name || "");
      })
      .catch(() => {
        if (!cancelled) setPreviewAssets([]);
      })
      .finally(() => {
        if (!cancelled) setAssetsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [employeeName]);

  useEffect(() => {
    if (!drawerOpen || drawerMode !== "view" || !viewing) {
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setPreviewError("");
      return;
    }
    let active = true;
    let url: string | null = null;
    setPreviewLoading(true);
    setPreviewError("");
    fetchDeviceContractFileBlob(viewing.id)
      .then((blob) => {
        if (!active) return;
        url = URL.createObjectURL(blob);
        setPreviewUrl(url);
      })
      .catch((err) => {
        if (!active) return;
        setPreviewError(err instanceof Error ? err.message : "Failed to preview PDF");
      })
      .finally(() => {
        if (active) setPreviewLoading(false);
      });
    return () => {
      active = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [drawerOpen, drawerMode, viewing]);

  function openGenerate() {
    setDrawerMode("generate");
    setViewing(null);
    setEmployeeName("");
    setJobTitle("");
    setDepartmentName("");
    setDateIssued(todayIso());
    setNotes("");
    setPreviewAssets([]);
    setFormError("");
    setDrawerOpen(true);
  }

  function openView(row: DeviceContract) {
    setDrawerMode("view");
    setViewing(row);
    setFormError("");
    setDrawerOpen(true);
  }

  function closeDrawer() {
    if (saving) return;
    setDrawerOpen(false);
    setViewing(null);
    setFormError("");
  }

  async function onGenerate() {
    if (!write || saving) return;
    const name = employeeName.trim();
    if (!name) {
      setFormError("Select an employee.");
      return;
    }
    if (previewAssets.length === 0) {
      setFormError("No assets assigned to this employee in ITAM.");
      return;
    }
    setSaving(true);
    setFormError("");
    setSuccess("");
    try {
      const record = await generateDeviceContract({
        employeeName: name,
        jobTitle: jobTitle.trim() || undefined,
        departmentName: departmentName.trim() || undefined,
        dateIssued: dateIssued || undefined,
        notes: notes.trim() || undefined,
      });
      setSuccess(`Generated ${record.contract_code} for ${record.employee_name}.`);
      setPage(1);
      await load();
      setDrawerMode("view");
      setViewing(record);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setSaving(false);
    }
  }

  async function onDownload(row: DeviceContract) {
    setDownloadingId(row.id);
    setError("");
    try {
      await downloadDeviceContract(row.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed");
    } finally {
      setDownloadingId(null);
    }
  }

  async function onConfirmDelete(password: string) {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await verifyPassword(password);
      const code = deleteTarget.contract_code;
      await deleteDeviceContract(deleteTarget.id);
      setDeleteTarget(null);
      if (viewing?.id === deleteTarget.id) closeDrawer();
      setSuccess(`Deleted ${code}.`);
      await load();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  }

  const renderRowActions = (row: DeviceContract) => (
    <div className="flex items-center gap-1">
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
        title="View contract"
        aria-label="View contract"
      >
        <Eye className="h-4 w-4" />
        {!write && <span>View</span>}
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          void onDownload(row);
        }}
        disabled={downloadingId === row.id}
        className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-[#2E7D9A] disabled:opacity-50"
        title="Download PDF"
        aria-label="Download PDF"
      >
        {downloadingId === row.id ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
      </button>
      {write && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setDeleteError("");
            setDeleteTarget(row);
          }}
          className="rounded p-1 text-red-400 hover:bg-red-950/40 hover:text-red-300"
          title="Delete contract"
          aria-label="Delete contract"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );

  return (
    <>
      <Header
        title="Device Agreements"
        subtitle="Generate Company Device Agreements from ITAM. PDFs are saved in the database (and Supabase Storage bucket when configured)."
      />

      <div className="page-content flex-1 overflow-y-auto">
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <div className="card px-4 py-3">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
              <FileSignature className="h-3.5 w-3.5 text-[#2E7D9A]" />
              Total contracts
            </div>
            <p className="kpi-value mt-1 text-white">{total}</p>
          </div>
          <div className="card px-4 py-3">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
              <Users className="h-3.5 w-3.5 text-[#2E7D9A]" />
              Employees (this page)
            </div>
            <p className="kpi-value mt-1 text-white">{uniqueEmployeesOnPage}</p>
          </div>
          <div className="card px-4 py-3">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
              <FileText className="h-3.5 w-3.5 text-[#2E7D9A]" />
              Assets covered (this page)
            </div>
            <p className="kpi-value mt-1 text-white">{assetsOnPage}</p>
          </div>
        </div>

        <div className="card mb-4 overflow-hidden">
          <button
            type="button"
            onClick={() => setTemplateOpen((v) => !v)}
            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
          >
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-white">Agreement template</h2>
              <p className="truncate text-xs text-slate-400">
                Company-Device-Agreement-Template.pdf · DCA-0000 placeholder
              </p>
            </div>
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${
                templateOpen ? "rotate-180" : ""
              }`}
            />
          </button>
          {templateOpen && (
            <div className="space-y-3 border-t border-slate-700/60 px-4 pb-4">
              <div className="flex flex-wrap gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => void loadTemplate(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${templateLoading ? "animate-spin" : ""}`} />
                  Reload
                </button>
                {templateUrl && (
                  <a
                    href={templateUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Open full size
                  </a>
                )}
                {templateBlob && (
                  <button
                    type="button"
                    onClick={() =>
                      downloadBlobFile(templateBlob, "Company-Device-Agreement-Template.pdf")
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download template
                  </button>
                )}
              </div>
              <div className="overflow-hidden rounded-lg border border-slate-700 bg-slate-950">
                {templateLoading && (
                  <div className="flex h-72 items-center justify-center text-sm text-slate-400">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading template…
                  </div>
                )}
                {!templateLoading && templateError && (
                  <div className="flex h-72 items-center justify-center px-4 text-center text-sm text-red-300">
                    {templateError}
                  </div>
                )}
                {!templateLoading && templateUrl && (
                  <iframe
                    title="Company Device Agreement template"
                    src={pdfEmbedSrc(templateUrl)}
                    className="h-[380px] w-full bg-white"
                  />
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mb-4 space-y-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <FilterSearch
              value={searchInput}
              onChange={setSearchInput}
              placeholder="Search code, employee, department..."
              className="min-w-0 w-full lg:flex-1"
            />
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => void load()}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </button>
              {write && (
                <button
                  type="button"
                  onClick={openGenerate}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#2E7D9A] px-4 py-2 text-sm font-medium text-white"
                >
                  <Plus className="h-4 w-4" />
                  Generate contract
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <FilterSelect
              label="Employee"
              value={employeeFilter}
              onChange={(v) => {
                setPage(1);
                setEmployeeFilter(v);
              }}
            >
              <option value="">All employees</option>
              {employeeOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </FilterSelect>
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
                      },
                    },
                  ]
                : []),
              ...(employeeFilter
                ? [
                    {
                      key: "employee",
                      label: "Employee",
                      value: employeeFilter,
                      onRemove: () => setEmployeeFilter(""),
                    },
                  ]
                : []),
            ]}
            onClearAll={() => {
              setSearchInput("");
              setSearch("");
              setEmployeeFilter("");
            }}
          />
        </div>

        {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
        {success && <p className="mb-3 text-sm text-emerald-400">{success}</p>}

        <div className="card overflow-hidden">
          <div className="overflow-x-hidden">
            <table className="data-table data-table--fixed w-full" style={{ minWidth: 0 }}>
              <colgroup>
                <col style={{ width: "12%" }} />
                <col style={{ width: "18%" }} />
                <col style={{ width: "18%" }} />
                <col style={{ width: "16%" }} />
                <col style={{ width: "8%" }} />
                <col style={{ width: "11%" }} />
                <col style={{ width: "11%" }} />
                <col style={{ width: "6%" }} />
              </colgroup>
              <thead>
                <tr>
                  <th>Document No.</th>
                  <th>Employee</th>
                  <th>Position</th>
                  <th>Department</th>
                  <th>Assets</th>
                  <th>Issued</th>
                  <th>Generated</th>
                  <th>{write ? "Actions" : "View"}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeleton columns={8} />
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-slate-400">
                      No contracts found.
                      {write
                        ? " Generate a contract for an employee with assigned ITAM assets."
                        : " Ask an IT Admin to generate the first DCA."}
                    </td>
                  </tr>
                ) : (
                  items.map((row) => (
                    <tr
                      key={row.id}
                      className="cursor-pointer"
                      onClick={() => openView(row)}
                    >
                      <td className="font-mono text-[#2E7D9A]">{row.contract_code}</td>
                      <td className="cell-clip font-medium text-white" title={row.employee_name}>
                        {row.employee_name}
                      </td>
                      <td className="cell-clip text-slate-300" title={row.job_title || undefined}>
                        {row.job_title || "—"}
                      </td>
                      <td
                        className="cell-clip"
                        title={row.department_name || undefined}
                      >
                        {row.department_name || "—"}
                      </td>
                      <td
                        className="text-slate-300"
                        title={row.asset_codes.join(", ") || undefined}
                      >
                        {row.asset_count}
                      </td>
                      <td className="text-slate-300">{formatDate(row.date_issued)}</td>
                      <td className="text-slate-400">{formatDate(row.created_at)}</td>
                      <td onClick={(e) => e.stopPropagation()}>{renderRowActions(row)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      <Drawer
        open={drawerOpen}
        onClose={closeDrawer}
        title={
          drawerMode === "generate"
            ? "Generate Company Device Agreement"
            : viewing?.contract_code || "Contract details"
        }
        subtitle={
          drawerMode === "generate"
            ? "Create a signed-ready PDF from live ITAM inventory"
            : viewing?.employee_name
        }
        wide
        footer={
          drawerMode === "generate" ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-500">
                {previewAssets.length > 0
                  ? `${previewAssets.length} asset${previewAssets.length === 1 ? "" : "s"} · PDF only`
                  : "PDF only · saved in the database per employee"}
              </p>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={closeDrawer}
                  className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={saving || !write || assetsLoading || previewAssets.length === 0}
                  onClick={() => void onGenerate()}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#2E7D9A] px-4 py-2 text-sm font-medium text-white hover:bg-[#266988] disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileSignature className="h-4 w-4" />
                  )}
                  {saving ? "Generating…" : "Generate PDF"}
                </button>
              </div>
            </div>
          ) : viewing ? (
            <div className="flex flex-wrap justify-between gap-2">
              {write ? (
                <button
                  type="button"
                  onClick={() => setDeleteTarget(viewing)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/40 px-3 py-2 text-sm text-red-300 hover:bg-red-500/10"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              ) : (
                <span />
              )}
              <button
                type="button"
                onClick={() => void onDownload(viewing)}
                disabled={downloadingId === viewing.id}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#2E7D9A] px-3 py-2 text-sm font-medium text-white hover:bg-[#266988] disabled:opacity-50"
              >
                {downloadingId === viewing.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}
                Download PDF
              </button>
            </div>
          ) : null
        }
      >
        {drawerMode === "generate" ? (
          <GenerateContractForm
            assignees={assignees}
            employeeName={employeeName}
            jobTitle={jobTitle}
            departmentName={departmentName}
            dateIssued={dateIssued}
            notes={notes}
            previewAssets={previewAssets}
            assetsLoading={assetsLoading}
            formError={formError}
            onEmployeeNameChange={setEmployeeName}
            onJobTitleChange={setJobTitle}
            onDepartmentNameChange={setDepartmentName}
            onDateIssuedChange={setDateIssued}
            onNotesChange={setNotes}
          />
        ) : viewing ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-700 bg-slate-950/50 px-3 py-2">
                <div className="text-xs text-slate-500">Employee</div>
                <div className="text-sm font-medium text-white">{viewing.employee_name}</div>
                <div className="text-xs text-slate-400">{viewing.job_title || "—"}</div>
              </div>
              <div className="rounded-lg border border-slate-700 bg-slate-950/50 px-3 py-2">
                <div className="text-xs text-slate-500">Department</div>
                <div className="text-sm font-medium text-white">
                  {viewing.department_name || "—"}
                </div>
                <div className="text-xs text-slate-400">
                  Issued {formatDate(viewing.date_issued)}
                </div>
              </div>
              <div className="rounded-lg border border-slate-700 bg-slate-950/50 px-3 py-2 sm:col-span-2">
                <div className="text-xs text-slate-500">
                  Assets ({viewing.asset_count})
                </div>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {viewing.asset_codes.length === 0 ? (
                    <span className="text-sm text-slate-400">—</span>
                  ) : (
                    viewing.asset_codes.map((code) => (
                      <span
                        key={code}
                        className="rounded-md bg-[#2E7D9A]/15 px-2 py-0.5 text-xs font-medium text-[#7ec8e0] ring-1 ring-[#2E7D9A]/30"
                      >
                        {code}
                      </span>
                    ))
                  )}
                </div>
                {viewing.notes && (
                  <p className="mt-2 text-xs text-slate-400">Notes: {viewing.notes}</p>
                )}
                <p className="mt-2 text-xs text-slate-500">
                  Generated {formatDate(viewing.created_at)}
                  {viewing.generated_by ? ` · ${viewing.generated_by}` : ""}
                </p>
              </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-slate-700 bg-slate-950">
              {previewLoading && (
                <div className="flex h-80 items-center justify-center text-sm text-slate-400">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading PDF preview…
                </div>
              )}
              {!previewLoading && previewError && (
                <div className="flex h-80 items-center justify-center px-4 text-center text-sm text-red-300">
                  {previewError}
                </div>
              )}
              {!previewLoading && previewUrl && (
                <iframe
                  title={`${viewing.contract_code} preview`}
                  src={pdfEmbedSrc(previewUrl)}
                  className="h-[480px] w-full bg-white"
                />
              )}
            </div>
          </div>
        ) : null}
      </Drawer>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete device agreement?"
        message={
          deleteTarget
            ? `Delete ${deleteTarget.contract_code} for ${deleteTarget.employee_name}? The PDF will be removed from the database.`
            : ""
        }
        confirmLabel="Delete"
        requirePassword
        loading={deleting}
        error={deleteError}
        onCancel={() => {
          if (!deleting) {
            setDeleteTarget(null);
            setDeleteError("");
          }
        }}
        onConfirm={(password) => void onConfirmDelete(password)}
      />
    </>
  );
}
