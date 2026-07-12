"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
import { AssetDetailView } from "@/components/AssetDetailView";
import { DeviceFormToolbar } from "@/components/DeviceFormToolbar";
import { DeviceInventoryForm } from "@/components/DeviceInventoryForm";
import { PeripheralAssetForm } from "@/components/PeripheralAssetForm";
import { Drawer, inputClass, selectClass } from "@/components/Drawer";
import { FilterSearch, FilterSelect } from "@/components/FilterSelect";
import { Header } from "@/components/Header";
import { Pagination } from "@/components/Pagination";
import { CardGridSkeleton, TableSkeleton } from "@/components/TableSkeleton";
import { createAsset, deleteAsset, fetchAllAssets, fetchAsset, fetchAssets, updateAsset } from "@/lib/api/assets";
import { verifyPassword } from "@/lib/api/auth";
import { exportAssetsExcel, exportAssetsPdf } from "@/lib/export-assets";
import { fetchDepartments } from "@/lib/api/departments";
import { canWrite } from "@/lib/auth/permissions";
import { REFERENCE_DATA } from "@/lib/reference-data";
import { labelEnum } from "@/lib/labels";
import { useSessionUser } from "@/components/SessionContext";
import { emptyForm, emptyFormForCategory, formStateFromAsset, isComponentItemType, prepareAssetPayload, ramSlotDefaults, showsInfraNetworkSpecs, showsInfraServerSpecs, showsInfraStorageSpecs, validateAssetForm, type AssetCategory } from "@/lib/device-form";
import type { Asset, Department } from "@/lib/types";

type ViewMode = "table" | "grid";
type DrawerMode = "create" | "view" | "edit";

const VIEW_MODE_STORAGE_KEY = "assets-view";

// Filter options combine end-user device / component types with the
// infrastructure device types (Server, Firewall, Access Point, etc.). Some values
// live only in DeviceType (e.g. FIREWALL, EXTERNAL_HDD_SSD); the backend matches
// either item_type or device_type so both categories are caught.
const ITEM_TYPES = Array.from(
  new Set([
    ...REFERENCE_DATA.deviceTypes.filter((t) => t !== "OTHER"),
    "KEYBOARD",
    "MOUSE",
    "PRINTER",
    "UPS",
    "AVR",
    "OTHER",
  ]),
);

function readStoredViewMode(): ViewMode {
  if (typeof window === "undefined") return "table";
  const saved = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
  return saved === "grid" ? "grid" : "table";
}

