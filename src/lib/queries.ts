import { queryOptions } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Lead = Tables<"leads">;
export type EmailRecord = Tables<"email_history">;
export type Settings = Tables<"settings">;

export const leadsQuery = queryOptions({
  queryKey: ["leads"],
  queryFn: async (): Promise<Lead[]> => {
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1000);
    if (error) throw new Error(error.message);
    return data ?? [];
  },
});

export const leadQuery = (id: string) =>
  queryOptions({
    queryKey: ["lead", id],
    queryFn: async (): Promise<Lead | null> => {
      const { data, error } = await supabase.from("leads").select("*").eq("id", id).maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    },
  });

export const emailsQuery = queryOptions({
  queryKey: ["emails"],
  queryFn: async (): Promise<EmailRecord[]> => {
    const { data, error } = await supabase
      .from("email_history")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1000);
    if (error) throw new Error(error.message);
    return data ?? [];
  },
});

export const leadEmailsQuery = (leadId: string) =>
  queryOptions({
    queryKey: ["emails", leadId],
    queryFn: async (): Promise<EmailRecord[]> => {
      const { data, error } = await supabase
        .from("email_history")
        .select("*")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });

export const settingsQuery = queryOptions({
  queryKey: ["settings"],
  queryFn: async (): Promise<Settings | null> => {
    const { data, error } = await supabase.from("settings").select("*").maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  },
});

/** Human-readable message for anything thrown by a server function or Supabase. */
export function errorMessage(error: unknown, fallback = "Something went wrong."): string {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return "You appear to be offline. Check your connection and try again.";
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
