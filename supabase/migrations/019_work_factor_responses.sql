-- Pergunta diária sobre o trabalho.
-- O RH não lê a linha: só o agregado de get_rh_work_factors, com no mínimo 5 pessoas.

CREATE TABLE IF NOT EXISTS public.work_factor_responses (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  checkin_id   UUID NOT NULL REFERENCES public.checkins(id) ON DELETE CASCADE,
  factor_id    TEXT NOT NULL CHECK (factor_id IN ('carga', 'autonomia', 'apoio', 'relacoes')),
  score        SMALLINT NOT NULL CHECK (score BETWEEN 1 AND 5),
  answered_on  DATE NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, answered_on)
);

CREATE INDEX IF NOT EXISTS idx_work_factor_responses_checkin
  ON public.work_factor_responses (checkin_id);
CREATE INDEX IF NOT EXISTS idx_work_factor_responses_answered_on
  ON public.work_factor_responses (answered_on);

ALTER TABLE public.work_factor_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_factor_responses FORCE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.work_factor_responses FROM PUBLIC;
REVOKE ALL ON TABLE public.work_factor_responses FROM anon;
GRANT SELECT, INSERT, DELETE ON TABLE public.work_factor_responses TO authenticated;
GRANT ALL ON TABLE public.work_factor_responses TO service_role;

DROP POLICY IF EXISTS "work_factor_own_select" ON public.work_factor_responses;
CREATE POLICY "work_factor_own_select"
  ON public.work_factor_responses FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "work_factor_own_insert" ON public.work_factor_responses;
CREATE POLICY "work_factor_own_insert"
  ON public.work_factor_responses FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.checkins c
      WHERE c.id = checkin_id AND c.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "work_factor_own_delete" ON public.work_factor_responses;
CREATE POLICY "work_factor_own_delete"
  ON public.work_factor_responses FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Dias desde 1970-01-01, módulo 4, na ordem de WORK_FACTOR_IDS.
CREATE OR REPLACE FUNCTION private.work_factor_id_for_day(p_day date)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT (ARRAY['carga','autonomia','apoio','relacoes'])[
    (((p_day - DATE '1970-01-01') % 4 + 4) % 4) + 1
  ]
$$;

REVOKE ALL ON FUNCTION private.work_factor_id_for_day(date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.work_factor_id_for_day(date) TO authenticated;
GRANT EXECUTE ON FUNCTION private.work_factor_id_for_day(date) TO service_role;

CREATE OR REPLACE FUNCTION private.enforce_work_factor_response()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_day date := (timezone('America/Sao_Paulo', now()))::date;
  v_factor text := private.work_factor_id_for_day(v_day);
BEGIN
  IF auth.uid() IS NOT NULL AND NEW.user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;
  IF NEW.answered_on IS DISTINCT FROM v_day OR NEW.factor_id IS DISTINCT FROM v_factor THEN
    RAISE EXCEPTION 'work factor day mismatch' USING ERRCODE = '23514';
  END IF;
  IF NEW.score < 1 OR NEW.score > 5 THEN
    RAISE EXCEPTION 'invalid score' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.enforce_work_factor_response() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.enforce_work_factor_response() TO authenticated;
GRANT EXECUTE ON FUNCTION private.enforce_work_factor_response() TO service_role;

DROP TRIGGER IF EXISTS trg_enforce_work_factor_response ON public.work_factor_responses;
CREATE TRIGGER trg_enforce_work_factor_response
  BEFORE INSERT ON public.work_factor_responses
  FOR EACH ROW
  EXECUTE FUNCTION private.enforce_work_factor_response();

CREATE OR REPLACE FUNCTION public.work_factor_today()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'dayKey', (timezone('America/Sao_Paulo', now()))::date,
    'factorId', private.work_factor_id_for_day((timezone('America/Sao_Paulo', now()))::date)
  )
$$;

REVOKE ALL ON FUNCTION public.work_factor_today() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.work_factor_today() FROM anon;
GRANT EXECUTE ON FUNCTION public.work_factor_today() TO authenticated;

