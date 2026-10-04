import { enforceRateLimit } from "@/lib/rate-limit.server";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { callAI, parseAIJson, UpstreamError } from "@/lib/ai.server";

const IdInput = z.object({ leadId: z.string().uuid() });

export type WebsiteAnalysis = {
  overall_score: number;
  scores: {
    design: number;
    ui: number;
    ux: number;
    mobile_friendly: number;
    seo: number;
    speed: number;
    security: number;
    call_to_action: number;
    contact_form: number;
    portfolio: number;
  };
  summary: string;
  problems: string[];
  opportunities: string[];
  analyzed_at: string;
};

const SYSTEM_PROMPT = `You are a senior web design consultant auditing a small-business website to find redesign opportunities.
You receive objective crawl signals plus a text excerpt from the homepage. Be honest, specific and concrete — never generic.
Respond with ONLY a JSON object of this exact shape:
{
  "overall_score": <0-100 integer>,
  "scores": {
    "design": <0-100>, "ui": <0-100>, "ux": <0-100>, "mobile_friendly": <0-100>,
    "seo": <0-100>, "speed": <0-100>, "security": <0-100>, "call_to_action": <0-100>,
    "contact_form": <0-100>, "portfolio": <0-100>
  },
  "summary": "<2-3 sentence plain-English verdict>",
  "problems": ["<specific issue>", "..."],
  "opportunities": ["<specific benefit of a redesign>", "..."]
}
Give 3-6 problems and 3-5 opportunities. Lower scores mean worse.`;

/** Runs a real crawl plus an AI audit and stores the report on the lead. */
export const analyzeLeadWebsite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => IdInput.parse(input))
  .handler(async ({ data, context }) => {
    await enforceRateLimit(context.supabase, context.userId, "ai_analysis", 10);
    const { supabase } = context;

    const { data: lead, error } = await supabase
      .from("leads")
      .select("id, business_name, business_category, website, city, country, email")
      .eq("id", data.leadId)
      .maybeSingle();

    if (error) throw new UpstreamError(500, "Could not load that lead.");
    if (!lead) throw new UpstreamError(404, "Lead not found.");
    if (!lead.website) {
      await supabase.from("leads").update({ website_status: "missing" }).eq("id", lead.id);
      throw new UpstreamError(
        400,
        `${lead.business_name} has no website on file — nothing to analyse.`,
      );
    }

    const { probeWebsite } = await import("@/lib/website-probe.server");
    const probe = await probeWebsite(lead.website);

    if (!probe.reachable) {
      const offline: WebsiteAnalysis = {
        overall_score: 5,
        scores: {
          design: 0,
          ui: 0,
          ux: 0,
          mobile_friendly: 0,
          seo: 0,
          speed: 0,
          security: probe.ssl ? 40 : 0,
          call_to_action: 0,
          contact_form: 0,
          portfolio: 0,
        },
        summary: `The website at ${lead.website} could not be loaded. ${probe.error ?? ""}`.trim(),
        problems: [
          "The website is offline or unreachable for visitors.",
          "Potential customers searching for this business find nothing.",
          "Search engines cannot index an unreachable site.",
        ],
        opportunities: [
          "A fast, reliable new site would immediately recover lost enquiries.",
          "Modern hosting with SSL restores trust and search visibility.",
        ],
        analyzed_at: new Date().toISOString(),
      };

      await supabase
        .from("leads")
        .update({
          analysis: offline,
          website_status: "offline",
          website_speed: null,
          seo_score: 0,
          mobile_friendly: false,
          ssl_enabled: probe.ssl,
        })
        .eq("id", lead.id);

      return offline;
    }

    const raw = await callAI({
      system: SYSTEM_PROMPT,
      json: true,
      temperature: 0.4,
      user: JSON.stringify({
        business: {
          name: lead.business_name,
          category: lead.business_category,
          location: [lead.city, lead.country].filter(Boolean).join(", "),
          website: lead.website,
        },
        crawl_signals: {
          status_code: probe.statusCode,
          https: probe.ssl,
          response_time_ms: probe.responseMs,
          html_size_bytes: probe.htmlBytes,
          script_tags: probe.scriptCount,
          inline_style_attributes: probe.inlineStyleCount,
          has_viewport_meta: probe.hasViewport,
          has_title: probe.hasTitle,
          title_length: probe.titleLength,
          has_meta_description: probe.hasMetaDescription,
          h1_count: probe.h1Count,
          images: probe.imageCount,
          images_missing_alt: probe.imagesMissingAlt,
          has_contact_form: probe.hasForm,
          has_mailto_link: probe.hasMailto,
          has_phone_link: probe.hasTelLink,
          mentions_portfolio: probe.mentionsPortfolio,
        },
        homepage_text_excerpt: probe.excerpt,
      }),
    });

    const analysis = parseAIJson<Omit<WebsiteAnalysis, "analyzed_at">>(raw);
    const report: WebsiteAnalysis = { ...analysis, analyzed_at: new Date().toISOString() };

    await supabase
      .from("leads")
      .update({
        analysis: report,
        website_status: "online",
        website_speed: probe.responseMs,
        seo_score: report.scores?.seo ?? null,
        mobile_friendly: (report.scores?.mobile_friendly ?? 0) >= 60,
        ssl_enabled: probe.ssl,
        ...(lead.email ? {} : probe.discoveredEmail ? { email: probe.discoveredEmail } : {}),
      })
      .eq("id", lead.id);

    return report;
  });
