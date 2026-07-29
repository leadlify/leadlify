import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { readLeadQuota } from "@/server/quota.server";

/** Monthly lead-import allowance for the signed-in user. */
export const getLeadQuota = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => readLeadQuota(context.supabase, context.userId));
