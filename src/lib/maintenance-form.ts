import { REFERENCE_DATA } from "@/lib/reference-data";

export type MaintenanceFormMode = "create" | "edit";
export type MaintenanceStatus = (typeof REFERENCE_DATA.maintenanceStatuses)[number];

export const MAINTENANCE_STATUS_META: Record<
  MaintenanceStatus,
  { label: string; description: string }
> = {
  OPEN: { label: "Open", description: "New ticket — work has not started yet." },
  IN_PROGRESS: { label: "In Progress", description: "Repair or service is currently underway." },
  COMPLETED: { label: "Completed", description: "Issue resolved and the ticket is closed." },
  CANCELLED: { label: "Cancelled", description: "No longer needed or superseded." },
};

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function validateMaintenanceForm(
  form: Record<string, string>,
  mode: MaintenanceFormMode,
): Record<string, string> {
  const errors: Record<string, string> = {};
  const issue = form.issue?.trim() ?? "";
  const dateOpened = form.dateOpened?.trim() ?? "";
  const dateClosed = form.dateClosed?.trim() ?? "";
  const status = form.status ?? "OPEN";

  if (!issue) errors.issue = "Describe the issue or request.";
  else if (issue.length < 5) errors.issue = "Provide more detail (at least 5 characters).";

  if (dateOpened && dateClosed && dateClosed < dateOpened) {
    errors.dateClosed = "Close date cannot be before the opened date.";
  }

  if (status === "COMPLETED" && !form.actionTaken?.trim()) {
    errors.actionTaken = "Describe what was done before marking as completed.";
  }

  if (status === "COMPLETED" && !dateClosed && mode === "create") {
    errors.dateClosed = "Set a close date when marking the ticket completed.";
  }

  return errors;
}
