ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS monthly_email_quota integer NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS website_builder_enabled boolean NOT NULL DEFAULT false;

ALTER TABLE public.profiles ALTER COLUMN monthly_lead_quota SET DEFAULT 10;

UPDATE public.profiles p
SET plan = 'free',
    monthly_lead_quota = 10,
    monthly_email_quota = 2,
    website_builder_enabled = false
WHERE NOT public.has_role(p.id, 'admin'::public.app_role);

UPDATE public.profiles p
SET plan = 'agency',
    monthly_lead_quota = 100000,
    monthly_email_quota = 100000,
    website_builder_enabled = true
WHERE public.has_role(p.id, 'admin'::public.app_role);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, email, full_name, plan, monthly_lead_quota, monthly_email_quota, website_builder_enabled
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    CASE WHEN lower(NEW.email) = 'mixyt1798@gmail.com' THEN 'agency' ELSE 'free' END,
    CASE WHEN lower(NEW.email) = 'mixyt1798@gmail.com' THEN 100000 ELSE 10 END,
    CASE WHEN lower(NEW.email) = 'mixyt1798@gmail.com' THEN 100000 ELSE 2 END,
    lower(NEW.email) = 'mixyt1798@gmail.com'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    CASE WHEN lower(NEW.email) = 'mixyt1798@gmail.com'
      THEN 'admin'::public.app_role
      ELSE 'user'::public.app_role
    END
  )
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;