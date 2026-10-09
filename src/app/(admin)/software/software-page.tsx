"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Eye, Library, Monitor, type LucideIcon } from "lucide-react";
import { ActiveFilters } from "@/components/ActiveFilters";
import { Badge } from "@/components/Badge";
import { FilterSearch, FilterSelect } from "@/components/FilterSelect";
import { TableSkeleton } from "@/components/TableSkeleton";
import { Header } from "@/components/Header";
import { Pagination } from "@/components/Pagination";
import { SpotlightTour, shouldAutoStartTour, type TourStep } from "@/components/SpotlightTour";
import { TourEmptyCta, TourNudge, useTourHint } from "@/components/TourNudge";
import { useSessionUser } from "@/components/SessionContext";
import { DeviceSoftwareDrawer } from "@/components/software/DeviceSoftwareDrawer";
import { SoftwareCatalogPanel } from "@/components/software/SoftwareCatalogPanel";
import { canWrite, isViewer } from "@/lib/auth/permissions";
import { SOFTWARE_TOUR_STORAGE_KEY, getSoftwareTourSteps } from "@/lib/tours/software";
import { fetchDepartments } from "@/lib/api/departments";
import { fetchSoftwareDevices, type SoftwareDeviceRow } from "@/lib/api/software";
import type { Department } from "@/lib/types";

type Tab = "devices" | "catalog";
type ComplianceFilter = "" | "complete" | "missing" | "extras";

const COMPLIANCE_LABEL: Record<Exclude<ComplianceFilter, "">, string> = {
  complete: "Complete",
  missing: "Missing standard",
  extras: "With extras",
};

function coveredCount(row: SoftwareDeviceRow) {
  return row.standard_installed + row.standard_not_needed;
}

