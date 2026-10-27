-- Histórico de fatores de trabalho (seed e importação).
-- Usuário logado: só a pergunta de hoje. Sem usuário (service role): qualquer dia,
-- desde que a pergunta seja a daquele dia e o check-in seja da mesma pessoa e do mesmo dia.

CREATE OR REPLACE FUNCTION private.enforce_work_factor_response()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_today date := (timezone('America/Sao_Paulo', now()))::date;
  v_checkin_user uuid;
  v_checkin_day date;
BEGIN
  IF NEW.score < 1 OR NEW.score > 5 THEN
    RAISE EXCEPTION 'invalid score' USING ERRCODE = '23514';
  END IF;

  IF auth.uid() IS NOT NULL THEN
    IF NEW.user_id IS DISTINCT FROM auth.uid() THEN
      RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
    END IF;
    IF NEW.answered_on IS DISTINCT FROM v_today
       OR NEW.factor_id IS DISTINCT FROM private.work_factor_id_for_day(v_today) THEN
      RAISE EXCEPTION 'work factor day mismatch' USING ERRCODE = '23514';
    END IF;
    RETURN NEW;
  END IF;

  SELECT c.user_id, (timezone('America/Sao_Paulo', c.created_at))::date
  INTO v_checkin_user, v_checkin_day
  FROM checkins c
  WHERE c.id = NEW.checkin_id;

  IF v_checkin_user IS DISTINCT FROM NEW.user_id
     OR v_checkin_day IS DISTINCT FROM NEW.answered_on
     OR NEW.answered_on > v_today
     OR NEW.factor_id IS DISTINCT FROM private.work_factor_id_for_day(NEW.answered_on) THEN
    RAISE EXCEPTION 'work factor day mismatch' USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.enforce_work_factor_response() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.enforce_work_factor_response() TO authenticated;
GRANT EXECUTE ON FUNCTION private.enforce_work_factor_response() TO service_role;
