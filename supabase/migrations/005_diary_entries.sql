CREATE TABLE IF NOT EXISTS diary_entries (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content       TEXT NOT NULL DEFAULT '',
  mood          TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_diary_user_date ON diary_entries(user_id, created_at DESC);

ALTER TABLE diary_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "diary_own_select"
  ON diary_entries FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "diary_own_insert"
  ON diary_entries FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "diary_own_update"
  ON diary_entries FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "diary_own_delete"
  ON diary_entries FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
