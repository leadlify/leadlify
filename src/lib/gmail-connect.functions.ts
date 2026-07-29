import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

import {
  authorizeAppUserOAuth,
  exchangeAppUserOAuthCode,
} from "@/integrations/lovable/appUserConnector";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  GATEWAY_BASE_URL,
  GMAIL_CONNECTOR_ID,
  GMAIL_SCOPES,
  callUserGmail,
  getConnectionKeyForUser,
  removeConnectionForUser,
  saveConnectionKeyForUser,
  setAccountLabel,
} from "@/server/appUserConnections.server";

/** Starts the per-user Gmail OAuth consent and returns the provider URL for a popup. */
export const startGmailConnect = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const clientAPIKey = process.env.GOOGLE_MAIL_APP_USER_CONNECTOR_CLIENT_API_KEY;
    if (!clientAPIKey) {
      throw new Error("Gmail connector client is not configured for this project.");
    }

    const request = getRequest();
    if (!request) throw new Error("OAuth must start from an app request.");
    const returnUrl = new URL("/oauth/gmail/return", request.url).toString();

    const existing = await getConnectionKeyForUser(context.userId, GMAIL_CONNECTOR_ID);

    const { authorizationUrl } = await authorizeAppUserOAuth({
      gatewayBaseUrl: GATEWAY_BASE_URL,
      connectorId: GMAIL_CONNECTOR_ID,
      appUserId: context.userId,
      clientAPIKey,
      returnUrl,
      connectionAPIKey: existing ?? undefined,
      credentialsConfiguration: { scopes: GMAIL_SCOPES },
    });

    return { authorizationUrl };
  });

/** Exchanges the one-time OAuth code and stores the user's Gmail connection key. */
export const completeGmailConnect = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { code: string }) => {
    if (!input?.code) throw new Error("Missing OAuth code.");
    return { code: input.code };
  })
  .handler(async ({ data, context }) => {
    const { connectionAPIKey, connectorId } = await exchangeAppUserOAuthCode(
      GATEWAY_BASE_URL,
      data.code,
    );
    if (connectorId !== GMAIL_CONNECTOR_ID) {
      throw new Error("OAuth completion returned the wrong connector.");
    }
    await saveConnectionKeyForUser(context.userId, connectorId, connectionAPIKey);

    try {
      const profile = (await callUserGmail(context.userId, "/gmail/v1/users/me/profile")) as {
        emailAddress?: string;
      };
      if (profile.emailAddress) {
        await setAccountLabel(context.userId, connectorId, profile.emailAddress);
      }
    } catch (error) {
      console.warn("[gmail] profile lookup after connect failed", error);
    }

    return { ok: true as const };
  });

/** Removes the user's Gmail connection. */
export const disconnectGmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await removeConnectionForUser(context.userId, GMAIL_CONNECTOR_ID);
    return { ok: true as const };
  });
