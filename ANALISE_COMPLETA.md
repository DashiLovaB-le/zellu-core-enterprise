# Análise Completa — Mundo Mental Care

> **Última atualização:** 2026-08-19  
> **Fonte:** código em `src/`, migrations `007`–`010` aplicadas no remoto, `documentacao/` v1.1, preparação para deploy na Vercel concluída.

---

## 1. Visão Geral

| Campo | Valor |
|---|---|
| **Nome do pacote** | `mundo-mental-care` |
| **Nome de exibição** | Mundo Mental Care (`src/lib/branding.ts`) |
| **Tagline** | Cuidado emocional no ritmo do trabalho |
| **Tipo** | Companion digital B2B de bem-estar emocional (white-label Mundo Mental) |
| **O que não é** | Não substitui psicólogo, psiquiatra, terapia nem diagnóstico. Disclaimer no login, termo v3.0, onboarding, Chat e Perfil. |

O produto cobre o dia a dia do colaborador (check-in, chat, diário, hábitos, plano, respiro) e entrega **sinais agregados** para RH, com isolamento por empresa. Cadastro aberto com escolha de role **foi removido**: entrada é exclusivamente por convite.

**Stack resumida:** React 19 + TanStack Start (SSR) + Vite 7 + Tailwind 4 · Supabase (Auth + PostgreSQL + RLS) · OpenRouter (LLM) · Nitro (Vercel) · Vitest + Playwright no CI.

---

## 2. Estrutura de Diretórios (relevante)

```
mundo-mental-care/
├── .github/workflows/
│   ├── ci.yml                    # tsc + lint + vitest + playwright
│   └── retention.yml             # POST /api/jobs/retention (secrets APP_URL + CRON_SECRET)
├── .env.example                  # variáveis documentadas sem valores
├── .vercelignore
├── vercel.json                   # framework: tanstack-start, cron: /api/jobs/retention
├── documentacao/                 # BRD, PRD, FRD, SDD, API-DOCS, ROADMAP, USER-STORIES, TEST-PLAN, DEPLOY-PLAYBOOK
├── e2e/
│   └── smoke.spec.ts             # Playwright: login, cookie httpOnly, headers, disclaimer
├── supabase/migrations/
│   ├── 000_schema_inicial.sql
│   ├── 003_llm_fallback.sql
│   ├── 004_preventiva_notifications.sql
│   ├── 005_wellness_plan.sql
│   ├── 006_admin_portal.sql
│   ├── 007_prioridades_producao.sql    # convites, tenant, role no perfil
│   ├── 008_lgpd_controles.sql          # opt-ins, retenção, RH sem check-in nominal
│   ├── 009_confianca_rls_retencao.sql  # RPC RH + diretório + cron de purge
│   ├── 010_hardening_sessao_rls.sql    # FORCE RLS, quota, cache, self-test
│   └── 010_companion_memories.sql     # tabela companion_memories + RLS
├── src/
│   ├── components/
│   │   ├── CrisisHelp.tsx
│   │   ├── PrivacyConsentCard.tsx
│   │   ├── CheckinReminderBanner.tsx
│   │   ├── pages/mobile/  e  pages/desktop/
│   │   └── ui/            # shadcn
│   ├── lib/
│   │   ├── api/*.server.ts
│   │   ├── companion-agent.ts         # memória curada, snapshot, payload
│   │   ├── api/companion-memory.server.ts
│   │   ├── supabase/session.ts        # cookies httpOnly mmc-at / mmc-rt
│   │   ├── supabase/server.ts         # createClient com token do cookie
│   │   ├── config.server.ts           # getAppBaseUrl (VERCEL_URL / VERCEL_PROJECT_PRODUCTION_URL)
│   │   ├── security-headers.ts        # CSP + HSTS + X-Frame-Options + …
│   │   ├── retention.ts               # cron (POST e GET)
│   │   ├── privacy.ts / lgpd.ts / tenant.ts / crisis.ts / chat-guard.ts
│   │   ├── require-user.ts            # gate de identidade: lê cookie, valida getUser
│   │   └── __tests__/
│   │       ├── prioridades-producao.test.ts   # 25 testes (inclui RLS no Postgres)
│   │       └── companion-agent.test.ts         # 7 testes (memória, snapshot, payload)
│   ├── routes/
│   │   ├── login.tsx, aceitar-convite.tsx, onboarding.tsx, privacidade.tsx
│   │   ├── companion: /, /chat, /checkin, /diario, /meu-bem-estar, …
│   │   ├── manager/: rh-dashboard, equipes, relatorios, convites
│   │   ├── admin/  e  dashitecnology/
│   ├── server.ts                 # SSR + GET|POST /api/jobs/retention
│   └── start.ts                  # CSRF
├── vite.config.ts                # nitro.preset: "vercel"
├── playwright.config.ts
└── ANALISE_COMPLETA.md           # este arquivo
```

