# 🏗️ Plano de Construção do Backend — LVB-ZelluApp (Mundo Mental)

> **Base:** TanStack Start (SSR) + Supabase + OpenRouter  
> **Status atual:** Frontend ~85% completo. Backend parcial (server functions criadas, mas bancos de dados incompletos).  
> **Objetivo:** Finalizar todas as camadas de backend sem erros, do banco à API.

---

## 📌 Diagnóstico Atual

### ✅ O que já funciona
- Autenticação Supabase (login, signup, roles: companion/manager/dev)
- Chat com IA via OpenRouter (GPT-4o-mini) com contexto do usuário
- Check-in matinal salvando em `checkins` (tabela precisa ser criada via migration)
- Leitura de mensagens do chat do banco
- Leitura de hábitos (água) do banco
- Configuração de LLM (modelo, temperatura, prompt) via painel dev
- Server functions criadas com `createServerFn` e validação Zod

### ❌ O que está faltando / incompleto

| # | Problema | Impacto |
|---|----------|---------|
| 1 | **Migration SQL apenas para `llm_config`** — `checkins`, `chat_messages`, `diary_entries`, `habits` não têm migração | Banco inconsistente entre ambientes |
| 2 | **Sem RLS policies** nas tabelas (exceto `llm_config`) | Dados expostos sem segurança |
| 3 | **Sem tabela `profiles`** — role fica apenas em `user_metadata` | Difícil gerenciar usuários |
| 4 | **Água e sono não persistem** — `updateWater` existe mas não é chamado pelo frontend | Dados perdidos ao recarregar |
| 5 | **Diário sem escrita** — `getDiaryEntries` lê mas não há `saveDiaryEntry` | Usuário não consegue registrar |
| 6 | **Manager dashboard usa dados mockados** — sem API real | Não funciona em produção |
| 7 | **Sem endpoint de relatórios** — botões de exportar não fazem nada | Funcionalidade falsa |
| 8 | **Sem analytics agregados** — gestor não vê dados reais | Perde propósito do modo manager |
| 9 | **Sem validação de rate-limit** na API de chat | Risco de abuso |
| 10 | **Sem tratamento de erro consistente** — alguns server functions têm try/catch, outros não | Experiência quebrada |

---

## 🗺️ Plano de Implementação — 7 Fases

---

## 🔷 Fase 1 — Migrations SQL + RLS Policies

### 1.1 Criar migration `002_profiles.sql`
```sql
CREATE TABLE IF NOT EXISTS profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT,
  display_name  TEXT,
  role          TEXT NOT NULL DEFAULT 'companion' CHECK (role IN ('companion','manager','dev')),
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Usuário pode ler/editAR próprio perfil
CREATE POLICY "users_read_own" ON profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "users_insert_own" ON profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "users_update_own" ON profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Manager pode ler perfis da empresa (futuro: filtrar por company_id)
CREATE POLICY "manager_read_profiles" ON profiles FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'manager');
```

### 1.2 Criar migration `003_checkins.sql`
```sql
CREATE TABLE IF NOT EXISTS checkins (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sleep_hours   REAL NOT NULL,
  sleep_label   TEXT NOT NULL DEFAULT '',
  water_ml      INT NOT NULL DEFAULT 0,
  mood          TEXT NOT NULL DEFAULT '',
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_checkins_user_date ON checkins(user_id, created_at DESC);
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "checkins_own" ON checkins FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
```

### 1.3 Criar migration `004_chat_messages.sql`
```sql
CREATE TABLE IF NOT EXISTS chat_messages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_type     TEXT NOT NULL CHECK (from_type IN ('user','ai')),
  text          TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_chat_user ON chat_messages(user_id, created_at ASC);
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chat_own" ON chat_messages FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "chat_insert_own" ON chat_messages FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
```

### 1.4 Criar migration `005_diary_entries.sql`
```sql
CREATE TABLE IF NOT EXISTS diary_entries (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content       TEXT NOT NULL DEFAULT '',
  mood          TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_diary_user ON diary_entries(user_id, created_at DESC);
ALTER TABLE diary_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "diary_own" ON diary_entries FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
```

### 1.5 Criar migration `006_habits.sql`
```sql
CREATE TABLE IF NOT EXISTS habits (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  water_ml      INT NOT NULL DEFAULT 0,
  sleep_quality INT NOT NULL DEFAULT 50,
  updated_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE habits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "habits_own" ON habits FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
```

