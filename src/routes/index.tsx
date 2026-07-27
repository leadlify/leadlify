import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  Bot,
  CheckCircle2,
  Mail,
  Radar,
  Sparkles,
  Users,
} from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LeadForge — Find Leads & Send AI Cold Emails" },
      {
        name: "description",
        content:
          "Find local businesses that need a better website, audit them with AI, and send personalised cold emails from your own Gmail — all in one CRM.",
      },
      { property: "og:title", content: "LeadForge — Find Leads & Send AI Cold Emails" },
      {
        property: "og:description",
        content:
          "Find local businesses, audit their websites with AI, and send personalised cold emails from Gmail.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "LeadForge — Find Leads & Send AI Cold Emails" },
      {
        name: "twitter:description",
        content: "AI lead generation and cold email CRM for web design agencies and freelancers.",
      },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    icon: Radar,
    title: "Find real businesses",
    body: "Search any city and niche through Google Places and import verified businesses with websites, ratings and contact details in seconds.",
  },
  {
    icon: Bot,
    title: "AI website audits",
    body: "Every lead gets an automated audit — design, UX, SEO, speed and mobile — with concrete opportunities you can pitch.",
  },
  {
    icon: Mail,
    title: "Personalised cold emails",
    body: "Generate an email written around that specific business's problems, then send it straight from your own Gmail account.",
  },
  {
    icon: Users,
    title: "Pipeline that stays clean",
    body: "Track every lead from new to closed, with replies synced back from Gmail automatically.",
  },
  {
    icon: BarChart3,
    title: "Analytics that matter",
    body: "Reply rate, close rate, best-performing niches and audit score spread — see what is actually working.",
  },
  {
    icon: CheckCircle2,
    title: "No daily limits",
    body: "Search, audit and send as much as you want. Your Gmail, your pace, no artificial caps.",
  },
];

const STEPS = [
  { n: "01", t: "Create your account", d: "Sign up with your email in a few seconds." },
  { n: "02", t: "Search a niche and city", d: "Import a fresh batch of businesses instantly." },
  { n: "03", t: "Audit and generate", d: "Let AI grade each website and draft the pitch." },
  { n: "04", t: "Send and track", d: "Fire the email from Gmail and watch the replies land." },
];

function Landing() {
  return (
    <div className="bg-background min-h-screen">
      <header className="border-border/60 bg-background/80 sticky top-0 z-30 border-b backdrop-blur-lg">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3.5 sm:px-6">
          <span className="bg-gradient-brand grid size-9 place-items-center rounded-xl shadow-glow">
            <Sparkles className="text-primary-foreground size-4.5" />
          </span>
          <p className="text-foreground flex-1 text-sm font-semibold tracking-tight">LeadForge</p>
          <ThemeToggle />
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link to="/auth">Sign in</Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/auth" search={{ mode: "signup" }}>
              Get started
            </Link>
          </Button>
        </div>
      </header>

      <main>
        <section className="bg-gradient-surface relative overflow-hidden">
          <div className="animate-fade-up mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 sm:py-28">
            <span className="border-border/60 bg-card/70 text-muted-foreground inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium">
              <Sparkles className="text-primary size-3.5" />
              AI lead generation + cold email CRM
            </span>
            <h1 className="text-foreground mt-6 text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
              Turn local businesses with bad websites into paying clients
            </h1>
            <p className="text-muted-foreground mx-auto mt-5 max-w-xl text-base sm:text-lg">
              LeadForge finds the businesses, grades their websites with AI, writes the cold email
              for you, and sends it from your own Gmail. One workspace, no daily limits.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg">
                <Link to="/auth" search={{ mode: "signup" }}>
                  Create free account <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/auth">I already have an account</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <h2 className="text-foreground text-center text-2xl font-semibold tracking-tight sm:text-3xl">
            Everything the outreach needs, in one place
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <Card
                key={f.title}
                className="animate-fade-up shadow-card border-border/60 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-elevated"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <CardContent className="space-y-3 p-6">
                  <span className="bg-primary/10 text-primary grid size-10 place-items-center rounded-xl">
                    <f.icon className="size-5" />
                  </span>
                  <h3 className="text-foreground font-semibold">{f.title}</h3>
                  <p className="text-muted-foreground text-sm">{f.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="border-border/60 bg-card/40 border-y">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <h2 className="text-foreground text-center text-2xl font-semibold tracking-tight sm:text-3xl">
              How it works
            </h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((s) => (
                <div key={s.n} className="space-y-2">
                  <p className="text-primary text-sm font-semibold tracking-widest">{s.n}</p>
                  <h3 className="text-foreground font-medium">{s.t}</h3>
                  <p className="text-muted-foreground text-sm">{s.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
          <h2 className="text-foreground text-2xl font-semibold tracking-tight sm:text-3xl">
            Start sending better cold emails today
          </h2>
          <p className="text-muted-foreground mx-auto mt-3 max-w-lg text-sm sm:text-base">
            Sign up, connect your inbox and run your first search in under five minutes.
          </p>
          <Button asChild size="lg" className="mt-7">
            <Link to="/auth" search={{ mode: "signup" }}>
              Get started free <ArrowRight className="size-4" />
            </Link>
          </Button>
        </section>
      </main>

      <footer className="border-border/60 border-t">
        <div className="text-muted-foreground mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-xs sm:flex-row sm:px-6">
          <p>© {new Date().getFullYear()} LeadForge. All rights reserved.</p>
          <Link to="/auth" className="hover:text-foreground transition-colors">
            Sign in
          </Link>
        </div>
      </footer>
    </div>
  );
}
