/** Server-only monthly lead quota helpers. */
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";

export const DEFAULT_MONTHLY_LEAD_QUOTA = 500;

export type LeadQuota = {
  used: number;
  quota: number;
  remaining: number;
  resetsOn: string;
};

function startOfMonthISO(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

function startOfNextMonthISO(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)).toISOString();
}

export async function readLeadQuota(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<LeadQuota> {
  const [{ data: profile }, { count }] = await Promise.all([
    supabase.from("profiles").select("monthly_lead_quota").eq("id", userId).maybeSingle(),
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", startOfMonthISO()),
  ]);

  const quota = profile?.monthly_lead_quota ?? DEFAULT_MONTHLY_LEAD_QUOTA;
  const used = count ?? 0;
  return {
    used,
    quota,
    remaining: Math.max(quota - used, 0),
    resetsOn: startOfNextMonthISO(),
  };
}
