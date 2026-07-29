import type { LucideIcon } from "lucide-react";

import { AnimatedNumber } from "@/components/animated-number";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "primary",
  suffix = "",
  decimals = 0,
  hint,
  loading,
  delay = 0,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  tone?: "primary" | "secondary" | "accent" | "warning" | "destructive";
  suffix?: string;
  decimals?: number;
  hint?: string;
  loading?: boolean;
  delay?: number;
}) {
  const toneClasses: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    secondary: "bg-secondary/15 text-secondary",
    accent: "bg-accent/15 text-accent",
    warning: "bg-warning/15 text-warning",
    destructive: "bg-destructive/10 text-destructive",
  };

  return (
    <Card
      className="animate-fade-up shadow-card border-border/60 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-elevated"
      style={{ animationDelay: `${delay}ms` }}
    >
      <CardContent className="flex items-start justify-between gap-4 p-5">
        <div className="min-w-0">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            {label}
          </p>
          {loading ? (
            <Skeleton className="mt-2 h-8 w-20" />
          ) : (
            <p className="text-foreground mt-1.5 text-3xl font-semibold tracking-tight tabular-nums">
              <AnimatedNumber value={value} decimals={decimals} suffix={suffix} />
            </p>
          )}
          {hint ? <p className="text-muted-foreground mt-1 truncate text-xs">{hint}</p> : null}
        </div>
        <span
          className={cn("grid size-11 shrink-0 place-items-center rounded-xl", toneClasses[tone])}
        >
          <Icon className="size-5" />
        </span>
      </CardContent>
    </Card>
  );
}
