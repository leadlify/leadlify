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
