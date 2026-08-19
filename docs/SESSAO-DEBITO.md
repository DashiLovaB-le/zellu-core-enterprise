# Sessão httpOnly (item 2.6)

A sessão autentica as server functions por cookies `mmc-at` / `mmc-rt` (`HttpOnly`, `SameSite=Lax`, `Secure` em produção). O JWT não vai no body.

Login: `signInWithPassword` no servidor. Identidade: `requireUser()` lê o cookie e valida com `supabase.auth.getUser`.
