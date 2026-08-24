-- Manager pode renomear equipes da própria empresa e mover colaboradores
-- entre equipes (sem alterar role, empresa ou status). Sem dados de saúde.

GRANT SELECT, UPDATE ON public.teams TO authenticated;

DROP POLICY IF EXISTS "teams_manager_update" ON teams;
CREATE POLICY "teams_manager_update"
  ON teams FOR UPDATE
  TO authenticated
  USING (
    private.current_user_role() = 'manager'
    AND company_id = private.current_user_company_id()
  )
  WITH CHECK (
    private.current_user_role() = 'manager'
    AND company_id = private.current_user_company_id()
  );

CREATE OR REPLACE FUNCTION public.assign_team_member(p_profile_id uuid, p_team_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target public.profiles%ROWTYPE;
  role text := private.current_user_role();
  v_company uuid := private.current_user_company_id();
  team_company uuid;
BEGIN
  IF role NOT IN ('admin', 'dev', 'manager') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT * INTO target FROM profiles WHERE id = p_profile_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Colaborador não encontrado';
  END IF;
  IF target.role NOT IN ('companion', 'manager') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  IF role = 'manager' AND target.company_id IS DISTINCT FROM v_company THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF p_team_id IS NOT NULL THEN
    SELECT t.company_id INTO team_company FROM teams t WHERE t.id = p_team_id;
    IF team_company IS NULL THEN
      RAISE EXCEPTION 'Equipe não encontrada';
    END IF;
    IF team_company IS DISTINCT FROM target.company_id THEN
      RAISE EXCEPTION 'Equipe de outra empresa';
    END IF;
    IF role = 'manager' AND team_company IS DISTINCT FROM v_company THEN
      RAISE EXCEPTION 'Unauthorized';
    END IF;
  END IF;

  PERFORM set_config('mmc.assign_team_member', 'on', true);
  UPDATE profiles SET team_id = p_team_id WHERE id = p_profile_id;
END;
$$;

REVOKE ALL ON FUNCTION public.assign_team_member(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.assign_team_member(uuid, uuid) TO authenticated;

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
  IF private.current_user_role() = 'manager'
     AND current_setting('mmc.assign_team_member', true) = 'on' THEN
    NEW.role := OLD.role;
    NEW.company_id := OLD.company_id;
    NEW.is_active := OLD.is_active;
    RETURN NEW;
  END IF;
  NEW.role := OLD.role;
  NEW.company_id := OLD.company_id;
  NEW.team_id := OLD.team_id;
  NEW.is_active := OLD.is_active;
  RETURN NEW;
END;
$$;

DROP FUNCTION IF EXISTS public.list_company_directory();
DROP FUNCTION IF EXISTS private.list_company_directory();

CREATE FUNCTION private.list_company_directory()
RETURNS TABLE (
  id uuid,
  email text,
  display_name text,
  role text,
  team_id uuid,
  is_active boolean,
  company_id uuid,
  job_title text,
  created_at timestamptz
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
  SELECT
    p.id,
    p.email,
    p.display_name,
    p.role,
    p.team_id,
    p.is_active,
    p.company_id,
    p.job_title,
    p.created_at
  FROM profiles p
  WHERE p.role IN ('companion', 'manager')
    AND (v_company IS NULL OR p.company_id = v_company)
  ORDER BY p.display_name NULLS LAST;
END;
$$;

CREATE FUNCTION public.list_company_directory()
RETURNS TABLE (
  id uuid,
  email text,
  display_name text,
  role text,
  team_id uuid,
  is_active boolean,
  company_id uuid,
  job_title text,
  created_at timestamptz
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
