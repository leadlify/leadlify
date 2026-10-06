/** Gmail OAuth, token storage and API helpers. Server-only. */
import { createCipheriv, createDecipheriv, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.readonly",
  "openid",
  "email",
];

function secretKey(): Buffer {
  const raw = process.env.APP_USER_CONNECTION_KEY_SECRET;
  if (!raw) throw new Error("APP_USER_CONNECTION_KEY_SECRET is not set");
  const buf = Buffer.from(raw, "base64");
  return buf.length === 32 ? buf : createHmac("sha256", raw).update("gmail-key").digest();
}

export function encrypt(plain: string): string {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", secretKey(), iv);
  const ct = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), ct]).toString("base64");
}

export function decrypt(stored: string): string {
  const buf = Buffer.from(stored, "base64");
  const d = createDecipheriv("aes-256-gcm", secretKey(), buf.subarray(0, 12));
  d.setAuthTag(buf.subarray(12, 28));
  return Buffer.concat([d.update(buf.subarray(28)), d.final()]).toString("utf8");
}

/** Signed OAuth state: userId.timestamp.signature (valid 15 minutes). */
export function signState(userId: string): string {
  const payload = `${userId}.${Date.now()}`;
  const sig = createHmac("sha256", secretKey()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyState(state: string): string | null {
  const [userId, ts, sig] = state.split(".");
  if (!userId || !ts || !sig) return null;
  const expected = createHmac("sha256", secretKey()).update(`${userId}.${ts}`).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  if (Date.now() - Number(ts) > 15 * 60 * 1000) return null;
  return userId;
}

export function redirectUri(origin: string): string {
  return `${origin}/api/public/gmail/callback`;
}

function clientCreds() {
  const id = process.env.GOOGLE_CLIENT_ID;
  const secret = process.env.GOOGLE_CLIENT_SECRET;
  if (!id || !secret) throw new Error("Google OAuth credentials are not configured.");
  return { id, secret };
}

export function buildAuthUrl(origin: string, userId: string): string {
  const { id } = clientCreds();
  const p = new URLSearchParams({
    client_id: id,
    redirect_uri: redirectUri(origin),
    response_type: "code",
    scope: GMAIL_SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state: signState(userId),
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${p}`;
}

export async function exchangeCode(origin: string, code: string) {
  const { id, secret } = clientCreds();
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: id,
      client_secret: secret,
      redirect_uri: redirectUri(origin),
      grant_type: "authorization_code",
    }),
  });
  const json = (await res.json()) as {
    access_token?: string;
    refresh_token?: string;
    scope?: string;
    error?: string;
    error_description?: string;
  };
  if (!res.ok || !json.access_token) {
    throw new Error(json.error_description || json.error || `Token exchange failed (${res.status})`);
  }
  return json;
}

export async function accessTokenFor(userId: string): Promise<{ token: string; email: string | null }> {
  const { data: acct } = await supabaseAdmin
    .from("gmail_accounts")
    .select("refresh_token_ciphertext, email")
    .eq("user_id", userId)
    .maybeSingle();
  if (!acct) throw new Error("Gmail is not connected. Connect it in Settings.");
  const { id, secret } = clientCreds();
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: id,
      client_secret: secret,
      refresh_token: decrypt(acct.refresh_token_ciphertext),
      grant_type: "refresh_token",
    }),
  });
  const json = (await res.json()) as { access_token?: string; error?: string; error_description?: string };
  if (!res.ok || !json.access_token) {
    const msg = json.error === "invalid_grant"
      ? "Gmail access was revoked or expired. Reconnect Gmail in Settings."
      : json.error_description || json.error || "Could not refresh Gmail access.";
    await supabaseAdmin.from("gmail_accounts").update({ last_error: msg }).eq("user_id", userId);
    throw new Error(msg);
  }
  return { token: json.access_token, email: acct.email };
}

export async function gmailFetch<T>(token: string, path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) throw new Error(`Gmail request failed [${res.status}]: ${await res.text()}`);
  return (await res.json()) as T;
}

const b64 = (s: string) => Buffer.from(s, "utf8").toString("base64");
const hdr = (v: string) => (/^[\x00-\x7F]*$/.test(v) ? v : `=?UTF-8?B?${b64(v)}?=`);

export function rawEmail(opts: { from: string; fromName?: string; to: string; subject: string; body: string }) {
  const from = opts.fromName ? `${hdr(opts.fromName)} <${opts.from}>` : opts.from;
  const msg = [
    `From: ${from}`,
    `To: ${opts.to}`,
    `Subject: ${hdr(opts.subject)}`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    b64(opts.body),
  ].join("\r\n");
  return Buffer.from(msg, "utf8").toString("base64url");
}

type ThreadMsg = {
  id: string;
  threadId: string;
  snippet?: string;
  internalDate?: string;
  payload?: { headers?: { name: string; value: string }[] };
};

/** Checks the user's sent threads for new inbound replies. Returns number of new replies. */
export async function syncRepliesForUser(userId: string): Promise<number> {
  const { token, email } = await accessTokenFor(userId);
  const own = (email ?? "").toLowerCase();
  const since = new Date(Date.now() - 45 * 24 * 3600 * 1000).toISOString();
  const { data: sent } = await supabaseAdmin
    .from("email_history")
    .select("id, lead_id, gmail_thread_id, gmail_message_id")
    .eq("user_id", userId)
    .not("gmail_thread_id", "is", null)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(50);

  let added = 0;
  for (const row of sent ?? []) {
    const thread = await gmailFetch<{ messages?: ThreadMsg[] }>(
      token,
      `/threads/${row.gmail_thread_id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject`,
    ).catch(() => null);
    for (const m of thread?.messages ?? []) {
      if (m.id === row.gmail_message_id) continue;
      const h = (n: string) => m.payload?.headers?.find((x) => x.name.toLowerCase() === n)?.value ?? "";
      const from = h("from");
      if (own && from.toLowerCase().includes(own)) continue;
      const { data: ins } = await supabaseAdmin
        .from("email_replies")
        .upsert(
          {
            user_id: userId,
            lead_id: row.lead_id,
            email_history_id: row.id,
            gmail_message_id: m.id,
            gmail_thread_id: m.threadId,
            from_email: from.slice(0, 300),
            subject: h("subject").slice(0, 300),
            snippet: (m.snippet ?? "").slice(0, 1000),
            received_at: m.internalDate ? new Date(Number(m.internalDate)).toISOString() : undefined,
          },
          { onConflict: "user_id,gmail_message_id", ignoreDuplicates: true },
        )
        .select("id");
      if (ins && ins.length) {
        added++;
        await supabaseAdmin
          .from("email_history")
          .update({ replied: true, replied_at: new Date().toISOString() })
          .eq("id", row.id);
        if (row.lead_id) {
          await supabaseAdmin.from("leads").update({ status: "replied" }).eq("id", row.lead_id);
        }
      }
    }
  }
  await supabaseAdmin
    .from("gmail_accounts")
    .update({ last_checked_at: new Date().toISOString(), last_error: null })
    .eq("user_id", userId);
  return added;
}