export function SoftwarePage() {
  const user = useSessionUser();
  const write = canWrite(user);
  const readOnly = isViewer(user);
  const searchParams = useSearchParams();

  const [tab, setTab] = useState<Tab>(searchParams.get("tab") === "catalog" ? "catalog" : "devices");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [compliance, setCompliance] = useState<ComplianceFilter>(() => {
    const value = searchParams.get("compliance");
    if (value === "complete" || value === "missing" || value === "extras") return value;
    return "";
  });
  const [departments, setDepartments] = useState<Department[]>([]);
  const [rows, setRows] = useState<SoftwareDeviceRow[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openAssetId, setOpenAssetId] = useState<string | null>(searchParams.get("asset"));
  const [reloadKey, setReloadKey] = useState(0);
  const [tourOpen, setTourOpen] = useState(false);
  const [tourCatalogForm, setTourCatalogForm] = useState(false);
  const { showHint, showPulse, dismissHint } = useTourHint(SOFTWARE_TOUR_STORAGE_KEY, tourOpen, user.id);
  const startTour = () => {
    dismissHint();
    setTourOpen(true);
  };
  const tourAutoStarted = useRef(false);
  const tourOpenedDevice = useRef(false);
  const rowsRef = useRef(rows);
  rowsRef.current = rows;
  const openAssetRef = useRef(openAssetId);
  openAssetRef.current = openAssetId;

  useEffect(() => {
    const handle = window.setTimeout(() => setSearch(searchInput.trim()), 250);
    return () => window.clearTimeout(handle);
  }, [searchInput]);

  useEffect(() => {
    void fetchDepartments()
      .then(setDepartments)
      .catch(() => setDepartments([]));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetchSoftwareDevices({
        page,
        limit: 20,
        search: search || undefined,
        departmentId: departmentId || undefined,
        compliance: compliance || undefined,
      });
      setRows(res.items);
      setTotal(res.total);
      setTotalPages(res.totalPages || 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load computers");
    } finally {
      setLoading(false);
    }
  }, [page, search, departmentId, compliance]);

  useEffect(() => {
    if (tab !== "devices") return;
    void load();
  }, [tab, load, reloadKey]);

  useEffect(() => {
    setPage(1);
  }, [search, departmentId, compliance]);

  useEffect(() => {
    if (tourAutoStarted.current) return;
    if (tab === "devices" && loading) return;
    if (!shouldAutoStartTour(SOFTWARE_TOUR_STORAGE_KEY)) return;
    tourAutoStarted.current = true;
    const timer = window.setTimeout(() => setTourOpen(true), 450);
    return () => window.clearTimeout(timer);
  }, [loading, tab]);

  const tourSteps = useMemo(() => getSoftwareTourSteps(write), [write]);

  const handleTourStepChange = useCallback((step: TourStep | null) => {
    const id = step?.id ?? "";
    const needsDevice = id.startsWith("sw-device");
    const needsCatalog = id.startsWith("sw-catalog");

    if (id === "sw-filters" || id === "sw-list" || needsDevice) setTab("devices");
    if (needsCatalog) setTab("catalog");

    if (needsDevice) {
      setTourCatalogForm(false);
      if (!openAssetRef.current) {
        const first = rowsRef.current[0];
        if (first) {
          setOpenAssetId(first.id);
          tourOpenedDevice.current = true;
        }
      }
      return;
    }

    if (tourOpenedDevice.current) {
      setOpenAssetId(null);
      tourOpenedDevice.current = false;
    }
    setTourCatalogForm(id.startsWith("sw-catalog-form"));
  }, []);

  return (
    <>
      <Header
        title="Software"
        subtitle="Company software catalog and the checklist on each PC and laptop"
        onHowItWorks={startTour}
        howItWorksPulse={showPulse}
      />
      <div className="page-content flex-1 overflow-y-auto">
        <TourNudge show={showHint} onDismiss={dismissHint} onStart={startTour} />
        {readOnly && (
          <div className="mb-4 flex items-start gap-3 rounded-lg border border-slate-600/60 bg-slate-800/40 px-3.5 py-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-700/70 ring-1 ring-slate-600/70">
              <Eye className="h-4 w-4 text-[#7EC8DC]" aria-hidden />
            </span>
            <div className="min-w-0 pt-0.5">
              <p className="text-sm font-medium text-slate-100">View-only access</p>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-400 sm:text-[13px]">
                You can review the catalog and checklists. Adding, editing, and deleting are limited to administrators.
              </p>
            </div>
          </div>
        )}

        <div className="mb-4 inline-flex rounded-lg border border-slate-600 p-0.5" role="tablist" aria-label="Software views" data-tour="sw-tabs">
          {(
            [
              ["devices", "Computers", Monitor],
              ["catalog", "Catalog", Library],
            ] as const satisfies ReadonlyArray<readonly [Tab, string, LucideIcon]>
          ).map(([value, label, Icon]) => {
            const active = tab === value;
            return (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(value)}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  active ? "bg-[#2E7D9A] text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            );
          })}
        </div>

        {tab === "catalog" ? (
          <SoftwareCatalogPanel write={write} tourForm={tourCatalogForm} onStartTour={startTour} />
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end" data-tour="sw-filters">
              <div className="min-w-0 w-full lg:max-w-xl lg:flex-1">
                <FilterSearch
                  value={searchInput}
                  onChange={setSearchInput}
                  placeholder="Search computer, user, asset code, department..."
                  className="w-full"
                />
              </div>
              <FilterSelect label="Department" value={departmentId} onChange={setDepartmentId} className="w-full lg:w-56">
                <option value="">All departments</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </FilterSelect>
              <FilterSelect
                label="Compliance"
                value={compliance}
                onChange={(value) => setCompliance(value as ComplianceFilter)}
                className="w-full lg:w-52"
              >
                <option value="">All computers</option>
                <option value="complete">Complete</option>
                <option value="missing">Missing standard</option>
                <option value="extras">With extras</option>
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
                ...(departmentId
                  ? [
                      {
                        key: "department",
                        label: "Department",
                        value: departments.find((dept) => dept.id === departmentId)?.name ?? "Department",
                        onRemove: () => setDepartmentId(""),
                      },
                    ]
                  : []),
                ...(compliance
                  ? [
                      {
                        key: "compliance",
                        label: "Compliance",
                        value: COMPLIANCE_LABEL[compliance],
                        onRemove: () => setCompliance(""),
                      },
                    ]
                  : []),
              ]}
              onClearAll={() => {
                setSearchInput("");
                setSearch("");
                setDepartmentId("");
                setCompliance("");
              }}
            />

            {error && (
              <p className="rounded-lg border border-red-900/50 bg-red-950/40 px-3 py-2 text-sm text-red-300">{error}</p>
            )}

            <div className="card overflow-hidden" data-tour="sw-list">
              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Computer</th>
                      <th>User</th>
                      <th>Department</th>
                      <th>Standard</th>
                      <th style={{ textAlign: "right" }}>Extras</th>
                      <th>Compliance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <TableSkeleton columns={6} />
                    ) : rows.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500">
                          <div className="flex flex-col items-center gap-1">
                            <span>No computers match these filters</span>
                            <TourEmptyCta onStart={startTour} />
                          </div>
                        </td>
                      </tr>
                    ) : (
                      rows.map((row) => {
                        const met = coveredCount(row);
                        return (
                          <tr
                            key={row.id}
                            className="cursor-pointer"
                            onClick={() => setOpenAssetId(row.id)}
                          >
                            <td>
                              <div className="font-medium text-white">{row.computer_name}</div>
                              <div className="text-xs text-slate-500">{row.asset_code}</div>
                            </td>
                            <td className="text-slate-300">{row.assigned_to?.trim() || "—"}</td>
                            <td className="text-slate-300">{row.department || "—"}</td>
                            <td>
                              <div className={row.standard_missing > 0 ? "text-amber-200" : "text-slate-200"}>
                                {met}/{row.standard_total}
                                {row.additional_count > 0 && (
                                  <span className="text-slate-400"> · {row.additional_count} extra</span>
                                )}
                              </div>
                              {row.missing_software.length > 0 && (
                                <div className="max-w-xs truncate text-xs text-amber-200/70" title={row.missing_software.join(", ")}>
                                  {row.missing_software.join(", ")}
                                </div>
                              )}
                            </td>
                            <td style={{ textAlign: "right" }} className="text-slate-300">
                              {row.additional_count}
                            </td>
                            <td>
                              <Badge value={row.compliance === "COMPLETE" ? "COMPLETE" : "MISSING"} />
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              total={total}
              pageSize={20}
              itemLabel="computer"
            />
          </div>
        )}
      </div>

      <DeviceSoftwareDrawer
        assetId={openAssetId}
        write={write}
        onClose={() => setOpenAssetId(null)}
        onChanged={() => setReloadKey((value) => value + 1)}
      />

      <SpotlightTour
        open={tourOpen}
        steps={tourSteps}
        storageKey={SOFTWARE_TOUR_STORAGE_KEY}
        onStepChange={handleTourStepChange}
        onClose={() => setTourOpen(false)}
      />
    </>
  );
}
