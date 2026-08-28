# Análise Completa — Zēllu

> **Última atualização:** 2026-08-28  
> **Fonte:** código em `src/`, migrations `007`–`017` no repositório, `documentacao/` v1.2, `PRODUCT.md` (Impeccable), deck em `apresentacao/`, landing pública `/`, UI clay, companions, tour de produto, Resend (convites + leads da landing).

---

## 1. Visão Geral

| Campo | Valor |
|---|---|
| **Nome do pacote** | `zellu` |
| **Nome de exibição** | Zēllu (`src/lib/branding.ts`) |
| **Tagline** | Cuidado emocional no ritmo do trabalho |
| **Tipo** | Companion digital B2B de bem-estar emocional (marca Zēllu; núcleo ZelluApp / Dashitecnology) |
| **O que não é** | Não substitui psicólogo, psiquiatra, terapia nem diagnóstico. Disclaimer no login, aceite de convite, termo v3.0, onboarding, Chat, Perfil e rodapé da landing. |

O produto cobre o dia a dia do colaborador (check-in, chat, diário, hábitos, plano, respiro) e entrega **sinais agregados** para RH, com isolamento por empresa. Cadastro aberto com escolha de role **foi removido**: entrada é exclusivamente por convite.

Visitante **não autenticado** em `/` vê a **landing de validação** (carta ao RH + formulário de interesse). Colaborador autenticado em `/` continua no dashboard emocional.

**White-label hoje:** uma marca por deploy (`branding.ts` + assets Zēllu). Multi-marca por empresa (logo/cores/nome distintos por `company_id`) **não** está implementada — ver `todo/TODO-PRIORIDADES-PRODUCAO.md`.

**Stack resumida:** React 19 + TanStack Start (SSR) + Vite 7 + Tailwind 4 · Supabase (Auth + PostgreSQL + RLS) · OpenRouter (LLM) · Nitro (Vercel) · pdfmake (relatórios RH) · Resend (e-mail opcional) · Vitest + Playwright no CI.

---

## 2. Estrutura de Diretórios (relevante)

