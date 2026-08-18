-- ============================================================
-- FASE P — Isolamento B2B, convites, LGPD, RLS por empresa
-- Idempotente: seguro em banco que já tem schema private + portal admin.
-- ============================================================

CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated;

-- Helpers SECURITY DEFINER fora do schema exposto (não usar user_metadata)
CREATE OR REPLACE FUNCTION private.current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION private.current_user_company_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid()
$$;

REVOKE ALL ON FUNCTION private.current_user_role() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.current_user_company_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION private.current_user_company_id() TO authenticated;

-- Cadastro nunca herda role do metadata do cliente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = 'pg_catalog', 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', SPLIT_PART(COALESCE(NEW.email, ''), '@', 1)),
    'companion'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Colunas de perfil para consentimento, fuso e onboarding
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/Sao_Paulo',
  ADD COLUMN IF NOT EXISTS privacy_consent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS privacy_consent_version TEXT,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_checkin_reminder_at TIMESTAMPTZ;

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS support_channel TEXT;

-- Impede companion/manager de alterar campos privilegiados no próprio perfil
CREATE OR REPLACE FUNCTION public.protect_profile_privileged_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  IF private.current_user_role() IN ('admin', 'dev') THEN
    RETURN NEW;
  END IF;
  NEW.role := OLD.role;
  NEW.company_id := OLD.company_id;
  NEW.team_id := OLD.team_id;
  NEW.is_active := OLD.is_active;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_privileged ON profiles;
CREATE TRIGGER trg_protect_profile_privileged
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_privileged_columns();

-- Convites
CREATE TABLE IF NOT EXISTS invites (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  team_id       UUID REFERENCES teams(id) ON DELETE SET NULL,
  email         TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('companion', 'manager')),
  token         TEXT NOT NULL UNIQUE,
  invited_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at    TIMESTAMPTZ NOT NULL,
  accepted_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invites_company ON invites(company_id);
CREATE INDEX IF NOT EXISTS idx_invites_token ON invites(token);
CREATE INDEX IF NOT EXISTS idx_invites_email ON invites(email);

ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "invites_admin_all" ON invites;
CREATE POLICY "invites_admin_all"
  ON invites FOR ALL
  TO authenticated
  USING (private.current_user_role() IN ('admin', 'dev'))
  WITH CHECK (private.current_user_role() IN ('admin', 'dev'));

DROP POLICY IF EXISTS "invites_manager_company" ON invites;
CREATE POLICY "invites_manager_company"
  ON invites FOR ALL
  TO authenticated
  USING (
    private.current_user_role() = 'manager'
    AND company_id = private.current_user_company_id()
  )
  WITH CHECK (
    private.current_user_role() = 'manager'
    AND company_id = private.current_user_company_id()
  );

-- RLS: dropar policies baseadas em user_metadata / nomes antigos
DROP POLICY IF EXISTS "manager_read_profiles" ON profiles;
DROP POLICY IF EXISTS "manager_read_checkins" ON checkins;
DROP POLICY IF EXISTS "dev_select_llm_config" ON llm_config;
DROP POLICY IF EXISTS "dev_insert_llm_config" ON llm_config;
DROP POLICY IF EXISTS "dev_update_llm_config" ON llm_config;
DROP POLICY IF EXISTS "dev_delete_llm_config" ON llm_config;

-- Profiles: próprio + manager da mesma empresa (metadados) + admin
DROP POLICY IF EXISTS "profiles_read_own" ON profiles;
CREATE POLICY "profiles_read_own"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

DROP POLICY IF EXISTS "authorized_read_profiles" ON profiles;
DROP POLICY IF EXISTS "profiles_manager_company_select" ON profiles;
CREATE POLICY "profiles_manager_company_select"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    private.current_user_role() = 'manager'
    AND private.current_user_company_id() IS NOT NULL
    AND company_id = private.current_user_company_id()
  );

DROP POLICY IF EXISTS "profiles_admin_select" ON profiles;
CREATE POLICY "profiles_admin_select"
  ON profiles FOR SELECT
  TO authenticated
  USING (private.current_user_role() IN ('admin', 'dev'));

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Check-ins: próprio + manager da mesma empresa (agregados; sem diário/chat)
DROP POLICY IF EXISTS "manager_read_company_checkins" ON checkins;
DROP POLICY IF EXISTS "checkins_manager_company_select" ON checkins;
CREATE POLICY "checkins_manager_company_select"
  ON checkins FOR SELECT
  TO authenticated
  USING (
    private.current_user_role() IN ('manager', 'admin', 'dev')
    AND (
      private.current_user_role() IN ('admin', 'dev')
      OR EXISTS (
        SELECT 1 FROM profiles owner
        WHERE owner.id = checkins.user_id
          AND owner.company_id = private.current_user_company_id()
      )
    )
  );

-- Hábitos agregáveis pelo RH (sem texto livre)
DROP POLICY IF EXISTS "habits_manager_company_select" ON habits;
CREATE POLICY "habits_manager_company_select"
  ON habits FOR SELECT
  TO authenticated
  USING (
    private.current_user_role() IN ('manager', 'admin', 'dev')
    AND (
      private.current_user_role() IN ('admin', 'dev')
      OR EXISTS (
        SELECT 1 FROM profiles owner
        WHERE owner.id = habits.user_id
          AND owner.company_id = private.current_user_company_id()
      )
    )
  );

-- Diário e chat: NUNCA visíveis ao manager
DROP POLICY IF EXISTS "diary_manager_read" ON diary_entries;
DROP POLICY IF EXISTS "chat_manager_read" ON chat_messages;

-- llm_config: role no perfil (admin/dev). Mantém policy única já usada no live.
DROP POLICY IF EXISTS "authorized_manage_llm_config" ON llm_config;
CREATE POLICY "authorized_manage_llm_config"
  ON llm_config FOR ALL
  TO authenticated
  USING (private.current_user_role() IN ('admin', 'dev'))
  WITH CHECK (private.current_user_role() IN ('admin', 'dev'));

-- Companies/teams: manager só a própria empresa
DROP POLICY IF EXISTS "companies_manager_read" ON companies;
CREATE POLICY "companies_manager_read"
  ON companies FOR SELECT
  TO authenticated
  USING (
    private.current_user_role() IN ('admin', 'dev')
    OR (
      private.current_user_role() = 'manager'
      AND id = private.current_user_company_id()
    )
  );

DROP POLICY IF EXISTS "teams_manager_read" ON teams;
CREATE POLICY "teams_manager_read"
  ON teams FOR SELECT
  TO authenticated
  USING (
    private.current_user_role() IN ('admin', 'dev')
    OR (
      private.current_user_role() = 'manager'
      AND company_id = private.current_user_company_id()
    )
  );

-- Logs: role do perfil, não user_metadata
DROP POLICY IF EXISTS "dev_select_system_logs" ON system_logs;
CREATE POLICY "dev_select_system_logs"
  ON system_logs FOR SELECT
  TO authenticated
  USING (private.current_user_role() IN ('admin', 'dev'));
