import { FileDown, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportExcel, exportPdf, type ExportColumn } from "@/lib/exporters";

export function ExportButtons<T>({
  title,
  columns,
  rows,
}: {
  title: string;
  columns: ExportColumn<T>[];
  rows: T[];
}) {
  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => exportExcel(title, columns, rows)}
      >
        <FileSpreadsheet className="size-4" />
        Download Excel
      </Button>
      <Button variant="outline" size="sm" onClick={() => exportPdf(title, columns, rows)}>
        <FileDown className="size-4" />
        Download PDF
      </Button>
    </div>
  );
}
