CREATE TABLE IF NOT EXISTS checkins (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sleep_hours   REAL NOT NULL,
  sleep_label   TEXT NOT NULL DEFAULT '',
  water_ml      INT NOT NULL DEFAULT 0,
  mood          TEXT NOT NULL DEFAULT '',
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_checkins_user_date ON checkins(user_id, created_at DESC);

ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "checkins_own_select"
  ON checkins FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "checkins_own_insert"
  ON checkins FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "checkins_own_update"
  ON checkins FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "checkins_own_delete"
  ON checkins FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
