import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { completeGmailConnect } from "@/lib/gmail-connect.functions";

export const Route = createFileRoute("/oauth/gmail/return")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Connecting Gmail — LeadForge" },
      { name: "description", content: "Finishing your Gmail connection for LeadForge." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Connecting Gmail — LeadForge" },
      { property: "og:description", content: "Finishing your Gmail connection for LeadForge." },
    ],
  }),
  component: GmailOAuthReturn,
});

function GmailOAuthReturn() {
  const [message, setMessage] = useState("Finishing your Gmail connection…");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const notify = (type: "appUserConnectorOAuthComplete" | "appUserConnectorOAuthFailed") => {
      window.opener?.postMessage({ type, connectorId: "google_mail" }, window.location.origin);
      window.close();
    };

    if (params.get("success") !== "true") {
      setMessage(params.get("error") ?? "Gmail authorisation did not complete.");
      notify("appUserConnectorOAuthFailed");
      return;
    }

    const code = params.get("code");
    if (!code) {
      if (params.get("offline_access_allowed") === "false") {
        notify("appUserConnectorOAuthComplete");
        return;
      }
      setMessage("Gmail authorisation completed without an exchange code.");
      notify("appUserConnectorOAuthFailed");
      return;
    }

    void completeGmailConnect({ data: { code } })
      .then(() => notify("appUserConnectorOAuthComplete"))
      .catch(() => {
        setMessage("Could not finish the Gmail connection.");
        notify("appUserConnectorOAuthFailed");
      });
  }, []);

  return (
    <main className="bg-background text-muted-foreground grid min-h-screen place-items-center p-6 text-sm">
      <p>{message}</p>
    </main>
  );
}
