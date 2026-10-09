import { queryOptions } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Reminder = Tables<"reminders">;
export type ReminderWithLead = Reminder & { leads: { business_name: string } | null };

/** All pending (not done) reminders of the signed-in user, soonest first. RLS scopes to the user. */
export const pendingRemindersQuery = queryOptions({
  queryKey: ["reminders", "pending"],
  queryFn: async (): Promise<ReminderWithLead[]> => {
    const { data, error } = await supabase
      .from("reminders")
      .select("*, leads(business_name)")
      .eq("done", false)
      .order("remind_at", { ascending: true })
      .limit(500);
    if (error) throw new Error(error.message);
    return (data ?? []) as ReminderWithLead[];
  },
  refetchInterval: 60_000,
});

export const leadRemindersQuery = (leadId: string) =>
  queryOptions({
    queryKey: ["reminders", "lead", leadId],
    queryFn: async (): Promise<Reminder[]> => {
      const { data, error } = await supabase
        .from("reminders")
        .select("*")
        .eq("lead_id", leadId)
        .order("remind_at", { ascending: true });
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });

/** Converts an ISO timestamp into the value format a datetime-local input expects. */
export function toLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
