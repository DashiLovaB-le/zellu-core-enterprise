# FRD — Functional Requirement Document

> **Projeto:** Mundo Mental Care  
> **Versão:** 1.2  
> **Data:** 2026-08-26

---

## 1. Sumário

Este documento traduz os requisitos do PRD em comportamentos exatos que o código deve implementar. Cada seção descreve a função, inputs, outputs, regras de negócio e validações esperadas.

---

## 2. Autenticação e Autorização

### 2.1 Cadastro (somente convite)

**Não há self-signup com escolha de role.** O colaborador ou gestor entra por `/aceitar-convite?token=`.

#### Criação (RH — `/manager/convites`)

1. Manager/admin informa e-mail + role (`companion` | `manager`)
2. `createInvite` valida seats (`company_has_available_seat`: ativos + pendentes < seats)
3. Gera token (64 hex), validade **7 dias**, grava em `invites`
4. Se `RESEND_API_KEY` existir → e-mail com botão para `/aceitar-convite?token=...`
5. Sem Resend → convite criado; UI exibe o link para copiar
6. `cancelInvite` remove convite **não aceito** (libera seat na contagem); aceitos não cancelam

#### Aceite

**Entrada:**
```typescript
{
  token: string
  password: string  // mínimo 8 caracteres
  displayName?: string
}
```

**Comportamento:**
1. `getInviteByToken` valida token, prazo e se já foi usado (RPC `get_invite_public`)
2. `acceptInvite` cria o usuário no Auth, vincula `profiles.company_id` / `team_id` / `role` do convite
3. Trigger `handle_new_user()` cria o profile com role default `companion`; o aceite sobrescreve role/empresa do convite no servidor
4. Marca `accepted_at` e incrementa `licenses.seats_used`
5. Login automático; `user_metadata.role` **não autoriza nada**; a fonte é `profiles.role`

**Saída:**
- Companion → `/onboarding` (consentimento LGPD + nome/fuso)
- Manager → `/manager`

**Regras de Negócio:**
- Signup sem convite válido falha
- Roles no convite: `companion` | `manager` (admin/dev não se auto-atribuem)
- Licenças: novo convite bloqueado se não houver seat disponível
- Link cancelado ou expirado não aceita conta

### 2.2 Login

**UI:** `/login` — card clay centralizado (mascote + marca + formulário); sem cadastro aberto; link “Recebi um convite” → `/aceitar-convite`.

**Entrada:**
```typescript
{
  email: string
  password: string
}
```

**Comportamento:**
1. Validação dos campos
2. `signInWithPassword()` no cliente (`auth-context.tsx`)
3. Role lida de `profiles` via `getUserRole` (JWT validado com `supabase.auth.getUser`)
4. **Débito:** `accessToken` ainda vai no body das server functions; cookie httpOnly é o próximo passo (`docs/SESSAO-DEBITO.md`)
5. Redirect:
   - `admin` → `/admin`
   - `manager` → `/manager/rh-dashboard`
   - `companion` → `/` (ou `/onboarding` se consentimento/versão desatualizados)
6. Companion com termo antigo (≠ 3.0) é recencaminhado ao onboarding

**Saída:**
- Sucesso: redirect + sessão persistente
- Erro: alerta inline no formulário

### 2.3 Proteção de Rotas

**Comportamento:**
1. Hook `useRequireAuth()` verifica se há sessão ativa
2. Se não autenticado → redirect para `/login`
3. Se autenticado mas role inadequada → redirect para rota do role
4. Shells (`MobileShell`, `DesktopShell`, `ManagerShell`, `AdminShell`) verificam role antes de renderizar navegação

**Regras de Acesso:**
| Role | Rotas Permitidas |
|---|---|
| `companion` | `/`, `/chat`, `/checkin`, `/diario`, `/meu-bem-estar`, `/plano-de-cuidado`, `/respiro`, `/perfil`, `/onboarding`, `/privacidade` |
| `manager` | `/manager/*`, `/privacidade` |
| `admin` | `/admin/*` |
| `dev` | Todas + `/dashitecnology/*` |

### 2.4 Logout

**Comportamento:**
1. Chama `supabase.auth.signOut()`
2. Limpa estado do `AuthProvider`
3. Remove cookies de sessão
4. Redirect para `/login`

---

## 3. Check-in Matinal

### 3.1 Fluxo

**Etapas:** sono → água → humor

**Schema de Validação (Zod):**
```typescript
{
  sleepHours: number      // 0–24
  sleepLabel: string
  waterMl: number         // 0–10000
  mood: string            // valor canônico de MAIN_MOODS ou EXTRA_MOODS
}
```

### 3.2 Regras de Negócio

