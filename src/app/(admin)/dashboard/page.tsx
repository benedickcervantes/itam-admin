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
} from "lucide-react";
import { Header } from "@/components/Header";
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

const PERIOD_OPTIONS: { value: DashboardPeriod; label: string }[] = [
  { value: "week", label: "Weekly" },
  { value: "month", label: "Monthly" },
  { value: "quarter", label: "Quarterly" },
  { value: "year", label: "Yearly" },
];

const SECTIONS: DashboardSection[] = [
  { id: "glance", label: "At a Glance" },
  { id: "overview", label: "Overview" },
  { id: "breakdown", label: "Breakdown" },
  { id: "health", label: "Health & Risk" },
  { id: "workforce", label: "Workforce" },
  { id: "departments", label: "Departments" },
  { id: "priority", label: "Priority" },
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

  return (
    <>
      <Header title="Dashboard" subtitle="Executive overview of asset inventory, audit performance, and operational health" />
      <div className="page-content flex-1 overflow-y-auto">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            {loading ? (
              <span className="inline-flex items-center gap-1.5 text-slate-400">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                Refreshing data…
              </span>
            ) : (
              updatedAt && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-slate-500" />
                  Last updated {formatUpdatedAt(updatedAt)}
                </span>
              )
            )}
          </div>
          <div className="inline-flex rounded-lg border border-slate-700 bg-slate-800/60 p-0.5">
            {PERIOD_OPTIONS.map((opt) => {
              const active = period === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPeriod(opt.value)}
                  disabled={loading}
                  aria-pressed={active}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed ${
                    active
                      ? "bg-sky-500/20 text-sky-300 ring-1 ring-sky-500/40"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
        {error && <p className="mb-4 text-red-400">{error}</p>}
        {!data && !error && <DashboardSkeleton />}
        {data && (
          <div>
            <DashboardSectionNav sections={SECTIONS} />
            <div className="space-y-6">
            <AttentionBand
              criticalAudits={data.auditHealth.critical}
              immediateActions={data.riskCompliance.immediateActions}
              assetsUnderRepair={data.peripheralsMaintenance.assetsUnderRepair}
              openMaintenance={data.peripheralsMaintenance.openMaintenance}
              highPriority={data.riskCompliance.highPriority}
              crackedOs={data.riskCompliance.crackedOs}
            />

            <section id="glance" className="scroll-mt-16">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-sky-400">Asset Status at a Glance</h2>
              <AssetStatusGlance data={data.assetStatusBreakdown} />
            </section>

            <section id="overview" className="scroll-mt-16">
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

            <section id="breakdown" className="grid scroll-mt-16 items-stretch gap-6 xl:grid-cols-2">
              <div className="flex flex-col">
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-sky-400">Asset Status Breakdown</h2>
                <div className="card flex flex-1 items-center p-4 sm:p-5">
                  <div className="w-full">
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

            <section id="health" className="grid scroll-mt-16 gap-6 lg:grid-cols-2">
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

            <section id="workforce" className="grid scroll-mt-16 gap-6 lg:grid-cols-2">
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
                  <h3 className="font-medium text-white">Peripherals & Maintenance</h3>
                  <SectionAlert count={data.peripheralsMaintenance.openMaintenance} label="Open" />
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <MiniStat icon={Hammer} color="orange" label="Open Maintenance" value={data.peripheralsMaintenance.openMaintenance} />
                  <MiniStat icon={RefreshCw} color="amber" label="Assets Under Repair" value={data.peripheralsMaintenance.assetsUnderRepair} />
                  <MiniStat icon={Keyboard} color="red" label="Keyboard Issues" value={data.peripheralsMaintenance.keyboardIssues} />
                  <MiniStat icon={Mouse} color="teal" label="Personal Mouse (BYOD)" value={data.peripheralsMaintenance.personalMouse} />
                </div>
              </div>
            </section>

            <section id="departments" className="grid scroll-mt-16 gap-6 lg:grid-cols-2">
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

            <section id="priority" className="grid scroll-mt-16 gap-6 lg:grid-cols-2">
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
          </div>
        )}
      </div>
    </>
  );
}
