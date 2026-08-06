import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/depot/AppShell";
import { ExportButtons } from "@/components/depot/ExportButtons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useAppData } from "@/hooks/useAppData";
import { calcRetirementDate, fmtDate, monthsBetween, toISO } from "@/lib/retirement";
import type { Employee } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/retirement")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Retirement Forecast — SBC Coaching Depot" },
      {
        name: "description",
        content:
          "FR-56 based retirement forecast for depot staff with date-range filters, urgency highlighting and Excel/PDF export.",
      },
      { property: "og:title", content: "Retirement Forecast — SBC Coaching Depot" },
      {
        property: "og:description",
        content: "See which depot employees superannuate in any chosen period.",
      },
    ],
  }),
  component: RetirementPage,
});

interface ForecastRow {
  employee: Employee;
  retirementDate: Date;
  monthsRemaining: number;
}

function addMonths(date: Date, months: number) {
  const d = new Date(date);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d;
}

function RetirementPage() {
  const data = useAppData();
  const today = useMemo(() => new Date(), []);
  const [from, setFrom] = useState(toISO(today));
  const [to, setTo] = useState(toISO(addMonths(today, 12)));
  const [designation, setDesignation] = useState("all");
  const [batch, setBatch] = useState("all");
  const [grouped, setGrouped] = useState(false);

  const preset = (months: number) => {
    setFrom(toISO(today));
    setTo(toISO(addMonths(today, months)));
  };

  const rows = useMemo<ForecastRow[]>(() => {
    const fromD = new Date(from);
    const toD = new Date(to);
    return data.employees
      .filter((e) => e.status === "Active")
      .map((e) => {
        const rd = calcRetirementDate(e.dob);
        return rd
          ? { employee: e, retirementDate: rd, monthsRemaining: monthsBetween(today, rd) }
          : null;
      })
      .filter((r): r is ForecastRow => !!r)
      .filter((r) => r.retirementDate >= fromD && r.retirementDate <= toD)
      .filter((r) => designation === "all" || r.employee.designation === designation)
      .filter((r) => batch === "all" || r.employee.batch === batch)
      .sort((a, b) => a.retirementDate.getTime() - b.retirementDate.getTime());
  }, [data.employees, from, to, designation, batch, today]);

  const columns = [
    { header: "Employee Name", value: (r: ForecastRow) => r.employee.name },
    { header: "Token No.", value: (r: ForecastRow) => r.employee.tokenNo },
    { header: "Designation", value: (r: ForecastRow) => r.employee.designation },
    { header: "Batch", value: (r: ForecastRow) => r.employee.batch },
    { header: "DOB", value: (r: ForecastRow) => fmtDate(r.employee.dob) },
    { header: "Date of Joining", value: (r: ForecastRow) => fmtDate(r.employee.doa) },
    {
      header: "Retirement Date",
      value: (r: ForecastRow) => fmtDate(toISO(r.retirementDate)),
    },
    { header: "Months Remaining", value: (r: ForecastRow) => r.monthsRemaining },
  ];

  const groups = useMemo(() => {
    const map = new Map<string, ForecastRow[]>();
    rows.forEach((r) => {
      const list = map.get(r.employee.designation) ?? [];
      list.push(r);
      map.set(r.employee.designation, list);
    });
    return [...map.entries()];
  }, [rows]);

  const Row = ({ r }: { r: ForecastRow }) => (
    <tr
      className={cn(
        "border-b border-border/60 last:border-0",
        r.monthsRemaining <= 3 && "bg-danger-soft/70",
      )}
    >
      <td className="py-2.5 pr-3 font-medium">{r.employee.name}</td>
      <td className="py-2.5 pr-3">{r.employee.tokenNo}</td>
      <td className="py-2.5 pr-3">{r.employee.designation}</td>
      <td className="py-2.5 pr-3">{r.employee.batch}</td>
      <td className="py-2.5 pr-3">{fmtDate(r.employee.dob)}</td>
      <td className="py-2.5 pr-3">{fmtDate(r.employee.doa)}</td>
      <td className="py-2.5 pr-3 font-semibold text-amber-accent">
        {fmtDate(toISO(r.retirementDate))}
      </td>
      <td className="py-2.5 pr-3">
        {r.monthsRemaining}
        {r.monthsRemaining <= 3 ? (
          <span className="ml-2 rounded-full bg-danger px-2 py-0.5 text-[10px] font-semibold uppercase text-primary-foreground">
            Urgent
          </span>
        ) : null}
      </td>
    </tr>
  );

  const Head = () => (
    <thead>
      <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
        <th className="py-2 pr-3 font-medium">Name</th>
        <th className="py-2 pr-3 font-medium">Token</th>
        <th className="py-2 pr-3 font-medium">Designation</th>
        <th className="py-2 pr-3 font-medium">Batch</th>
        <th className="py-2 pr-3 font-medium">DOB</th>
        <th className="py-2 pr-3 font-medium">Joining</th>
        <th className="py-2 pr-3 font-medium">Retirement</th>
        <th className="py-2 pr-3 font-medium">Months Left</th>
      </tr>
    </thead>
  );

  return (
    <AppShell
      title="Retirement Forecast"
      subtitle="Computed under FR-56 (last day of the month of turning 60)"
      actions={
        <>
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label htmlFor="from" className="text-xs">
                From
              </Label>
              <Input
                id="from"
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="h-9 w-[150px]"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="to" className="text-xs">
                To
              </Label>
              <Input
                id="to"
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="h-9 w-[150px]"
              />
            </div>
            <div className="flex gap-1">
              {[
                ["3M", 3],
                ["6M", 6],
                ["1Y", 12],
                ["5Y", 60],
              ].map(([label, months]) => (
                <Button
                  key={label as string}
                  variant="secondary"
                  size="sm"
                  onClick={() => preset(months as number)}
                >
                  {label as string}
                </Button>
              ))}
            </div>
            <Select value={designation} onValueChange={setDesignation}>
              <SelectTrigger className="h-9 w-[170px]">
                <SelectValue placeholder="Designation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All designations</SelectItem>
                {data.designations.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={batch} onValueChange={setBatch}>
              <SelectTrigger className="h-9 w-[170px]">
                <SelectValue placeholder="Batch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All batches</SelectItem>
                {data.batches.map((b) => (
                  <SelectItem key={b} value={b}>
                    {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setGrouped((g) => !g)}
            >
              {grouped ? "Flat list" : "Group by designation"}
            </Button>
          </div>
          <div className="ml-auto">
            <ExportButtons title="Retirement Forecast" columns={columns} rows={rows} />
          </div>
        </>
      }
    >
      <p className="mb-3 text-sm text-muted-foreground">
        {rows.length} employee(s) retiring between {fmtDate(from)} and {fmtDate(to)} ·
        rows highlighted in red retire within 3 months.
      </p>

      {grouped ? (
        <Accordion type="multiple" className="space-y-3">
          {groups.map(([name, list]) => (
            <AccordionItem
              key={name}
              value={name}
              className="card-surface border-0 px-4"
            >
              <AccordionTrigger className="text-sm font-semibold">
                {name} — {list.length} retiring
              </AccordionTrigger>
              <AccordionContent>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px] text-sm">
                    <Head />
                    <tbody>
                      {list.map((r) => (
                        <Row key={r.employee.id} r={r} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
          {groups.length === 0 ? (
            <p className="card-surface p-6 text-center text-sm text-muted-foreground">
              No retirements in this period.
            </p>
          ) : null}
        </Accordion>
      ) : (
        <div className="card-surface overflow-x-auto p-4">
          <table className="w-full min-w-[900px] text-sm">
            <Head />
            <tbody>
              {rows.map((r) => (
                <Row key={r.employee.id} r={r} />
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-muted-foreground">
                    No retirements in this period.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}
