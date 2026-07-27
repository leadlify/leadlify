CREATE UNIQUE INDEX IF NOT EXISTS leads_user_place_unique
  ON public.leads (user_id, place_id)
  WHERE place_id IS NOT NULL;