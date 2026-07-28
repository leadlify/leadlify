/** Browser-safe popup helper for App User Connector OAuth. */

export function openConnectorPopup(): Window {
  const popup = window.open("", "lovable-oauth", "width=600,height=720");
  if (!popup) throw new Error("Popup blocked. Allow popups for this site and try again.");
  return popup;
}

export function waitForOAuthCompletion(popup: Window, connectorId: string) {
  return new Promise<void>((resolve, reject) => {
    let poll: number | undefined;
    const cleanup = () => {
      window.removeEventListener("message", onMessage);
      if (poll !== undefined) window.clearInterval(poll);
    };
    const onMessage = (event: MessageEvent) => {
      const type = (event.data as { type?: string; connectorId?: string })?.type;
      if (
        event.origin !== window.location.origin ||
        event.source !== popup ||
        (event.data as { connectorId?: string })?.connectorId !== connectorId ||
        (type !== "appUserConnectorOAuthComplete" && type !== "appUserConnectorOAuthFailed")
      ) {
        return;
      }
      cleanup();
      if (type === "appUserConnectorOAuthComplete") {
        resolve();
        return;
      }
      popup.close();
      reject(new Error("Gmail connection failed."));
    };
    window.addEventListener("message", onMessage);
    poll = window.setInterval(() => {
      if (!popup.closed) return;
      cleanup();
      reject(new Error("The window was closed before the connection finished."));
    }, 500);
  });
}
