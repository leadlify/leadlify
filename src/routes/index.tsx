import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BarChart3, Bot, Check, CheckCircle2, Globe2, Mail, MapPin, Search, ShieldCheck, Sparkles, X } from "lucide-react";

import { PublicFooter, PublicHeader } from "@/components/public-site";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Leadlify — AI Lead Generation for Web Designers" },
    { name: "description", content: "Find businesses with no website, audit their online presence, and create personalized AI cold email drafts with Leadlify." },
    { property: "og:title", content: "Leadlify — Turn Local Businesses Into Clients" },
    { property: "og:description", content: "Find high-intent leads, uncover website opportunities, and write personalized outreach." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Landing,
});

const features = [
  { icon: MapPin, title: "No-website discovery", text: "Search live business listings worldwide and isolate companies with no website listed." },
  { icon: Bot, title: "AI opportunity audits", text: "Turn a business profile or existing website into a clear, practical design opportunity." },
  { icon: Mail, title: "Personalized drafts", text: "Generate thoughtful cold email drafts grounded in the details of each business." },
  { icon: BarChart3, title: "Focused pipeline", text: "Track every lead from discovery to contact, reply, interest, and close in one place." },
];

const plans = [
  { name: "Starter", price: 32, note: "For focused solo outreach", items: ["250 leads per month", "AI audits and drafts", "Demo website builder"] },
  { name: "Growth", price: 45, note: "For consistent acquisition", items: ["1,000 leads per month", "AI audits and drafts", "Demo website builder"], featured: true },
  { name: "Agency", price: 70, note: "For high-volume prospecting", items: ["5,000 leads per month", "AI audits and drafts", "Demo website builder"] },
];

const faqs = [
  ["Where does Leadlify find businesses?", "Leadlify uses live Google Places data. Choose a country, city, niche, keyword, and radius to find relevant businesses with useful public listing details."],
  ["Can I find only businesses without a website?", "Yes. Turn on the no-website filter and Leadlify keeps businesses whose listing does not include a website."],
  ["Does Leadlify send emails for me?", "No. Leadlify creates a personalized draft that you copy into your preferred email client, so sending and replies stay under your control."],
  ["What is included in the free account?", "New accounts include 10 lead imports and 2 email drafts. The demo website builder is available on approved paid plans."],
  ["How are paid plans activated?", "After choosing a plan, your request is submitted for review. Once approved, the matching limits and website builder are activated in your workspace."],
];

