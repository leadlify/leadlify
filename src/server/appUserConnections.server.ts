/**
 * Per-user Gmail connection storage + gateway calls. Server-only.
 */
import {
  callAsAppUser,
  disconnectAppUser,
} from "@/integrations/lovable/appUserConnector";
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
