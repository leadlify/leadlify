import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowRight, Building2, Check, Globe2, MapPin, Search } from "lucide-react";

import { PublicFooter, PublicHeader } from "@/components/public-site";
import { Button } from "@/components/ui/button";
import { COUNTRIES, countryBySlug, countrySlug, type Country } from "@/lib/countries";

const SITE = "https://leadlify.lovable.app";

const NICHES = [
  "Dentists & clinics",
  "Restaurants & cafés",
  "Law firms",
  "Gyms & studios",
  "Plumbers & electricians",
  "Hair & beauty salons",
  "Real estate agencies",
  "Car dealerships & workshops",
];

function faqsFor(name: string): [string, string][] {
  return [
    [
      `How does Leadlify find business leads in ${name}?`,
      `Leadlify searches live Google Places business listings inside ${name}. You choose ${name} as the country, add a city, an industry and an optional keyword, and Leadlify imports the matching businesses with their public contact details into your pipeline.`,
    ],
    [
      `Can I find businesses in ${name} that have no website?`,
      `Yes. Set the website quality filter to "No website at all" and Leadlify keeps only ${name} businesses whose listing has no site — the clearest opportunity for a web design pitch.`,
    ],
    [
      `Do I need to live in ${name} to prospect there?`,
      `No. The search is anchored to the country you select, not to your own location, so you can run lead generation in ${name} from anywhere in the world.`,
    ],
    [
      `Does Leadlify write cold emails for ${name} businesses?`,
      `Yes. Every lead gets an AI audit of its online presence and a personalized cold email draft built from that business's real details. You copy the draft into your own email client and stay in control of sending.`,
    ],
    [
      `How much does lead generation in ${name} cost?`,
      `Every account starts free with 10 lead imports and 2 email drafts. Paid plans start at $32 per month and add higher lead limits, more drafts and the demo website builder.`,
    ],
  ];
}

