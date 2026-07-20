import { labelEnum } from "./labels";
import type { Supplier } from "./types";

export type SupplierExportColumnKey =
  | "supplierCode"
  | "name"
  | "status"
  | "contactPerson"
  | "email"
  | "phone"
  | "address"
  | "website"
  | "categories"
  | "notes";

type Column = {
  key: SupplierExportColumnKey;
  header: string;
  width: number;
  value: (row: Supplier) => string;
};

export type SupplierExportColumnSection = {
  title: string;
  columns: Array<{ key: SupplierExportColumnKey; header: string }>;
};

type ColumnSection = {
  title: string;
  columns: Column[];
};

const COLUMN_SECTIONS: ColumnSection[] = [
  {
    title: "SUPPLIER",
    columns: [
      { key: "supplierCode", header: "Supplier Code", width: 14, value: (r) => r.supplier_code },
      { key: "name", header: "Supplier Name", width: 28, value: (r) => r.name },
      { key: "status", header: "Status", width: 12, value: (r) => labelEnum(r.status ?? "") },
      {
        key: "categories",
        header: "Categories",
        width: 32,
        value: (r) => (r.categories ?? []).map((c) => labelEnum(c)).join(", "),
      },
    ],
  },
  {
    title: "CONTACT",
    columns: [
      { key: "contactPerson", header: "Contact Person", width: 20, value: (r) => r.contact_person ?? "" },
      { key: "email", header: "Email", width: 24, value: (r) => r.email ?? "" },
      { key: "phone", header: "Phone", width: 16, value: (r) => r.phone ?? "" },
      { key: "address", header: "Address", width: 32, value: (r) => r.address ?? "" },
      { key: "website", header: "Website", width: 24, value: (r) => r.website ?? "" },
    ],
  },
  {
    title: "NOTES",
    columns: [{ key: "notes", header: "Notes", width: 28, value: (r) => r.notes ?? "" }],
  },
];

export const SUPPLIER_EXPORT_COLUMN_SECTIONS: SupplierExportColumnSection[] = COLUMN_SECTIONS.map((section) => ({
  title: section.title,
  columns: section.columns.map(({ key, header }) => ({ key, header })),
}));

export const ALL_SUPPLIER_EXPORT_COLUMN_KEYS: SupplierExportColumnKey[] = COLUMN_SECTIONS.flatMap((section) =>
  section.columns.map((column) => column.key),
);

function resolveExportColumns(selectedColumnKeys?: SupplierExportColumnKey[]): Column[] {
  const selected = new Set(selectedColumnKeys ?? ALL_SUPPLIER_EXPORT_COLUMN_KEYS);
  return COLUMN_SECTIONS.flatMap((section) => section.columns.filter((column) => selected.has(column.key)));
}

function rowsToMatrix(rows: Supplier[], columns: Column[]) {
  return rows.map((row) => columns.map((col) => col.value(row)));
}

export function exportSuppliersPdf(
  rows: Supplier[],
  filterSummary?: string,
  selectedColumnKeys?: SupplierExportColumnKey[],
) {
  const columns = resolveExportColumns(selectedColumnKeys);
  const headers = columns.map((c) => c.header);
  const body = rowsToMatrix(rows, columns);
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Suppliers Export</title>
<style>
body{font-family:Segoe UI,Arial,sans-serif;margin:24px;color:#111}
h1{font-size:18px;margin:0 0 4px}
.meta{font-size:12px;color:#555;margin-bottom:16px}
table{border-collapse:collapse;width:100%;font-size:11px}
th,td{border:1px solid #ccc;padding:6px 8px;text-align:left;vertical-align:top}
th{background:#1e3a5f;color:#fff}
tr:nth-child(even) td{background:#f8fafc}
</style></head><body>
<h1>Procurement Suppliers Export</h1>
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

export async function exportSuppliersExcel(
  rows: Supplier[],
  filterSummary?: string,
  selectedColumnKeys?: SupplierExportColumnKey[],
) {
  const columns = resolveExportColumns(selectedColumnKeys);
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "ITAM Admin";
  workbook.created = new Date();
  const ws = workbook.addWorksheet("Suppliers");

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
  a.download = `suppliers-export-${new Date().toISOString().slice(0, 10)}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
