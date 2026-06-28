import { apiJson } from "./client";

export type DashboardSummary = {
  overview: {
    totalAudits: number;
    totalAssets: number;
    auditCompletionRate: number;
    pendingAudits: number;
  };
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
    keyboardIssues: number;
    personalMouse: number;
    openMaintenance: number;
    assetsUnderRepair: number;
  };
  byDepartment: { department: string; audits: number; needsAction: number }[];
  byAssessment: { assessment: string; count: number; percent: number }[];
  byPriority: { priority: string; count: number }[];
  byRecommendedAction: { action: string; count: number }[];
};

export function fetchDashboardSummary() {
  return apiJson<DashboardSummary>("/api/v1/dashboard/summary", { auth: true });
}
