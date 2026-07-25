# Análise Completa da Aplicação — LVB-ZelluApp (Mundo Mental Care)

> **Última atualização:** 2026-07-25  
> **Fonte de status:** código em `src/`, `TODO-MundoMental.md`, `docs/`

---

## 1. Visão Geral

**Nome do projeto:** `tanstack_start_ts` (nome interno)
**Nome de exibição:** Mundo Mental Care (`src/lib/branding.ts`)
**Tagline:** Cuidado emocional no ritmo do trabalho
**Descrição:** Companion digital de bem-estar emocional corporativo da oferta Mundo Mental — chat terapêutico com IA, check-in, diário/timeline, hábitos, plano de cuidado, dashboard emocional, insights e alertas preventivos, painel de RH e Portal Administrativo (super-admin).

**Posicionamento:** não substitui psicólogos nem a plataforma clínica da Mundo Mental; aumenta engajamento e sustenta o cuidado entre interações especializadas (`docs/POSICIONAMENTO.md`).

**Template base:** `tanstack_start_ts` (via Lovable.dev)
**Gerenciador de pacotes:** bun (com `bun.lock` e `bunfig.toml`; também há `package-lock.json`)
**Node:** Módulos ES (`"type": "module"`)
**Linguagem:** TypeScript + TSX (React 19)
**Build tool:** Vite 7
**Estilo:** Tailwind CSS 4 + shadcn/ui (New York style)
**Ícones:** Google Material Symbols Outlined + lucide-react
**Backend:** Supabase (PostgreSQL + Auth + Storage)
**IA:** OpenRouter (GPT-4o-mini)

---

## 2. Estrutura de Diretórios

