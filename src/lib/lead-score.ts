// Lead score 0-100: higher means more likely to buy web design.
const HIGH_CONVERSION = [
  "dentist", "dental", "restaurant", "salon", "spa", "barber", "clinic", "cafe",
  "gym", "beauty", "bakery", "doctor", "physio", "vet",
];

type ScoreInput = {
  website?: string | null;
  seo_score?: number | null;
  website_speed?: number | null;
  mobile_friendly?: boolean | null;
  google_rating?: number | null;
  review_count?: number | null;
  business_category?: string | null;
};

export function leadScore(lead: ScoreInput): number {
  let score = 0;
  if (!lead.website) score += 30;
  else if (
    (lead.seo_score != null && lead.seo_score < 50) ||
    (lead.website_speed != null && lead.website_speed < 50) ||
    lead.mobile_friendly === false
  )
    score += 15;
  if ((lead.google_rating ?? 0) >= 4.5) score += 20;
  if ((lead.review_count ?? 0) >= 50) score += 15;
  const cat = (lead.business_category ?? "").toLowerCase();
  if (HIGH_CONVERSION.some((k) => cat.includes(k))) score += 20;
  return Math.min(100, score);
}

export function scoreTone(score: number): string {
  if (score >= 70) return "bg-success/15 text-success border-success/30";
  if (score >= 40) return "bg-warning/15 text-warning border-warning/30";
  return "bg-muted text-muted-foreground border-border";
}
