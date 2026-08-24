-- RH pode atualizar o cargo (job_title) de colaboradores da própria empresa.

CREATE OR REPLACE FUNCTION public.set_employee_job_title(p_profile_id uuid, p_job_title text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target public.profiles%ROWTYPE;
  role text := private.current_user_role();
  v_title text := nullif(trim(coalesce(p_job_title, '')), '');
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
  IF role = 'manager' AND target.company_id IS DISTINCT FROM private.current_user_company_id() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  IF v_title IS NOT NULL AND char_length(v_title) > 100 THEN
    RAISE EXCEPTION 'Cargo muito longo';
  END IF;

  UPDATE profiles SET job_title = v_title WHERE id = p_profile_id;
END;
$$;

REVOKE ALL ON FUNCTION public.set_employee_job_title(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_employee_job_title(uuid, text) TO authenticated;
