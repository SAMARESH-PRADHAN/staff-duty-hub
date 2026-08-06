import { useEffect } from "react";
import { Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSession } from "@/hooks/useAppData";

export const Route = createFileRoute("/app")({
  ssr: false,
  component: AppLayout,
});

function AppLayout() {
  const { session, loaded } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loaded) return;
    if (!session) navigate({ to: "/", replace: true });
    else if (session.role !== "HR Manager") navigate({ to: "/roster", replace: true });
  }, [loaded, session, navigate]);

  if (!loaded || !session || session.role !== "HR Manager") {
    return <div className="min-h-screen bg-background" />;
  }

  return <Outlet />;
}
