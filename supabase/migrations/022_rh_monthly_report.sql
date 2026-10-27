-- Resumo mensal do RH por e-mail.
-- O resumo é calculado sem usuário logado (tarefa agendada), então só o service_role chama.
-- Mesmas regras do painel: só quem autorizou o RH, nada de equipe com menos de 5 pessoas.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS rh_monthly_report_opt_out BOOLEAN NOT NULL DEFAULT false;

-- Um envio por gestor, empresa e mês. Vercel e GitHub Actions podem disparar o mesmo job.
CREATE TABLE IF NOT EXISTS public.rh_monthly_report_sends (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  recipient_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_month  DATE NOT NULL,
  status        TEXT NOT NULL DEFAULT 'sending'
                  CHECK (status IN ('sending', 'sent', 'failed', 'skipped')),
  error         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, recipient_id, report_month)
);

ALTER TABLE public.rh_monthly_report_sends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rh_monthly_report_sends FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.rh_monthly_report_sends FROM PUBLIC;
REVOKE ALL ON TABLE public.rh_monthly_report_sends FROM anon;
REVOKE ALL ON TABLE public.rh_monthly_report_sends FROM authenticated;
GRANT ALL ON TABLE public.rh_monthly_report_sends TO service_role;

CREATE OR REPLACE FUNCTION public.claim_rh_monthly_report_send(
  p_company uuid,
  p_recipient uuid,
  p_month date
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO rh_monthly_report_sends (company_id, recipient_id, report_month, status)
  VALUES (p_company, p_recipient, date_trunc('month', p_month)::date, 'sending')
  ON CONFLICT (company_id, recipient_id, report_month) DO UPDATE
    SET status = 'sending', error = NULL, updated_at = now()
    WHERE rh_monthly_report_sends.status = 'failed'
       OR (rh_monthly_report_sends.status = 'sending'
           AND rh_monthly_report_sends.updated_at < now() - interval '30 minutes')
  RETURNING id INTO v_id;
  RETURN v_id IS NOT NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_rh_monthly_report_send(uuid, uuid, date) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.claim_rh_monthly_report_send(uuid, uuid, date) FROM anon;
REVOKE ALL ON FUNCTION public.claim_rh_monthly_report_send(uuid, uuid, date) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.claim_rh_monthly_report_send(uuid, uuid, date) TO service_role;

CREATE OR REPLACE FUNCTION public.get_company_monthly_rh_summary(p_company uuid, p_month date)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_k int := 5;
  v_from date := date_trunc('month', p_month)::date;
  v_to date := (date_trunc('month', p_month) + interval '1 month')::date;
  v_days int := v_to - v_from;
  v_result jsonb;
BEGIN
  IF p_company IS NULL OR p_month IS NULL THEN
    RAISE EXCEPTION 'invalid arguments' USING ERRCODE = '22023';
  END IF;

  WITH opted AS (
    SELECT p.id, COALESCE(t.name, 'Sem equipe') AS team_name
    FROM profiles p
    LEFT JOIN teams t ON t.id = p.team_id
    WHERE p.company_id = p_company
      AND p.role = 'companion'
      AND p.privacy_rh_opt_in IS TRUE
  ),
  team_counts AS (
    SELECT team_name, count(*)::int AS member_count
    FROM opted
    GROUP BY team_name
  ),
  checkin_rows AS (
    SELECT o.team_name, c.user_id, c.mood, c.sleep_hours
    FROM checkins c
    JOIN opted o ON o.id = c.user_id
    WHERE (timezone('America/Sao_Paulo', c.created_at))::date >= v_from
      AND (timezone('America/Sao_Paulo', c.created_at))::date < v_to
  ),
  totals AS (
    SELECT
      (SELECT count(*)::int FROM opted) AS total_users,
      (SELECT count(*)::int FROM checkin_rows) AS checkins,
      (SELECT count(DISTINCT user_id)::int FROM checkin_rows) AS active_users
  ),
  team_metrics AS (
    SELECT
      tc.team_name,
      tc.member_count,
      COALESCE(round(avg(private.mood_score(cr.mood))::numeric, 1), 0) AS avg_mood,
      COALESCE(round(avg(cr.sleep_hours)::numeric, 1), 0) AS avg_sleep,
      COALESCE(
        round(
          100.0 * count(*) FILTER (WHERE private.mood_score(cr.mood) BETWEEN 1 AND 3)
          / NULLIF(count(cr.mood), 0)
        ),
        0
      )::int AS negative_mood_pct,
      count(cr.user_id)::int AS checkins
    FROM team_counts tc
    LEFT JOIN checkin_rows cr ON cr.team_name = tc.team_name
    GROUP BY tc.team_name, tc.member_count
  ),
  factor_stats AS (
    SELECT
      o.team_name,
      r.factor_id,
      count(DISTINCT r.user_id)::int AS respondents,
      round(avg(r.score)::numeric, 1) AS average
    FROM work_factor_responses r
    JOIN opted o ON o.id = r.user_id
    WHERE r.answered_on >= v_from AND r.answered_on < v_to
    GROUP BY o.team_name, r.factor_id
  )
  SELECT jsonb_build_object(
    'month', v_from,
    'days', v_days,
    'totalUsers', t.total_users,
    'activeUsers', t.active_users,
    'checkins', t.checkins,
    'adhesion', CASE
      WHEN t.total_users > 0
        THEN LEAST(100, round((t.checkins::numeric / (t.total_users * v_days)) * 100))
      ELSE 0
    END,
    'companyMetricsAllowed', t.total_users >= v_k,
    'teams', COALESCE((
      SELECT jsonb_agg(
        CASE
          WHEN tm.member_count < v_k OR t.total_users < v_k THEN
            jsonb_build_object('name', tm.team_name, 'memberCount', tm.member_count, 'hidden', true)
          ELSE
            jsonb_build_object(
              'name', tm.team_name,
              'memberCount', tm.member_count,
              'hidden', false,
              'checkins', tm.checkins,
              'avgMood', tm.avg_mood,
              'avgSleep', tm.avg_sleep,
              'negativeMoodPct', tm.negative_mood_pct,
              'status', CASE
                WHEN tm.checkins = 0 THEN 'stable'
                WHEN tm.negative_mood_pct >= 40 THEN 'attention'
                WHEN tm.negative_mood_pct >= 20 THEN 'monitor'
                ELSE 'stable'
              END,
              'factors', (
                SELECT jsonb_agg(
                  jsonb_build_object(
                    'factorId', f.id,
                    'respondents', CASE WHEN COALESCE(fs.respondents, 0) < v_k THEN NULL ELSE fs.respondents END,
                    'average', CASE WHEN COALESCE(fs.respondents, 0) < v_k THEN NULL ELSE fs.average END
                  )
                  ORDER BY f.ord
                )
                FROM (VALUES ('carga', 1), ('autonomia', 2), ('apoio', 3), ('relacoes', 4)) AS f(id, ord)
                LEFT JOIN factor_stats fs ON fs.team_name = tm.team_name AND fs.factor_id = f.id
              )
            )
        END
        ORDER BY tm.team_name
      )
      FROM team_metrics tm
    ), '[]'::jsonb)
  )
  INTO v_result
  FROM totals t;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_company_monthly_rh_summary(uuid, date) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_company_monthly_rh_summary(uuid, date) FROM anon;
REVOKE ALL ON FUNCTION public.get_company_monthly_rh_summary(uuid, date) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.get_company_monthly_rh_summary(uuid, date) TO service_role;

-- Preferência do próprio gestor.
CREATE OR REPLACE FUNCTION public.set_my_monthly_report_opt_out(p_opt_out boolean)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR private.current_user_role() NOT IN ('manager', 'dev') THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;
  UPDATE profiles SET rh_monthly_report_opt_out = COALESCE(p_opt_out, false) WHERE id = auth.uid();
  RETURN COALESCE(p_opt_out, false);
END;
$$;

REVOKE ALL ON FUNCTION public.set_my_monthly_report_opt_out(boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_my_monthly_report_opt_out(boolean) FROM anon;
GRANT EXECUTE ON FUNCTION public.set_my_monthly_report_opt_out(boolean) TO authenticated;
