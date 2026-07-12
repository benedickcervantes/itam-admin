export type AssignmentFormMode = "create" | "edit";

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function validateAssignmentForm(
  form: Record<string, string>,
  mode: AssignmentFormMode,
): Record<string, string> {
  const errors: Record<string, string> = {};
  const assignedTo = form.assignedTo?.trim() ?? "";
  const assignedDate = form.assignedDate?.trim() ?? "";
  const returnedDate = form.returnedDate?.trim() ?? "";

  if (mode === "create" && !form.assetId) {
    errors.assetId = "Select an asset to assign.";
  }

  if (!assignedTo) errors.assignedTo = "Employee name is required.";
  else if (assignedTo.length < 2) errors.assignedTo = "Enter at least 2 characters.";

  if (!assignedDate) errors.assignedDate = "Assigned date is required.";

  if (returnedDate && assignedDate && returnedDate < assignedDate) {
    errors.returnedDate = "Return date cannot be before the assigned date.";
  }

  return errors;
}
