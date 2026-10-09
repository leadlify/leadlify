REVOKE EXECUTE ON FUNCTION public.record_demo_view(text) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.record_email_open(uuid) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.my_referrals() FROM anon, authenticated, PUBLIC;
DROP FUNCTION public.my_referrals();
CREATE OR REPLACE FUNCTION public.referrals_for(_user uuid)
RETURNS TABLE(display text, joined_at timestamptz) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(NULLIF(split_part(full_name, ' ', 1), ''), split_part(email, '@', 1)), created_at
  FROM public.profiles WHERE referred_by = _user ORDER BY created_at DESC;
$$;
REVOKE EXECUTE ON FUNCTION public.referrals_for(uuid) FROM anon, authenticated, PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_demo_view(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.record_email_open(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.referrals_for(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.seed_starter_templates(uuid) TO service_role;