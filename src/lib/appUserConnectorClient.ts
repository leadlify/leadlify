/** Browser-safe popup helper for App User Connector OAuth. */

export function openConnectorPopup(): Window {
  const popup = window.open("", "lovable-oauth", "width=600,height=720");
  if (!popup) throw new Error("Popup blocked. Allow popups for this site and try again.");
  return popup;
}

export function waitForOAuthCompletion(popup: Window, connectorId: string) {
  return new Promise<void>((resolve, reject) => {
    // eslint-disable-next-line prefer-const
    let poll: number | undefined;
    let timeout: number | undefined;

    const cleanup = () => {
      window.removeEventListener("message", onMessage);
      window.removeEventListener("storage", onStorage);
      if (poll !== undefined) window.clearInterval(poll);
      if (timeout !== undefined) window.clearTimeout(timeout);
    };
    const finish = (payload: { type?: string; connectorId?: string; error?: string }) => {
      if (payload.connectorId !== connectorId) return;
      if (payload.type !== "appUserConnectorOAuthComplete" && payload.type !== "appUserConnectorOAuthFailed") return;
      cleanup();
      if (payload.type === "appUserConnectorOAuthComplete") resolve();
      else reject(new Error(payload.error || "Gmail connection failed."));
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key !== "leadlify:gmail-oauth" || !event.newValue) return;
      try {
        finish(JSON.parse(event.newValue) as { type?: string; connectorId?: string; error?: string });
      } catch {
        return;
      }
    };
    const onMessage = (event: MessageEvent) => {
      const payload = event.data as { type?: string; connectorId?: string; error?: string };
      const type = payload?.type;
      if (
        event.origin !== window.location.origin ||
        event.source !== popup ||
        payload?.connectorId !== connectorId ||
        (type !== "appUserConnectorOAuthComplete" && type !== "appUserConnectorOAuthFailed")
      ) {
        return;
      }
      finish(payload);
    };
    window.addEventListener("message", onMessage);
    window.addEventListener("storage", onStorage);
    poll = window.setInterval(() => {
      if (!popup.closed) return;
      cleanup();
      reject(new Error("The window was closed before the connection finished."));
    }, 500);
    timeout = window.setTimeout(() => {
      cleanup();
      popup.close();
      reject(new Error("Google did not finish authorisation within 5 minutes. Please try again."));
    }, 300_000);
  });
}
