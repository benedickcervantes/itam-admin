import type { Assignment } from "./types";

export type AssignmentExportColumnKey =
  | "recordId"
  | "assetId"
  | "computer"
  | "assignedTo"
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
      { key: "recordId", header: "Record ID", width: 14, value: (r) => r.record_code },
      { key: "assetId", header: "Asset ID", width: 14, value: (r) => r.asset?.asset_code ?? "" },
      { key: "computer", header: "Computer", width: 22, value: (r) => r.asset?.computer_name ?? "" },
    ],
  },
  {
    title: "ASSIGNMENT",
    columns: [
      { key: "assignedTo", header: "Assigned To", width: 22, value: (r) => r.assigned_to },
      { key: "department", header: "Department", width: 18, value: (r) => r.department?.name ?? "" },
      { key: "assignedDate", header: "Assigned Date", width: 14, value: (r) => r.assigned_date.slice(0, 10) },
      { key: "returnedDate", header: "Returned Date", width: 14, value: (r) => r.returned_date?.slice(0, 10) ?? "" },
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

function resolveExportColumns(selectedColumnKeys?: AssignmentExportColumnKey[]): Column[] {
  const selected = new Set(selectedColumnKeys ?? ALL_ASSIGNMENT_EXPORT_COLUMN_KEYS);
  return COLUMN_SECTIONS.flatMap((section) => section.columns.filter((column) => selected.has(column.key)));
}

function rowsToMatrix(rows: Assignment[], columns: Column[]) {
  return rows.map((row) => columns.map((col) => col.value(row)));
}

export function exportAssignmentsPdf(
  rows: Assignment[],
  filterSummary?: string,
  selectedColumnKeys?: AssignmentExportColumnKey[],
) {
  const columns = resolveExportColumns(selectedColumnKeys);
  const headers = columns.map((c) => c.header);
  const body = rowsToMatrix(rows, columns);
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Assignments Export</title>
<style>
body{font-family:Segoe UI,Arial,sans-serif;margin:24px;color:#111}
h1{font-size:18px;margin:0 0 4px}
.meta{font-size:12px;color:#555;margin-bottom:16px}
table{border-collapse:collapse;width:100%;font-size:11px}
th,td{border:1px solid #ccc;padding:6px 8px;text-align:left;vertical-align:top}
th{background:#1e3a5f;color:#fff}
tr:nth-child(even) td{background:#f8fafc}
</style></head><body>
<h1>Assignment History Export</h1>
<div class="meta">${filterSummary ? `Filters: ${filterSummary}` : "All records"} · ${rows.length} row(s)</div>
<table><thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
<tbody>${body.map((r) => `<tr>${r.map((c) => `<td>${String(c).replace(/</g, "&lt;")}</td>`).join("")}</tr>`).join("")}</tbody>
</table></body></html>`;
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.focus();
  w.print();
}

export async function exportAssignmentsExcel(
  rows: Assignment[],
  filterSummary?: string,
  selectedColumnKeys?: AssignmentExportColumnKey[],
) {
  const columns = resolveExportColumns(selectedColumnKeys);
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "ITAM Admin";
  workbook.created = new Date();
  const ws = workbook.addWorksheet("Assignments");

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
  a.download = `assignments-export-${new Date().toISOString().slice(0, 10)}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
