import { labelEnum } from "./labels";
import type { AdminUser } from "./types";

export type UserExportColumnKey =
  | "fullName"
  | "email"
  | "role"
  | "department"
  | "status"
  | "joined";

type Column = {
  key: UserExportColumnKey;
  header: string;
  width: number;
  value: (row: AdminUser) => string;
};

export type UserExportColumnSection = {
  title: string;
  columns: Array<{ key: UserExportColumnKey; header: string }>;
};

type ColumnSection = {
  title: string;
  columns: Column[];
};

function formatDate(value?: string) {
  if (!value) return "";
  return new Date(value).toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" });
}

const COLUMN_SECTIONS: ColumnSection[] = [
  {
    title: "ACCOUNT",
    columns: [
      { key: "fullName", header: "Full Name", width: 24, value: (r) => r.full_name },
      { key: "email", header: "Email", width: 28, value: (r) => r.email },
      { key: "role", header: "Role", width: 14, value: (r) => labelEnum(r.role) },
      {
        key: "department",
        header: "Department",
        width: 20,
        value: (r) => r.department?.name ?? "",
      },
      {
        key: "status",
        header: "Status",
        width: 12,
        value: (r) => (r.is_active ? "Active" : "Inactive"),
      },
      { key: "joined", header: "Joined", width: 14, value: (r) => formatDate(r.created_at) },
    ],
  },
];

export const USER_EXPORT_COLUMN_SECTIONS: UserExportColumnSection[] = COLUMN_SECTIONS.map((section) => ({
  title: section.title,
  columns: section.columns.map(({ key, header }) => ({ key, header })),
}));

export const ALL_USER_EXPORT_COLUMN_KEYS: UserExportColumnKey[] = COLUMN_SECTIONS.flatMap((section) =>
  section.columns.map((column) => column.key),
);

function resolveExportColumns(selectedColumnKeys?: UserExportColumnKey[]): Column[] {
  const selected = new Set(selectedColumnKeys ?? ALL_USER_EXPORT_COLUMN_KEYS);
  return COLUMN_SECTIONS.flatMap((section) => section.columns.filter((column) => selected.has(column.key)));
}

function rowsToMatrix(rows: AdminUser[], columns: Column[]) {
  return rows.map((row) => columns.map((col) => col.value(row)));
}

export function exportUsersPdf(
  rows: AdminUser[],
  filterSummary?: string,
  selectedColumnKeys?: UserExportColumnKey[],
) {
  const columns = resolveExportColumns(selectedColumnKeys);
  const headers = columns.map((c) => c.header);
  const body = rowsToMatrix(rows, columns);
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Users Export</title>
<style>
body{font-family:Segoe UI,Arial,sans-serif;margin:24px;color:#111}
h1{font-size:18px;margin:0 0 4px}
.meta{font-size:12px;color:#555;margin-bottom:16px}
table{border-collapse:collapse;width:100%;font-size:11px}
th,td{border:1px solid #ccc;padding:6px 8px;text-align:left;vertical-align:top}
th{background:#1e3a5f;color:#fff}
tr:nth-child(even) td{background:#f8fafc}
</style></head><body>
<h1>User Management Export</h1>
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

export async function exportUsersExcel(
  rows: AdminUser[],
  filterSummary?: string,
  selectedColumnKeys?: UserExportColumnKey[],
) {
  const columns = resolveExportColumns(selectedColumnKeys);
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "ITAM Admin";
  workbook.created = new Date();
  const ws = workbook.addWorksheet("Users");

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
  a.download = `users-export-${new Date().toISOString().slice(0, 10)}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
