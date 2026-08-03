import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";

export type PlanEntitlements = {
  plan: string;
  leadQuota: number;
  emailQuota: number;
  websiteBuilderEnabled: boolean;
};

export async function readPlanEntitlements(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<PlanEntitlements> {
  const { data, error } = await supabase
    .from("profiles")
    .select("plan, monthly_lead_quota, monthly_email_quota, website_builder_enabled")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return {
    plan: data?.plan ?? "free",
    leadQuota: data?.monthly_lead_quota ?? 10,
    emailQuota: data?.monthly_email_quota ?? 2,
    websiteBuilderEnabled: data?.plan !== "free" && data?.website_builder_enabled === true,
  };
}

export function monthStartISO(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}