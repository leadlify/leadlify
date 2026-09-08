import { createFileRoute } from "@tanstack/react-router";

import { ComingSoon } from "@/components/coming-soon";

export const Route = createFileRoute("/_authenticated/referrals")({
  head: () => ({
    meta: [
      { title: "Referrals — Leadlify" },
      { name: "description", content: "Invite others to Leadlify and earn rewards." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Referrals — Leadlify" },
      {
        property: "og:description",
        content: "Invite others to Leadlify and earn rewards.",
      },
    ],
  }),
  component: () => (
    <ComingSoon
      title="Referrals"
      description="Invite others and earn rewards"
      message="The referral programme is being built. Soon you will get a personal invite link and earn rewards for every person who joins Leadlify through it."
    />
  ),
});
