CREATE TABLE public.demo_sites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE,
  business_name text NOT NULL,
  html text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX demo_sites_lead_unique ON public.demo_sites(lead_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.demo_sites TO authenticated;
GRANT SELECT ON public.demo_sites TO anon;
GRANT ALL ON public.demo_sites TO service_role;

ALTER TABLE public.demo_sites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view demo sites" ON public.demo_sites
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Users manage their own demo sites" ON public.demo_sites
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins manage all demo sites" ON public.demo_sites
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_demo_sites_updated_at
  BEFORE UPDATE ON public.demo_sites
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();