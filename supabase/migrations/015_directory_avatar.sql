-- Inclui avatar_url no diretório operacional (nome do avatar escolhido, sem dado de saúde).

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
  created_at timestamptz,
  avatar_url text
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
    p.created_at,
    p.avatar_url
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
  created_at timestamptz,
  avatar_url text
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
