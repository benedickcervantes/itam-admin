"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ClipboardList,
  Boxes,
  PieChart,
  Clock,
  CircleCheck,
  CircleArrowUp,
  RefreshCw,
  TriangleAlert,
  Siren,
  Flame,
  ShieldOff,
  KeyRound,
  Users,
  UserMinus,
  UserPlus,
  Monitor,
  Laptop,
  Keyboard,
  Mouse,
  Hammer,
  Eye,
  LayoutGrid,
  Gauge,
  ShieldAlert,
  Building2,
  ListOrdered,
} from "lucide-react";
import { Header } from "@/components/Header";
import { useSessionUser } from "@/components/SessionContext";
import { isViewer } from "@/lib/auth/permissions";
import { Badge } from "@/components/Badge";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { MiniStat } from "@/components/dashboard/MiniStat";
import { AssetStatusChart } from "@/components/dashboard/AssetStatusChart";
import { AssetStatusGlance } from "@/components/dashboard/AssetStatusGlance";
import { AttentionBand } from "@/components/dashboard/AttentionBand";
import {
  DashboardSectionNav,
  type DashboardSection,
} from "@/components/dashboard/DashboardSectionNav";
import { DeviceTypeChart } from "@/components/dashboard/DeviceTypeChart";
import { CountPill, PercentBar } from "@/components/dashboard/TableBits";
import {
  fetchDashboardSummary,
  type DashboardSummary,
  type DashboardPeriod,
} from "@/lib/api/dashboard";
import { formatPercent } from "@/lib/labels";

const PERIOD_OPTIONS: { value: DashboardPeriod; label: string; shortLabel: string }[] = [
  { value: "week", label: "Weekly", shortLabel: "Week" },
  { value: "month", label: "Monthly", shortLabel: "Month" },
  { value: "quarter", label: "Quarterly", shortLabel: "Quarter" },
  { value: "year", label: "Yearly", shortLabel: "Year" },
];

const SECTIONS: DashboardSection[] = [
  { id: "glance", label: "At a Glance", shortLabel: "Glance", icon: LayoutGrid },
  { id: "overview", label: "Overview", icon: Gauge },
  { id: "breakdown", label: "Breakdown", icon: PieChart },
  { id: "health", label: "Health & Risk", shortLabel: "Health", icon: ShieldAlert },
  { id: "workforce", label: "Workforce", icon: Users },
  { id: "departments", label: "Departments", shortLabel: "Depts", icon: Building2 },
  { id: "priority", label: "Priority", icon: ListOrdered },
];

function SectionAlert({ count, label }: { count: number; label: string }) {
  if (count <= 0) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2.5 py-0.5 text-xs font-semibold text-red-300 ring-1 ring-red-500/30">
      {count} {label}
    </span>
  );
}

function EmptyRow({ colSpan }: { colSpan: number }) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-6 text-center text-slate-500">
        No data yet
      </td>
    </tr>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-20 rounded-xl bg-slate-800/50" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-slate-800/50" />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-slate-800/50" />
        ))}
      </div>
      <div className="h-64 rounded-xl bg-slate-800/50" />
    </div>
  );
}

