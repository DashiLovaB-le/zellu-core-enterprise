-- ============================================================
-- MIGRAÇÃO 004 — Sistema de Notificações Preventivas
-- Tabela para histórico de alertas e persistência de dismiss
-- ============================================================

-- -----------------------------------------------------------
-- 1. preventive_notifications — histórico de alertas preventivos
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS preventive_notifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type          TEXT NOT NULL CHECK (type IN ('burnout-risk', 'sleep-crisis', 'mood-crisis', 'disengagement', 'hydration', 'energy', 'movement')),
  severity      TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
  message       TEXT NOT NULL,
  suggestion    TEXT NOT NULL DEFAULT '',
  details       JSONB NOT NULL DEFAULT '{}',
  dismissed     BOOLEAN NOT NULL DEFAULT false,
  dismissed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_preventive_notifications_user ON preventive_notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_preventive_notifications_active ON preventive_notifications(user_id, dismissed) WHERE dismissed = false;

ALTER TABLE preventive_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "preventive_notifications_own_select" ON preventive_notifications;
CREATE POLICY "preventive_notifications_own_select"
  ON preventive_notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "preventive_notifications_own_insert" ON preventive_notifications;
CREATE POLICY "preventive_notifications_own_insert"
  ON preventive_notifications FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "preventive_notifications_own_update" ON preventive_notifications;
CREATE POLICY "preventive_notifications_own_update"
  ON preventive_notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "preventive_notifications_own_delete" ON preventive_notifications;
CREATE POLICY "preventive_notifications_own_delete"
  ON preventive_notifications FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
