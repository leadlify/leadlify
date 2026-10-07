import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Returns the Google consent URL for connecting the user's Gmail. */
export const getGmailConnectUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { buildAuthUrl } = await import("@/lib/gmail.server");
    const origin = new URL(getRequest().url).origin;
    return { url: buildAuthUrl(origin, context.userId) };
  });

export const getGmailStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("gmail_accounts")
      .select("email, last_checked_at, last_error")
      .eq("user_id", context.userId)
      .maybeSingle();
    return data ?? null;
  });

export const disconnectGmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("gmail_accounts").delete().eq("user_id", context.userId);
    return { ok: true };
  });

/** Sends an email from the user's connected Gmail and logs it for reply tracking. */
export const sendLeadEmailViaGmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        leadId: z.string().uuid(),
        to: z.string().trim().email().max(255),
        subject: z.string().trim().min(1).max(200),
        body: z.string().trim().min(1).max(10000),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { enforceRateLimit } = await import("@/lib/rate-limit.server");
    await enforceRateLimit(context.supabase, context.userId, "gmail_send", 10);
    const { accessTokenFor, gmailFetch, rawEmail } = await import("@/lib/gmail.server");
    const { supabase, userId } = context;

    const { data: lead } = await supabase.from("leads").select("id").eq("id", data.leadId).maybeSingle();
    if (!lead) throw new Error("Lead not found.");
    const { data: settings } = await supabase
      .from("settings")
      .select("sender_name")
      .eq("user_id", userId)
      .maybeSingle();

    const toLower = data.to.toLowerCase();
    const { data: blocked } = await supabase
      .from("unsubscribes")
      .select("id")
      .eq("user_id", userId)
      .eq("email", toLower)
      .maybeSingle();
    if (blocked) throw new Error("This address is on your unsubscribe list, so it was not emailed.");

    const { token, email } = await accessTokenFor(userId);
    if (!email) throw new Error("Connected Gmail address unknown. Reconnect Gmail in Settings.");
    let sent: { id: string; threadId: string };
    try {
      sent = await gmailFetch<{ id: string; threadId: string }>(token, "/messages/send", {
        method: "POST",
        body: JSON.stringify({
          raw: rawEmail({
            from: email,
            fromName: settings?.sender_name || undefined,
            to: data.to,
            subject: data.subject,
            body: data.body,
          }),
        }),
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await supabase.from("email_history").insert({
        user_id: userId,
        lead_id: data.leadId,
        to_email: data.to,
        subject: data.subject,
        body: data.body,
        sent_status: "failed",
        error_message: msg.slice(0, 1000),
      });
      throw new Error(`Gmail could not send this email: ${msg}`);
    }

    const now = new Date().toISOString();
    await supabase.from("email_history").insert({
      user_id: userId,
      lead_id: data.leadId,
      to_email: data.to,
      subject: data.subject,
      body: data.body,
      sent_status: "sent",
      sent_at: now,
      gmail_message_id: sent.id,
      gmail_thread_id: sent.threadId,
    });
    await supabase.from("outreach").insert({
      user_id: userId,
      lead_id: data.leadId,
      channel: "email",
      status: "sent",
      sent_at: now,
    });
    await supabase.from("leads").update({ status: "contacted" }).eq("id", data.leadId);
    return { ok: true, from: email };
  });

/** Manual "check now" for replies. */
export const checkGmailReplies = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { enforceRateLimit } = await import("@/lib/rate-limit.server");
    await enforceRateLimit(context.supabase, context.userId, "gmail_sync", 3);
    const { syncRepliesForUser } = await import("@/lib/gmail.server");
    return { added: await syncRepliesForUser(context.userId) };
  });

/** Sends a test email from the connected Gmail to itself. */
export const sendGmailTestEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { enforceRateLimit } = await import("@/lib/rate-limit.server");
    await enforceRateLimit(context.supabase, context.userId, "gmail_send", 10);
    const { sendSelfTest } = await import("@/lib/gmail.server");
    return sendSelfTest(context.userId);
  });

/** Adds an address to the user's unsubscribe list and marks the lead not interested. */
export const unsubscribeLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        email: z.string().trim().email().max(255),
        leadId: z.string().uuid().nullable().optional(),
        reason: z.string().trim().max(300).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("unsubscribes").upsert(
      { user_id: userId, email: data.email.toLowerCase(), lead_id: data.leadId ?? null, reason: data.reason ?? null },
      { onConflict: "user_id,email", ignoreDuplicates: true },
    );
    if (error && !error.message.includes("duplicate")) throw new Error(error.message);
    if (data.leadId) {
      await supabase.from("leads").update({ status: "lost" }).eq("id", data.leadId);
      await supabase.from("outreach").insert({ user_id: userId, lead_id: data.leadId, channel: "email", status: "not_interested" });
    }
    return { ok: true };
  });
