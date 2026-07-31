import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, CheckCircle2, Loader2, Mail, RefreshCw, Save, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { openConnectorPopup, waitForOAuthCompletion } from "@/lib/appUserConnectorClient";
import { disconnectGmail, startGmailConnect } from "@/lib/gmail-connect.functions";
import { getGmailProfile } from "@/lib/outreach.functions";
import { errorMessage, settingsQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — LeadForge" },
      { name: "description", content: "Sender identity, email tone and Gmail connection status." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Settings — LeadForge" },
      {
        property: "og:description",
        content: "Sender identity, email tone and Gmail connection status.",
      },
    ],
  }),
  component: SettingsPage,
});

const TONES = ["professional", "friendly", "direct", "consultative"] as const;

function oauthErrorMessage(error: unknown) {
  const fallback = "Google could not authorise this Gmail account.";
  const raw = errorMessage(error, fallback);
  const jsonStart = raw.indexOf("{");
  if (jsonStart >= 0) {
    try {
      const payload = JSON.parse(raw.slice(jsonStart)) as {
        error?: string | { message?: string; description?: string };
        message?: string;
        error_description?: string;
      };
      if (typeof payload.error === "object") {
        return payload.error.message ?? payload.error.description ?? raw;
      }
      return payload.error_description ?? payload.message ?? payload.error ?? raw;
    } catch {
      return raw;
    }
  }
  return raw;
}

