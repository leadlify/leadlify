import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CheckCircle2,
  Clock,
  Mail,
  MessageSquareReply,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AppShell } from "@/components/app-shell";
import { StatCard } from "@/components/stat-card";
import { STATUS_LABEL, StatusBadge, type LeadStatus } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { emailsQuery, leadsQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — LeadForge" },
      { name: "description", content: "Pipeline overview, outreach volume and conversion rate." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Dashboard — LeadForge" },
      {
        property: "og:description",
        content: "Pipeline overview, outreach volume and conversion rate.",
      },
    ],
  }),
  component: DashboardPage,
});

const PIE_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
  "var(--color-destructive)",
];

function DashboardPage() {
  const leads = useQuery(leadsQuery);
  const emails = useQuery(emailsQuery);
  const loading = leads.isLoading || emails.isLoading;

  const rows = leads.data ?? [];
  const sent = (emails.data ?? []).filter((e) => e.sent_status === "sent");
  const replies = rows.filter((l) => ["replied", "interested", "closed"].includes(l.status)).length;
  const closed = rows.filter((l) => l.status === "closed").length;
  const pending = rows.filter((l) => l.status === "new").length;
  const conversion = rows.length ? (closed / rows.length) * 100 : 0;

  const byStatus = (Object.keys(STATUS_LABEL) as LeadStatus[])
    .map((status) => ({
      name: STATUS_LABEL[status],
      value: rows.filter((l) => l.status === status).length,
    }))
    .filter((d) => d.value > 0);

  const timeline = Array.from({ length: 14 }, (_, index) => {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - (13 - index));
    const next = new Date(day);
    next.setDate(next.getDate() + 1);
    const within = (iso: string | null) => {
      if (!iso) return false;
      const t = new Date(iso).getTime();
      return t >= day.getTime() && t < next.getTime();
    };
    return {
      label: day.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      leads: rows.filter((l) => within(l.created_at)).length,
      emails: sent.filter((e) => within(e.sent_at)).length,
    };
  });

  return (
    <AppShell
      title="Dashboard"
      description="Everything happening across your outreach pipeline"
      actions={
        <Button asChild size="sm">
          <Link to="/find-leads">Find leads</Link>
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total leads" value={rows.length} icon={Users} loading={loading} delay={0} />
        <StatCard
          label="Emails sent"
          value={sent.length}
          icon={Mail}
          tone="secondary"
          loading={loading}
          delay={60}
        />
        <StatCard
          label="Replies"
          value={replies}
          icon={MessageSquareReply}
          tone="accent"
          loading={loading}
          delay={120}
        />
        <StatCard
          label="Pending"
          value={pending}
          icon={Clock}
          tone="warning"
          loading={loading}
          delay={180}
        />
        <StatCard
          label="Closed clients"
          value={closed}
          icon={CheckCircle2}
          tone="accent"
          hint={`${conversion.toFixed(1)}% conversion`}
          loading={loading}
          delay={240}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="shadow-card border-border/60 lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="text-primary size-4" />
              Last 14 days
            </CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {loading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeline} margin={{ left: -20, right: 8, top: 8 }}>
                  <defs>
                    <linearGradient id="leadsFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="emailsFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-chart-3)" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="var(--color-chart-3)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-popover)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 12,
                      fontSize: 12,
                      color: "var(--color-popover-foreground)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="leads"
                    name="Leads found"
                    stroke="var(--color-chart-1)"
                    strokeWidth={2}
                    fill="url(#leadsFill)"
                  />
                  <Area
                    type="monotone"
                    dataKey="emails"
                    name="Emails sent"
                    stroke="var(--color-chart-3)"
                    strokeWidth={2}
                    fill="url(#emailsFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Pipeline breakdown</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {loading ? (
              <Skeleton className="h-full w-full" />
            ) : byStatus.length === 0 ? (
              <p className="text-muted-foreground grid h-full place-items-center text-sm">
                No leads yet.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={byStatus}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    stroke="none"
                  >
                    {byStatus.map((entry, index) => (
                      <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-popover)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 12,
                      fontSize: 12,
                      color: "var(--color-popover-foreground)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="shadow-card border-border/60">
          <CardHeader className="flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Recent leads</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to="/leads">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
            ) : rows.length === 0 ? (
              <p className="text-muted-foreground py-6 text-center text-sm">
                No leads yet — run your first search.
              </p>
            ) : (
              rows.slice(0, 5).map((lead) => (
                <Link
                  key={lead.id}
                  to="/lead/$leadId"
                  params={{ leadId: lead.id }}
                  className="hover:bg-muted/60 flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-foreground truncate text-sm font-medium">
                      {lead.business_name}
                    </p>
                    <p className="text-muted-foreground truncate text-xs">
                      {[lead.business_category, lead.city].filter(Boolean).join(" · ") || "—"}
                    </p>
                  </div>
                  <StatusBadge status={lead.status as LeadStatus} />
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Recent emails</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
            ) : (emails.data ?? []).length === 0 ? (
              <p className="text-muted-foreground py-6 text-center text-sm">
                No emails sent yet.
              </p>
            ) : (
              (emails.data ?? []).slice(0, 5).map((email) => (
                <div
                  key={email.id}
                  className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="text-foreground truncate text-sm font-medium">{email.subject}</p>
                    <p className="text-muted-foreground truncate text-xs">{email.to_email}</p>
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
                    {email.replied ? "Replied" : email.sent_status === "sent" ? "Sent" : "Failed"}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
