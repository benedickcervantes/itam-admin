"use client";

import {
  ALL_DISPOSAL_EXPORT_COLUMN_KEYS,
  DISPOSAL_EXPORT_COLUMN_SECTIONS,
  type DisposalExportColumnKey,
} from "@/lib/export-disposals";
import { ExportColumnDialog } from "./ExportColumnDialog";

export function DisposalExportColumnDialog(props: {
  open: boolean;
  filterSummary?: string;
  exporting?: boolean;
  onClose: () => void;
  onExport: (format: "excel" | "pdf", columns: DisposalExportColumnKey[]) => void;
}) {
  return (
    <ExportColumnDialog
      open={props.open}
      titleId="disposal-export-dialog-title"
      allColumnKeys={ALL_DISPOSAL_EXPORT_COLUMN_KEYS}
      columnSections={DISPOSAL_EXPORT_COLUMN_SECTIONS}
      filterSummary={props.filterSummary}
      exporting={props.exporting}
      onClose={props.onClose}
      onExport={props.onExport}
    />
  );
}
