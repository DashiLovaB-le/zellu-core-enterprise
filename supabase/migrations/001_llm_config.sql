-- Create llm_config table for storing LLM configuration (singleton, id=1)
CREATE TABLE IF NOT EXISTS llm_config (
  id            INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  model         TEXT NOT NULL DEFAULT 'openai/gpt-4o-mini',
  temperature   REAL NOT NULL DEFAULT 0.7,
  max_tokens    INT NOT NULL DEFAULT 300,
  system_prompt TEXT NOT NULL DEFAULT '',
  api_key       TEXT NOT NULL DEFAULT '',
  updated_at    TIMESTAMPTZ DEFAULT now(),
  updated_by    UUID REFERENCES auth.users(id)
);

-- Row-level security: only dev role can read/write
ALTER TABLE llm_config ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users with user_metadata->role = 'dev' to select
CREATE POLICY "dev_select_llm_config"
  ON llm_config
  FOR SELECT
  TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'dev');

-- Allow authenticated users with user_metadata->role = 'dev' to insert
CREATE POLICY "dev_insert_llm_config"
  ON llm_config
  FOR INSERT
  TO authenticated
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'dev');

-- Allow authenticated users with user_metadata->role = 'dev' to update
CREATE POLICY "dev_update_llm_config"
  ON llm_config
  FOR UPDATE
  TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'dev')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'dev');

-- Allow authenticated users with user_metadata->role = 'dev' to delete
CREATE POLICY "dev_delete_llm_config"
  ON llm_config
  FOR DELETE
  TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'dev');
