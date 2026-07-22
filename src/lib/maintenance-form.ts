import { REFERENCE_DATA } from "@/lib/reference-data";

export type MaintenanceFormMode = "create" | "edit";
export type MaintenanceStatus = (typeof REFERENCE_DATA.maintenanceStatuses)[number];

export const MAINTENANCE_STATUS_META: Record<
  MaintenanceStatus,
  { label: string; description: string }
> = {
  OPEN: { label: "Open", description: "Logged — work not started yet." },
  IN_PROGRESS: { label: "In Progress", description: "Repair or service underway." },
  COMPLETED: { label: "Completed", description: "Work finished; record closed." },
  CANCELLED: { label: "Cancelled", description: "No longer needed." },
};

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function validateMaintenanceForm(
  form: Record<string, string>,
  _mode: MaintenanceFormMode,
): Record<string, string> {
  const errors: Record<string, string> = {};
  const computerName = form.computerName?.trim() ?? "";
  const issue = form.issue?.trim() ?? "";
  const dateOpened = form.dateOpened?.trim() ?? "";
  const dateClosed = form.dateClosed?.trim() ?? "";
  const status = form.status ?? "OPEN";

  if (!computerName) errors.computerName = "Select the asset being serviced.";

  if (!issue) errors.issue = "Describe the fault, finding, or service reason.";
  else if (issue.length < 5) errors.issue = "Provide more detail (at least 5 characters).";

  if (dateOpened && dateClosed && dateClosed < dateOpened) {
    errors.dateClosed = "Close date cannot be before the opened date.";
  }

  if (status === "COMPLETED" && !form.actionTaken?.trim()) {
    errors.actionTaken = "Describe what was done before marking as completed.";
  }

  if (status === "COMPLETED" && !dateClosed) {
    errors.dateClosed = "Set a close date when marking the service completed.";
  }

  return errors;
}
