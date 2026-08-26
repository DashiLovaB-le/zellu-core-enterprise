-- ============================================================
-- FASE 15 — Portal Administrativo (Zēllu)
-- Role admin, empresas, equipes, licenças, contratos, alertas
-- ============================================================

-- -----------------------------------------------------------
-- 1. Ampliar roles de profiles com 'admin'
-- -----------------------------------------------------------
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('companion', 'manager', 'dev', 'admin'));

-- -----------------------------------------------------------
-- 2. companies (clientes B2B da Zēllu)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS companies (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  slug          TEXT UNIQUE,
  document      TEXT,
  industry      TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  status        TEXT NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active', 'inactive', 'trial', 'churned')),
  seats         INT NOT NULL DEFAULT 50 CHECK (seats >= 0),
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_companies_status ON companies(status);
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);

DROP TRIGGER IF EXISTS trg_companies_updated_at ON companies;
CREATE TRIGGER trg_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "companies_admin_all" ON companies;
CREATE POLICY "companies_admin_all"
  ON companies FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'dev')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'dev')
    )
  );

DROP POLICY IF EXISTS "companies_manager_read" ON companies;
CREATE POLICY "companies_manager_read"
  ON companies FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('manager', 'admin', 'dev')
    )
  );

-- -----------------------------------------------------------
-- 3. teams (equipes dentro de uma empresa)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS teams (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE (company_id, name)
);

CREATE INDEX IF NOT EXISTS idx_teams_company ON teams(company_id);

DROP TRIGGER IF EXISTS trg_teams_updated_at ON teams;
CREATE TRIGGER trg_teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "teams_admin_all" ON teams;
CREATE POLICY "teams_admin_all"
  ON teams FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'dev')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'dev')
    )
  );

DROP POLICY IF EXISTS "teams_manager_read" ON teams;
CREATE POLICY "teams_manager_read"
  ON teams FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('manager', 'admin', 'dev')
    )
  );

-- -----------------------------------------------------------
-- 4. profiles: vínculo com empresa/equipe
-- -----------------------------------------------------------
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS job_title TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_profiles_company ON profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_profiles_team ON profiles(team_id);

-- -----------------------------------------------------------
-- 5. licenses
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS licenses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  plan_name     TEXT NOT NULL DEFAULT 'standard',
  seats         INT NOT NULL DEFAULT 50 CHECK (seats >= 0),
  seats_used    INT NOT NULL DEFAULT 0 CHECK (seats_used >= 0),
  status        TEXT NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active', 'expired', 'suspended', 'trial')),
  starts_at     DATE NOT NULL DEFAULT CURRENT_DATE,
  ends_at       DATE,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_licenses_company ON licenses(company_id);
CREATE INDEX IF NOT EXISTS idx_licenses_status ON licenses(status);

DROP TRIGGER IF EXISTS trg_licenses_updated_at ON licenses;
CREATE TRIGGER trg_licenses_updated_at
  BEFORE UPDATE ON licenses
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "licenses_admin_all" ON licenses;
CREATE POLICY "licenses_admin_all"
  ON licenses FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'dev')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'dev')
    )
  );

-- -----------------------------------------------------------
-- 6. contracts
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS contracts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  contract_type TEXT NOT NULL DEFAULT 'saas'
                  CHECK (contract_type IN ('saas', 'pilot', 'enterprise', 'renewal')),
  value_brl     NUMERIC(12, 2) DEFAULT 0,
  status        TEXT NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft', 'active', 'expired', 'cancelled')),
  starts_at     DATE,
  ends_at       DATE,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contracts_company ON contracts(company_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);

DROP TRIGGER IF EXISTS trg_contracts_updated_at ON contracts;
CREATE TRIGGER trg_contracts_updated_at
  BEFORE UPDATE ON contracts
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "contracts_admin_all" ON contracts;
CREATE POLICY "contracts_admin_all"
  ON contracts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'dev')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'dev')
    )
  );

-- -----------------------------------------------------------
-- 7. alert_configs (thresholds configuráveis)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS alert_configs (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id            UUID REFERENCES companies(id) ON DELETE CASCADE,
  name                  TEXT NOT NULL,
  mood_negative_warn    INT NOT NULL DEFAULT 20 CHECK (mood_negative_warn BETWEEN 0 AND 100),
  mood_negative_critical INT NOT NULL DEFAULT 40 CHECK (mood_negative_critical BETWEEN 0 AND 100),
  sleep_hours_min       REAL NOT NULL DEFAULT 6 CHECK (sleep_hours_min >= 0),
  water_ml_min          INT NOT NULL DEFAULT 1000 CHECK (water_ml_min >= 0),
  adhesion_min_pct      INT NOT NULL DEFAULT 40 CHECK (adhesion_min_pct BETWEEN 0 AND 100),
  enabled               BOOLEAN NOT NULL DEFAULT true,
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_alert_configs_company ON alert_configs(company_id);

DROP TRIGGER IF EXISTS trg_alert_configs_updated_at ON alert_configs;
CREATE TRIGGER trg_alert_configs_updated_at
  BEFORE UPDATE ON alert_configs
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

ALTER TABLE alert_configs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "alert_configs_admin_all" ON alert_configs;
CREATE POLICY "alert_configs_admin_all"
  ON alert_configs FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'dev')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'dev')
    )
  );

-- Seed: configuração global padrão (company_id NULL = global)
INSERT INTO alert_configs (name, mood_negative_warn, mood_negative_critical, sleep_hours_min, water_ml_min, adhesion_min_pct, enabled)
SELECT 'Global padrão', 20, 40, 6, 1000, 40, true
WHERE NOT EXISTS (
  SELECT 1 FROM alert_configs WHERE company_id IS NULL AND name = 'Global padrão'
);
