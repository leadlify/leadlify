CREATE POLICY "Admins update plan requests"
ON public.plan_requests FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.review_plan_request(_request_id uuid, _approve boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  request_row public.plan_requests%ROWTYPE;
  lead_limit integer;
  email_limit integer;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT * INTO request_row
  FROM public.plan_requests
  WHERE id = _request_id AND status = 'pending'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pending plan request not found';
  END IF;

  IF _approve THEN
    lead_limit := CASE request_row.requested_plan
      WHEN 'starter' THEN 250
      WHEN 'growth' THEN 1000
      WHEN 'agency' THEN 5000
    END;
    email_limit := CASE request_row.requested_plan
      WHEN 'starter' THEN 100
      WHEN 'growth' THEN 500
      WHEN 'agency' THEN 2500
    END;

    UPDATE public.profiles
    SET plan = request_row.requested_plan,
        monthly_lead_quota = lead_limit,
        monthly_email_quota = email_limit,
        website_builder_enabled = true,
        updated_at = now()
    WHERE id = request_row.user_id;
  END IF;

  UPDATE public.plan_requests
  SET status = CASE WHEN _approve THEN 'approved' ELSE 'rejected' END,
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      updated_at = now()
  WHERE id = _request_id;
END;
$$;