`PadrãoDashi/` e `PLANS/` são histórico/referência — não descrevem o runtime atual.

---

## 3. Stack

### 3.1 Core

| Tecnologia | Versão | Função |
|---|---|---|
| React | ^19.2.0 | UI |
| TypeScript | ^5.8.3 | Tipagem |
| Vite | ^7.3.1 | Bundler |
| TanStack Router | ^1.168.25 | Rotas file-based |
| TanStack Query | ^5.83.0 | Cache |
| TanStack Start | ^1.168.20 | SSR + server functions |
| Nitro | 3.0.260603-beta | Runtime — preset `vercel` |
| @lovable.dev/vite-tanstack-config | 2.6.2 | Wrapper Vite (detectado pela Vercel) |
| Tailwind CSS | ^4.3.3 | Estilo |
| Supabase JS / SSR | ^2.110.3 / ^0.12.1 | Auth + DB |
| Zod | ^3.24.2 | Validação |
| Vitest | ^3.2.4 | Testes unitários |
| Playwright | ^1.55.0 | E2E (smoke) |

Node.js ≥ 20.18 (`.nvmrc` = 22; CI usa Node 22).

### 3.2 UI e dados

Radix/shadcn, recharts, framer-motion, react-markdown, lucide + Material Symbols, date-fns. Login/auth no cliente (`auth-context.tsx`); APIs no servidor (`createServerFn`).

---

## 4. Rotas e papéis

### 4.1 Públicas

| URL | Função |
|---|---|
| `/login` | Login. Sem cadastro aberto. Disclaimer clínico + link de convite e privacidade. |
| `/aceitar-convite` | Aceite de token (cria usuário, vincula empresa/role). |
| `/privacidade` | Política LGPD v3.0 (IA, retenção, RH, direitos). |

### 4.2 Companion (após consentimento)

| URL | Função |
|---|---|
| `/onboarding` | Termo + maioridade + opt-ins IA/RH/e-mail → nome/fuso |
| `/` | Dashboard emocional |
| `/chat` | Companion IA + `CrisisHelp` |
| `/checkin` | Sono → água → humor (1×/dia) |
| `/diario` | Timeline |
| `/meu-bem-estar` | Indicadores do dia |
| `/plano-de-cuidado` | Checklist + streak |
| `/respiro` | Respiração guiada |
| `/perfil` | Conta, opt-ins, exportar/excluir, crise |

Termo desatualizado → `useRequireAuth` manda de volta ao onboarding.

### 4.3 Manager

| URL | Função |
|---|---|
| `/manager` e `/manager/rh-dashboard` | KPIs agregados da **própria** empresa |
| `/manager/equipes` | Times reais + k-anonimato |
| `/manager/relatorios` | CSV agregado |
| `/manager/convites` | Pessoas, convites, `is_active` |

### 4.4 Admin e Dev

- `/admin/*` — empresas, funcionários, licenças, contratos, métricas, sentimentos, alertas, CSV/PDF.
- `/dashitecnology/*` — LLM config e system logs (role `dev`).

### 4.5 Hierarquia

`dev` (tudo) → `admin` (portal B2B) → `manager` (só a empresa) → `companion` (só os próprios dados).  
Role **somente** em `profiles.role`. JWT `user_metadata.role` não autoriza.

---

## 5. Funcionalidades

### 5.1 Acesso B2B

- Convites (`invites`): e-mail, role `companion` | `manager`, token, validade, teto de licenças.
- Aceite cria Auth user + profile com `company_id` / `team_id` / `role`.
- Trigger `handle_new_user` sempre começa como `companion`; o aceite ajusta no servidor.
- Companion/manager **não** alteram `role`, `company_id`, `team_id`, `is_active` (trigger + guard).

### 5.2 LGPD e confiança

- Consentimento versionado **3.0** + declaração de maioridade.
- Opt-ins separados: IA, RH (agregados), e-mail de lembrete.
- Exportar JSON e excluir conta no Perfil.
- Retenção: chat/diário/preventiva/memórias 180 dias, check-ins 365 dias, logs 90 dias.
- Purge: `private.purge_expired_personal_data`, cron `15 9 * * *` (Vercel + GitHub Action), endpoint `GET|POST /api/jobs/retention`.
- Logs sanitizados (sem e-mail, humor, texto de saúde).
- Disclaimer clínico único (`CLINICAL_DISCLAIMER`).

