/** Server-only website probing used to feed the AI audit with real signals. */

export type SiteProbe = {
  reachable: boolean;
  statusCode: number | null;
  ssl: boolean;
  responseMs: number;
  hasViewport: boolean;
  hasTitle: boolean;
  titleLength: number;
  hasMetaDescription: boolean;
  h1Count: number;
  imageCount: number;
  imagesMissingAlt: number;
  hasForm: boolean;
  hasMailto: boolean;
  hasTelLink: boolean;
  mentionsPortfolio: boolean;
  htmlBytes: number;
  scriptCount: number;
  inlineStyleCount: number;
  discoveredEmail: string | null;
  error: string | null;
  excerpt: string;
};

function count(html: string, pattern: RegExp): number {
  return (html.match(pattern) ?? []).length;
}

export async function probeWebsite(rawUrl: string): Promise<SiteProbe> {
  const base: SiteProbe = {
    reachable: false,
    statusCode: null,
    ssl: false,
    responseMs: 0,
    hasViewport: false,
    hasTitle: false,
    titleLength: 0,
    hasMetaDescription: false,
    h1Count: 0,
    imageCount: 0,
    imagesMissingAlt: 0,
    hasForm: false,
    hasMailto: false,
    hasTelLink: false,
    mentionsPortfolio: false,
    htmlBytes: 0,
    scriptCount: 0,
    inlineStyleCount: 0,
    discoveredEmail: null,
    error: null,
    excerpt: "",
  };

  let url: URL;
  try {
    url = new URL(rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`);
  } catch {
    return { ...base, error: "Invalid website URL." };
  }

  base.ssl = url.protocol === "https:";
  const started = Date.now();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const response = await fetch(url.toString(), {
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; LeadAuditBot/1.0)" },
    });
    clearTimeout(timeout);

    base.responseMs = Date.now() - started;
    base.statusCode = response.status;
    base.reachable = response.ok;
    base.ssl = new URL(response.url).protocol === "https:";

    const html = (await response.text()).slice(0, 400_000);
    base.htmlBytes = html.length;

    const title = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1]?.trim() ?? "";
    base.hasTitle = title.length > 0;
    base.titleLength = title.length;
    base.hasMetaDescription = /<meta[^>]+name=["']description["']/i.test(html);
    base.hasViewport = /<meta[^>]+name=["']viewport["']/i.test(html);
    base.h1Count = count(html, /<h1[\s>]/gi);
    base.imageCount = count(html, /<img[\s>]/gi);
    base.imagesMissingAlt = count(html, /<img(?![^>]*\balt=)[^>]*>/gi);
    base.hasForm = /<form[\s>]/i.test(html);
    base.hasMailto = /mailto:/i.test(html);
    base.hasTelLink = /href=["']tel:/i.test(html);
    base.mentionsPortfolio = /portfolio|our work|case stud|gallery/i.test(html);
    base.scriptCount = count(html, /<script[\s>]/gi);
    base.inlineStyleCount = count(html, /\sstyle=["']/gi);
    base.discoveredEmail =
      /[\w.+-]+@[\w-]+\.[\w.-]{2,}/.exec(html.replace(/mailto:/gi, ""))?.[0] ?? null;

    base.excerpt = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 2500);
  } catch (error) {
    base.responseMs = Date.now() - started;
    base.error =
      error instanceof Error && error.name === "AbortError"
        ? "The website timed out after 15 seconds."
        : "The website could not be reached.";
  }

  return base;
}

const BAD_EMAIL = /\.(png|jpe?g|gif|webp|svg|css|js)$/i;
const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]{2,}/g;

function pickEmail(html: string): string | null {
  const text = html.replace(/mailto:/gi, "");
  const matches = text.match(EMAIL_RE) ?? [];
  const clean = matches
    .map((m) => m.trim().replace(/[.,;:)]+$/, ""))
    .filter((m) => !BAD_EMAIL.test(m))
    .filter((m) => !/(sentry|example|wixpress|godaddy|@2x|domain\.com)/i.test(m));
  // Prefer role addresses that businesses actually read.
  const preferred = clean.find((m) => /^(info|contact|hello|sales|admin|office|enquir)/i.test(m));
  return preferred ?? clean[0] ?? null;
}

async function fetchHtml(url: string, timeoutMs = 8000): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; LeadAuditBot/1.0)" },
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    return (await res.text()).slice(0, 300_000);
  } catch {
    return null;
  }
}

/** Best-effort discovery of a public contact email from a business website. */
export async function discoverEmail(rawUrl: string): Promise<string | null> {
  let base: URL;
  try {
    base = new URL(rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`);
  } catch {
    return null;
  }

  const home = await fetchHtml(base.toString());
  if (home) {
    const found = pickEmail(home);
    if (found) return found;
  }

  for (const path of ["/contact", "/contact-us", "/about"]) {
    const html = await fetchHtml(new URL(path, base).toString(), 6000);
    if (!html) continue;
    const found = pickEmail(html);
    if (found) return found;
  }
  return null;
}