function formatUpdatedAt(date: Date) {
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function DashboardPage() {
  const user = useSessionUser();
  const readOnly = isViewer(user);
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [period, setPeriod] = useState<DashboardPeriod>("month");

  const load = useCallback(async (selected: DashboardPeriod) => {
    setLoading(true);
    setError("");
    try {
      const summary = await fetchDashboardSummary(selected);
      setData(summary);
      setUpdatedAt(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(period);
  }, [load, period]);

  const toolbar = (
    <>
      <div
        className={`inline-flex min-w-0 items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs ${
          loading
            ? "border-sky-500/25 bg-sky-500/10 text-sky-200"
            : "border-slate-700/80 bg-slate-800/40 text-slate-400"
        }`}
      >
        {loading ? (
          <>
            <RefreshCw className="h-3.5 w-3.5 shrink-0 animate-spin text-sky-300" />
            <span className="truncate font-medium">Refreshing…</span>
          </>
        ) : updatedAt ? (
          <>
            <Clock className="h-3.5 w-3.5 shrink-0 text-slate-500" />
            <span className="truncate">
              <span className="text-slate-500">Updated</span>{" "}
              <span className="font-medium text-slate-300">{formatUpdatedAt(updatedAt)}</span>
            </span>
          </>
        ) : (
          <>
            <Clock className="h-3.5 w-3.5 shrink-0 text-slate-500" />
            <span className="truncate font-medium text-slate-400">Loading…</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div
          role="group"
          aria-label="Reporting period"
          className="inline-flex rounded-lg border border-slate-700/80 bg-slate-800/50 p-0.5"
        >
          {PERIOD_OPTIONS.map((opt) => {
            const active = period === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPeriod(opt.value)}
                disabled={loading}
                aria-pressed={active}
                className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D9A]/50 disabled:cursor-not-allowed sm:px-3 ${
                  active
                    ? "bg-[#2E7D9A]/22 text-sky-300 ring-1 ring-[#2E7D9A]/45"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <span className="sm:hidden">{opt.shortLabel}</span>
                <span className="hidden sm:inline">{opt.label}</span>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => void load(period)}
          disabled={loading}
          title="Refresh data"
          aria-label="Refresh data"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-800/50 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition hover:border-[#2E7D9A]/45 hover:bg-[#2E7D9A]/10 hover:text-sky-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D9A]/50 disabled:cursor-not-allowed disabled:opacity-60 sm:px-3"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      <Header title="Dashboard" subtitle="Executive overview of asset inventory, audit performance, and operational health" />
      <div className="page-content flex-1 overflow-y-auto" style={{ paddingTop: 0 }}>
        <DashboardSectionNav sections={SECTIONS} toolbar={toolbar} />
        {readOnly && (
          <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-200 sm:text-sm">
            <Eye className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
            <p>
              Your account has <span className="font-semibold">view-only</span> permissions. You may review and
              monitor all dashboards and records; modifications are restricted to administrators.
            </p>
          </div>
        )}
        {error && <p className="mb-4 text-red-400">{error}</p>}
        {!data && !error && <DashboardSkeleton />}
        {data && (
          <div className="space-y-6">
            <AttentionBand
              criticalAudits={data.auditHealth.critical}
              immediateActions={data.riskCompliance.immediateActions}
              assetsUnderRepair={data.peripheralsMaintenance.assetsUnderRepair}
              openMaintenance={data.peripheralsMaintenance.openMaintenance}
              highPriority={data.riskCompliance.highPriority}
              crackedOs={data.riskCompliance.crackedOs}
            />

            <section id="glance" className="scroll-mt-[var(--dashboard-nav-offset,4rem)]">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-sky-400">Asset Status at a Glance</h2>
              <AssetStatusGlance data={data.assetStatusBreakdown} />
            </section>

            <section id="overview" className="scroll-mt-[var(--dashboard-nav-offset,4rem)]">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-sky-400">Overview</h2>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <KpiCard icon={ClipboardList} color="teal" label="Total Audits" value={data.overview.totalAudits} />
                <KpiCard icon={Boxes} color="violet" label="Total Assets" value={data.overview.totalAssets} />
                <KpiCard
                  icon={PieChart}
                  color="emerald"
                  label="Completion Rate"
                  value={formatPercent(data.overview.auditCompletionRate)}
                />
                <KpiCard icon={Clock} color="amber" label="Pending Audits" value={data.overview.pendingAudits} />
              </div>
            </section>

            <section id="breakdown" className="grid scroll-mt-[var(--dashboard-nav-offset,4rem)] items-stretch gap-6 xl:grid-cols-2">
              <div className="flex flex-col">
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-sky-400">Asset Status Breakdown</h2>
                <div className="card flex min-h-64 flex-1 items-stretch p-3 sm:min-h-72 sm:p-4">
                  <div className="h-full w-full min-h-0">
                    <AssetStatusChart data={data.assetStatusBreakdown} />
                  </div>
                </div>
              </div>
              <div className="flex flex-col">
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-sky-400">Device Type Summary</h2>
                <div className="card flex flex-1 flex-col p-4 sm:p-5">
                  <DeviceTypeChart data={data.deviceTypeBreakdown} />
                </div>
              </div>
            </section>

            <section id="health" className="grid scroll-mt-[var(--dashboard-nav-offset,4rem)] gap-6 lg:grid-cols-2">
              <div className="card p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h3 className="font-medium text-white">Audit Health</h3>
                  <SectionAlert count={data.auditHealth.critical} label="Critical" />
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <MiniStat icon={CircleCheck} color="emerald" label="OK - No Issues" value={data.auditHealth.okNoIssues} />
                  <MiniStat icon={CircleArrowUp} color="amber" label="Needs Upgrade" value={data.auditHealth.needsUpgrade} />
                  <MiniStat icon={RefreshCw} color="orange" label="Needs Replacement" value={data.auditHealth.needsReplacement} />
                  <MiniStat icon={TriangleAlert} color="red" label="Critical" value={data.auditHealth.critical} />
                </div>
              </div>
              <div className="card p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h3 className="font-medium text-white">Risk & Compliance</h3>
                  <SectionAlert count={data.riskCompliance.immediateActions} label="Immediate" />
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <MiniStat icon={Siren} color="red" label="Immediate Actions" value={data.riskCompliance.immediateActions} />
                  <MiniStat icon={Flame} color="orange" label="High Priority" value={data.riskCompliance.highPriority} />
                  <MiniStat icon={ShieldOff} color="red" label="Cracked OS" value={data.riskCompliance.crackedOs} />
                  <MiniStat icon={KeyRound} color="amber" label="Not Activated OS" value={data.riskCompliance.notActivatedOs} />
                </div>
              </div>
            </section>

            <section id="workforce" className="grid scroll-mt-[var(--dashboard-nav-offset,4rem)] gap-6 lg:grid-cols-2">
              <div className="card p-4">
                <h3 className="mb-3 font-medium text-white">Workforce & Devices</h3>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <MiniStat icon={Users} color="emerald" label="Active Employees" value={data.workforceDevices.activeEmployees} />
                  <MiniStat icon={UserPlus} color="teal" label="New Hires" value={data.workforceDevices.newHires} />
                  <MiniStat icon={UserMinus} color="amber" label="Resigned" value={data.workforceDevices.resigned} />
                  <MiniStat icon={Monitor} color="violet" label="Desktops" value={data.workforceDevices.desktops} />
                  <MiniStat icon={Laptop} color="violet" label="Laptops" value={data.workforceDevices.laptops} />
                </div>
              </div>
              <div className="card p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h3 className="font-medium text-white">Peripherals & Service Log</h3>
                  <SectionAlert count={data.peripheralsMaintenance.openMaintenance} label="Open" />
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <MiniStat icon={Hammer} color="orange" label="Open Service / Repair" value={data.peripheralsMaintenance.openMaintenance} />
                  <MiniStat icon={RefreshCw} color="amber" label="Assets Under Repair" value={data.peripheralsMaintenance.assetsUnderRepair} />
                  <MiniStat icon={Keyboard} color="red" label="Keyboard Faulty / Replace" value={data.peripheralsMaintenance.keyboardFaulty} />
                  <MiniStat icon={Keyboard} color="amber" label="Fading Keys" value={data.peripheralsMaintenance.keyboardFadingKeys} />
                  <MiniStat icon={Mouse} color="red" label="Mouse / Trackpad Faulty" value={data.peripheralsMaintenance.mouseFaulty} />
                </div>
              </div>
            </section>

            <section id="departments" className="grid scroll-mt-[var(--dashboard-nav-offset,4rem)] gap-6 lg:grid-cols-2">
              <div className="card overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-700 px-3 py-2.5 font-medium text-white sm:px-4 sm:py-3">
                  <span>By Department</span>
                  <span className="text-xs font-normal text-slate-500">Sorted by needs action</span>
                </div>
                <div className="table-scroll">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Department</th>
                        <th style={{ textAlign: "right" }}>Audits</th>
                        <th style={{ textAlign: "right" }}>Needs Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.byDepartment.length === 0 && <EmptyRow colSpan={3} />}
                      {[...data.byDepartment]
                        .sort((a, b) => b.needsAction - a.needsAction || b.audits - a.audits)
                        .map((row) => (
                          <tr key={row.department} className={row.needsAction > 0 ? "bg-red-500/5" : undefined}>
                            <td>{row.department}</td>
                            <td style={{ textAlign: "right" }}>{row.audits}</td>
                            <td style={{ textAlign: "right" }}>
                              <CountPill value={row.needsAction} />
                            </td>
                          </tr>
                        ))}
                    </tbody>
                    {data.byDepartment.length > 0 && (
                      <tfoot>
                        <tr className="font-semibold text-slate-300">
                          <td>Total</td>
                          <td style={{ textAlign: "right" }}>
                            {data.byDepartment.reduce((sum, row) => sum + row.audits, 0)}
                          </td>
                          <td style={{ textAlign: "right" }}>
                            {data.byDepartment.reduce((sum, row) => sum + row.needsAction, 0)}
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
              <div className="card overflow-hidden">
                <div className="border-b border-slate-700 px-3 py-2.5 font-medium text-white sm:px-4 sm:py-3">By Assessment</div>
                <div className="table-scroll">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Assessment</th>
                        <th style={{ textAlign: "right" }}>Count</th>
                        <th>Share</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.byAssessment.length === 0 && <EmptyRow colSpan={3} />}
                      {[...data.byAssessment]
                        .sort((a, b) => b.count - a.count)
                        .map((row) => (
                          <tr key={row.assessment}>
                            <td>
                              <Badge value={row.assessment} />
                            </td>
                            <td style={{ textAlign: "right" }}>{row.count}</td>
                            <td>
                              <PercentBar percent={row.percent} colorKey={row.assessment} />
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            <section id="priority" className="grid scroll-mt-[var(--dashboard-nav-offset,4rem)] gap-6 lg:grid-cols-2">
              <div className="card overflow-hidden">
                <div className="border-b border-slate-700 px-3 py-2.5 font-medium text-white sm:px-4 sm:py-3">By Priority</div>
                <div className="table-scroll">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Priority</th>
                        <th style={{ textAlign: "right" }}>Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.byPriority.length === 0 && <EmptyRow colSpan={2} />}
                      {[...data.byPriority]
                        .sort((a, b) => b.count - a.count)
                        .map((row) => (
                          <tr key={row.priority}>
                            <td>
                              <Badge value={row.priority} />
                            </td>
                            <td style={{ textAlign: "right" }}>{row.count}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="card overflow-hidden">
                <div className="border-b border-slate-700 px-3 py-2.5 font-medium text-white sm:px-4 sm:py-3">Recommended Action</div>
                <div className="table-scroll">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Action</th>
                        <th style={{ textAlign: "right" }}>Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.byRecommendedAction.length === 0 && <EmptyRow colSpan={2} />}
                      {[...data.byRecommendedAction]
                        .sort((a, b) => b.count - a.count)
                        .map((row) => (
                          <tr key={row.action}>
                            <td>
                              <Badge value={row.action} />
                            </td>
                            <td style={{ textAlign: "right" }}>{row.count}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </>
  );
}
