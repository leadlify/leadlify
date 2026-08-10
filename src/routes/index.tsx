import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  Bot,
  Check,
  CheckCircle2,
  Compass,
  Gauge,
  Globe2,
  Mail,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Wand2,
  X,
} from "lucide-react";

import { PublicFooter, PublicHeader } from "@/components/public-site";
import { Button } from "@/components/ui/button";

const SITE = "https://leadlify.lovable.app";

const faqs: [string, string][] = [
  [
    "What is Leadlify?",
    "Leadlify is an AI lead generation and cold email tool for web designers and agencies. It finds local businesses in any country, checks whether they have a website, audits their online presence, and writes a personalized outreach draft for each lead.",
  ],
  [
    "Where does Leadlify find business leads?",
    "Leadlify searches live Google Places business listings. You pick a country, city, niche, keyword, and radius, and Leadlify imports matching businesses with their public contact details into your pipeline.",
  ],
  [
    "Can I find businesses without a website?",
    "Yes. Turn on the no-website filter and Leadlify keeps only businesses whose listing has no website — the strongest prospects for a web design pitch.",
  ],
  [
    "Does Leadlify work outside my country?",
    "Yes. Choose any country from the country selector and the search is anchored to that market, so you can prospect internationally from anywhere.",
  ],
  [
    "Does Leadlify send emails for me?",
    "No. Leadlify creates a personalized cold email draft that you copy into your own email client, so sending and replies stay fully under your control.",
  ],
  [
    "What is included in the free account?",
    "New accounts include 10 lead imports and 2 email drafts. The demo website builder unlocks on approved paid plans.",
  ],
  [
    "How are paid plans activated?",
    "Pick a plan inside the app and your request is submitted for review. Once approved, the matching lead limits, draft limits, and website builder are activated in your workspace.",
  ],
];

const features = [
  {
    icon: MapPin,
    title: "No-website discovery",
    text: "Search live business listings in any country and isolate the companies that have no website at all.",
    tag: "Discovery",
  },
  {
    icon: Bot,
    title: "AI opportunity audits",
    text: "Speed, mobile, SSL, SEO and design signals turned into a plain-language reason to reach out.",
    tag: "Analysis",
  },
  {
    icon: Mail,
    title: "Personalized cold email drafts",
    text: "Each draft is grounded in the real details of the business — no interchangeable templates.",
    tag: "Outreach",
  },
  {
    icon: Wand2,
    title: "Instant demo websites",
    text: "Generate a polished demo site from the business profile and attach the link to your pitch.",
    tag: "Proof",
  },
  {
    icon: BarChart3,
    title: "One focused pipeline",
    text: "Track every lead from discovery to contacted, replied, interested, closed or lost.",
    tag: "Pipeline",
  },
  {
    icon: Globe2,
    title: "International by default",
    text: "Choose the country first, then narrow by city and radius — results follow your market, not your location.",
    tag: "Global",
  },
];

const niches = [
  "Dentists",
  "Restaurants",
  "Law firms",
  "Gyms",
  "Plumbers",
  "Salons",
  "Real estate",
  "Clinics",
  "Cafés",
  "Car dealers",
  "Photographers",
  "Contractors",
];

const audiences = [
  {
    icon: Compass,
    title: "Freelance web designers",
    text: "Fill a quiet week with businesses that visibly need a site, not cold lists bought from a broker.",
  },
  {
    icon: Target,
    title: "Small studios & agencies",
    text: "Give your team a repeatable prospecting motion with audits and drafts already prepared.",
  },
  {
    icon: Gauge,
    title: "Growth & sales freelancers",
    text: "Research once, pitch with context, and keep every conversation and outcome in one workspace.",
  },
];

const steps: [typeof Search, string, string][] = [
  [Search, "Choose the market", "Select the country, then the city, niche, keyword and radius."],
  [ShieldCheck, "Qualify the opportunity", "Filter for no website, or audit an existing one automatically."],
  [Mail, "Create a relevant draft", "AI writes outreach from real weaknesses, not generic filler."],
  [BarChart3, "Move the lead forward", "Copy the draft, send it your way, and track each outcome."],
];

