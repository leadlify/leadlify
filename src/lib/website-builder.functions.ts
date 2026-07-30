import { createServerFn, getRequest } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { UpstreamError } from "@/lib/ai.server";

const Input = z.object({ leadId: z.string().uuid() });

/** Generates (or regenerates) a public demo website for a lead and returns its link. */
export const generateDemoWebsite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { buildDemoHtml, slugify } = await import("@/lib/website-builder.server");

    const { data: lead, error } = await supabase
      .from("leads")
      .select(
        "business_name, business_category, city, country, address, phone, email, google_rating, review_count, website, analysis",
      )
      .eq("id", data.leadId)
      .maybeSingle();

    if (error) throw new UpstreamError(500, "Could not load that lead.");
    if (!lead) throw new UpstreamError(404, "Lead not found.");

    const html = await buildDemoHtml({
      businessName: lead.business_name,
      category: lead.business_category,
      city: lead.city,
      country: lead.country,
      address: lead.address,
      phone: lead.phone,
      email: lead.email,
      rating: lead.google_rating,
      reviewCount: lead.review_count,
      currentWebsite: lead.website,
      audit: lead.analysis,
    });

    const { data: existing } = await supabase
      .from("demo_sites")
      .select("id, slug")
      .eq("lead_id", data.leadId)
      .maybeSingle();

    const slug = existing?.slug ?? slugify(lead.business_name);

    if (existing) {
      const { error: updateError } = await supabase
        .from("demo_sites")
        .update({ html, business_name: lead.business_name, updated_at: new Date().toISOString() })
        .eq("id", existing.id);
      if (updateError) throw new UpstreamError(500, "Could not save the demo website.");
    } else {
      const { error: insertError } = await supabase.from("demo_sites").insert({
        user_id: userId,
        lead_id: data.leadId,
        slug,
        business_name: lead.business_name,
        html,
      });
      if (insertError) throw new UpstreamError(500, "Could not save the demo website.");
    }

    const origin = new URL(getRequest().url).origin;
    return { slug, url: `${origin}/site/${slug}` };
  });
