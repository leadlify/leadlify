/**
 * Per-user Gmail connection storage + gateway calls. Server-only.
 */
import { callAsAppUser, disconnectAppUser } from "@/integrations/lovable/appUserConnector";
import { decryptConnectionKey, encryptConnectionKey } from "@/server/connectionKeyCrypto";

export const GATEWAY_BASE_URL = "https://connector-gateway.lovable.dev";
export const GMAIL_CONNECTOR_ID = "google_mail";

export const GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.compose",
  "https://www.googleapis.com/auth/gmail.modify",
];

export type GmailOAuthDiagnostic = {
  lastStep: string;
  requestedScopes: string[];
  lastError: string | null;
  lastAttemptAt: string | null;
};

export async function recordGmailOAuthDiagnostic(
  userId: string,
  lastStep: string,
  lastError: string | null = null,
) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin.from("gmail_oauth_diagnostics").upsert(
    {
      user_id: userId,
      connector_id: GMAIL_CONNECTOR_ID,
      last_step: lastStep,
      requested_scopes: GMAIL_SCOPES,
      last_error: lastError,
      last_attempt_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) console.error("[gmail-oauth] could not save diagnostics", error.message);
}

export async function readGmailOAuthDiagnostic(userId: string): Promise<GmailOAuthDiagnostic> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("gmail_oauth_diagnostics")
    .select("last_step, requested_scopes, last_error, last_attempt_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return {
    lastStep: data?.last_step ?? "not_started",
    requestedScopes: Array.isArray(data?.requested_scopes)
      ? data.requested_scopes.filter((scope): scope is string => typeof scope === "string")
      : GMAIL_SCOPES,
    lastError: data?.last_error ?? null,
    lastAttemptAt: data?.last_attempt_at ?? null,
  };
}

export async function saveConnectionKeyForUser(
  userId: string,
  connectorId: string,
  connectionAPIKey: string,
  accountLabel?: string | null,
) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin.from("app_user_connections").upsert(
    {
      user_id: userId,
      connector_id: connectorId,
      account_label: accountLabel ?? null,
      connection_key_ciphertext: encryptConnectionKey(connectionAPIKey),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,connector_id" },
  );
  if (error) throw error;
}

export async function getConnectionKeyForUser(
  userId: string,
  connectorId: string,
): Promise<string | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("app_user_connections")
    .select("connection_key_ciphertext")
    .eq("user_id", userId)
    .eq("connector_id", connectorId)
    .maybeSingle();
  if (error) throw error;
  return data ? decryptConnectionKey(data.connection_key_ciphertext) : null;
}

export async function setAccountLabel(userId: string, connectorId: string, label: string | null) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin
    .from("app_user_connections")
    .update({ account_label: label })
    .eq("user_id", userId)
    .eq("connector_id", connectorId);
}

export async function removeConnectionForUser(userId: string, connectorId: string) {
  const stored = await getConnectionKeyForUser(userId, connectorId);
  if (stored) {
    try {
      await disconnectAppUser({
        gatewayBaseUrl: GATEWAY_BASE_URL,
        connectionAPIKey: stored,
        connectorId,
      });
    } catch (error) {
      console.warn("[app-user-connector] gateway disconnect failed", error);
    }
  }
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin
    .from("app_user_connections")
    .delete()
    .eq("user_id", userId)
    .eq("connector_id", connectorId);
}

export class GmailNotConnectedError extends Error {
  status = 428;
  constructor() {
    super("Connect your Gmail account in Settings before sending or syncing emails.");
  }
}

/** Calls the Gmail API as the signed-in app user. */
export async function callUserGmail(
  userId: string,
  path: string,
  init?: { method?: string; body?: unknown },
): Promise<unknown> {
  const connectionAPIKey = await getConnectionKeyForUser(userId, GMAIL_CONNECTOR_ID);
  if (!connectionAPIKey) throw new GmailNotConnectedError();

  const res = await callAsAppUser({
    gatewayBaseUrl: GATEWAY_BASE_URL,
    connectionAPIKey,
    connectorId: GMAIL_CONNECTOR_ID,
    path,
    init: {
      method: init?.method ?? "GET",
      ...(init?.body
        ? { body: JSON.stringify(init.body), headers: { "Content-Type": "application/json" } }
        : {}),
    },
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`[gmail:user] ${res.status}: ${body}`);
    throw new Error(`Gmail request failed (${res.status}): ${body.slice(0, 300)}`);
  }
  return res.json();
}
