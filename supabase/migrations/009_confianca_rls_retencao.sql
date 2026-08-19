-- ============================================================
-- Confiança: agregados RH no banco (sem service role),
-- diretório operacional sem dado de saúde, retenção diária.
-- ============================================================

CREATE OR REPLACE FUNCTION private.mood_score(p_mood text)
RETURNS numeric
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE lower(coalesce(p_mood, ''))
    WHEN 'irritado' THEN 1
    WHEN 'bravo' THEN 1
    WHEN 'triste' THEN 2
    WHEN 'desanimado' THEN 2
    WHEN 'carente' THEN 2
    WHEN 'inseguro' THEN 2
    WHEN 'ansioso' THEN 3
    WHEN 'preocupado' THEN 3
    WHEN 'sobrecarregado' THEN 3
    WHEN 'confuso' THEN 3
    WHEN 'neutro' THEN 4
    WHEN 'pensativo' THEN 4
    WHEN 'cansado' THEN 4
    WHEN 'calmo' THEN 5
    WHEN 'sereno' THEN 5
    WHEN 'focado' THEN 5
    WHEN 'acolhido' THEN 5
    WHEN 'feliz' THEN 6
    WHEN 'animado' THEN 6
    WHEN 'contente' THEN 6
    WHEN 'grato' THEN 6
    WHEN 'motivado' THEN 6
    WHEN 'esperancoso' THEN 6
    WHEN 'entusiasmado' THEN 6
    WHEN 'orgulhoso' THEN 6
    ELSE 0
  END
$$;

REVOKE ALL ON FUNCTION private.mood_score(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.mood_score(text) TO authenticated;
GRANT EXECUTE ON FUNCTION private.mood_score(text) TO service_role;

-- Painel RH: só JSON agregado da empresa do caller. Nunca devolve texto,
-- user_id, humor individual ou e-mail.
CREATE OR REPLACE FUNCTION private.get_rh_dashboard(p_period_days integer DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text := private.current_user_role();
  v_company uuid := private.current_user_company_id();
  v_days int := LEAST(GREATEST(COALESCE(p_period_days, 30), 1), 365);
  v_k int := 5;
  v_today date := (timezone('America/Sao_Paulo', now()))::date;
  v_result jsonb;
BEGIN
  IF auth.uid() IS NULL OR v_role NOT IN ('manager', 'admin', 'dev') OR v_company IS NULL THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;

  WITH opted AS (
    SELECT
      p.id,
      COALESCE(t.name, 'Sem equipe') AS team_name
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
  named_teams AS (
    SELECT name AS team_name
    FROM teams
    WHERE company_id = v_company
    UNION
    SELECT team_name FROM team_counts WHERE team_name = 'Sem equipe'
  ),
  checkin_rows AS (
    SELECT
      o.team_name,
      c.mood,
      c.sleep_hours,
      c.water_ml,
      c.created_at,
      (timezone('America/Sao_Paulo', c.created_at))::date AS local_day
    FROM checkins c
    JOIN opted o ON o.id = c.user_id
    WHERE c.created_at >= now() - make_interval(days => v_days)
  ),
  totals AS (
    SELECT
      (SELECT count(*)::int FROM opted) AS total_users,
      (SELECT count(*)::int FROM checkin_rows WHERE local_day = v_today) AS checkins_today,
      (SELECT count(*)::int FROM checkin_rows WHERE created_at >= now() - interval '7 days') AS checkins_week
  ),
  team_metrics AS (
    SELECT
      nt.team_name AS name,
      COALESCE(tc.member_count, 0)::int AS member_count,
      COALESCE(round(avg(private.mood_score(cr.mood))::numeric, 1), 0) AS avg_mood,
      COALESCE(round(avg(cr.sleep_hours)::numeric, 1), 0) AS avg_sleep,
      COALESCE(round(avg(cr.water_ml)::numeric, 0), 0) AS avg_water,
      COALESCE(
        round(
          100.0 * count(*) FILTER (
            WHERE private.mood_score(cr.mood) BETWEEN 1 AND 3
          ) / NULLIF(count(cr.mood), 0)
        ),
        0
      )::int AS negative_mood_pct
    FROM named_teams nt
    LEFT JOIN team_counts tc ON tc.team_name = nt.team_name
    LEFT JOIN checkin_rows cr ON cr.team_name = nt.team_name
    GROUP BY nt.team_name, tc.member_count
  ),
  teams_out AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'name', name,
        'memberCount', member_count,
        'avgSleep', CASE WHEN member_count > 0 AND member_count < v_k THEN 0 ELSE avg_sleep END,
        'avgMood', CASE WHEN member_count > 0 AND member_count < v_k THEN 0 ELSE avg_mood END,
        'avgWater', CASE WHEN member_count > 0 AND member_count < v_k THEN 0 ELSE avg_water END,
        'negativeMoodPct', CASE WHEN member_count > 0 AND member_count < v_k THEN 0 ELSE negative_mood_pct END,
        'status', CASE
          WHEN member_count > 0 AND member_count < v_k THEN 'stable'
          WHEN negative_mood_pct >= 40 THEN 'attention'
          WHEN negative_mood_pct >= 20 THEN 'monitor'
          ELSE 'stable'
        END,
        'metricsHidden', (member_count > 0 AND member_count < v_k)
      )
      ORDER BY name
    ) AS teams
    FROM team_metrics
  ),
  trends_src AS (
    SELECT
      local_day::text AS date,
      round(avg(private.mood_score(mood))::numeric, 1) AS avg_mood,
      round(avg(sleep_hours)::numeric, 1) AS avg_sleep,
      round(avg(water_ml)::numeric, 0) AS avg_water,
      count(*)::int AS checkin_count
    FROM checkin_rows
    GROUP BY local_day
  ),
  mood_src AS (
    SELECT m.mood, COALESCE(x.cnt, 0)::int AS cnt
    FROM (
      VALUES ('feliz'), ('calmo'), ('neutro'), ('ansioso'), ('triste'), ('irritado')
    ) AS m(mood)
    LEFT JOIN (
      SELECT lower(mood) AS mood, count(*)::int AS cnt
      FROM checkin_rows
      GROUP BY 1
    ) x ON x.mood = m.mood
  )
  SELECT jsonb_build_object(
    'totalUsers', t.total_users,
    'checkinsToday', t.checkins_today,
    'checkinsThisWeek', t.checkins_week,
    'weeklyAdhesion', CASE
      WHEN t.total_users > 0
        THEN LEAST(100, round((t.checkins_week::numeric / (t.total_users * 7)) * 100))
      ELSE 0
    END,
    'companyMetricsAllowed', t.total_users >= v_k,
    'teams', COALESCE(tm.teams, '[]'::jsonb),
    'trends', CASE
      WHEN t.total_users >= v_k THEN COALESCE(
        (SELECT jsonb_agg(
          jsonb_build_object(
            'date', date,
            'avgMood', avg_mood,
            'avgSleep', avg_sleep,
            'avgWater', avg_water,
            'checkinCount', checkin_count
          )
          ORDER BY date
        ) FROM trends_src),
        '[]'::jsonb
      )
      ELSE '[]'::jsonb
    END,
    'moodDistribution', CASE
      WHEN t.total_users >= v_k THEN COALESCE(
        (SELECT jsonb_object_agg(mood, cnt) FROM mood_src),
        '{}'::jsonb
      )
      ELSE '{}'::jsonb
    END
  )
  INTO v_result
  FROM totals t
  CROSS JOIN teams_out tm;

  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_rh_dashboard(p_period_days integer DEFAULT 30)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT private.get_rh_dashboard(p_period_days)
