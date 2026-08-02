import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, ArrowLeft, CheckCircle2, Clock3, KeyRound } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getGmailOAuthDiagnostics } from "@/lib/gmail-connect.functions";
import { getGmailProfile } from "@/lib/outreach.functions";

export const Route = createFileRoute("/_authenticated/gmail-diagnostics")({
  head: () => ({
    meta: [
      { title: "Gmail Diagnostics — Leadlify" },
      { name: "description", content: "Review Gmail OAuth status, scopes and provider errors." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Gmail Diagnostics — Leadlify" },
      { property: "og:description", content: "Review Gmail OAuth status, scopes and provider errors." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: GmailDiagnosticsPage,
});

function GmailDiagnosticsPage() {
  const diagnosticsFn = useServerFn(getGmailOAuthDiagnostics);
  const profileFn = useServerFn(getGmailProfile);
  const diagnostics = useQuery({
    queryKey: ["gmail-oauth-diagnostics"],
    queryFn: () => diagnosticsFn({}),
    refetchInterval: 5000,
  });
  const profile = useQuery({ queryKey: ["gmail-profile"], queryFn: () => profileFn({}) });

  return (
    <AppShell
      title="Gmail diagnostics"
      description="The latest OAuth state reported by Google and the connector"
      actions={
        <Button asChild variant="outline" size="sm">
          <Link to="/settings"><ArrowLeft className="size-4" /> Settings</Link>
        </Button>
      }
    >
      <div className="grid max-w-4xl gap-6">
        {diagnostics.isLoading || profile.isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : profile.data?.connected ? (
          <Alert className="border-accent/30 bg-accent/10">
            <CheckCircle2 className="size-4 text-accent" />
            <AlertTitle>Gmail is connected</AlertTitle>
            <AlertDescription>{profile.data.email} is verified and ready to send.</AlertDescription>
          </Alert>
        ) : (
          <Alert variant="destructive">
            <AlertTriangle className="size-4" />
            <AlertTitle>Gmail is not connected</AlertTitle>
            <AlertDescription>{profile.data?.reason ?? "No verified Gmail connection was found."}</AlertDescription>
          </Alert>
        )}

        <Card className="border-border/60 shadow-card">
          <CardHeader>
            <CardTitle className="text-base">Latest OAuth attempt</CardTitle>
            <CardDescription>Updates automatically while a connection attempt is running.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            <Diagnostic label="Last step" icon={Clock3} value={diagnostics.data?.lastStep.replaceAll("_", " ") ?? "not started"} />
            <Diagnostic label="Last attempt" icon={Clock3} value={diagnostics.data?.lastAttemptAt ? new Date(diagnostics.data.lastAttemptAt).toLocaleString() : "No attempt recorded"} />
            <div className="sm:col-span-2">
              <p className="mb-2 flex items-center gap-2 text-sm font-medium"><KeyRound className="size-4 text-primary" /> Requested scopes</p>
              <div className="flex flex-wrap gap-2">
                {(diagnostics.data?.requestedScopes ?? []).map((scope) => (
                  <code key={scope} className="bg-muted rounded-md px-2 py-1 text-xs break-all">{scope}</code>
                ))}
              </div>
            </div>
            <div className="sm:col-span-2">
              <p className="mb-2 text-sm font-medium">Exact Google / connector error</p>
              <pre className="bg-muted min-h-20 overflow-auto rounded-md p-3 text-xs whitespace-pre-wrap break-words">
                {diagnostics.data?.lastError ?? "No OAuth error recorded."}
              </pre>
            </div>
            <div className="sm:col-span-2">
              <Button asChild><Link to="/settings">Force re-consent in Settings</Link></Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function Diagnostic({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Clock3 }) {
  return (
    <div className="border-border/60 rounded-md border p-4">
      <p className="text-muted-foreground flex items-center gap-2 text-xs"><Icon className="size-4" />{label}</p>
      <p className="mt-2 text-sm font-medium capitalize break-words">{value}</p>
    </div>
  );
}