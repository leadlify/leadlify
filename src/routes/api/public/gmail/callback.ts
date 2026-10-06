import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/gmail/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const back = (msg: string, ok = false) =>
          Response.redirect(
            `${url.origin}/settings?gmail=${ok ? "connected" : "error"}&detail=${encodeURIComponent(msg)}`,
            302,
          );
        const err = url.searchParams.get("error");
        if (err) return back(err);
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        if (!code || !state) return back("Missing code or state");

        const { verifyState, exchangeCode, encrypt } = await import("@/lib/gmail.server");
        const userId = verifyState(state);
        if (!userId) return back("Link expired, please try again");
        try {
          const tok = await exchangeCode(url.origin, code);
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data: existing } = await supabaseAdmin
            .from("gmail_accounts")
            .select("refresh_token_ciphertext")
            .eq("user_id", userId)
            .maybeSingle();
          if (!tok.refresh_token && !existing) return back("Google did not return offline access. Try again.");
          const prof = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/profile", {
            headers: { Authorization: `Bearer ${tok.access_token}` },
          }).then((r) => (r.ok ? (r.json() as Promise<{ emailAddress?: string }>) : {}));
          const { error } = await supabaseAdmin.from("gmail_accounts").upsert(
            {
              user_id: userId,
              email: (prof as { emailAddress?: string }).emailAddress ?? null,
              refresh_token_ciphertext: tok.refresh_token
                ? encrypt(tok.refresh_token)
                : existing!.refresh_token_ciphertext,
              scopes: tok.scope ?? null,
              last_error: null,
            },
            { onConflict: "user_id" },
          );
          if (error) return back(error.message);
          return back("ok", true);
        } catch (e) {
          return back(e instanceof Error ? e.message : "Connection failed");
        }
      },
    },
  },
});
