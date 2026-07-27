CREATE TYPE public.lead_status AS ENUM ('new','contacted','replied','interested','closed','lost');

CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  business_name text NOT NULL,
  owner_name text,
  business_category text,
  website text,
  phone text,
  email text,
  address text,
  city text,
  country text,
  place_id text,
  google_rating numeric(2,1),
  review_count integer DEFAULT 0,
  website_status text,
  website_speed integer,
  seo_score integer,
  mobile_friendly boolean,
  ssl_enabled boolean,
  analysis jsonb,
  generated_email text,
  status public.lead_status NOT NULL DEFAULT 'new',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX leads_user_place_idx ON public.leads (user_id, place_id) WHERE place_id IS NOT NULL;
CREATE UNIQUE INDEX leads_user_name_city_idx ON public.leads (user_id, lower(business_name), lower(coalesce(city,'')));
CREATE INDEX leads_user_status_idx ON public.leads (user_id, status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own leads" ON public.leads FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.email_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
  to_email text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  sent_status text NOT NULL DEFAULT 'pending',
  error_message text,
  gmail_message_id text,
  gmail_thread_id text,
  replied boolean NOT NULL DEFAULT false,
  replied_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX email_history_user_idx ON public.email_history (user_id, created_at DESC);
CREATE INDEX email_history_lead_idx ON public.email_history (lead_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_history TO authenticated;
GRANT ALL ON public.email_history TO service_role;
ALTER TABLE public.email_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own email history" ON public.email_history FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE DEFAULT auth.uid(),
  sender_name text,
  sender_email text,
  signature text,
  email_tone text NOT NULL DEFAULT 'professional',
  service_description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.settings TO authenticated;
GRANT ALL ON public.settings TO service_role;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own settings" ON public.settings FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON public.settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();