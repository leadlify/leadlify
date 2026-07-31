/** Server-only demo website generation. Never import from client code. */
import { callAI, UpstreamError } from "@/lib/ai.server";

export const WHATSAPP_NUMBER = "03701480852";
export const WHATSAPP_INTL = "923701480852";

const SYSTEM = `You are a world-class digital agency creative director and senior front-end designer. Create ONE
complete, launch-ready HTML document for a small business. This is a high-stakes sales demo: it must feel bespoke,
editorial, visually rich, and substantially more polished than a template.

NON-NEGOTIABLE OUTPUT:
- Return only raw HTML beginning with <!DOCTYPE html>. Include <html>, <head>, and <body>.
- Use Tailwind via <script src="https://cdn.tailwindcss.com"></script>, Google Fonts via <link>, Lucide icons via
  its browser CDN, and a compact inline <style>/<script> for bespoke art direction and interactions.
- Produce a long, complete site with at least 9 meaningful sections: announcement/header, cinematic hero, trust
  strip, services, signature process, immersive visual showcase, business story, results/value section, testimonials
  or review-summary section, FAQ, conversion-focused contact band, and a detailed footer.

ART DIRECTION:
- Infer an appropriate visual identity from the business category and location. Use a restrained multi-color palette,
  distinctive display typography, strong hierarchy, asymmetrical editorial layouts, generous spacing, image layering,
  and carefully designed mobile composition. Avoid generic blue SaaS styling, floating gradient blobs, excessive pills,
  nested cards, and repetitive three-card grids.
- The first viewport must immediately show the real business name, literal service category, location, a strong offer,
  primary contact CTA, and a relevant full-bleed image. Leave a visible hint of the next section.
- Add polished details: sticky navigation, active/hover states, tasteful reveal-on-scroll using IntersectionObserver,
  number counters where truthful, an accessible mobile menu, FAQ accordion, smooth anchor navigation, and a persistent
  WhatsApp action. Respect prefers-reduced-motion.
- Use high-quality Unsplash source URLs relevant to the exact industry. Vary image scale and composition; never use
  blurred atmospheric filler. Every image needs useful alt text and stable dimensions/aspect ratios.

CONTENT & TRUST:
- Use every supplied real detail naturally: name, category, location, address, phone, email, rating, and review count.
- Write specific, persuasive, industry-aware copy with clear customer benefits. No lorem ipsum, placeholders, fake
  awards, fake prices, invented statistics, fabricated staff, or named customer quotes. If ratings exist, summarize
  them honestly; otherwise use benefit-led social-proof framing without pretending reviews exist.
- Include semantic landmarks, exactly one h1, visible focus states, high contrast, descriptive labels, and responsive
  behavior at mobile/tablet/desktop widths.
- Include contact links and the supplied WhatsApp number/link. The final result should be credible enough to present
  directly to the business owner without explanation.
Return ONLY the raw HTML. No markdown fences or commentary.`;

export type DemoInput = {
  businessName: string;
  category?: string | null;
  city?: string | null;
  country?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  currentWebsite?: string | null;
  audit?: unknown;
};

function stripFences(text: string): string {
  return text
    .replace(/^\s*```(?:html)?/i, "")
    .replace(/```\s*$/, "")
    .trim();
}

export async function buildDemoHtml(input: DemoInput): Promise<string> {
  const raw = await callAI({
    system: SYSTEM,
    temperature: 0.92,
    user: JSON.stringify({
      ...input,
      whatsapp_number: WHATSAPP_NUMBER,
      whatsapp_link: `https://wa.me/${WHATSAPP_INTL}`,
    }),
  });

  let html = stripFences(raw);
  const start = html.toLowerCase().indexOf("<!doctype");
  if (start > 0) html = html.slice(start);
  if (!/<html[\s>]/i.test(html)) {
    throw new UpstreamError(502, "The AI did not return a usable website. Try again.");
  }

  // Guarantee the WhatsApp CTA exists even if the model skipped it.
  if (!html.includes(WHATSAPP_NUMBER) && !html.includes(WHATSAPP_INTL)) {
    html = html.replace(
      /<\/body>/i,
      `<a href="https://wa.me/${WHATSAPP_INTL}" target="_blank" rel="noopener"
        style="position:fixed;right:20px;bottom:20px;z-index:9999;background:#25D366;color:#fff;padding:14px 20px;border-radius:9999px;font-family:system-ui,sans-serif;font-weight:600;text-decoration:none;box-shadow:0 10px 30px rgba(0,0,0,.25)">
        WhatsApp ${WHATSAPP_NUMBER}</a></body>`,
    );
  }

  return html;
}

export function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base || "demo"}-${suffix}`;
}
