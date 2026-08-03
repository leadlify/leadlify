import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Clock3, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { errorMessage } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/plans")({
  head: () => ({ meta: [
    { title: "Plans — Leadlify" },
    { name: "description", content: "Choose a Leadlify plan and submit it for admin activation." },
    { name: "robots", content: "noindex" },
    { property: "og:title", content: "Plans — Leadlify" },
    { property: "og:description", content: "Choose a Leadlify plan and submit it for admin activation." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: PlansPage,
});

const PLANS = [
  { id: "starter", name: "Starter", price: 32, leads: "250 leads / month", description: "For focused solo outreach" },
  { id: "growth", name: "Growth", price: 45, leads: "1,000 leads / month", description: "For consistent client acquisition", featured: true },
  { id: "agency", name: "Agency", price: 70, leads: "5,000 leads / month", description: "For high-volume prospecting" },
] as const;

function PlansPage() {
  const queryClient = useQueryClient();
  const account = useQuery({
    queryKey: ["my-plan-and-requests"],
    queryFn: async () => {
      const [{ data: profile, error: profileError }, { data: requests, error: requestError }, { data: auth }] = await Promise.all([
        supabase.from("profiles").select("plan, monthly_lead_quota, website_builder_enabled").maybeSingle(),
        supabase.from("plan_requests").select("*").order("created_at", { ascending: false }),
        supabase.auth.getUser(),
      ]);
      if (profileError) throw new Error(profileError.message);
      if (requestError) throw new Error(requestError.message);
      return { profile, requests: requests ?? [], userId: auth.user?.id };
    },
  });
  const pending = account.data?.requests.find((request) => request.status === "pending");

  const requestPlan = useMutation({
    mutationFn: async (plan: (typeof PLANS)[number]) => {
      if (!account.data?.userId) throw new Error("Your session expired — sign in again.");
      const { error } = await supabase.from("plan_requests").insert({
        user_id: account.data.userId,
        requested_plan: plan.id,
        amount_usd: plan.price,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-plan-and-requests"] });
      toast.success("Plan request sent to admin for approval");
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  return (
    <AppShell title="Plans" description="Choose a plan; access starts after admin approval">
      <div className="space-y-6">
        <Card className="border-border/60 shadow-card">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
            <div>
              <p className="text-muted-foreground text-xs font-medium uppercase">Current plan</p>
              <p className="text-foreground mt-1 text-xl font-semibold capitalize">{account.data?.profile?.plan ?? "Free"}</p>
            </div>
            {pending ? (
              <div className="border-warning/30 bg-warning/10 text-warning flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                <Clock3 className="size-4" /> {pending.requested_plan} approval pending
              </div>
            ) : null}
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <Card key={plan.id} className={plan.featured ? "border-primary shadow-elevated" : "border-border/60 shadow-card"}>
              <CardHeader><CardTitle>{plan.name}</CardTitle><CardDescription>{plan.description}</CardDescription></CardHeader>
              <CardContent className="space-y-5">
                <p className="text-foreground text-4xl font-semibold">${plan.price}<span className="text-muted-foreground text-sm font-normal"> / month</span></p>
                <ul className="space-y-2 text-sm">
                  {[plan.leads, "AI website audits", "AI cold email drafts", "Professional demo website builder"].map((feature) => (
                    <li key={feature} className="flex items-center gap-2"><CheckCircle2 className="text-accent size-4" />{feature}</li>
                  ))}
                </ul>
                <Button className="w-full" variant={plan.featured ? "default" : "outline"} disabled={Boolean(pending) || requestPlan.isPending} onClick={() => requestPlan.mutate(plan)}>
                  {requestPlan.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                  {pending ? "Approval pending" : "Request this plan"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="text-muted-foreground text-center text-xs">Submitting a request does not activate access immediately. Admin approval is required.</p>
      </div>
    </AppShell>
  );
}