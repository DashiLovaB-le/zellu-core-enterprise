-- Resumo RH por colaborador: status/tendência, sem humor diário, diário ou chat.

CREATE OR REPLACE FUNCTION private.rh_wellness_signals(p_user_id uuid, p_opt_in boolean)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  v_today date := (timezone('America/Sao_Paulo', now()))::date;
  v_recent_count int := 0;
  v_prev_count int := 0;
  v_recent_neg int := 0;
  v_prev_neg int := 0;
  v_days_7 int := 0;
  v_avg_sleep numeric := NULL;
  v_last_day date := NULL;
  v_days_ago int := NULL;
  v_status text := 'unknown';
  v_trend text := 'unknown';
  v_participation text := 'none';
  v_last_activity text := 'Sem check-in recente';
  v_sleep text := 'unknown';
  v_recent_pct int := 0;
  v_prev_pct int := 0;
BEGIN
  IF NOT COALESCE(p_opt_in, false) THEN
    RETURN jsonb_build_object(
      'available', false,
      'status', 'unknown',
      'trend', 'unknown',
      'participation', 'none',
      'lastActivity', 'Resumo indisponível',
      'sleepSignal', 'unknown'
    );
  END IF;

  SELECT
    count(*) FILTER (
      WHERE d > v_today - 7
    ),
    count(*) FILTER (
      WHERE d > v_today - 14 AND d <= v_today - 7
    ),
    count(*) FILTER (
      WHERE d > v_today - 7 AND score BETWEEN 1 AND 3
    ),
    count(*) FILTER (
      WHERE d > v_today - 14 AND d <= v_today - 7 AND score BETWEEN 1 AND 3
    ),
    count(DISTINCT d) FILTER (
      WHERE d > v_today - 7
    ),
    avg(sleep_hours) FILTER (
      WHERE d > v_today - 7 AND sleep_hours IS NOT NULL
    ),
    max(d)
  INTO v_recent_count, v_prev_count, v_recent_neg, v_prev_neg, v_days_7, v_avg_sleep, v_last_day
  FROM (
    SELECT
      (timezone('America/Sao_Paulo', c.created_at))::date AS d,
      private.mood_score(c.mood) AS score,
      c.sleep_hours
    FROM checkins c
    WHERE c.user_id = p_user_id
      AND c.created_at >= now() - interval '30 days'
  ) x;

  IF v_last_day IS NOT NULL THEN
    v_days_ago := GREATEST(0, v_today - v_last_day);
  END IF;

  IF v_recent_count > 0 THEN
    v_recent_pct := round(100.0 * v_recent_neg / v_recent_count);
    IF v_recent_pct >= 40 THEN
      v_status := 'attention';
    ELSIF v_recent_pct >= 20 THEN
      v_status := 'monitor';
    ELSE
      v_status := 'stable';
    END IF;
  END IF;

  IF v_recent_count > 0 AND v_prev_count > 0 THEN
    v_prev_pct := round(100.0 * v_prev_neg / v_prev_count);
    IF (v_recent_pct - v_prev_pct) >= 15 THEN
      v_trend := 'worsening';
    ELSIF (v_prev_pct - v_recent_pct) >= 15 THEN
      v_trend := 'improving';
    ELSE
      v_trend := 'stable';
    END IF;
  END IF;

  IF v_days_7 >= 4 THEN
    v_participation := 'regular';
  ELSIF v_days_7 >= 1 THEN
    v_participation := 'low';
  ELSE
    v_participation := 'none';
  END IF;

  IF v_days_ago IS NULL THEN
    v_last_activity := 'Sem check-in recente';
  ELSIF v_days_ago <= 0 THEN
    v_last_activity := 'Check-in hoje';
  ELSIF v_days_ago = 1 THEN
    v_last_activity := 'Check-in ontem';
  ELSIF v_days_ago <= 14 THEN
    v_last_activity := 'Último check-in há ' || v_days_ago || ' dias';
  ELSE
    v_last_activity := 'Sem check-in recente';
  END IF;

  IF v_avg_sleep IS NULL THEN
    v_sleep := 'unknown';
  ELSIF v_avg_sleep < 6.5 THEN
    v_sleep := 'attention';
  ELSE
    v_sleep := 'ok';
  END IF;

  RETURN jsonb_build_object(
    'available', true,
    'status', v_status,
    'trend', v_trend,
    'participation', v_participation,
    'lastActivity', v_last_activity,
    'sleepSignal', v_sleep
  );
END;
$$;

REVOKE ALL ON FUNCTION private.rh_wellness_signals(uuid, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.rh_wellness_signals(uuid, boolean) TO authenticated;

CREATE OR REPLACE FUNCTION private.get_rh_member_summary(p_profile_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text := private.current_user_role();
  v_company uuid := private.current_user_company_id();
  v_target public.profiles%ROWTYPE;
  v_team_name text;
BEGIN
  IF auth.uid() IS NULL OR v_role NOT IN ('manager', 'admin', 'dev') THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;
  IF v_role = 'manager' AND v_company IS NULL THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_target FROM profiles WHERE id = p_profile_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Colaborador não encontrado';
  END IF;
  IF v_target.role NOT IN ('companion', 'manager') THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;
  IF v_role = 'manager' AND v_target.company_id IS DISTINCT FROM v_company THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;
  IF v_role IN ('admin', 'dev') AND v_company IS NOT NULL AND v_target.company_id IS DISTINCT FROM v_company THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;

  SELECT t.name INTO v_team_name FROM teams t WHERE t.id = v_target.team_id;

  RETURN jsonb_build_object(
    'id', v_target.id,
    'displayName', v_target.display_name,
    'email', v_target.email,
    'role', v_target.role,
    'jobTitle', v_target.job_title,
    'isActive', COALESCE(v_target.is_active, true),
    'teamId', v_target.team_id,
    'teamName', v_team_name,
    'createdAt', v_target.created_at,
    'wellness', private.rh_wellness_signals(v_target.id, COALESCE(v_target.privacy_rh_opt_in, false))
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_rh_member_summary(p_profile_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT private.get_rh_member_summary(p_profile_id)
$$;

REVOKE ALL ON FUNCTION private.get_rh_member_summary(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_rh_member_summary(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.get_rh_member_summary(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_rh_member_summary(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION private.list_rh_member_signals(p_team_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text := private.current_user_role();
  v_company uuid := private.current_user_company_id();
  v_out jsonb;
BEGIN
  IF auth.uid() IS NULL OR v_role NOT IN ('manager', 'admin', 'dev') THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;
  IF v_role = 'manager' AND v_company IS NULL THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', p.id,
      'wellness', private.rh_wellness_signals(p.id, COALESCE(p.privacy_rh_opt_in, false))
    )
    ORDER BY p.display_name NULLS LAST
  ), '[]'::jsonb)
  INTO v_out
  FROM profiles p
  WHERE p.role IN ('companion', 'manager')
    AND (v_company IS NULL OR p.company_id = v_company)
    AND (p_team_id IS NULL OR p.team_id = p_team_id);

  RETURN v_out;
END;
$$;

CREATE OR REPLACE FUNCTION public.list_rh_member_signals(p_team_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT private.list_rh_member_signals(p_team_id)
$$;

REVOKE ALL ON FUNCTION private.list_rh_member_signals(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.list_rh_member_signals(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.list_rh_member_signals(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_rh_member_signals(uuid) TO authenticated;
