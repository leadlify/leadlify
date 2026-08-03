CREATE TABLE public.plan_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  requested_plan text NOT NULL,
  amount_usd numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT plan_requests_requested_plan_valid CHECK (requested_plan IN ('starter', 'growth', 'agency')),
  CONSTRAINT plan_requests_amount_valid CHECK (amount_usd IN (32, 45, 70)),
  CONSTRAINT plan_requests_status_valid CHECK (status IN ('pending', 'approved', 'rejected'))
);

GRANT SELECT, INSERT ON public.plan_requests TO authenticated;
GRANT ALL ON public.plan_requests TO service_role;

ALTER TABLE public.plan_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users create own plan requests"
ON public.plan_requests FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND status = 'pending' AND reviewed_by IS NULL AND reviewed_at IS NULL);

CREATE POLICY "Users read own plan requests"
ON public.plan_requests FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins read all plan requests"
ON public.plan_requests FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_plan_requests_updated_at
BEFORE UPDATE ON public.plan_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE UNIQUE INDEX plan_requests_one_pending_per_user
ON public.plan_requests(user_id)
WHERE status = 'pending';

CREATE OR REPLACE FUNCTION public.review_plan_request(_request_id uuid, _approve boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
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

GRANT EXECUTE ON FUNCTION public.review_plan_request(uuid, boolean) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.review_plan_request(uuid, boolean) FROM anon;