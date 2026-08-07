import { useRef, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Layers,
  Users,
  CalendarClock,
  ArrowRightLeft,
  ShieldAlert,
  LogOut,
  Menu,
  Bell,
  TrainFront,
  DatabaseBackup,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { backupData, logActivity, restoreData, store } from "@/lib/storage";
import { useAppData, useSession } from "@/hooks/useAppData";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export const NAV_ITEMS = [
  { to: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/app/designations", label: "Designation & Batch", icon: Layers },
  { to: "/app/employees", label: "Employees", icon: Users },
  { to: "/app/retirement", label: "Retirement Forecast", icon: CalendarClock },
  { to: "/app/movements", label: "Transfer & Promotion", icon: ArrowRightLeft },
  { to: "/app/dar", label: "DAR & Rewards", icon: ShieldAlert },
] as const;

function Brand() {
  return (
    <div className="flex items-center gap-3 border-b border-sidebar-border px-5 py-5">
      <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground shadow-card">
        <TrainFront className="size-5" />
      </div>
      <div className="leading-tight">
        <p className="text-sm font-semibold text-sidebar-foreground">SBC Coaching Depot</p>
        <p className="text-xs text-sidebar-foreground/60">Staff &amp; Duty Management</p>
      </div>
    </div>
  );
}

function NavList({
  disabled = false,
  onNavigate,
}: {
  disabled?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="flex flex-col gap-1 px-3 pb-4 pt-4">
      {NAV_ITEMS.map((item) => {
        const active = pathname.startsWith(item.to);
        const content = (
          <>
            <item.icon className="size-4 shrink-0" />
            <span className="truncate">{item.label}</span>
          </>
        );
        if (disabled) {
          return (
            <span
              key={item.to}
              className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/35"
            >
              {content}
            </span>
          );
        }
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
              active
                ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground shadow-[inset_3px_0_0_0_var(--sidebar-primary)]"
                : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
            )}
          >
            {content}
          </Link>
        );
      })}
    </nav>
  );
}

function DataTools() {
  const fileRef = useRef<HTMLInputElement>(null);
  return (
    <div className="mt-auto space-y-2 border-t border-sidebar-border p-3">
      <p className="px-1 text-[11px] font-medium uppercase tracking-wide text-sidebar-foreground/45">
        Data
      </p>
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start gap-3 text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
        onClick={() => {
          backupData();
          toast.success("Backup file downloaded");
        }}
      >
        <DatabaseBackup className="size-4" /> Backup Data
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start gap-3 text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
        onClick={() => fileRef.current?.click()}
      >
        <Upload className="size-4" /> Restore Data
      </Button>
      <input
        ref={fileRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          try {
            await restoreData(file);
            toast.success("Data restored from backup");
          } catch (err) {
            toast.error(
              err instanceof Error ? err.message : "Could not restore this file.",
            );
          }
        }}
      />
    </div>
  );
}

function NotificationBell() {
  const data = useAppData();
  const recent = data.activity.slice(0, 20);
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="size-4" />
          {recent.length > 0 ? (
            <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-danger ring-2 ring-card" />
          ) : null}
          <span className="sr-only">Notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[22rem] p-0">
        <div className="flex items-center justify-between border-b border-border bg-navy px-4 py-3">
          <p className="text-sm font-semibold text-primary-foreground">Recent Activity</p>
          <span className="rounded-full bg-amber-accent/20 px-2 py-0.5 text-[11px] font-medium text-amber-accent">
            Last {recent.length} update{recent.length === 1 ? "" : "s"}
          </span>
        </div>
        <ul className="max-h-[22rem] divide-y divide-border overflow-y-auto">
          {recent.map((a) => (
            <li key={a.id} className="px-4 py-2.5 text-sm hover:bg-muted/50">
              <p className="font-medium">
                {a.action}
                <span className="font-normal text-muted-foreground"> — {a.target}</span>
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {a.actor} · {new Date(a.timestamp).toLocaleString()}
              </p>
            </li>
          ))}
          {recent.length === 0 ? (
            <li className="px-4 py-8 text-center text-sm text-muted-foreground">
              No activity yet.
            </li>
          ) : null}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

export function AppShell({
  title,
  subtitle,
  actions,
  children,
  disabledNav = false,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  disabledNav?: boolean;
}) {
  const { session } = useSession();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const logout = () => {
    logActivity("Logout", session?.role ?? "");
    store.setSession(null);
    navigate({ to: "/", replace: true });
  };

  const initials = (session?.name ?? "HR")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-sidebar md:flex">
        <Brand />
        <NavList disabled={disabledNav} />
        <DataTools />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-card/95 px-4 py-3 backdrop-blur md:px-6">
          <span className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-navy/40 via-amber-accent/50 to-info/40" />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="size-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="flex w-72 flex-col border-0 bg-sidebar p-0"
            >
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <Brand />
              <NavList disabled={disabledNav} onNavigate={() => setOpen(false)} />
              <DataTools />
            </SheetContent>
          </Sheet>

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-semibold text-foreground md:text-lg">
              {title}
            </h1>
            {subtitle ? (
              <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>

          <NotificationBell />
          <div className="hidden items-center gap-2 sm:flex">
            <div className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-navy to-info text-xs font-semibold text-primary-foreground">
              {initials}
            </div>
            <div className="leading-tight">
              <p className="text-sm font-medium">{session?.name}</p>
              <p className="text-xs text-muted-foreground">{session?.role}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={logout}
            className="border-danger/40 bg-danger-soft text-danger hover:bg-danger hover:text-primary-foreground"
          >
            <LogOut className="size-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </header>

        {actions ? (
          <div className="flex flex-wrap items-center gap-2 border-b border-border bg-gradient-to-r from-navy/5 via-card to-info/5 px-4 py-3 md:px-6">
            {actions}
          </div>
        ) : null}

        <main className="min-w-0 flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
