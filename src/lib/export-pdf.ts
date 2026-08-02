/** Shared landscape PDF print window used by all ITAM table exports. */

export type LandscapePdfSection = {
  title: string;
  headers: string[];
};

export type OpenLandscapeTablePdfOptions = {
  /** Window / browser tab title */
  documentTitle: string;
  /** Banner heading (e.g. DEVICE HISTORY) */
  title: string;
  filterSummary?: string;
  rowCount: number;
  sections: LandscapePdfSection[];
  /** Cell values already as plain strings (will be HTML-escaped). */
  bodyRows: string[][];
  note?: string;
};

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function openLandscapeTablePdf(opts: OpenLandscapeTablePdfOptions): void {
  const generatedAt = new Date().toLocaleString();
  const totalCols = opts.sections.reduce((n, s) => n + s.headers.length, 0);
  const headers = opts.sections.flatMap((s) => s.headers);

  const sectionCells = opts.sections
    .map(
      (section, i) =>
        `<th colspan="${section.headers.length}" class="section ${i % 2 === 0 ? "sec-a" : "sec-b"}">${escapeHtml(
          section.title,
        )}</th>`,
    )
    .join("");

  const headerCells = headers.map((h) => `<th class="col">${escapeHtml(h)}</th>`).join("");

  const bodyRows = opts.bodyRows
    .map(
      (row) =>
        `<tr>${row.map((cell) => `<td>${escapeHtml(String(cell ?? ""))}</td>`).join("")}</tr>`,
    )
    .join("");

  const note =
    opts.note ??
    "Tip: In the print dialog, set Layout to Landscape and turn off Headers and footers for a clean PDF.";

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>${escapeHtml(opts.documentTitle)}</title>
<style>
  * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
  html, body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  body { font-family: "Segoe UI", Arial, sans-serif; color: #1e293b; margin: 0; }
  .banner { background: #2E7D9A; color: #fff; padding: 10px 14px; }
  .banner h1 { font-size: 16px; margin: 0; letter-spacing: 0.5px; }
  .meta { font-size: 9px; color: #64748b; padding: 6px 14px 10px; }
  .meta span { margin-right: 14px; }
  .table-wrap { padding: 0 14px 14px; }
  table { width: 100%; border-collapse: collapse; font-size: 7.5px; table-layout: fixed; }
  th, td { border: 1px solid #cbd5e1; padding: 3px 4px; text-align: left; vertical-align: top; word-break: break-word; overflow-wrap: anywhere; }
  th.section { color: #fff; font-weight: 700; text-align: center; font-size: 8px; letter-spacing: 0.4px; }
  th.sec-a { background: #2E7D9A; }
  th.sec-b { background: #215C73; }
  th.col { background: #1F4E78; color: #fff; font-weight: 600; }
  thead { display: table-header-group; }
  tbody tr:nth-child(even) td { background: #EFF5F8; }
  .note { font-size: 8px; color: #64748b; font-style: italic; padding: 8px 14px 14px; }
  @media print {
    @page { size: A4 landscape; margin: 8mm; }
    body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    th.section, th.sec-a, th.sec-b, th.col, .banner { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    tbody tr:nth-child(even) td { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  }
</style>
</head>
<body>
  <div class="banner"><h1>${escapeHtml(opts.title)}</h1></div>
  <div class="meta">
    <span><strong>Total records:</strong> ${opts.rowCount}</span>
    <span><strong>Generated:</strong> ${escapeHtml(generatedAt)}</span>
    ${
      opts.filterSummary
        ? `<span><strong>Filters:</strong> ${escapeHtml(opts.filterSummary)}</span>`
        : "<span><strong>Filters:</strong> None (all records)</span>"
    }
  </div>
  <div class="table-wrap">
    <table>
      <thead>
        <tr>${sectionCells}</tr>
        <tr>${headerCells}</tr>
      </thead>
      <tbody>${bodyRows || `<tr><td colspan="${totalCols || 1}">No records</td></tr>`}</tbody>
    </table>
  </div>
  <div class="note">${escapeHtml(note)}</div>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (!win) {
    throw new Error("Unable to open print window. Please allow pop-ups for this site.");
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => {
    win.print();
  }, 300);
}
