import { FileDown, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportExcel, exportPdf, type ExportColumn } from "@/lib/exporters";

export function ExportButtons<T>({
  title,
  columns,
  rows,
  pdf = true,
}: {
  title: string;
  columns: ExportColumn<T>[];
  rows: T[];
  pdf?: boolean;
}) {
  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        className="border-success/40 text-success hover:bg-success-soft hover:text-success"
        onClick={() => exportExcel(title, columns, rows)}
      >
        <FileSpreadsheet className="size-4" />
        Download Excel
      </Button>
      {pdf ? (
        <Button
          variant="outline"
          size="sm"
          className="border-info/40 text-info hover:bg-info-soft hover:text-info"
          onClick={() => exportPdf(title, columns, rows)}
        >
          <FileDown className="size-4" />
          Download PDF
        </Button>
      ) : null}
    </div>
  );
}