### 5.3 Check-in

Três etapas; 6 humores + 19 extras (`moods.ts`). Segundo check-in no mesmo dia **falha** (não atualiza). Alimenta chat, dashboard e preventiva.

### 5.4 Chat IA e Memória do Companion

- `sendChatMessage` ignora `history`/`context` do cliente (`chat-guard.ts`).
- 20 msgs/hora; timeout 15s / 10s nos fallbacks.
- Crise (regex no servidor) → CVV 188, sem LLM.
- Cloud só com `privacy_ai_opt_in`; senão fallback local.
- OpenRouter: `data_collection: "deny"`, `zdr: true`. Prompt **sem** nome/e-mail. userId anonimizado com SHA-256 via `crypto.subtle` (sem `node:crypto` no bundle do cliente).
- **Memória curada** (`companion_memories`): até 20 registros, máx 180 chars cada, importância 1–5. Só o titular via RLS. Retenção 180 dias. Snapshot semanal carregado no contexto da IA.

### 5.5 Companion (resto)

Dashboard, timeline, bem-estar, respiro, plano + streak (3–90 dias), insights com fallback, preventiva (`burnout-risk`, `sleep-crisis`, etc.), banner de check-in pendente, fuso em `profiles.timezone`.

### 5.6 RH

- `get_rh_dashboard` (SECURITY DEFINER no schema `private`, wrapper em `public`).
- Só companions com `privacy_rh_opt_in`.
- K-anonimato: time com < 5 pessoas oculta métricas; empresa com < 5 opt-ins zera trends/alertas.
- Sem service role no painel. Sem diário/chat/humor individual.
- Diretório de pessoas: RPC `list_company_directory` (nome/e-mail/papel; sem flags de saúde).

### 5.7 Admin / Dev

Portal B2B completo. LLM: chave em `OPENROUTER_API_KEY`. Logs só para `dev`.

---

## 6. Insights e preventiva

`insights-ai.server.ts` — contextos timeline, dashboard, anxiety-change, sleep-quality, weekly-summary, chat. Sem opt-in de IA, só regras locais.

`preventiva-ai.server.ts` — padrões + persistência em `preventive_notifications` + cache ~30 min via `private.compute_cache` (banco — sem estado in-process). UI: `PreventiveAlertBanner`.

Cache da LLM (`llm_config`): sem cache in-process; lido do banco por request.

---

## 7. Design

- Companion: paleta clay/OKLCH, Quicksand + Nunito Sans, glassmorphism contido.
- Admin: visual slate, tabelas densas.
- Tema claro/escuro persistente.
- Avatares: Amora, Chico, Pipoca, Zeca.
- Páginas companion ainda têm pares mobile/desktop; `ResponsivePages.tsx` começou a unificar.

---

## 8. Backend (Supabase)

Projeto remoto: `cxogfjczajhxgyffxcbk`. Histórico CLI não espelha 000–006 (schema legado num timestamp); migrations **008, 009 e 010** foram aplicadas via SQL no remoto.

### 8.1 Tabelas

`profiles`, `checkins`, `habits`, `diary_entries`, `chat_messages`, `llm_config`, `preventive_notifications`, `wellness_plans`, `wellness_checklist`, `companies`, `teams`, `licenses`, `contracts`, `alert_configs`, `system_logs`, `invites`, **`companion_memories`**.

`private`: `compute_cache` (cache de preventiva/LLM), `client_log_quota` (rate limit 20 eventos/min por usuário).

`profiles` inclui timezone, consentimento, opt-ins, `adult_confirmed_at`, `onboarding_completed_at`, `is_active`.

### 8.2 RLS (pós-010)

FORCE ROW LEVEL SECURITY em todas as tabelas públicas (via `ALTER TABLE … FORCE ROW LEVEL SECURITY`).

| Dado | Companion | Manager |
|---|---|---|
| Próprios check-ins / hábitos / diário / chat / memórias | CRUD | Diário/chat: nunca. Check-in individual: sem SELECT |
| Painel RH | — | Só JSON agregado (`get_rh_dashboard`) |
| Colegas | — | Diretório operacional via RPC |
| Outra empresa | — | Impossível pela RPC (company do JWT) |

