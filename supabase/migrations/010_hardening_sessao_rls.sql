-- Hardening: FORCE RLS, RPCs de convite/assentos/quota, cache compartilhado, self-test.

CREATE SCHEMA IF NOT EXISTS private;

ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.llm_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.llm_config FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.checkins FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.chat_messages FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.diary_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.diary_entries FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.habits FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.preventive_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.preventive_notifications FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.wellness_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.wellness_plans FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.wellness_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.wellness_checklist FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.companies FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.teams FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.licenses FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.contracts FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.alert_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.alert_configs FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.invites FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.system_logs FORCE ROW LEVEL SECURITY;

-- Manager lê licença da própria empresa (contagem de assentos via RPC definer ainda é o gate).
DROP POLICY IF EXISTS "licenses_manager_select" ON licenses;
CREATE POLICY "licenses_manager_select"
  ON licenses FOR SELECT
  TO authenticated
  USING (
    private.current_user_role() IN ('manager', 'dev')
    AND company_id = private.current_user_company_id()
  );

CREATE OR REPLACE FUNCTION public.company_has_available_seat(p_company_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  role text := private.current_user_role();
  seats int;
  used int;
  pending int;
BEGIN
  IF role NOT IN ('admin', 'dev', 'manager') THEN
    RETURN false;
  END IF;
  IF role = 'manager' AND private.current_user_company_id() IS DISTINCT FROM p_company_id THEN
    RETURN false;
  END IF;

  SELECT l.seats INTO seats
  FROM licenses l
  WHERE l.company_id = p_company_id AND l.status IN ('active', 'trial')
  ORDER BY l.created_at DESC
  LIMIT 1;

  seats := COALESCE(seats, 50);

  SELECT count(*) INTO used FROM profiles WHERE company_id = p_company_id AND is_active IS TRUE;
  SELECT count(*) INTO pending FROM invites
    WHERE company_id = p_company_id AND accepted_at IS NULL AND expires_at > now();

  RETURN (used + pending) < seats;
END;
$$;

REVOKE ALL ON FUNCTION public.company_has_available_seat(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.company_has_available_seat(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_invite_public(p_token text)
RETURNS TABLE (
  email text,
  role text,
  company_name text,
  expires_at timestamptz,
  accepted_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT i.email, i.role, c.name, i.expires_at, i.accepted_at
  FROM invites i
  JOIN companies c ON c.id = i.company_id
  WHERE i.token = p_token
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_invite_public(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_invite_public(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.set_employee_active(p_profile_id uuid, p_active boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target public.profiles%ROWTYPE;
  role text := private.current_user_role();
BEGIN
  IF role NOT IN ('admin', 'dev', 'manager') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT * INTO target FROM profiles WHERE id = p_profile_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Colaborador não encontrado';
  END IF;
  IF target.role IN ('admin', 'dev') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  IF role = 'manager' AND target.company_id IS DISTINCT FROM private.current_user_company_id() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  PERFORM set_config('mmc.set_employee_active', 'on', true);
  UPDATE profiles SET is_active = p_active WHERE id = p_profile_id;
END;
$$;

REVOKE ALL ON FUNCTION public.set_employee_active(uuid, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_employee_active(uuid, boolean) TO authenticated;

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
  IF private.current_user_role() = 'manager'
     AND current_setting('mmc.set_employee_active', true) = 'on' THEN
    NEW.role := OLD.role;
    NEW.company_id := OLD.company_id;
    NEW.team_id := OLD.team_id;
    RETURN NEW;
  END IF;
  NEW.role := OLD.role;
  NEW.company_id := OLD.company_id;
  NEW.team_id := OLD.team_id;
  NEW.is_active := OLD.is_active;
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS private.compute_cache (
  cache_key text PRIMARY KEY,
  payload jsonb NOT NULL,
  expires_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_compute_cache_expires ON private.compute_cache (expires_at);

CREATE OR REPLACE FUNCTION public.preventive_cache_get()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, private
AS $$
DECLARE
  result jsonb;
BEGIN
  DELETE FROM private.compute_cache WHERE expires_at <= now();
  SELECT payload INTO result
  FROM private.compute_cache
  WHERE cache_key = 'preventive:' || auth.uid()::text
    AND expires_at > now();
  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.preventive_cache_get() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.preventive_cache_get() TO authenticated;

CREATE OR REPLACE FUNCTION public.preventive_cache_set(p_payload jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  INSERT INTO private.compute_cache (cache_key, payload, expires_at)
  VALUES ('preventive:' || auth.uid()::text, p_payload, now() + interval '30 minutes')
  ON CONFLICT (cache_key) DO UPDATE
    SET payload = EXCLUDED.payload,
        expires_at = EXCLUDED.expires_at;
END;
$$;

REVOKE ALL ON FUNCTION public.preventive_cache_set(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.preventive_cache_set(jsonb) TO authenticated;

CREATE TABLE IF NOT EXISTS private.client_log_quota (
  user_id uuid PRIMARY KEY,
  window_start timestamptz NOT NULL,
  count int NOT NULL DEFAULT 0
);

CREATE OR REPLACE FUNCTION public.consume_client_log_quota()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
DECLARE
  uid uuid := auth.uid();
  max_per_min int := 20;
  rec private.client_log_quota%ROWTYPE;
BEGIN
  IF uid IS NULL THEN
    RETURN false;
  END IF;

  SELECT * INTO rec FROM private.client_log_quota WHERE user_id = uid FOR UPDATE;
  IF NOT FOUND THEN
    INSERT INTO private.client_log_quota (user_id, window_start, count)
    VALUES (uid, now(), 1);
    RETURN true;
  END IF;

  IF rec.window_start < now() - interval '1 minute' THEN
    UPDATE private.client_log_quota
      SET window_start = now(), count = 1
      WHERE user_id = uid;
    RETURN true;
  END IF;

  IF rec.count >= max_per_min THEN
    RETURN false;
  END IF;

  UPDATE private.client_log_quota SET count = count + 1 WHERE user_id = uid;
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_client_log_quota() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_client_log_quota() TO authenticated;

CREATE OR REPLACE FUNCTION public.run_rls_self_test()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  force_ok boolean := true;
  tbl text;
  user_a uuid;
  user_b uuid;
  seen int := 0;
  isolation_ok boolean := true;
  isolation_note text := 'ok';
  missing_force text[] := '{}';
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'profiles', 'checkins', 'chat_messages', 'diary_entries', 'habits',
    'wellness_plans', 'wellness_checklist', 'invites', 'preventive_notifications'
  ]
  LOOP
    IF EXISTS (
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relname = tbl AND c.relkind = 'r'
    ) AND NOT EXISTS (
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relname = tbl
        AND c.relrowsecurity AND c.relforcerowsecurity
    ) THEN
      force_ok := false;
      missing_force := array_append(missing_force, tbl);
    END IF;
  END LOOP;

  SELECT a.id, b.id INTO user_a, user_b
  FROM profiles a
  JOIN profiles b ON a.company_id IS DISTINCT FROM b.company_id
  WHERE a.role = 'companion' AND b.role = 'companion'
    AND a.company_id IS NOT NULL AND b.company_id IS NOT NULL
  LIMIT 1;

  IF user_a IS NULL THEN
    isolation_note := 'skipped_no_two_tenants';
  ELSE
    PERFORM set_config('request.jwt.claims', json_build_object('sub', user_a, 'role', 'authenticated')::text, true);
    PERFORM set_config('request.jwt.claim.sub', user_a::text, true);
    BEGIN
      EXECUTE 'SET LOCAL ROLE authenticated';
      SELECT count(*) INTO seen FROM checkins WHERE user_id = user_b;
      EXECUTE 'RESET ROLE';
      IF seen > 0 THEN
        isolation_ok := false;
        isolation_note := 'companion_saw_other_tenant_checkins';
      END IF;
    EXCEPTION WHEN OTHERS THEN
      EXECUTE 'RESET ROLE';
      isolation_ok := false;
      isolation_note := SQLERRM;
    END;
  END IF;

  RETURN jsonb_build_object(
    'ok', force_ok AND isolation_ok,
    'force_rls', force_ok,
    'missing_force', missing_force,
    'isolation_ok', isolation_ok,
    'isolation_note', isolation_note
  );
END;
$$;

REVOKE ALL ON FUNCTION public.run_rls_self_test() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.run_rls_self_test() TO service_role;
