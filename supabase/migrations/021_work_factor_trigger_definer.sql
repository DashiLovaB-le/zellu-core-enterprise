-- O trigger chama private.work_factor_id_for_day e lê checkins; service_role não tem USAGE no schema private.
-- auth.uid() continua vindo do JWT da requisição, então a regra por usuário não muda.

ALTER FUNCTION private.enforce_work_factor_response() SECURITY DEFINER;
