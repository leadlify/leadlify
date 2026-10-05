<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
- Expensive server functions (lead search, AI calls) call enforceRateLimit from src/lib/rate-limit.server.ts, backed by the action_log table — keeps per-user abuse in check without external services.
- Outreach is never sent by the app; the outreach table only records what the user sent manually via wa.me / mailto links — avoids WhatsApp bans and spam issues.
