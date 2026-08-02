import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

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
  readGmailOAuthDiagnostic,
  recordGmailOAuthDiagnostic,
  saveConnectionKeyForUser,
  setAccountLabel,
} from "@/server/appUserConnections.server";

/** Starts the per-user Gmail OAuth consent and returns the provider URL for a popup. */
export const startGmailConnect = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ fresh: z.boolean().optional(), returnUrl: z.string().url() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await recordGmailOAuthDiagnostic(context.userId, "starting_authorization");
    const clientAPIKey = process.env.GOOGLE_MAIL_APP_USER_CONNECTOR_CLIENT_API_KEY;
    if (!clientAPIKey) {
      await recordGmailOAuthDiagnostic(
        context.userId,
        "configuration_error",
        "Gmail connector client is not configured for this project.",
      );
      throw new Error("Gmail connector client is not configured for this project.");
    }

    const returnUrl = new URL(data.returnUrl);
    if (returnUrl.pathname !== "/oauth/gmail/return") {
      throw new Error("Invalid Gmail OAuth return URL.");
    }

    if (data.fresh) {
      await removeConnectionForUser(context.userId, GMAIL_CONNECTOR_ID);
    }
    const existing = data.fresh
      ? null
      : await getConnectionKeyForUser(context.userId, GMAIL_CONNECTOR_ID);

    let authorizationUrl: string;
    try {
      ({ authorizationUrl } = await authorizeAppUserOAuth({
        gatewayBaseUrl: GATEWAY_BASE_URL,
        connectorId: GMAIL_CONNECTOR_ID,
        appUserId: context.userId,
        clientAPIKey,
        returnUrl: returnUrl.toString(),
        connectionAPIKey: existing ?? undefined,
        credentialsConfiguration: {
          scopes: GMAIL_SCOPES,
          access_type: "offline",
          prompt: "consent",
        },
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gmail OAuth could not start.";
      await recordGmailOAuthDiagnostic(context.userId, "authorization_start_failed", message);
      console.error("[gmail-connect] OAuth start failed", message);
      throw new Error(message);
    }

    await recordGmailOAuthDiagnostic(context.userId, "waiting_for_google_consent");
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
    try {
      await recordGmailOAuthDiagnostic(context.userId, "exchanging_oauth_code");
      const { connectionAPIKey, connectorId } = await exchangeAppUserOAuthCode(
        GATEWAY_BASE_URL,
        data.code,
      );
      if (connectorId !== GMAIL_CONNECTOR_ID) {
        throw new Error("OAuth completion returned the wrong connector.");
      }
      await saveConnectionKeyForUser(context.userId, connectorId, connectionAPIKey);
      await recordGmailOAuthDiagnostic(context.userId, "verifying_gmail_account");
      const profile = (await callUserGmail(context.userId, "/gmail/v1/users/me/profile")) as {
        emailAddress?: string;
      };
      if (profile.emailAddress) {
        await setAccountLabel(context.userId, connectorId, profile.emailAddress);
      }
      await recordGmailOAuthDiagnostic(context.userId, "connected");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not complete Gmail OAuth.";
      await recordGmailOAuthDiagnostic(context.userId, "oauth_completion_failed", message);
      throw new Error(message);
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

export const recordGmailOAuthError = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ error: z.string().trim().min(1).max(4000) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await recordGmailOAuthDiagnostic(context.userId, "google_consent_failed", data.error);
    return { ok: true as const };
  });

export const getGmailOAuthDiagnostics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => readGmailOAuthDiagnostic(context.userId));