| Regra | Descrição |
|---|---|
| **Anti-duplicata** | Um único check-in por usuário por dia; o segundo no mesmo dia **retorna erro** (não atualiza) |
| **Obrigatoriedade** | Todos os campos são obrigatórios |
| **Humor** | Deve ser um valor válido de `src/data/moods.ts` |
| **Persistência** | Tabela `checkins` no Supabase |
| **Contexto** | Check-in alimenta o contexto do chat IA |

### 3.3 Server Function

```typescript
export async function saveCheckin(data: CheckinSchema) {
  // 1. Exigir consentimento
  // 2. Se já existe check-in hoje, retornar erro
  // 3. Senão, inserir
}
```

---

## 4. Chat com IA

### 4.1 Envio de Mensagem

**Entrada:**
```typescript
{
  message: string  // 1–2000 caracteres
}
```

**Comportamento:**
1. Exige consentimento LGPD válido (`requireCompanionConsent`)
2. Rate limit: 20 mensagens/hora
3. Detector de crise no servidor; se disparar, responde CVV 188 e **não** chama o LLM
4. Ignora `history` e `context` enviados pelo cliente; lê últimos 10 turnos e check-in no banco
5. Prompt de sistema **sem nome/e-mail** (sono, água, humor, preventiva)
6. Cloud IA só com `privacy_ai_opt_in` + `OPENROUTER_API_KEY`; senão fallback local
7. OpenRouter: `provider.data_collection = "deny"` e `zdr: true`
8. Timeout: 15s no modelo principal, 10s nos fallbacks
9. Persiste user + assistant em `chat_messages`

**Saída:** `{ reply, suggestion, crisis, error? }`

### 4.2 Regras de Negócio

| Regra | Descrição |
|---|---|
| **Histórico** | Últimos 10 turnos do banco (cliente não injeta contexto) |
| **Identificadores** | Nome e e-mail **não** vão para o LLM |
| **Timeout** | 15s / 10s (fallback de modelo) |
| **Opt-in IA** | Sem flag, só respostas locais |
| **Crise** | Prioridade sobre o LLM; CVV 188 + SAMU 192 |
| **Markdown** | Respostas via `ChatMarkdown` (react-markdown) |

### 4.3 System Prompt Padrão

```
Você é o assistente de bem-estar emocional do Mundo Mental Care.
Seu tom é corporativo-acolhedor: claro, respeitoso, sem infantilizar.
Você NÃO substitui psicólogos ou terapeutas.
Quando detectar sinais de crise, sugira buscar ajuda profissional.
Contexto do usuário: {nome}, humor atual: {humor}, período: {período}.
```

---

## 5. Dashboard Emocional

### 5.1 Métricas Exibidas

| Métrica | Fonte | Cálculo |
|---|---|---|
| Dias rastreados | `checkins` | COUNT DISTINCT dias com check-in |
| Humor predominante | `checkins.mood` | Moda dos últimos 30 dias |
| Média de sono | `checkins.sleep_hours` | AVG últimos 30 dias |
| Tendência humor | `checkins.mood` + timestamp | Regressão linear simples |

### 5.2 Gráficos

| Gráfico | Tipo | Dados |
|---|---|---|
| Humor ao longo do tempo | Linha | Últimos 30 dias |
| Comparativo semanal | Barras agrupadas | Semana atual vs. anterior |
| Tendência sono/humor 30d | Linhas múltiplas | Sono + humor normalizado |

### 5.3 Server Function

```typescript
// src/lib/api/dashboard.server.ts
export async function getDashboardData(userId: string) {
  // 1. Buscar checkins últimos 30 dias
  // 2. Calcular métricas
  // 3. Gerar insight via IA (ou fallback)
  // 4. Verificar alertas preventivos
  // 5. Retornar dados consolidados
}
```

---

## 6. Timeline/Diário

### 6.1 Estrutura da Timeline

```typescript
type TimelineItem = {
  id: string
  type: 'checkin' | 'diary' | 'chat' | 'habit'
  timestamp: string
  data: {
    // Para checkin: { mood, sleep_hours, water_ml }
    // Para diary: { content, mood }
    // Para chat: { text, from }
    // Para habit: { water_ml, sleep_quality }
  }
}
```

### 6.2 Entrada de Diário

**Schema:**
```typescript
{
  content: string   // 1–5000 caracteres
  mood?: string     // opcional
}
```

**Regras:**
- Conteúdo é obrigatório
- Mood é opcional (se não informado, herda do último check-in)
- Entrada aparece na timeline com tag "Diário"

---

## 7. Meu Bem-estar

### 7.1 Campos