### 1.6 Atualizar migration `001_llm_config.sql` se necessário
- Nome da coluna: manter `from` ou usar `from_type`? Verificar `chat.server.ts` linha 32: `.insert({ user_id: user.id, text: data.text, from: "user" })` — verificar se `from` é palavra reservada no PostgreSQL. Sugiro renomear para `sender`.
- **Ação:** Verificar e corrigir nome da coluna `from` → `sender` em `chat_messages` e nas server functions correspondentes.

---

## 🔷 Fase 2 — Correção das Server Functions Existentes

### 2.1 `chat.server.ts`
- [ ] Renomear coluna `from` → `sender` (se necessário)
- [ ] Adicionar validação de tamanho máximo de texto (ex: 1000 caracteres)
- [ ] Adicionar rate-limit básico (ex: no max 30 mensagens por minuto por usuário)

### 2.2 `chat-ai.server.ts`
- [ ] Adicionar timeout no fetch para OpenRouter (15s)
- [ ] Melhorar tratamento de erro (diferenciar erro de API vs erro de rede)
- [ ] Limitar histórico a 10 mensagens (já feito) — verificar eficácia
- [ ] Sanitizar input do usuário antes de enviar ao LLM

### 2.3 `checkin.server.ts`
- [ ] Adicionar validação de check-in duplicado no mesmo dia (apenas 1 por dia)
- [ ] Retornar mensagem amigável se já fez check-in hoje

### 2.4 `habitos.server.ts`
- [ ] Adicionar `updateSleepQuality` server function
- [ ] Criar `updateHabits` unificada (água + sono)

### 2.5 `diario.server.ts`
- [ ] Adicionar `saveDiaryEntry` server function
- [ ] Adicionar `deleteDiaryEntry` server function

### 2.6 `auth.server.ts`
- [ ] Adicionar server function para criar `profiles` automaticamente no signup
- [ ] Adicionar `updateProfile` server function

---

## 🔷 Fase 3 — Conexão Frontend ↔ Backend (Funcionalidades Carentes)

### 3.1 Persistir água e sono (`/habitos`)
- [ ] No componente `HabitosPage.tsx`, carregar dados atuais do banco via `getHabits`
- [ ] Chamar `updateWater` ao alterar água
- [ ] Chamar `updateSleepQuality` (nova) ao alterar sono
- [ ] Debounce nas chamadas para evitar sobrecarga

### 3.2 Salvar entradas do diário (`/diario`)
- [ ] Adicionar botão "Nova entrada" na página de diário
- [ ] Modal ou bottom sheet para escrever + selecionar humor
- [ ] Chamar `saveDiaryEntry` ao salvar
- [ ] Listar entradas reais (não apenas mock data)

### 3.3 Perfil (`/perfil`)
- [ ] Carregar `display_name` e `avatar_url` da tabela `profiles`
- [ ] Permitir editar nome de exibição
- [ ] Exibir role atual

---

## 🔷 Fase 4 — API do Modo Manager (Dados Reais)

### 4.1 Dashboard (`/manager/`)
- [ ] Criar `getManagerDashboard` server function
- [ ] Retornar:
  ```ts
  {
    totalUsers: number;
    checkinsToday: number;
    weeklyAdhesion: number; // percentual
    activeAlerts: number;
    teams: TeamMetrics[]; // dados agregados por equipe
  }
  ```
- [ ] Calcular métricas no servidor via SQL agregado

### 4.2 Equipes (`/manager/equipes`)
- [ ] Criar `getTeamsOverview` server function
- [ ] Listar departamentos com métricas reais (não mock)
- [ ] Status dinâmico baseado em tendências

### 4.3 Relatórios (`/manager/relatorios`)
- [ ] Criar `getReportData` server function
- [ ] Suporte a filtro por período (7d, 30d, 90d)
- [ ] Dados para: adesão, humor médio, horas de sono, hidratação
- [ ] Endpoint de exportação CSV

---

## 🔷 Fase 5 — Camada de Serviços (Service Layer)

### 5.1 Revisar `src/lib/services/` existentes
- [ ] `chat-service.ts` — já integrado, revisar erros
- [ ] `diario-service.ts` — adicionar cache/local state
- [ ] `habitos-service.ts` — adicionar sync bidirecional

### 5.2 Novos serviços
- [ ] `manager-service.ts` — consumir APIs do manager
- [ ] `profile-service.ts` — gerenciar perfil do usuário
- [ ] `analytics-service.ts` — dados para gráficos e insights

---

## 🔷 Fase 6 — Segurança e Performance

