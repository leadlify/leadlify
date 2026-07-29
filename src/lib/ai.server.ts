/**
 * Server-only helpers for Lovable AI Gateway (Gemini) and the Google connector gateway.
 * Never import this file from client code.
 */

const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
export const CONNECTOR_GATEWAY = "https://connector-gateway.lovable.dev";

export const AI_MODEL = "google/gemini-3-flash-preview";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing server configuration: ${name}. Reconnect the integration in project settings.`,
    );
  }
  return value;
}

export class UpstreamError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/** Calls Gemini through the Lovable AI Gateway and returns raw assistant text. */
export async function callAI(opts: {
  system: string;
  user: string;
  json?: boolean;
  temperature?: number;
}): Promise<string> {
  const key = requireEnv("LOVABLE_API_KEY");

  const response = await fetch(AI_GATEWAY, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": key,
    },
    body: JSON.stringify({
      model: AI_MODEL,
      temperature: opts.temperature ?? 0.7,
      ...(opts.json ? { response_format: { type: "json_object" } } : {}),
      messages: [
        { role: "system", content: opts.system },
        { role: "user", content: opts.user },
      ],
    }),
  });

  if (response.status === 429) {
    throw new UpstreamError(429, "AI rate limit reached. Please wait a moment and try again.");
  }
  if (response.status === 402) {
    throw new UpstreamError(402, "AI credits exhausted. Add credits in your Lovable workspace.");
  }
  if (!response.ok) {
    const body = await response.text();
    console.error(`[ai] gateway ${response.status}: ${body}`);
    throw new UpstreamError(response.status, `AI request failed (${response.status}).`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = payload.choices?.[0]?.message?.content?.trim();
  if (!text) throw new UpstreamError(502, "The AI returned an empty response.");
  return text;
}

/** Parses a JSON object out of an AI response, tolerating code fences. */
export function parseAIJson<T>(text: string): T {
  const cleaned = text
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  const slice = start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned;
  try {
    return JSON.parse(slice) as T;
  } catch {
    throw new UpstreamError(502, "The AI returned a malformed response. Try again.");
  }
}

function googleHeaders(connector: "google_maps" | "google_mail", extra?: Record<string, string>) {
  const envName = connector === "google_maps" ? "GOOGLE_MAPS_API_KEY" : "GOOGLE_MAIL_API_KEY";
  return {
    Authorization: `Bearer ${requireEnv("LOVABLE_API_KEY")}`,
    "X-Connection-Api-Key": requireEnv(envName),
    ...extra,
  };
}

/** Calls a Google connector through the Lovable connector gateway. */
export async function callGoogle(opts: {
  connector: "google_maps" | "google_mail";
  path: string;
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
}): Promise<unknown> {
  const response = await fetch(`${CONNECTOR_GATEWAY}/${opts.connector}${opts.path}`, {
    method: opts.method ?? "GET",
    headers: googleHeaders(opts.connector, {
      ...(opts.body ? { "Content-Type": "application/json" } : {}),
      ...opts.headers,
    }),
    ...(opts.body ? { body: JSON.stringify(opts.body) } : {}),
  });

  if (response.status === 403) {
    const details =
      (
        (await response.json().catch(() => null)) as {
          error?: { details?: Array<{ reason?: string }> };
        } | null
      )?.error?.details ?? [];
    const reason = details.find((d) => d.reason)?.reason;
    if (reason === "API_KEY_HTTP_REFERRER_BLOCKED") {
      throw new UpstreamError(
        403,
        'Your Google server key is referrer-restricted. In Google Cloud Console set its application restrictions to "None" or "IP addresses".',
      );
    }
    if (reason === "API_KEY_SERVICE_BLOCKED") {
      throw new UpstreamError(
        403,
        "Your Google key does not allow this API. Add it to the key's allowed-APIs list in Google Cloud Console.",
      );
    }
    throw new UpstreamError(403, "Google denied the request (403). Check your key restrictions.");
  }

  if (!response.ok) {
    const body = await response.text();
    console.error(`[google:${opts.connector}] ${response.status}: ${body}`);
    if (response.status === 429) {
      throw new UpstreamError(429, "Google API quota reached. Try again shortly.");
    }
    throw new UpstreamError(response.status, `Google request failed (${response.status}).`);
  }

  return response.json();
}
