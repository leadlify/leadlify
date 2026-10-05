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

export type Profile = Tables<"profiles">;
export type Payment = Tables<"payments">;
export type PlanRequest = Tables<"plan_requests">;

export const isAdminQuery = queryOptions({
  queryKey: ["is-admin"],
  queryFn: async (): Promise<boolean> => {
    const { data, error } = await supabase.from("user_roles").select("role");
    if (error) return false;
    return (data ?? []).some((row) => row.role === "admin");
  },
});

export const allProfilesQuery = queryOptions({
  queryKey: ["admin", "profiles"],
  queryFn: async (): Promise<Profile[]> => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1000);
    if (error) throw new Error(error.message);
    return data ?? [];
  },
});

export const allPaymentsQuery = queryOptions({
  queryKey: ["admin", "payments"],
  queryFn: async (): Promise<Payment[]> => {
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .order("paid_at", { ascending: false })
      .limit(1000);
    if (error) throw new Error(error.message);
    return data ?? [];
  },
});

export const allPlanRequestsQuery = queryOptions({
  queryKey: ["admin", "plan-requests"],
  queryFn: async (): Promise<PlanRequest[]> => {
    const { data, error } = await supabase.from("plan_requests").select("*").order("created_at", { ascending: false }).limit(1000);
    if (error) throw new Error(error.message);
    return data ?? [];
  },
});

export const allLeadsQuery = queryOptions({
  queryKey: ["admin", "leads"],
  queryFn: async (): Promise<Pick<Lead, "id" | "user_id" | "created_at" | "status" | "business_name" | "business_category" | "country">[]> => {
    const { data, error } = await supabase
      .from("leads")
      .select("id,user_id,created_at,status,business_name,business_category,country")
      .order("created_at", { ascending: false })
      .limit(5000);
    if (error) throw new Error(error.message);
    return data ?? [];
  },
});

export const allEmailsQuery = queryOptions({
  queryKey: ["admin", "emails"],
  queryFn: async (): Promise<
    Pick<EmailRecord, "id" | "user_id" | "created_at" | "sent_status" | "replied">[]
  > => {
    const { data, error } = await supabase
      .from("email_history")
      .select("id,user_id,created_at,sent_status,replied")
      .order("created_at", { ascending: false })
      .limit(5000);
    if (error) throw new Error(error.message);
    return data ?? [];
  },
});

export type DemoSite = Tables<"demo_sites">;

export const demoSiteQuery = (leadId: string) =>
  queryOptions({
    queryKey: ["demo-site", leadId],
    queryFn: async (): Promise<Pick<DemoSite, "id" | "slug" | "updated_at"> | null> => {
      const { data, error } = await supabase
        .from("demo_sites")
        .select("id,slug,updated_at")
        .eq("lead_id", leadId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    },
  });