| Campo | Tipo | Validação | Origem Padrão |
|---|---|---|---|
| Água (ml) | number | 0–5000 | Check-in |
| Sono (horas) | number | 0–12 | Check-in |
| Humor | string | Moods válidos | Check-in |
| Movimento | string | 'Nenhum' \| 'Leve' \| 'Moderado' \| 'Intenso' | Manual |
| Energia | string | 'Baixa' \| 'Média' \| 'Alta' | Manual |
| Refeições | number | 0–6 | Manual |

### 7.2 Comportamento

1. Ao carregar, pré-popula campos do último check-in do dia
2. Usuário pode editar livremente
3. Salvamento atualiza registros de bem-estar do dia
4. Dados alimentam dashboard e insights

---

## 8. Plano de Cuidado

### 8.1 Estrutura

```typescript
type WellnessPlan = {
  id: string
  user_id: string
  goal: string              // objetivo definido pelo usuário
  checklist: ChecklistItem[]
  streak: number
  created_at: string
  updated_at: string
}

type ChecklistItem = {
  id: string
  label: string
  completed: boolean
  completed_at?: string
}
```

### 8.2 Checklist Padrão

| Item | Descrição |
|---|---|
| Água | Beber pelo menos 2L de água |
| Caminhada | Caminhar por pelo menos 15 minutos |
| Respirar | Fazer 5 minutos de respiração |
| Conversar | Conversar com alguém querido |

### 8.3 Streak

**Cálculo:**
1. Para cada dia, verifica se o usuário:
   - Fez check-in (qualquer humor registrado)
   - Completou pelo menos 1 item do checklist
2. Se ambos verdadeiros, dia é contabilizado na streak
3. Streak é sequência de dias consecutivos

**Marcos:**
| Dias | Conquista |
|---|---|
| 3 | Iniciante Consistente |
| 7 | Uma Semana Forte |
| 14 | Quinze Dias de Cuidado |
| 21 | Três Semanas de Dedicação |
| 30 | Um Mês Completo |
| 60 | Dois Meses de Constância |
| 90 | Trimestre de Transformação |

---

## 9. Espaço do Respiro

### 9.1 Ciclo de Respiração

**Configuração padrão:**
```typescript
{
  inhale: 4,    // segundos inspirando
  hold: 4,      // segundos segurando
  exhale: 6,    // segundos expirando
  cycles: 5     // número de ciclos
}
```

### 9.2 Sons Ambiente

| Som | Arquivo | Loop |
|---|---|---|
| Chuva | `rain.mp3` | Sim |
| Floresta | `forest.mp3` | Sim |
| Fogueira | `fire.mp3` | Sim |
| Ondas | `waves.mp3` | Sim |

### 9.3 Comportamento

1. Usuário inicia o exercício
2. Animação visual indica fase atual (inspirar/segurar/expirar)
3. Timer regressivo visível
4. Sons ambiente tocam em loop (se selecionados)
5. Ao finalizar, registra duração no perfil

---

## 10. IA Preventiva

### 10.1 Regras de Detecção

| Tipo | Condição | Severidade |
|---|---|---|
| `burnout-risk` | humor negativo ≥ 40% nos últimos 7 dias E sono < 6h | high |
| `sleep-crisis` | sono < 5h por 3+ dias consecutivos | high |
| `mood-crisis` | humor 'Péssimo' ou 'Triste' por 3+ dias | medium |
| `disengagement` | nenhum check-in nos últimos 5 dias | medium |
| `hydration-risk` | água < 1000ml por 3+ dias | low |
| `low-energy` | energia 'Baixa' por 3+ dias | low |

### 10.2 Formato do Alerta

```typescript
type PreventiveAlert = {
  id: string
  user_id: string
  type: AlertType
  severity: 'low' | 'medium' | 'high'
  message: string         // mensagem empática e acolhedora
  suggestion: string      // ação sugerida e prática
  dismissed: boolean
  created_at: string
}
```

### 10.3 Persistência

- Tabela: `preventive_notifications`
- Alertas são gerados no server-side
- Cache em memória de 30 minutos para evitar reprocessamento
- Alertas dismissados não são recriados (flag `dismissed`)

---

## 11. Gamificação (Streak)

### 11.1 Cálculo

```typescript
// streak-system.server.ts
export async function calculateStreak(userId: string): Promise<{
  current: number
  longest: number
  milestones: Milestone[]
}> {
  // 1. Buscar checkins e checklist dos últimos 90 dias
  // 2. Para cada dia, verificar: check-in existe? ≥ 1 checklist completado?
  // 3. Calcular sequência consecutiva mais longa
  // 4. Identificar marcos atingidos
  // 5. Retornar dados
}
```

### 11.2 Marcos

