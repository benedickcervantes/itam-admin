"use client";

import {
  ALL_ASSET_EXPORT_COLUMN_KEYS,
  ASSET_EXPORT_COLUMN_SECTIONS,
  type AssetExportColumnKey,
} from "@/lib/export-assets";
import { ExportColumnDialog } from "./ExportColumnDialog";

export function AssetExportColumnDialog({
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
  onExport: (format: "excel" | "pdf", columns: AssetExportColumnKey[]) => void;
}) {
  return (
    <ExportColumnDialog
      open={open}
      titleId="asset-export-dialog-title"
      allColumnKeys={ALL_ASSET_EXPORT_COLUMN_KEYS}
      columnSections={ASSET_EXPORT_COLUMN_SECTIONS}
      filterSummary={filterSummary}
      exporting={exporting}
      onClose={onClose}
      onExport={onExport}
    />
  );
}
