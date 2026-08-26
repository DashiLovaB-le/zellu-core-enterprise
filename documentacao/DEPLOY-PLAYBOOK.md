# Playbook de Deploy — Zēllu (Vercel)

> **Projeto:** Zēllu  
> **Versão:** 1.2  
> **Data:** 2026-08-26

O app é TanStack Start + Nitro. A Vercel detecta o framework `tanstack-start` via `vercel.json` e o preset Nitro `vercel` em `vite.config.ts`.

---

## 1. Pré-requisitos

| Item | Descrição |
|---|---|
| Node.js | 22 (há `.nvmrc`; mínimo 20.18) |
| GitHub | Repositório com o código |
| Supabase | Projeto ativo, migrations até `010` aplicadas |
| OpenRouter | Chave de API válida |
| Vercel | Conta com o projeto importado |

---

## 2. Variáveis de ambiente

Nomes reais usados no código. `VITE_*` entram no bundle do browser no **build** — cadastre-as também no ambiente de Build da Vercel.

### 2.1 Obrigatórias

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
OPENROUTER_API_KEY=sk-or-v1-...
CRON_SECRET=string-longa-e-aleatoria
APP_BASE_URL=https://seu-dominio.vercel.app
VITE_APP_URL=https://seu-dominio.vercel.app
```

| Variável | Onde | Observação |
|---|---|---|
| `VITE_SUPABASE_URL` | Supabase → Settings → API | Pública (anon URL) |
| `VITE_SUPABASE_ANON_KEY` | Idem | Pública; nunca service role |
| `SUPABASE_SERVICE_ROLE_KEY` | Idem | **Somente servidor** |
| `OPENROUTER_API_KEY` | OpenRouter → Keys | **Somente servidor** |
| `CRON_SECRET` | Gerar localmente | A Vercel envia `Authorization: Bearer $CRON_SECRET` nos crons |
| `APP_BASE_URL` / `VITE_APP_URL` | URL canônica | Links de convite no e-mail e na UI |

### 2.2 E-mail (Resend) — convites e lembretes

Opcional: sem `RESEND_API_KEY`, o app **cria** o convite e mostra o link na tela do RH para copiar.

```env
RESEND_API_KEY=re_...
REMINDER_FROM_EMAIL=Zēllu <noreply@seudominio.com>
# INVITE_FROM_EMAIL=  # opcional; senão usa REMINDER_FROM_EMAIL
```

| Variável | Uso |
|---|---|
| `RESEND_API_KEY` | API Resend (servidor apenas; **nunca** `VITE_`) |
| `REMINDER_FROM_EMAIL` | Remetente de lembretes de check-in e, por padrão, de convites |
| `INVITE_FROM_EMAIL` | Remetente só de convites (opcional) |

**Passos:**
1. Conta em [resend.com](https://resend.com) → API Key
2. **Domains** → verificar DNS (SPF/DKIM) do domínio do `FROM`
3. Sandbox `onboarding@resend.dev` só envia para o e-mail da conta Resend (teste)
4. Em produção, cadastrar as vars na Vercel e redeploy
5. Testar em `/manager/convites`: sucesso = “Convite enviado para …”; sem key = link para copiar

Código: `src/lib/email.server.ts` (`sendInviteEmail`) chamado por `createInvite`.

Não use `SUPABASE_URL` / `SUPABASE_ANON_KEY` sem o prefixo `VITE_` — o cliente lê `import.meta.env.VITE_*`.

---

## 3. Deploy na Vercel

### 3.1 Pelo dashboard (recomendado)

1. Push do código para o GitHub.
2. Em [vercel.com/new](https://vercel.com/new), importe o repositório.
3. Confirme **Framework Preset: TanStack Start**. Não defina Build Command nem Output Directory — o detector cobre isso.
4. Em Settings → Environment Variables, cadastre as variáveis da seção 2 para **Production**, **Preview** e **Development**.
5. Deploy.

### 3.2 Pela CLI

```bash
npm i -g vercel
vercel login
vercel link
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add OPENROUTER_API_KEY
vercel env add CRON_SECRET
vercel env add APP_BASE_URL
vercel env add VITE_APP_URL
vercel env add RESEND_API_KEY
vercel env add REMINDER_FROM_EMAIL
vercel --prod
```

### 3.3 Depois do primeiro deploy

No **Supabase → Authentication → URL Configuration**:

- **Site URL:** `https://seu-dominio.vercel.app` (ou o domínio customizado)
- **Redirect URLs:** a mesma URL, mais `http://localhost:8080/**` para dev

