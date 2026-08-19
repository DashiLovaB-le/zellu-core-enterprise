-- Restaura permissões de escrita do titular em profiles.
-- Sem UPDATE, toggles LGPD (privacy_*_opt_in) falham com "permission denied for table profiles".

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