const plans = [
  {
    name: "Starter",
    price: 32,
    note: "For focused solo outreach",
    items: ["250 leads per month", "AI audits and drafts", "Demo website builder", "Full pipeline & CSV export"],
  },
  {
    name: "Growth",
    price: 45,
    note: "For consistent acquisition",
    items: ["1,000 leads per month", "AI audits and drafts", "Demo website builder", "Priority support"],
    featured: true,
  },
  {
    name: "Agency",
    price: 70,
    note: "For high-volume prospecting",
    items: ["5,000 leads per month", "AI audits and drafts", "Demo website builder", "Multi-market prospecting"],
  },
];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Leadlify — AI Lead Generation & Cold Email Tool" },
      {
        name: "description",
        content:
          "Leadlify finds local businesses with no website in any country, audits their online presence, and writes personalized cold email drafts. Start free with 10 leads.",
      },
      {
        name: "keywords",
        content:
          "leadlify, lead generation software, find business leads, businesses without a website, cold email tool, AI cold email, web design leads, local business leads",
      },
      { property: "og:title", content: "Leadlify — AI Lead Generation & Cold Email Tool" },
      {
        property: "og:description",
        content:
          "Find local businesses that need a website, audit them instantly, and send personalized outreach that actually earns replies.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: SITE },
      { property: "og:site_name", content: "Leadlify" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: SITE }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              "@id": `${SITE}/#organization`,
              name: "Leadlify",
              url: SITE,
              description:
                "AI lead generation and cold email workspace for web designers, freelancers and agencies.",
              sameAs: ["https://www.instagram.com/leadlify.ai/"],
            },
            {
              "@type": "WebSite",
              "@id": `${SITE}/#website`,
              url: SITE,
              name: "Leadlify",
              publisher: { "@id": `${SITE}/#organization` },
            },
            {
              "@type": "SoftwareApplication",
              name: "Leadlify",
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web",
              url: SITE,
              description:
                "Find local businesses without a website, audit their web presence, and generate personalized cold email drafts.",
              offers: plans.map((plan) => ({
                "@type": "Offer",
                name: `${plan.name} plan`,
                price: plan.price,
                priceCurrency: "USD",
              })),
            },
            {
              "@type": "FAQPage",
              mainEntity: faqs.map(([question, answer]) => ({
                "@type": "Question",
                name: question,
                acceptedAnswer: { "@type": "Answer", text: answer },
              })),
            },
          ],
        }),
      },
    ],
  }),
  component: Landing,
});

