import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Users,
  CalendarClock,
  ShieldAlert,
  Award,
  Layers,
  AlertTriangle,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import { AppShell } from "@/components/depot/AppShell";
import { StatCard } from "@/components/depot/StatCard";
import { useAppData } from "@/hooks/useAppData";
import { calcRetirementDate, monthsBetween } from "@/lib/retirement";

export const Route = createFileRoute("/app/dashboard")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "HR Dashboard — SBC Coaching Depot" },
      {
        name: "description",
        content:
          "Depot-wide staff analytics: headcount by designation and batch, retirement outlook and recent HR activity.",
      },
      { property: "og:title", content: "HR Dashboard — SBC Coaching Depot" },
      {
        property: "og:description",
        content: "Live staff analytics for the SBC Coaching Depot HR team.",
      },
    ],
  }),
  component: DashboardPage,
});

const PIE_COLORS = [
  "#0F2547",
  "#1D4E89",
  "#2E86AB",
  "#E9A13B",
  "#C0563B",
  "#4C956C",
  "#7B6CA8",
  "#8C8C8C",
];

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card-surface p-4">
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {children as React.ReactElement}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function DashboardPage() {
  const data = useAppData();
  const now = new Date();

  const stats = useMemo(() => {
    const onRoll = data.employees.filter((e) => e.status === "Active");
    const retiring12 = onRoll.filter((e) => {
      const rd = calcRetirementDate(e.dob);
      if (!rd) return false;
      const m = monthsBetween(now, rd);
      return m >= 0 && m <= 12;
    }).length;
    const cleanup = data.employees.filter((e) => !e.hrmsId || e.aadhaar.length !== 12)
      .length;
    return {
      onRoll: onRoll.length,
      retiring12,
      cleanup,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const byDesignation = useMemo(() => {
    const map = new Map<string, number>();
    data.employees.forEach((e) => map.set(e.designation, (map.get(e.designation) ?? 0) + 1));
    return [...map].map(([name, value]) => ({ name, value }));
  }, [data.employees]);

  const byBatch = useMemo(() => {
    const map = new Map<string, number>();
    data.employees.forEach((e) => map.set(e.batch, (map.get(e.batch) ?? 0) + 1));
    return [...map].map(([name, count]) => ({ name, count }));
  }, [data.employees]);

  const byGender = useMemo(() => {
    const map = new Map<string, number>();
    data.employees.forEach((e) => map.set(e.gender, (map.get(e.gender) ?? 0) + 1));
    return [...map].map(([name, value]) => ({ name, value }));
  }, [data.employees]);

  const retirementsPerYear = useMemo(() => {
    const start = now.getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => start + i);
    return years.map((year) => ({
      year: String(year),
      retirements: data.employees.filter((e) => {
        if (e.status !== "Active") return false;
        const rd = calcRetirementDate(e.dob);
        return rd?.getUTCFullYear() === year;
      }).length,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.employees]);

  return (
    <AppShell title="Dashboard" subtitle="Depot staff overview & analytics">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Employees on Roll" value={stats.onRoll} icon={Users} tone="navy" />
        <StatCard
          label="Retiring in 12 Months"
          value={stats.retiring12}
          icon={CalendarClock}
          tone="amber"
        />
        <StatCard
          label="Batches / Designations"
          value={`${data.batches.length} / ${data.designations.length}`}
          icon={Layers}
          tone="info"
        />
        <StatCard
          label="Records Needing Cleanup"
          value={stats.cleanup}
          icon={AlertTriangle}
          tone="amber"
          hint="Missing HRMS-ID or invalid Aadhaar"
        />
      </div>


      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <ChartCard title="Headcount by Designation">
          <PieChart>
            <Pie
              data={byDesignation}
              dataKey="value"
              nameKey="name"
              outerRadius={85}
              label={(entry: { name?: string; value?: number }) =>
                `${entry.name} (${entry.value})`
              }
            >
              {byDesignation.map((_, i) => (
                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ChartCard>

        <ChartCard title="Headcount by Batch">
          <BarChart data={byBatch}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-25} dy={10} height={50} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="count" fill="#1D4E89" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ChartCard>

        <ChartCard title="Retirements — Next 5 Years">
          <LineChart data={retirementsPerYear}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="year" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="retirements"
              stroke="#E9A13B"
              strokeWidth={3}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ChartCard>

        <ChartCard title="Gender Distribution">
          <PieChart>
            <Pie
              data={byGender}
              dataKey="value"
              nameKey="name"
              innerRadius={50}
              outerRadius={85}
            >
              {byGender.map((_, i) => (
                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Legend />
            <Tooltip />
          </PieChart>
        </ChartCard>
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        Recent HR activity is available any time from the notification bell in the header.
      </p>

    </AppShell>
  );
}
