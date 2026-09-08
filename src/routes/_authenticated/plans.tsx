import { createFileRoute } from "@tanstack/react-router";

import { ComingSoon } from "@/components/coming-soon";

export const Route = createFileRoute("/_authenticated/plans")({
  head: () => ({
    meta: [
      { title: "Plans — Leadlify" },
      { name: "description", content: "Leadlify plans and billing." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Plans — Leadlify" },
      { property: "og:description", content: "Leadlify plans and billing." },
    ],
  }),
  component: () => (
    <ComingSoon
      title="Plans"
      description="Everything is free during early access"
      message="Paid plans are not live yet. Every Leadlify feature — lead discovery, AI audits, cold email drafts, Instagram messages and demo websites — is completely free for now."
    />
  ),
});
