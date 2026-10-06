-- lovable-cron-fallback-reviewed: user explicitly requested 15-min Gmail reply polling; Gmail push requires Pub/Sub setup not available
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE TABLE public.cron_tokens (
  name text PRIMARY KEY,
  token text NOT NULL DEFAULT encode(extensions.gen_random_bytes(32), 'hex'),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.cron_tokens TO service_role;
ALTER TABLE public.cron_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON public.cron_tokens FOR ALL TO service_role USING (true) WITH CHECK (true);
INSERT INTO public.cron_tokens (name) VALUES ('gmail_sync') ON CONFLICT DO NOTHING;

SELECT cron.schedule(
  'gmail-sync-replies',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://leadlify.lovable.app/api/public/gmail/sync-replies',
    headers := jsonb_build_object('Content-Type','application/json','x-cron-token',(SELECT token FROM public.cron_tokens WHERE name='gmail_sync')),
    body := '{}'::jsonb
  );
  $$
);