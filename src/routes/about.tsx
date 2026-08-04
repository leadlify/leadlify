import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Eye, Focus, Sparkles } from "lucide-react";

import { PublicFooter, PublicHeader } from "@/components/public-site";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [
    { title: "About Leadlify — Focused Lead Generation" },
    { name: "description", content: "Learn why Leadlify helps web designers and agencies find genuine business opportunities and write more relevant outreach." },
    { property: "og:title", content: "About Leadlify" },
    { property: "og:description", content: "A focused lead generation workspace built around real business opportunities." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }), component: AboutPage,
});

function AboutPage() {
  return <div className="public-theme bg-public text-public-foreground min-h-screen font-body"><PublicHeader /><main>
    <section className="public-hero-grid border-public-border border-b px-5 py-24 sm:px-8 sm:py-36"><div className="mx-auto max-w-7xl"><p className="text-public-muted flex items-center gap-2 text-xs font-semibold uppercase tracking-widest"><Sparkles className="size-3.5" /> About Leadlify</p><h1 className="mt-7 max-w-5xl font-heading text-4xl font-semibold leading-tight sm:text-7xl">Better outreach begins with a better reason to reach out.</h1><p className="text-public-muted mt-8 max-w-2xl text-lg leading-8">Leadlify is built for web designers, freelancers, and agencies who want to find businesses they can genuinely help—not send more generic messages.</p></div></section>
    <section className="px-5 py-24 sm:px-8 sm:py-32"><div className="mx-auto grid max-w-7xl gap-16 lg:grid-cols-2"><div><p className="text-public-muted text-xs font-semibold uppercase tracking-widest">Why we built it</p><h2 className="mt-5 font-heading text-3xl font-semibold sm:text-5xl">Prospecting should feel considered.</h2></div><div className="text-public-muted space-y-6 text-base leading-8"><p>Finding web design clients usually means moving between maps, spreadsheets, audit tools, and blank email drafts. The useful signal gets buried in repetitive work.</p><p>Leadlify brings that workflow together. It helps you discover businesses, identify where their web presence is missing or weak, generate a relevant draft, and track the opportunity in one focused workspace.</p><p>The goal is simple: fewer random lists, more informed conversations.</p></div></div></section>
    <section className="border-public-border bg-public-soft border-y px-5 py-24 sm:px-8"><div className="mx-auto grid max-w-7xl gap-px overflow-hidden rounded-lg border border-public-border bg-public-border md:grid-cols-3">{[[Focus, "Relevance first", "A useful pitch starts with a real, visible opportunity."], [Eye, "Clarity over clutter", "One workflow should make the next action obvious."], [Sparkles, "AI with context", "Automation should improve your thinking, not replace it with generic copy."]].map(([Icon, title, text]) => { const ValueIcon = Icon as typeof Focus; return <article key={title as string} className="bg-public p-8"><ValueIcon className="text-public-muted size-5" /><h2 className="mt-8 font-heading text-xl font-semibold">{title as string}</h2><p className="text-public-muted mt-3 text-sm leading-6">{text as string}</p></article>; })}</div></section>
    <section className="px-5 py-24 text-center sm:px-8 sm:py-32"><h2 className="mx-auto max-w-3xl font-heading text-4xl font-semibold sm:text-6xl">Find the businesses you can help next.</h2><Button asChild size="lg" className="bg-public-foreground text-public hover:bg-public-foreground/90 mt-8 h-12 px-7"><Link to="/auth" search={{ mode: "signup" }}>Start free <ArrowRight /></Link></Button></section>
  </main><PublicFooter /></div>;
}