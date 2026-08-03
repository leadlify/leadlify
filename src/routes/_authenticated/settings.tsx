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
      </div>
    </AppShell>
  );
}
