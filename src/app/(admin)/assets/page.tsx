"use client";

import { useCallback, useEffect, useState } from "react";
import { Eye, LayoutGrid, List, Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Badge } from "@/components/Badge";
import { AssetDetailView } from "@/components/AssetDetailView";
import { DeviceFormToolbar } from "@/components/DeviceFormToolbar";
import { DeviceInventoryForm } from "@/components/DeviceInventoryForm";
import { Drawer, inputClass, selectClass } from "@/components/Drawer";
import { Header } from "@/components/Header";
import { createAsset, deleteAsset, fetchAsset, fetchAssets, updateAsset } from "@/lib/api/assets";
import { fetchDepartments } from "@/lib/api/departments";
import { canWrite } from "@/lib/auth/permissions";
import { REFERENCE_DATA } from "@/lib/reference-data";
import { labelEnum } from "@/lib/labels";
import { useSessionUser } from "@/components/SessionContext";
import { emptyForm, emptyFormForCategory, formStateFromAsset, prepareAssetPayload, ramSlotDefaults, showsInfraNetworkSpecs, showsInfraServerSpecs, validateAssetForm, type AssetCategory } from "@/lib/device-form";
import type { Asset, Department } from "@/lib/types";

type ViewMode = "table" | "grid";
type DrawerMode = "create" | "view" | "edit";

const VIEW_MODE_STORAGE_KEY = "assets-view";

const ITEM_TYPES = ["LAPTOP", "DESKTOP", "ALL_IN_ONE", "KEYBOARD", "MOUSE", "MONITOR", "PRINTER", "OTHER"];

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
  const [saving, setSaving] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>(readStoredViewMode);

  const changeViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
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

  const remove = async (row: Asset) => {
    if (!confirm(`Delete asset ${row.asset_code}?`)) return;
    await deleteAsset(row.id);
    await load();
  };

  const renderRowActions = (row: Asset) => (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          void openView(row);
        }}
        className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-[#2E7D9A]"
        title="View asset"
        aria-label="View asset"
      >
        <Eye className="h-4 w-4" />
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
              void remove(row);
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
      assetCategory === "infrastructure" && !showsInfraServerSpecs(deviceType);
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
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search asset ID, computer, assigned to..."
              className={`${inputClass} pl-9`}
            />
          </div>
          <select
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            className={`${selectClass} w-full sm:w-auto sm:min-w-[10rem]`}
          >
            <option value="">All departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={`${selectClass} w-full sm:w-auto sm:min-w-[10rem]`}
          >
            <option value="">All statuses</option>
            {REFERENCE_DATA.assetStatuses.map((s) => (
              <option key={s} value={s}>
                {labelEnum(s)}
              </option>
            ))}
          </select>
          <select
            value={itemType}
            onChange={(e) => setItemType(e.target.value)}
            className={`${selectClass} w-full sm:w-auto sm:min-w-[10rem]`}
          >
            <option value="">All types</option>
            {ITEM_TYPES.map((t) => (
              <option key={t} value={t}>
                {labelEnum(t)}
              </option>
            ))}
          </select>
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

        {viewMode === "table" ? (
          <div className="card overflow-hidden">
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Asset ID</th>
                    <th>Type</th>
                    <th>Computer</th>
                    <th>Assigned To</th>
                    <th>Department</th>
                    <th>Status</th>
                    <th>Condition</th>
                    <th className="w-0">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="text-slate-400">
                        Loading...
                      </td>
                    </tr>
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
                        <td className="font-medium text-white">{row.computer_name}</td>
                        <td className="text-slate-300">{row.assigned_to ?? "—"}</td>
                        <td>{row.department?.name ?? "—"}</td>
                        <td>
                          <Badge value={row.status} />
                        </td>
                        <td>
                          <Badge value={row.condition} />
                        </td>
                        <td onClick={(e) => e.stopPropagation()} className="w-0">
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
              <p className="py-8 text-center text-sm text-slate-400">Loading...</p>
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

        <div className="mt-4 flex flex-col gap-3 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded border border-slate-600 px-3 py-1 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded border border-slate-600 px-3 py-1 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
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
          drawerMode !== "view" ? (
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
        {drawerMode === "view" && editing ? (
          detailLoading ? (
            <p className="py-12 text-center text-sm text-slate-400">Loading asset details...</p>
          ) : (
            <AssetDetailView asset={editing} />
          )
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
    </>
  );
}
