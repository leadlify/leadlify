ALTER TABLE public.app_user_connections
  ADD COLUMN IF NOT EXISTS oauth_last_step text,
  ADD COLUMN IF NOT EXISTS oauth_requested_scopes jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS oauth_last_error text,
  ADD COLUMN IF NOT EXISTS oauth_last_attempt_at timestamptz;

COMMENT ON COLUMN public.app_user_connections.oauth_last_step IS 'Last completed Gmail OAuth step for diagnostics';
COMMENT ON COLUMN public.app_user_connections.oauth_requested_scopes IS 'OAuth scopes requested during the latest consent attempt';
COMMENT ON COLUMN public.app_user_connections.oauth_last_error IS 'Exact latest provider or connector OAuth error';
COMMENT ON COLUMN public.app_user_connections.oauth_last_attempt_at IS 'Time of the latest OAuth diagnostic update';