```
LVB-ZelluApp/
├── .git/
├── .gitignore
├── .lovable/
│   └── project.json
├── .prettierrc
├── .prettierignore
├── .tanstack/tmp/
├── .vscode/
├── bun.lock
├── bunfig.toml
├── components.json
├── eslint.config.js
├── node_modules/
├── package.json
├── package-lock.json
├── public/
│   ├── favicon.ico
│   └── logo.png
├── docs/
│   ├── POSICIONAMENTO.md          # O que o app é / não é (Fase 16.5)
│   └── PROPOSTA-COMERCIAL.md      # Rascunho comercial (Fase 16.6 pendente)
├── PLANS/
│   └── PLANO_BACKEND.md           # Plano histórico de backend
├── PadrãoDashi/                   # Skills/agents de referência (não runtime)
├── src/
│   ├── assets/avatar/cabeca/
│   │   ├── Amora.png
│   │   ├── Chico.png
│   │   ├── Pipoca.png
│   │   └── Zeca.png
│   ├── components/
│   │   ├── Avatar.tsx               # Avatares Amora, Chico, Pipoca, Zeca
│   │   ├── Icon.tsx                 # Wrapper Material Symbols Outlined
│   │   ├── ChatMarkdown.tsx         # Renderização Markdown nas respostas da IA
│   │   ├── PageTransition.tsx       # Transição de página (shells Companion)
│   │   ├── MilestoneBanner.tsx      # Celebração de streaks (Fase 13)
│   │   ├── PreventiveAlertBanner.tsx # Alertas preventivos (Fase 11)
│   │   ├── MobileShell.tsx          # Layout mobile + nav inferior
│   │   ├── DesktopShell.tsx         # Layout desktop com sidebar
│   │   ├── ManagerShell.tsx         # Layout RH/Manager
│   │   ├── AdminShell.tsx           # Layout B2B do Portal Admin
│   │   ├── DevShell.tsx             # Layout Dev Tools
│   │   ├── admin/
│   │   │   └── AdminShared.tsx      # Gate, KPIs e UI compartilhada do admin
│   │   └── ui/                      # 46 componentes shadcn/ui
│   ├── data/
│   │   ├── index.ts
│   │   ├── moods.ts                 # MAIN_MOODS + EXTRA_MOODS
│   │   ├── chat.ts / diario.ts / habitos.ts / respiro.ts
│   ├── hooks/
│   │   └── use-mobile.tsx
│   ├── lib/
│   │   ├── api/                     # Server Functions
│   │   │   ├── auth.server.ts
│   │   │   ├── checkin.server.ts
│   │   │   ├── chat-ai.server.ts
│   │   │   ├── chat.server.ts
│   │   │   ├── diario.server.ts
│   │   │   ├── habitos.server.ts
│   │   │   ├── dashboard.server.ts
│   │   │   ├── timeline.server.ts
│   │   │   ├── manager.server.ts    # RH (+ Dashboard Fase 14)
│   │   │   ├── admin.server.ts      # Portal Admin
│   │   │   ├── preventiva-ai.server.ts
│   │   │   ├── wellness-plan.server.ts
│   │   │   ├── streak-system.server.ts
│   │   │   ├── llm-config.server.ts
│   │   │   ├── insights-ai.server.ts
│   │   │   ├── logs.server.ts       # system_logs + painel System Logs
│   │   │   └── example.functions.ts
│   │   ├── services/
│   │   │   ├── chat-service.ts
│   │   │   ├── diario-service.ts
│   │   │   ├── habitos-service.ts
│   │   │   ├── dashboard-service.ts
│   │   │   ├── timeline-service.ts
│   │   │   ├── manager-service.ts
│   │   │   ├── rh-dashboard-service.ts
│   │   │   ├── admin-service.ts
│   │   │   ├── preventiva-service.ts
│   │   │   ├── wellness-plan-service.ts
│   │   │   └── streak-service.ts
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   ├── server.ts
│   │   │   └── admin.server.ts
│   │   ├── auth-context.tsx         # Roles: companion|manager|dev|admin
│   │   ├── auth-token.ts            # Helpers JWT (userId/email do access token)
│   │   ├── use-require-auth.ts
│   │   ├── branding.ts              # Mundo Mental Care
│   │   ├── theme.tsx
│   │   ├── config.server.ts
│   │   ├── error-capture.ts
│   │   ├── error-page.ts
│   │   ├── lovable-error-reporting.ts
│   │   └── utils.ts
│   ├── routes/
│   │   ├── README.md
│   │   ├── __root.tsx
│   │   ├── index.tsx                # Dashboard Emocional (/)
│   │   ├── login.tsx
│   │   ├── chat.tsx
│   │   ├── checkin.tsx
│   │   ├── diario.tsx
│   │   ├── habitos.tsx              # Redirect → /meu-bem-estar
│   │   ├── meu-bem-estar.tsx
│   │   ├── plano-de-cuidado.tsx     # Plano de bem-estar + streak (Fases 12/13)
│   │   ├── respiro.tsx
│   │   ├── perfil.tsx
│   │   ├── dashboard-emocional.tsx  # Redirect → /
│   │   ├── manager/
│   │   │   ├── index.tsx
│   │   │   ├── rh-dashboard.tsx
│   │   │   ├── equipes.tsx
│   │   │   └── relatorios.tsx
│   │   ├── admin/
│   │   │   ├── index.tsx
│   │   │   ├── empresas.tsx
│   │   │   ├── funcionarios.tsx
│   │   │   ├── licencas.tsx
│   │   │   ├── metricas.tsx
│   │   │   ├── sentimentos.tsx
│   │   │   ├── alertas.tsx
│   │   │   └── relatorios.tsx
│   │   └── dashitecnology/
│   │       ├── index.tsx            # LLM Config + System Logs
│   │       └── $painelDev.tsx
│   ├── components/pages/
│   │   ├── mobile/
│   │   │   ├── ChatPage.tsx
│   │   │   ├── CheckinPage.tsx
│   │   │   ├── TimelinePage.tsx
│   │   │   ├── BemEstarPage.tsx
│   │   │   ├── PlanoDeCuidadoPage.tsx
│   │   │   ├── RespiroPage.tsx
│   │   │   ├── PerfilPage.tsx
│   │   │   ├── DashboardEmocionalPage.tsx
│   │   │   ├── DiarioPage.tsx       # legado / auxiliar
│   │   │   └── HabitosPage.tsx     # legado / auxiliar
│   │   └── desktop/
│   │       ├── (mesmos pares mobile)
│   ├── routeTree.gen.ts
│   ├── router.tsx
│   ├── server.ts
│   ├── start.ts                     # CSRF middleware
│   └── styles.css
├── supabase/migrations/
│   ├── 000_schema_inicial.sql
│   ├── 003_llm_fallback.sql
│   ├── 004_preventiva_notifications.sql
│   ├── 005_wellness_plan.sql
│   └── 006_admin_portal.sql
├── tsconfig.json
├── vite.config.ts
├── .env
├── TODO-MundoMental.md
└── ANALISE_COMPLETA.md              # Este arquivo
```

