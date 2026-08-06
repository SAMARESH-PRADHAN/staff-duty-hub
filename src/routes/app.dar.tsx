import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Lock, Plus, ShieldAlert, Trophy } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/depot/AppShell";
import { ExportButtons } from "@/components/depot/ExportButtons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { fmtDate, toISO } from "@/lib/retirement";
import type { DarRecord, RewardRecord } from "@/lib/types";

export const Route = createFileRoute("/app/dar")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "DAR & Rewards — SBC Coaching Depot" },
      {
        name: "description",
        content:
          "Restricted disciplinary action records and staff rewards register for the SBC Coaching Depot.",
      },
      { property: "og:title", content: "DAR & Rewards — SBC Coaching Depot" },
      {
        property: "og:description",
        content: "Password-protected disciplinary records and rewards register.",
      },
    ],
  }),
  component: DarPage,
});

const GATE_PASSWORD = "dar@123";

function DarPage() {
  const data = useAppData();
  const [unlocked, setUnlocked] = useState(false);
  const [pw, setPw] = useState("");
  const [gateError, setGateError] = useState("");

  const [darOpen, setDarOpen] = useState(false);
  const [rewardOpen, setRewardOpen] = useState(false);
  const [empId, setEmpId] = useState("");
  const [date, setDate] = useState(toISO(new Date()));
  const [kind, setKind] = useState("");
  const [details, setDetails] = useState("");
  const [error, setError] = useState("");

  const recordedBy = store.session()?.name ?? "HR Manager";

  const reset = () => {
    setEmpId("");
    setDate(toISO(new Date()));
    setKind("");
    setDetails("");
    setError("");
  };

  const nameOf = (id: string) =>
    data.employees.find((e) => e.id === id)?.name ?? "—";

  const darColumns = [
    { header: "Employee", value: (d: DarRecord) => nameOf(d.employeeId) },
    { header: "Action Type", value: (d: DarRecord) => d.type },
    { header: "Date", value: (d: DarRecord) => fmtDate(d.date) },
    { header: "Details", value: (d: DarRecord) => d.description },
    { header: "Recorded By", value: (d: DarRecord) => d.recordedBy },
  ];
  const rewardColumns = [
    { header: "Employee", value: (r: RewardRecord) => nameOf(r.employeeId) },
    { header: "Reward", value: (r: RewardRecord) => r.type },
    { header: "Date", value: (r: RewardRecord) => fmtDate(r.date) },
    { header: "Details", value: (r: RewardRecord) => r.description },
    { header: "Recorded By", value: (r: RewardRecord) => r.recordedBy },
  ];


  const dars = useMemo(
    () => [...data.dar].sort((a, b) => b.date.localeCompare(a.date)),
    [data.dar],
  );
  const rewards = useMemo(
    () => [...data.rewards].sort((a, b) => b.date.localeCompare(a.date)),
    [data.rewards],
  );

  if (!unlocked) {
    return (
      <AppShell title="DAR & Rewards" subtitle="Restricted module">
        <div className="mx-auto mt-10 max-w-sm">
          <div className="card-surface p-6 text-center">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-amber-soft">
              <Lock className="size-5 text-navy" />
            </div>
            <h2 className="text-lg font-semibold">Restricted Access</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Disciplinary records are confidential. Enter the module password to continue.
            </p>
            <form
              className="mt-5 space-y-3 text-left"
              onSubmit={(e) => {
                e.preventDefault();
                if (pw === GATE_PASSWORD) {
                  setUnlocked(true);
                  setGateError("");
                } else {
                  setGateError("Incorrect password.");
                }
              }}
            >
              <Label htmlFor="pw">Module Password</Label>
              <Input
                id="pw"
                type="password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                placeholder="••••••••"
              />
              {gateError ? <p className="text-sm text-danger">{gateError}</p> : null}
              <Button type="submit" className="w-full">
                Unlock
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Demo password: <code>dar@123</code>
              </p>
            </form>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="DAR & Rewards"
      subtitle={`${dars.length} disciplinary record(s) · ${rewards.length} reward(s)`}
    >
      <Tabs defaultValue="dar">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <TabsList>
            <TabsTrigger value="dar">
              <ShieldAlert className="size-4" /> Disciplinary Actions
            </TabsTrigger>
            <TabsTrigger value="rewards">
              <Trophy className="size-4" /> Rewards
            </TabsTrigger>
          </TabsList>
          <div className="ml-auto flex gap-2">
            <Button
              size="sm"
              onClick={() => {
                reset();
                setDarOpen(true);
              }}
            >
              <Plus className="size-4" /> Add DAR
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                reset();
                setRewardOpen(true);
              }}
            >
              <Plus className="size-4" /> Add Reward
            </Button>
          </div>
        </div>

        <TabsContent value="dar">
          <div className="card-surface p-4">
            <div className="mb-3 flex justify-end">
              <ExportButtons title="DAR Records" columns={darColumns} rows={dars} />
            </div>
            <RecordTable
              rows={dars.map((d) => ({
                id: d.id,
                a: nameOf(d.employeeId),
                b: d.type,
                c: fmtDate(d.date),
                d: d.description,
                e: d.recordedBy,
              }))}

              typeLabel="Action Type"
              empty="No disciplinary records."
            />
          </div>
        </TabsContent>

        <TabsContent value="rewards">
          <div className="card-surface p-4">
            <div className="mb-3 flex justify-end">
              <ExportButtons title="Rewards" columns={rewardColumns} rows={rewards} />
            </div>
            <RecordTable
              rows={rewards.map((r) => ({
                id: r.id,
                a: r.employeeName,
                b: r.rewardType,
                c: fmtDate(r.date),
                d: r.details,
                e: r.recordedBy,
              }))}
              typeLabel="Reward"
              empty="No rewards recorded."
            />
          </div>
        </TabsContent>
      </Tabs>

      <Dialog
        open={darOpen || rewardOpen}
        onOpenChange={(o) => {
          if (!o) {
            setDarOpen(false);
            setRewardOpen(false);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{darOpen ? "Add Disciplinary Record" : "Add Reward"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Employee</Label>
              <Select value={empId} onValueChange={setEmpId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {data.employees.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name} — {e.tokenNo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{darOpen ? "Action Type" : "Reward Type"}</Label>
              <Select value={kind} onValueChange={setKind}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {(darOpen
                    ? ["Warning", "Censure", "Withholding of Increment", "Major Penalty"]
                    : ["Commendation", "Cash Award", "Certificate", "Best Employee"]
                  ).map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="d">Date</Label>
              <Input
                id="d"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="det">Details</Label>
              <Textarea
                id="det"
                rows={3}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
              />
            </div>
            {error ? <p className="text-sm text-danger">{error}</p> : null}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDarOpen(false);
                setRewardOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                const emp = data.employees.find((e) => e.id === empId);
                if (!emp || !kind || !date) {
                  setError("Employee, type and date are required.");
                  return;
                }
                if (darOpen) {
                  const rec: DarRecord = {
                    id: uid("dar"),
                    employeeId: emp.id,
                    employeeName: emp.name,
                    actionType: kind,
                    date,
                    details: details.trim(),
                    recordedBy,
                  };
                  store.setDar([rec, ...store.dar()]);
                  logActivity("DAR recorded", `${emp.name} — ${kind}`);
                } else {
                  const rec: RewardRecord = {
                    id: uid("rwd"),
                    employeeId: emp.id,
                    employeeName: emp.name,
                    rewardType: kind,
                    date,
                    details: details.trim(),
                    recordedBy,
                  };
                  store.setRewards([rec, ...store.rewards()]);
                  logActivity("Reward recorded", `${emp.name} — ${kind}`);
                }
                toast.success("Record saved");
                setDarOpen(false);
                setRewardOpen(false);
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function RecordTable({
  rows,
  typeLabel,
  empty,
}: {
  rows: { id: string; a: string; b: string; c: string; d: string; e: string }[];
  typeLabel: string;
  empty: string;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
            <th className="py-2 pr-3 font-medium">Employee</th>
            <th className="py-2 pr-3 font-medium">{typeLabel}</th>
            <th className="py-2 pr-3 font-medium">Date</th>
            <th className="py-2 pr-3 font-medium">Details</th>
            <th className="py-2 pr-3 font-medium">Recorded By</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-border/60 last:border-0">
              <td className="py-2.5 pr-3 font-medium">{r.a}</td>
              <td className="py-2.5 pr-3">{r.b}</td>
              <td className="py-2.5 pr-3">{r.c}</td>
              <td className="py-2.5 pr-3 text-muted-foreground">{r.d || "—"}</td>
              <td className="py-2.5 pr-3">{r.e}</td>
            </tr>
          ))}
          {rows.length === 0 ? (
            <tr>
              <td colSpan={5} className="py-10 text-center text-muted-foreground">
                {empty}
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
