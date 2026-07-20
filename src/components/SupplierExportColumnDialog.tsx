"use client";

import {
  ALL_SUPPLIER_EXPORT_COLUMN_KEYS,
  SUPPLIER_EXPORT_COLUMN_SECTIONS,
  type SupplierExportColumnKey,
} from "@/lib/export-suppliers";
import { ExportColumnDialog } from "./ExportColumnDialog";

export function SupplierExportColumnDialog(props: {
  open: boolean;
  filterSummary?: string;
  exporting?: boolean;
  onClose: () => void;
  onExport: (format: "excel" | "pdf", columns: SupplierExportColumnKey[]) => void;
}) {
  return (
    <ExportColumnDialog
      open={props.open}
      titleId="supplier-export-dialog-title"
      allColumnKeys={ALL_SUPPLIER_EXPORT_COLUMN_KEYS}
      columnSections={SUPPLIER_EXPORT_COLUMN_SECTIONS}
      filterSummary={props.filterSummary}
      exporting={props.exporting}
      onClose={props.onClose}
      onExport={props.onExport}
    />
  );
}
