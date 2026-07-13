"use client";

import {
  ALL_MAINTENANCE_EXPORT_COLUMN_KEYS,
  MAINTENANCE_EXPORT_COLUMN_SECTIONS,
  type MaintenanceExportColumnKey,
} from "@/lib/export-maintenance";
import { ExportColumnDialog } from "./ExportColumnDialog";

export function MaintenanceExportColumnDialog(props: {
  open: boolean;
  filterSummary?: string;
  exporting?: boolean;
  onClose: () => void;
  onExport: (format: "excel" | "pdf", columns: MaintenanceExportColumnKey[]) => void;
}) {
  return (
    <ExportColumnDialog
      open={props.open}
      titleId="maintenance-export-dialog-title"
      allColumnKeys={ALL_MAINTENANCE_EXPORT_COLUMN_KEYS}
      columnSections={MAINTENANCE_EXPORT_COLUMN_SECTIONS}
      filterSummary={props.filterSummary}
      exporting={props.exporting}
      onClose={props.onClose}
      onExport={props.onExport}
    />
  );
}
