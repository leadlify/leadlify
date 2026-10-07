import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, Check, Copy, Loader2, Mail, Sparkles, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { AppShell } from "@/components/app-shell";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { generateQueueMessages } from "@/lib/outreach.functions";
import { checkGmailReplies, sendLeadEmailViaGmail, unsubscribeLead } from "@/lib/gmail.functions";
import { errorMessage, leadsQuery, type Lead } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/outreach")({
  head: () => ({
    meta: [
      { title: "Outreach queue — Leadlify" },
      { name: "description", content: "Send cold emails from your Gmail and track delivery, replies and opt-outs." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Outreach queue — Leadlify" },
      { property: "og:description", content: "Semi-automatic outreach queue with follow-ups." },
    ],
  }),
  component: OutreachPage,
});

type Outreach = Tables<"outreach">;
type Channel = "email";
const DAILY_SOFT_LIMIT = 30;
const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  sent: "Sent",
  replied: "Replied",
  not_interested: "Not interested",
};

function RepliesTab() {
  const queryClient = useQueryClient();
  const checkFn = useServerFn(checkGmailReplies);
  const replies = useQuery({
    queryKey: ["email-replies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_replies")
        .select("id, lead_id, from_email, subject, snippet, received_at, is_read")
        .order("received_at", { ascending: false })
        .limit(200);
      if (error) throw new Error(error.message);
      return data;
    },
  });
  const check = useMutation({
    mutationFn: () => checkFn(),
    onSuccess: (r) => {
      queryClient.invalidateQueries();
      toast.success(r.added ? `${r.added} new repl${r.added === 1 ? "y" : "ies"}` : "No new replies");
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  return (
    <>
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => check.mutate()} disabled={check.isPending}>
          {check.isPending ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
          Check now
        </Button>
      </div>
      {!replies.data?.length ? (
        <p className="text-muted-foreground py-12 text-center text-sm">
          No replies yet. Gmail is checked automatically every 15 minutes.
        </p>
      ) : (
        replies.data.map((r) => (
          <Card key={r.id} className="border-border/60">
            <CardContent className="space-y-1 pt-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium">{r.from_email}</p>
                <span className="text-muted-foreground text-xs">
                  {new Date(r.received_at).toLocaleString()}
                </span>
              </div>
              <p className="text-sm">{r.subject}</p>
              <p className="text-muted-foreground text-sm">{r.snippet}</p>
              {r.lead_id ? (
                <Link to="/lead/$leadId" params={{ leadId: r.lead_id }} className="text-xs underline">
                  Open lead
                </Link>
              ) : null}
            </CardContent>
          </Card>
        ))
      )}
    </>
  );
}
const emailSchema = z.string().trim().email().max(255);

const outreachQuery = {
  queryKey: ["outreach"],
  queryFn: async (): Promise<Outreach[]> => {
    const { data, error } = await supabase
      .from("outreach")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1000);
    if (error) throw new Error(error.message);
    return data ?? [];
  },
};

function OutreachPage() {
  const leads = useQuery(leadsQuery);
  const outreach = useQuery(outreachQuery);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [channelFilter, setChannelFilter] = useState("all");

  const rows = outreach.data ?? [];
  const today = new Date().toISOString().slice(0, 10);
  const sentToday = rows.filter((r) => r.sent_at?.slice(0, 10) === today).length;
  const unsubs = useQuery(unsubscribesQuery);
  const blockedEmails = new Set((unsubs.data ?? []).map((u) => u.email.toLowerCase()));
  const optedOut = new Set([
    ...rows.filter((r) => r.status === "not_interested").map((r) => r.lead_id),
    ...(leads.data ?? []).filter((l) => l.email && blockedEmails.has(l.email.toLowerCase())).map((l) => l.id),
  ]);

  const latestByLead = useMemo(() => {
    const map = new Map<string, Outreach>();
    for (const r of rows) if (!map.has(r.lead_id)) map.set(r.lead_id, r);
    return map;
  }, [rows]);

  const queue = (leads.data ?? []).filter((lead) => {
    if (optedOut.has(lead.id)) return statusFilter === "not_interested";
    const last = latestByLead.get(lead.id);
    const status = last?.status ?? "pending";
    if (statusFilter !== "all" && status !== statusFilter) return false;
    if (channelFilter === "with_email" && !lead.email) return false;
    return true;
  });

  const threeDaysAgo = Date.now() - 3 * 864e5;
  const followUps = (leads.data ?? []).filter((lead) => {
    const last = latestByLead.get(lead.id);
    return (
      last?.status === "sent" && last.sent_at && new Date(last.sent_at).getTime() < threeDaysAgo
    );
  });

  return (
    <AppShell title="Outreach queue" description="Emails go out from your connected Gmail — one click each">
      <div className="space-y-6">
        <Card className={sentToday >= DAILY_SOFT_LIMIT ? "border-destructive/60" : ""}>
          <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
            <div>
              <p className="text-muted-foreground text-xs">Sent today</p>
              <p className="text-2xl font-semibold tabular-nums">
                {sentToday} <span className="text-muted-foreground text-base">/ {DAILY_SOFT_LIMIT}</span>
              </p>
            </div>
            {sentToday >= DAILY_SOFT_LIMIT ? (
              <p className="text-destructive flex items-center gap-2 text-sm">
                <AlertTriangle className="size-4" /> You've reached today's suggested limit. Sending more
                may hurt your Gmail reputation.
              </p>
            ) : (
              <p className="text-muted-foreground text-sm">Suggested daily limit: {DAILY_SOFT_LIMIT}</p>
            )}
          </CardContent>
        </Card>

        <Tabs defaultValue="queue">
          <TabsList>
            <TabsTrigger value="queue">Queue</TabsTrigger>
            <TabsTrigger value="followups">Follow-ups ({followUps.length})</TabsTrigger>
            <TabsTrigger value="replies">Replies</TabsTrigger>
            <TabsTrigger value="delivery">Delivery</TabsTrigger>
            <TabsTrigger value="unsubscribed">Unsubscribed ({unsubs.data?.length ?? 0})</TabsTrigger>
          </TabsList>

          <TabsContent value="queue" className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {Object.entries(STATUS_LABEL).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={channelFilter} onValueChange={setChannelFilter}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All leads</SelectItem>
                  <SelectItem value="with_email">Has email</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {leads.isLoading || outreach.isLoading ? (
              <Loader2 className="text-primary mx-auto size-6 animate-spin" />
            ) : queue.length === 0 ? (
              <p className="text-muted-foreground py-12 text-center text-sm">
                Nothing here. <Link to="/find-leads" className="underline">Find new leads</Link>.
              </p>
            ) : (
              queue.slice(0, 50).map((lead) => (
                <LeadCard key={lead.id} lead={lead} last={latestByLead.get(lead.id)} />
              ))
            )}
          </TabsContent>

          <TabsContent value="followups" className="space-y-4">
            {followUps.length === 0 ? (
              <p className="text-muted-foreground py-12 text-center text-sm">
                No follow-ups due. Leads appear here 3 days after you send with no reply.
              </p>
            ) : (
              followUps.map((lead) => (
                <LeadCard key={lead.id} lead={lead} last={latestByLead.get(lead.id)} followUp />
              ))
            )}
          </TabsContent>

          <TabsContent value="replies" className="space-y-4">
            <RepliesTab />
          </TabsContent>

          <TabsContent value="delivery" className="space-y-4">
            <DeliveryTab />
          </TabsContent>

          <TabsContent value="unsubscribed" className="space-y-4">
            <UnsubscribedTab />
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}

function LeadCard({ lead, last, followUp }: { lead: Lead; last?: Outreach; followUp?: boolean }) {
  const queryClient = useQueryClient();
  const generate = useServerFn(generateQueueMessages);
  const sendFn = useServerFn(sendLeadEmailViaGmail);
  const unsubFn = useServerFn(unsubscribeLead);
  const firstName = lead.owner_name?.split(" ")[0] || "there";
  const [subject, setSubject] = useState(followUp ? `Quick follow-up — ${lead.business_name}` : "");
  const [body, setBody] = useState(
    followUp
      ? `Hi ${firstName},\n\nJust following up on my earlier note about a website for ${lead.business_name}. I'd be glad to share a free demo so you can see what it could look like.\n\nIf you're not interested, just reply and I won't contact you again.`
      : "",
  );
  const [email, setEmail] = useState(lead.email ?? "");
  const [justSent, setJustSent] = useState(false);
  const [confirmUnsub, setConfirmUnsub] = useState(false);

  const gen = useMutation({
    mutationFn: () => generate({ data: { leadId: lead.id } }),
    onSuccess: (r) => {
      setSubject(r.subject);
      setBody(r.body);
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const saveEmail = useMutation({
    mutationFn: async () => {
      const parsed = emailSchema.safeParse(email);
      if (!parsed.success) throw new Error("Enter a valid email address.");
      const { error } = await supabase.from("leads").update({ email: parsed.data }).eq("id", lead.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Email saved");
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const send = useMutation({
    mutationFn: () => sendFn({ data: { leadId: lead.id, to: lead.email!, subject, body } }),
    onSuccess: (r) => {
      setJustSent(true);
      toast.success(`Sent from ${r.from}`);
      setTimeout(() => queryClient.invalidateQueries(), 1500);
    },
    onError: (e) => {
      toast.error(errorMessage(e, "Could not send the email."));
      queryClient.invalidateQueries({ queryKey: ["email-history"] });
    },
  });

  const record = useMutation({
    mutationFn: async ({ status }: { status: string }) => {
      const { error } = await supabase.from("outreach").insert({ lead_id: lead.id, channel: "email", status });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["outreach"] }),
    onError: (e) => toast.error(errorMessage(e)),
  });

  const unsub = useMutation({
    mutationFn: () => unsubFn({ data: { email: lead.email!, leadId: lead.id, reason: "Marked not interested" } }),
    onSuccess: () => {
      toast.success("Added to unsubscribe list");
      queryClient.invalidateQueries();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const copy = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
        <div className="min-w-0">
          <CardTitle className="truncate text-base">
            <Link to="/lead/$leadId" params={{ leadId: lead.id }} className="hover:underline">
              {lead.business_name}
            </Link>
          </CardTitle>
          <p className="text-muted-foreground text-xs">
            {[lead.business_category, lead.city, lead.country].filter(Boolean).join(" · ")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{STATUS_LABEL[last?.status ?? "pending"]}</Badge>
          {!followUp ? (
            <Button size="sm" variant="outline" disabled={gen.isPending} onClick={() => gen.mutate()}>
              {gen.isPending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              {body ? "Regenerate" : "Write email"}
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex gap-2">
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Add business email" maxLength={255} />
          {email !== (lead.email ?? "") ? (
            <Button size="sm" variant="outline" onClick={() => saveEmail.mutate()}>Save</Button>
          ) : null}
        </div>
        <Input value={subject} onChange={(e) => setSubject(e.target.value.slice(0, 200))} placeholder="Subject" />
        <Textarea rows={6} value={body} onChange={(e) => setBody(e.target.value.slice(0, 3000))} placeholder="Email body" />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              disabled={!lead.email || !body || !subject || send.isPending || justSent}
              onClick={() => send.mutate()}
            >
              {send.isPending ? (
                <><Loader2 className="size-4 animate-spin" /> Sending…</>
              ) : justSent ? (
                <><Check className="size-4" /> Sent</>
              ) : (
                <><Mail className="size-4" /> Send Email</>
              )}
            </Button>
            <Button size="sm" variant="outline" disabled={!body} onClick={() => copy(`${subject}\n\n${body}`, "Email")}>
              <Copy className="size-4" /> Copy email
            </Button>
          </div>
          <div className="flex gap-2">
            {last?.status === "sent" ? (
              <Button size="sm" variant="outline" onClick={() => record.mutate({ status: "replied" })}>
                Mark replied
              </Button>
            ) : null}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => (lead.email ? setConfirmUnsub(true) : record.mutate({ status: "not_interested" }))}
            >
              Not interested
            </Button>
          </div>
        </div>
        {!lead.email ? <p className="text-muted-foreground text-xs">Add and save an email to send.</p> : null}
      </CardContent>

      <AlertDialog open={confirmUnsub} onOpenChange={setConfirmUnsub}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Stop contacting {lead.business_name}?</AlertDialogTitle>
            <AlertDialogDescription>
              {lead.email} will be added to your unsubscribe list and can't be emailed again unless you remove it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => unsub.mutate()}>Yes, unsubscribe</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

const unsubscribesQuery = {
  queryKey: ["unsubscribes"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("unsubscribes")
      .select("id, email, reason, created_at")
      .order("created_at", { ascending: false })
      .limit(1000);
    if (error) throw new Error(error.message);
    return data ?? [];
  },
};

const DELIVERY_STYLE: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  sent: "default",
  failed: "destructive",
  bounced: "destructive",
  pending: "outline",
};

function DeliveryTab() {
  const [filter, setFilter] = useState("all");
  const history = useQuery({
    queryKey: ["email-history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_history")
        .select("id, lead_id, to_email, subject, sent_status, error_message, sent_at, bounced_at, replied, created_at")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
  const rows = history.data ?? [];
  const count = (s: string) => rows.filter((r) => r.sent_status === s).length;
  const shown = filter === "all" ? rows : rows.filter((r) => r.sent_status === filter);
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-3">
        {[["sent", "Sent"], ["failed", "Failed"], ["bounced", "Bounced"]].map(([k, l]) => (
          <Card key={k} className={filter === k ? "border-primary" : ""}>
            <button type="button" className="w-full text-left" onClick={() => setFilter(filter === k ? "all" : k)}>
              <CardContent className="py-4">
                <p className="text-muted-foreground text-xs">{l}</p>
                <p className="text-2xl font-semibold tabular-nums">{count(k)}</p>
              </CardContent>
            </button>
          </Card>
        ))}
      </div>
      <p className="text-muted-foreground text-xs">Bounces are detected when Gmail's reply check runs (every 15 minutes or "Check now" in Replies).</p>
      {history.isLoading ? (
        <Loader2 className="text-primary mx-auto size-6 animate-spin" />
      ) : !shown.length ? (
        <p className="text-muted-foreground py-12 text-center text-sm">No emails here yet.</p>
      ) : (
        shown.map((r) => (
          <Card key={r.id} className="border-border/60">
            <CardContent className="space-y-1 pt-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium">{r.to_email}</p>
                <div className="flex items-center gap-2">
                  {r.replied ? <Badge variant="secondary">Replied</Badge> : null}
                  <Badge variant={DELIVERY_STYLE[r.sent_status] ?? "outline"} className="capitalize">{r.sent_status}</Badge>
                </div>
              </div>
              <p className="text-sm">{r.subject}</p>
              <p className="text-muted-foreground text-xs">
                {new Date(r.bounced_at ?? r.sent_at ?? r.created_at).toLocaleString()}
              </p>
              {r.error_message && r.sent_status !== "sent" ? (
                <p className="text-destructive text-xs">{r.error_message}</p>
              ) : null}
              {r.lead_id ? (
                <Link to="/lead/$leadId" params={{ leadId: r.lead_id }} className="text-xs underline">Open lead</Link>
              ) : null}
            </CardContent>
          </Card>
        ))
      )}
    </>
  );
}

function UnsubscribedTab() {
  const queryClient = useQueryClient();
  const unsubFn = useServerFn(unsubscribeLead);
  const list = useQuery(unsubscribesQuery);
  const [newEmail, setNewEmail] = useState("");
  const add = useMutation({
    mutationFn: () => {
      const parsed = emailSchema.safeParse(newEmail);
      if (!parsed.success) throw new Error("Enter a valid email address.");
      return unsubFn({ data: { email: parsed.data, reason: "Added manually" } });
    },
    onSuccess: () => {
      setNewEmail("");
      toast.success("Added to unsubscribe list");
      queryClient.invalidateQueries({ queryKey: ["unsubscribes"] });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("unsubscribes").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["unsubscribes"] }),
    onError: (e) => toast.error(errorMessage(e)),
  });
  return (
    <>
      <div className="flex gap-2">
        <Input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="email@business.com" maxLength={255} />
        <Button onClick={() => add.mutate()} disabled={add.isPending || !newEmail}>Add</Button>
      </div>
      <p className="text-muted-foreground text-xs">Addresses here are blocked — Leadlify will refuse to email them.</p>
      {!list.data?.length ? (
        <p className="text-muted-foreground py-12 text-center text-sm">No one has opted out.</p>
      ) : (
        list.data.map((u) => (
          <Card key={u.id} className="border-border/60">
            <CardContent className="flex items-center justify-between gap-2 py-3">
              <div>
                <p className="text-sm font-medium">{u.email}</p>
                <p className="text-muted-foreground text-xs">
                  {u.reason ?? "Opted out"} · {new Date(u.created_at).toLocaleDateString()}
                </p>
              </div>
              <Button size="icon" variant="ghost" aria-label="Remove" onClick={() => remove.mutate(u.id)}>
                <Trash2 className="size-4" />
              </Button>
            </CardContent>
          </Card>
        ))
      )}
    </>
  );
}