RPCs de convite: `company_has_available_seat`, `set_employee_active`, `get_invite_public`.  
Self-test: `public.run_rls_self_test()` (service_role).  
Helpers: `private.current_user_role()`, `private.current_user_company_id()`.

### 8.3 Auth — sessão httpOnly

JWT **não vai no body** das server functions. Fluxo:

1. `signInWithPassword` no servidor → `setAuthCookies` define `mmc-at` e `mmc-rt` (`HttpOnly`, `SameSite=Lax`, `Secure` em produção e em deploys Vercel).
2. `requireUser()` lê o cookie, valida com `supabase.auth.getUser`.
3. `getRequestAccessToken` em `server.ts` refresca automaticamente o `mmc-rt` se o access token expirou.
4. Em preview Vercel (`VERCEL=1`), `Secure` também é ativado mesmo sem `NODE_ENV=production`.

---

## 9. Segurança

| Camada | Estado |
|---|---|
| CSRF | `start.ts` nas server functions |
| Authn | Cookie httpOnly `mmc-at`; validado com `getUser` no servidor |
| Authz | `requireUser` / `requireManager` / `requireAdmin` + RLS + RPCs |
| FORCE RLS | Todas as tabelas públicas — migration 010 |
| Tenant | `company_id` no profile; manager sem empresa = 401 |
| IA | Opt-in + ZDR + deny collection; crise fora do LLM |
| Rate limit | `consume_client_log_quota`: 20 eventos/min por usuário |
| Headers | CSP (Google Fonts permitidas), HSTS, `X-Frame-Options: DENY`, nosniff, Referrer-Policy, Permissions-Policy |
| Service role | Só admin portal, jobs, `llm_config`, `system_logs`; wellness-plan e convites usam JWT + RLS |
| `node:crypto` | Removido do bundle do cliente; anonimização do userId usa `crypto.subtle` |

**Variáveis de ambiente (nomes reais):**

| Variável | Tipo |
|---|---|
| `VITE_SUPABASE_URL` | pública (bundle) |
| `VITE_SUPABASE_ANON_KEY` | pública (bundle) |
| `SUPABASE_SERVICE_ROLE_KEY` | somente servidor |
| `OPENROUTER_API_KEY` | somente servidor |
| `CRON_SECRET` | somente servidor |
| `APP_BASE_URL` / `VITE_APP_URL` | URL canônica (convites) |
| `RESEND_API_KEY` / `REMINDER_FROM_EMAIL` | opcional (e-mails) |

Em ambientes Vercel, `VERCEL_URL` e `VERCEL_PROJECT_PRODUCTION_URL` são usadas como fallback de URL canônica quando as explícitas não estão definidas.

---

## 10. Deploy — Vercel

| Arquivo | O que faz |
|---|---|
| `vite.config.ts` | `nitro: { preset: "vercel" }` — Nitro gera `.vercel/output` |
| `vercel.json` | `framework: "tanstack-start"`, cron `GET /api/jobs/retention` às 09:15 UTC |
| `.nvmrc` | Node 22 |
| `.env.example` | Template com nomes reais das variáveis (sem valores) |
| `.vercelignore` | Exclui `e2e/`, `PadrãoDashi/`, `supabase/.temp` |
| `.gitignore` | `.env`, `.env.*` (exceto `.env.example`), `.vercel` |
| `package.json` | `engines.node >=20.18.0`; sem `lightningcss-win32-*` (binário Windows removido) |

Build local passa em `npm run build` (saída em `.vercel/output/`). `npm test` passa com 32 testes.

**Passos pós-merge para subir:**
1. Importar repo em vercel.com/new → confirmar preset **TanStack Start**.
2. Cadastrar variáveis (seção 9) em Production + Preview + Build.
3. Atualizar Site URL e Redirect URLs no Supabase Auth.
4. Primeiro deploy — cron fica ativo automaticamente.

---

## 11. Status

### 11.1 Fases de produto

| Fase | Tema | Status |
|---|---|---|
| 0–15 | Fundação até Portal Admin | ✅ |
| 16 | Limpeza / tom enterprise | 🟡 16.4 percepção humana e 16.6 proposta pendentes |
| 17 | Testes | ✅ Vitest 32 testes + Playwright smoke + RLS no Postgres |
| 18 | Deploy | ✅ Build Vercel ok; pendente: primeiro deploy em produção |
| 19 | LGPD, convites, RLS, crise | ✅ código + banco |
| 20 | Expansão (push, nativo, …) | 🔮 |

### 11.2 Hardenings implementados (nesta sessão)

