import { createFileRoute, Link } from "@tanstack/react-router";
import { Globe2 } from "lucide-react";

import { PublicFooter, PublicHeader } from "@/components/public-site";
import { COUNTRIES, countrySlug } from "@/lib/countries";

const SITE = "https://leadlify.lovable.app";

export const Route = createFileRoute("/lead-generation/")({
  head: () => {
    const title = "Lead Generation by Country — Local Business Leads | Leadlify";
    const description =
      "Browse Leadlify lead generation guides for every country. Find local businesses without a website, audit them with AI and get cold email drafts.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { name: "robots", content: "index, follow" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: `${SITE}/lead-generation` },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
      ],
      links: [{ rel: "canonical", href: `${SITE}/lead-generation` }],
    };
  },
  component: CountryIndex,
});

function CountryIndex() {
  return (
    <div className="public-theme bg-public text-public-foreground font-body min-h-screen">
      <PublicHeader />
      <main>
        <section className="public-hero-grid relative overflow-hidden px-5 pt-16 pb-12 sm:px-8 sm:pt-24">
          <div className="public-glow pointer-events-none absolute inset-x-0 top-0 h-[360px]" />
          <div className="relative mx-auto max-w-4xl">
            <p className="border-public-border bg-public-raised/70 text-public-muted mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium">
              <Globe2 className="size-3.5" /> {COUNTRIES.length} countries
            </p>
            <h1 className="public-silver-text font-heading text-4xl font-semibold sm:text-6xl">
              Lead generation by country
            </h1>
            <p className="text-public-muted mt-6 max-w-2xl leading-7">
              Pick a market and see how Leadlify finds local businesses there, filters out the ones
              that already have a strong website, and drafts a personalized pitch for the rest.
            </p>
          </div>
        </section>
        <section className="defer-section px-5 py-16 sm:px-8">
          <div className="mx-auto grid max-w-6xl gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {COUNTRIES.map((country) => (
              <Link
                key={country.code}
                to="/lead-generation/$country"
                params={{ country: countrySlug(country.name) }}
                className="border-public-border bg-public-soft hover:bg-public-raised rounded-xl border px-4 py-3 text-sm transition-colors"
              >
                Lead generation in {country.name}
              </Link>
            ))}
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
