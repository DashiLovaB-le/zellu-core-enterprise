-- ============================================================
-- FASE LGPD — opt-ins, idade, RLS sem check-in nominal ao RH,
-- retenção e logs sem dado de saúde
-- ============================================================

-- Preferências e declaração de maioridade (titular)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS privacy_ai_opt_in BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS privacy_rh_opt_in BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS privacy_email_opt_in BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS adult_confirmed_at TIMESTAMPTZ;

-- RH/manager NÃO lê check-ins nem hábitos individuais.
-- Agregação do painel usa service role no servidor após requireManager.
DROP POLICY IF EXISTS "checkins_manager_company_select" ON checkins;
DROP POLICY IF EXISTS "habits_manager_company_select" ON habits;
DROP POLICY IF EXISTS "manager_read_checkins" ON checkins;
DROP POLICY IF EXISTS "manager_read_company_checkins" ON checkins;

DROP POLICY IF EXISTS "checkins_staff_select" ON checkins;
CREATE POLICY "checkins_staff_select"
  ON checkins FOR SELECT
  TO authenticated
  USING (private.current_user_role() IN ('admin', 'dev'));

DROP POLICY IF EXISTS "habits_staff_select" ON habits;
CREATE POLICY "habits_staff_select"
  ON habits FOR SELECT
  TO authenticated
  USING (private.current_user_role() IN ('admin', 'dev'));

-- Diário / chat / preventiva: reforço — só o titular (admin/dev também não lê via RLS;
-- suporte usa service role auditado no servidor, nunca o cliente).
DROP POLICY IF EXISTS "diary_staff_select" ON diary_entries;
DROP POLICY IF EXISTS "chat_staff_select" ON chat_messages;

-- Profiles: manager vê metadados operacionais da empresa, não flags de saúde.
-- (SELECT * ainda é possível via PostgREST; a API não devolve opt-ins de terceiros.)

CREATE TABLE IF NOT EXISTS system_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level      TEXT NOT NULL,
  source     TEXT NOT NULL,
  message    TEXT NOT NULL,
  details    JSONB,
  user_id    UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dev_select_system_logs" ON system_logs;
CREATE POLICY "dev_select_system_logs"
  ON system_logs FOR SELECT
  TO authenticated
  USING (private.current_user_role() IN ('admin', 'dev'));

CREATE INDEX IF NOT EXISTS idx_system_logs_created ON system_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_user ON system_logs(user_id);

-- Retenção: apaga conteúdo textual antigo (chat, diário, preventiva).
-- Check-ins numéricos: 365 dias. Logs: 90 dias.
CREATE OR REPLACE FUNCTION private.purge_expired_personal_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM chat_messages
  WHERE created_at < now() - interval '180 days';

  DELETE FROM diary_entries
  WHERE created_at < now() - interval '180 days';

  DELETE FROM preventive_notifications
  WHERE created_at < now() - interval '180 days';

  DELETE FROM checkins
  WHERE created_at < now() - interval '365 days';

  DELETE FROM system_logs
  WHERE created_at < now() - interval '90 days';
END;
$$;

REVOKE ALL ON FUNCTION private.purge_expired_personal_data() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.purge_expired_personal_data() TO service_role;
