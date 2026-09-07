import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { callAI, parseAIJson, UpstreamError } from "@/lib/ai.server";

const GenerateInput = z.object({
  leadId: z.string().uuid(),
  instructions: z.string().trim().max(600).optional().default(""),
});

const WHATSAPP_NUMBER = "03701480852";

const EMAIL_SYSTEM = `You write short, high-converting cold outreach emails offering web design services.
Rules: sound human and specific, never use hype or filler, no emojis, no "I hope this email finds you well".
Reference the business by name, name 2-3 concrete problems found on their current site, state the business
benefit of fixing them, and close with one low-friction call to action (a short reply or a 15-minute call).
If a demo_website_url is provided, mention that you already built a free demo site for them and include the
full URL on its own line. Always end with a contact line containing the WhatsApp number exactly as given.
Keep the body under 180 words. Respond with ONLY JSON: {"subject": "...", "body": "..."}
The body must be plain text with real line breaks, and must end with the sender's sign-off followed by the
WhatsApp line.`;

const DM_SYSTEM = `You write short Instagram direct messages offering web design services to small businesses
that have an Instagram page but no website.
Rules: casual but professional, first person, no emojis, no hype, under 70 words, 3 short paragraphs max.
Open by referencing the business by name and something real about them (category, city, rating or reviews).
Say plainly that they have no website and what they are losing without one.
If a demo_website_url is given, say you already built a free demo site for them and include the full URL.
End with the WhatsApp number exactly as given and one simple question asking if you should send details.
Respond with ONLY JSON: {"message": "..."} using real line breaks in the message.`;

/** Generates a ready-to-send Instagram DM for a lead that only has an Instagram page. */
export const generateInstagramDm = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => GenerateInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const [{ data: lead, error }, { data: settings }, { data: demo }] = await Promise.all([
      supabase
        .from("leads")
        .select(
          "business_name, owner_name, business_category, city, country, instagram_handle, google_rating, review_count",
        )
        .eq("id", data.leadId)
        .maybeSingle(),
      supabase
        .from("settings")
        .select("sender_name, email_tone, service_description")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase.from("demo_sites").select("slug").eq("lead_id", data.leadId).maybeSingle(),
    ]);

    if (error) throw new UpstreamError(500, "Could not load that lead.");
    if (!lead) throw new UpstreamError(404, "Lead not found.");

    const origin = new URL(getRequest().url).origin;
    const demoUrl = demo?.slug ? `${origin}/site/${demo.slug}` : null;

    const raw = await callAI({
      system: DM_SYSTEM,
      json: true,
      temperature: 0.8,
      user: JSON.stringify({
        business: {
          name: lead.business_name,
          contact_name: lead.owner_name,
          category: lead.business_category,
          instagram: lead.instagram_handle,
          rating: lead.google_rating,
          reviews: lead.review_count,
          location: [lead.city, lead.country].filter(Boolean).join(", "),
        },
        demo_website_url: demoUrl,
        whatsapp_number: WHATSAPP_NUMBER,
        sender: {
          name: settings?.sender_name ?? "",
          services: settings?.service_description ?? "Custom website design and rebuilds.",
        },
        tone: settings?.email_tone ?? "professional",
        extra_instructions: data.instructions || null,
      }),
    });

    const parsed = parseAIJson<{ message: string }>(raw);
    let message = parsed.message?.trim();
    if (!message) throw new UpstreamError(502, "The AI did not return a usable message. Try again.");

    if (demoUrl && !message.includes(demoUrl)) {
      message += `\n\nFree demo site I made for you: ${demoUrl}`;
    }
    if (!message.includes(WHATSAPP_NUMBER)) {
      message += `\n\nWhatsApp: ${WHATSAPP_NUMBER}`;
    }

    await supabase.from("leads").update({ instagram_message: message }).eq("id", data.leadId);

    return { message, instagramHandle: lead.instagram_handle ?? null };
  });

/** Generates a personalised cold email for a lead using the stored website audit. */
export const generateLeadEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => GenerateInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const [{ data: lead, error }, { data: settings }, { data: demo }] = await Promise.all([
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
      supabase.from("demo_sites").select("slug").eq("lead_id", data.leadId).maybeSingle(),
    ]);

    if (error) throw new UpstreamError(500, "Could not load that lead.");
    if (!lead) throw new UpstreamError(404, "Lead not found.");

    const origin = new URL(getRequest().url).origin;
    const demoUrl = demo?.slug ? `${origin}/site/${demo.slug}` : null;

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
        website_audit:
          lead.analysis ?? "No audit has been run yet — keep claims general but relevant.",
        demo_website_url: demoUrl,
        whatsapp_number: WHATSAPP_NUMBER,
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

    // Guarantee the demo link and WhatsApp number are always present.
    if (demoUrl && !email.body.includes(demoUrl)) {
      email.body += `\n\nI already built a free demo site for you: ${demoUrl}`;
    }
    if (!email.body.includes(WHATSAPP_NUMBER)) {
      email.body += `\n\nWhatsApp: ${WHATSAPP_NUMBER}`;
    }

    await supabase
      .from("leads")
      .update({ generated_email: `${email.subject}\n\n${email.body}` })
      .eq("id", data.leadId);

    return email;
  });
