"use client";

import {
  ALL_AUDIT_EXPORT_COLUMN_KEYS,
  AUDIT_EXPORT_COLUMN_SECTIONS,
  type AuditExportColumnKey,
} from "@/lib/export-audit";
import { ExportColumnDialog } from "./ExportColumnDialog";

export function AuditExportColumnDialog({
  open,
  filterSummary,
  exporting = false,
  onClose,
  onExport,
}: {
  open: boolean;
  filterSummary?: string;
  exporting?: boolean;
  onClose: () => void;
  onExport: (format: "excel" | "pdf", columns: AuditExportColumnKey[]) => void;
}) {
  return (
    <ExportColumnDialog
      open={open}
      titleId="audit-export-dialog-title"
      allColumnKeys={ALL_AUDIT_EXPORT_COLUMN_KEYS}
      columnSections={AUDIT_EXPORT_COLUMN_SECTIONS}
      filterSummary={filterSummary}
      exporting={exporting}
      onClose={onClose}
      onExport={onExport}
    />
  );
}
