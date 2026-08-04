import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";

import { PublicFooter, PublicHeader } from "@/components/public-site";

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [
    { title: "Privacy Policy — Leadlify" },
    { name: "description", content: "Read how Leadlify describes account, lead, and product usage data handling." },
    { property: "og:title", content: "Privacy Policy — Leadlify" },
    { property: "og:description", content: "Leadlify privacy information for users and visitors." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }), component: PrivacyPage,
});

const sections = [
  ["Information used by the service", "Leadlify may process information you provide when creating an account, business lead information you save to your workspace, plan requests, and the actions needed to operate the product. Business listing data may come from connected search services."],
  ["How information is used", "Information is used to provide the workspace, find and organize leads, generate requested audits and drafts, enforce plan limits, review plan activation requests, maintain security, and improve product reliability."],
  ["AI-generated content", "When you request an analysis or draft, the relevant business details and your instructions may be sent to the configured AI service to generate the result. Avoid entering sensitive personal information that is not needed for your outreach."],
  ["Email and outreach", "Leadlify currently creates drafts only. It does not send outreach from your mailbox. You choose whether to copy, edit, and send any generated content through your own email client."],
  ["Service providers", "Leadlify relies on service providers needed to run its core features, including account and database infrastructure, business search data, and AI generation. Their handling of information is also governed by their applicable terms and privacy policies."],
  ["Retention and deletion", "Information may remain in your workspace while your account is active or as needed to operate the service. To request access, correction, or deletion, contact Leadlify support. Some information may be retained when required for security, dispute resolution, or legal obligations."],
  ["Security and responsibility", "Leadlify uses the access controls available in its application platform. No online service can guarantee absolute security. You are responsible for protecting your account credentials and for reviewing generated outreach before using it."],
  ["Policy updates", "This policy may be updated as Leadlify changes. Material revisions will be reflected on this page with a new effective date."],
];

function PrivacyPage() {
  return <div className="public-theme bg-public text-public-foreground min-h-screen font-body"><PublicHeader /><main>
    <section className="public-hero-grid border-public-border border-b px-5 py-20 sm:px-8 sm:py-28"><div className="mx-auto max-w-4xl"><ShieldCheck className="text-public-muted size-6" /><p className="text-public-muted mt-7 text-xs font-semibold uppercase tracking-widest">Effective August 4, 2026</p><h1 className="mt-5 font-heading text-4xl font-semibold sm:text-6xl">Privacy Policy</h1><p className="text-public-muted mt-6 max-w-2xl text-lg leading-8">This page is maintained by Leadlify to explain common privacy questions about the Leadlify application.</p></div></section>
    <section className="px-5 py-20 sm:px-8 sm:py-28"><div className="mx-auto max-w-4xl"><div className="border-public-border bg-public-soft mb-12 rounded-lg border p-6"><h2 className="font-heading font-semibold">Scope and shared responsibility</h2><p className="text-public-muted mt-3 text-sm leading-6">This is app-owned, editable information—not a certification or independent security assessment. The infrastructure platform provides technical capabilities, while Leadlify remains responsible for its product configuration, operating practices, and commitments to users.</p></div><div className="space-y-12">{sections.map(([title, text], index) => <section key={title} className="grid gap-4 sm:grid-cols-[48px_1fr]"><span className="text-public-muted text-xs">{String(index + 1).padStart(2, "0")}</span><div><h2 className="font-heading text-xl font-semibold">{title}</h2><p className="text-public-muted mt-3 leading-7">{text}</p></div></section>)}</div><div className="border-public-border mt-16 border-t pt-10"><h2 className="font-heading text-xl font-semibold">Privacy requests</h2><p className="text-public-muted mt-3 leading-7">For a privacy or security request, use the <a href="https://wa.link/cuj4t2" target="_blank" rel="noopener noreferrer" className="text-public-foreground underline underline-offset-4">Leadlify support channel</a>. Please do not include passwords or other sensitive credentials in your message.</p></div></div></section>
  </main><PublicFooter /></div>;
}