import { createFileRoute } from "@tanstack/react-router";
import { timingSafeEqual } from "node:crypto";

/** Called every 15 minutes by the database scheduler. Auth: token stored in cron_tokens. */
export const Route = createFileRoute("/api/public/gmail/sync-replies")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const provided = request.headers.get("x-cron-token") ?? "";
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: row } = await supabaseAdmin
          .from("cron_tokens" as never)
          .select("token")
          .eq("name", "gmail_sync")
          .maybeSingle();
        const expected = (row as { token?: string } | null)?.token ?? "";
        const a = Buffer.from(provided);
        const b = Buffer.from(expected);
        if (!expected || a.length !== b.length || !timingSafeEqual(a, b)) {
          return new Response("Unauthorized", { status: 401 });
        }
        const { syncRepliesForUser } = await import("@/lib/gmail.server");
        const { data: accounts } = await supabaseAdmin.from("gmail_accounts").select("user_id").limit(200);
        let added = 0;
        for (const acc of accounts ?? []) {
          try {
            added += await syncRepliesForUser(acc.user_id);
          } catch (e) {
            await supabaseAdmin
              .from("gmail_accounts")
              .update({ last_error: e instanceof Error ? e.message.slice(0, 500) : "Sync failed" })
              .eq("user_id", acc.user_id);
          }
        }
        return Response.json({ accounts: accounts?.length ?? 0, added });
      },
    },
  },
});
