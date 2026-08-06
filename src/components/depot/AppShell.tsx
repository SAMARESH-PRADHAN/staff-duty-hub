import { useState } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { store, logActivity } from "@/lib/storage";
import { useSession } from "@/hooks/useAppData";
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
    <div className="flex items-center gap-3 px-5 py-5">
      <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
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
    <nav className="flex flex-col gap-1 px-3 pb-4">
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
                ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
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
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-card/95 px-4 py-3 backdrop-blur md:px-6">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="size-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 border-0 bg-sidebar p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <Brand />
              <NavList disabled={disabledNav} onNavigate={() => setOpen(false)} />
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

          <Button variant="ghost" size="icon" className="hidden sm:inline-flex">
            <Bell className="size-4" />
            <span className="sr-only">Notifications</span>
          </Button>
          <div className="hidden items-center gap-2 sm:flex">
            <div className="grid size-9 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              {initials}
            </div>
            <div className="leading-tight">
              <p className="text-sm font-medium">{session?.name}</p>
              <p className="text-xs text-muted-foreground">{session?.role}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={logout}>
            <LogOut className="size-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </header>

        {actions ? (
          <div className="flex flex-wrap items-center gap-2 border-b border-border bg-card px-4 py-3 md:px-6">
            {actions}
          </div>
        ) : null}

        <main className="min-w-0 flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
