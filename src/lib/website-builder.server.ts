/** Server-only demo website generation. Never import from client code. */
import { callAI, UpstreamError } from "@/lib/ai.server";

export const WHATSAPP_NUMBER = "03701480852";
export const WHATSAPP_INTL = "923701480852";

const SYSTEM = `You are an elite web designer. You output ONE complete, production-quality HTML document
for a small-business demo website. Requirements:
- Single self-contained file: <!DOCTYPE html>, <html>, <head>, <body>. Use Tailwind via
  <script src="https://cdn.tailwindcss.com"></script> and Google Fonts via <link>.
- Modern, premium visual design: bold hero with gradient or image overlay, sticky header with anchor nav,
  services/features grid, about section, gallery or testimonials, FAQ, contact section with address,
  phone and a WhatsApp button, and a footer.
- Fully responsive, accessible (alt text, semantic landmarks, one <h1>), and fast.
- Use the real business details supplied. Never invent fake awards, fake reviews with real names, or fake prices.
- Use https://images.unsplash.com/... photos relevant to the business category (with ?auto=format&fit=crop&w=1600&q=80).
- Include subtle CSS transitions/hover states. No lorem ipsum. No placeholder text like "your text here".
Return ONLY the raw HTML. No markdown fences, no commentary.`;

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
    temperature: 0.8,
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
