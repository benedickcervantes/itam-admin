"use client";

import { useEffect, useState } from "react";
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
} from "lucide-react";
import { Header } from "@/components/Header";
import { Badge } from "@/components/Badge";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { MiniStat } from "@/components/dashboard/MiniStat";
import { AssetStatusChart } from "@/components/dashboard/AssetStatusChart";
import { DeviceTypeChart } from "@/components/dashboard/DeviceTypeChart";
import { CountPill, PercentBar } from "@/components/dashboard/TableBits";
import { fetchDashboardSummary, type DashboardSummary } from "@/lib/api/dashboard";
import { formatPercent } from "@/lib/labels";

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

export default function DashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboardSummary()
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load dashboard"));
  }, []);

  return (
    <>
      <Header title="Dashboard" subtitle="Management overview aligned to Excel template metrics" />
      <div className="page-content flex-1 overflow-y-auto">
        {error && <p className="mb-4 text-red-400">{error}</p>}
        {!data && !error && <p className="text-slate-400">Loading metrics...</p>}
        {data && (
          <div className="space-y-6">
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#2E7D9A]">Overview</h2>
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

            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#2E7D9A]">Asset Status</h2>
              <div className="card p-4 sm:p-5">
                <AssetStatusChart data={data.assetStatusBreakdown} />
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#2E7D9A]">Device Type Summary</h2>
              <div className="card p-4 sm:p-5">
                <DeviceTypeChart data={data.deviceTypeBreakdown} />
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
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

            <section className="grid gap-6 lg:grid-cols-2">
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

            <section className="grid gap-6 lg:grid-cols-2">
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
