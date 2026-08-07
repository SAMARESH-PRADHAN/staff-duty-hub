import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  BookmarkPlus,
  Eye,
  FilterX,
  MessageCircle,
  Pencil,
  Plus,
  Search,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/depot/AppShell";
import { ExportButtons } from "@/components/depot/ExportButtons";
import { EmployeeForm } from "@/components/depot/EmployeeForm";
import { EmployeeDetails } from "@/components/depot/EmployeeDetails";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAppData } from "@/hooks/useAppData";
import { logActivity, store, uid } from "@/lib/storage";
import { parseSpreadsheet } from "@/lib/exporters";
import { calcAge, calcRetirementDate, fmtDate, toISO } from "@/lib/retirement";
import type { Employee } from "@/lib/types";

export const Route = createFileRoute("/app/employees")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Employees — SBC Coaching Depot" },
      {
        name: "description",
        content:
          "Search, filter, add, import and export the complete staff register of the SBC Coaching Depot.",
      },
      { property: "og:title", content: "Employees — SBC Coaching Depot" },
      {
        property: "og:description",
        content: "Complete staff register with service, identity and document records.",
      },
    ],
  }),
  component: EmployeesPage,
});

function whatsappHref(phone: string) {
  const digits = phone.replace(/\D/g, "");
  const withCode = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${withCode}`;
}

function EmployeesPage() {
  const data = useAppData();
  const saved = store.employeeFilter();
  const [search, setSearch] = useState(saved?.search ?? "");
  const [designation, setDesignation] = useState(saved?.designation ?? "all");
  const [batch, setBatch] = useState(saved?.batch ?? "all");
  const [gender, setGender] = useState(saved?.gender ?? "all");
  const [status, setStatus] = useState(saved?.status ?? "all");
  const [ageMin, setAgeMin] = useState(saved?.ageMin ?? "");
  const [ageMax, setAgeMax] = useState(saved?.ageMax ?? "");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [detail, setDetail] = useState<Employee | null>(null);
  const [importRows, setImportRows] = useState<Record<string, string>[] | null>(null);

  const saveFilter = () => {
    store.setEmployeeFilter({ search, designation, batch, gender, status, ageMin, ageMax });
    toast.success("Filter saved — it will be applied next time you open this page");
  };

  const clearFilter = () => {
    setSearch("");
    setDesignation("all");
    setBatch("all");
    setGender("all");
    setStatus("all");
    setAgeMin("");
    setAgeMax("");
    store.setEmployeeFilter(null);
    toast.success("Filters cleared");
  };


  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.employees.filter((e) => {
      const age = calcAge(e.dob);
      if (q) {
        const hay = `${e.name} ${e.tokenNo} ${e.hrmsId}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (designation !== "all" && e.designation !== designation) return false;
      if (batch !== "all" && e.batch !== batch) return false;
      if (gender !== "all" && e.gender !== gender) return false;
      if (status !== "all" && e.status !== status) return false;
      if (ageMin && age < Number(ageMin)) return false;
      if (ageMax && age > Number(ageMax)) return false;
      return true;
    });
  }, [data.employees, search, designation, batch, gender, status, ageMin, ageMax]);

  const columns = [
    { header: "Name", value: (e: Employee) => e.name },
    { header: "Token No.", value: (e: Employee) => e.tokenNo },
    { header: "HRMS-ID", value: (e: Employee) => e.hrmsId },
    { header: "Designation", value: (e: Employee) => e.designation },
    { header: "Batch", value: (e: Employee) => e.batch },
    { header: "Gender", value: (e: Employee) => e.gender },
    { header: "Blood Group", value: (e: Employee) => e.bloodGroup ?? "—" },
    { header: "Phone", value: (e: Employee) => e.phone },
    { header: "Email", value: (e: Employee) => e.email ?? "—" },
    { header: "Age", value: (e: Employee) => calcAge(e.dob) },
    { header: "Date of Birth", value: (e: Employee) => fmtDate(e.dob) },
    { header: "Date of Appointment", value: (e: Employee) => fmtDate(e.doa) },
    {
      header: "Retirement Date",
      value: (e: Employee) => {
        const rd = calcRetirementDate(e.dob);
        return rd ? fmtDate(toISO(rd)) : "—";
      },
    },
    { header: "Status", value: (e: Employee) => e.status },
  ];

  const confirmImport = () => {
    if (!importRows) return;
    const pick = (row: Record<string, string>, keys: string[]) => {
      for (const k of Object.keys(row)) {
        if (keys.some((key) => k.toLowerCase().replace(/[^a-z]/g, "").includes(key)))
          return String(row[k] ?? "");
      }
      return "";
    };
    const added: Employee[] = importRows.map((row) => ({
      id: uid("emp"),
      photo: "",
      name: pick(row, ["name"]),
      gender: (pick(row, ["gender"]) || "Male") as Employee["gender"],
      tokenNo: pick(row, ["token"]),
      hrmsId: pick(row, ["hrms"]),
      batch: pick(row, ["batch"]) || data.batches[0] || "",
      designation: pick(row, ["designation"]) || data.designations[0] || "",
      phone: pick(row, ["phone"]),
      email: pick(row, ["email", "mail"]),
      bloodGroup: pick(row, ["blood"]),
      emergencyContact: pick(row, ["emergency"]),
      address: pick(row, ["address"]),
      aadhaar: pick(row, ["aadhaar"]),
      pan: pick(row, ["pan"]).toUpperCase(),
      pfNumber: pick(row, ["pf"]),
      dob: pick(row, ["dateofbirth", "dob"]),
      doa: pick(row, ["dateofappointment", "doa", "joining"]),
      qualification: pick(row, ["qualification"]),
      documents: [],
      status: "Active",
    }));
    store.setEmployees([...added, ...store.employees()]);
    logActivity("Employees imported", `${added.length} record(s)`);
    toast.success(`${added.length} employee(s) imported`);
    setImportRows(null);
  };

  return (
    <AppShell
      title="Employees"
      subtitle={`${filtered.length} of ${data.employees.length} records`}
      actions={
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name / token / HRMS-ID"
              className="h-9 w-56 pl-9"
            />
          </div>
          <Select value={designation} onValueChange={setDesignation}>
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
          <Select value={batch} onValueChange={setBatch}>
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
          <Select value={gender} onValueChange={setGender}>
            <SelectTrigger className="h-9 w-[120px]">
              <SelectValue placeholder="Gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All genders</SelectItem>
              {["Male", "Female", "Other"].map((g) => (
                <SelectItem key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-9 w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {["Active", "Transferred", "Retired (Early)"].map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1">
            <Input
              value={ageMin}
              onChange={(e) => setAgeMin(e.target.value.replace(/\D/g, ""))}
              placeholder="Min age"
              className="h-9 w-[90px]"
            />
            <span className="text-muted-foreground">–</span>
            <Input
              value={ageMax}
              onChange={(e) => setAgeMax(e.target.value.replace(/\D/g, ""))}
              placeholder="Max age"
              className="h-9 w-[90px]"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={saveFilter}
            className="border-amber-accent/50 text-amber-accent hover:bg-amber-soft hover:text-amber-accent"
          >
            <BookmarkPlus className="size-4" /> Save Filter
          </Button>
          <Button variant="outline" size="sm" onClick={clearFilter}>
            <FilterX className="size-4" /> Clear
          </Button>



          <div className="ml-auto flex flex-wrap items-center gap-2">
            <ExportButtons title="Employees" columns={columns} rows={filtered} />
            <Button variant="outline" size="sm" asChild>
              <label className="cursor-pointer">
                <Upload className="size-4" /> Import
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const rows = await parseSpreadsheet(file);
                    if (rows.length === 0) {
                      toast.error("No rows found in that file.");
                      return;
                    }
                    setImportRows(rows);
                    e.target.value = "";
                  }}
                />
              </label>
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus className="size-4" /> Add Employee
            </Button>
          </div>
        </>
      }
    >
      <TooltipProvider delayDuration={150}>
        <div className="card-surface overflow-x-auto p-4">
          <table className="w-full min-w-[960px] text-sm">
            <thead>
              <tr className="border-b border-border bg-navy/5 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="py-2 pr-3 font-medium">Employee</th>
                <th className="py-2 pr-3 font-medium">HRMS-ID</th>
                <th className="py-2 pr-3 font-medium">Designation</th>
                <th className="py-2 pr-3 font-medium">Batch</th>
                <th className="py-2 pr-3 font-medium">Age</th>
                <th className="py-2 pr-3 font-medium">Status</th>
                <th className="py-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr
                  key={e.id}
                  className="border-b border-border/60 transition-colors last:border-0 hover:bg-muted/40"
                >
                  <td className="py-2.5 pr-3">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="size-9 overflow-hidden rounded-full bg-muted">
                          {e.photo ? (
                            <img
                              src={e.photo}
                              alt={e.name}
                              className="size-full object-cover"
                            />
                          ) : null}
                        </div>
                        {data.darByEmployee[e.id] ? (
                          <span
                            className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-danger ring-2 ring-card"
                            aria-label="Record marker"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0 leading-tight">
                        <p className="truncate font-medium">{e.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          Token {e.tokenNo || "—"}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {e.email || "No email on record"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 pr-3">{e.hrmsId}</td>
                  <td className="py-2.5 pr-3">{e.designation}</td>
                  <td className="py-2.5 pr-3">{e.batch}</td>
                  <td className="py-2.5 pr-3">{calcAge(e.dob)}</td>
                  <td className="py-2.5 pr-3">
                    <Badge variant={e.status === "Active" ? "default" : "secondary"}>
                      {e.status}
                    </Badge>
                  </td>
                  <td className="py-2 text-right">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Edit ${e.name}`}
                          onClick={() => {
                            setEditing(e);
                            setFormOpen(true);
                          }}
                        >
                          <Pencil className="size-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Edit</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Details for ${e.name}`}
                          onClick={() => setDetail(e)}
                        >
                          <Eye className="size-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Employee Details</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-success hover:bg-success-soft hover:text-success"
                          disabled={!e.phone}
                          aria-label={`WhatsApp ${e.name}`}
                          onClick={() =>
                            window.open(whatsappHref(e.phone), "_blank", "noopener")
                          }
                        >
                          <MessageCircle className="size-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {e.phone ? `WhatsApp ${e.phone}` : "No phone number"}
                      </TooltipContent>
                    </Tooltip>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-muted-foreground">
                    No employees match these filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </TooltipProvider>


      <EmployeeForm
        open={formOpen}
        onOpenChange={setFormOpen}
        employee={editing}
        designations={data.designations}
        batches={data.batches}
      />

      <EmployeeDetails
        employee={detail}
        open={!!detail}
        onOpenChange={(o) => !o && setDetail(null)}
        events={data.events}
        hasDar={!!(detail && data.darByEmployee[detail.id])}
        hasReward={!!(detail && data.rewardsByEmployee[detail.id])}
      />

      <Dialog open={!!importRows} onOpenChange={(o) => !o && setImportRows(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Import preview — {importRows?.length ?? 0} row(s)</DialogTitle>
          </DialogHeader>
          <div className="max-h-[50vh] overflow-auto rounded-lg border border-border">
            <table className="w-full text-xs">
              <thead className="bg-muted">
                <tr>
                  {Object.keys(importRows?.[0] ?? {}).map((k) => (
                    <th key={k} className="whitespace-nowrap px-2 py-2 text-left">
                      {k}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(importRows ?? []).slice(0, 20).map((row, i) => (
                  <tr key={i} className="border-t border-border">
                    {Object.keys(importRows?.[0] ?? {}).map((k) => (
                      <td key={k} className="whitespace-nowrap px-2 py-1.5">
                        {String(row[k] ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportRows(null)}>
              Cancel
            </Button>
            <Button onClick={confirmImport}>Confirm Import</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
