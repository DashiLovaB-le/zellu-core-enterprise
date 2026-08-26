# SDD — System Architecture / Design Document

> **Projeto:** Zēllu  
> **Versão:** 1.1  
> **Data:** 2026-08-18

---

## 1. Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTE                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  React 19 + TanStack Router + Tailwind CSS 4       │    │
│  │  shadcn/ui (New York style)                         │    │
│  │  Recharts · Framer Motion · react-markdown          │    │
│  └─────────────────────────────────────────────────────┘    │
│                          │                                   │
│                     HTTP/HTTPS                               │
│                          │                                   │
├──────────────────────────┼───────────────────────────────────┤
│                        SERVIDOR                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  TanStack Start (SSR) + Nitro (beta)               │    │
│  │  Server Functions (src/lib/api/*.server.ts)         │    │
│  │  CSRF Middleware (start.ts)                         │    │
│  └─────────────────────────────────────────────────────┘    │
│         │                    │                    │           │
│         ▼                    ▼                    ▼           │
│  ┌─────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │  Supabase   │  │  OpenRouter     │  │  Supabase       │  │
│  │  Auth       │  │  (GPT-4o-mini)  │  │  Storage        │  │
│  │  (JWT+RLS)  │  │                 │  │  (avatars)      │  │
│  └─────────────┘  └─────────────────┘  └─────────────────┘  │
│         │                                                   │
│         ▼                                                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  PostgreSQL (Supabase)                              │    │
│  │  Tables: profiles, checkins, chat_messages,         │    │
│  │  diary_entries, habits, llm_config,                 │    │
│  │  preventive_notifications, wellness_plans,          │    │
│  │  wellness_checklist, companies, teams, licenses,    │    │
│  │  contracts, alert_configs, system_logs, invites     │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Stack Tecnológica

### 2.1 Frontend
| Tecnologia | Versão | Função |
|---|---|---|
| React | 19.2.0 | UI Library |
| TypeScript | 5.8.3 | Tipagem estática |
| Vite | 7.3.1 | Bundler / Dev Server |
| TanStack Router | 1.168.25 | Roteamento SPA/SSR |
| TanStack Query | 5.83.0 | Cache / estado server |
| TanStack Start | 1.168.20 | Framework full-stack SSR |
| Tailwind CSS | 4.2.1 | Utilitários CSS |
| shadcn/ui | — | Componentes headless |
| Framer Motion | 12.42.2 | Animações |

### 2.2 Backend
| Tecnologia | Versão | Função |
|---|---|---|
| Nitro | 3.0.260429-beta | Servidor de produção SSR |
| Supabase JS | 2.110.3 | Cliente Auth/DB/Storage |
| Supabase SSR | 0.12.1 | Integração SSR |
| OpenRouter | — | Gateway LLM |

### 2.3 Infraestrutura
| Serviço | Função |
|---|---|
| Supabase Cloud | PostgreSQL, Auth, Storage, Edge Functions |
| OpenRouter | Acesso a GPT-4o-mini |
| GitHub | Controle de versão + CI/CD |
| Vercel / Netlify | Hospedagem do frontend (opção) |

---

## 3. Arquitetura de Camadas

### 3.1 Diagrama de Camadas

```
┌─────────────────────────────────────────────┐
│              UI (React)                     │
│  Routes → Pages → Components → Hooks       │
├─────────────────────────────────────────────┤
│              Services                       │
│  src/lib/services/*.ts                      │
│  (lógica de negócio, transformação)         │
├─────────────────────────────────────────────┤
│              API (Server Functions)          │
│  src/lib/api/*.server.ts                    │
│  (validação, auth, orquestração)            │
├─────────────────────────────────────────────┤
│              Data Layer                     │
│  Supabase Client / Server                   │
│  src/lib/supabase/*.ts                      │
├─────────────────────────────────────────────┤
│              External Services              │
│  OpenRouter (LLM)                           │
└─────────────────────────────────────────────┘
```

### 3.2 Responsabilidades por Camada

| Camada | Responsabilidades |
|---|---|
| **UI** | Renderização, interação do usuário, validação visual |
| **Services** | Transformação de dados, lógica de negócio pura, formatação |
| **API** | Validação de input (Zod), autorização, orquestração de chamadas |
| **Data** | Queries ao banco, RLS, autenticação |
| **External** | Integrações com serviços de terceiros |

---

## 4. Banco de Dados

### 4.1 Schema Entity-Relationship

```
auth.users (Supabase Auth)
    │
    ├── profiles (id, email, display_name, role, avatar_url, company_id, team_id, ...)
    │       │
    │       ├── checkins (user_id, sleep_hours, water_ml, mood, created_at)
    │       ├── chat_messages (user_id, from, text, created_at)
    │       ├── diary_entries (user_id, content, mood, created_at)
    │       ├── habits (user_id, water_ml, sleep_quality)
    │       ├── wellness_plans (user_id, goal, streak)
    │       │       └── wellness_checklist (plan_id, label, completed)
    │       └── preventive_notifications (user_id, type, severity, message, ...)
    │
    ├── companies (id, name, slug, status, seats, ...)
    │       ├── teams (company_id, name, ...)
    │       ├── invites (company_id, email, role, token, ...)
    │       ├── licenses (company_id, plan_name, seats, status, ...)
    │       ├── contracts (company_id, title, value_brl, status, ...)
    │       └── alert_configs (company_id, thresholds, ...)
    │
    └── llm_config (id=1, model, temperature, system_prompt, ...)
    └── system_logs (level, source, message, metadata, ...)
```

### 4.2 Tabelas Principais

| Tabela | Propósito | Row Level Security |
|---|---|---|
| `profiles` | Dados do usuário, role, vínculo empresa/equipe | ✅ |
| `checkins` | Check-in matinal (sono, água, humor) | ✅ |
| `chat_messages` | Mensagens do chat com IA | ✅ |
| `diary_entries` | Entradas de diário/timeline | ✅ |
| `habits` | Hábitos diários consolidados | ✅ |
| `llm_config` | Configuração da IA (singleton) | ✅ |
| `preventive_notifications` | Alertas preventivos gerados | ✅ |
| `wellness_plans` | Planos de cuidado | ✅ |
| `wellness_checklist` | Itens do checklist | ✅ |
| `companies` | Empresas clientes B2B | ✅ |
| `teams` | Equipes dentro de empresas | ✅ |
| `licenses` | Licenças e planos | ✅ |
| `contracts` | Contratos comerciais | ✅ |
| `alert_configs` | Configuração de thresholds | ✅ |
| `invites` | Convites B2B (token, role, empresa) | ✅ |
| `system_logs` | Logs operacionais (sanitizados) | ✅ |

### 4.3 Row Level Security (RLS)

**Políticas por role (após 008/009):**

| Tabela | Companion | Manager | Admin/Dev |
|---|---|---|---|
| `profiles` | Read/Write próprio (sem alterar role/empresa) | Diretório operacional via RPC `list_company_directory` (sem flags de saúde) | Read amplo |
| `checkins` / `habits` | CRUD próprio | **Sem SELECT individual**; agregados via RPC `get_rh_dashboard` | Staff SELECT |
| `chat_messages` / `diary_entries` | CRUD próprio | Nunca | Sem SELECT via RLS (suporte só com service role auditado) |
| `companies` / `teams` | — | Read da própria empresa | CRUD |
| `invites` | — | CRUD da própria empresa | CRUD |
| `system_logs` | — | — | Dev SELECT |

Role de autorização: `private.current_user_role()` lê `profiles.role`. **JWT `user_metadata.role` não autoriza.**

### 4.4 Migrations

| Migration | Conteúdo |
|---|---|
| `000_schema_inicial.sql` | Tabelas core: profiles, checkins, chat, diary, habits, llm_config |
| `003_llm_fallback.sql` | Configuração de fallback para LLM |
| `004_preventiva_notifications.sql` | Tabela de alertas preventivos |
| `005_wellness_plan.sql` | Planos de cuidado e checklist |
| `006_admin_portal.sql` | Portal B2B: companies, teams, licenses, contracts |
| `007_prioridades_producao.sql` | Convites, isolamento por empresa, role no perfil, k-anonimato na API |
| `008_lgpd_controles.sql` | Opt-ins IA/RH/e-mail, maioridade, sem check-in nominal ao RH, retenção |
| `009_confianca_rls_retencao.sql` | RPC `get_rh_dashboard` / `list_company_directory`; cron diário de purge |

---

## 5. Autenticação e Autorização

### 5.1 Fluxo de Autenticação

```
Usuário → Login (email+senha)
    │
    ▼
Supabase Auth → Valida credenciais
    │
    ▼
JWT retornado (access_token + refresh_token)
    │
    ▼
Sessão no cliente (Supabase JS); token enviado no body das server functions
    │  (débito: cookie httpOnly ainda não é o padrão — docs/SESSAO-DEBITO.md)
    ▼
getUserRole lê `profiles.role` (não user_metadata)
    │
    ▼
useRequireAuth() + requireUser()/requireManager() no servidor
```

### 5.2 Roles e Hierarquia

```
dev (acesso total)
  │
  ├── admin (Portal Admin + leitura)
  │     │
  │     └── manager (Dashboard RH + leitura)
  │
  └── companion (funcionalidades pessoais)
```

### 5.3 JWT Payload

```typescript
{
  sub: string          // user ID
  email: string
  exp: number
}
// Autorização NÃO usa este JWT para role.
// Role, company_id e opt-ins vêm de public.profiles.
```

---

## 6. Padrões de Segurança

### 6.1 CSRF Protection

- Middleware em `start.ts` intercepta server functions
- Valida token CSRF em todas as requisições mutáveis
- Previne ataques cross-site request forgery

### 6.2 Autenticação

- Supabase Auth com JWT + refresh token automático
- Sessão persistente no cliente; **token ainda no body** das server functions
- Validação: `supabase.auth.getUser(accessToken)` (assinatura + expiração)

### 6.3 Autorização

- `useRequireAuth()` em todas as rotas protegidas
- Checagem de role em server functions
- RLS no banco de dados como segunda camada

### 6.4 Variáveis de Ambiente

```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
OPENROUTER_API_KEY=sk-or-v1-...
```

**Regras:**
- Nunca commitar `.env`
- `.gitignore` já inclui `.env`
- Service role key apenas em server-side

### 6.5 Dados Sensíveis

| Dado | Proteção |
|---|---|
| Senhas | Hashed pelo Supabase Auth |
| API keys | Apenas server-side |
| Dados de humor | RLS: só o titular; RH vê média de equipe se opt-in + k ≥ 5 |
| Dados agregados (RH) | RPC no banco; nunca texto de diário/chat |
| LGPD | Termo v3.0, opt-ins, retenção automática (`pg_cron` + job), exportar/excluir |

---

## 7. Integrações Externas

### 7.1 OpenRouter (LLM)

**Endpoint:** `https://openrouter.ai/api/v1/chat/completions`

**Modelo:** `openai/gpt-4o-mini`

**Configuração:**
```typescript
{
  model: string          // configurável via Dev Tools
  temperature: number    // 0–2 (default: 0.7)
  max_tokens: number     // 100–4000 (default: 300)
  messages: Message[]
}
```

**Privacidade da chamada:**
```typescript
provider: { data_collection: "deny", zdr: true }
```
Sem `privacy_ai_opt_in`, o companion responde só no servidor (fallback local).

### 7.2 Supabase Services

| Serviço | Uso |
|---|---|
| Auth | Autenticação, sessão, JWT |
| Database | PostgreSQL com RLS |
| Storage | Avatares dos usuários |

---

## 8. Estrutura de Diretórios

```
src/
├── assets/              # Imagens, avatares
├── components/          # Componentes React
│   ├── admin/           # Componentes do admin
│   ├── ui/              # shadcn/ui (46 componentes)
│   └── *.tsx            # Componentes compartilhados
├── data/                # Dados estáticos (moods, etc.)
├── hooks/               # Custom hooks
├── lib/                 # Lógica de negócio
│   ├── api/             # Server Functions (*.server.ts)
│   ├── services/        # Serviços de transformação
│   ├── supabase/        # Client e config
│   ├── auth-context.tsx # Context de autenticação
│   ├── auth-token.ts    # Helpers JWT
│   └── utils.ts         # Utilitários gerais
├── routes/              # TanStack Router (file-based)
│   ├── index.tsx        # Dashboard Emocional
│   ├── login.tsx        # Login (sem cadastro aberto)
│   ├── aceitar-convite.tsx
│   ├── onboarding.tsx
│   ├── privacidade.tsx
│   ├── chat.tsx         # Chat IA
│   ├── checkin.tsx      # Check-in
│   ├── diario.tsx       # Timeline
│   ├── meu-bem-estar.tsx
│   ├── plano-de-cuidado.tsx
│   ├── respiro.tsx      # Respiração
│   ├── perfil.tsx       # Perfil
│   ├── manager/         # Rotas RH
│   ├── admin/           # Rotas Admin
│   └── dashitecnology/  # Rotas Dev
├── components/pages/    # Páginas (mobile/desktop)
│   ├── mobile/
│   └── desktop/
├── router.tsx           # Config do router
├── routeTree.gen.ts     # Árvore gerada automaticamente
├── server.ts            # Config do servidor
├── start.ts             # CSRF middleware
└── styles.css           # Estilos globais
```

---

## 9. Padrões de Código

### 9.1 Convenções

| Padrão | Descrição |
|---|---|
| `*.server.ts` | Código executado apenas no servidor |
| Zod schemas | Validação de dados em todas as server functions |
| `auth-token.ts` | Helpers de token (não é fonte de autorização de role) |
| `logs.server.ts` | Logging centralizado |
| Componentes mobile/desktop | Pares separados em `components/pages/` |
| Services | Camada de transformação entre UI e API |

### 9.2 Naming Conventions

| Tipo | Padrão | Exemplo |
|---|---|---|
| Arquivo server | `*.server.ts` | `chat-ai.server.ts` |
| Componente | PascalCase | `MilestoneBanner.tsx` |
| Hook | camelCase com `use` | `useRequireAuth.ts` |
| Service | camelCase com sufixo | `chat-service.ts` |
| Rota | kebab-case | `plano-de-cuidado.tsx` |
| Tabela DB | snake_case | `preventive_notifications` |

### 9.3 Estilo

- **Formatter:** Prettier (configurado em `.prettierrc`)
- **Linter:** ESLint com plugins React Hooks e React Refresh
- **CSS:** Tailwind CSS 4 + shadcn/ui (New York style)
- **Ícones:** Material Symbols Outlined + lucide-react

---

## 10. Performance e Otimização

### 10.1 Estratégias

| Estratégia | Implementação |
|---|---|
| Lazy loading | Rotas carregadas sob demanda via TanStack Router |
| Cache | React Query para dados do servidor |
| Code splitting | Vite automaticamente splitta por rota |
| Imagens | Formatos modernos; lazy loading |
| CSS | Tailwind CSS com purge automático |
| Bundle | Análise via `vite-bundle-analyzer` (quando necessário) |

### 10.2 Cache

| Camada | TTL | Invalidação |
|---|---|---|
| React Query | 5 min (default) | Refetch on focus/mount |
| Supabase RLS | Sem cache | Query fresh |
| IA Preventiva | 30 min | Reavaliação periódica |
| OpenRouter | Sem cache | Resposta fresh |

### 10.3 Métricas de Performance

| Métrica | Meta |
|---|---|
| First Contentful Paint (FCP) | < 1.5s |
| Largest Contentful Paint (LCP) | < 2.5s |
| Time to Interactive (TTI) | < 3s |
| Cumulative Layout Shift (CLS) | < 0.1 |

---

## 11. Monitoramento e Observabilidade

### 11.1 System Logs

**Tabela:** `system_logs`

```sql
CREATE TABLE system_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  level TEXT CHECK (level IN ('info', 'warn', 'error')),
  source TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Uso:**
- `logEvent()` em server functions para registrar eventos
- Painel em `/dashitecnology/system-logs` para visualização
- Filtros por nível, fonte e período

### 11.2 Eventos Monitorados

| Evento | Nível | Fonte |
|---|---|---|
| Login realizado | info | auth |
| Check-in salvo | info | checkin |
| Mensagem enviada | info | chat |
| Erro na IA | error | chat-ai |
| Alerta preventivo gerado | warn | preventiva |
| Erro de servidor | error | server |

### 11.3 Alertas Operacionais

| Alerta | Condição | Ação |
|---|---|---|
| Alto uso de tokens | > 1000 tokens/requisição | Revisar configuração |
| Erros de IA > 5% | Taxa de erro OpenRouter | Verificar API key |
| Lentidão de queries | > 2s por query | Otimizar índice |

---

## 12. Plano de Recuperação

### 12.1 Backup

| Componente | Estratégia | Frequência |
|---|---|---|
| Banco de dados | Supabase backup automático | Diário |
| Código-fonte | GitHub | Contínuo (git push) |
| Configurações | Variáveis de ambiente | Documentadas em vault |
| Assets | Supabase Storage | Associados ao projeto |

### 12.2 Recovery

| Cenário | Procedimento |
|---|---|
| Deploy com bug | Rollback via git revert + redeploy |
| Dados corrompidos | Restaurar do último backup Supabase |
| API key comprometida | Rotacionar via Supabase Dashboard |
| Indisponibilidade Supabase | Status page + notificação time |

---

## 13. Diagrama de Deployment

```
┌─────────────────────────────────────────────────────┐
│                 PRODUÇÃO                            │
│                                                     │
│  ┌─────────────┐     ┌─────────────────────────┐   │
│  │  CDN/Edge   │────▶│  App (Vercel/Netlify)   │   │
│  │  (assets)   │     │  TanStack Start (SSR)   │   │
│  └─────────────┘     └───────────┬─────────────┘   │
│                                  │                  │
│                    ┌─────────────┼─────────────┐    │
│                    │             │             │    │
│                    ▼             ▼             ▼    │
│  ┌──────────────────┐ ┌─────────────┐ ┌─────────┐  │
│  │  Supabase Cloud  │ │  OpenRouter │ │  GitHub │  │
│  │  (DB+Auth+Store) │ │  (LLM API)  │ │  (CI/CD)│  │
│  └──────────────────┘ └─────────────┘ └─────────┘  │
└─────────────────────────────────────────────────────┘
```

---

## 14. Decisões de Arquitetura

| Decisão | Alternativa Considerada | Justificativa |
|---|---|---|
| TanStack Start (SSR) | Next.js | SSR nativo + TanStack Router ecosystem |
| Supabase | Firebase / Firebase Auth + PG | Open-source, RLS nativo, PostgreSQL |
| OpenRouter | OpenAI direto | Acesso a múltiplos modelos; fallback fácil |
| shadcn/ui | Material UI / Chakra | Headless + Tailwind; mais leve e customizável |
| File-based routing | Convencional | Menos boilerplate; roteamento automático |
| Server Functions | API REST separada | Simplifica deployment; menos infra |
