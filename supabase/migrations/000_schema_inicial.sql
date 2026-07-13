-- ============================================================
-- SCHEMA INICIAL — LVB ZelluApp
-- Contém todas as tabelas, índices, RLS e funções do sistema.
-- ============================================================

-- Extensão necessária para gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------
-- Função utilitária: atualiza updated_at automaticamente
-- -----------------------------------------------------------
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------
-- Função: cria profile automaticamente ao cadastrar usuário
-- -----------------------------------------------------------
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', SPLIT_PART(COALESCE(NEW.email, ''), '@', 1)),
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'companion')
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- -----------------------------------------------------------
-- 1. profiles
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT,
  display_name  TEXT,
  role          TEXT NOT NULL DEFAULT 'companion' CHECK (role IN ('companion', 'manager', 'dev')),
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_read_own" ON profiles;
CREATE POLICY "profiles_read_own"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "manager_read_profiles" ON profiles;
CREATE POLICY "manager_read_profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'manager');

-- -----------------------------------------------------------
-- 2. llm_config  (singleton, id = 1)
-- -----------------------------------------------------------
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

ALTER TABLE llm_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dev_select_llm_config" ON llm_config;
CREATE POLICY "dev_select_llm_config"
  ON llm_config FOR SELECT
  TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'dev');

DROP POLICY IF EXISTS "dev_insert_llm_config" ON llm_config;
CREATE POLICY "dev_insert_llm_config"
  ON llm_config FOR INSERT
  TO authenticated
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'dev');

DROP POLICY IF EXISTS "dev_update_llm_config" ON llm_config;
CREATE POLICY "dev_update_llm_config"
  ON llm_config FOR UPDATE
  TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'dev')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'dev');

DROP POLICY IF EXISTS "dev_delete_llm_config" ON llm_config;
CREATE POLICY "dev_delete_llm_config"
  ON llm_config FOR DELETE
  TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'dev');

-- -----------------------------------------------------------
-- 3. checkins
-- -----------------------------------------------------------
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
CREATE INDEX IF NOT EXISTS idx_checkins_created_at ON checkins(created_at DESC);

ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "checkins_own_select" ON checkins;
CREATE POLICY "checkins_own_select"
  ON checkins FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "checkins_own_insert" ON checkins;
CREATE POLICY "checkins_own_insert"
  ON checkins FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "checkins_own_update" ON checkins;
CREATE POLICY "checkins_own_update"
  ON checkins FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "checkins_own_delete" ON checkins;
CREATE POLICY "checkins_own_delete"
  ON checkins FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "manager_read_checkins" ON checkins;
CREATE POLICY "manager_read_checkins"
  ON checkins FOR SELECT
  TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'manager');

-- -----------------------------------------------------------
-- 4. chat_messages
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS chat_messages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "from"        TEXT NOT NULL CHECK ("from" IN ('user', 'ai')),
  text          TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_user_asc ON chat_messages(user_id, created_at ASC);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chat_own_select" ON chat_messages;
CREATE POLICY "chat_own_select"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "chat_own_insert" ON chat_messages;
CREATE POLICY "chat_own_insert"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "chat_own_update" ON chat_messages;
CREATE POLICY "chat_own_update"
  ON chat_messages FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "chat_own_delete" ON chat_messages;
CREATE POLICY "chat_own_delete"
  ON chat_messages FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- -----------------------------------------------------------
-- 5. diary_entries
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS diary_entries (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content       TEXT NOT NULL DEFAULT '',
  mood          TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_diary_user_date ON diary_entries(user_id, created_at DESC);

DROP TRIGGER IF EXISTS trg_diary_entries_updated_at ON diary_entries;
CREATE TRIGGER trg_diary_entries_updated_at
  BEFORE UPDATE ON diary_entries
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

ALTER TABLE diary_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "diary_own_select" ON diary_entries;
CREATE POLICY "diary_own_select"
  ON diary_entries FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "diary_own_insert" ON diary_entries;
CREATE POLICY "diary_own_insert"
  ON diary_entries FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "diary_own_update" ON diary_entries;
CREATE POLICY "diary_own_update"
  ON diary_entries FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "diary_own_delete" ON diary_entries;
CREATE POLICY "diary_own_delete"
  ON diary_entries FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- -----------------------------------------------------------
-- 6. habits
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS habits (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  water_ml      INT NOT NULL DEFAULT 0,
  sleep_quality INT NOT NULL DEFAULT 50,
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_habits_user ON habits(user_id);

DROP TRIGGER IF EXISTS trg_habits_updated_at ON habits;
CREATE TRIGGER trg_habits_updated_at
  BEFORE UPDATE ON habits
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

ALTER TABLE habits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "habits_own_select" ON habits;
CREATE POLICY "habits_own_select"
  ON habits FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "habits_own_insert" ON habits;
CREATE POLICY "habits_own_insert"
  ON habits FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "habits_own_update" ON habits;
CREATE POLICY "habits_own_update"
  ON habits FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "habits_own_delete" ON habits;
CREATE POLICY "habits_own_delete"
  ON habits FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
