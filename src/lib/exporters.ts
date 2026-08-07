import { toast } from "sonner";
import { logActivity } from "./storage";
import { calcAge, calcRetirementDate, fmtDate, toISO } from "./retirement";
import type { Employee } from "./types";

export interface ExportColumn<T> {
  header: string;
  value: (row: T) => string | number;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);
}

export function slugify(value: string) {
  return value.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();
}

export async function exportExcel<T>(
  filename: string,
  columns: ExportColumn<T>[],
  rows: T[],
) {
  try {
    const XLSX = await import("xlsx");
    const data = [
      columns.map((c) => c.header),
      ...rows.map((r) => columns.map((c) => c.value(r))),
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    ws["!cols"] = columns.map(() => ({ wch: 18 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    const out = XLSX.write(wb, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
    downloadBlob(
      new Blob([out], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      `${slugify(filename)}.xlsx`,
    );
    logActivity("Excel export", filename);
    toast.success(`Excel exported — ${slugify(filename)}.xlsx`);
  } catch (err) {
    console.error(err);
    toast.error("Excel export failed. Please try again.");
  }
}

async function newDoc(orientation: "landscape" | "portrait") {
  const [{ jsPDF }, autoTableMod] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  const autoTable = autoTableMod.default ?? autoTableMod.autoTable;
  const doc = new jsPDF({ orientation, unit: "mm", format: "a4" });
  return { doc, autoTable };
}

function header(doc: import("jspdf").jsPDF, title: string) {
  doc.setFillColor(15, 37, 71);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 20, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.text("SBC Coaching Depot — Staff & Duty Management", 14, 9);
  doc.setFontSize(9);
  doc.setTextColor(233, 161, 59);
  doc.text(title, 14, 15.5);
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(8);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 26);
}

export async function exportPdf<T>(
  title: string,
  columns: ExportColumn<T>[],
  rows: T[],
) {
  try {
    const { doc, autoTable } = await newDoc("landscape");
    header(doc, title);
    autoTable(doc, {
      head: [columns.map((c) => c.header)],
      body: rows.map((r) => columns.map((c) => String(c.value(r)))),
      startY: 30,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [29, 78, 137], textColor: 255 },
      alternateRowStyles: { fillColor: [244, 247, 252] },
    });
    downloadBlob(doc.output("blob"), `${slugify(title)}.pdf`);
    logActivity("PDF export", title);
    toast.success(`PDF exported — ${slugify(title)}.pdf`);
  } catch (err) {
    console.error(err);
    toast.error("PDF export failed. Please try again.");
  }
}

/** Full single-employee dossier, including the FR-56 retirement date. */
export async function exportEmployeePdf(employee: Employee) {
  try {
    const { doc, autoTable } = await newDoc("portrait");
    header(doc, `Employee Record — ${employee.name}`);

    const calculated = calcRetirementDate(employee.dob);
    const retirement = employee.actualRetirementDate
      ? `${fmtDate(employee.actualRetirementDate)} (early retirement)`
      : calculated
        ? fmtDate(toISO(calculated))
        : "—";

    const rows: [string, string][] = [
      ["Full Name", employee.name],
      ["Token Number", employee.tokenNo],
      ["HRMS-ID", employee.hrmsId],
      ["Designation", employee.designation],
      ["Batch", employee.batch],
      ["Status", employee.status],
      ["Gender", employee.gender],
      ["Blood Group", employee.bloodGroup || "—"],
      ["Date of Birth", `${fmtDate(employee.dob)} (age ${calcAge(employee.dob)})`],
      ["Date of Appointment", fmtDate(employee.doa)],
      ["Retirement Date (FR-56)", retirement],
      ["Phone", employee.phone || "—"],
      ["Email", employee.email || "—"],
      ["Emergency Contact", employee.emergencyContact || "—"],
      ["Address", employee.address || "—"],
      ["Aadhaar", employee.aadhaar || "—"],
      ["PAN", employee.pan || "—"],
      ["PF Number", employee.pfNumber || "—"],
      ["Qualification", employee.qualification || "—"],
      [
        "Documents on File",
        employee.documents.length
          ? employee.documents.map((d) => d.name || d.fileName).join(", ")
          : "None",
      ],
    ];

    autoTable(doc, {
      head: [["Field", "Details"]],
      body: rows,
      startY: 30,
      styles: { fontSize: 9, cellPadding: 2.5 },
      headStyles: { fillColor: [29, 78, 137], textColor: 255 },
      alternateRowStyles: { fillColor: [244, 247, 252] },
      columnStyles: { 0: { cellWidth: 55, fontStyle: "bold" } },
    });

    downloadBlob(doc.output("blob"), `${slugify(employee.name)}-record.pdf`);
    logActivity("Employee record PDF exported", employee.name);
    toast.success("Employee record exported");
  } catch (err) {
    console.error(err);
    toast.error("PDF export failed. Please try again.");
  }
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
