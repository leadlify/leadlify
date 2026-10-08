import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
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
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { errorMessage, settingsQuery } from "@/lib/queries";
import { useServerFn } from "@tanstack/react-start";
import { disconnectGmail, getGmailConnectUrl, getGmailStatus, sendGmailTestEmail } from "@/lib/gmail.functions";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Leadlify" },
      { name: "description", content: "Sender identity and email tone settings." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Settings — Leadlify" },
      {
        property: "og:description",
        content: "Sender identity and email tone settings.",
      },
    ],
  }),
  component: SettingsPage,
});

const TONES = ["professional", "friendly", "direct", "consultative"] as const;

function GmailCard() {
  const queryClient = useQueryClient();
  const statusFn = useServerFn(getGmailStatus);
  const connectFn = useServerFn(getGmailConnectUrl);
  const disconnectFn = useServerFn(disconnectGmail);
  const status = useQuery({ queryKey: ["gmail-status"], queryFn: () => statusFn() });

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const g = p.get("gmail");
    if (!g) return;
    if (g === "connected") toast.success("Gmail connected");
    else toast.error(`Gmail connection failed: ${p.get("detail") ?? "unknown error"}`);
    window.history.replaceState({}, "", window.location.pathname);
    queryClient.invalidateQueries({ queryKey: ["gmail-status"] });
  }, [queryClient]);

  const connect = useMutation({
    mutationFn: () => connectFn(),
    onSuccess: ({ url }) => {
      window.location.href = url;
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const disconnect = useMutation({
    mutationFn: () => disconnectFn(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gmail-status"] });
      toast.success("Gmail disconnected");
    },
  });

  const acct = status.data;
  return (
    <Card className="shadow-card border-border/60">
      <CardHeader>
        <CardTitle className="text-base">Gmail</CardTitle>
        <CardDescription>Send emails from your own Gmail and track replies automatically.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {status.isLoading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : acct ? (
          <>
            <p className="text-sm">
              Connected as <strong>{acct.email ?? "unknown"}</strong>
              {acct.last_checked_at
                ? ` · replies checked ${new Date(acct.last_checked_at).toLocaleString()}`
                : ""}
            </p>
            {acct.last_error ? <p className="text-destructive text-sm">{acct.last_error}</p> : null}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => connect.mutate()} disabled={connect.isPending}>
                Reconnect
              </Button>
              <Button variant="ghost" onClick={() => disconnect.mutate()} disabled={disconnect.isPending}>
                Disconnect
              </Button>
            </div>
          </>
        ) : (
          <Button onClick={() => connect.mutate()} disabled={connect.isPending}>
            {connect.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Connect Gmail
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function SettingsPage() {
  const queryClient = useQueryClient();
  const settings = useQuery(settingsQuery);

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

  return (
    <AppShell title="Settings" description="How your outreach emails are written and signed">
      <div className="grid max-w-3xl gap-6">
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
        <GmailCard />
      </div>
    </AppShell>
  );
}
