"use client";

import {
  ALL_ASSIGNMENT_EXPORT_COLUMN_KEYS,
  ASSIGNMENT_EXPORT_COLUMN_SECTIONS,
  type AssignmentExportColumnKey,
} from "@/lib/export-assignments";
import { ExportColumnDialog } from "./ExportColumnDialog";

export function AssignmentExportColumnDialog(props: {
  open: boolean;
  filterSummary?: string;
  exporting?: boolean;
  onClose: () => void;
  onExport: (format: "excel" | "pdf", columns: AssignmentExportColumnKey[]) => void;
}) {
  return (
    <ExportColumnDialog
      open={props.open}
      titleId="assignment-export-dialog-title"
      allColumnKeys={ALL_ASSIGNMENT_EXPORT_COLUMN_KEYS}
      columnSections={ASSIGNMENT_EXPORT_COLUMN_SECTIONS}
      filterSummary={props.filterSummary}
      exporting={props.exporting}
      onClose={props.onClose}
      onExport={props.onExport}
    />
  );
}