export const Route = createFileRoute("/lead-generation/$country")({
  loader: ({ params }) => {
    const country = countryBySlug(params.country);
    if (!country) throw notFound();
    return { country };
  },
  head: ({ params, loaderData }) => {
    const name = loaderData?.country.name ?? "";
    const url = `${SITE}/lead-generation/${params.country}`;
    const title = `Lead Generation in ${name} — Find Local Business Leads | Leadlify`;
    const description = `Find local business leads in ${name} with Leadlify. Search live listings by city and industry, spot businesses with no website, and get AI cold email drafts.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { name: "robots", content: "index, follow" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: url },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "BreadcrumbList",
                itemListElement: [
                  { "@type": "ListItem", position: 1, name: "Home", item: SITE },
                  {
                    "@type": "ListItem",
                    position: 2,
                    name: "Lead generation",
                    item: `${SITE}/lead-generation`,
                  },
                  { "@type": "ListItem", position: 3, name: `Lead generation in ${name}`, item: url },
                ],
              },
              {
                "@type": "FAQPage",
                mainEntity: faqsFor(name).map(([question, answer]) => ({
                  "@type": "Question",
                  name: question,
                  acceptedAnswer: { "@type": "Answer", text: answer },
                })),
              },
            ],
          }),
        },
      ],
    };
  },
  component: CountryPage,
});

function CountryPage() {
  const { country } = Route.useLoaderData() as { country: Country };
  const name = country.name;
  const faqs = faqsFor(name);
  const related = COUNTRIES.filter((c) => c.code !== country.code).slice(0, 24);

  return (
    <div className="public-theme bg-public text-public-foreground font-body min-h-screen">
      <PublicHeader />
      <main>
        <section className="public-hero-grid relative overflow-hidden px-5 pt-16 pb-14 sm:px-8 sm:pt-24">
          <div className="public-glow pointer-events-none absolute inset-x-0 top-0 h-[420px]" />
          <div className="relative mx-auto max-w-4xl">
            <nav className="text-public-muted mb-6 text-xs" aria-label="Breadcrumb">
              <Link to="/" className="hover:text-public-foreground">
                Home
              </Link>
              <span className="px-2">/</span>
              <Link to="/lead-generation" className="hover:text-public-foreground">
                Lead generation
              </Link>
              <span className="px-2">/</span>
              <span className="text-public-foreground">{name}</span>
            </nav>
            <p className="border-public-border bg-public-raised/70 text-public-muted mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium">
              <MapPin className="size-3.5" /> {name}
            </p>
            <h1 className="public-silver-text font-heading text-4xl leading-[1.08] font-semibold sm:text-6xl">
              Lead generation in {name}
            </h1>
            <p className="text-public-muted mt-6 max-w-2xl text-base leading-7 sm:text-lg">
              Leadlify finds local businesses across {name}, flags the ones with no website or a weak
              one, audits their online presence with AI, and writes a personalized cold email draft
              for every opportunity.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
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
                <Link to="/lead-generation">Browse all countries</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="defer-section border-public-border border-y px-5 py-20 sm:px-8">
          <div className="mx-auto max-w-5xl">
            <h2 className="font-heading text-2xl font-semibold sm:text-4xl">
              How lead generation in {name} works
            </h2>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {[
                {
                  icon: Search,
                  title: `Search ${name}`,
                  text: `Select ${name}, add a city and radius, then choose the industry and business type you want to reach.`,
                },
                {
                  icon: Building2,
                  title: "Filter by website quality",
                  text: "Keep only businesses with no website, or with a website weak enough to justify a redesign pitch.",
                },
                {
                  icon: Globe2,
                  title: "Pitch with proof",
                  text: "Get an AI audit, a personalized email draft and an optional demo website link for each lead.",
                },
              ].map((step) => (
                <article
                  key={step.title}
                  className="border-public-border bg-public-soft public-card-sheen rounded-2xl border p-6"
                >
                  <step.icon className="size-5" />
                  <h3 className="font-heading mt-4 text-lg font-semibold">{step.title}</h3>
                  <p className="text-public-muted mt-2 text-sm leading-6">{step.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="defer-section px-5 py-20 sm:px-8">
          <div className="mx-auto max-w-5xl">
            <h2 className="font-heading text-2xl font-semibold sm:text-4xl">
              Popular niches to prospect in {name}
            </h2>
            <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {NICHES.map((niche) => (
                <li
                  key={niche}
                  className="border-public-border bg-public-soft text-public-muted flex items-center gap-2 rounded-xl border px-4 py-3 text-sm"
                >
                  <Check className="size-4 shrink-0" />
                  {niche}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="defer-section border-public-border bg-public-soft border-y px-5 py-20 sm:px-8">
          <div className="mx-auto max-w-4xl">
            <h2 className="font-heading text-2xl font-semibold sm:text-4xl">
              {name} lead generation FAQs
            </h2>
            <div className="border-public-border mt-8 border-t">
              {faqs.map(([question, answer]) => (
                <details key={question} className="group border-public-border border-b">
                  <summary className="font-heading flex cursor-pointer list-none items-center justify-between gap-6 py-5 font-semibold">
                    <span>{question}</span>
                    <span className="text-public-muted text-xl transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="text-public-muted max-w-2xl pb-5 text-sm leading-6">{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="defer-section px-5 py-20 sm:px-8">
          <div className="mx-auto max-w-6xl">
            <h2 className="font-heading text-xl font-semibold sm:text-2xl">
              Lead generation in other countries
            </h2>
            <div className="mt-6 flex flex-wrap gap-2">
              {related.map((item) => (
                <Link
                  key={item.code}
                  to="/lead-generation/$country"
                  params={{ country: countrySlug(item.name) }}
                  className="border-public-border bg-public-soft text-public-muted hover:text-public-foreground rounded-full border px-3 py-1.5 text-xs transition-colors"
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