Se usar domínio próprio, aponte-o em Vercel → Settings → Domains e atualize `APP_BASE_URL` / `VITE_APP_URL`.

### 3.4 Cron de retenção LGPD

`vercel.json` agenda `GET /api/jobs/retention` às 09:15 UTC. O handler também aceita `POST` (GitHub Action `.github/workflows/retention.yml`).

É preciso ter `CRON_SECRET` definido; sem ele o job responde 401.

---

## 4. Migrations

```bash
npx supabase login
npx supabase link --project-ref seu-project-ref
npx supabase db push
```

| # | Arquivo | Descrição |
|---|---|---|
| 1 | `000_schema_inicial.sql` | Tabelas core |
| 3 | `003_llm_fallback.sql` | Config LLM |
| 4 | `004_preventiva_notifications.sql` | Alertas preventivos |
| 5 | `005_wellness_plan.sql` | Planos de cuidado |
| 6 | `006_admin_portal.sql` | Portal B2B |
| 7 | `007_prioridades_producao.sql` | Otimizações |
| 8 | `008_lgpd_controles.sql` | Controles LGPD |
| 9 | `009_confianca_rls_retencao.sql` | RLS avançado |
| 10 | `010_hardening_sessao_rls.sql` | FORCE RLS, quota, cache |

Não pule migration. O histórico remoto `000`–`007` pode estar desalinhado de propósito; não “repare” hashes sem um plano.

---

## 5. CI

`.github/workflows/ci.yml` usa Node 22 + npm: `tsc`, lint, Vitest e Playwright.

Deploy contínuo fica a cargo da integração GitHub ↔ Vercel (push em `main` = produção, PR = preview).

---

## 6. Rollback

```bash
# Código
git revert <commit-hash>
git push origin main

# Deploy na Vercel: Instant Rollback no dashboard do deployment anterior
```

Migration não tem rollback automático — crie uma migration de correção e faça `db push`.

---

## 7. Monitoramento

| Canal | Uso |
|---|---|
| `/dashitecnology/system-logs` | Logs operacionais do app |
| Vercel → Deployments / Logs | Build e runtime |
| Vercel Analytics (opcional) | Latência e tráfego |

---

## 8. Troubleshooting

| Problema | Causa típica | Solução |
|---|---|---|
| Login não persiste | Cookie `Secure` / Site URL | HTTPS + URLs do Auth no Supabase |
| Login 401 após deploy | `VITE_SUPABASE_*` ausente no **build** | Recriar env e redeploy |
| Chat IA não responde | `OPENROUTER_API_KEY` | Conferir env de runtime |
| Convite aponta para localhost | `APP_BASE_URL` / `VITE_APP_URL` | Definir a URL de produção |
| Cron 401 | `CRON_SECRET` ausente | Cadastrar o secret e redeploy |
| Rotas 404 | Nitro sem preset vercel | `vite.config.ts` deve ter `nitro.preset: "vercel"` |
| `npm ci` falha no Linux | binário win32 no `dependencies` | Não recolocar `lightningcss-win32-*` |

---

## 9. Checklist pré-produção

| # | Item | Status |
|---|---|---|
| 1 | `npm test` e `npm run lint` passando | ⬜ |
| 2 | Env cadastradas (incl. `VITE_*` no Build) | ⬜ |
| 3 | Migrations até 010 no projeto remoto | ⬜ |
| 4 | Site URL / Redirect URLs no Supabase Auth | ⬜ |
| 5 | `CRON_SECRET` definido | ⬜ |
| 6 | Preview testado (login, chat, convite) | ⬜ |
| 7 | Domínio canônico em `APP_BASE_URL` | ⬜ |
