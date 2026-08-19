-- ============================================================
-- Memórias curadas do companion (médio/longo prazo).
-- Sem acesso de RH. Só o titular via RLS. Retenção 180 dias.
-- ============================================================

CREATE TABLE IF NOT EXISTS companion_memories (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content       TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 180),
  importance    SMALLINT NOT NULL DEFAULT 3 CHECK (importance BETWEEN 1 AND 5),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_companion_memories_user_rank
  ON companion_memories (user_id, importance DESC, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_companion_memories_user_content
  ON companion_memories (user_id, content);

ALTER TABLE companion_memories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "companion_memories_own_select" ON companion_memories;
CREATE POLICY "companion_memories_own_select"
  ON companion_memories FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "companion_memories_own_insert" ON companion_memories;
CREATE POLICY "companion_memories_own_insert"
  ON companion_memories FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "companion_memories_own_update" ON companion_memories;
CREATE POLICY "companion_memories_own_update"
  ON companion_memories FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "companion_memories_own_delete" ON companion_memories;
CREATE POLICY "companion_memories_own_delete"
  ON companion_memories FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

DROP TRIGGER IF EXISTS trg_companion_memories_updated_at ON companion_memories;
CREATE TRIGGER trg_companion_memories_updated_at
  BEFORE UPDATE ON companion_memories
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

REVOKE ALL ON companion_memories FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON companion_memories TO authenticated;
GRANT ALL ON companion_memories TO service_role;

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

  DELETE FROM companion_memories
  WHERE created_at < now() - interval '180 days';

  DELETE FROM checkins
  WHERE created_at < now() - interval '365 days';

  DELETE FROM system_logs
  WHERE created_at < now() - interval '90 days';
END;
$$;

REVOKE ALL ON FUNCTION private.purge_expired_personal_data() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.purge_expired_personal_data() TO service_role;
