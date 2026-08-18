# Débito de sessão (item 2.6)

As server functions ainda recebem `accessToken` no body. A validação passou a ser `supabase.auth.getUser(accessToken)` (assinatura + expiração), não decode local do JWT.

**Próximo passo:** cookie httpOnly via `@supabase/ssr` e parar de enviar o token no body. Não expandir o padrão atual para novas APIs quando for possível ler a sessão no servidor.
