-- Pedidos de teste da landing (RH). Persistência independente do e-mail.

CREATE TABLE IF NOT EXISTS public.landing_leads (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  email         TEXT NOT NULL,
  company       TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'new'
                  CHECK (status IN ('new', 'contacted', 'in_progress', 'qualified', 'converted', 'archived')),
  notes         TEXT,
  email_status  TEXT NOT NULL DEFAULT 'pending'
                  CHECK (email_status IN ('pending', 'sent', 'skipped', 'failed')),
  email_error   TEXT,
  contacted_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_landing_leads_created_at ON public.landing_leads (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_landing_leads_status ON public.landing_leads (status);
CREATE INDEX IF NOT EXISTS idx_landing_leads_email ON public.landing_leads (lower(email));

DROP TRIGGER IF EXISTS trg_landing_leads_updated_at ON public.landing_leads;
CREATE TRIGGER trg_landing_leads_updated_at
  BEFORE UPDATE ON public.landing_leads
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

ALTER TABLE public.landing_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_leads FORCE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.landing_leads FROM PUBLIC;
REVOKE ALL ON TABLE public.landing_leads FROM anon;
GRANT SELECT, UPDATE, DELETE ON TABLE public.landing_leads TO authenticated;
GRANT ALL ON TABLE public.landing_leads TO service_role;

DROP POLICY IF EXISTS "landing_leads_admin_all" ON public.landing_leads;
CREATE POLICY "landing_leads_admin_all"
  ON public.landing_leads FOR ALL
  TO authenticated
  USING (private.current_user_role() IN ('admin', 'dev'))
  WITH CHECK (private.current_user_role() IN ('admin', 'dev'));
