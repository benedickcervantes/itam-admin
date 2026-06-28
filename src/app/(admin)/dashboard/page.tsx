"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { fetchDashboardSummary, type DashboardSummary } from "@/lib/api/dashboard";
import { formatPercent, labelEnum } from "@/lib/labels";

function KpiCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="card p-4">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="kpi-value mt-1">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
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
                <KpiCard label="Total Audits" value={data.overview.totalAudits} />
                <KpiCard label="Total Assets" value={data.overview.totalAssets} />
                <KpiCard label="Completion Rate" value={formatPercent(data.overview.auditCompletionRate)} />
                <KpiCard label="Pending Audits" value={data.overview.pendingAudits} />
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <div className="card p-4">
                <h3 className="mb-3 font-medium text-white">Audit Health</h3>
                <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                  <div>OK: {data.auditHealth.okNoIssues}</div>
                  <div>Needs Upgrade: {data.auditHealth.needsUpgrade}</div>
                  <div>Needs Replacement: {data.auditHealth.needsReplacement}</div>
                  <div>Critical: {data.auditHealth.critical}</div>
                </div>
              </div>
              <div className="card p-4">
                <h3 className="mb-3 font-medium text-white">Risk & Compliance</h3>
                <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                  <div>Immediate Actions: {data.riskCompliance.immediateActions}</div>
                  <div>High Priority: {data.riskCompliance.highPriority}</div>
                  <div>Cracked OS: {data.riskCompliance.crackedOs}</div>
                  <div>Not Activated OS: {data.riskCompliance.notActivatedOs}</div>
                </div>
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <div className="card overflow-hidden">
                <div className="border-b border-slate-700 px-3 py-2.5 font-medium text-white sm:px-4 sm:py-3">By Department</div>
                <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Department</th>
                      <th>Audits</th>
                      <th>Needs Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.byDepartment.map((row) => (
                      <tr key={row.department}>
                        <td>{row.department}</td>
                        <td>{row.audits}</td>
                        <td>{row.needsAction}</td>
                      </tr>
                    ))}
                  </tbody>
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
                      <th>Count</th>
                      <th>%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.byAssessment.map((row) => (
                      <tr key={row.assessment}>
                        <td>{labelEnum(row.assessment)}</td>
                        <td>{row.count}</td>
                        <td>{formatPercent(row.percent)}</td>
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
                      <th>Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.byPriority.map((row) => (
                      <tr key={row.priority}>
                        <td>{labelEnum(row.priority)}</td>
                        <td>{row.count}</td>
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
                      <th>Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.byRecommendedAction.map((row) => (
                      <tr key={row.action}>
                        <td>{labelEnum(row.action)}</td>
                        <td>{row.count}</td>
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
