import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Check, DollarSign, FileClock, Loader2, Users, X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { StatCard } from "@/components/stat-card";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import {
  allEmailsQuery,
  allLeadsQuery,
  allPaymentsQuery,
  allPlanRequestsQuery,
  allProfilesQuery,
  errorMessage,
  isAdminQuery,
} from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin panel — Leadlify" },
      { name: "description", content: "Users, emails sent, earnings and platform analytics." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Admin panel — Leadlify" },
      {
        property: "og:description",
        content: "Users, emails sent, earnings and platform analytics.",
      },
    ],
  }),
  component: AdminPage,
});

const tooltipStyle = {
  background: "var(--color-popover)",
  border: "1px solid var(--color-border)",
  borderRadius: 12,
  fontSize: 12,
  color: "var(--color-popover-foreground)",
};

const dayKey = (value: string) => new Date(value).toISOString().slice(0, 10);

const PLAN_LIMITS = {
  free: { leads: 10, emails: 2, builder: false },
  starter: { leads: 500, emails: 100, builder: true },
  growth: { leads: 1500, emails: 500, builder: true },
  agency: { leads: 5000, emails: 2000, builder: true },
} as const;

function AdminPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const admin = useQuery(isAdminQuery);

  useEffect(() => {
    if (admin.isSuccess && !admin.data) {
      toast.error("Admin access only.");
      navigate({ to: "/dashboard", replace: true });
    }
  }, [admin.isSuccess, admin.data, navigate]);

  const enabled = admin.data === true;
  const profiles = useQuery({ ...allProfilesQuery, enabled });
  const emails = useQuery({ ...allEmailsQuery, enabled });
  const leads = useQuery({ ...allLeadsQuery, enabled });
  const payments = useQuery({ ...allPaymentsQuery, enabled });
  const planRequests = useQuery({ ...allPlanRequestsQuery, enabled });

  const [payEmail, setPayEmail] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [payNote, setPayNote] = useState("");

  const addPayment = useMutation({
    mutationFn: async () => {
      const target = (profiles.data ?? []).find(
        (p) => (p.email ?? "").toLowerCase() === payEmail.trim().toLowerCase(),
      );
      if (!target) throw new Error("No signed-up user with that email.");
      const amount = Number(payAmount);
      if (!Number.isFinite(amount) || amount <= 0) throw new Error("Enter a valid amount.");
      const { error } = await supabase
        .from("payments")
        .insert({ user_id: target.id, amount, description: payNote.trim() || null });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Payment recorded");
      setPayEmail("");
      setPayAmount("");
      setPayNote("");
      queryClient.invalidateQueries({ queryKey: ["admin", "payments"] });
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const quotaMutation = useMutation({
    mutationFn: async ({ id, quota }: { id: string; quota: number }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ monthly_lead_quota: quota })
        .eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "profiles"] });
      toast.success("Quota updated");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Update failed"),
  });

  const planMutation = useMutation({
    mutationFn: async ({ id, plan }: { id: string; plan: keyof typeof PLAN_LIMITS }) => {
      const limits = PLAN_LIMITS[plan];
      const { error } = await supabase
        .from("profiles")
        .update({
          plan,
          monthly_lead_quota: limits.leads,
          monthly_email_quota: limits.emails,
          website_builder_enabled: limits.builder,
        })
        .eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "profiles"] });
      toast.success("Plan and limits updated");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Update failed"),
  });

  const reviewPlan = useMutation({
    mutationFn: async ({ id, approve }: { id: string; approve: boolean }) => {
      const { error } = await supabase.rpc("review_plan_request", { _request_id: id, _approve: approve });
      if (error) throw new Error(error.message);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      toast.success(variables.approve ? "Plan approved and activated" : "Plan request rejected");
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  if (admin.isLoading || !enabled) {
    return (
      <AppShell title="Admin panel" description="Checking access…">
        <div className="grid place-items-center py-24">
          <Loader2 className="text-primary size-6 animate-spin" />
        </div>
      </AppShell>
    );
  }

  const users = profiles.data ?? [];
  const allEmails = emails.data ?? [];
  const sent = allEmails.filter((e) => e.sent_status === "sent");
  const replies = sent.filter((e) => e.replied);
  const earnings = (payments.data ?? []).reduce((sum, p) => sum + Number(p.amount ?? 0), 0);
  const loading = profiles.isLoading || emails.isLoading || leads.isLoading || payments.isLoading || planRequests.isLoading;
  const pendingRequests = (planRequests.data ?? []).filter((request) => request.status === "pending");

  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    return d.toISOString().slice(0, 10);
  });

  const series = days.map((day) => ({
    day: new Date(day).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    signups: users.filter((u) => dayKey(u.created_at) === day).length,
    emails: sent.filter((e) => dayKey(e.created_at) === day).length,
    leads: (leads.data ?? []).filter((l) => dayKey(l.created_at) === day).length,
  }));

  const rows = users.map((u) => {
    const uid = u.id;
    return {
      ...u,
      leads: (leads.data ?? []).filter((l) => l.user_id === uid).length,
      sent: sent.filter((e) => e.user_id === uid).length,
      replies: replies.filter((e) => e.user_id === uid).length,
      revenue: (payments.data ?? [])
        .filter((p) => p.user_id === uid)
        .reduce((sum, p) => sum + Number(p.amount ?? 0), 0),
    };
  });

  return (
    <AppShell title="Admin panel" description="Platform-wide users, activity and revenue">
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total users" value={users.length} icon={Users} loading={loading} />
          <StatCard label="Pending plans" value={pendingRequests.length} icon={FileClock} tone="secondary" loading={loading} delay={60} />
          <StatCard label="Approved plans" value={(planRequests.data ?? []).filter((request) => request.status === "approved").length} icon={Check} tone="accent" loading={loading} delay={120} />
          <StatCard
            label="Total earnings"
            value={earnings}
            icon={DollarSign}
            tone="warning"
            decimals={2}
            suffix=" USD"
            loading={loading}
            delay={180}
          />
        </div>

        <Card className="shadow-card border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Plan approvals</CardTitle>
            <CardDescription>Paid-plan access remains locked until you approve the request.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>User</TableHead><TableHead>Plan</TableHead><TableHead>Price</TableHead><TableHead>Requested</TableHead><TableHead className="text-right">Decision</TableHead></TableRow></TableHeader>
              <TableBody>
                {pendingRequests.length === 0 ? <TableRow><TableCell colSpan={5} className="text-muted-foreground py-10 text-center">No plan requests waiting.</TableCell></TableRow> : pendingRequests.map((request) => {
                  const user = users.find((profile) => profile.id === request.user_id);
                  return <TableRow key={request.id}><TableCell className="font-medium">{user?.email ?? request.user_id}</TableCell><TableCell className="capitalize">{request.requested_plan}</TableCell><TableCell>${Number(request.amount_usd).toFixed(2)}</TableCell><TableCell>{new Date(request.created_at).toLocaleString()}</TableCell><TableCell><div className="flex justify-end gap-2"><Button size="sm" variant="outline" disabled={reviewPlan.isPending} onClick={() => reviewPlan.mutate({ id: request.id, approve: false })}><X className="size-4" />Reject</Button><Button size="sm" disabled={reviewPlan.isPending} onClick={() => reviewPlan.mutate({ id: request.id, approve: true })}><Check className="size-4" />Approve</Button></div></TableCell></TableRow>;
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="shadow-card border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Last 14 days</CardTitle>
            <CardDescription>Signups, leads imported and emails sent per day.</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ left: -20, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="adminSignups" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="adminEmails" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-secondary)" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="var(--color-secondary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--color-border)"
                  vertical={false}
                />
                <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={11} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area
                  type="monotone"
                  dataKey="signups"
                  stroke="var(--color-primary)"
                  fill="url(#adminSignups)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="emails"
                  stroke="var(--color-secondary)"
                  fill="url(#adminEmails)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="leads"
                  stroke="var(--color-accent)"
                  fill="transparent"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-card border-border/60">
          <CardHeader>
            <CardTitle className="text-base">All users</CardTitle>
            <CardDescription>Every signed-up account and their activity.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Leads</TableHead>
                  <TableHead className="text-right">Sent</TableHead>
                  <TableHead className="text-right">Replies</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead className="text-right">Email quota</TableHead>
                  <TableHead className="text-right">Monthly quota</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-muted-foreground py-10 text-center">
                      No users yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.email ?? "—"}</TableCell>
                      <TableCell>{r.full_name || "—"}</TableCell>
                      <TableCell>{new Date(r.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right tabular-nums">{r.leads}</TableCell>
                      <TableCell className="text-right tabular-nums">{r.sent}</TableCell>
                      <TableCell className="text-right tabular-nums">{r.replies}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        ${r.revenue.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={r.plan}
                          onValueChange={(plan: string) =>
                            planMutation.mutate({
                              id: r.id,
                              plan: plan as keyof typeof PLAN_LIMITS,
                            })
                          }
                        >
                          <SelectTrigger className="h-8 w-28 capitalize"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {Object.keys(PLAN_LIMITS).map((plan) => (
                              <SelectItem key={plan} value={plan} className="capitalize">{plan}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{r.monthly_email_quota}</TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          min={0}
                          max={100000}
                          className="ml-auto h-8 w-24 text-right tabular-nums"
                          defaultValue={r.monthly_lead_quota}
                          onBlur={(e) => {
                            const next = Number(e.target.value);
                            if (!Number.isFinite(next) || next < 0 || next === r.monthly_lead_quota)
                              return;
                            quotaMutation.mutate({ id: r.id, quota: Math.round(next) });
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="shadow-card border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Record a payment</CardTitle>
            <CardDescription>
              Log revenue against a user so total earnings stay accurate.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-3 sm:grid-cols-[1.5fr_0.7fr_1.5fr_auto]"
              onSubmit={(e) => {
                e.preventDefault();
                addPayment.mutate();
              }}
            >
              <div className="space-y-1.5">
                <Label htmlFor="payEmail">User email</Label>
                <Input
                  id="payEmail"
                  value={payEmail}
                  onChange={(e) => setPayEmail(e.target.value)}
                  placeholder="user@example.com"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="payAmount">Amount</Label>
                <Input
                  id="payAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  placeholder="49"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="payNote">Note</Label>
                <Input
                  id="payNote"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  placeholder="Pro plan — January"
                />
              </div>
              <div className="flex items-end">
                <Button type="submit" disabled={addPayment.isPending} className="w-full">
                  {addPayment.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                  Add
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
