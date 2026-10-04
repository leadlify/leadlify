import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { UpstreamError } from "@/lib/ai.server";

/**
 * Per-user sliding-window rate limit backed by the action_log table (RLS: own rows only).
 * Throws a friendly 429 when the user exceeds `max` calls in `windowSeconds`.
 */
export async function enforceRateLimit(
  supabase: SupabaseClient<Database>,
  userId: string,
  action: string,
  max: number,
  windowSeconds = 60,
): Promise<void> {
  const since = new Date(Date.now() - windowSeconds * 1000).toISOString();
  const { count, error } = await supabase
    .from("action_log")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("action", action)
    .gte("created_at", since);
  if (error) throw new UpstreamError(500, "Could not check usage limits.");
  if ((count ?? 0) >= max) {
    throw new UpstreamError(429, "You're going too fast. Please wait a minute and try again.");
  }
  await supabase.from("action_log").insert({ user_id: userId, action });
}
