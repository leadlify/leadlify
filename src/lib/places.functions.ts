import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { callGoogle, UpstreamError } from "@/lib/ai.server";

const SearchInput = z.object({
  country: z.string().trim().max(80).optional().default(""),
  city: z.string().trim().max(80).optional().default(""),
  businessType: z.string().trim().min(1, "Business type is required").max(80),
  keyword: z.string().trim().max(80).optional().default(""),
  maxLeads: z.number().int().min(1).max(50).default(20),
  radiusKm: z.number().min(1).max(50).default(10),
  onlyWithoutWebsite: z.boolean().optional().default(false),
});

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

    const locationParts = [data.city, data.country].filter(Boolean).join(", ");
    const textQuery = [data.businessType, data.keyword, locationParts ? `in ${locationParts}` : ""]
      .filter(Boolean)
      .join(" ")
      .trim();

    const body: Record<string, unknown> = {
      textQuery,
      maxResultCount: Math.min(data.maxLeads, 20),
    };

    // Bias results to the requested city radius when we can resolve coordinates.
    if (locationParts) {
      try {
        const geo = (await callGoogle({
          connector: "google_maps",
          path: `/maps/api/geocode/json?address=${encodeURIComponent(locationParts)}`,
        })) as {
          results?: Array<{ geometry?: { location?: { lat: number; lng: number } } }>;
        };
        const loc = geo.results?.[0]?.geometry?.location;
        if (loc) {
          body.locationBias = {
            circle: {
              center: { latitude: loc.lat, longitude: loc.lng },
              radius: Math.min(data.radiusKm * 1000, 50000),
            },
          };
        }
      } catch (error) {
        console.warn("[find-leads] geocode fallback", error);
      }
    }

    const collected: NonNullable<PlacesResponse["places"]> = [];
    let pageToken: string | undefined;
    let pages = 0;
    // Fetch extra pages when filtering to websiteless businesses, since most results have sites.
    const targetRaw = data.onlyWithoutWebsite ? data.maxLeads * 6 : data.maxLeads;
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
      return { imported: 0, duplicates: 0, found: 0 };
    }

    const seen = new Set<string>();
    const rows = collected
      .filter((place) => (data.onlyWithoutWebsite ? !place.websiteUri : true))
      .filter((place) => {
        const key = place.id ?? "";
        if (!key) return true;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, data.maxLeads)
      .map((place) => ({
        user_id: userId,
        place_id: place.id ?? null,
        business_name: place.displayName?.text ?? "Unknown business",
        business_category: place.primaryTypeDisplayName?.text ?? data.businessType,
        website: place.websiteUri ?? null,
        phone: place.nationalPhoneNumber ?? place.internationalPhoneNumber ?? null,
        address: place.formattedAddress ?? null,
        city: data.city || null,
        country: data.country || null,
        google_rating: place.rating ?? null,
        review_count: place.userRatingCount ?? 0,
        website_status: place.websiteUri ? "unchecked" : "missing",
      }));

    if (rows.length === 0) {
      return { imported: 0, duplicates: 0, found: collected.length };
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
    };
  });
