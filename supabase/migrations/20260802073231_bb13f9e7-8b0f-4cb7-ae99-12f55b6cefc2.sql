CREATE TABLE public.gmail_oauth_diagnostics (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  connector_id text NOT NULL DEFAULT 'google_mail',
  last_step text NOT NULL DEFAULT 'not_started',
  requested_scopes jsonb NOT NULL DEFAULT '[]'::jsonb,
  last_error text,
  last_attempt_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.gmail_oauth_diagnostics TO service_role;
ALTER TABLE public.gmail_oauth_diagnostics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role manages Gmail OAuth diagnostics"
ON public.gmail_oauth_diagnostics
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
CREATE TRIGGER update_gmail_oauth_diagnostics_updated_at
BEFORE UPDATE ON public.gmail_oauth_diagnostics
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();