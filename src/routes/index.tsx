import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  Bot,
  CheckCircle2,
  Clock,
  Globe2,
  Instagram,
  Mail,
  MapPin,
  Radar,
  Shield,
  Sparkles,
  Star,
  Users,
  MessageCircle,
  Zap,
} from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Leadlify — Find Businesses With No Website" },
      {
        name: "description",
        content:
          "Find local businesses with no website or a bad one, audit them with AI, and generate personalised AI cold email drafts — all inside one lightweight CRM.",
      },
      { property: "og:title", content: "Leadlify — Find Leads & Send AI Cold Emails" },
      {
        property: "og:description",
        content:
          "Find local businesses with no website, audit them with AI, and generate personalised AI cold email drafts.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Leadlify — Find Leads & Send AI Cold Emails" },
      {
        name: "twitter:description",
        content: "AI lead generation and cold email CRM for web designers and agencies.",
      },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    icon: MapPin,
    title: "Businesses with no website",
    body: "Flip one switch and Leadlify only imports businesses that have no website at all — the easiest web design pitch there is.",
  },
  {
    icon: Radar,
    title: "Up to 50 leads per search",
    body: "Pick a city, a niche and a radius. Real Google Places data with ratings, reviews, phone numbers and addresses, deduplicated automatically.",
  },
  {
    icon: Bot,
    title: "AI website audits",
    body: "Each lead with a site gets graded on design, UX, SEO, speed and mobile, with concrete opportunities written in plain language.",
  },
  {
    icon: Mail,
    title: "AI-powered cold email drafts",
    body: "AI writes an email around that specific business's problems, giving you a high-converting draft ready to copy and send.",
  },
  {
    icon: Users,
    title: "A pipeline that stays clean",
    body: "New, contacted, replied, interested, closed. Track status from new to closed and keep your pipeline organized.",
  },
  {
    icon: BarChart3,
    title: "Analytics that matter",
    body: "Reply rate, close rate, best-performing niches and audit score spread — see exactly which outreach is working.",
  },
];

const STEPS = [
  {
    n: "01",
    t: "Create your account",
    d: "Sign up with your email and start finding leads in a couple of clicks.",
  },
  {
    n: "02",
    t: "Search a niche and city",
    d: "Choose the business type, location and radius — optionally only ones with no website.",
  },
  {
    n: "03",
    t: "Audit and generate",
    d: "AI grades the site and drafts a personalised pitch referencing real problems.",
  },
  {
    n: "04",
    t: "Send and track",
    d: "Copy the AI draft to your email client and track the progress in your pipeline.",
  },
];

const STATS = [
  { value: "50", label: "leads per search" },
  { value: "6", label: "audit scores per site" },
  { value: "0", label: "daily sending limits" },
  { value: "1", label: "workspace for everything" },
];

const AUDIENCE = [
  {
    icon: Globe2,
    title: "Freelance web designers",
    body: "Fill your week with local businesses that genuinely need a site, not cold lists bought from a broker.",
  },
  {
    icon: Zap,
    title: "Small agencies",
    body: "Give your team one shared, repeatable outreach motion with tracking on every single email.",
  },
  {
    icon: Clock,
    title: "Side-hustlers",
    body: "Run one search, send ten emails, and get back to building. The whole loop takes minutes.",
  },
];

const FAQ = [
  {
    q: "Where do the leads come from?",
    a: "Live Google Places data. You choose the country, city, business type, keyword and radius, and Leadlify imports up to 50 matching businesses with their rating, review count, phone, address and website (or lack of one).",
  },
  {
    q: "Can I only get businesses without a website?",
    a: "Yes. There's a toggle on the search form. When it's on, Leadlify scans deeper through the results and keeps only businesses that have no website listed.",
  },
  {
    q: "Whose email account sends the outreach?",
    a: "Yours. You generate the draft in Leadlify and send it from your own email client. This keeps your deliverability high and replies in your control.",
  },
  {
    q: "Can I try Leadlify for free?",
    a: "Yes. Every new account includes 10 lead imports and 2 email sends. Demo website generation unlocks on any paid plan.",
  },
];