```
zellu/
├── .github/workflows/
│   ├── ci.yml                    # tsc + lint + vitest + playwright
│   └── retention.yml             # POST /api/jobs/retention (secrets APP_URL + CRON_SECRET)
├── .env.example                  # variáveis documentadas sem valores
├── .vercelignore
├── vercel.json                   # framework: tanstack-start, cron: /api/jobs/retention
├── apresentacao/                 # deck HTML + roteiro + usuários de teste + linkedin.html
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
│   ├── 010_companion_memories.sql      # companion_memories + RLS
│   ├── 011_hardening_sessao_rls.sql    # FORCE RLS, quota, cache, self-test (antes: 010_hardening…)
│   ├── 012_profiles_authenticated_grants.sql  # GRANT SELECT/INSERT/UPDATE profiles
│   ├── 013_manager_team_edit.sql       # renomear equipe + assign_team_member
│   ├── 014_rh_member_summary.sql       # sinais de bem-estar por colaborador (sem humor diário)
│   ├── 015_directory_avatar.sql        # avatar_url no diretório RH
│   ├── 016_set_employee_job_title.sql  # RH atualiza cargo (job_title)
│   └── 017_product_tour.sql            # product_tour_completed_at (guia companion/RH)
├── src/
│   ├── assets/
│   │   ├── avatar/           # cabeças Amora/Chico/Pipoca/Zeca
│   │   ├── companions/chico/ # poses PNG transparentes (demais: .gitkeep)
│   │   ├── mascote/transparent/  # urso Zēllu (telas companion)
│   │   ├── icons/  logo-zellu/
│   ├── components/
│   │   ├── landing/          # LandingPage + landing.css (carta ao RH)
│   │   ├── chat/             # ChatStarterReplies, ChatAiSuggestionButton, ChatCompanionHeader
│   │   ├── ClayLoader.tsx / PageLoader
│   │   ├── Mascot.tsx / CompanionMascot.tsx
│   │   ├── ProductTourModal.tsx / CompanionProductTour.tsx / ManagerProductTour.tsx
│   │   ├── Icon.tsx + icons/soft-nav-icons.tsx
│   │   ├── RhMoodDistributionPies.tsx
│   │   ├── PrivacyPreferencesSection.tsx
│   │   ├── CrisisHelp.tsx, PrivacyConsentCard.tsx, CheckinReminderBanner.tsx
│   │   ├── pages/mobile/  e  pages/desktop/
│   │   └── ui/            # shadcn
│   ├── lib/
│   │   ├── api/*.server.ts   # incl. leads.server.ts (pedido de teste RH)
│   │   ├── companions/     # registry Amora/Chico/Pipoca/Zeca, quick-replies, fallback-voice, resolve-pose
│   │   ├── email.server.ts               # Resend: convite, lembretes, leads da landing
│   │   ├── rh-dashboard-pdf.ts / rh-report-pdf.ts / rh-reports.ts
│   │   ├── rh-member-summary.ts
│   │   ├── companion-agent.ts / companion-local-fallback.ts / companion-portrait.ts
│   │   ├── branding.ts                   # marca global do deploy
│   │   ├── supabase/session.ts           # cookies httpOnly mmc-at / mmc-rt
│   │   ├── config.server.ts              # getAppBaseUrl (VERCEL_URL / …)
│   │   ├── security-headers.ts / retention.ts / privacy.ts / require-user.ts
│   │   └── __tests__/                    # incl. companions-chat.test.ts
│   ├── routes/
│   │   ├── index.tsx         # guest → landing; companion autenticado → dashboard
│   │   ├── login.tsx, aceitar-convite.tsx  # card clay compacto + mascote
│   │   ├── onboarding.tsx, privacidade.tsx, sobre/
│   │   ├── companion: / (auth), /chat, /checkin, /diario, /meu-bem-estar, …
│   │   ├── manager/: rh-dashboard, equipes, equipe/$teamId, colaborador/$profileId,
│   │   │            relatorios, convites
│   │   ├── admin/  e  dashitecnology/
│   ├── server.ts                 # SSR + GET|POST /api/jobs/retention
│   └── start.ts                  # CSRF
├── vite.config.ts                # nitro.preset: "vercel"
├── playwright.config.ts
├── PRODUCT.md                    # contexto de produto (Impeccable)
├── .impeccable/                  # config + briefs de superfície (landing)
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
| Vite + TanStack Start + Nitro | — | Build SSR (preset Vercel) |
| Tailwind CSS | ^4.3.3 | Estilo |
| Supabase JS / SSR | ^2.110.3 / ^0.12.1 | Auth + DB |
| Zod | ^3.24.2 | Validação |
| pdfmake | ^0.3.11 | PDF do dashboard / relatórios RH |
| Vitest | ^3.2.4 | Testes unitários |
| Playwright | ^1.55.0 | E2E (smoke) |

Node.js ≥ 20.18 (`.nvmrc` = 22; CI usa Node 22).

### 3.2 UI e dados

Radix/shadcn, recharts, framer-motion, react-markdown, date-fns.  
**Ícones:** navegação (companion / RH / admin / dev) em SVGs soft outline (`soft-nav-icons.tsx`); demais nomes ainda usam Material Symbols via `Icon`.  
**Loading:** `ClayLoader` (anel outline) + `PageLoader` (mascote + anel).  
Login/auth no cliente (`auth-context.tsx`); APIs no servidor (`createServerFn`).

---

## 4. Rotas e papéis

### 4.1 Públicas

| URL | Função |
|---|---|
| `/` | **Landing pública** se visitante (carta + formulário). Dashboard emocional se companion autenticado. |
| `/login` | Login clay compacto (mascote + marca + formulário pill). Sem cadastro aberto. Link “Recebi um convite”. |
| `/aceitar-convite?token=` | Aceite: valida convite, cria conta, login automático. Visual alinhado ao login. |
| `/privacidade` | Política LGPD v3.0 (IA, retenção, RH, direitos). |
| `/sobre` e `/sobre/$slug` | Páginas institucionais (layout próprio). |

### 4.2 Companion (após consentimento)

| URL | Função |
|---|---|
| `/onboarding` | Termo + maioridade + opt-ins IA/RH/e-mail → nome/fuso |
| `/` | Dashboard emocional (+ mascote header). Só com sessão companion; visitante vê a landing (4.1). |
| `/chat` | Companion IA por avatar (Amora/Chico/Pipoca/Zeca): poses (Chico), quick replies, fallback com voz; `CrisisHelp` |
| `/checkin` | Sono → água → humor (1×/dia) |
| `/diario` | Timeline |
| `/meu-bem-estar` | Indicadores do dia |
| `/plano-de-cuidado` | Checklist + streak |
| `/respiro` | Respiração guiada |
| `/perfil` | Conta, cargo, avatar, opt-ins (switches), exportar/excluir, tema, crise |

Termo desatualizado → `useRequireAuth` manda de volta ao onboarding.

### 4.3 Manager

| URL | Função |
|---|---|
| `/manager` e `/manager/rh-dashboard` | KPIs agregados; pizzas de humor (7d fixo + período 14/30/60/90); export PDF |
| `/manager/equipes` | Times reais + k-anonimato |
| `/manager/equipe/$teamId` | Detalhe, renomear, mover membros |
| `/manager/colaborador/$profileId` | Ficha operacional + resumo de bem-estar (sem humor diário/chat/diário); editar cargo |
| `/manager/relatorios` | CSV / PDF agregados |
| `/manager/convites` | Pessoas; convites (e-mail Resend ou link); **cancelar** pendentes/expirados; `is_active` |

### 4.4 Admin e Dev

- `/admin/*` — empresas, funcionários, licenças, contratos, métricas, sentimentos, alertas, CSV/PDF.
- `/dashitecnology/*` — LLM config e system logs (role `dev`).

### 4.5 Hierarquia

`dev` (tudo) → `admin` (portal B2B) → `manager` (só a empresa) → `companion` (só os próprios dados).  
Role **somente** em `profiles.role`. JWT `user_metadata.role` não autoriza.

---

## 5. Funcionalidades

### 5.1 Landing pública (validação RH)

- Superfície **Persuade** em `/` para visitante (`LandingPage`, `landing.css`). Composição “Carta ao RH” (Impeccable, seed em `PRODUCT.md` / brief `.impeccable/`).
- Primeiro ecrã: palavra **Ausência**; carta em 1ª pessoa (dev); vistas A (check-in sintético) e B (células RH / k-anonimato); cartão de resposta.
- Formulário: nome, e-mail corporativo, empresa → `submitLandingLead` (`leads.server.ts`). Sem autenticação. Honeypot `website`.
- E-mail via Resend para `LEADS_TO_EMAIL` (fallback `privacidade@zellu.app`). O lead **não** recebe a mensagem; a equipe lê e chama. Sem `RESEND_API_KEY`: a UI admite que o envio está desligado.
- Loader da rota: `getAuthSnapshot` no `loader` — visitante vê a landing no SSR, sem spinner de auth. `PageTransition` não faz fade em `/`.
- Link “Já tenho acesso” → `/login`. Companion autenticado em `/` segue no dashboard.

### 5.2 Acesso B2B

- Convites (`invites`): e-mail, role `companion` | `manager`, token, validade 7 dias, teto de licenças.
- Aceite cria Auth user + profile com `company_id` / `team_id` / `role`.
- **`cancelInvite`:** remove convite não aceito; libera seat na contagem; invalida link.
- Trigger `handle_new_user` sempre começa como `companion`; o aceite ajusta no servidor.
- Companion/manager **não** alteram `role`, `company_id`, `team_id`, `is_active` (trigger + guard).
- E-mail via Resend (`sendInviteEmail` → `email.server.ts`); retorno `{ emailSent, emailSkipped, emailError }`; sem key = link copiável na UI.
- **Gap operacional:** não há UI Admin para convidar o **1º manager** de uma empresa nova (API `createInvite` com `companyId` existe; UI só em `/manager/convites`).

**Setup de cliente novo (resumo):** Admin cria empresa → licença → equipes → bootstrap 1º RH (script/API) → RH convida colaboradores.

### 5.3 LGPD e confiança

- Consentimento versionado **3.0** + declaração de maioridade.
- Opt-ins separados: IA, RH (agregados), e-mail de lembrete — UI com switches no Perfil.
- Exportar JSON e excluir conta no Perfil.
- Retenção: chat/diário/preventiva/memórias 180 dias, check-ins 365 dias, logs 90 dias.
- Purge: `private.purge_expired_personal_data`, cron `15 9 * * *` (Vercel + GitHub Action), endpoint `GET|POST /api/jobs/retention`.
- Logs sanitizados (sem e-mail, humor, texto de saúde).
- Disclaimer clínico único (`CLINICAL_DISCLAIMER`) no login, no aceite de convite e no rodapé da landing.

### 5.4 Check-in

Três etapas; 6 humores + 19 extras (`moods.ts`). Segundo check-in no mesmo dia **falha** (não atualiza). Alimenta chat, dashboard e preventiva.

### 5.5 Chat IA e Memória do Companion

- `sendChatMessage` ignora `history`/`context` do cliente (`chat-guard.ts`).
- 20 msgs/hora; timeout 15s / 10s nos fallbacks.
- Crise (regex no servidor) → CVV 188, sem LLM.
- Cloud só com `privacy_ai_opt_in`; senão fallback local por avatar (`buildLocalFallbackReplyForAvatar` + `fallback-voice.ts`).
- **Companions:** registry em `src/lib/companions/` — prompt por avatar, quick replies (`quick-replies.ts`), Chico com poses PNG dinâmicas; Amora/Pipoca/Zeca usam fallback visual Chico até ter assets próprios.
- UI chat: `ChatCompanionHeader`, `ChatStarterReplies`, `ChatAiSuggestionButton`.
- OpenRouter: cliente dedicado; ZDR / deny collection no pipeline. Prompt **sem** nome/e-mail. userId anonimizado com SHA-256 via `crypto.subtle`.
- **Memória curada** (`companion_memories`): até 20 registros, máx 180 chars, importância 1–5. Só o titular via RLS. Retenção 180 dias.

### 5.6 Companion (resto)

Dashboard, timeline, bem-estar, respiro, plano + streak (3–90 dias), insights com fallback, preventiva (`burnout-risk`, `sleep-crisis`, etc.), banner de check-in pendente, fuso em `profiles.timezone`, cargo (`job_title`) editável no Perfil.

**Guia de produto (`tour.server.ts`, migration `017`):**
- Companion: modal após onboarding LGPD (`CompanionProductTour` → `ProductTourModal`).
- Manager: modal no 1º acesso ao painel RH (`ManagerProductTour`).
- Coluna `profiles.product_tour_completed_at`.

### 5.7 RH

- `get_rh_dashboard` (SECURITY DEFINER no schema `private`, wrapper em `public`).
- Só companions com `privacy_rh_opt_in`.
- K-anonimato: time com < 5 pessoas oculta métricas; empresa com < 5 opt-ins zera trends/alertas.
- **Distribuição de humor:** duas pizzas — 7 dias fixos + período selecionável (14/30/60/90) via `getRhMoodDistribution`.
- Export PDF do dashboard e dos relatórios (`pdfmake`).
- Sem service role no painel. Sem diário/chat/humor individual nominativo.
- Diretório: RPC `list_company_directory` (nome/e-mail/papel/cargo/`avatar_url`; sem flags de saúde).
- Edição de equipes (`013`) e resumo por colaborador (`014` — status/tendência/participação/sono agregado, sem humor diário).
- RH pode definir `job_title` (`016`).

### 5.8 Admin / Dev

Portal B2B completo. LLM: chave em `OPENROUTER_API_KEY`. Logs só para `dev`.

---

## 6. Insights e preventiva

`insights-ai.server.ts` — contextos timeline, dashboard, anxiety-change, sleep-quality, weekly-summary, chat. Sem opt-in de IA, só regras locais.

`preventiva-ai.server.ts` — padrões + persistência em `preventive_notifications` + cache ~30 min via `private.compute_cache` (banco — sem estado in-process). UI: `PreventiveAlertBanner`.

Cache da LLM (`llm_config`): sem cache in-process; lido do banco por request.

---

## 7. Design

- Companion: paleta clay/OKLCH, Quicksand + Nunito Sans, glassmorphism contido.
- **Landing (`/` visitante):** identidade Zēllu (cream `#FDF8F4`, terracota, sage, ink); Quicksand no display; papel e cartão de resposta — não o herói SaaS nem os cards clay do app. Mascote nas margens. Tokens em `landing.css` (`.lp-*`).
- Variáveis de ícone: `--icon-stroke` / `--icon-fill` / `--icon-accent` (claro e `.dark`).
- Nav: SVGs soft outline; ativo com fill clay suave (`filled`).
- Loading: anel outline (`ClayLoader`) em vez do `sync` Material.
- Mascote urso Zēllu (`assets/mascote/transparent/` e poses Chico na landing) em login, onboarding, loading (`PageLoader`), check-in, chat header, respiro, landing.
- Login e `/aceitar-convite`: card único compacto, campos pill com ícones, CTA clay, toggle senha.
- Avatares companion: Amora, Chico, Pipoca, Zeca — cabeça no perfil; Chico com poses no chat; demais com fallback visual.
- Admin: visual slate, tabelas densas.
- Tema claro/escuro persistente (`theme.tsx`). Landing pública permanece no cream da marca (cena diurna).
- Páginas companion ainda têm pares mobile/desktop; `ResponsivePages.tsx` unifica onde já migrado.
- Deck comercial: `apresentacao/` (HTML + Mermaid + roteiro + credenciais de teste + `linkedin.html`).
- Design context: `PRODUCT.md` + Impeccable (`.cursor/skills/impeccable`, `.impeccable/config.json` `buildPath: code`).

---

## 8. Backend (Supabase)

Projeto remoto: `cxogfjczajhxgyffxcbk`. Histórico CLI não espelha 000–006 (schema legado num timestamp). Hardening de sessão/RLS está em **`011_hardening_sessao_rls.sql`** (arquivo local renomeado; conteúdo equivale ao antigo `010_hardening…`).

### 8.1 Tabelas

`profiles`, `checkins`, `habits`, `diary_entries`, `chat_messages`, `llm_config`, `preventive_notifications`, `wellness_plans`, `wellness_checklist`, `companies`, `teams`, `licenses`, `contracts`, `alert_configs`, `system_logs`, `invites`, **`companion_memories`**.

`private`: `compute_cache`, `client_log_quota`, funções de agregação RH / diretório / sinais.

`profiles` inclui timezone, consentimento, opt-ins, `adult_confirmed_at`, `onboarding_completed_at`, **`product_tour_completed_at`**, `is_active`, `job_title`, `avatar_url`.

### 8.2 RLS (pós-011)

FORCE ROW LEVEL SECURITY nas tabelas públicas relevantes.

| Dado | Companion | Manager |
|---|---|---|
| Próprios check-ins / hábitos / diário / chat / memórias | CRUD | Diário/chat: nunca. Check-in individual: sem SELECT |
| Painel RH | — | Só JSON agregado (`get_rh_dashboard`) + sinais resumidos por membro (`014`) |
| Colegas | — | Diretório operacional via RPC (inclui avatar/cargo) |
| Outra empresa | — | Impossível pela RPC (company do JWT) |

RPCs notáveis: `company_has_available_seat`, `set_employee_active`, `get_invite_public`, `assign_team_member`, `set_employee_job_title`, `list_company_directory`, `run_rls_self_test`.  
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
| FORCE RLS | Tabelas públicas — migration **011** |
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
| `RESEND_API_KEY` | opcional — e-mails (convites, lembretes, **leads da landing**) |
| `REMINDER_FROM_EMAIL` / `INVITE_FROM_EMAIL` | opcional — remetente (domínio verificado no Resend) |
| `LEADS_TO_EMAIL` | opcional — caixa que **recebe** o pedido de teste da landing (não é o e-mail do RH que preencheu) |

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
| `package.json` | `engines.node >=20.18.0` |

Build local passa em `npm run build` (saída em `.vercel/output/`). Suite Vitest: **~65+** testes (ver 11.3 sobre 2 falhas conhecidas).

**Passos pós-merge para subir:**
1. Importar repo em vercel.com/new → confirmar preset **TanStack Start**.
2. Cadastrar variáveis (seção 9) em Production + Preview + Build — incl. Resend, `LEADS_TO_EMAIL`, URLs canônicas.
3. Atualizar Site URL e Redirect URLs no Supabase Auth.
4. Aplicar migrations `011`–**`017`** no projeto remoto se ainda não aplicadas.
5. Primeiro deploy — cron fica ativo automaticamente.

**Resend (convites e landing):** domínio verificado no remetente (`REMINDER_FROM_EMAIL` / `INVITE_FROM_EMAIL`); `APP_BASE_URL` e `VITE_APP_URL` apontando para a URL canônica do deploy (sem path extra). Sem `RESEND_API_KEY`, convites continuam com link copiável na UI; o formulário da landing avisa que o envio está desligado. `LEADS_TO_EMAIL` define quem lê o pedido de teste.

---

## 11. Status

### 11.1 Fases de produto

| Fase | Tema | Status |
|---|---|---|
| 0–15 | Fundação até Portal Admin | ✅ |
| 16 | Limpeza / tom enterprise | 🟡 UI clay avançou; **16.6 proposta:** landing pública `/` (carta + form). 16.4 percepção ainda pendente |
| 17 | Testes | 🟡 Vitest expandido (+ `companions-chat.test.ts`); 2 asserts desatualizados (ver 11.3) |
| 18 | Deploy | ✅ Build Vercel ok; pendente: env Resend + migrations 017 no remoto |
| 19 | LGPD, convites, RLS, crise | ✅ código + banco |
| 20 | UX companion/RH, e-mail convites, companions | 🟡 ✅ parcial — tour, quick replies, fallback por avatar, cancelar convite, Resend; white-label por empresa 🔮 |
| 21 | RH operacional | ✅ equipes editáveis, ficha colaborador, pizzas de humor, PDF, cargo/avatar |
| 22 | Identidade visual companion | 🟡 nav soft + mascote + loader + Chico poses; Amora/Pipoca/Zeca aguardam assets; ícones de ação ainda Material |

### 11.2 Hardenings e entregas recentes

| # | Item | Artefato |
|---|---|---|
| 1 | Sessão httpOnly — JWT sai do body | `session.ts`, `require-user.ts`, `server.ts`, `auth.server.ts` |
| 2 | Service role só onde precisa | wellness-plan / invites via RPC; admin/jobs mantidos |
| 3 | Headers de segurança | `security-headers.ts` |
| 4 | Rate limit + cache DB | migration **011** |
| 5 | Memória curada do companion | `010_companion_memories.sql` + agent |
| 6 | Preset Nitro Vercel | `vite.config.ts`, `vercel.json` |
| 7 | GRANT profiles authenticated | `012` |
| 8 | Edição de equipes RH | `013` + UI equipes/membro |
| 9 | Resumo bem-estar por colaborador | `014` + `/manager/colaborador/$profileId` |
| 10 | Avatar + cargo no diretório | `015`, `016` + Perfil |
| 11 | Pizzas de humor RH | `RhMoodDistributionPies`, `getRhMoodDistribution` |
| 12 | PDF dashboard/relatórios | `pdfmake`, `rh-*-pdf.ts` |
| 13 | Ícones soft + ClayLoader + mascote | `soft-nav-icons`, `ClayLoader`, `Mascot` |
| 14 | Login / aceitar-convite restyle | `login.tsx`, `aceitar-convite.tsx` |
| 15 | E-mail de convite (Resend) | `email.server.ts`, `invites.server.ts` |
| 16 | Cancelar convite + feedback e-mail | `cancelInvite`, UI `/manager/convites` |
| 17 | Companions Amora/Chico/Pipoca/Zeca | `src/lib/companions/*`, chat UI, `companions-chat.test.ts` |
| 18 | Tour de produto companion + RH | `017_product_tour.sql`, `ProductTourModal`, `tour.server.ts` |
| 19 | Mascote urso integrado | `Mascot.tsx`, `assets/mascote/transparent/` |
| 20 | Landing pública + leads RH | `LandingPage`, `leads.server.ts`, `index.tsx` loader guest, `LEADS_TO_EMAIL` |
| 21 | Impeccable / PRODUCT.md | `.cursor/skills/impeccable`, `PRODUCT.md`, `.impeccable/` |

### 11.3 Testes e CI

- **Vitest (~65+):** isolamento tenant, k-anonimato, chat-guard, crise, consentimento v3, logs, sessão httpOnly, Vercel preset, cron, memória, RH member summary, **quick replies e fallback por companion**, etc.
- **Falhas conhecidas (2):**  
  1. Assert ZDR ainda aponta para trecho antigo em `llm-config.server.ts` (cliente OpenRouter foi extraído).  
  2. Teste ainda procura `010_hardening_sessao_rls.sql` — arquivo renomeado para **`011_hardening_sessao_rls.sql`**.
- **Playwright smoke:** login, cookie httpOnly, headers, disclaimer.
- **CI GitHub Actions:** `tsc --noEmit`, lint, `npm test`, Playwright Chromium — em todo push/PR.

### 11.4 Débitos conscientes

1. Histórico `supabase_migrations` local vs remoto ainda desalinhado para 000–007 (risco de repair vs benefício baixo).
2. Corrigir os 2 testes Vitest desatualizados (path 011 + ZDR no cliente OpenRouter).
3. Secrets do GitHub (`APP_URL`, `CRON_SECRET`) para o retention workflow.
4. Primeiro deploy em produção na Vercel — repo pronto; falta env (incl. Resend) + migrations **011–017** no remoto se faltarem.
5. **Bootstrap 1º manager:** sem UI Admin; operação manual via API/script até implementar.
6. **White-label por empresa:** adiado — hoje uma marca por deploy (`branding.ts`).
7. 16.4 (percepção enterprise) ainda em aberto; 16.6 (proposta) avançou com a landing — falta persistir leads se o e-mail não bastar.
8. Ícones de ação (`edit`, `check`, `close`, …) ainda Material — próxima leva de SVGs soft.
9. Poses PNG de Amora/Pipoca/Zeca — pastas com `.gitkeep`; chat usa fallback visual do Chico.
10. `RESEND_API_KEY` opcional: sem ela, convites só exibem o link no painel; a landing não envia o pedido de teste.
11. Landing ainda sem persistência de leads no banco — só e-mail transacional. Sem confirmação automática para quem preencheu.

---

## 12. Arquitetura

- Server functions + camada `services/` + shells por papel.
- Autorização em três níveis: rota → `require*` → RLS/RPC.
- Agregação de RH no **banco**, não no Node com service role.
- Identificadores pessoais não entram no prompt da IA.
- URL canônica: `APP_BASE_URL` > `VERCEL_PROJECT_PRODUCTION_URL` > `VERCEL_URL` > localhost.
- Cache de estado do servidor no **banco** (preventiva, LLM) — serverless-safe.
- Padrões: `*.server.ts`, Zod, `logEvent`, `require-user.ts` como único gate de identidade.
- UI: tokens CSS clay + ícones soft com `currentColor` / vars de tema; landing com tokens `.lp-*` (papel, não clay-card).

---

## 13. Documentação

| Onde | O quê |
|---|---|
| `documentacao/` | BRD, PRD, FRD, SDD, API-DOCS, ROADMAP, USER-STORIES, TEST-PLAN, DEPLOY-PLAYBOOK — **v1.2** (2026-08-26) |
| `PRODUCT.md` | Contexto de produto para design (Impeccable) |
| `README.md` | Início rápido, stack, env, deploy |
| `.env.example` | Template de variáveis sem valores (incl. `LEADS_TO_EMAIL`) |
| `apresentacao/` | Deck, roteiro, usuários de teste, `linkedin.html` |
| `todo/TODO-PRIORIDADES-PRODUCAO.md` | Prioridades produção (white-label, bootstrap RH, etc.) |
| `docs/SESSAO-DEBITO.md` | Histórico do débito de sessão (fechado) |
| `charlie-metodo/` | Método de reprodução do companion (referência) |

Scripts: `dev`, `build`, `build:dev`, `preview`, `lint`, `format`, `test`, `test:e2e`.

---

## 14. Conclusão

Zēllu é um **produto B2B isolado por empresa**, com núcleo de confiança e identidade visual clay em evolução:

- Entrada por convite (e-mail Resend ou link); aceite alinhado ao login compacto; **cancelamento** de convites pendentes; papel imutável no cliente.
- RH vê agregado + resumo operacional por pessoa, com opt-in e k-anonimato; diário/chat fora do alcance; **tour** no 1º acesso ao painel.
- Companion com **quatro avatares** (prompt, quick replies e fallback com voz distinta); Chico com poses; tour pós-onboarding.
- Termo 3.0, retenção automática, ZDR na IA, disclaimer clínico visível.
- Sessão httpOnly; FORCE RLS; self-test via RPC.
- Nav soft, mascote urso, ClayLoader; pizzas de humor e PDF no painel RH.
- **Landing pública** em `/` (visitante): carta de validação + formulário; Resend → `LEADS_TO_EMAIL`.
- Suite Vitest expandida; 2 asserts pedem ajuste pós-refatoração.

**White-label:** uma marca Zēllu por deploy; multi-marca por `company_id` permanece roadmap.

**Próximo passo operacional:** cadastrar env na Vercel (incl. Resend, `LEADS_TO_EMAIL`, URLs canônicas), garantir migrations `011`–**`017`** no remoto e primeiro deploy.  
**Próximo passo técnico:** corrigir os 2 testes quebrados; assets PNG de Amora/Pipoca/Zeca; ícones de ação soft.  
**Próximo passo de produto:** UI Admin para 1º manager; 16.4 (percepção enterprise); persistir leads se o e-mail deixar de bastar.
