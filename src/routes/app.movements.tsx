import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowRightLeft, BadgeCheck, LogOut, Info, FilterX } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { AppShell } from "@/components/depot/AppShell";
import { ExportButtons } from "@/components/depot/ExportButtons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppData } from "@/hooks/useAppData";
import { logActivity, store, uid } from "@/lib/storage";
import { calcRetirementDate, fmtDate, toISO } from "@/lib/retirement";
import type { Employee, EventType, ServiceEvent } from "@/lib/types";

export const Route = createFileRoute("/app/movements")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Transfer, Promotion & Early Retirement — SBC Coaching Depot" },
      {
        name: "description",
        content:
          "Record promotions, transfers and early retirements with a permanent, non-destructive service history per employee.",
      },
      { property: "og:title", content: "Transfer, Promotion & Early Retirement" },
      {
        property: "og:description",
        content: "Non-destructive service history for every depot employee.",
      },
    ],
  }),
  component: MovementsPage,
});

type ModalKind = EventType | null;

function EmployeePicker({
  employees,
  value,
  onChange,
}: {
  employees: Employee[];
  value: string;
  onChange: (id: string) => void;
}) {
  const [q, setQ] = useState("");
  const list = employees.filter((e) =>
    `${e.name} ${e.tokenNo}`.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <div className="space-y-2">
      <Label>Employee</Label>
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search by name or token…"
      />
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select employee" />
        </SelectTrigger>
        <SelectContent>
          {list.map((e) => (
            <SelectItem key={e.id} value={e.id}>
              {e.name} — {e.tokenNo}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function MovementsPage() {
  const data = useAppData();
  const [modal, setModal] = useState<ModalKind>(null);
  const [empId, setEmpId] = useState("");
  const [newValue, setNewValue] = useState("");
  const [outOfDepot, setOutOfDepot] = useState(false);
  const [date, setDate] = useState(toISO(new Date()));
  const [remarks, setRemarks] = useState("");
  const [error, setError] = useState("");

  const [typeFilter, setTypeFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("");
  const [batchFilter, setBatchFilter] = useState("all");
  const [desigFilter, setDesigFilter] = useState("all");

  const employee = data.employees.find((e) => e.id === empId) ?? null;
  const recordedBy = store.session()?.name ?? "HR Manager";

  const openModal = (kind: ModalKind) => {
    setModal(kind);
    setEmpId("");
    setNewValue("");
    setOutOfDepot(false);
    setDate(toISO(new Date()));
    setRemarks("");
    setError("");
  };

  const save = () => {
    if (!employee) {
      setError("Please select an employee.");
      return;
    }
    if (!date) {
      setError("Effective date is required.");
      return;
    }
    if (modal === "Promotion" && !newValue) {
      setError("Select the new designation.");
      return;
    }
    if (modal === "Transfer" && !outOfDepot && !newValue) {
      setError("Select the new batch or mark as transferred out of depot.");
      return;
    }
    if (modal === "Early Retirement" && !remarks.trim()) {
      setError("Reason is required.");
      return;
    }

    const to =
      modal === "Promotion"
        ? newValue
        : modal === "Transfer"
          ? outOfDepot
            ? "Transferred Out of Depot"
            : newValue
          : "Retired (Early)";
    const from =
      modal === "Promotion"
        ? employee.designation
        : modal === "Transfer"
          ? employee.batch
          : employee.designation;

    const event: ServiceEvent = {
      id: uid("evt"),
      employeeId: employee.id,
      employeeName: employee.name,
      type: modal as EventType,
      from,
      to,
      date,
      remarks: remarks.trim(),
      recordedBy,
    };
    store.setEvents([event, ...store.events()]);

    store.setEmployees(
      store.employees().map((e) => {
        if (e.id !== employee.id) return e;
        if (modal === "Promotion") return { ...e, designation: newValue };
        if (modal === "Transfer")
          return outOfDepot
            ? { ...e, status: "Transferred" }
            : { ...e, batch: newValue };
        return {
          ...e,
          status: "Retired (Early)",
          actualRetirementDate: date,
          earlyRetirementReason: remarks.trim(),
        };
      }),
    );

    logActivity(`${modal} recorded`, `${employee.name} — ${from} → ${to}`);
    toast.success(`${modal} recorded for ${employee.name}`);
    setModal(null);
  };

  const history = useMemo(
    () =>
      data.events
        .filter((e) => typeFilter === "all" || e.type === typeFilter)
        .filter((e) => !monthFilter || e.date.startsWith(monthFilter))
        .filter((e) => {
          if (batchFilter === "all" && desigFilter === "all") return true;
          const emp = data.employees.find((x) => x.id === e.employeeId);
          if (!emp) return false;
          if (batchFilter !== "all" && emp.batch !== batchFilter) return false;
          if (desigFilter !== "all" && emp.designation !== desigFilter) return false;
          return true;
        })
        .sort((a, b) => b.date.localeCompare(a.date)),
    [data.events, data.employees, typeFilter, monthFilter, batchFilter, desigFilter],
  );

  const chartData = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11 + i, 1));
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
      const inMonth = data.events.filter((e) => e.date.startsWith(key));
      return {
        month: d.toLocaleString("en-GB", { month: "short", timeZone: "UTC" }),
        Promotions: inMonth.filter((e) => e.type === "Promotion").length,
        Transfers: inMonth.filter((e) => e.type === "Transfer").length,
        "Early Retirements": inMonth.filter((e) => e.type === "Early Retirement").length,
      };
    });
  }, [data.events]);

  const columns = [
    { header: "Employee", value: (e: ServiceEvent) => e.employeeName },
    { header: "Type", value: (e: ServiceEvent) => e.type },
    { header: "From", value: (e: ServiceEvent) => e.from },
    { header: "To", value: (e: ServiceEvent) => e.to },
    { header: "Effective Date", value: (e: ServiceEvent) => fmtDate(e.date) },
    { header: "Remarks", value: (e: ServiceEvent) => e.remarks },
    { header: "Recorded By", value: (e: ServiceEvent) => e.recordedBy },
  ];

  return (
    <AppShell
      title="Transfer, Promotion & Early Retirement"
      subtitle="Service events are additive — nothing is ever deleted"
      actions={
        <>
          <Button size="sm" onClick={() => openModal("Promotion")}>
            <BadgeCheck className="size-4" /> New Promotion
          </Button>
          <Button size="sm" variant="secondary" onClick={() => openModal("Transfer")}>
            <ArrowRightLeft className="size-4" /> New Transfer
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => openModal("Early Retirement")}
          >
            <LogOut className="size-4" /> Record Early Retirement
          </Button>
          <div className="ml-auto">
            <ExportButtons title="Service History" columns={columns} rows={history} />
          </div>
        </>
      }
    >
      <div className="card-surface mb-4 flex items-start gap-3 p-4 text-sm">
        <Info className="mt-0.5 size-4 shrink-0 text-info" />
        <p className="text-muted-foreground">
          Promotions and transfers are never destructive. Every event is retained (7+
          years) and remains visible on the employee's timeline. Staff transferred out of
          the depot stay in the Employees list with a closed record.
        </p>
      </div>

      <div className="card-surface mb-4 p-4">
        <h3 className="mb-3 text-sm font-semibold">
          Promotions vs Transfers vs Early Retirements — last 12 months
        </h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Promotions" fill="#1D4E89" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Transfers" fill="#E9A13B" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Early Retirements" fill="#C0563B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card-surface p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold">Event History</h3>
          <div className="ml-auto flex flex-wrap gap-2">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-9 w-[160px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {["Promotion", "Transfer", "Early Retirement"].map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="month"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="h-9 w-[150px]"
            />
            <Select value={batchFilter} onValueChange={setBatchFilter}>
              <SelectTrigger className="h-9 w-[150px]">
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
            <Select value={desigFilter} onValueChange={setDesigFilter}>
              <SelectTrigger className="h-9 w-[150px]">
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
            <Button
              variant="outline"
              size="sm"
              className="h-9"
              onClick={() => {
                setTypeFilter("all");
                setMonthFilter("");
                setBatchFilter("all");
                setDesigFilter("all");
              }}
            >
              <FilterX className="size-4" /> Clear
            </Button>
          </div>

        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="py-2 pr-3 font-medium">Employee</th>
                <th className="py-2 pr-3 font-medium">Type</th>
                <th className="py-2 pr-3 font-medium">From → To</th>
                <th className="py-2 pr-3 font-medium">Date</th>
                <th className="py-2 pr-3 font-medium">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {history.map((e) => (
                <tr key={e.id} className="border-b border-border/60 last:border-0">
                  <td className="py-2.5 pr-3 font-medium">{e.employeeName}</td>
                  <td className="py-2.5 pr-3">{e.type}</td>
                  <td className="py-2.5 pr-3">
                    {e.from} → {e.to}
                  </td>
                  <td className="py-2.5 pr-3">{fmtDate(e.date)}</td>
                  <td className="py-2.5 pr-3 text-muted-foreground">{e.remarks || "—"}</td>
                </tr>
              ))}
              {history.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-muted-foreground">
                    No events match these filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!modal} onOpenChange={(o) => !o && setModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {modal === "Promotion"
                ? "New Promotion"
                : modal === "Transfer"
                  ? "New Transfer"
                  : "Record Early Retirement"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <EmployeePicker
              employees={data.employees}
              value={empId}
              onChange={setEmpId}
            />

            {employee && modal === "Promotion" ? (
              <>
                <div className="space-y-2">
                  <Label>Current Designation</Label>
                  <Input value={employee.designation} readOnly />
                </div>
                <div className="space-y-2">
                  <Label>New Designation</Label>
                  <Select value={newValue} onValueChange={setNewValue}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select designation" />
                    </SelectTrigger>
                    <SelectContent>
                      {data.designations
                        .filter((d) => d !== employee.designation)
                        .map((d) => (
                          <SelectItem key={d} value={d}>
                            {d}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            ) : null}

            {employee && modal === "Transfer" ? (
              <>
                <div className="space-y-2">
                  <Label>From Batch / Depot</Label>
                  <Input value={employee.batch} readOnly />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <Label htmlFor="out">Transferred Out of Depot</Label>
                  <Switch id="out" checked={outOfDepot} onCheckedChange={setOutOfDepot} />
                </div>
                {!outOfDepot ? (
                  <div className="space-y-2">
                    <Label>New Batch</Label>
                    <Select value={newValue} onValueChange={setNewValue}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select batch" />
                      </SelectTrigger>
                      <SelectContent>
                        {data.batches
                          .filter((b) => b !== employee.batch)
                          .map((b) => (
                            <SelectItem key={b} value={b}>
                              {b}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : null}
              </>
            ) : null}

            {employee && modal === "Early Retirement" ? (
              <p className="rounded-lg bg-amber-soft p-3 text-xs text-navy">
                FR-56 calculated retirement date:{" "}
                <strong>
                  {(() => {
                    const rd = calcRetirementDate(employee.dob);
                    return rd ? fmtDate(toISO(rd)) : "—";
                  })()}
                </strong>{" "}
                — it will be retained for reference.
              </p>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="eff">Effective Date</Label>
              <Input
                id="eff"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rem">
                {modal === "Early Retirement" ? "Reason" : "Remarks"}
              </Label>
              <Textarea
                id="rem"
                rows={3}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>

            {error ? <p className="text-sm text-danger">{error}</p> : null}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModal(null)}>
              Cancel
            </Button>
            <Button onClick={save}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
