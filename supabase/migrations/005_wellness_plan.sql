-- ============================================================
-- MIGRAÇÃO 005 — Plano de Cuidado (Bem-estar)
-- wellness_plans: plano com objetivo definido pelo usuário
-- wellness_checklist: checklist diário do plano
-- ============================================================

-- -----------------------------------------------------------
-- 1. wellness_plans
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS wellness_plans (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal          TEXT NOT NULL DEFAULT '',
  custom_goal   TEXT NOT NULL DEFAULT '',
  start_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date      DATE,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wellness_plans_user ON wellness_plans(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_wellness_plans_active ON wellness_plans(is_active) WHERE is_active = true;

ALTER TABLE wellness_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wellness_plans_own_select" ON wellness_plans;
CREATE POLICY "wellness_plans_own_select"
  ON wellness_plans FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "wellness_plans_own_insert" ON wellness_plans;
CREATE POLICY "wellness_plans_own_insert"
  ON wellness_plans FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "wellness_plans_own_update" ON wellness_plans;
CREATE POLICY "wellness_plans_own_update"
  ON wellness_plans FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "wellness_plans_own_delete" ON wellness_plans;
CREATE POLICY "wellness_plans_own_delete"
  ON wellness_plans FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Trigger para updated_at
DROP TRIGGER IF EXISTS trg_wellness_plans_updated_at ON wellness_plans;
CREATE TRIGGER trg_wellness_plans_updated_at
  BEFORE UPDATE ON wellness_plans
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- -----------------------------------------------------------
-- 2. wellness_checklist
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS wellness_checklist (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id       UUID REFERENCES wellness_plans(id) ON DELETE CASCADE,
  date          DATE NOT NULL DEFAULT CURRENT_DATE,
  water_done    BOOLEAN NOT NULL DEFAULT false,
  walk_done     BOOLEAN NOT NULL DEFAULT false,
  breathe_done  BOOLEAN NOT NULL DEFAULT false,
  talk_done     BOOLEAN NOT NULL DEFAULT false,
  notes         TEXT NOT NULL DEFAULT '',
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_wellness_checklist_user_date ON wellness_checklist(user_id, date);
CREATE INDEX IF NOT EXISTS idx_wellness_checklist_plan ON wellness_checklist(plan_id, date DESC);

ALTER TABLE wellness_checklist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wellness_checklist_own_select" ON wellness_checklist;
CREATE POLICY "wellness_checklist_own_select"
  ON wellness_checklist FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "wellness_checklist_own_insert" ON wellness_checklist;
CREATE POLICY "wellness_checklist_own_insert"
  ON wellness_checklist FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "wellness_checklist_own_update" ON wellness_checklist;
CREATE POLICY "wellness_checklist_own_update"
  ON wellness_checklist FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "wellness_checklist_own_delete" ON wellness_checklist;
CREATE POLICY "wellness_checklist_own_delete"
  ON wellness_checklist FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Trigger para updated_at
DROP TRIGGER IF EXISTS trg_wellness_checklist_updated_at ON wellness_checklist;
CREATE TRIGGER trg_wellness_checklist_updated_at
  BEFORE UPDATE ON wellness_checklist
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();
