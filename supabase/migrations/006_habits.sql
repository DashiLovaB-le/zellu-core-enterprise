CREATE TABLE IF NOT EXISTS habits (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  water_ml      INT NOT NULL DEFAULT 0,
  sleep_quality INT NOT NULL DEFAULT 50,
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_habits_user ON habits(user_id);

ALTER TABLE habits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "habits_own_select"
  ON habits FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "habits_own_insert"
  ON habits FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "habits_own_update"
  ON habits FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "habits_own_delete"
  ON habits FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
