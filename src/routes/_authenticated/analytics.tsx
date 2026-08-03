import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Award, FileText, Gauge, Percent } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AppShell } from "@/components/app-shell";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { emailsQuery, leadsQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — Leadlify" },
      { name: "description", content: "Reply rates, top niches and website audit score spread." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Analytics — Leadlify" },
      {
        property: "og:description",
        content: "Reply rates, top niches and website audit score spread.",
      },
    ],
  }),
  component: AnalyticsPage,
});

const tooltipStyle = {
  background: "var(--color-popover)",
  border: "1px solid var(--color-border)",
  borderRadius: 12,
  fontSize: 12,
  color: "var(--color-popover-foreground)",
};

function AnalyticsPage() {
  const leads = useQuery(leadsQuery);
  const emails = useQuery(emailsQuery);
  const loading = leads.isLoading || emails.isLoading;

  const rows = leads.data ?? [];
  const sent = (emails.data ?? []).filter((e) => e.sent_status === "sent");
  const replied = sent.filter((e) => e.replied);
  const replyRate = sent.length ? (replied.length / sent.length) * 100 : 0;
  const closed = rows.filter((l) => l.status === "closed").length;
  const closeRate = sent.length ? (closed / sent.length) * 100 : 0;

  const audited = rows.filter((l) => l.seo_score !== null);
  const avgSeo = audited.length
    ? audited.reduce((sum, l) => sum + (l.seo_score ?? 0), 0) / audited.length
    : 0;

  const niches = Object.entries(
    rows.reduce<Record<string, number>>((acc, lead) => {
      const key = lead.business_category?.trim() || "Uncategorised";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {}),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => ({ name, count }));

  const buckets = [
    { name: "0-20", min: 0, max: 20 },
    { name: "21-40", min: 21, max: 40 },
    { name: "41-60", min: 41, max: 60 },
    { name: "61-80", min: 61, max: 80 },
    { name: "81-100", min: 81, max: 100 },
  ].map((bucket) => ({
    name: bucket.name,
    count: audited.filter(
      (l) => (l.seo_score ?? 0) >= bucket.min && (l.seo_score ?? 0) <= bucket.max,
    ).length,
  }));

  return (
    <AppShell title="Analytics" description="How your outreach is actually performing">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Reply rate"
          value={replyRate}
          decimals={1}
          suffix="%"
          icon={Percent}
          tone="accent"
          hint={`${replied.length} of ${sent.length} emails`}
          loading={loading}
        />
        <StatCard
          label="Drafted outreach"
          value={rows.filter((lead) => Boolean(lead.generated_email)).length}
          icon={FileText}
          tone="secondary"
          loading={loading}
          delay={60}
        />
        <StatCard
          label="Close rate"
          value={closeRate}
          decimals={1}
          suffix="%"
          icon={Award}
          hint={`${closed} clients closed`}
          loading={loading}
          delay={120}
        />
        <StatCard
          label="Avg SEO score"
          value={avgSeo}
          decimals={0}
          icon={Gauge}
          tone="warning"
          hint={`${audited.length} sites audited`}
          loading={loading}
          delay={180}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="shadow-card border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Top niches</CardTitle>
            <CardDescription>Where most of your pipeline comes from.</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {loading ? (
              <Skeleton className="h-full w-full" />
            ) : niches.length === 0 ? (
              <p className="text-muted-foreground grid h-full place-items-center text-sm">
                No leads yet.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={niches} layout="vertical" margin={{ left: 24, right: 12 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--color-border)"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={110}
                    tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--color-muted)" }} />
                  <Bar dataKey="count" name="Leads" radius={[0, 6, 6, 0]}>
                    {niches.map((entry) => (
                      <Cell key={entry.name} fill="var(--color-chart-1)" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Website SEO score spread</CardTitle>
            <CardDescription>Lower scores mean a stronger redesign pitch.</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {loading ? (
              <Skeleton className="h-full w-full" />
            ) : audited.length === 0 ? (
              <p className="text-muted-foreground grid h-full place-items-center text-sm">
                Run a website audit to populate this chart.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={buckets} margin={{ left: -18, right: 12 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--color-border)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--color-muted)" }} />
                  <Bar
                    dataKey="count"
                    name="Sites"
                    radius={[6, 6, 0, 0]}
                    fill="var(--color-chart-3)"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
