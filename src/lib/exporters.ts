import { toast } from "sonner";
import { logActivity } from "./storage";

export interface ExportColumn<T> {
  header: string;
  value: (row: T) => string | number;
}

export async function exportExcel<T>(
  filename: string,
  columns: ExportColumn<T>[],
  rows: T[],
) {
  const XLSX = await import("xlsx");
  const data = [
    columns.map((c) => c.header),
    ...rows.map((r) => columns.map((c) => c.value(r))),
  ];
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws["!cols"] = columns.map(() => ({ wch: 18 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Data");
  XLSX.writeFile(wb, `${filename}.xlsx`);
  logActivity("Excel export", filename);
  toast.success(`Excel exported — ${filename}.xlsx`);
}

export async function exportPdf<T>(
  title: string,
  columns: ExportColumn<T>[],
  rows: T[],
) {
  const [{ default: JsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  const doc = new JsPDF({ orientation: "landscape" });
  doc.setFontSize(14);
  doc.text("SBC Coaching Depot — Staff & Duty Management", 14, 14);
  doc.setFontSize(11);
  doc.text(title, 14, 21);
  doc.setFontSize(9);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 27);
  autoTable(doc, {
    head: [columns.map((c) => c.header)],
    body: rows.map((r) => columns.map((c) => String(c.value(r)))),
    startY: 32,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [15, 37, 71] },
  });
  doc.save(`${title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.pdf`);
  logActivity("PDF export", title);
  toast.success("PDF exported");
}

export async function parseSpreadsheet(file: File): Promise<Record<string, string>[]> {
  const XLSX = await import("xlsx");
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array" });
  const first = wb.SheetNames[0];
  if (!first) return [];
  const sheet = wb.Sheets[first];
  if (!sheet) return [];
  return XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: "" });
}
