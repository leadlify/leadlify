
-- Reminders
CREATE TABLE public.reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  remind_at timestamptz NOT NULL,
  label text,
  done boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reminders TO authenticated;
GRANT ALL ON public.reminders TO service_role;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own reminders" ON public.reminders FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_reminders_updated_at BEFORE UPDATE ON public.reminders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Saved searches
CREATE TABLE public.saved_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  name text NOT NULL,
  params jsonb NOT NULL DEFAULT '{}'::jsonb,
  alerts_enabled boolean NOT NULL DEFAULT false,
  seen_place_ids text[] NOT NULL DEFAULT '{}',
  last_run_at timestamptz,
  last_alert_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_searches TO authenticated;
GRANT ALL ON public.saved_searches TO service_role;
ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own saved searches" ON public.saved_searches FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_saved_searches_updated_at BEFORE UPDATE ON public.saved_searches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Email templates
CREATE TABLE public.email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  name text NOT NULL,
  tone text NOT NULL DEFAULT '',
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_templates TO authenticated;
GRANT ALL ON public.email_templates TO service_role;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own templates" ON public.email_templates FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON public.email_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Columns
ALTER TABLE public.email_history
  ADD COLUMN template_id uuid REFERENCES public.email_templates(id) ON DELETE SET NULL,
  ADD COLUMN tracking_id uuid NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN opened_at timestamptz;
CREATE UNIQUE INDEX email_history_tracking_id_idx ON public.email_history(tracking_id);

ALTER TABLE public.leads
  ADD COLUMN reviews jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN pain_points text[] NOT NULL DEFAULT '{}';

ALTER TABLE public.demo_sites
  ADD COLUMN share_token text UNIQUE,
  ADD COLUMN view_count integer NOT NULL DEFAULT 0,
  ADD COLUMN last_viewed_at timestamptz;

ALTER TABLE public.profiles
  ADD COLUMN theme text NOT NULL DEFAULT 'dark',
  ADD COLUMN referral_code text UNIQUE DEFAULT encode(extensions.gen_random_bytes(6), 'hex'),
  ADD COLUMN referred_by uuid;
UPDATE public.profiles SET referral_code = encode(extensions.gen_random_bytes(6), 'hex') WHERE referral_code IS NULL;

-- Public: count a demo view by share token
CREATE OR REPLACE FUNCTION public.record_demo_view(_token text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE page text;
BEGIN
  UPDATE public.demo_sites SET view_count = view_count + 1, last_viewed_at = now()
  WHERE share_token = _token AND length(_token) >= 20
  RETURNING html INTO page;
  RETURN page;
END; $$;
REVOKE ALL ON FUNCTION public.record_demo_view(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_demo_view(text) TO anon, authenticated;

-- Public: mark first open of a tracked email
CREATE OR REPLACE FUNCTION public.record_email_open(_tracking uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.email_history SET opened_at = now() WHERE tracking_id = _tracking AND opened_at IS NULL;
$$;
REVOKE ALL ON FUNCTION public.record_email_open(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_email_open(uuid) TO anon, authenticated;

-- Referrals list for the caller only
CREATE OR REPLACE FUNCTION public.my_referrals()
RETURNS TABLE(display text, joined_at timestamptz) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(NULLIF(split_part(full_name, ' ', 1), ''), split_part(email, '@', 1) || '@…'), created_at
  FROM public.profiles WHERE referred_by = auth.uid() AND auth.uid() IS NOT NULL ORDER BY created_at DESC;
$$;
REVOKE ALL ON FUNCTION public.my_referrals() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.my_referrals() TO authenticated;

-- Starter templates helper
CREATE OR REPLACE FUNCTION public.seed_starter_templates(_user uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO public.email_templates (user_id, name, tone, is_default) VALUES
  (_user, 'Direct & Short', 'Very concise, 3-4 sentences, get straight to the point, one clear ask.', true),
  (_user, 'Friendly', 'Warm, conversational and personal, compliment something specific about the business.', false),
  (_user, 'Urgency', 'Polite but time-sensitive: highlight what they lose each week without a better website.', false);
$$;
REVOKE ALL ON FUNCTION public.seed_starter_templates(uuid) FROM PUBLIC, anon, authenticated;

SELECT public.seed_starter_templates(id) FROM public.profiles
WHERE NOT EXISTS (SELECT 1 FROM public.email_templates t WHERE t.user_id = profiles.id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE referrer uuid;
BEGIN
  SELECT id INTO referrer FROM public.profiles
  WHERE referral_code = NULLIF(NEW.raw_user_meta_data->>'ref', '') LIMIT 1;

  INSERT INTO public.profiles (
    id, email, full_name, plan, monthly_lead_quota, monthly_email_quota, website_builder_enabled, referred_by
  )
  VALUES (
    NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    CASE WHEN lower(NEW.email) = 'mixyt1798@gmail.com' THEN 'agency' ELSE 'free' END,
    100000, 100000, true, referrer
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, CASE WHEN lower(NEW.email) = 'mixyt1798@gmail.com' THEN 'admin'::public.app_role ELSE 'user'::public.app_role END)
  ON CONFLICT (user_id, role) DO NOTHING;

  PERFORM public.seed_starter_templates(NEW.id);
  RETURN NEW;
END;
$function$;

-- Users must not change their own referrer
CREATE OR REPLACE FUNCTION public.protect_profile_admin_fields()
 RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') AND auth.role() = 'authenticated' THEN
    NEW.suspended := OLD.suspended;
    NEW.plan := OLD.plan;
    NEW.monthly_lead_quota := OLD.monthly_lead_quota;
    NEW.monthly_email_quota := OLD.monthly_email_quota;
    NEW.website_builder_enabled := OLD.website_builder_enabled;
    NEW.referred_by := OLD.referred_by;
    NEW.referral_code := OLD.referral_code;
  END IF;
  RETURN NEW;
END; $function$;
