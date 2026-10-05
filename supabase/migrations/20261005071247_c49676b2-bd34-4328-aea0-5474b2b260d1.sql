CREATE TABLE public.gmail_accounts (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  refresh_token_ciphertext text NOT NULL,
  scopes text,
  last_checked_at timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.gmail_accounts TO service_role;
ALTER TABLE public.gmail_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role manages gmail accounts" ON public.gmail_accounts FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE TRIGGER update_gmail_accounts_updated_at BEFORE UPDATE ON public.gmail_accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.email_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  email_history_id uuid REFERENCES public.email_history(id) ON DELETE SET NULL,
  gmail_message_id text NOT NULL,
  gmail_thread_id text NOT NULL,
  from_email text,
  subject text,
  snippet text,
  received_at timestamptz NOT NULL DEFAULT now(),
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, gmail_message_id)
);
GRANT SELECT, UPDATE, DELETE ON public.email_replies TO authenticated;
GRANT ALL ON public.email_replies TO service_role;
ALTER TABLE public.email_replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own replies" ON public.email_replies FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users update own replies" ON public.email_replies FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own replies" ON public.email_replies FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Service role manages replies" ON public.email_replies FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE INDEX email_replies_user_received_idx ON public.email_replies (user_id, received_at DESC);
CREATE INDEX email_history_thread_idx ON public.email_history (user_id, gmail_thread_id);