"use client";

import {
  ALL_SOFTWARE_EXPORT_COLUMN_KEYS,
  SOFTWARE_EXPORT_COLUMN_SECTIONS,
  type SoftwareExportColumnKey,
} from "@/lib/export-software";
import { ExportColumnDialog } from "./ExportColumnDialog";

export function SoftwareExportColumnDialog(props: {
  open: boolean;
  filterSummary?: string;
  exporting?: boolean;
  onClose: () => void;
  onExport: (format: "excel" | "pdf", columns: SoftwareExportColumnKey[]) => void;
}) {
  return (
    <ExportColumnDialog
      open={props.open}
      titleId="software-export-dialog-title"
      allColumnKeys={ALL_SOFTWARE_EXPORT_COLUMN_KEYS}
      columnSections={SOFTWARE_EXPORT_COLUMN_SECTIONS}
      filterSummary={props.filterSummary}
      exporting={props.exporting}
      onClose={props.onClose}
      onExport={props.onExport}
    />
  );
}
