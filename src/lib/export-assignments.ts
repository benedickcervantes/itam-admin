import type { Assignment } from "./types";

const COLUMNS: { header: string; width: number; value: (row: Assignment) => string }[] = [
  { header: "Record ID", width: 14, value: (r) => r.record_code },
  { header: "Asset ID", width: 14, value: (r) => r.asset?.asset_code ?? "" },
  { header: "Computer", width: 22, value: (r) => r.asset?.computer_name ?? "" },
  { header: "Assigned To", width: 22, value: (r) => r.assigned_to },
  { header: "Department", width: 18, value: (r) => r.department?.name ?? "" },
  { header: "Assigned Date", width: 14, value: (r) => r.assigned_date.slice(0, 10) },
  { header: "Returned Date", width: 14, value: (r) => r.returned_date?.slice(0, 10) ?? "" },
  { header: "Assigned By", width: 18, value: (r) => r.assigned_by ?? "" },
  { header: "Notes", width: 28, value: (r) => r.notes ?? "" },
];

function rowsToMatrix(rows: Assignment[]) {
  return rows.map((row) => COLUMNS.map((col) => col.value(row)));
}

export function exportAssignmentsPdf(rows: Assignment[], filterSummary?: string) {
  const headers = COLUMNS.map((c) => c.header);
  const body = rowsToMatrix(rows);
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

export async function exportAssignmentsExcel(rows: Assignment[], filterSummary?: string) {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "ITAM Admin";
  workbook.created = new Date();
  const ws = workbook.addWorksheet("Assignments");

  COLUMNS.forEach((c, i) => {
    ws.getColumn(i + 1).width = c.width;
  });

  ws.addRow(COLUMNS.map((c) => c.header));
  const headerRow = ws.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2E7D9A" } };

  rows.forEach((row) => ws.addRow(COLUMNS.map((c) => c.value(row))));

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
