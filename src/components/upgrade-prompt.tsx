import { Link } from "@tanstack/react-router";
import { ArrowUpRight, LockKeyhole } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function UpgradePrompt({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <Alert className="border-primary/30 bg-primary/5">
      <LockKeyhole className="size-4 text-primary" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground">{message}</p>
        <Button asChild size="sm" className="shrink-0">
          <Link to="/plans">
            View plans
            <ArrowUpRight className="size-4" />
          </Link>
        </Button>
      </AlertDescription>
    </Alert>
  );
}