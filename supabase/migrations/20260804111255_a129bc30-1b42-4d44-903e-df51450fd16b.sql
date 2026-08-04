DROP POLICY IF EXISTS "Admins read all roles" ON public.user_roles;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT _user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role = _role
    )
$$;

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

DROP POLICY IF EXISTS "Service role manages app user connections" ON public.app_user_connections;
CREATE POLICY "Service role manages app user connections"
ON public.app_user_connections
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

GRANT SELECT ON public.gmail_oauth_diagnostics TO authenticated;
DROP POLICY IF EXISTS "Users read own Gmail OAuth diagnostics" ON public.gmail_oauth_diagnostics;
CREATE POLICY "Users read own Gmail OAuth diagnostics"
ON public.gmail_oauth_diagnostics
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);