$$;

REVOKE ALL ON FUNCTION private.get_rh_dashboard(integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_rh_dashboard(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.get_rh_dashboard(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_rh_dashboard(integer) TO authenticated;

-- Diretório operacional (nome/e-mail/papel). Sem flags de saúde ou opt-in.
CREATE OR REPLACE FUNCTION private.list_company_directory()
RETURNS TABLE (
  id uuid,
  email text,
  display_name text,
  role text,
  team_id uuid,
  is_active boolean,
  company_id uuid
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text := private.current_user_role();
  v_company uuid := private.current_user_company_id();
BEGIN
  IF auth.uid() IS NULL OR v_role NOT IN ('manager', 'admin', 'dev') THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;
  IF v_role = 'manager' AND v_company IS NULL THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT p.id, p.email, p.display_name, p.role, p.team_id, p.is_active, p.company_id
  FROM profiles p
  WHERE p.role IN ('companion', 'manager')
    AND (v_company IS NULL OR p.company_id = v_company)
  ORDER BY p.display_name NULLS LAST;
END;
$$;

CREATE OR REPLACE FUNCTION public.list_company_directory()
RETURNS TABLE (
  id uuid,
  email text,
  display_name text,
  role text,
  team_id uuid,
  is_active boolean,
  company_id uuid
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT * FROM private.list_company_directory()
$$;

REVOKE ALL ON FUNCTION private.list_company_directory() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.list_company_directory() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.list_company_directory() TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_company_directory() TO authenticated;

-- Manager não lê mais profiles de colegas via PostgREST (SELECT * vazaria opt-in/saúde).
DROP POLICY IF EXISTS "profiles_manager_company_select" ON profiles;

-- Wrapper de retenção só para service_role (pg_cron chama private direto).
CREATE OR REPLACE FUNCTION public.purge_expired_personal_data()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT private.purge_expired_personal_data()
$$;

REVOKE ALL ON FUNCTION public.purge_expired_personal_data() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.purge_expired_personal_data() TO service_role;

DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS pg_cron;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron não disponível: %', SQLERRM;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    BEGIN
      PERFORM cron.unschedule('purge-personal-data-daily');
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
    PERFORM cron.schedule(
      'purge-personal-data-daily',
      '15 9 * * *',
      $cron$SELECT private.purge_expired_personal_data()$cron$
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'agendamento de retenção ignorado: %', SQLERRM;
END $$;