CREATE OR REPLACE FUNCTION public.save_my_checkin(
  p_sleep_hours real,
  p_sleep_label text,
  p_water_ml integer,
  p_mood text,
  p_factor_id text,
  p_score smallint
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_day date := (timezone('America/Sao_Paulo', now()))::date;
  v_factor text := private.work_factor_id_for_day(v_day);
  v_checkin uuid;
BEGIN
  IF v_uid IS NULL OR private.current_user_role() IS DISTINCT FROM 'companion' THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;
  IF p_score < 1 OR p_score > 5 THEN
    RAISE EXCEPTION 'invalid score' USING ERRCODE = '23514';
  END IF;
  IF p_factor_id IS DISTINCT FROM v_factor THEN
    RAISE EXCEPTION 'work factor day mismatch' USING ERRCODE = '23514';
  END IF;

  SELECT c.id INTO v_checkin
  FROM checkins c
  WHERE c.user_id = v_uid
    AND (timezone('America/Sao_Paulo', c.created_at))::date = v_day
  ORDER BY c.created_at DESC
  LIMIT 1;

  IF v_checkin IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM work_factor_responses r
      WHERE r.user_id = v_uid AND r.answered_on = v_day
    ) THEN
      RAISE EXCEPTION 'checkin already exists' USING ERRCODE = '23505';
    END IF;
  ELSE
    IF p_sleep_hours < 0 OR p_sleep_hours > 24
       OR p_water_ml < 0 OR p_water_ml > 10000
       OR p_mood IS NULL OR char_length(trim(p_mood)) = 0 OR char_length(p_mood) > 40
       OR p_sleep_label IS NULL OR char_length(p_sleep_label) > 40 THEN
      RAISE EXCEPTION 'invalid checkin values' USING ERRCODE = '23514';
    END IF;
    INSERT INTO checkins (user_id, sleep_hours, sleep_label, water_ml, mood)
    VALUES (v_uid, p_sleep_hours, p_sleep_label, p_water_ml, trim(p_mood))
    RETURNING id INTO v_checkin;
  END IF;

  INSERT INTO work_factor_responses (user_id, checkin_id, factor_id, score, answered_on)
  VALUES (v_uid, v_checkin, v_factor, p_score, v_day);

  RETURN jsonb_build_object('id', v_checkin);
END;
$$;

REVOKE ALL ON FUNCTION public.save_my_checkin(real, text, integer, text, text, smallint) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.save_my_checkin(real, text, integer, text, text, smallint) FROM anon;
GRANT EXECUTE ON FUNCTION public.save_my_checkin(real, text, integer, text, text, smallint) TO authenticated;

CREATE OR REPLACE FUNCTION private.get_rh_work_factors(p_period_days integer DEFAULT 28)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text := private.current_user_role();
  v_company uuid := private.current_user_company_id();
  v_days int := LEAST(GREATEST(COALESCE(p_period_days, 28), 7), 90);
  v_k int := 5;
  v_result jsonb;
BEGIN
  IF auth.uid() IS NULL OR v_role NOT IN ('manager', 'admin', 'dev') OR v_company IS NULL THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;

  WITH opted AS (
    SELECT p.id, COALESCE(t.name, 'Sem equipe') AS team_name
    FROM profiles p
    LEFT JOIN teams t ON t.id = p.team_id
    WHERE p.company_id = v_company
      AND p.role = 'companion'
      AND p.privacy_rh_opt_in IS TRUE
  ),
  team_counts AS (
    SELECT team_name, count(*)::int AS member_count
    FROM opted
    GROUP BY team_name
  ),
  answers AS (
    SELECT o.team_name, r.factor_id, r.user_id, r.score
    FROM work_factor_responses r
    JOIN opted o ON o.id = r.user_id
    WHERE r.answered_on >= (timezone('America/Sao_Paulo', now()))::date - (v_days - 1)
  ),
  factor_stats AS (
    SELECT
      team_name,
      factor_id,
      count(DISTINCT user_id)::int AS respondents,
      round(avg(score)::numeric, 1) AS average
    FROM answers
    GROUP BY team_name, factor_id
  )
  SELECT jsonb_build_object(
    'periodDays', v_days,
    'teams', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'teamName', tc.team_name,
          'metricsHidden', tc.member_count < v_k,
          'factors', (
            SELECT jsonb_agg(
              jsonb_build_object(
                'factorId', f.id,
                'respondents', CASE
                  WHEN tc.member_count < v_k OR COALESCE(fs.respondents, 0) < v_k THEN NULL
                  ELSE fs.respondents
                END,
                'average', CASE
                  WHEN tc.member_count < v_k OR COALESCE(fs.respondents, 0) < v_k THEN NULL
                  ELSE fs.average
                END
              )
              ORDER BY f.ord
            )
            FROM (VALUES
              ('carga', 1),
              ('autonomia', 2),
              ('apoio', 3),
              ('relacoes', 4)
            ) AS f(id, ord)
            LEFT JOIN factor_stats fs
              ON fs.team_name = tc.team_name AND fs.factor_id = f.id
          )
        )
        ORDER BY tc.team_name
      )
      FROM team_counts tc
      WHERE tc.member_count > 0
    ), '[]'::jsonb)
  )
  INTO v_result;

  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_rh_work_factors(p_period_days integer DEFAULT 28)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT private.get_rh_work_factors(p_period_days)
$$;

REVOKE ALL ON FUNCTION private.get_rh_work_factors(integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_rh_work_factors(integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_rh_work_factors(integer) FROM anon;
GRANT EXECUTE ON FUNCTION private.get_rh_work_factors(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_rh_work_factors(integer) TO authenticated;

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

  DELETE FROM work_factor_responses
  WHERE created_at < now() - interval '365 days';

  DELETE FROM checkins
  WHERE created_at < now() - interval '365 days';

  DELETE FROM system_logs
  WHERE created_at < now() - interval '90 days';
END;
$$;

REVOKE ALL ON FUNCTION private.purge_expired_personal_data() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.purge_expired_personal_data() TO service_role;
