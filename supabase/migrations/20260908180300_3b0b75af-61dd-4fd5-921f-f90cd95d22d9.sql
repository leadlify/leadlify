UPDATE public.profiles
SET website_builder_enabled = true,
    monthly_lead_quota = GREATEST(monthly_lead_quota, 100000),
    monthly_email_quota = GREATEST(monthly_email_quota, 100000),
    updated_at = now();

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (
    id, email, full_name, plan, monthly_lead_quota, monthly_email_quota, website_builder_enabled
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    CASE WHEN lower(NEW.email) = 'mixyt1798@gmail.com' THEN 'agency' ELSE 'free' END,
    100000,
    100000,
    true
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
$function$;