### 6.1 Rate Limiting
- [ ] Implementar rate-limit simples por userId nas server functions de chat
- [ ] Usar `import.meta.env` + variável em memória (ou tabela no Supabase)

### 6.2 Validação
- [ ] Revisar todos os `zod` schemas para limites realistas
- [ ] Sanitizar HTML das mensagens (anti-XSS)

### 6.3 RLS Review
- [ ] Garantir que TODAS as tabelas têm RLS ativado
- [ ] Testar policies com diferentes roles

### 6.4 Error Handling
- [ ] Padronizar retorno de erros em todas as server functions:
  ```ts
  { data: T | null; error: string | null }
  ```
- [ ] Logs estruturados no servidor

---

## 🔷 Fase 7 — Testes e Finalização

### 7.1 Testes manuais
- [ ] Fluxo completo: cadastro → check-in → chat → diário → hábitos → respiro
- [ ] Modo manager: dashboard → equipes → relatórios
- [ ] Modo dev: painel LLM config

### 7.2 Build
- [ ] `npm run build` sem erros
- [ ] `npm run lint` sem erros

### 7.3 Documentação
- [ ] Atualizar `README.md` com instruções de setup do backend
- [ ] Listar variáveis de ambiente necessárias

---

## 📦 Resumo de Arquivos a Criar/Modificar

### 🆕 Novos Arquivos
| Arquivo | Descrição |
|---------|-----------|
| `supabase/migrations/002_profiles.sql` | Tabela profiles + RLS |
| `supabase/migrations/003_checkins.sql` | Tabela checkins + RLS |
| `supabase/migrations/004_chat_messages.sql` | Tabela chat_messages + RLS |
| `supabase/migrations/005_diary_entries.sql` | Tabela diary_entries + RLS |
| `supabase/migrations/006_habits.sql` | Tabela habits + RLS |

### 🔧 Arquivos a Modificar (Já Existem)
| Arquivo | O que fazer |
|---------|-------------|
| `src/lib/api/chat.server.ts` | Renomear `from` → `sender`, adicionar rate-limit |
| `src/lib/api/chat-ai.server.ts` | Melhorar error handling, timeout |
| `src/lib/api/checkin.server.ts` | Validar check-in único por dia |
| `src/lib/api/diario.server.ts` | Adicionar `saveDiaryEntry`, `deleteDiaryEntry` |
| `src/lib/api/habitos.server.ts` | Adicionar `updateSleepQuality`, `updateHabits` |
| `src/lib/api/auth.server.ts` | Adicionar criação automática de profile |
| `src/routes/index.tsx` | Conectar persistência de chat |
| `src/routes/habitos.tsx` | Conectar persistência de água/sono |
| `src/routes/diario.tsx` | Conectar escrita de diário |
| `src/routes/perfil.tsx` | Conectar dados reais de profile |
| `src/lib/services/chat-service.ts` | Revisar error handling |
| `src/lib/services/diario-service.ts` | Adicionar escrita |
| `src/lib/services/habitos-service.ts` | Adicionar sync bidirecional |

### 🆕 + 🔧 Manager (Novas Server Functions)
| Arquivo | Descrição |
|---------|-----------|
| `src/lib/api/manager.server.ts` | Dashboard, equipes, relatórios |
| `src/lib/services/manager-service.ts` | Service layer do manager |

---

## 🧭 Ordem de Execução Sugerida

```
Fase 1 ─► Fase 2 ─► Fase 3 ─► Fase 4 ─► Fase 5 ─► Fase 6 ─► Fase 7
(Migrations) (Correções) (Conexões) (Manager) (Services) (Segurança) (Testes)
```

Cada fase é autossuficiente e pode ser testada independentemente.

---

## ⚠️ Riscos e Observações

1. **`from` é palavra reservada no PostgreSQL** — a coluna `from` em `chat_messages` pode causar erro. Verificar e renomear para `sender` se necessário.
2. **OpenRouter API Key exposta** no `.env` — garantir que `SUPABASE_SERVICE_ROLE_KEY` e `OPENROUTER_API_KEY` estão seguras no deploy.
3. **Cliente Supabase admin** (`src/lib/supabase/admin.ts`) usa `SUPABASE_SERVICE_ROLE_KEY` — usar com parcimônia, apenas onde estritamente necessário.
4. **TanStack Start SSR** — server functions rodam em ambiente Node/Cloudflare Workers. Garantir compatibilidade.

---

> **Próximo passo:** Após sua aprovação deste plano, executaremos Fase 1 → Fase 2 → ... sequencialmente, validando cada fase com `npm run build` e `npm run lint` antes de prosseguir.
