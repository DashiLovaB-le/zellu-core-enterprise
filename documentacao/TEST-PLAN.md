# Plano de Testes — Mundo Mental Care

> **Projeto:** Mundo Mental Care  
> **Versão:** 1.1  
> **Data:** 2026-08-18  
> **Ferramentas:** Vitest (unitários P0 em CI). Playwright E2E — planejado, ainda não está no `package.json`.

---

## 1. Escopo dos Testes

### 1.1 O que será testado
| Tipo | Escopo |
|---|---|
| **Unitários** | Funções puras, validações Zod, transformações de dados |
| **Integração** | Server Functions com Supabase, fluxos de autenticação |
| **E2E** | Fluxos críticos (convite → onboarding → check-in → chat → dashboard RH) |
| **Regressão** | Funcionalidades existentes após novas implementações |

### 1.2 O que NÃO será testado
| Item | Motivo |
|---|---|
| Supabase Auth interno | Serviço de terceiros |
| OpenRouter API | Serviço externo; testar com mocks |
| UI de terceiros (shadcn/ui) | Já testado upstream |
| Infraestrutura Supabase | Gerenciada pelo Supabase |

---

## 2. Estratégia de Testes

### 2.1 Pirâmide de Testes

```
        ┌─────────┐
        │   E2E   │  10% (fluxos críticos)
        ├─────────┤
        │Integração│  30% (server functions + DB)
        ├─────────┤
        │  Unit   │  60% (funções puras, validações)
        └─────────┘
```

### 2.2 Cobertura Alvo

| Métrica | Meta |
|---|---|
| Cobertura de código | ≥ 70% |
| Cobertura de branches | ≥ 60% |
| Cobertura de funções | ≥ 80% |

### 2.3 Execução

| Contexto | Comando | Frequência |
|---|---|---|
| Desenvolvimento | `vitest` (watch mode) | Contínuo |
| Pre-commit | `vitest run` | Cada commit |
| CI/CD | `npx tsc --noEmit && npm run lint && npm test` | Cada PR/push (`.github/workflows/ci.yml`) |
| E2E | Playwright | Ainda não no pipeline |

---

## 3. Testes Unitários

### 3.1 Validações Zod

| Arquivo | Testes |
|---|---|
| Check-in schema | Campos obrigatórios, ranges (sono 0–12, água 0–5000), mood válido |
| Chat schema | Mensagem 1–2000 chars, não vazio |
| Diary schema | Conteúdo 1–5000 chars, mood opcional |
| Wellness schema | Ranges de movement/energy, meals 0–6 |
| Company schema | Nome 2–200, seats ≥ 0, status válido |
| License schema | seats ≥ 0, datas válidas |

**Exemplo de teste:**
```typescript
describe('CheckinSchema', () => {
  it('deve aceitar dados válidos', () => {
    const result = checkinSchema.safeParse({
      sleep_hours: 7.5,
      sleep_label: 'Bom',
      water_ml: 2000,
      mood: 'Feliz'
    })
    expect(result.success).toBe(true)
  })

  it('deve rejeitar sono fora do range', () => {
    const result = checkinSchema.safeParse({
      sleep_hours: 15,
      sleep_label: 'Bom',
      water_ml: 2000,
      mood: 'Feliz'
    })
    expect(result.success).toBe(false)
  })
})
```

---

### 3.2 Funções de Transformação

| Arquivo | Testes |
|---|---|
| `dashboard-service.ts` | Cálculo de métricas, formatação de dados |
| `streak-service.ts` | Cálculo de streak, detecção de marcos |
| `insights-ai.server.ts` | Geração de insights, fallback local |
| `preventiva-ai.server.ts` | Detecção de alertas, regras de severidade |
| `chat-service.ts` | Montagem de contexto, formatação de histórico |

**Exemplo de teste:**
```typescript
describe('calculateStreak', () => {
  it('deve retornar 0 para sem check-ins', async () => {
    const result = await calculateStreak('user-without-checkins')
    expect(result.current).toBe(0)
  })

  it('deve calcular streak de 7 dias consecutivos', async () => {
    const result = await calculateStreak('user-with-7-day-streak')
    expect(result.current).toBe(7)
  })

  it('deve identificar marcos atingidos', async () => {
    const result = await calculateStreak('user-with-30-day-streak')
    expect(result.milestones.filter(m => m.achieved)).toHaveLength(4)
    // 3, 7, 14, 21, 30
  })
})
```

---

### 3.3 Utilitários

| Arquivo | Testes |
|---|---|
| `utils.ts` | `cn()`, formatação de datas, helpers |
| `auth-token.ts` | Extração de userId/email do JWT |
| `moods.ts` | Validação de humores, MAIN_MOODS, scores |
| `tenant.ts` | Isolamento `company_id`, k-anonimato |
| `chat-guard.ts` | History/context do cliente ignorados |
| `crisis.ts` | Detector + CVV |
| `lgpd.ts` / `privacy.ts` | Consentimento v3.0, sanitização de logs |

---

## 4. Testes de Integração

### 4.1 Server Functions + Supabase

