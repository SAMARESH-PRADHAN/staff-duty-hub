import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, TrainFront, LogIn } from "lucide-react";
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
import { ensureSeeded, logActivity, store } from "@/lib/storage";
import { toast } from "sonner";
import type { Session } from "@/lib/types";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Login — SBC Coaching Depot Staff & Duty Management" },
      {
        name: "description",
        content:
          "Secure sign-in for HR and Roster managers of the SBC Coaching Depot staff and duty management system.",
      },
      { property: "og:title", content: "SBC Coaching Depot — Staff & Duty Management" },
      {
        property: "og:description",
        content:
          "Manage depot staff records, retirement forecasts, promotions, transfers and disciplinary records.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState<Session["role"]>("HR Manager");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    ensureSeeded();
    const existing = store.session();
    if (existing) {
      navigate({
        to: existing.role === "HR Manager" ? "/app/dashboard" : "/roster",
        replace: true,
      });
    }
  }, [navigate]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const match = store
      .credentials()
      .find(
        (c) =>
          c.role === role &&
          c.username === username.trim().toLowerCase() &&
          c.password === password,
      );
    if (!match) {
      setError("Invalid role, username or password. Please try again.");
      return;
    }
    setError("");
    store.setSession({
      role: match.role,
      username: match.username,
      name: match.name,
      loginAt: new Date().toISOString(),
    });
    logActivity("Login", match.role);
    toast.success(`Welcome, ${match.name}`);
    navigate({
      to: match.role === "HR Manager" ? "/app/dashboard" : "/roster",
      replace: true,
    });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-navy px-4 py-10">
      <div className="pointer-events-none absolute -left-32 -top-32 size-96 rounded-full bg-amber-accent/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-24 size-[28rem] rounded-full bg-info/20 blur-3xl" />

      <div className="relative w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="grid size-14 place-items-center rounded-2xl bg-amber-accent text-navy shadow-card-lg">
            <TrainFront className="size-7" />
          </div>
          <h1 className="mt-4 text-xl font-semibold text-primary-foreground md:text-2xl">
            SBC Coaching Depot
          </h1>
          <p className="text-sm text-primary-foreground/70">Staff &amp; Duty Management</p>
        </div>

        <form
          onSubmit={submit}
          className="rounded-2xl bg-card p-6 shadow-card-lg md:p-8"
          noValidate
        >
          <h2 className="text-lg font-semibold">Sign in</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Select your role and enter your depot credentials.
          </p>

          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as Session["role"])}>
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HR Manager">HR Manager</SelectItem>
                  <SelectItem value="Roster Manager">Roster Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                autoComplete="username"
                onChange={(e) => setUsername(e.target.value)}
                placeholder="hr"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={show ? "text" : "password"}
                  value={password}
                  autoComplete="current-password"
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="absolute inset-y-0 right-0 grid w-10 place-items-center text-muted-foreground hover:text-foreground"
                  aria-label={show ? "Hide password" : "Show password"}
                >
                  {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {error ? (
              <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
                {error}
              </p>
            ) : null}

            <Button type="submit" className="w-full">
              <LogIn className="size-4" />
              Login
            </Button>
          </div>

          <div className="mt-6 rounded-lg bg-muted p-3 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Demo credentials</p>
            <p>HR Manager — hr / hr123</p>
            <p>Roster Manager — roster / roster123</p>
          </div>
        </form>
      </div>
    </div>
  );
}
