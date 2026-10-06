import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, Copy, Loader2, Mail, MessageCircle, Sparkles } from "lucide-react";
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
import { checkGmailReplies } from "@/lib/gmail.functions";
import { mailtoUrl, toInternationalDigits, whatsappUrl } from "@/lib/phone";
import { errorMessage, leadsQuery, type Lead } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/outreach")({
  head: () => ({
    meta: [
      { title: "Outreach queue — Leadlify" },
      { name: "description", content: "Send WhatsApp and email outreach manually and track replies." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Outreach queue — Leadlify" },
      { property: "og:description", content: "Semi-automatic outreach queue with follow-ups." },
    ],
  }),
  component: OutreachPage,
});

type Outreach = Tables<"outreach">;
type Channel = "whatsapp" | "email";
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
  const optedOut = new Set(rows.filter((r) => r.status === "not_interested").map((r) => r.lead_id));

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
    if (channelFilter !== "all") {
      if (channelFilter === "email" && !lead.email) return false;
      if (channelFilter === "whatsapp" && !lead.phone) return false;
      if (last && last.channel !== channelFilter && status !== "pending") return false;
    }
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
    <AppShell title="Outreach queue" description="You send every message yourself — one click each">
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
                may get your number flagged.
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
                  <SelectItem value="all">All channels</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
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
        </Tabs>
      </div>
    </AppShell>
  );
}

function LeadCard({ lead, last, followUp }: { lead: Lead; last?: Outreach; followUp?: boolean }) {
  const queryClient = useQueryClient();
  const generate = useServerFn(generateQueueMessages);
  const firstName = lead.owner_name?.split(" ")[0] || "there";
  const [whatsapp, setWhatsapp] = useState(
    followUp
      ? `Hi ${firstName}, just following up on my message about a website for ${lead.business_name}. Happy to share a free demo if useful — would that help?`
      : "",
  );
  const [subject, setSubject] = useState(followUp ? `Quick follow-up — ${lead.business_name}` : "");
  const [body, setBody] = useState(
    followUp
      ? `Hi ${firstName},\n\nJust following up on my earlier note about a website for ${lead.business_name}. I'd be glad to share a free demo so you can see what it could look like.\n\nIf you're not interested, just reply and I won't contact you again.`
      : "",
  );
  const [email, setEmail] = useState(lead.email ?? "");
  const [confirm, setConfirm] = useState<Channel | null>(null);
  const phone = toInternationalDigits(lead.phone, lead.country);

  const gen = useMutation({
    mutationFn: () => generate({ data: { leadId: lead.id } }),
    onSuccess: (r) => {
      setWhatsapp(r.whatsapp);
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

  const record = useMutation({
    mutationFn: async ({ channel, status }: { channel: Channel; status: string }) => {
      const { error } = await supabase.from("outreach").insert({
        lead_id: lead.id,
        channel,
        status,
        sent_at: status === "sent" ? new Date().toISOString() : null,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["outreach"] }),
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
              {whatsapp ? "Regenerate" : "Write messages"}
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <p className="text-sm font-medium">WhatsApp</p>
          <Textarea rows={5} value={whatsapp} onChange={(e) => setWhatsapp(e.target.value.slice(0, 1000))} placeholder="Click “Write messages” or type your own." />
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              disabled={!phone || !whatsapp}
              onClick={() => {
                window.open(whatsappUrl(phone!, whatsapp), "_blank", "noopener,noreferrer");
                setConfirm("whatsapp");
              }}
            >
              <MessageCircle className="size-4" /> Send on WhatsApp
            </Button>
            <Button size="sm" variant="outline" disabled={!whatsapp} onClick={() => copy(whatsapp, "Message")}>
              <Copy className="size-4" /> Copy message
            </Button>
          </div>
          {!phone ? <p className="text-muted-foreground text-xs">No phone number on this lead.</p> : null}
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Email</p>
          <div className="flex gap-2">
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Add business email" maxLength={255} />
            {email !== (lead.email ?? "") ? (
              <Button size="sm" variant="outline" onClick={() => saveEmail.mutate()}>Save</Button>
            ) : null}
          </div>
          <Input value={subject} onChange={(e) => setSubject(e.target.value.slice(0, 200))} placeholder="Subject" />
          <Textarea rows={6} value={body} onChange={(e) => setBody(e.target.value.slice(0, 3000))} placeholder="Email body" />
          <div className="flex flex-wrap gap-2">
            {lead.email ? (
              <Button
                size="sm"
                disabled={!body || !subject}
                onClick={() => {
                  window.location.href = mailtoUrl(lead.email!, subject, body);
                  setConfirm("email");
                }}
              >
                <Mail className="size-4" /> Send Email
              </Button>
            ) : null}
            <Button size="sm" variant="outline" disabled={!body} onClick={() => copy(`${subject}\n\n${body}`, "Email")}>
              <Copy className="size-4" /> Copy email
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 md:col-span-2">
          <p className="text-muted-foreground text-xs">
            Tip: Personalize each message and avoid sending the same text to many people to protect your WhatsApp number.
          </p>
          <div className="flex gap-2">
            {last?.status === "sent" ? (
              <Button size="sm" variant="outline" onClick={() => record.mutate({ channel: last.channel as Channel, status: "replied" })}>
                Mark replied
              </Button>
            ) : null}
            <Button size="sm" variant="ghost" onClick={() => record.mutate({ channel: (last?.channel as Channel) ?? "whatsapp", status: "not_interested" })}>
              Not interested
            </Button>
          </div>
        </div>
      </CardContent>

      <AlertDialog open={confirm !== null} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Did you send it?</AlertDialogTitle>
            <AlertDialogDescription>
              We'll mark {lead.business_name} as Sent so it moves out of your queue.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Not yet</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirm && record.mutate({ channel: confirm, status: "sent" })}>
              Yes, mark as sent
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
