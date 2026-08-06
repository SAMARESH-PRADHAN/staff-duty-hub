import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Construction } from "lucide-react";
import { AppShell } from "@/components/depot/AppShell";
import { useSession } from "@/hooks/useAppData";

export const Route = createFileRoute("/roster")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Roster Manager — SBC Coaching Depot" },
      {
        name: "description",
        content:
          "Roster Manager workspace for the SBC Coaching Depot duty management system.",
      },
      { property: "og:title", content: "Roster Manager — SBC Coaching Depot" },
      {
        property: "og:description",
        content: "Duty roster planning module for the SBC Coaching Depot.",
      },
    ],
  }),
  component: RosterPage,
});

function RosterPage() {
  const { session, loaded } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (loaded && !session) navigate({ to: "/", replace: true });
  }, [loaded, session, navigate]);

  if (!loaded || !session) return <div className="min-h-screen bg-background" />;

  return (
    <AppShell title="Roster Manager" subtitle="Duty roster planning" disabledNav>
      <div className="mx-auto flex max-w-xl flex-col items-center rounded-2xl border border-border bg-card px-6 py-16 text-center shadow-card">
        <div className="grid size-16 place-items-center rounded-2xl bg-amber-soft text-amber-accent">
          <Construction className="size-8" />
        </div>
        <h2 className="mt-6 text-xl font-semibold">
          Roster Manager module is under development
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Duty roster planning, shift allocation and leave balancing will be available
          here soon. Please use the HR Manager login to explore the staff management
          modules.
        </p>
      </div>
    </AppShell>
  );
}
