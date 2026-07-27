import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { callAI, callGoogle, parseAIJson, UpstreamError } from "@/lib/ai.server";

const GenerateInput = z.object({
  leadId: z.string().uuid(),
  instructions: z.string().trim().max(600).optional().default(""),
});

const SendInput = z.object({
  leadId: z.string().uuid(),
  to: z.string().trim().email("A valid recipient email is required.").max(255),
  subject: z.string().trim().min(1, "Subject is required.").max(200),
  body: z.string().trim().min(1, "Email body is required.").max(20000),
});

const EMAIL_SYSTEM = `You write short, high-converting cold outreach emails offering web design services.
Rules: sound human and specific, never use hype or filler, no emojis, no "I hope this email finds you well".
Reference the business by name, name 2-3 concrete problems found on their current site, state the business
benefit of fixing them, and close with one low-friction call to action (a short reply or a 15-minute call).
Keep the body under 160 words. Respond with ONLY JSON: {"subject": "...", "body": "..."}
The body must be plain text with real line breaks, and must end with the sender's sign-off.`;

/** Generates a personalised cold email for a lead using the stored website audit. */
export const generateLeadEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => GenerateInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const [{ data: lead, error }, { data: settings }] = await Promise.all([
      supabase
        .from("leads")
        .select("business_name, owner_name, business_category, website, city, country, analysis")
        .eq("id", data.leadId)
        .maybeSingle(),
      supabase
        .from("settings")
        .select("sender_name, sender_email, signature, email_tone, service_description")
        .eq("user_id", userId)
        .maybeSingle(),
    ]);

    if (error) throw new UpstreamError(500, "Could not load that lead.");
    if (!lead) throw new UpstreamError(404, "Lead not found.");

    const raw = await callAI({
      system: EMAIL_SYSTEM,
      json: true,
      temperature: 0.8,
      user: JSON.stringify({
        business: {
          name: lead.business_name,
          contact_name: lead.owner_name,
          category: lead.business_category,
          website: lead.website,
          location: [lead.city, lead.country].filter(Boolean).join(", "),
        },
        website_audit: lead.analysis ?? "No audit has been run yet — keep claims general but relevant.",
        sender: {
          name: settings?.sender_name ?? "",
          email: settings?.sender_email ?? "",
          signature: settings?.signature ?? "",
          services: settings?.service_description ?? "Custom website design and rebuilds.",
        },
        tone: settings?.email_tone ?? "professional",
        extra_instructions: data.instructions || null,
      }),
    });

    const email = parseAIJson<{ subject: string; body: string }>(raw);
    if (!email.subject || !email.body) {
      throw new UpstreamError(502, "The AI did not return a usable email. Try regenerating.");
    }

    await supabase
      .from("leads")
      .update({ generated_email: `${email.subject}\n\n${email.body}` })
      .eq("id", data.leadId);

    return email;
  });

function toBase64Url(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Returns the connected Gmail mailbox, or null when Gmail is not reachable. */
export const getGmailProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    try {
      const profile = (await callGoogle({
        connector: "google_mail",
        path: "/gmail/v1/users/me/profile",
      })) as { emailAddress?: string; messagesTotal?: number };
      return {
        connected: true as const,
        email: profile.emailAddress ?? null,
        messagesTotal: profile.messagesTotal ?? 0,
      };
    } catch (error) {
      return {
        connected: false as const,
        email: null,
        messagesTotal: 0,
        reason: error instanceof Error ? error.message : "Gmail is not reachable.",
      };
    }
  });

/** Sends a cold email through the connected Gmail account and logs it. */
export const sendLeadEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => SendInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: log, error: logError } = await supabase
      .from("email_history")
      .insert({
        user_id: userId,
        lead_id: data.leadId,
        to_email: data.to,
        subject: data.subject,
        body: data.body,
        sent_status: "pending",
      })
      .select("id")
      .single();

    if (logError || !log) throw new UpstreamError(500, "Could not record the email before sending.");

    const mime = [
      `To: ${data.to}`,
      `Subject: ${data.subject}`,
      "MIME-Version: 1.0",
      'Content-Type: text/plain; charset="UTF-8"',
      "",
      data.body,
    ].join("\r\n");

    try {
      const sent = (await callGoogle({
        connector: "google_mail",
        path: "/gmail/v1/users/me/messages/send",
        method: "POST",
        body: { raw: toBase64Url(mime) },
      })) as { id?: string; threadId?: string };

      await Promise.all([
        supabase
          .from("email_history")
          .update({
            sent_status: "sent",
            sent_at: new Date().toISOString(),
            gmail_message_id: sent.id ?? null,
            gmail_thread_id: sent.threadId ?? null,
          })
          .eq("id", log.id),
        supabase
          .from("leads")
          .update({ status: "contacted" })
          .eq("id", data.leadId)
          .eq("status", "new"),
      ]);

      return { ok: true as const, emailId: log.id };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gmail rejected the message.";
      await supabase
        .from("email_history")
        .update({ sent_status: "failed", error_message: message })
        .eq("id", log.id);
      throw new UpstreamError(error instanceof UpstreamError ? error.status : 502, message);
    }
  });

/** Polls Gmail threads for replies to sent emails and flags the matching leads. */
export const syncReplies = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;

    const { data: sent } = await supabase
      .from("email_history")
      .select("id, lead_id, gmail_thread_id")
      .eq("sent_status", "sent")
      .eq("replied", false)
      .not("gmail_thread_id", "is", null)
      .limit(50);

    if (!sent?.length) return { checked: 0, replies: 0 };

    let replies = 0;
    for (const row of sent) {
      try {
        const thread = (await callGoogle({
          connector: "google_mail",
          path: `/gmail/v1/users/me/threads/${row.gmail_thread_id}?format=metadata`,
        })) as { messages?: Array<{ labelIds?: string[] }> };

        const inbound = (thread.messages ?? []).some((m) => m.labelIds?.includes("INBOX"));
        if (!inbound) continue;

        replies += 1;
        await Promise.all([
          supabase
            .from("email_history")
            .update({ replied: true, replied_at: new Date().toISOString() })
            .eq("id", row.id),
          row.lead_id
            ? supabase
                .from("leads")
                .update({ status: "replied" })
                .eq("id", row.lead_id)
                .in("status", ["new", "contacted"])
            : Promise.resolve(),
        ]);
      } catch (error) {
        console.warn("[sync-replies] thread failed", error);
      }
    }

    return { checked: sent.length, replies };
  });
