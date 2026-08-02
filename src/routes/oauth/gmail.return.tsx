import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

import { completeGmailConnect, recordGmailOAuthError } from "@/lib/gmail-connect.functions";

export const Route = createFileRoute("/oauth/gmail/return")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Connecting Gmail — Leadlify" },
      { name: "description", content: "Finishing your Gmail connection for Leadlify." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Connecting Gmail — Leadlify" },
      { property: "og:description", content: "Finishing your Gmail connection for Leadlify." },
    ],
  }),
  component: GmailOAuthReturn,
});

function GmailOAuthReturn() {
  const [message, setMessage] = useState("Finishing your Gmail connection…");
  const hasStarted = useRef(false);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;
    const params = new URLSearchParams(window.location.search);
    const notify = (
      type: "appUserConnectorOAuthComplete" | "appUserConnectorOAuthFailed",
      error?: string,
    ) => {
      localStorage.setItem(
        "leadlify:gmail-oauth",
        JSON.stringify({ type, connectorId: "google_mail", ...(error ? { error } : {}), at: Date.now() }),
      );
      if (window.opener) {
        window.opener.postMessage(
          { type, connectorId: "google_mail", ...(error ? { error } : {}) },
          window.location.origin,
        );
        window.close();
      }
      setMessage(error ?? "Gmail connected. You can close this window and return to Leadlify.");
    };

    const oauthError = params.get("error_description") ?? params.get("error");
    if (oauthError) {
      const error = oauthError;
      setMessage(error);
      void recordGmailOAuthError({ data: { error } }).finally(() =>
        notify("appUserConnectorOAuthFailed", error),
      );
      return;
    }

    const code = params.get("code");
    if (!code) {
      setMessage("Gmail authorisation completed without an exchange code.");
      const error = "Gmail authorisation completed without an exchange code.";
      void recordGmailOAuthError({ data: { error } }).finally(() =>
        notify("appUserConnectorOAuthFailed", error),
      );
      return;
    }

    void completeGmailConnect({ data: { code } })
      .then(() => notify("appUserConnectorOAuthComplete"))
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Could not finish the Gmail connection.";
        setMessage(message);
        notify("appUserConnectorOAuthFailed", message);
      });
  }, []);

  return (
    <main className="bg-background grid min-h-screen place-items-center p-6 text-center">
      <div className="max-w-md space-y-2">
        <p className="text-foreground text-sm font-medium">Gmail authorisation</p>
        <p className="text-muted-foreground text-sm leading-relaxed">{message}</p>
      </div>
    </main>
  );
}
