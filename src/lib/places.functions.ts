import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { callGoogle, UpstreamError } from "@/lib/ai.server";
import { countryName } from "@/lib/countries";

const SearchInput = z.object({
  country: z.string().trim().max(80).optional().default(""),
  countryCode: z
    .string()
    .trim()
    .regex(/^[A-Za-z]{2}$/, "Select a country")
    .optional()
    .or(z.literal(""))
    .default(""),
  city: z.string().trim().max(80).optional().default(""),
  industry: z.string().trim().max(80).optional().default(""),
  businessType: z.string().trim().min(1, "Business type is required").max(80),
  keyword: z.string().trim().max(80).optional().default(""),
  maxLeads: z.number().int().min(1).max(50).default(20),
  radiusKm: z.number().min(1).max(50).default(10),
  onlyWithoutWebsite: z.boolean().optional().default(false),
  /**
   * Website quality of the businesses to keep:
   * any | none (no website at all) | poor (score <= 40) | needs-work (score <= 70) | good (> 70).
   */
  websiteQuality: z.enum(["any", "none", "poor", "needs-work", "good"]).optional().default("any"),
});

/** Cheap 0-100 quality score derived from real signals on the business website. */
function qualityScore(probe: {
  reachable: boolean;
  ssl: boolean;
  responseMs: number;
  hasViewport: boolean;
  hasTitle: boolean;
  hasMetaDescription: boolean;
  h1Count: number;
  imageCount: number;
  imagesMissingAlt: number;
  hasForm: boolean;
}): number {
  if (!probe.reachable) return 0;
  let score = 20;
  if (probe.ssl) score += 12;
  if (probe.responseMs < 1200) score += 14;
  else if (probe.responseMs < 2500) score += 7;
  if (probe.hasViewport) score += 14;
  if (probe.hasTitle) score += 8;
  if (probe.hasMetaDescription) score += 8;
  if (probe.h1Count > 0) score += 8;
  if (probe.hasForm) score += 8;
  if (probe.imageCount > 0 && probe.imagesMissingAlt / probe.imageCount < 0.4) score += 8;
  return Math.min(score, 100);
}


type PlacesResponse = {
  places?: Array<{
    id?: string;
    displayName?: { text?: string };
    formattedAddress?: string;
    nationalPhoneNumber?: string;
    internationalPhoneNumber?: string;
    websiteUri?: string;
    rating?: number;
    userRatingCount?: number;
    primaryTypeDisplayName?: { text?: string };
  }>;
};

const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.nationalPhoneNumber",
  "places.internationalPhoneNumber",
  "places.websiteUri",
  "places.rating",
  "places.userRatingCount",
  "places.primaryTypeDisplayName",
].join(",");

/**
 * Searches Google Places for businesses and imports new ones into the leads table.
 * Duplicates are skipped via unique indexes on (user, place_id) and (user, name, city).
 */