export default function AssetsPage() {
  const user = useSessionUser();
  const write = canWrite(user);
  const [items, setItems] = useState<Asset[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [status, setStatus] = useState("");
  const [itemType, setItemType] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>("create");
  const [editing, setEditing] = useState<Asset | null>(null);
  const [form, setForm] = useState(() => emptyForm());
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>(readStoredViewMode);
  const [exporting, setExporting] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Asset | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const exportMenuRef = useRef<HTMLDivElement>(null);

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
    if (departmentId) parts.push(`Department: ${departments.find((d) => d.id === departmentId)?.name ?? departmentId}`);
    if (status) parts.push(`Status: ${labelEnum(status)}`);
    if (itemType) parts.push(`Type: ${labelEnum(itemType)}`);
    return parts.length ? parts.join(" · ") : "None (all records)";
  };

  const runExport = async (format: "excel" | "pdf") => {
    if (exporting) return;
    setExportMenuOpen(false);
    setExporting(true);
    setError("");
    setSuccess("");
    try {
      const rows = await fetchAllAssets({
        search: search || undefined,
        departmentId: departmentId || undefined,
        status: status || undefined,
        itemType: itemType || undefined,
      });
      if (rows.length === 0) {
        setError("No assets match the current filters to export.");
        return;
      }
      if (format === "excel") {
        await exportAssetsExcel(rows, buildFilterSummary());
      } else {
        exportAssetsPdf(rows, buildFilterSummary());
      }
      const label = format === "excel" ? "Excel" : "PDF";
      setSuccess(`Exported ${rows.length} asset ${rows.length === 1 ? "record" : "records"} to ${label}.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed");
    } finally {
      setExporting(false);
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchAssets({
        page,
        search: search || undefined,
        departmentId: departmentId || undefined,
        status: status || undefined,
        itemType: itemType || undefined,
      });
      setItems(res.items);
      setTotalPages(res.totalPages);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [page, search, departmentId, status, itemType]);

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput), 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [search, departmentId, status, itemType]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    fetchDepartments().then(setDepartments).catch(() => {});
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setDrawerMode("create");
    setSaving(false);
    setError("");
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSaving(false);
    setDrawerMode("create");
    setError("");
  };

  const loadAssetDetail = async (row: Asset) => {
    setEditing(row);
    setForm(formStateFromAsset(row));
    setDetailLoading(true);
    try {
      const full = await fetchAsset(row.id);
      setEditing(full);
      setForm(formStateFromAsset(full));
    } catch {
      /* keep list row data */
    } finally {
      setDetailLoading(false);
    }
  };

  const openView = async (row: Asset) => {
    setDrawerMode("view");
    setSaving(false);
    setError("");
    setDrawerOpen(true);
    await loadAssetDetail(row);
  };

  const openEditForm = async (row: Asset) => {
    setDrawerMode("edit");
    setSaving(false);
    setError("");
    setDrawerOpen(true);
    await loadAssetDetail(row);
  };

  const save = async () => {
    if (saving) return;
    const validationError = validateAssetForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }
    setSaving(true);
    setError("");
    const body = prepareAssetPayload(form);
    try {
      if (editing) await updateAsset(editing.id, body);
      else await createAsset(body);
      setDrawerOpen(false);
      setDrawerMode("create");
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
      await deleteAsset(deleteTarget.id);
      const code = deleteTarget.asset_code;
      setDeleteTarget(null);
      setError("");
      setSuccess(`Asset ${code} deleted.`);
      await load();
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const renderRowActions = (row: Asset) => (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          void openView(row);
        }}
        className={
          write
            ? "rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-[#2E7D9A]"
            : "inline-flex items-center gap-1.5 rounded-md border border-slate-700 px-2 py-1 text-xs font-medium text-slate-300 transition hover:border-[#2E7D9A]/50 hover:text-[#2E7D9A]"
        }
        title="View asset"
        aria-label="View asset"
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
              void openEditForm(row);
            }}
            className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-[#2E7D9A]"
            title="Edit asset"
            aria-label="Edit asset"
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
            title="Delete asset"
            aria-label="Delete asset"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </>
      )}
    </div>
  );

  const set = (key: string, value: string | boolean) =>
    setForm((f) => {
      const next = { ...f, [key]: value };
      if (String(f.assetCategory || "end_user") !== "end_user") return next;

      if (key === "employeeName") {
        const assignedTo = String(value).trim();
        if (!assignedTo && String(next.status) === "IN_USE") next.status = "AVAILABLE";
        if (assignedTo && String(next.status) === "AVAILABLE") next.status = "IN_USE";
      }
      if (key === "status") {
        const assignedTo = String(next.employeeName ?? "").trim();
        if (value === "AVAILABLE" && assignedTo) {
          next.employeeName = "";
          next.jobTitle = "";
        }
      }
      return next;
    });

  const onDeviceTypeChange = (deviceType: string) => {
    const defaults = ramSlotDefaults(deviceType);
    const assetCategory = String(form.assetCategory || "end_user") as AssetCategory;
    const clearServerSpecs =
      assetCategory === "infrastructure" &&
      !showsInfraServerSpecs(deviceType) &&
      !showsInfraStorageSpecs(deviceType);
    const clearMacOnServer =
      assetCategory === "infrastructure" && showsInfraServerSpecs(deviceType);
    const clearProcessorOnNetwork =
      assetCategory === "infrastructure" && showsInfraNetworkSpecs(deviceType);
    setForm((f) => ({
      ...f,
      deviceType,
      ramSlotsTotal: defaults.total,
      ramFormFactor: defaults.formFactor,
      ...(clearServerSpecs
        ? {
            ram: "",
            ramSize: "",
            ramType: "",
            ramSpeed: "",
            ramSlotsUsedCount: "",
            primaryStorage: "",
            primaryStorageType: "",
            primaryStorageSize: "",
            primaryStorageModel: "",
            hasSecondaryStorage: false,
            secondaryStorage: "",
            secondaryStorageType: "",
            secondaryStorageSize: "",
            secondaryStorageModel: "",
          }
        : {}),
      ...(clearMacOnServer ? { macAddress: "" } : {}),
      ...(clearProcessorOnNetwork ? { processor: "" } : {}),
    }));
  };

  const onAssetCategoryChange = (category: AssetCategory) => {
    setForm((f) => ({
      ...emptyForm(),
      ...emptyFormForCategory(category),
      computerName: f.computerName,
      assetCategory: category,
    }));
  };

  return (
    <>
      <Header title="Assets" subtitle="Long-term hardware inventory linked to audits" />
      <div className="page-content flex-1 overflow-y-auto">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <FilterSearch
            value={searchInput}
            onChange={setSearchInput}
            placeholder="Search assets..."
            className="min-w-0 flex-1"
          />
          <FilterSelect label="Department" value={departmentId} onChange={setDepartmentId} className="w-full sm:w-auto">
            <option value="">All departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect label="Status" value={status} onChange={setStatus} className="w-full sm:w-auto">
            <option value="">All statuses</option>
            {REFERENCE_DATA.assetStatuses.map((s) => (
              <option key={s} value={s}>
                {labelEnum(s)}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect label="Item type" value={itemType} onChange={setItemType} className="w-full sm:w-auto">
            <option value="">All types</option>
            {ITEM_TYPES.map((t) => (
              <option key={t} value={t}>
                {labelEnum(t)}
              </option>
            ))}
          </FilterSelect>
          <div className="inline-flex rounded-lg border border-slate-600 p-0.5" role="group" aria-label="View mode">
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
          <div className="relative w-full sm:w-auto" ref={exportMenuRef}>
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
                className="absolute right-0 z-20 mt-1 w-full min-w-[11rem] overflow-hidden rounded-lg border border-slate-700 bg-slate-900 shadow-lg sm:w-auto"
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
          {write && (
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#2E7D9A] px-4 py-2 text-sm font-medium text-white sm:w-auto"
            >
              <Plus className="h-4 w-4" /> New Asset
            </button>
          )}
        </div>

        {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
        {success && <p className="mb-3 text-sm text-emerald-400">{success}</p>}

        {viewMode === "table" ? (
          <div className="card overflow-hidden">
            <div className="table-scroll">
              <table className="data-table data-table--fixed" style={{ minWidth: "68rem" }}>
                <colgroup>
                  <col style={{ width: "8%" }} />
                  <col style={{ width: "11%" }} />
                  <col style={{ width: "19%" }} />
                  <col style={{ width: "16%" }} />
                  <col style={{ width: "15%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "11%" }} />
                  <col style={{ width: "10%" }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>Asset ID</th>
                    <th>Type</th>
                    <th className="cell-wrap">Brand/Model</th>
                    <th className="cell-wrap">Assigned To</th>
                    <th className="cell-wrap">Department</th>
                    <th>Status</th>
                    <th>Condition</th>
                    <th>{write ? "Actions" : "View"}</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <TableSkeleton columns={8} />
                  ) : items.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-slate-400">
                        No assets found.
                      </td>
                    </tr>
                  ) : (
                    items.map((row) => (
                      <tr key={row.id} className="cursor-pointer" onClick={() => void openView(row)}>
                        <td className="font-mono text-[#2E7D9A]">{row.asset_code}</td>
                        <td>
                          <Badge value={row.item_type ?? row.device_type} />
                        </td>
                        <td className="cell-wrap font-medium text-white">{row.brand_model ?? "—"}</td>
                        <td className="cell-wrap text-slate-300">{row.assigned_to ?? "—"}</td>
                        <td className="cell-wrap">{row.department?.name ?? "—"}</td>
                        <td>
                          <Badge value={row.status} />
                        </td>
                        <td>
                          <Badge value={row.condition} />
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          {renderRowActions(row)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div>
            {loading ? (
              <CardGridSkeleton />
            ) : items.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">No assets found.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((row) => (
                  <article
                    key={row.id}
                    className="card cursor-pointer p-4 transition hover:border-[#2E7D9A]/50 hover:bg-slate-800/40"
                    onClick={() => void openView(row)}
                  >
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-mono text-sm font-medium text-[#2E7D9A]">{row.asset_code}</p>
                        <p className="mt-1 truncate text-base font-medium text-white">{row.computer_name}</p>
                        <p className="truncate text-sm text-slate-400">{row.assigned_to ?? "—"}</p>
                      </div>
                      <div onClick={(e) => e.stopPropagation()}>{renderRowActions(row)}</div>
                    </div>
                    <dl className="space-y-2 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <dt className="text-slate-500">Department</dt>
                        <dd className="truncate text-slate-300">{row.department?.name ?? "—"}</dd>
                      </div>
                      {row.brand_model && (
                        <div className="flex items-center justify-between gap-2">
                          <dt className="text-slate-500">Brand / Model</dt>
                          <dd className="truncate text-slate-300">{row.brand_model}</dd>
                        </div>
                      )}
                    </dl>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <Badge value={row.status} />
                      <Badge value={row.condition} />
                      {(row.item_type || row.device_type) && <Badge value={row.item_type ?? row.device_type} />}
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
            ? "New Asset"
            : drawerMode === "edit"
              ? `Edit ${editing.asset_code}`
              : `View ${editing.asset_code}`
        }
        subtitle={
          !editing
            ? "Register a device in the assets inventory"
            : drawerMode === "edit"
              ? "Update hardware inventory details"
              : "Hardware inventory summary"
        }
        onClose={closeDrawer}
        wide
        toolbar={
          drawerMode !== "view" && !isComponentItemType(String(form.itemType)) ? (
            <DeviceFormToolbar
              mode="asset"
              deviceType={String(form.deviceType)}
              assetCategory={String(form.assetCategory || "end_user")}
            />
          ) : undefined
        }
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
                onClick={() => {
                  if (editing) setForm(formStateFromAsset(editing));
                  setDrawerMode("edit");
                }}
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
                onClick={() => void save()}
                className="inline-flex h-10 w-[9rem] shrink-0 items-center justify-center gap-1.5 rounded-lg border border-transparent bg-[#2E7D9A] px-3 text-sm font-medium leading-none text-white hover:bg-[#256b85] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving && <Loader2 className="h-4 w-4 shrink-0 animate-spin" />}
                {saving ? "Saving..." : "Save Asset"}
              </button>
            </div>
          ) : undefined
        }
      >
        {detailLoading ? (
          <p className="py-12 text-center text-sm text-slate-400">Loading asset details...</p>
        ) : drawerMode === "view" && editing ? (
          <AssetDetailView asset={editing} />
        ) : isComponentItemType(String(form.itemType)) ? (
          <PeripheralAssetForm
            form={form}
            set={set}
            write={write}
            departments={departments}
            itemType={String(form.itemType)}
          />
        ) : (
          <DeviceInventoryForm
            mode="asset"
            form={form}
            set={set}
            onDeviceTypeChange={onDeviceTypeChange}
            onAssetCategoryChange={onAssetCategoryChange}
            write={write}
            departments={departments}
          />
        )}
      </Drawer>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete asset?"
        message={
          deleteTarget
            ? `Are you sure you want to delete asset ${deleteTarget.asset_code}? This action cannot be undone.`
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
    </>
  );
}