function ProductPreview() {
  return (
    <div className="border-public-border bg-public-raised animate-fade-up shadow-public relative mx-auto mt-16 max-w-6xl overflow-hidden rounded-xl border p-2">
      <div className="public-card-sheen border-public-border bg-public-soft rounded-lg border">
        <div className="border-public-border flex h-11 items-center gap-2 border-b px-4">
          <span className="bg-public-border size-2 rounded-full" />
          <span className="bg-public-border size-2 rounded-full" />
          <span className="bg-public-border size-2 rounded-full" />
          <span className="text-public-muted ml-3 truncate text-xs">
            Lead discovery / United Kingdom / Manchester / Dentist
          </span>
          <span className="text-public-muted ml-auto hidden items-center gap-2 text-[10px] sm:flex">
            <span className="relative grid size-2 place-items-center">
              <span className="bg-public-foreground/60 animate-pulse-ring absolute inset-0 rounded-full" />
              <span className="bg-public-foreground size-1.5 rounded-full" />
            </span>
            LIVE
          </span>
        </div>
        <div className="grid min-h-80 md:grid-cols-[200px_1fr]">
          <aside className="border-public-border hidden border-r p-4 md:block">
            {["Overview", "Find leads", "Pipeline", "Drafts", "Analytics"].map((item, index) => (
              <div
                key={item}
                className={`mb-2 rounded px-3 py-2 text-xs transition-colors ${
                  index === 1 ? "bg-public-foreground text-public" : "text-public-muted"
                }`}
              >
                {item}
              </div>
            ))}
            <div className="border-public-border mt-6 rounded-md border p-3">
              <p className="text-public-muted text-[10px] uppercase tracking-wider">Quota</p>
              <div className="bg-public-border mt-2 h-1 rounded-full">
                <div className="bg-public-foreground h-1 w-2/3 rounded-full" />
              </div>
              <p className="text-public-muted mt-2 text-[10px]">33 leads remaining</p>
            </div>
          </aside>
          <div className="p-4 sm:p-6">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-public-muted text-xs tracking-widest">LIVE SEARCH RESULTS</p>
                <p className="text-public-foreground font-heading mt-1 text-lg font-semibold">
                  Businesses ready to pitch
                </p>
              </div>
              <span className="text-public-muted text-xs">50 results</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ["Atlas Dental Studio", "NO WEBSITE", "4.8"],
                ["Northline Café", "WEAK SITE", "4.6"],
                ["Horizon Fitness", "NO WEBSITE", "4.9"],
              ].map(([name, badge, rating], index) => (
                <div
                  key={name}
                  className="border-public-border bg-public hover:border-public-foreground/40 rounded-lg border p-4 transition-colors"
                  style={{ animationDelay: `${index * 90}ms` }}
                >
                  <div className="mb-5 flex items-center justify-between">
                    <span className="bg-public-raised border-public-border grid size-8 place-items-center rounded border">
                      <Globe2 className="text-public-muted size-4" />
                    </span>
                    <span className="border-public-border text-public-muted rounded-full border px-2 py-0.5 text-[10px]">
                      {badge}
                    </span>
                  </div>
                  <p className="text-public-foreground text-sm font-medium">{name}</p>
                  <p className="text-public-muted mt-1 flex items-center gap-1 text-xs">
                    <Star className="size-3" /> {rating} · high-fit opportunity
                  </p>
                  <div className="bg-public-border mt-4 h-px" />
                  <p className="text-public-foreground mt-3 text-xs">Generate outreach →</p>
                </div>
              ))}
            </div>
            <div className="border-public-border bg-public mt-3 rounded-lg border p-4">
              <p className="text-public-muted text-[10px] uppercase tracking-widest">AI draft preview</p>
              <p className="text-public-foreground mt-2 text-sm leading-6">
                “Hi Atlas Dental Studio — I noticed your practice has excellent reviews but no website yet.
                I built a quick demo of how a booking-ready site could look…”
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Landing() {
  return (
    <div className="public-theme bg-public text-public-foreground font-body min-h-screen">
      <PublicHeader />
      <main>
        {/* Hero */}
        <section className="public-hero-grid relative overflow-hidden px-5 pt-20 pb-14 text-center sm:px-8 sm:pt-28">
          <div className="public-glow pointer-events-none absolute inset-x-0 top-0 h-[520px]" />
          <div className="animate-fade-up relative mx-auto max-w-5xl">
            <p className="border-public-border bg-public-raised/70 text-public-muted mb-8 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium backdrop-blur">
              <Sparkles className="size-3.5" /> AI lead generation for web designers
            </p>
            <h1 className="public-silver-text font-heading text-4xl font-semibold leading-[1.06] sm:text-6xl lg:text-7xl">
              Find local businesses
              <br className="hidden sm:block" /> that still need a website.
            </h1>
            <p className="text-public-muted mx-auto mt-7 max-w-2xl text-base leading-7 sm:text-lg">
              Leadlify searches live business listings in any country, flags the ones with no website or a
              weak one, and writes a personalized cold email draft for each opportunity.
            </p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="bg-public-foreground text-public hover:bg-public-foreground/90 h-12 px-7"
              >
                <Link to="/auth" search={{ mode: "signup" }}>
                  Start with 10 free leads <ArrowRight />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-public-border bg-public-raised text-public-foreground hover:bg-public-soft h-12 px-7"
              >
                <a href="#how">See how it works</a>
              </Button>
            </div>
            <div className="text-public-muted mt-6 flex flex-wrap justify-center gap-5 text-xs">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5" /> No credit card
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="size-3.5" /> Draft-only outreach
              </span>
              <span className="flex items-center gap-1.5">
                <Globe2 className="size-3.5" /> Search any country
              </span>
            </div>
          </div>
          <ProductPreview />
        </section>

        {/* Niche marquee */}
        <section className="border-public-border overflow-hidden border-y py-5" aria-hidden="true">
          <div className="animate-marquee flex w-max gap-10 pr-10">
            {[...niches, ...niches].map((niche, index) => (
              <span
                key={`${niche}-${index}`}
                className="text-public-muted font-heading flex items-center gap-10 text-sm whitespace-nowrap"
              >
                {niche}
                <span className="bg-public-border size-1 rounded-full" />
              </span>
            ))}
          </div>
        </section>

        {/* Stats */}
        <section className="border-public-border border-b">
          <div className="divide-public-border mx-auto grid max-w-7xl grid-cols-2 divide-x sm:grid-cols-4">
            {[
              ["50", "leads per search"],
              ["68+", "countries searchable"],
              ["10", "free lead imports"],
              ["6", "audit dimensions"],
            ].map(([value, label]) => (
              <div
                key={label}
                className="border-public-border px-5 py-9 text-center max-sm:even:border-l max-sm:nth-[n+3]:border-t"
              >
                <p className="public-silver-text font-heading text-3xl font-semibold sm:text-4xl">{value}</p>
                <p className="text-public-muted mt-1 text-xs">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section id="features" className="defer-section px-5 py-24 sm:px-8 sm:py-32">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <p className="text-public-muted text-xs font-semibold tracking-widest uppercase">
                A better prospecting rhythm
              </p>
              <h2 className="font-heading mt-5 text-3xl font-semibold sm:text-5xl">
                Less list-building.
                <br />
                More reasons to reach out.
              </h2>
              <p className="text-public-muted mt-5 max-w-xl leading-7">
                Everything you need to go from an empty pipeline to a well-argued pitch — in one workspace.
              </p>
            </div>
            <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {features.map(({ icon: Icon, title, text, tag }) => (
                <article
                  key={title}
                  className="public-card-sheen border-public-border bg-public-raised/50 hover:border-public-foreground/35 hover:bg-public-raised group rounded-xl border p-7 transition-all duration-300"
                >
                  <div className="flex items-center justify-between">
                    <span className="border-public-border bg-public grid size-10 place-items-center rounded-lg border">
                      <Icon className="text-public-foreground size-4" />
                    </span>
                    <span className="text-public-muted text-[10px] tracking-widest uppercase">{tag}</span>
                  </div>
                  <h3 className="font-heading mt-7 text-lg font-semibold">{title}</h3>
                  <p className="text-public-muted mt-3 text-sm leading-6">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section
          id="how"
          className="border-public-border bg-public-soft border-y px-5 py-24 sm:px-8 sm:py-32"
        >
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-14 lg:grid-cols-[.8fr_1.2fr]">
              <div className="lg:sticky lg:top-28 lg:self-start">
                <p className="text-public-muted text-xs font-semibold tracking-widest uppercase">
                  From search to conversation
                </p>
                <h2 className="font-heading mt-5 text-3xl font-semibold sm:text-5xl">
                  One precise workflow.
                </h2>
                <p className="text-public-muted mt-5 max-w-md leading-7">
                  Choose the market. Find the opportunity. Build a pitch around what the business actually
                  needs.
                </p>
                <Button
                  asChild
                  className="bg-public-foreground text-public hover:bg-public-foreground/90 mt-8"
                >
                  <Link to="/auth" search={{ mode: "signup" }}>
                    Try it free <ArrowRight />
                  </Link>
                </Button>
              </div>
              <ol className="border-public-border border-t">
                {steps.map(([StepIcon, title, text], index) => (
                  <li
                    key={title}
                    className="border-public-border hover:bg-public/40 grid grid-cols-[46px_1fr] gap-4 border-b py-7 transition-colors"
                  >
                    <span className="text-public-muted font-heading text-sm">0{index + 1}</span>
                    <div>
                      <StepIcon className="text-public-muted mb-3 size-4" />
                      <h3 className="font-heading font-semibold">{title}</h3>
                      <p className="text-public-muted mt-1 text-sm leading-6">{text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* Who it's for */}
        <section className="defer-section px-5 py-24 sm:px-8 sm:py-32">
          <div className="mx-auto max-w-7xl">
            <div className="mb-14 max-w-2xl">
              <p className="text-public-muted text-xs font-semibold tracking-widest uppercase">Built for</p>
              <h2 className="font-heading mt-5 text-3xl font-semibold sm:text-5xl">
                People who sell websites.
              </h2>
            </div>
            <div className="border-public-border bg-public-border grid gap-px overflow-hidden rounded-xl border md:grid-cols-3">
              {audiences.map(({ icon: Icon, title, text }) => (
                <article key={title} className="bg-public hover:bg-public-raised/60 p-8 transition-colors">
                  <Icon className="text-public-muted size-5" />
                  <h3 className="font-heading mt-7 text-lg font-semibold">{title}</h3>
                  <p className="text-public-muted mt-3 text-sm leading-6">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Comparison */}
        <section className="defer-section border-public-border bg-public-soft border-y px-5 py-24 sm:px-8 sm:py-32">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 text-center">
              <p className="text-public-muted text-xs font-semibold tracking-widest uppercase">
                The Leadlify difference
              </p>
              <h2 className="font-heading mt-5 text-3xl font-semibold sm:text-5xl">
                Prospecting without the guesswork.
              </h2>
            </div>
            <div className="border-public-border grid overflow-hidden rounded-xl border md:grid-cols-2">
              <div className="bg-public p-7 sm:p-10">
                <p className="text-public-muted text-xs font-semibold tracking-widest uppercase">
                  Traditional outreach
                </p>
                <ul className="text-public-muted mt-8 space-y-5 text-sm">
                  {[
                    "Manual searching and spreadsheet cleanup",
                    "Guessing which business needs a new website",
                    "Generic drafts with no useful context",
                    "No proof to show before the first call",
                  ].map((item) => (
                    <li key={item} className="flex gap-3">
                      <X className="size-4 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="public-card-sheen border-public-border bg-public-raised border-t p-7 sm:p-10 md:border-t-0 md:border-l">
                <p className="text-public-foreground text-xs font-semibold tracking-widest uppercase">
                  The Leadlify way
                </p>
                <ul className="mt-8 space-y-5 text-sm">
                  {[
                    "Live business discovery in the country you choose",
                    "Clear no-website and weak-site opportunities",
                    "Personalized AI drafts based on real details",
                    "A generated demo site to attach to your pitch",
                  ].map((item) => (
                    <li key={item} className="flex gap-3">
                      <Check className="size-4 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="defer-section px-5 py-24 sm:px-8 sm:py-32">
          <div className="mx-auto max-w-7xl">
            <div className="text-center">
              <p className="text-public-muted text-xs font-semibold tracking-widest uppercase">
                Simple monthly pricing
              </p>
              <h2 className="font-heading mt-5 text-3xl font-semibold sm:text-5xl">
                Choose your outreach pace.
              </h2>
              <p className="text-public-muted mt-4">
                Start free with 10 leads and 2 drafts. Paid plans activate after approval.
              </p>
            </div>
            <div className="mt-14 grid gap-4 lg:grid-cols-3">
              {plans.map((plan) => (
                <article
                  key={plan.name}
                  className={`relative flex min-h-96 flex-col overflow-hidden rounded-xl border p-7 transition-transform duration-300 ${
                    plan.featured
                      ? "border-public-foreground bg-public-raised public-card-sheen lg:-translate-y-3"
                      : "border-public-border bg-public hover:border-public-foreground/35"
                  }`}
                >
                  {plan.featured ? (
                    <span className="bg-public-foreground text-public absolute top-0 right-6 px-3 py-1 text-[10px] font-bold uppercase">
                      Most popular
                    </span>
                  ) : null}
                  <p className="text-public-muted text-sm">{plan.name}</p>
                  <p className="font-heading mt-4 text-4xl font-semibold">
                    ${plan.price}
                    <span className="text-public-muted text-sm font-normal"> / month</span>
                  </p>
                  <p className="text-public-muted mt-2 text-sm">{plan.note}</p>
                  <ul className="mt-8 flex-1 space-y-4 text-sm">
                    {plan.items.map((item) => (
                      <li key={item} className="flex gap-3">
                        <Check className="size-4 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Button
                    asChild
                    className={`mt-8 w-full ${
                      plan.featured
                        ? "bg-public-foreground text-public hover:bg-public-foreground/90"
                        : "border-public-border bg-public-raised text-public-foreground hover:bg-public-soft"
                    }`}
                    variant={plan.featured ? "default" : "outline"}
                  >
                    <Link to="/auth" search={{ mode: "signup" }}>
                      Choose {plan.name}
                    </Link>
                  </Button>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section
          id="faq"
          className="border-public-border bg-public-soft border-y px-5 py-24 sm:px-8 sm:py-32"
        >
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[.7fr_1.3fr]">
            <div>
              <p className="text-public-muted text-xs font-semibold tracking-widest uppercase">FAQ</p>
              <h2 className="font-heading mt-5 text-3xl font-semibold sm:text-5xl">
                Good questions.
                <br />
                Clear answers.
              </h2>
            </div>
            <div className="border-public-border border-t">
              {faqs.map(([question, answer]) => (
                <details key={question} className="group border-public-border border-b">
                  <summary className="font-heading flex cursor-pointer list-none items-center justify-between gap-6 py-6 font-semibold">
                    <span>{question}</span>
                    <span className="text-public-muted text-xl transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="text-public-muted max-w-2xl pb-6 text-sm leading-6">{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="defer-section public-hero-grid relative overflow-hidden px-5 py-24 text-center sm:px-8 sm:py-32">
          <div className="public-glow pointer-events-none absolute inset-0" />
          <div className="relative mx-auto max-w-3xl">
            <span className="border-public-border bg-public-raised animate-float mx-auto mb-8 grid size-12 place-items-center rounded-xl border">
              <Sparkles className="size-5" />
            </span>
            <h2 className="public-silver-text font-heading text-3xl font-semibold sm:text-5xl">
              Your next client may not have a website yet.
            </h2>
            <p className="text-public-muted mx-auto mt-5 max-w-xl leading-7">
              Find the opportunity before someone else does. Your first 10 lead imports are free.
            </p>
            <Button
              asChild
              size="lg"
              className="bg-public-foreground text-public hover:bg-public-foreground/90 mt-8 h-12 px-7"
            >
              <Link to="/auth" search={{ mode: "signup" }}>
                Start finding leads <ArrowRight />
              </Link>
            </Button>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