function ProductPreview() {
  return (
    <div className="border-public-border bg-public-raised animate-fade-up relative mx-auto mt-14 max-w-6xl overflow-hidden rounded-lg border p-2 shadow-public">
      <div className="border-public-border bg-public-soft rounded-md border">
        <div className="border-public-border flex h-11 items-center gap-2 border-b px-4">
          <span className="bg-public-border size-2 rounded-full" /><span className="bg-public-border size-2 rounded-full" /><span className="bg-public-border size-2 rounded-full" />
          <span className="text-public-muted ml-3 text-xs">Lead discovery / Karachi / Web design opportunity</span>
        </div>
        <div className="grid min-h-72 md:grid-cols-[190px_1fr]">
          <aside className="border-public-border hidden border-r p-4 md:block">
            {["Overview", "Find leads", "Pipeline", "Analytics"].map((item, index) => <div key={item} className={`mb-2 rounded px-3 py-2 text-xs ${index === 1 ? "bg-public-foreground text-public" : "text-public-muted"}`}>{item}</div>)}
          </aside>
          <div className="p-4 sm:p-6">
            <div className="mb-5 flex items-end justify-between gap-4"><div><p className="text-public-muted text-xs">LIVE SEARCH RESULTS</p><p className="text-public-foreground mt-1 font-heading text-lg font-semibold">Businesses ready to discover</p></div><span className="text-public-muted text-xs">50 results</span></div>
            <div className="grid gap-3 sm:grid-cols-3">
              {["Atlas Dental Studio", "Northline Café", "Horizon Fitness"].map((name, index) => <div key={name} className="border-public-border bg-public rounded-md border p-4"><div className="mb-5 flex items-center justify-between"><span className="bg-public-raised grid size-8 place-items-center rounded border border-public-border"><Globe2 className="text-public-muted size-4" /></span><span className="text-public-muted text-[10px]">{index === 1 ? "WEAK SITE" : "NO WEBSITE"}</span></div><p className="text-public-foreground text-sm font-medium">{name}</p><p className="text-public-muted mt-1 text-xs">High-fit opportunity</p><div className="bg-public-border mt-4 h-px" /><p className="text-public-foreground mt-3 text-xs">Generate outreach →</p></div>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Landing() {
  return (
    <div className="public-theme bg-public text-public-foreground min-h-screen font-body">
      <PublicHeader />
      <main>
        <section className="public-hero-grid relative overflow-hidden px-5 pt-20 pb-10 text-center sm:px-8 sm:pt-28">
          <div className="animate-fade-up mx-auto max-w-5xl">
            <p className="text-public-muted mb-7 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest"><Sparkles className="size-3.5" /> Lead generation, refined</p>
            <h1 className="text-public-foreground font-heading text-5xl font-semibold leading-[1.04] sm:text-7xl lg:text-8xl">Leadlify</h1>
            <p className="text-public-muted mx-auto mt-7 max-w-2xl text-base leading-7 sm:text-xl">Find businesses that genuinely need a better web presence. Turn live local data into focused leads, clear opportunities, and personalized outreach.</p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="bg-public-foreground text-public hover:bg-public-foreground/90 h-12 px-7"><Link to="/auth" search={{ mode: "signup" }}>Start with 10 free leads <ArrowRight /></Link></Button>
              <Button asChild size="lg" variant="outline" className="border-public-border bg-public-raised text-public-foreground hover:bg-public-soft h-12 px-7"><a href="#how">See how it works</a></Button>
            </div>
            <div className="text-public-muted mt-6 flex flex-wrap justify-center gap-5 text-xs"><span className="flex items-center gap-1.5"><CheckCircle2 className="size-3.5" /> No credit card</span><span className="flex items-center gap-1.5"><ShieldCheck className="size-3.5" /> Draft-only outreach</span><span className="flex items-center gap-1.5"><Globe2 className="size-3.5" /> International search</span></div>
          </div>
          <ProductPreview />
        </section>

        <section className="border-public-border border-y">
          <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-public-border sm:grid-cols-4">
            {[["50", "leads per search"], ["10", "free lead imports"], ["6", "audit dimensions"], ["1", "focused pipeline"]].map(([value, label]) => <div key={label} className="border-public-border px-5 py-8 text-center max-sm:even:border-l max-sm:nth-[n+3]:border-t"><p className="font-heading text-3xl font-semibold">{value}</p><p className="text-public-muted mt-1 text-xs">{label}</p></div>)}
          </div>
        </section>

        <section id="features" className="px-5 py-24 sm:px-8 sm:py-32">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl"><p className="text-public-muted text-xs font-semibold uppercase tracking-widest">A better prospecting rhythm</p><h2 className="mt-5 font-heading text-3xl font-semibold sm:text-5xl">Less list-building.<br />More reasons to reach out.</h2></div>
            <div className="border-public-border mt-14 grid border-t md:grid-cols-2">
              {features.map(({ icon: Icon, title, text }, index) => <article key={title} className={`border-public-border py-9 md:p-9 ${index % 2 === 0 ? "md:border-r" : ""} ${index < 2 ? "border-b" : index === 2 ? "max-md:border-b" : ""}`}><Icon className="text-public-muted size-5" /><h3 className="mt-7 font-heading text-xl font-semibold">{title}</h3><p className="text-public-muted mt-3 max-w-md text-sm leading-6">{text}</p></article>)}
            </div>
          </div>
        </section>

        <section id="how" className="border-public-border bg-public-soft border-y px-5 py-24 sm:px-8 sm:py-32">
          <div className="mx-auto max-w-7xl"><div className="grid gap-14 lg:grid-cols-[.8fr_1.2fr]"><div><p className="text-public-muted text-xs font-semibold uppercase tracking-widest">From search to conversation</p><h2 className="mt-5 font-heading text-3xl font-semibold sm:text-5xl">One precise workflow.</h2><p className="text-public-muted mt-5 max-w-md leading-7">Choose the market. Find the opportunity. Build a pitch around what the business actually needs.</p></div><ol className="border-public-border border-t">{[[Search, "Search the market", "Choose a country, city, niche, and radius."], [ShieldCheck, "Qualify the opportunity", "Filter for no website or audit an existing one."], [Mail, "Create a relevant draft", "Use business details and real weaknesses—not generic filler."], [BarChart3, "Move the lead forward", "Copy the draft and track each outcome in your pipeline."]].map(([Icon, title, text], index) => { const StepIcon = Icon as typeof Search; return <li key={title as string} className="border-public-border grid grid-cols-[38px_1fr] gap-4 border-b py-6"><span className="text-public-muted text-xs">0{index + 1}</span><div><StepIcon className="mb-3 size-4" /><h3 className="font-heading font-semibold">{title as string}</h3><p className="text-public-muted mt-1 text-sm">{text as string}</p></div></li>; })}</ol></div></div>
        </section>

        <section className="px-5 py-24 sm:px-8 sm:py-32"><div className="mx-auto max-w-7xl"><div className="mb-12 text-center"><p className="text-public-muted text-xs font-semibold uppercase tracking-widest">The Leadlify difference</p><h2 className="mt-5 font-heading text-3xl font-semibold sm:text-5xl">Prospecting without the guesswork.</h2></div><div className="border-public-border grid overflow-hidden rounded-lg border md:grid-cols-2"><div className="bg-public p-7 sm:p-10"><p className="text-public-muted text-xs font-semibold uppercase tracking-widest">Traditional outreach</p><ul className="text-public-muted mt-8 space-y-5 text-sm">{["Manual searching and spreadsheet cleanup", "Guessing which business needs a new website", "Generic drafts with no useful context"].map(x => <li key={x} className="flex gap-3"><X className="size-4 shrink-0" />{x}</li>)}</ul></div><div className="border-public-border bg-public-raised border-t p-7 sm:p-10 md:border-t-0 md:border-l"><p className="text-public-foreground text-xs font-semibold uppercase tracking-widest">The Leadlify way</p><ul className="mt-8 space-y-5 text-sm">{["Live business discovery in the market you choose", "Clear no-website and weak-site opportunities", "Personalized AI drafts based on real details"].map(x => <li key={x} className="flex gap-3"><Check className="size-4 shrink-0" />{x}</li>)}</ul></div></div></div></section>

        <section id="pricing" className="border-public-border bg-public-soft border-y px-5 py-24 sm:px-8 sm:py-32"><div className="mx-auto max-w-7xl"><div className="text-center"><p className="text-public-muted text-xs font-semibold uppercase tracking-widest">Simple monthly pricing</p><h2 className="mt-5 font-heading text-3xl font-semibold sm:text-5xl">Choose your outreach pace.</h2><p className="text-public-muted mt-4">Start free with 10 leads and 2 drafts. Paid plans activate after approval.</p></div><div className="mt-14 grid gap-4 lg:grid-cols-3">{plans.map(plan => <article key={plan.name} className={`relative flex min-h-96 flex-col rounded-lg border p-7 ${plan.featured ? "border-public-foreground bg-public-raised" : "border-public-border bg-public"}`}>{plan.featured ? <span className="bg-public-foreground text-public absolute top-0 right-6 px-3 py-1 text-[10px] font-bold uppercase">Most popular</span> : null}<p className="text-public-muted text-sm">{plan.name}</p><p className="mt-4 font-heading text-4xl font-semibold">${plan.price}<span className="text-public-muted text-sm font-normal"> / month</span></p><p className="text-public-muted mt-2 text-sm">{plan.note}</p><ul className="mt-8 flex-1 space-y-4 text-sm">{plan.items.map(item => <li key={item} className="flex gap-3"><Check className="size-4" />{item}</li>)}</ul><Button asChild className={`mt-8 w-full ${plan.featured ? "bg-public-foreground text-public hover:bg-public-foreground/90" : "border-public-border bg-public-raised text-public-foreground hover:bg-public-soft"}`} variant={plan.featured ? "default" : "outline"}><Link to="/auth" search={{ mode: "signup" }}>Choose {plan.name}</Link></Button></article>)}</div></div></section>

        <section id="faq" className="px-5 py-24 sm:px-8 sm:py-32"><div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[.7fr_1.3fr]"><div><p className="text-public-muted text-xs font-semibold uppercase tracking-widest">FAQ</p><h2 className="mt-5 font-heading text-3xl font-semibold sm:text-5xl">Good questions.<br />Clear answers.</h2></div><div className="border-public-border border-t">{faqs.map(([question, answer]) => <details key={question} className="group border-public-border border-b"><summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 font-heading font-semibold"><span>{question}</span><span className="text-public-muted text-xl transition-transform group-open:rotate-45">+</span></summary><p className="text-public-muted max-w-2xl pb-6 text-sm leading-6">{answer}</p></details>)}</div></div></section>

        <section className="border-public-border public-hero-grid border-t px-5 py-24 text-center sm:px-8 sm:py-32"><div className="mx-auto max-w-3xl"><h2 className="font-heading text-4xl font-semibold sm:text-6xl">Your next client may not have a website yet.</h2><p className="text-public-muted mx-auto mt-5 max-w-xl leading-7">Find the opportunity before someone else does. Your first 10 lead imports are free.</p><Button asChild size="lg" className="bg-public-foreground text-public hover:bg-public-foreground/90 mt-8 h-12 px-7"><Link to="/auth" search={{ mode: "signup" }}>Start finding leads <ArrowRight /></Link></Button></div></section>
      </main>
      <PublicFooter />
    </div>
  );
}