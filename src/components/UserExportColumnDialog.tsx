"use client";

import {
  ALL_USER_EXPORT_COLUMN_KEYS,
  USER_EXPORT_COLUMN_SECTIONS,
  type UserExportColumnKey,
} from "@/lib/export-users";
import { ExportColumnDialog } from "./ExportColumnDialog";

export function UserExportColumnDialog(props: {
  open: boolean;
  filterSummary?: string;
  exporting?: boolean;
  onClose: () => void;
  onExport: (format: "excel" | "pdf", columns: UserExportColumnKey[]) => void;
}) {
  return (
    <ExportColumnDialog
      open={props.open}
      titleId="user-export-dialog-title"
      allColumnKeys={ALL_USER_EXPORT_COLUMN_KEYS}
      columnSections={USER_EXPORT_COLUMN_SECTIONS}
      filterSummary={props.filterSummary}
      exporting={props.exporting}
      onClose={props.onClose}
      onExport={props.onExport}
    />
  );
}