export const findLeads = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => SearchInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { readLeadQuota } = await import("@/server/quota.server");
    const quota = await readLeadQuota(supabase, userId);
    if (quota.remaining <= 0) {
      throw new UpstreamError(
        429,
        `You have used your monthly limit of ${quota.quota} leads. It resets on the 1st of next month.`,
      );
    }
    const maxLeads = Math.min(data.maxLeads, quota.remaining);

    const selectedCode = data.countryCode ? data.countryCode.toUpperCase() : "";
    const countryLabel = data.country || (selectedCode ? countryName(selectedCode) : "");
    const locationParts = [data.city, countryLabel].filter(Boolean).join(", ");
    const textQuery = [
      data.businessType,
      data.industry && data.industry.toLowerCase() !== data.businessType.toLowerCase()
        ? data.industry
        : "",
      data.keyword,
      locationParts ? `in ${locationParts}` : "",
    ]
      .filter(Boolean)
      .join(" ")
      .trim();


    const body: Record<string, unknown> = {
      textQuery,
      maxResultCount: Math.min(maxLeads, 20),
      includePureServiceAreaBusinesses: true,
    };

    // The selected country drives the region so results are never anchored to
    // the caller's own location.
    if (selectedCode.length === 2) body.regionCode = selectedCode;

    // Apply a radius only around a specific city. A country-only radius would
    // incorrectly restrict international searches to the country's centroid.
    if (data.city) {
      try {
        const componentFilter = selectedCode ? `&components=country:${selectedCode}` : "";
        const geo = (await callGoogle({
          connector: "google_maps",
          path: `/maps/api/geocode/json?address=${encodeURIComponent(locationParts)}${componentFilter}`,
        })) as {
          results?: Array<{
            geometry?: { location?: { lat: number; lng: number } };
            address_components?: Array<{ short_name?: string; types?: string[] }>;
          }>;
        };
        const firstResult = geo.results?.[0];
        const loc = firstResult?.geometry?.location;
        if (loc) {
          body.locationBias = {
            circle: {
              center: { latitude: loc.lat, longitude: loc.lng },
              radius: Math.min(data.radiusKm * 1000, 50000),
            },
          };
        }
        const resolvedCode = firstResult?.address_components?.find((part) =>
          part.types?.includes("country"),
        )?.short_name;
        if (!body.regionCode && resolvedCode?.length === 2) {
          body.regionCode = resolvedCode.toUpperCase();
        }
      } catch (error) {
        console.warn("[find-leads] geocode fallback", error);
      }
    }


    const collected: NonNullable<PlacesResponse["places"]> = [];
    let pageToken: string | undefined;
    let pages = 0;
    // Fetch extra pages when filtering to websiteless businesses, since most results have sites.
    const targetRaw = data.onlyWithoutWebsite ? maxLeads * 6 : maxLeads;
    const maxPages = data.onlyWithoutWebsite ? 10 : 5;

    while (collected.length < targetRaw && pages < maxPages) {
      const payload = (await callGoogle({
        connector: "google_maps",
        path: "/places/v1/places:searchText",
        method: "POST",
        headers: { "X-Goog-FieldMask": `${FIELD_MASK},nextPageToken` },
        body: pageToken ? { ...body, pageToken } : body,
      })) as PlacesResponse & { nextPageToken?: string };

      pages += 1;
      const batch = payload.places ?? [];
      collected.push(...batch);
      pageToken = payload.nextPageToken;
      if (!pageToken || batch.length === 0) break;
    }

    if (collected.length === 0) {
      return { imported: 0, duplicates: 0, found: 0, quotaRemaining: quota.remaining };
    }

    const seen = new Set<string>();
    const selected = collected
      .filter((place) => (data.onlyWithoutWebsite ? !place.websiteUri : true))
      .filter((place) => {
        const key = place.id ?? "";
        if (!key) return true;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, maxLeads);

    // Best-effort: scrape a public contact email from each business website (batched).
    const { discoverEmail } = await import("@/lib/website-probe.server");
    const emails = new Map<string, string>();
    const withSites = selected.filter((p) => p.websiteUri).slice(0, 30);
    for (let i = 0; i < withSites.length; i += 6) {
      const batch = withSites.slice(i, i + 6);
      const results = await Promise.all(
        batch.map(async (place) => {
          try {
            const website = place.websiteUri;
            return [place.id ?? "", website ? await discoverEmail(website) : null] as const;
          } catch {
            return [place.id ?? "", null] as const;
          }
        }),
      );
      results.forEach(([id, email]) => {
        if (id && email) emails.set(id, email);
      });
    }

    const rows = selected.map((place) => ({
      user_id: userId,
      place_id: place.id ?? null,
      business_name: place.displayName?.text ?? "Unknown business",
      business_category: place.primaryTypeDisplayName?.text ?? data.businessType,
      website: place.websiteUri ?? null,
      email: (place.id ? emails.get(place.id) : null) ?? null,
      phone: place.nationalPhoneNumber ?? place.internationalPhoneNumber ?? null,
      address: place.formattedAddress ?? null,
      city: data.city || null,
      country: countryLabel || null,
      google_rating: place.rating ?? null,
      review_count: place.userRatingCount ?? 0,
      website_status: place.websiteUri ? "unchecked" : "missing",
    }));

    if (rows.length === 0) {
      return {
        imported: 0,
        duplicates: 0,
        found: collected.length,
        quotaRemaining: quota.remaining,
      };
    }

    const { data: inserted, error } = await supabase
      .from("leads")
      .upsert(rows, { onConflict: "user_id,place_id", ignoreDuplicates: true })
      .select("id");

    if (error) {
      // Unique collisions surface here; treat them as duplicates, not failures.
      if (error.code !== "23505") {
        console.error("[find-leads] insert", error);
        throw new UpstreamError(500, `Could not save the leads that were found: ${error.message}`);
      }
    }

    const imported = inserted?.length ?? 0;
    return {
      found: collected.length,
      imported,
      duplicates: Math.max(rows.length - imported, 0),
      quotaRemaining: Math.max(quota.remaining - imported, 0),
    };
  });
