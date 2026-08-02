import { openLandscapeTablePdf } from "./export-pdf";
import type { Assignment } from "./types";

export type AssignmentExportColumnKey =
  | "recordId"
  | "assetId"
  | "brandModel"
  | "computer"
  | "assignedTo"
  | "lastUser"
  | "department"
  | "assignedDate"
  | "returnedDate"
  | "assignedBy"
  | "notes";

type Column = {
  key: AssignmentExportColumnKey;
  header: string;
  width: number;
  value: (row: Assignment) => string;
};

export type AssignmentExportColumnSection = {
  title: string;
  columns: Array<{ key: AssignmentExportColumnKey; header: string }>;
};

type ColumnSection = {
  title: string;
  columns: Column[];
};

const COLUMN_SECTIONS: ColumnSection[] = [
  {
    title: "ASSET",
    columns: [
      { key: "recordId", header: "Record ID", width: 12, value: (r) => r.record_code },
      { key: "assetId", header: "Asset ID", width: 12, value: (r) => r.asset?.asset_code ?? "" },
      { key: "brandModel", header: "Brand / Model", width: 24, value: (r) => r.asset?.brand_model ?? "" },
      { key: "computer", header: "Computer", width: 18, value: (r) => r.asset?.computer_name ?? "" },
    ],
  },
  {
    title: "ASSIGNMENT",
    columns: [
      { key: "assignedTo", header: "Assigned To", width: 18, value: (r) => r.assigned_to },
      { key: "lastUser", header: "Last User", width: 18, value: (r) => r.last_user ?? "" },
      { key: "department", header: "Department", width: 16, value: (r) => r.department?.name ?? "" },
      { key: "assignedDate", header: "Assigned Date", width: 12, value: (r) => r.assigned_date.slice(0, 10) },
      { key: "returnedDate", header: "Returned Date", width: 12, value: (r) => r.returned_date?.slice(0, 10) ?? "" },
      { key: "assignedBy", header: "Assigned By", width: 18, value: (r) => r.assigned_by ?? "" },
    ],
  },
  {
    title: "NOTES",
    columns: [{ key: "notes", header: "Notes", width: 28, value: (r) => r.notes ?? "" }],
  },
];

export const ASSIGNMENT_EXPORT_COLUMN_SECTIONS: AssignmentExportColumnSection[] = COLUMN_SECTIONS.map((section) => ({
  title: section.title,
  columns: section.columns.map(({ key, header }) => ({ key, header })),
}));

export const ALL_ASSIGNMENT_EXPORT_COLUMN_KEYS: AssignmentExportColumnKey[] = COLUMN_SECTIONS.flatMap((section) =>
  section.columns.map((column) => column.key),
);

function resolveExportSections(selectedColumnKeys?: AssignmentExportColumnKey[]): ColumnSection[] {
  const selected = new Set(selectedColumnKeys ?? ALL_ASSIGNMENT_EXPORT_COLUMN_KEYS);
  return COLUMN_SECTIONS.map((section) => ({
    ...section,
    columns: section.columns.filter((column) => selected.has(column.key)),
  })).filter((section) => section.columns.length > 0);
}

export function exportAssignmentsPdf(
  rows: Assignment[],
  filterSummary?: string,
  selectedColumnKeys?: AssignmentExportColumnKey[],
) {
  const sections = resolveExportSections(selectedColumnKeys);
  const columns = sections.flatMap((section) => section.columns);
  openLandscapeTablePdf({
    documentTitle: "Device History Export",
    title: "DEVICE HISTORY",
    filterSummary,
    rowCount: rows.length,
    sections: sections.map((s) => ({ title: s.title, headers: s.columns.map((c) => c.header) })),
    bodyRows: rows.map((row) => columns.map((c) => c.value(row))),
  });
}

export async function exportAssignmentsExcel(
  rows: Assignment[],
  filterSummary?: string,
  selectedColumnKeys?: AssignmentExportColumnKey[],
) {
  const sections = resolveExportSections(selectedColumnKeys);
  const columns = sections.flatMap((section) => section.columns);
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "ITAM Admin";
  workbook.created = new Date();
  const ws = workbook.addWorksheet("Device History", {
    views: [{ state: "frozen", ySplit: 1 }],
    pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  });

  columns.forEach((c, i) => {
    ws.getColumn(i + 1).width = c.width;
  });

  ws.addRow(columns.map((c) => c.header));
  const headerRow = ws.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2E7D9A" } };

  rows.forEach((row) => ws.addRow(columns.map((c) => c.value(row))));

  if (filterSummary) {
    const info = workbook.addWorksheet("Info");
    info.addRow(["Filter summary", filterSummary]);
    info.addRow(["Exported rows", rows.length]);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `device-history-export-${new Date().toISOString().slice(0, 10)}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
