ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS suspended boolean NOT NULL DEFAULT false;

-- Stop users from un-suspending themselves or changing their own plan/quotas
CREATE OR REPLACE FUNCTION public.protect_profile_admin_fields()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') AND auth.role() = 'authenticated' THEN
    NEW.suspended := OLD.suspended;
    NEW.plan := OLD.plan;
    NEW.monthly_lead_quota := OLD.monthly_lead_quota;
    NEW.monthly_email_quota := OLD.monthly_email_quota;
    NEW.website_builder_enabled := OLD.website_builder_enabled;
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS protect_profile_admin_fields ON public.profiles;
CREATE TRIGGER protect_profile_admin_fields BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_profile_admin_fields();

-- Admin role management
CREATE POLICY "Admins read all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins add roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins remove roles" ON public.user_roles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin') AND user_id <> auth.uid());
GRANT SELECT, INSERT, DELETE ON public.user_roles TO authenticated;

-- Announcements
CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcements TO authenticated;
GRANT ALL ON public.announcements TO service_role;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in users read active announcements" ON public.announcements FOR SELECT TO authenticated USING (active OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage announcements" ON public.announcements FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Outreach tracking
CREATE TABLE public.outreach (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (channel IN ('whatsapp','email')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','replied','not_interested')),
  sent_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX outreach_user_idx ON public.outreach(user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.outreach TO authenticated;
GRANT ALL ON public.outreach TO service_role;
ALTER TABLE public.outreach ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own outreach" ON public.outreach FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins read all outreach" ON public.outreach FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_outreach_updated_at BEFORE UPDATE ON public.outreach FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Per-user rate limit log
CREATE TABLE public.action_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  action text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX action_log_lookup ON public.action_log(user_id, action, created_at DESC);
GRANT SELECT, INSERT ON public.action_log TO authenticated;
GRANT ALL ON public.action_log TO service_role;
ALTER TABLE public.action_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users log own actions" ON public.action_log FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users read own actions" ON public.action_log FOR SELECT TO authenticated USING (auth.uid() = user_id);