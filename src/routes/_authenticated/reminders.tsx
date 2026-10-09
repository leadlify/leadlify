import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AlarmClock, Check, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { errorMessage } from "@/lib/queries";
import { pendingRemindersQuery, type ReminderWithLead } from "@/lib/reminders";

export const Route = createFileRoute("/_authenticated/reminders")({
  head: () => ({
    meta: [
      { title: "Reminders — Leadlify" },
      { name: "description", content: "Overdue and upcoming follow-up reminders for your leads." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Reminders — Leadlify" },
      { property: "og:description", content: "Overdue and upcoming follow-up reminders for your leads." },
    ],
  }),
  component: RemindersPage,
});

function RemindersPage() {
  const queryClient = useQueryClient();
  const reminders = useQuery(pendingRemindersQuery);
  const now = Date.now();
  const all = reminders.data ?? [];
  const overdue = all.filter((r) => new Date(r.remind_at).getTime() <= now);
  const upcoming = all.filter((r) => new Date(r.remind_at).getTime() > now);

  const act = useMutation({
    mutationFn: async ({ id, del }: { id: string; del?: boolean }) => {
      const { error } = del
        ? await supabase.from("reminders").delete().eq("id", id)
        : await supabase.from("reminders").update({ done: true }).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reminders"] }),
    onError: (e) => toast.error(errorMessage(e)),
  });

  const Group = ({ title, items, tone }: { title: string; items: ReminderWithLead[]; tone: string }) => (
    <Card className="shadow-card border-border/60">
      <CardHeader className="pb-3">
        <CardTitle className={`text-base ${tone}`}>{title} ({items.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nothing here.</p>
        ) : (
          items.map((r) => (
            <div key={r.id} className="border-border/60 flex flex-wrap items-center gap-2 rounded-lg border p-3">
              <div className="min-w-0 flex-1">
                <Link to="/lead/$leadId" params={{ leadId: r.lead_id }} className="text-foreground font-medium hover:underline">
                  {r.leads?.business_name ?? "Lead"}
                </Link>
                <p className="text-muted-foreground text-xs">
                  {new Date(r.remind_at).toLocaleString()}
                  {r.label ? ` · ${r.label}` : ""}
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => act.mutate({ id: r.id })}>
                <Check className="size-4" /> Done
              </Button>
              <Button size="icon" variant="ghost" aria-label="Delete reminder" onClick={() => act.mutate({ id: r.id, del: true })}>
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );

  return (
    <AppShell title="Reminders" description="Follow-ups you scheduled on your leads">
      {reminders.isLoading ? null : all.length === 0 ? (
        <Card className="shadow-card border-border/60">
          <CardContent className="py-14 text-center">
            <AlarmClock className="text-muted-foreground mx-auto mb-3 size-8" />
            <p className="text-foreground text-sm font-medium">No reminders yet</p>
            <p className="text-muted-foreground mt-1 text-sm">Open any lead and use "Set reminder" to schedule a follow-up.</p>
            <Button asChild size="sm" variant="outline" className="mt-4">
              <Link to="/leads">Go to leads</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Group title="Overdue" items={overdue} tone="text-destructive" />
          <Group title="Upcoming" items={upcoming} tone="text-foreground" />
        </div>
      )}
    </AppShell>
  );
}
