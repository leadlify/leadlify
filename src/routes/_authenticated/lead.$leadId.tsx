import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  Building2,
  Gauge,
  Globe,
  LayoutTemplate,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Send,
  Sparkles,
  Star,
  Wand2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import {
  LEAD_STATUSES,
  STATUS_LABEL,
  StatusBadge,
  type LeadStatus,
} from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import type { WebsiteAnalysis } from "@/lib/analysis.functions";
import { analyzeLeadWebsite } from "@/lib/analysis.functions";
import { generateLeadEmail, sendLeadEmail } from "@/lib/outreach.functions";
import { demoSiteQuery, errorMessage, leadEmailsQuery, leadQuery } from "@/lib/queries";
import { generateDemoWebsite } from "@/lib/website-builder.functions";

export const Route = createFileRoute("/_authenticated/lead/$leadId")({
  head: () => ({
    meta: [
      { title: "Lead detail — LeadForge" },
      { name: "description", content: "Website audit, AI cold email draft and outreach history." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Lead detail — LeadForge" },
      {
        property: "og:description",
        content: "Website audit, AI cold email draft and outreach history.",
      },
    ],
  }),
  component: LeadDetailPage,
});

const SCORE_LABELS: Record<string, string> = {
  design: "Design",
  ui: "UI",
  ux: "UX",
  mobile_friendly: "Mobile",
  seo: "SEO",
  speed: "Speed",
  security: "Security",
  call_to_action: "CTA",
  contact_form: "Contact form",
  portfolio: "Portfolio",
};

function scoreTone(score: number) {
  if (score >= 70) return "text-accent";
  if (score >= 40) return "text-warning";
  return "text-destructive";
}

function LeadDetailPage() {
  const { leadId } = useParams({ from: "/_authenticated/lead/$leadId" });
  const queryClient = useQueryClient();

  const lead = useQuery(leadQuery(leadId));
  const emails = useQuery(leadEmailsQuery(leadId));
  const demoSite = useQuery(demoSiteQuery(leadId));
  const plan = useQuery({
    queryKey: ["my-plan"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("plan, website_builder_enabled")
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    },
  });

  const analyze = useServerFn(analyzeLeadWebsite);
  const generate = useServerFn(generateLeadEmail);
  const send = useServerFn(sendLeadEmail);
  const buildWebsite = useServerFn(generateDemoWebsite);

  const runWebsite = useMutation({
    mutationFn: () => buildWebsite({ data: { leadId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["demo-site", leadId] });
      toast.success("Demo website ready — the link will be added to the email");
    },
    onError: (error) => toast.error(errorMessage(error, "Could not build the demo website.")),
  });

  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [to, setTo] = useState("");
  const [instructions, setInstructions] = useState("");

  useEffect(() => {
    if (lead.data?.email && !to) setTo(lead.data.email);
  }, [lead.data?.email, to]);

  const analysis = (lead.data?.analysis as WebsiteAnalysis | null) ?? null;

  const runAnalysis = useMutation({
    mutationFn: () => analyze({ data: { leadId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead", leadId] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Website audit complete");
    },
    onError: (error) => toast.error(errorMessage(error, "The audit failed.")),
  });

  const runGenerate = useMutation({
    mutationFn: () => generate({ data: { leadId, instructions } }),
    onSuccess: (email) => {
      setSubject(email.subject);
      setBody(email.body);
      queryClient.invalidateQueries({ queryKey: ["lead", leadId] });
      toast.success("Draft ready — review before sending");
    },
    onError: (error) => toast.error(errorMessage(error, "Could not generate the email.")),
  });

  const runSend = useMutation({
    mutationFn: () => send({ data: { leadId, to, subject, body } }),
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast.success("Email sent from your Gmail account");
    },
    onError: (error) => toast.error(errorMessage(error, "Gmail could not send that email.")),
  });

  const updateLead = useMutation({
    mutationFn: async (patch: { status?: LeadStatus; notes?: string }) => {
      const { error } = await supabase.from("leads").update(patch).eq("id", leadId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead", leadId] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  if (lead.isLoading) {
    return (
      <AppShell title="Lead">
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
      </AppShell>
    );
  }

  if (!lead.data) {
    return (
      <AppShell title="Lead not found">
        <Card className="shadow-card border-border/60">
          <CardContent className="py-14 text-center">
            <p className="text-foreground text-sm font-medium">This lead no longer exists.</p>
            <Button asChild variant="outline" size="sm" className="mt-4">
              <Link to="/leads">Back to leads</Link>
            </Button>
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  const record = lead.data;

  return (
    <AppShell
      title={record.business_name}
      description={[record.business_category, record.city, record.country]
        .filter(Boolean)
        .join(" · ")}
      actions={
        <Button asChild variant="outline" size="sm">
          <Link to="/leads">
            <ArrowLeft className="size-4" />
            <span className="hidden sm:inline">All leads</span>
          </Link>
        </Button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="space-y-4">
          <Card className="shadow-card border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Business</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Detail icon={Building2} value={record.business_category} />
              <Detail
                icon={MapPin}
                value={[record.address, record.city, record.country].filter(Boolean).join(", ")}
              />
              <Detail
                icon={Phone}
                value={record.phone}
                href={record.phone ? `tel:${record.phone}` : undefined}
              />
              <Detail
                icon={Mail}
                value={record.email}
                href={record.email ? `mailto:${record.email}` : undefined}
              />
              <Detail
                icon={Globe}
                value={record.website?.replace(/^https?:\/\//, "")}
                href={record.website ?? undefined}
              />
              {record.google_rating ? (
                <Detail
                  icon={Star}
                  value={`${record.google_rating} · ${record.review_count ?? 0} reviews`}
                />
              ) : null}

              <div className="border-border/60 space-y-2 border-t pt-3">
                <Label className="text-xs">Pipeline status</Label>
                <Select
                  value={record.status}
                  onValueChange={(next) => updateLead.mutate({ status: next as LeadStatus })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEAD_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {STATUS_LABEL[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <StatusBadge status={record.status as LeadStatus} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-xs">
                  Private notes
                </Label>
                <Textarea
                  id="notes"
                  rows={4}
                  defaultValue={record.notes ?? ""}
                  placeholder="Anything worth remembering about this lead…"
                  onBlur={(e) => {
                    if (e.target.value !== (record.notes ?? "")) {
                      updateLead.mutate({ notes: e.target.value });
                      toast.success("Notes saved");
                    }
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="audit">
          <TabsList>
            <TabsTrigger value="audit">Website audit</TabsTrigger>
            <TabsTrigger value="email">Cold email</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="audit" className="mt-4">
            <Card className="shadow-card border-border/60">
              <CardHeader className="flex-row items-start justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Gauge className="text-primary size-4" />
                    AI website audit
                  </CardTitle>
                  <CardDescription>
                    {analysis
                      ? `Last run ${new Date(analysis.analyzed_at).toLocaleString()}`
                      : "Crawls the live site, then scores design, UX, SEO and speed."}
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  onClick={() => runAnalysis.mutate()}
                  disabled={runAnalysis.isPending}
                >
                  {runAnalysis.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Sparkles className="size-4" />
                  )}
                  {analysis ? "Re-run" : "Analyse"}
                </Button>
              </CardHeader>
              <CardContent>
                {runAnalysis.isPending ? (
                  <div className="space-y-3">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-40 w-full" />
                  </div>
                ) : !analysis ? (
                  <p className="text-muted-foreground py-10 text-center text-sm">
                    No audit yet. Run one to unlock a highly specific cold email.
                  </p>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-muted/40 flex items-center gap-5 rounded-xl p-4">
                      <div className="text-center">
                        <p
                          className={`text-4xl font-bold tabular-nums ${scoreTone(analysis.overall_score)}`}
                        >
                          {analysis.overall_score}
                        </p>
                        <p className="text-muted-foreground text-xs">Overall</p>
                      </div>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {analysis.summary}
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      {Object.entries(analysis.scores ?? {}).map(([key, score]) => (
                        <div key={key} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">
                              {SCORE_LABELS[key] ?? key}
                            </span>
                            <span className={`font-semibold tabular-nums ${scoreTone(score)}`}>
                              {score}
                            </span>
                          </div>
                          <Progress value={score} className="h-1.5" />
                        </div>
                      ))}
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <List title="Problems found" items={analysis.problems} tone="destructive" />
                      <List
                        title="Redesign opportunities"
                        items={analysis.opportunities}
                        tone="accent"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email" className="mt-4">
            <Card className="shadow-card border-border/60 mb-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <LayoutTemplate className="text-primary size-4" />
                  Demo website
                </CardTitle>
                <CardDescription>
                  Builds a professional demo site from this business&apos;s details. The link is
                  added automatically to the cold email.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {demoSite.data ? (
                  <div className="bg-muted/40 flex flex-wrap items-center justify-between gap-3 rounded-lg p-3">
                    <a
                      href={`/site/${demoSite.data.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary truncate text-sm font-medium underline-offset-4 hover:underline"
                    >
                      /site/{demoSite.data.slug}
                    </a>
                    <span className="text-muted-foreground text-xs">
                      Updated {new Date(demoSite.data.updated_at).toLocaleString()}
                    </span>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    No demo website generated for this lead yet.
                  </p>
                )}
                <Button
                  variant="outline"
                  onClick={() => runWebsite.mutate()}
                  disabled={runWebsite.isPending || plan.data?.website_builder_enabled === false}
                >
                  {runWebsite.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <LayoutTemplate className="size-4" />
                  )}
                   {plan.data?.website_builder_enabled === false
                     ? "Upgrade to generate websites"
                     : runWebsite.isPending
                    ? "Building website…"
                    : demoSite.data
                      ? "Regenerate website"
                       : "Generate website"}
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-card border-border/60">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Wand2 className="text-secondary size-4" />
                  AI cold email
                </CardTitle>
                <CardDescription>
                  Generated from the audit above and your settings. Always review before sending.
                  Every email includes your WhatsApp number 03701480852.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="instructions">Extra instructions (optional)</Label>
                  <Input
                    id="instructions"
                    placeholder="Mention we can deliver in two weeks"
                    value={instructions}
                    maxLength={600}
                    onChange={(e) => setInstructions(e.target.value)}
                  />
                </div>
                <Button
                  variant="secondary"
                  onClick={() => runGenerate.mutate()}
                  disabled={runGenerate.isPending}
                >
                  {runGenerate.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Sparkles className="size-4" />
                  )}
                  {runGenerate.isPending ? "Writing…" : "Generate draft"}
                </Button>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="to">To</Label>
                    <Input
                      id="to"
                      type="email"
                      placeholder="owner@business.com"
                      value={to}
                      onChange={(e) => setTo(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      value={subject}
                      maxLength={200}
                      onChange={(e) => setSubject(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="body">Message</Label>
                  <Textarea
                    id="body"
                    rows={14}
                    className="font-mono text-[13px] leading-relaxed"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Generate a draft, or write your own message here."
                  />
                </div>

                <Button
                  onClick={() => runSend.mutate()}
                  disabled={runSend.isPending || !to || !subject || !body}
                >
                  {runSend.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Send className="size-4" />
                  )}
                  {runSend.isPending ? "Sending…" : "Send via Gmail"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <Card className="shadow-card border-border/60">
              <CardHeader>
                <CardTitle className="text-base">Outreach history</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {emails.isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))
                ) : (emails.data ?? []).length === 0 ? (
                  <p className="text-muted-foreground py-10 text-center text-sm">
                    No emails sent to this lead yet.
                  </p>
                ) : (
                  (emails.data ?? []).map((email) => (
                    <div key={email.id} className="border-border/60 rounded-lg border p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-foreground truncate text-sm font-medium">
                            {email.subject}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            To {email.to_email} ·{" "}
                            {new Date(email.sent_at ?? email.created_at).toLocaleString()}
                          </p>
                        </div>
                        <span
                          className={
                            email.replied
                              ? "text-accent text-xs font-medium"
                              : email.sent_status === "sent"
                                ? "text-secondary text-xs font-medium"
                                : "text-destructive text-xs font-medium"
                          }
                        >
                          {email.replied
                            ? "Replied"
                            : email.sent_status === "sent"
                              ? "Sent"
                              : "Failed"}
                        </span>
                      </div>
                      <p className="text-muted-foreground mt-3 text-sm whitespace-pre-wrap">
                        {email.body}
                      </p>
                      {email.error_message ? (
                        <p className="text-destructive mt-2 text-xs">{email.error_message}</p>
                      ) : null}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}

function Detail({
  icon: Icon,
  value,
  href,
}: {
  icon: typeof Globe;
  value?: string | null;
  href?: string;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="text-muted-foreground mt-0.5 size-4 shrink-0" />
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary break-words hover:underline"
        >
          {value}
        </a>
      ) : (
        <span className="text-foreground break-words">{value}</span>
      )}
    </div>
  );
}

function List({
  title,
  items,
  tone,
}: {
  title: string;
  items?: string[];
  tone: "destructive" | "accent";
}) {
  return (
    <div>
      <p className="text-foreground mb-2 text-sm font-semibold">{title}</p>
      <ul className="space-y-2">
        {(items ?? []).map((item) => (
          <li key={item} className="text-muted-foreground flex gap-2 text-sm">
            <span
              className={`mt-1.5 size-1.5 shrink-0 rounded-full ${
                tone === "destructive" ? "bg-destructive" : "bg-accent"
              }`}
            />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