| # | Item | Artefato |
|---|---|---|
| 1 | Sessão httpOnly — JWT sai do body | `session.ts`, `require-user.ts`, `server.ts`, `auth.server.ts`, `auth-context.tsx` |
| 2 | Service role só onde precisa | `wellness-plan.server.ts`, `invites.server.ts` (RPCs); admin/jobs: mantido |
| 3 | Headers de segurança (CSP + HSTS + Google Fonts) | `security-headers.ts` |
| 4 | Rate limit `logClientEvent` | RPC `consume_client_log_quota` (migration 010) |
| 5 | Cache compartilhado preventiva/LLM via banco | `private.compute_cache` (migration 010) |
| 6 | Playwright E2E smoke | `e2e/smoke.spec.ts`, `playwright.config.ts` |
| 7 | FORCE RLS em todas as tabelas + self-test | Migration `010_hardening_sessao_rls.sql` |
| 8 | Memória curada do companion | `companion_memories`, `companion-agent.ts`, `companion-memory.server.ts`, migration `010_companion_memories.sql` |
| 9 | Preset Nitro Vercel + vercel.json + env | `vite.config.ts`, `vercel.json`, `.env.example`, `config.server.ts` (VERCEL_URL) |

### 11.3 Testes e CI

- **Vitest (32):** isolamento tenant, k-anonimato, chat-guard, crise, consentimento v3, logs, RLS no Postgres, sessão httpOnly, Vercel preset/vercel.json, cron GET+POST, memória do companion.
- **Playwright smoke:** login, cookie httpOnly, headers de hardening, disclaimer clínico.
- **CI GitHub Actions:** `tsc --noEmit`, lint, `npm test`, Playwright Chromium — em todo push/PR.

### 11.4 Débitos conscientes

1. Histórico `supabase_migrations` local vs remoto ainda desalinhado para 000–007 (risco de repair vs benefício baixo).
2. Secrets do GitHub (`APP_URL`, `CRON_SECRET`) precisam ser cadastrados para o retention workflow funcionar.
3. Primeiro deploy em produção na Vercel ainda não feito — repo pronto, pendente cadastro de env e merge.
4. 16.4 (percepção enterprise) e 16.6 (proposta comercial) ainda em aberto.

---

## 12. Arquitetura

- Server functions + camada `services/` + shells por papel.
- Autorização em três níveis: rota → `require*` → RLS/RPC.
- Agregação de RH no **banco**, não no Node com service role.
- Identificadores pessoais não entram no prompt da IA.
- URL canônica resolvida dinamicamente: explícita (`APP_BASE_URL`) > `VERCEL_PROJECT_PRODUCTION_URL` > `VERCEL_URL` > localhost.
- Cache de estado do servidor no **banco** (preventiva, LLM) — serverless-safe.
- Padrões: `*.server.ts`, Zod, `logEvent`, `require-user.ts` como único gate de identidade.

---

## 13. Documentação

| Onde | O quê |
|---|---|
| `documentacao/DEPLOY-PLAYBOOK.md` | Playbook Vercel v1.1 (variáveis reais, cron, checklist) |
| `documentacao/` demais | BRD, PRD, FRD, SDD, API-DOCS, ROADMAP, USER-STORIES, TEST-PLAN |
| `README.md` | Início rápido, stack, env, deploy Vercel |
| `.env.example` | Template de variáveis sem valores |
| `docs/SESSAO-DEBITO.md` | Histórico do débito de sessão (fechado) |
| `charlie-metodo/` | Método de reprodução do companion (referência) |

Scripts disponíveis: `dev`, `build`, `build:dev`, `preview`, `lint`, `format`, `test`, `test:e2e`.

---

## 14. Conclusão

Mundo Mental Care é um **produto B2B isolado por empresa**, com núcleo de confiança completo:

- Entrada por convite; papel imutável no cliente.
- RH só vê agregado com opt-in e k-anonimato; diário/chat fora do alcance.
- Termo 3.0, retenção automática, ZDR na IA, disclaimer clínico visível.
- Sessão httpOnly — JWT nunca circula no body das server functions.
- FORCE RLS em todas as tabelas; self-test via RPC.
- 32 testes Vitest + Playwright smoke passando no CI.
- Build Vercel gerado e validado localmente (`.vercel/output/`).

**Próximo passo operacional:** cadastrar variáveis de ambiente na Vercel e fazer o primeiro deploy em produção.  
**Próximo passo de produto:** 16.4 (percepção enterprise) e 16.6 (proposta comercial).