---

## 3. Stack Tecnológica Detalhada

### 3.1 Core
| Tecnologia | Versão | Função |
|---|---|---|
| React | ^19.2.0 | UI Library |
| TypeScript | ^5.8.3 | Tipagem |
| Vite | ^7.3.1 | Bundler / Dev Server |
| TanStack React Router | ^1.168.25 | Roteamento SPA/SSR |
| TanStack React Query | ^5.83.0 | Cache / estado server |
| TanStack React Start | ^1.168.20 | Framework full-stack SSR |
| Nitro (beta) | 3.0.260429-beta | Servidor de produção SSR |
| Tailwind CSS | ^4.2.1 | Utilitários CSS |
| shadcn/ui | — | Componentes headless estilizados |
| Supabase | ^2.110.3 | Auth, DB, Storage |
| OpenRouter | — | Gateway LLM (GPT-4o-mini) |

### 3.2 Componentes e UI
| Pacote | Versão | Uso |
|---|---|---|
| @radix-ui/* | múltiplos | Primitivas headless acessíveis |
| class-variance-authority | ^0.7.1 | Variantes (cva) |
| clsx + tailwind-merge | ^2.1.1 / ^3.5.0 | Classes CSS |
| lucide-react | ^0.575.0 | Ícones |
| Material Symbols Outlined | — | Ícones (Google Fonts) |
| recharts | ^2.15.4 | Gráficos |
| embla-carousel-react | ^8.6.0 | Carrossel |
| cmdk | ^1.1.1 | Command palette |
| input-otp | ^1.4.2 | OTP |
| react-day-picker | ^9.14.0 | Calendário |
| react-hook-form | ^7.81.0 | Formulários |
| @hookform/resolvers | ^5.2.2 | Validação de forms |
| react-markdown | ^10.1.0 | Markdown no chat IA |
| sonner | ^2.0.7 | Toasts |
| vaul | ^1.1.2 | Drawer |
| react-resizable-panels | ^4.6.5 | Painéis |
| date-fns | ^4.1.0 | Datas |
| zod | ^3.24.2 | Schemas |
| framer-motion | ^12.42.2 | Animações / PageTransition |
| tw-animate-css | ^1.3.4 | Animações CSS |

---

## 4. Sistema de Rotas (TanStack Router)

**Tipo:** File-based routing com proteção por role

### 4.1 Rotas Públicas
| Arquivo | URL | Descrição |
|---|---|---|
| `__root.tsx` | — | Layout raiz, providers, error/404 |
| `login.tsx` | `/login` | Login e cadastro com seleção de role |

### 4.2 Rotas de Colaborador (Companion)
| Arquivo | URL | Descrição |
|---|---|---|
| `index.tsx` | `/` | Dashboard Emocional + insights + alertas preventivos |
| `chat.tsx` | `/chat` | Chat com IA (Markdown + preventiva) |
| `checkin.tsx` | `/checkin` | Check-in matinal (sono, água, humor) |
| `diario.tsx` | `/diario` | Timeline + insights + preventiva |
| `meu-bem-estar.tsx` | `/meu-bem-estar` | Indicadores consolidados do dia |
| `plano-de-cuidado.tsx` | `/plano-de-cuidado` | Plano de bem-estar + checklist + streak |
| `respiro.tsx` | `/respiro` | Exercícios de respiração |
| `perfil.tsx` | `/perfil` | Perfil e configurações |
| `habitos.tsx` | `/habitos` | Redirect → `/meu-bem-estar` |
| `dashboard-emocional.tsx` | `/dashboard-emocional` | Redirect → `/` |

**Navegação Companion (MobileShell / DesktopShell):**
Dashboard · Check-in · Chat · Diário · Plano · Bem-estar · Respiro · Perfil

### 4.3 Rotas de Manager (RH/Gestor)
| Arquivo | URL | Descrição |
|---|---|---|
| `manager/index.tsx` | `/manager` | Dashboard RH (visão inicial) |
| `manager/rh-dashboard.tsx` | `/manager/rh-dashboard` | Dashboard RH completo (Fase 14) |
| `manager/equipes.tsx` | `/manager/equipes` | Gestão de equipes |
| `manager/relatorios.tsx` | `/manager/relatorios` | Exportação CSV |

**Navegação Manager:** Dashboard RH · Equipes · Relatórios · Perfil

### 4.4 Rotas de Admin (Portal Administrativo — Fase 15)
| Arquivo | URL | Descrição |
|---|---|---|
| `admin/index.tsx` | `/admin` | KPIs globais + alertas ativos |
| `admin/empresas.tsx` | `/admin/empresas` | CRUD empresas/clientes |
| `admin/funcionarios.tsx` | `/admin/funcionarios` | Pessoas e equipes |
| `admin/licencas.tsx` | `/admin/licencas` | Licenças e contratos |
| `admin/metricas.tsx` | `/admin/metricas` | DAU/WAU/MAU e adesão |
| `admin/sentimentos.tsx` | `/admin/sentimentos` | Humor agregado (30 dias) |
| `admin/alertas.tsx` | `/admin/alertas` | Thresholds + avaliação |
| `admin/relatorios.tsx` | `/admin/relatorios` | Export CSV/PDF |

### 4.5 Rotas de Dev
| Arquivo | URL | Descrição |
|---|---|---|
| `dashitecnology/index.tsx` | `/dashitecnology` | Índice (LLM Config + System Logs) |
| `dashitecnology/$painelDev.tsx` | `/dashitecnology/:painelDev` | Painéis dinâmicos |

### 4.6 Hierarquia de Acesso por Role

**Companion:** rotas companion · bloqueado em `/manager`, `/admin`, `/dashitecnology`

**Manager:** rotas manager · bloqueado em companion exclusivas, `/admin`, `/dashitecnology`

**Admin:** `/admin/*` · redirect pós-login → `/admin` · shell B2B (`AdminShell`)

**Dev:** acesso total (companion + manager + admin + dev) · pode alternar modos

---

## 5. Funcionalidades Implementadas

### 5.1 Autenticação e Autorização
- Login/cadastro com email e senha
- Seleção de role no cadastro (Colaborador ou RH/Gestor)
- Redirect pós-login por role (`admin` → `/admin`, `manager` → `/manager`, demais → `/`)
- Proteção via `useRequireAuth()` + `AuthProvider`
- Sessão persistente (Supabase Auth)
- Helpers de token em `auth-token.ts`

### 5.2 Dashboard Emocional (`/`)
- Gráficos (recharts): humor, comparativo semanal, tendência humor/sono 30d
- Métricas: dias rastreados, humor predominante, média de sono
- Insights de IA + comparação semanal (sono, água, movimento)
- Banner de alerta preventivo (`PreventiveAlertBanner`)
- Banner de milestone de streak quando aplicável
- Versões mobile e desktop

### 5.3 Chat com IA (`/chat`)
- OpenRouter (GPT-4o-mini) com contexto (nome, check-in, período do dia)
- Histórico (últimos 10 turnos) + sugestões pós-resposta
- Typing indicator + persistência no Supabase
- Respostas em **Markdown** (`ChatMarkdown` / `react-markdown`)
- Integração com alertas preventivos no topo do chat

### 5.4 Check-in Matinal (`/checkin`)
- Fluxo em 3 etapas: sono → água → humor
- Humor alinhado a Meu Bem-estar: 6 principais + **“Ver +19 humores”** (`src/data/moods.ts`)
- Persistência Supabase; alimenta contexto do chat
- Evita duplicata no mesmo dia

### 5.5 Timeline/Diário (`/diario`)
- Timeline agregada: diário, check-ins, hábitos, chat
- Calendário de humor (14 dias)
- Insight de IA + alerta preventivo
- Nova entrada de texto

### 5.6 Meu Bem-estar (`/meu-bem-estar`)
- Água, sono, humor (6 + 19), movimento, energia, refeições, link Respiro
- Pré-popula do check-in; salvamento consolidado

### 5.7 Espaço do Respiro (`/respiro`)
- Ciclo guiado (inspirar / segurar / expirar) com animação CSS
- Sons ambiente: chuva, floresta, fogueira, ondas

### 5.8 Perfil (`/perfil`)
- Nome, avatar (Amora/Chico/Pipoca/Zeca), email, senha
- Tema claro/escuro + logout
- Dev/Admin: troca de modos (inclui Portal Admin)

### 5.9 Dashboard RH (`/manager` e `/manager/rh-dashboard`)
- KPIs por equipe (estresse, energia, sono, engajamento)
- Resumo: colaboradores, check-ins, adesão, alertas
- Fase 14: tendências 30d, distribuição de humor, alertas por equipe
- Dados agregados/anonimizados (`getRhDashboard`)

### 5.10 Gestão de Equipes (`/manager/equipes`)
- Lista por departamento com status (Estável / Monitorar / Atenção)
- Grid responsivo

### 5.11 Relatórios Manager (`/manager/relatorios`)
- Exportação CSV (últimos 30 dias), indicadores agregados

### 5.12 Dev Tools (`/dashitecnology`)
- **LLM Config:** modelo, temperatura, max tokens, system prompt, API key, teste, reset
- **System Logs:** visualização de logs (`logs.server.ts` → tabela `system_logs`)
- Acesso: apenas role `dev`

### 5.13 Portal Administrativo (`/admin`) — Fase 15 ✅
- Shell B2B (`AdminShell`)
- Acesso: `admin` e `dev`
- Módulos: KPIs · Empresas · Funcionários · Licenças · Métricas · Sentimentos · Alertas · Relatórios
- API: `admin.server.ts` + `admin-service.ts`
- Schema: `006_admin_portal.sql`

### 5.14 IA Preventiva — Fase 11 ✅
- Detecção de padrões (sono, humor, engajamento, hidratação, energia, movimento)
- Tipos: `burnout-risk`, `sleep-crisis`, `mood-crisis`, `disengagement`, etc.
- Severidade low/medium/high; mensagem + sugestão acionável
- UI: `PreventiveAlertBanner` no Dashboard, Chat e Timeline
- Persistência: `preventive_notifications` (`004_preventiva_notifications.sql`)
- Cache em memória (~30 min) na detecção server-side

### 5.15 Plano de Cuidado — Fase 12 ✅
- Rota `/plano-de-cuidado` com páginas mobile/desktop
- Objetivo definido pelo usuário + checklist diário (água, caminhada, respirar, conversar)
- Progresso visual + sugestões da IA para ajustes
- API: `wellness-plan.server.ts` + `wellness-plan-service.ts`
- Schema: `005_wellness_plan.sql` (`wellness_plans`, `wellness_checklist`)

### 5.16 Gamificação Elegante — Fase 13 ✅
- Streak com base em check-ins + checklist (`streak-system.server.ts`)
- Marcos: 3, 7, 14, 21, 30, 60, 90 dias
- `MilestoneBanner` no Dashboard e Plano de Cuidado (tom corporativo, sem celebração infantil)

---

## 6. Insights com IA (Fase 10)

### 6.1 Sistema (`insights-ai.server.ts`)
Contextos: `timeline`, `dashboard`, `anxiety-change`, `sleep-quality`, `weekly-summary`, `chat`

### 6.2 Dados e correlações
Médias (sono, água, movimento, energia), distribuição de humor, tendências, comparação semanal; correlações sono↔humor, movimento↔energia, etc.

### 6.3 Fallback
Regras locais quando a API não está disponível — sempre retorna insight relevante

---

## 7. Sistema de Design

### 7.1 Paleta (OKLCH / clay)
| Variável | Uso |
|---|---|
| `--clay-cream` | Fundo principal |
| `--clay-title` | Títulos |
| `--clay-text` | Texto corporal |
| `--clay-cta` / `--clay-cta-2` | CTAs |
| `--clay-anxiety` / `--clay-stress` / `--clay-joy` | Estados emocionais |

### 7.2 Componentes de UI
`clay-card`, `clay-soft`, `clay-pressed`, `clay-cta` — glassmorphism contido (Fase 3)

### 7.3 Tipografia
- Display: Quicksand · Corpo: Nunito Sans · Ícones: Material Symbols Outlined

### 7.4 Tema
ThemeProvider + toggle claro/escuro com persistência

### 7.5 Portal Admin (B2B)
Visual slate distinto do Companion; tabelas densas, badges, recharts

### 7.6 Motion
`PageTransition` (framer-motion) nos shells Companion; animações de respiração e banners sutis

---

## 8. Backend (Supabase)

### 8.1 Tabelas principais
| Tabela | Função |
|---|---|
| `profiles` | Usuário (role, display_name, avatar, company_id, team_id, …) — roles: `companion` \| `manager` \| `dev` \| `admin` |
| `checkins` | Check-in matinal |
| `habits` | Hábitos do dia |
| `diary_entries` | Diário |
| `chat_messages` | Chat |
| `llm_config` | Config IA (dev) |
| `preventive_notifications` | Alertas preventivos (Fase 11) |
| `wellness_plans` / `wellness_checklist` | Plano de cuidado (Fase 12) |
| `companies` / `teams` / `licenses` / `contracts` / `alert_configs` | Portal Admin (Fase 15) |
| `system_logs` | Logs operacionais (Dev Tools) |

### 8.2 RLS
Políticas por tabela; companion vê próprios dados; manager vê agregados; admin/dev gerenciam entidades B2B

### 8.3 Autenticação
Email + senha, JWT, refresh; redirect por role

### 8.4 Observabilidade
`logEvent()` em várias server functions → `system_logs`; painel em `/dashitecnology/system-logs`

---

## 9. Segurança

### 9.1 CSRF
Middleware em `start.ts` protegendo server functions

### 9.2 Auth
Supabase Auth (JWT + refresh)

### 9.3 Autorização
`useRequireAuth()` + checagens de role nas rotas/shells

### 9.4 Variáveis de ambiente
```
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
OPENROUTER_API_KEY=sk-or-v1-...
```

---

## 10. Status do Projeto

### 10.1 Fases Concluídas ✅

| Fase | Descrição | Status |
|---|---|---|
| 0 | Fundação Arquitetural | ✅ |
| 1 | White Label & Rebranding | ✅ |
| 2 | Dois Modos (Companion + Manager) | ✅ |
| 3 | Redesign Visual | ✅ |
| 4 | Chat com IA Contextual | ✅ |
| 5 | Check-in Matinal | ✅ |
| 6 | Manager Pages Responsivas | ✅ |
| 7 | Hábitos → Meu Bem-estar | ✅ |
| 8 | Diário → Timeline | ✅ |
| 9 | Dashboard Emocional | ✅ |
| 10 | Insights IA | ✅ |
| 11 | IA Preventiva | ✅ |
| 12 | Plano de Cuidado | ✅ |
| 13 | Gamificação Elegante | ✅ |
| 14 | Dashboard do RH | ✅ |
| 15 | Portal Administrativo | ✅ |
| 16 | Limpeza & Refinamento | 🟡 quase concluída |

### 10.2 Fase 16 — detalhe
| Item | Status |
|---|---|
| 16.1 Textos corporativo-acolhedor | ✅ |
| 16.2 Eliminar sinais de MVP | ✅ |
| 16.3 Experiência “produto pronto” | ✅ |
| 16.4 Testes de percepção (feedback humano) | ⏳ pendente |
| 16.5 Documentar posicionamento | ✅ (`docs/POSICIONAMENTO.md`) |
| 16.6 Apresentar proposta comercial | ⏳ rascunho em `docs/PROPOSTA-COMERCIAL.md` |

### 10.3 Progresso geral
- **Produto / código:** ~100% das fases técnicas 0–15 + limpeza 16.1–16.3/16.5
- **Fechamento comercial:** pendente validação humana (16.4) e apresentação da proposta (16.6)
- Branding oficial no app: **Mundo Mental Care**

### 10.4 Atualizações relevantes (histórico recente)
1. ✅ Navegação login / parâmetros de rota / CSRF
2. ✅ Acesso total do role `dev`
3. ✅ Insights IA + preventiva + plano + streak
4. ✅ Portal Admin completo + migration `006`
5. ✅ Humor unificado (`moods.ts`) no check-in e bem-estar
6. ✅ Markdown no chat; System Logs no Dev Tools
7. ✅ Nav Companion com **Plano** (`/plano-de-cuidado`)
8. ✅ Posicionamento documentado; proposta comercial em rascunho

---

## 11. Observações

### 11.1 Arquitetura
- Mobile-first com pares mobile/desktop
- SSR (TanStack Start) + Server Functions
- Camada `services/` entre UI e `api/*.server.ts`
- Context API (auth/theme) + React Query

### 11.2 Padrões
- `.server.ts` para código server-only
- Validação Zod nas server functions
- `auth-token.ts` para extrair identidade do JWT
- Logging centralizado via `logs.server.ts`

### 11.3 Performance
- Lazy loading, cache React Query, Vite + Tailwind
- Cache de detecção preventiva server-side

---

## 12. Documentação

### 12.1 Arquivos
| Arquivo | Conteúdo |
|---|---|
| `TODO-MundoMental.md` | Plano de fases e checklist |
| `ANALISE_COMPLETA.md` | Este arquivo |
| `docs/POSICIONAMENTO.md` | O que o produto é / não é |
| `docs/PROPOSTA-COMERCIAL.md` | Rascunho comercial |
| `PLANS/PLANO_BACKEND.md` | Plano histórico de backend (pode estar desatualizado vs. código atual) |
| `src/routes/README.md` | Notas de rotas |

### 12.2 Scripts (`package.json`)
| Script | Função |
|---|---|
| `dev` | Servidor de desenvolvimento |
| `build` | Build de produção |
| `build:dev` | Build modo development |
| `preview` | Preview do build |
| `lint` | ESLint |
| `format` | Prettier |

---

## 13. Conclusão

A aplicação está posicionada como **Mundo Mental Care**: companion de engajamento e autocuidado emocional no ritmo do trabalho, com:

- ✅ Backend Supabase + roles Companion / Manager / Admin / Dev
- ✅ Chat contextual com Markdown e memória de conversa
- ✅ Check-in, bem-estar, timeline, dashboard emocional
- ✅ Insights IA, alertas preventivos, plano de cuidado e streaks
- ✅ Painel de RH (dados agregados) e Portal Administrativo B2B
- ✅ CSRF, proteção de rotas, Dev Tools (LLM + logs)
- ✅ Design responsivo (clay Companion + slate Admin)
- ✅ Posicionamento documentado (não substitui clínica / plataforma MM)

**Próximos passos externos ao código:** feedback de percepção “enterprise” (16.4) e fechamento/apresentação da proposta comercial (16.6).
