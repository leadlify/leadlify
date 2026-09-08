import { Clock } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";

export function ComingSoon({
  title,
  description,
  message,
}: {
  title: string;
  description?: string;
  message: string;
}) {
  return (
    <AppShell title={title} description={description}>
      <Card className="shadow-card border-border/60">
        <CardContent className="flex flex-col items-center gap-4 py-20 text-center">
          <span className="bg-muted grid size-14 place-items-center rounded-2xl">
            <Clock className="text-primary size-6" />
          </span>
          <p className="text-foreground text-xl font-semibold tracking-tight">Coming soon</p>
          <p className="text-muted-foreground max-w-md text-sm leading-relaxed">{message}</p>
        </CardContent>
      </Card>
    </AppShell>
  );
}
