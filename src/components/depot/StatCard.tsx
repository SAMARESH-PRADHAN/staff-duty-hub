import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "info",
  hint,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: "info" | "amber" | "danger" | "success" | "navy";
  hint?: string;
}) {
  const tones: Record<string, string> = {
    info: "bg-info-soft text-info",
    amber: "bg-amber-soft text-amber-accent",
    danger: "bg-danger-soft text-danger",
    success: "bg-success-soft text-success",
    navy: "bg-secondary text-navy",
  };
  return (
    <div className="card-surface flex items-start gap-4 p-4">
      <div className={cn("grid size-11 shrink-0 place-items-center rounded-xl", tones[tone])}>
        <Icon className="size-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="mt-1 text-2xl font-semibold leading-none">{value}</p>
        {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
      </div>
    </div>
  );
}
