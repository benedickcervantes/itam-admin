export type RecommendationSpecExportRow = {
  component: string;
  minimum: string;
  recommended: string;
};

export type RecommendationSpecExportMeta = {
  title: string;
  audience: string;
  deviceType: string;
  forRoles?: string | null;
  updatedAt?: string | null;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatStamp(iso?: string | null) {
  if (!iso) return new Date().toLocaleString();
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
}

function buildPrintHtml(
  meta: RecommendationSpecExportMeta,
  rows: RecommendationSpecExportRow[],
) {
  const generatedAt = new Date().toLocaleString();
  const bodyRows = rows
    .map(
      (row) => `<tr>
      <td>${escapeHtml(row.component)}</td>
      <td>${escapeHtml(row.minimum || "—")}</td>
      <td>${escapeHtml(row.recommended || "—")}</td>
    </tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>${escapeHtml(meta.title)}</title>
  <style>
    * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body { font-family: "Segoe UI", Arial, sans-serif; color: #1e293b; margin: 0; background: #fff; }
    .banner { background: #2E7D9A; color: #fff; padding: 14px 18px; }
    .banner h1 { font-size: 18px; margin: 0 0 4px; }
    .banner p { margin: 0; font-size: 12px; opacity: 0.92; }
    .meta { font-size: 12px; color: #475569; padding: 12px 18px 8px; display: flex; flex-wrap: wrap; gap: 8px 18px; }
    .meta strong { color: #1e293b; }
    .table-wrap { padding: 4px 18px 18px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; table-layout: fixed; }
    th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; vertical-align: top; word-break: break-word; }
    th { background: #1e3a5f; color: #fff; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.03em; }
    th.min { background: #475569; }
    th.rec { background: #2E7D9A; }
    tbody tr:nth-child(even) td { background: #f8fafc; }
    .foot { font-size: 11px; color: #64748b; padding: 0 18px 18px; }
    @media print {
      @page { size: A4 landscape; margin: 10mm; }
      body { margin: 0; }
    }
  </style>
</head>
<body>
  <div class="banner">
    <h1>${escapeHtml(meta.title)}</h1>
    <p>ITAM Recommendation Specs · Procurement guide</p>
  </div>
  <div class="meta">
    <span><strong>Audience:</strong> ${escapeHtml(meta.audience)}</span>
    <span><strong>Device:</strong> ${escapeHtml(meta.deviceType)}</span>
    ${meta.forRoles ? `<span><strong>For:</strong> ${escapeHtml(meta.forRoles)}</span>` : ""}
    <span><strong>Generated:</strong> ${escapeHtml(generatedAt)}</span>
    ${meta.updatedAt ? `<span><strong>Last updated:</strong> ${escapeHtml(formatStamp(meta.updatedAt))}</span>` : ""}
  </div>
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th style="width:18%">Component</th>
          <th class="min" style="width:41%">Minimum</th>
          <th class="rec" style="width:41%">Recommended</th>
        </tr>
      </thead>
      <tbody>
        ${bodyRows || `<tr><td colspan="3">No components defined</td></tr>`}
      </tbody>
    </table>
  </div>
  <div class="foot">Use Minimum for budget-conscious purchases. Prefer Recommended when workload and longevity matter.</div>
</body>
</html>`;
}

function openPrintWindow(html: string, autoPrint: boolean) {
  const win = window.open("", "_blank");
  if (!win) {
    throw new Error("Unable to open print window. Please allow pop-ups for this site.");
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.focus();
  if (autoPrint) {
    win.onload = () => {
      win.print();
    };
    // Fallback if onload already fired
    setTimeout(() => {
      try {
        win.print();
      } catch {
        /* ignore */
      }
    }, 250);
  }
  return win;
}

export function printRecommendationSpecs(
  meta: RecommendationSpecExportMeta,
  rows: RecommendationSpecExportRow[],
) {
  openPrintWindow(buildPrintHtml(meta, rows), true);
}

export function exportRecommendationSpecsPdf(
  meta: RecommendationSpecExportMeta,
  rows: RecommendationSpecExportRow[],
) {
  // Browser print dialog — user can Save as PDF
  openPrintWindow(buildPrintHtml(meta, rows), true);
}

export async function exportRecommendationSpecsExcel(
  meta: RecommendationSpecExportMeta,
  rows: RecommendationSpecExportRow[],
) {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "ITAM Admin";
  workbook.created = new Date();

  const ws = workbook.addWorksheet("Specs");
  ws.getColumn(1).width = 18;
  ws.getColumn(2).width = 48;
  ws.getColumn(3).width = 48;

  ws.addRow([meta.title]);
  ws.mergeCells(1, 1, 1, 3);
  ws.getRow(1).font = { bold: true, size: 14, color: { argb: "FF1E3A5F" } };

  ws.addRow([`Audience: ${meta.audience}`, `Device: ${meta.deviceType}`, ""]);
  if (meta.forRoles) {
    ws.addRow([`For: ${meta.forRoles}`]);
    ws.mergeCells(ws.lastRow!.number, 1, ws.lastRow!.number, 3);
  }
  ws.addRow([`Exported: ${new Date().toLocaleString()}`]);
  ws.mergeCells(ws.lastRow!.number, 1, ws.lastRow!.number, 3);
  ws.addRow([]);

  const headerRow = ws.addRow(["Component", "Minimum", "Recommended"]);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A5F" } };
  headerRow.getCell(2).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF475569" } };
  headerRow.getCell(3).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2E7D9A" } };

  rows.forEach((row) => {
    const r = ws.addRow([row.component, row.minimum || "—", row.recommended || "—"]);
    r.alignment = { wrapText: true, vertical: "top" };
  });

  const info = workbook.addWorksheet("Info");
  info.addRow(["Title", meta.title]);
  info.addRow(["Audience", meta.audience]);
  info.addRow(["Device type", meta.deviceType]);
  if (meta.forRoles) info.addRow(["For roles", meta.forRoles]);
  if (meta.updatedAt) info.addRow(["Last updated", formatStamp(meta.updatedAt)]);
  info.addRow(["Components", rows.length]);
  info.getColumn(1).width = 16;
  info.getColumn(2).width = 48;

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const slug = `${meta.audience}-${meta.deviceType}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");
  a.download = `recommendation-specs-${slug}-${new Date().toISOString().slice(0, 10)}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