const PLANS = [
  {
    name: "Starter",
    price: 32,
    description: "For focused solo outreach",
    features: ["500 leads / month", "100 email sends / month", "AI audits & drafts", "Demo website builder"],
  },
  {
    name: "Growth",
    price: 45,
    description: "For consistent client acquisition",
    features: ["1,500 leads / month", "500 email sends / month", "AI audits & drafts", "Demo website builder"],
    featured: true,
  },
  {
    name: "Agency",
    price: 70,
    description: "For high-volume prospecting",
    features: ["5,000 leads / month", "2,000 email sends / month", "AI audits & drafts", "Demo website builder"],
  },
];

function Landing() {
  return (
    <div className="bg-background min-h-screen">
      <header className="border-border/60 bg-background/80 sticky top-0 z-30 border-b backdrop-blur-lg">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3.5 sm:px-6">
          <span className="bg-gradient-brand shadow-glow grid size-9 place-items-center rounded-xl">
            <Sparkles className="text-primary-foreground size-4.5" />
          </span>
          <p className="text-foreground text-sm font-semibold tracking-tight">Leadlify</p>
          <nav className="text-muted-foreground ml-6 hidden flex-1 items-center gap-6 text-sm md:flex">
            <a href="#features" className="hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#how" className="hover:text-foreground transition-colors">
              How it works
            </a>
            <a href="#pricing" className="hover:text-foreground transition-colors">
              Pricing
            </a>
            <a href="#faq" className="hover:text-foreground transition-colors">
              FAQ
            </a>
          </nav>
          <div className="flex flex-1 items-center justify-end gap-2 md:flex-none">
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
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="bg-gradient-surface relative overflow-hidden">
          <div
            aria-hidden
            className="bg-primary/20 pointer-events-none absolute -top-40 left-1/2 size-[38rem] -translate-x-1/2 rounded-full blur-3xl"
          />
          <div className="animate-fade-up relative mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 sm:py-28">
            <span className="border-border/60 bg-card/70 text-muted-foreground inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium">
              <Sparkles className="text-primary size-3.5" />
              AI lead generation + cold email CRM
            </span>
            <h1 className="text-foreground mt-6 text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
              Find the businesses with <span className="text-primary">no website</span> — and win
              them as clients
            </h1>
            <p className="text-muted-foreground mx-auto mt-5 max-w-xl text-base text-pretty sm:text-lg">
              Leadlify finds up to 50 local businesses per search, grades their web presence with AI,
              writes the cold email, and gives you a ready-to-send draft.
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
            <div className="text-muted-foreground mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="text-primary size-3.5" /> No credit card
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Shield className="text-primary size-3.5" /> Privacy focused
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Star className="text-primary size-3.5" /> Real Google Places data
              </span>
            </div>
          </div>

          <div className="border-border/60 relative mx-auto grid max-w-5xl grid-cols-2 gap-px border-t sm:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="bg-card/30 px-4 py-6 text-center">
                <p className="text-foreground text-3xl font-semibold tracking-tight tabular-nums">
                  {s.value}
                </p>
                <p className="text-muted-foreground mt-1 text-xs">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Problem / solution */}
        <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="shadow-card border-border/60">
              <CardContent className="space-y-3 p-6">
                <p className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
                  Without Leadlify
                </p>
                <ul className="text-muted-foreground space-y-2.5 text-sm">
                  <li>Hours scrolling Google Maps copying phone numbers into a spreadsheet</li>
                  <li>Guessing which businesses actually need a new website</li>
                  <li>Writing the same generic email over and over again</li>
                  <li>Losing track of who you contacted and who replied</li>
                </ul>
              </CardContent>
            </Card>
            <Card className="shadow-elevated border-primary/30 bg-primary/5">
              <CardContent className="space-y-3 p-6">
                <p className="text-primary text-xs font-semibold tracking-widest uppercase">
                  With Leadlify
                </p>
                <ul className="text-foreground space-y-2.5 text-sm">
                  <li className="flex gap-2">
                    <CheckCircle2 className="text-primary mt-0.5 size-4 shrink-0" />
                    One search imports 50 verified businesses in seconds
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="text-primary mt-0.5 size-4 shrink-0" />
                    Filter to only the ones with no website at all
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="text-primary mt-0.5 size-4 shrink-0" />
                    AI writes a pitch based on their real weaknesses
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="text-primary mt-0.5 size-4 shrink-0" />
                    Every send and reply tracked in one pipeline
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="pricing" className="border-border/60 bg-card/40 border-y">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-foreground text-2xl font-semibold sm:text-3xl">Simple monthly plans</h2>
              <p className="text-muted-foreground mt-3 text-sm sm:text-base">
                Start free with 10 leads and AI drafts. Upgrade when you are ready to scale.
              </p>
            </div>
            <div className="mt-10 grid gap-4 lg:grid-cols-3">
              {PLANS.map((plan) => (
                <Card key={plan.name} className={plan.featured ? "border-primary shadow-elevated" : "border-border/60 shadow-card"}>
                  <CardContent className="p-6">
                    {plan.featured ? <p className="text-primary text-xs font-semibold uppercase">Most popular</p> : null}
                    <h3 className="text-foreground mt-2 text-lg font-semibold">{plan.name}</h3>
                    <p className="text-muted-foreground mt-1 text-sm">{plan.description}</p>
                    <p className="text-foreground mt-6 text-4xl font-semibold tabular-nums">
                      ${plan.price}<span className="text-muted-foreground text-sm font-normal"> / month</span>
                    </p>
                    <ul className="mt-6 space-y-3 text-sm">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2">
                          <CheckCircle2 className="text-accent size-4 shrink-0" /> {feature}
                        </li>
                      ))}
                    </ul>
                    <Button asChild className="mt-7 w-full" variant={plan.featured ? "default" : "outline"}>
                      <Link to="/auth" search={{ mode: "signup" }}>Start with {plan.name}</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-24">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-foreground text-2xl font-semibold tracking-tight sm:text-3xl">
              Everything the outreach needs, in one place
            </h2>
            <p className="text-muted-foreground mt-3 text-sm sm:text-base">
              From finding the business to closing the reply — no spreadsheets, no scraping tools,
              no separate mail merge.
            </p>
          </div>
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

        {/* How it works */}
        <section id="how" className="border-border/60 bg-card/40 border-y">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <h2 className="text-foreground text-center text-2xl font-semibold tracking-tight sm:text-3xl">
              How it works
            </h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((s) => (
                <div key={s.n} className="border-border/60 space-y-2 rounded-xl border p-5">
                  <p className="text-primary text-sm font-semibold tracking-widest">{s.n}</p>
                  <h3 className="text-foreground font-medium">{s.t}</h3>
                  <p className="text-muted-foreground text-sm">{s.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Who it's for */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <h2 className="text-foreground text-center text-2xl font-semibold tracking-tight sm:text-3xl">
            Built for people who sell websites
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {AUDIENCE.map((a) => (
              <Card key={a.title} className="shadow-card border-border/60">
                <CardContent className="space-y-3 p-6">
                  <span className="bg-secondary/15 text-secondary grid size-10 place-items-center rounded-xl">
                    <a.icon className="size-5" />
                  </span>
                  <h3 className="text-foreground font-semibold">{a.title}</h3>
                  <p className="text-muted-foreground text-sm">{a.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="border-border/60 bg-card/40 border-y">
          <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
            <h2 className="text-foreground text-center text-2xl font-semibold tracking-tight sm:text-3xl">
              Frequently asked questions
            </h2>
            <div className="mt-8 space-y-4">
              {FAQ.map((item) => (
                <div key={item.q} className="border-border/60 bg-card rounded-xl border p-5">
                  <h3 className="text-foreground font-medium">{item.q}</h3>
                  <p className="text-muted-foreground mt-2 text-sm">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
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
          <p>© {new Date().getFullYear()} Leadlify. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a href="https://www.instagram.com/leadlify.ai/" target="_blank" rel="noopener noreferrer" className="hover:text-foreground inline-flex items-center gap-1.5 transition-colors"><Instagram className="size-3.5" /> Instagram</a>
            <a href="https://wa.link/cuj4t2" target="_blank" rel="noopener noreferrer" className="hover:text-foreground inline-flex items-center gap-1.5 transition-colors"><MessageCircle className="size-3.5" /> Support</a>
            <Link to="/auth" className="hover:text-foreground transition-colors">Sign in</Link>
          </div>
        </div>
      </footer>
      <Button asChild size="icon" className="fixed right-5 bottom-5 z-40 size-12 rounded-full shadow-elevated" title="WhatsApp support">
        <a href="https://wa.link/cuj4t2" target="_blank" rel="noopener noreferrer" aria-label="Open WhatsApp support">
          <MessageCircle className="size-5" />
        </a>
      </Button>
    </div>
  );
}
