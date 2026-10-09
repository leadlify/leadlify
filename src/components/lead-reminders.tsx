import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlarmClock, Check, Loader2, Pencil, Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { errorMessage } from "@/lib/queries";
import { leadRemindersQuery, toLocalInput, type Reminder } from "@/lib/reminders";

export function LeadReminders({ leadId }: { leadId: string }) {
  const queryClient = useQueryClient();
  const reminders = useQuery(leadRemindersQuery(leadId));
  const [when, setWhen] = useState("");
  const [label, setLabel] = useState("");
  const [editing, setEditing] = useState<string | null>(null);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["reminders"] });

  const save = useMutation({
    mutationFn: async () => {
      if (!when) throw new Error("Pick a date and time for the reminder.");
      const payload = { remind_at: new Date(when).toISOString(), label: label.trim() || null };
      const { error } = editing
        ? await supabase.from("reminders").update(payload).eq("id", editing)
        : await supabase.from("reminders").insert({ ...payload, lead_id: leadId });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success(editing ? "Reminder updated" : "Reminder set");
      setWhen("");
      setLabel("");
      setEditing(null);
      refresh();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const patch = useMutation({
    mutationFn: async ({ id, del }: { id: string; del?: boolean }) => {
      const { error } = del
        ? await supabase.from("reminders").delete().eq("id", id)
        : await supabase.from("reminders").update({ done: true }).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: refresh,
    onError: (e) => toast.error(errorMessage(e)),
  });

  const startEdit = (r: Reminder) => {
    setEditing(r.id);
    setWhen(toLocalInput(r.remind_at));
    setLabel(r.label ?? "");
  };

  const pending = (reminders.data ?? []).filter((r) => !r.done);

  return (
    <div className="border-border/60 space-y-2 border-t pt-3">
      <Label className="flex items-center gap-1.5 text-xs">
        <AlarmClock className="size-3.5" /> Reminders
      </Label>
      {pending.length === 0 ? (
        <p className="text-muted-foreground text-xs">No reminders yet for this lead.</p>
      ) : (
        <ul className="space-y-1.5">
          {pending.map((r) => {
            const overdue = new Date(r.remind_at) < new Date();
            return (
              <li key={r.id} className="bg-muted/50 flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs">
                <div className="min-w-0 flex-1">
                  <p className={overdue ? "text-destructive font-medium" : "text-foreground font-medium"}>
                    {new Date(r.remind_at).toLocaleString()}
                  </p>
                  {r.label ? <p className="text-muted-foreground truncate">{r.label}</p> : null}
                </div>
                <Button size="icon" variant="ghost" className="size-8" aria-label="Mark done" onClick={() => patch.mutate({ id: r.id })}>
                  <Check className="size-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="size-8" aria-label="Edit reminder" onClick={() => startEdit(r)}>
                  <Pencil className="size-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="size-8" aria-label="Delete reminder" onClick={() => patch.mutate({ id: r.id, del: true })}>
                  <Trash2 className="size-3.5" />
                </Button>
              </li>
            );
          })}
        </ul>
      )}
      <div className="space-y-2">
        <Input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} aria-label="Reminder date and time" />
        <Input placeholder="Label (optional)" maxLength={80} value={label} onChange={(e) => setLabel(e.target.value)} />
        <div className="flex gap-2">
          <Button size="sm" className="flex-1" onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? <Loader2 className="size-4 animate-spin" /> : <AlarmClock className="size-4" />}
            {editing ? "Update reminder" : "Set reminder"}
          </Button>
          {editing ? (
            <Button size="sm" variant="ghost" onClick={() => { setEditing(null); setWhen(""); setLabel(""); }} aria-label="Cancel edit">
              <X className="size-4" />
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
