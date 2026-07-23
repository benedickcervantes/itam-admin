"use client";

import {
  ALL_ACTIVITY_LOG_EXPORT_COLUMN_KEYS,
  ACTIVITY_LOG_EXPORT_COLUMN_SECTIONS,
  type ActivityLogExportColumnKey,
} from "@/lib/export-activity-logs";
import { ExportColumnDialog } from "./ExportColumnDialog";

export function ActivityLogExportColumnDialog(props: {
  open: boolean;
  filterSummary?: string;
  exporting?: boolean;
  onClose: () => void;
  onExport: (format: "excel" | "pdf", columns: ActivityLogExportColumnKey[]) => void;
}) {
  return (
    <ExportColumnDialog
      open={props.open}
      titleId="activity-log-export-dialog-title"
      allColumnKeys={ALL_ACTIVITY_LOG_EXPORT_COLUMN_KEYS}
      columnSections={ACTIVITY_LOG_EXPORT_COLUMN_SECTIONS}
      filterSummary={props.filterSummary}
      exporting={props.exporting}
      onClose={props.onClose}
      onExport={props.onExport}
    />
  );
}