| Função | Cenário |
|---|---|
| `saveCheckin` | Inserir novo; segundo no mesmo dia falha |
| `sendChatMessage` | Salvar mensagem + resposta; contexto correto |
| `saveDiaryEntry` | Inserir entrada; mood herdado do check-in |
| `saveWellness` | Salvar bem-estar consolidado |
| `getWellnessPlan` | Criar/buscar plano; toggle checklist |
| `detectPreventiveAlerts` | Gerar alertas; não duplicar |

**Setup:**
- Usar banco de testes isolado (Supabase project de dev)
- Seed com dados de teste antes de cada suite
- Cleanup após cada teste

**Exemplo de teste:**
```typescript
describe('saveCheckin', () => {
  it('deve inserir check-in para usuário novo hoje', async () => {
    const result = await saveCheckin({
      sleep_hours: 7,
      sleep_label: 'Bom',
      water_ml: 2000,
      mood: 'Feliz'
    })
    expect(result.success).toBe(true)
    expect(result.checkin).toBeDefined()
  })

  it('deve recusar segundo check-in no mesmo dia', async () => {
    await saveCheckin({ sleepHours: 6, ... })
    const result = await saveCheckin({ sleepHours: 8, ... })
    expect(result.error).toBeTruthy()
  })
})
```

---

### 4.2 Autenticação

| Cenário | Teste |
|---|---|
| Cadastro com convite válido | Cria conta + profile com role e empresa do convite |
| Cadastro sem convite | Falha |
| Login com credenciais válidas | Retorna sessão; role de `profiles` |
| Login com senha incorreta | Erro do Auth |
| Acesso sem sessão | `{ error: "Unauthorized" }` |
| Manager empresa A lê empresa B | Vazio / unauthorized (RPC + company_id) |

---

### 4.3 OpenRouter (Mock)

| Cenário | Mock | Teste |
|---|---|---|
| Resposta válida | Mock de resposta GPT | Retorna response + suggestions |
| API indisponível | Mock de erro 500 | Usa fallback local |
| Timeout | Mock de timeout (30s) | Retorna erro amigável |

---

## 5. Testes E2E (Playwright)

### 5.1 Fluxos Críticos

#### Fluxo 1: Convite + Check-in
```
1. Acessar /aceitar-convite?token=...
2. Definir senha (≥ 8)
3. Login
4. Onboarding: maioridade + termo 3.0 + opt-ins
5. Nome/fuso
6. Check-in: sono, água, humor
7. Segundo check-in no mesmo dia deve falhar
```

#### Fluxo 2: Chat com IA
```
1. Login como Companion
2. Acessar /chat
3. Digitar "Como você está?"
4. Enviar mensagem
5. Verificar typing indicator
6. Verificar resposta da IA em Markdown
7. Verificar 3 sugestões pós-resposta
8. Verificar mensagem salva no histórico
```

#### Fluxo 3: Dashboard RH
```
1. Login como Manager
2. Acessar /manager
3. Verificar KPIs carregados
4. Verificar gráficos renderizados
5. Acessar /manager/equipes
6. Verificar lista de equipes
7. Acessar /manager/relatorios
8. Exportar CSV
9. Verificar download
```

#### Fluxo 4: Portal Admin
```
1. Login como Admin
2. Acessar /admin
3. Verificar KPIs globais
4. Acessar /admin/empresas
5. Criar nova empresa
6. Verificar empresa na lista
7. Editar empresa
8. Criar licença vinculada
9. Verificar status
```

#### Fluxo 5: Plano de Cuidado + Streak
```
1. Login como Companion
2. Acessar /plano-de-cuidado
3. Definir objetivo "Dormir melhor"
4. Completar checklist (água, caminhada)
5. Verificar streak incrementada
6. Verificar progress visual
```

### 5.2 Navegação

| Cenário | Teste |
|---|---|
| Navegação mobile | Menu inferior funciona; rotas corretas |
| Navegação desktop | Sidebar funciona; colapsa em mobile |
| Proteção de rotas | Companion não acessa /manager; Manager não acessa /admin |
| Logout | Sessão encerrada; redirect para /login |

### 5.3 Responsividade

| Viewport | Teste |
|---|---|
| Mobile (375px) | Layout mobile; nav inferior; cards responsivos |
| Tablet (768px) | Layout intermediário |
| Desktop (1280px) | Layout desktop; sidebar |

### 5.3 Acessibilidade

| Critério | Teste |
|---|---|
| Navegação por teclado | Tab navigation funciona em todos os componentes |
| Contraste | Cores atendem WCAG AA (4.5:1 texto, 3:1 UI) |
| Labels | Todos os inputs têm labels acessíveis |
| aria-* | Componentes shadcn/ui já incluem atributos |

---

## 6. Testes de Segurança

### 6.1 Autenticação

| Teste | Esperado |
|---|---|
| Acesso a rota protegida sem login | Redirect /login |
| Enviar server function sem sessão | Erro AUTH_REQUIRED |
| Enviar com JWT expirado | Redirect /login |

### 6.2 Autorização