```typescript
const MILESTONES = [
  { days: 3,  label: 'Iniciante Consistente' },
  { days: 7,  label: 'Uma Semana Forte' },
  { days: 14, label: 'Quinze Dias de Cuidado' },
  { days: 21, label: 'Três Semanas de Dedicação' },
  { days: 30, label: 'Um Mês Completo' },
  { days: 60, label: 'Dois Meses de Constância' },
  { days: 90, label: 'Trimestre de Transformação' },
]
```

### 11.3 UI

- `MilestoneBanner`: exibido no Dashboard e Plano de Cuidado
- Aparece quando novo marco é atingido (não todos os dias)
- Tom: corporativo-acolhedor, sem infantilizar

---

## 12. Portal Administrativo

### 12.1 Gestão de Empresas

**Schema:**
```typescript
{
  name: string           // 2–200 caracteres
  slug?: string          // único, lowercase
  document?: string      // CNPJ (XX.XXX.XXX/XXXX-XX)
  industry?: string      // setor de atuação
  contact_email?: string
  contact_phone?: string
  status: 'active' | 'inactive' | 'trial' | 'churned'
  seats: number          // ≥ 0
  notes?: string
}
```

**Operações:**
- CRUD completo via `admin.server.ts`
- RLS: apenas `admin` e `dev` têm acesso

### 12.2 Licenças

**Schema:**
```typescript
{
  company_id: string
  plan_name: string      // 'standard' | 'enterprise' | 'pilot'
  seats: number
  seats_used: number     // calculado automaticamente
  status: 'active' | 'expired' | 'suspended' | 'trial'
  starts_at: string      // ISO date
  ends_at?: string       // ISO date
}
```

**Regras:**
- `seats_used` não pode exceder `seats`
- Status `expired` é calculado quando `ends_at < now()`

### 12.3 Contratos

**Schema:**
```typescript
{
  company_id: string
  title: string
  contract_type: 'saas' | 'pilot' | 'enterprise' | 'renewal'
  value_brl: number      // ≥ 0
  status: 'draft' | 'active' | 'expired' | 'cancelled'
  starts_at?: string
  ends_at?: string
  notes?: string
}
```

### 12.4 Alertas Configuráveis

**Schema:**
```typescript
{
  company_id?: string     // NULL = configuração global
  name: string
  mood_negative_warn: number     // 0–100
  mood_negative_critical: number // 0–100
  sleep_hours_min: number        // ≥ 0
  water_ml_min: number           // ≥ 0
  adhesion_min_pct: number       // 0–100
  enabled: boolean
}
```

**Seed:** Configuração global padrão é criada na migration `006`.

---

## 13. Dev Tools

### 13.1 LLM Config

**Operações:**
- Leitura: busca registro com `id = 1` na tabela `llm_config`
- Atualização: valida e salva nova configuração
- Reset: restaura valores padrão do schema
- Teste: envia mensagem teste para OpenRouter e retorna resposta

**Campos:**
```typescript
{
  model: string          // ex: 'openai/gpt-4o-mini'
  temperature: number    // 0–2
  max_tokens: number     // 100–4000
  system_prompt: string  // 0–5000 caracteres
  api_key: string        // mascarada na UI; valor real só em OPENROUTER_API_KEY
}
```

### 13.2 System Logs

**Tabela:** `system_logs`

```typescript
type SystemLog = {
  id: string
  level: 'info' | 'warn' | 'error'
  source: string         // nome do módulo
  message: string
  metadata?: json
  created_at: string
}
```

**Operações:**
- Listagem paginada com filtros (level, source, período)
- Busca por mensagem
- Auto-atualização a cada 30 segundos

---

## 14. Validações Transversais

### 14.1 Validação de Formulários

- Todos os formulários usam `react-hook-form` + `@hookform/resolvers` + Zod
- Erros são exibidos inline abaixo de cada campo
- Submissão é bloqueada enquanto houver erros de validação

### 14.2 Tratamento de Erros

| Tipo | Comportamento |
|---|---|
| Validação (Zod) | Toast de erro com mensagem descritiva |
| Autenticação | Redirect para `/login` |
| Autorização | Redirect para rota do role |
| Rede | Toast "Erro de conexão; tente novamente" |
| Server error | Toast "Erro interno; equipe notificada" |

### 14.3 Loading States

- Skeletons em carregamento inicial de dados
- Spinner inline em botões de submissão
- Typing indicator no chat

---

## 15. Diagrama de Estados (Check-in)

```
[Sem check-in hoje]
       │
       ▼
[Etapa 1: Sono] ──→ [Etapa 2: Água] ──→ [Etapa 3: Humor]
       │                                        │
       │                                        ▼
       │                              [Check-in Salvo]
       │                                        │
       │                                        ▼
       │                              [Alimenta Dashboard / Chat / Insights]
       │
       ▼
[Já existe check-in hoje]
       │
       ▼
[Bloqueado até o dia seguinte — não há override]
```