function SettingsPage() {
  const queryClient = useQueryClient();
  const settings = useQuery(settingsQuery);
  const profileFn = useServerFn(getGmailProfile);
  const startConnect = useServerFn(startGmailConnect);
  const disconnectFn = useServerFn(disconnectGmail);
  const gmail = useQuery({ queryKey: ["gmail-profile"], queryFn: () => profileFn({}) });
  const [oauthError, setOauthError] = useState<string | null>(null);

  const [form, setForm] = useState({
    sender_name: "",
    sender_email: "",
    signature: "",
    service_description: "",
    email_tone: "professional",
  });

  useEffect(() => {
    if (settings.data) {
      setForm({
        sender_name: settings.data.sender_name ?? "",
        sender_email: settings.data.sender_email ?? "",
        signature: settings.data.signature ?? "",
        service_description: settings.data.service_description ?? "",
        email_tone: settings.data.email_tone ?? "professional",
      });
    }
  }, [settings.data]);

  const save = useMutation({
    mutationFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Your session expired — sign in again.");
      const { error } = await supabase
        .from("settings")
        .upsert({ ...form, user_id: auth.user.id }, { onConflict: "user_id" });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Settings saved");
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const connect = useMutation({
    mutationFn: async () => {
      setOauthError(null);
      const popup = openConnectorPopup();
      try {
        const { authorizationUrl } = await startConnect({});
        const completion = waitForOAuthCompletion(popup, "google_mail");
        popup.location.href = authorizationUrl;
        await completion;
      } catch (error) {
        popup.close();
        throw error;
      }
    },
    onSuccess: async () => {
      const result = await queryClient.fetchQuery({
        queryKey: ["gmail-profile"],
        queryFn: () => profileFn({}),
      });
      if (!result.connected) {
        throw new Error(result.reason || "Google consent finished, but Gmail could not be verified.");
      }
      setOauthError(null);
      toast.success("Gmail connected — your emails will now send from your own account.");
    },
    onError: (error) => {
      const message = oauthErrorMessage(error);
      setOauthError(message);
      toast.error("Gmail authorisation failed", { description: message });
    },
  });

  const disconnect = useMutation({
    mutationFn: () => disconnectFn({}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gmail-profile"] });
      toast.success("Gmail disconnected.");
    },
    onError: (error) => toast.error(errorMessage(error, "Could not disconnect Gmail.")),
  });

  return (
    <AppShell title="Settings" description="How your outreach emails are written and signed">
      <div className="grid max-w-3xl gap-6">
        <Card className="shadow-card border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Mail className="text-primary size-4" />
              Gmail connection
            </CardTitle>
            <CardDescription>Emails are sent from this connected mailbox.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {gmail.isLoading ? (
              <Skeleton className="h-12 w-full" />
            ) : gmail.data?.connected ? (
              <div className="border-accent/30 bg-accent/10 flex items-center gap-3 rounded-lg border p-4">
                <CheckCircle2 className="text-accent size-5 shrink-0" />
                <div>
                  <p className="text-foreground text-sm font-medium">
                    Connected as {gmail.data.email}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {gmail.data.messagesTotal.toLocaleString()} messages in the mailbox
                  </p>
                </div>
              </div>
            ) : (
              <div className="border-warning/30 bg-warning/10 flex items-center gap-3 rounded-lg border p-4">
                <XCircle className="text-warning size-5 shrink-0" />
                <div>
                  <p className="text-foreground text-sm font-medium">No Gmail account connected</p>
                  <p className="text-muted-foreground text-xs">
                    Connect your own Gmail so outreach is sent from your address and replies come
                    back to your inbox.
                  </p>
                  {gmail.data?.reason ? (
                    <p className="text-warning mt-1 text-xs">{gmail.data.reason}</p>
                  ) : null}
                </div>
              </div>
            )}

            {oauthError ? (
              <Alert variant="destructive">
                <AlertTriangle className="size-4" />
                <AlertTitle>Google authorisation failed</AlertTitle>
                <AlertDescription className="space-y-2">
                  <p className="break-words">{oauthError}</p>
                  <p>
                    Retry below and approve every requested Gmail permission. If Google reports a
                    redirect mismatch, add the connector gateway callback URL to your Google OAuth
                    client.
                  </p>
                </AlertDescription>
              </Alert>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <Button onClick={() => connect.mutate()} disabled={connect.isPending}>
                {connect.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : gmail.data?.connected ? (
                  <RefreshCw className="size-4" />
                ) : (
                  <Mail className="size-4" />
                )}
                {connect.isPending
                  ? "Waiting for Google…"
                  : gmail.data?.connected
                    ? "Re-authorise Gmail"
                    : oauthError
                      ? "Retry Gmail connection"
                      : "Connect Gmail"}
              </Button>
              {gmail.data?.connected ? (
                <Button
                  variant="outline"
                  onClick={() => disconnect.mutate()}
                  disabled={disconnect.isPending}
                >
                  Disconnect
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Sender identity</CardTitle>
            <CardDescription>Used by the AI when it writes and signs your emails.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                save.mutate();
              }}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="sender_name">Your name</Label>
                  <Input
                    id="sender_name"
                    value={form.sender_name}
                    maxLength={120}
                    onChange={(e) => setForm({ ...form, sender_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sender_email">Reply-to email</Label>
                  <Input
                    id="sender_email"
                    type="email"
                    value={form.sender_email}
                    maxLength={255}
                    onChange={(e) => setForm({ ...form, sender_email: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tone">Email tone</Label>
                <Select
                  value={form.email_tone}
                  onValueChange={(value) => setForm({ ...form, email_tone: value })}
                >
                  <SelectTrigger id="tone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TONES.map((tone) => (
                      <SelectItem key={tone} value={tone} className="capitalize">
                        {tone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="service">What you offer</Label>
                <Textarea
                  id="service"
                  rows={3}
                  maxLength={1000}
                  placeholder="Custom website redesigns for local businesses, delivered in 2-3 weeks."
                  value={form.service_description}
                  onChange={(e) => setForm({ ...form, service_description: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signature">Signature</Label>
                <Textarea
                  id="signature"
                  rows={4}
                  maxLength={1000}
                  placeholder={"Alex Smith\nWeb designer\nalex@studio.com"}
                  value={form.signature}
                  onChange={(e) => setForm({ ...form, signature: e.target.value })}
                />
              </div>

              <Button type="submit" disabled={save.isPending}>
                {save.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                Save settings
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