| Teste | Esperado |
|---|---|
| Companion acessa /manager | Acesso negado |
| Manager acessa /admin | Acesso negado |
| Companion tenta acessar dados de outro usuário | Acesso negado (RLS) |
| Admin acessa dados de qualquer empresa | Acesso permitido |

### 6.3 RLS (Row Level Security)

| Teste | Esperado |
|---|---|
| Companion lê checkins próprios | Permitido |
| Companion lê checkins de outro | Negado |
| Manager lê check-in individual via PostgREST | Negado (008) |
| Manager chama `get_rh_dashboard` da própria empresa | Agregados; k-anonimato |
| Manager lê diário/chat | Negado |
| Companion altera `profiles.role` | Bloqueado pelo trigger |

### 6.4 CSRF

| Teste | Esperado |
|---|---|
| Server function sem token CSRF | Erro 403 |
| Server function com token válido | Execução normal |

---

## 7. Testes de Performance

### 7.1 Métricas

| Métrica | Meta | Como testar |
|---|---|---|
| Tempo de carregamento inicial | < 3s | Lighthouse CI |
| First Contentful Paint | < 1.5s | Lighthouse CI |
| Largest Contentful Paint | < 2.5s | Lighthouse CI |
| Tempo de resposta API | < 2s | Medição server-side |
| Tamanho do bundle | < 500KB gzip | Vite bundle analyzer |

### 7.2 Carga

| Cenário | Teste |
|---|---|
| 100 usuários simultâneos | Supabase suporta? |
| 1000 check-ins/dia | Performance degrada? |
| Chat IA com 50 turnos | Latência aceitável? |

---

## 8. Testes de Regressão

### 8.1 Checklist Pré-Release

| # | Teste | Status |
|---|---|---|
| 1 | Login e aceite de convite | ⬜ |
| 2 | Check-in salva e aparece no dashboard | ⬜ |
| 3 | Chat IA responde com contexto | ⬜ |
| 4 | Timeline agrega dados corretamente | ⬜ |
| 5 | Dashboard mostra métricas corretas | ⬜ |
| 6 | Plano de cuidado salva progresso | ⬜ |
| 7 | Streak é calculada corretamente | ⬜ |
| 8 | Alertas preventivos são gerados | ⬜ |
| 9 | Dashboard RH mostra dados agregados | ⬜ |
| 10 | Admin pode gerenciar empresas | ⬜ |
| 11 | LLM Config salva e aplica | ⬜ |
| 12 | System Logs exibe registros | ⬜ |
| 13 | Navegação mobile funciona | ⬜ |
| 14 | Navegação desktop funciona | ⬜ |
| 15 | Tema claro/escuro funciona | ⬜ |
| 16 | Logout encerra sessão | ⬜ |

---

## 9. Dados de Teste

### 9.1 Usuários de Teste

| Email | Role | Senha | Uso |
|---|---|---|---|
| `companion@test.com` | companion | `test1234` | Testes de fluxo colaborador |
| `manager@test.com` | manager | `test1234` | Testes de fluxo RH |
| `admin@test.com` | admin | `test1234` | Testes de fluxo admin |
| `dev@test.com` | dev | `test1234` | Testes de dev tools |

### 9.2 Dados de Teste

```sql
-- Seed para testes
INSERT INTO checkins (user_id, sleep_hours, water_ml, mood, created_at)
VALUES 
  ('user-id', 7, 2000, 'feliz', now() - interval '1 day'),
  ('user-id', 6, 1500, 'triste', now() - interval '2 days'),
  ('user-id', 8, 2500, 'feliz', now() - interval '3 days');
```

---

## 10. Relatório de Testes

### 10.1 Formato

```
✅ Testes Unitários: 45/45 passaram
✅ Testes de Integração: 12/12 passaram
✅ Testes E2E: 5/5 passaram
⚠️ Cobertura: 72% (meta: 70%)

❌ Testes que falharam: 0
```

### 10.2 CI/CD

| Pipeline | Trigger | Comandos |
|---|---|---|
| PR | Push para PR | `tsc --noEmit`, `lint`, `npm test` |
| Main | Merge para main | o mesmo (Playwright ainda não) |

---

## 11. Bug Tracking

### 11.1 Classificação de Bugs

| Severidade | Descrição | Prazo de Correção |
|---|---|---|
| **Crítico** | Sistema inutilizável; perda de dados | 24h |
| **Alto** | Funcionalidade principal quebrada | 48h |
| **Médio** | Funcionalidade secundária com bug | 1 semana |
| **Baixo** | Cosmético; melhoria menor | Backlog |

### 11.2 Template de Bug

```markdown
**Título:** [Descrição curta]
**Severidade:** Crítico/Alto/Médio/Baixo
**Passos para reproduzir:**
1. ...
2. ...
**Comportamento esperado:** ...
**Comportamento atual:** ...
**Evidência:** Screenshot/video
**Ambiente:** Browser, OS, dispositivo
```

---

## 12. Aprovação

| Papel | Nome | Data |
|---|---|---|
| QA Lead | — | — |
| Tech Lead | — | — |
| Product Owner | — | — |
