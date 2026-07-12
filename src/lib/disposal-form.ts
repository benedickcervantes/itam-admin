import { REFERENCE_DATA } from "@/lib/reference-data";

export type DisposalFormMode = "create" | "edit";
export type DisposalMethod = (typeof REFERENCE_DATA.disposalMethods)[number];

export const DISPOSAL_METHOD_META: Record<
  DisposalMethod,
  { label: string; description: string }
> = {
  SOLD: { label: "Sold", description: "Resold or auctioned to recover value." },
  DONATED: { label: "Donated", description: "Transferred to charity or another organization." },
  RECYCLED: { label: "Recycled", description: "Sent to an approved e-waste recycling facility." },
  DESTROYED: { label: "Destroyed", description: "Physically destroyed or securely shredded." },
  LOST: { label: "Lost", description: "Asset lost and written off from inventory." },
  STOLEN: { label: "Stolen", description: "Reported stolen and removed from active stock." },
  TRADE_IN: { label: "Trade-in", description: "Exchanged toward new equipment purchase." },
  OTHER: { label: "Other", description: "Another disposal path not listed above." },
};

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function validateDisposalForm(
  form: Record<string, string>,
  mode: DisposalFormMode,
): Record<string, string> {
  const errors: Record<string, string> = {};
  const reason = form.disposalReason?.trim() ?? "";

  if (mode === "create" && !form.assetId) {
    errors.assetId = "Select the asset being disposed.";
  }

  if (!form.disposalDate) errors.disposalDate = "Disposal date is required.";

  if (!reason) errors.disposalReason = "Reason for disposal is required.";
  else if (reason.length < 5) errors.disposalReason = "Provide a brief reason (at least 5 characters).";

  return errors;
}
