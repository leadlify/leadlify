CREATE TABLE public.unsubscribes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  email text NOT NULL,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX unsubscribes_user_email_idx ON public.unsubscribes (user_id, lower(email));
GRANT SELECT, INSERT, DELETE ON public.unsubscribes TO authenticated;
GRANT ALL ON public.unsubscribes TO service_role;
ALTER TABLE public.unsubscribes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own unsubscribes" ON public.unsubscribes FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Service role manages unsubscribes" ON public.unsubscribes FOR ALL TO service_role USING (true) WITH CHECK (true);
ALTER TABLE public.email_history ADD COLUMN IF NOT EXISTS bounced_at timestamptz;