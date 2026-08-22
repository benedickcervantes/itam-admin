import { apiJson } from "./client";

export type DashboardPeriod = "week" | "month" | "quarter" | "year" | "all";

export type DashboardSummary = {
  period?: DashboardPeriod;
  overview: {
    totalAudits: number;
    totalAssets: number;
    auditCompletionRate: number;
    pendingAudits: number;
  };
  assetStatusBreakdown: { status: string; count: number }[];
  deviceTypeBreakdown: { deviceType: string; count: number }[];
  auditHealth: {
    okNoIssues: number;
    needsUpgrade: number;
    needsReplacement: number;
    critical: number;
  };
  riskCompliance: {
    immediateActions: number;
    highPriority: number;
    crackedOs: number;
    notActivatedOs: number;
  };
  workforceDevices: {
    activeEmployees: number;
    resigned: number;
    newHires: number;
    desktops: number;
    laptops: number;
  };
  peripheralsMaintenance: {
    keyboardFaulty: number;
    keyboardFadingKeys: number;
    mouseFaulty: number;
    openMaintenance: number;
    assetsUnderRepair: number;
  };
  byDepartment: { department: string; audits: number; needsAction: number }[];
  byAssessment: { assessment: string; count: number; percent: number }[];
  byPriority: { priority: string; count: number }[];
  byRecommendedAction: { action: string; count: number }[];
};

export function fetchDashboardSummary(period: DashboardPeriod = "year") {
  const query = period && period !== "all" ? `?period=${period}` : "";
  return apiJson<DashboardSummary>(`/api/v1/dashboard/summary${query}`, { auth: true });
}
