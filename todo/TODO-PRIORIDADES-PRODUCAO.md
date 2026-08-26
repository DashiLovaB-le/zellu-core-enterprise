# TODO — Prioridades para produção

> Plano para tornar o Zēllu seguro e vendável a empresas reais.
> Complementa `TODO-Zellu.md` (Fases 0–16). **Bloqueia** `todo/ROADMAP-MOTOR-INTELIGENCIA-EMOCIONAL.md` até o Bloco 2 estar fechado.
>
> Status: **Implementado**
> Origem: análise de código (auth, manager, RLS, chat, RH)
> Última atualização: 2026-08-17

---

## Princípios

1. **Tenant first** — manager só vê a própria empresa; admin vê o globo.
2. **Role só no servidor** — o cliente não escolhe nem altera papel.
3. **RH nunca vê indivíduo** — só agregados; k-anonimato em times pequenos.
4. **Não diagnóstico** — crise encaminha para CVV / canal da empresa, não “trata”.
5. **Sem ML ainda** — o motor preditivo só começa com dados isolados por empresa.

---

## Bloco 1 — Isolamento B2B e modelo de acesso (P0)

O cadastro aberto + dashboard do RH lendo o banco inteiro impede qualquer piloto com cliente real.

- [x] **1.1** Remover self-signup com escolha de role
  - [x] 1.1.1 Tirar seletor Colaborador/RH de `src/routes/login.tsx`
  - [x] 1.1.2 `signUp` em `src/lib/auth-context.tsx` deixa de aceitar `role`; default `companion` só via convite
  - [x] 1.1.3 Remover `setRole` do contexto de auth (hoje grava `user_metadata.role` no cliente)
- [x] **1.2** Convites por empresa (substitui cadastro aberto)
  - [x] 1.2.1 Tabela `invites` (`company_id`, `team_id`, `email`, `role` ∈ companion|manager, `token`, `expires_at`, `accepted_at`)
  - [x] 1.2.2 Admin/manager cria convite; e-mail com link `/aceitar-convite?token=`
  - [x] 1.2.3 Aceite cria usuário, vincula `profiles.company_id` / `team_id` / `role`, consome o token
  - [x] 1.2.4 Signup sem convite válido retorna erro (exceto seed/dev)
- [x] **1.3** Isolar queries do manager pela empresa do usuário
  - [x] 1.3.1 `requireManagerRole` em `src/lib/api/manager.server.ts` passa a retornar `{ userId, companyId }`
  - [x] 1.3.2 `getManagerDashboard`, `getRhDashboard`, equipes e relatórios filtram por `company_id`
  - [x] 1.3.3 Parar de usar `createAdminClient()` no fluxo manager salvo jobs internos; preferir client com JWT + RLS
- [x] **1.4** Times reais no dashboard RH
  - [x] 1.4.1 Remover `TEAM_NAMES` + `assignTeam(userId)` (hash do UUID) em `manager.server.ts`
  - [x] 1.4.2 Agregar por `profiles.team_id` → `teams.name`
  - [x] 1.4.3 Usuários sem equipe entram em bucket “Sem equipe” (ou ficam de fora do gráfico, documentar)
- [x] **1.5** K-anonimato
  - [x] 1.5.1 Não exibir métricas de humor/sono/água se `memberCount < 5` (configurável)
  - [x] 1.5.2 Mesma regra em alertas por equipe (`src/lib/api/manager.server.ts`)
- [x] **1.6** RLS multi-tenant
  - [x] 1.6.1 Nova migration: policies de `profiles`, `checkins`, `habits`, `diary_entries`, `chat_messages` etc. por `company_id`
  - [x] 1.6.2 Manager lê só agregados / metadados da própria empresa — nunca texto de diário ou chat
  - [x] 1.6.3 Dropar `manager_read_profiles` baseada em `user_metadata.role` (`000_schema_inicial.sql`)
  - [x] 1.6.4 `profiles_update_own` **não** pode alterar `role`, `company_id`, `team_id`, `is_active`

**Critério de saída:** um manager da Empresa A não vê nenhum dado da Empresa B; equipes no RH batem com o cadastro admin.

---

## Bloco 2 — Segurança do auth, chat e LLM (P0)

- [x] **2.1** Autenticação de verdade nas server functions
  - [x] 2.1.1 Substituir `getUserIdFromAccessToken` (decode JWT sem assinatura) por `supabase.auth.getUser(accessToken)` — ou cookie httpOnly
  - [x] 2.1.2 Helper único `requireUser(accessToken)` usado em `src/lib/api/*.server.ts`
- [x] **2.2** Fechar `confirmUser`
  - [x] 2.2.1 Remover endpoint público em `src/lib/api/auth.server.ts` (hoje confirma qualquer UUID com service role)
  - [x] 2.2.2 Confirmação de e-mail via fluxo Supabase (magic link / SMTP) **ou** confirmação só no aceite de convite, autenticada
  - [x] 2.2.3 Tirar chamada `confirmUser` de `signUp` em `auth-context.tsx`
- [x] **2.3** Role imutável no cliente
  - [x] 2.3.1 Role lida só de `profiles.role` (já em `getUserRole`)
  - [x] 2.3.2 Trigger/policy: `user_metadata.role` não autoriza nada; JWT metadata deixa de ser fonte de RLS
  - [x] 2.3.3 Senha mínima ≥ 8 (hoje `updatePassword` exige 6)
- [x] **2.4** Chat à prova de prompt injection
  - [x] 2.4.1 `sendChatMessage` ignora `history` e `context` do cliente
  - [x] 2.4.2 Histórico = últimos 10 turnos de `chat_messages` no banco
  - [x] 2.4.3 Contexto (sono, água, humor, check-in, preventiva) lido no servidor
- [x] **2.5** Segredos e custo da LLM
  - [x] 2.5.1 `api_key` sai de `llm_config`; só `OPENROUTER_API_KEY` no env
  - [x] 2.5.2 Rate limit por usuário (ex.: 20 msgs/hora) em `chat-ai.server.ts`
  - [x] 2.5.3 Caps de `max_tokens` e tamanho de mensagem já existem (2000); manter e logar 429
- [x] **2.6** Sessão
  - [x] 2.6.1 Preferir cookie httpOnly (`@supabase/ssr`) em vez de mandar `accessToken` no body de cada `createServerFn`
  - [x] 2.6.2 Se manter token no body no curto prazo, documentar como débito e não expandir o padrão

**Critério de saída:** não há endpoint admin/unauthenticated que altere usuário; chat não aceita contexto forjado; chave LLM fora do banco.

---

## Bloco 3 — Crise, LGPD e confiança (P1)

- [x] **3.1** Protocolo de crise no companion
  - [x] 3.1.1 Detector de linguagem de risco no chat (servidor, antes/depois do LLM)
  - [x] 3.1.2 Resposta fixa: CVV 188, “procure ajuda profissional”, canal da empresa se configurado
  - [x] 3.1.3 LLM **não** tenta aconselhar crise; fallback tem prioridade
  - [x] 3.1.4 Link/recurso visível no Perfil e no Chat (não só quando dispara)
- [x] **3.2** Consentimento e direitos
  - [x] 3.2.1 Opt-in no primeiro acesso: o que é coletado, o que o RH vê (agregados), o que nunca vê (chat/diário)
  - [x] 3.2.2 Flag `profiles.privacy_consent_at` (+ versão do termo)
  - [x] 3.2.3 Exportar meus dados (JSON) e excluir conta / esquecer dados no Perfil
- [x] **3.3** Barreira RH × conteúdo privado
  - [x] 3.3.1 Audit log quando manager/admin lê painéis (já há `logEvent` — garantir `company_id` e ação)
  - [x] 3.3.2 Teste automatizado: query de manager não retorna `diary_entries.content` nem `chat_messages`

**Critério de saída:** fluxo de crise testado; termo versionado; RH não consegue conteúdo individual via API.

---

## Bloco 4 — Dashboard RH e operação B2B (P1)

Depende do Bloco 1. O portal admin (Fase 15) já cria empresas/equipes; o manager ainda não usa isso.

- [x] **4.1** Manager vê só a própria `company_id` (já 1.3); UI de Equipes lista `teams` reais
- [x] **4.2** Relatórios (`/manager/relatorios`) com o mesmo filtro e k-anonimato
- [x] **4.3** Convites e desativação (`is_active`) na UI manager, não só no admin
- [x] **4.4** Licenças: bloquear novos convites se `seats_used >= seats`
- [x] **4.5** Unificar vocabulário de humor entre companion, preventiva e RH
  - [x] 4.5.1 Uma fonte (`src/data/moods.ts`) — hoje chat usa `feliz`/`calmo`, RH scoreia `bem`/`energico`
  - [x] 4.5.2 Extra moods do chat ou entram no score ou não são persistidos como humor canônico

**Critério de saída:** piloto com 2 empresas no mesmo banco, dashboards independentes, números coerentes com check-ins reais.

---

## Bloco 5 — Engajamento do colaborador (P2)

Sem hábito o RH não vê valor — mesmo com isolamento correto.

- [x] **5.1** Onboarding de ~60s após aceite do convite (nome, time, primeiro check-in)
- [x] **5.2** Fuso horário do usuário (`profiles.timezone`); parar de usar `new Date().getHours()` no servidor como “manhã/tarde/noite”
- [x] **5.3** Lembrete de check-in (e-mail primeiro; push depois se PWA)
  - [x] 5.3.1 Job diário no horário local
  - [x] 5.3.2 Não notificar quem já fez check-in no dia
- [x] **5.4** Retomada: banner “você não fez o check-in hoje” no dashboard companion
- [x] **5.5** Favicon / OG da Zēllu (`public/favicon.ico` ainda é placeholder da Fase 1.4)

**Critério de saída:** colaborador novo chega no check-in sem se perder; lembrete e fuso corretos.

---

## Bloco 6 — Qualidade de engenharia (P2)

- [x] **6.1** Testes P0
  - [x] 6.1.1 Isolamento: manager A ↛ dados empresa B
  - [x] 6.1.2 RLS: companion não atualiza `role`
  - [x] 6.1.3 `confirmUser` inexistente / autenticado
  - [x] 6.1.4 Chat: history/context do cliente ignorados
  - [x] 6.1.5 K-anonimato: time com 4 pessoas não devolve métricas
- [x] **6.2** Unificar páginas mobile/desktop duplicadas (`src/components/pages/mobile/*` vs `desktop/*`) — um componente + CSS/`use-mobile`
- [x] **6.3** Caches em memória (`detectCache` em `preventiva-ai.server.ts`, `llmConfigCache`) — documentar limite (single instance) ou mover para tabela/`updated_at`
- [x] **6.4** CI: `lint` + testes no PR (Vitest ou similar)
- [x] **6.5** Script de seed: Empresa Demo + 2 times + convites, **sem** equipes inventadas no código

**Critério de saída:** PR quebra isolamento ou role não mergeia; duplicação de páginas começou a cair.

---

## Fora de escopo (até Blocos 1–2 fechados)

Não iniciar `todo/ROADMAP-MOTOR-INTELIGENCIA-EMOCIONAL.md` (Fases 17+ de ML). Predição em cima de times fictícios e dados misturados entre empresas amplia risco e não gera diferencial comercial.

Também adiar: SSO corporativo (depois dos convites), app nativo, white-label multi-marca além do branding atual.

---

## Ordem sugerida de execução

| Ordem | Bloco | Por quê |
|-------|-------|---------|
| 1 | **1** Isolamento + convites | Sem isso o resto é polish em dado errado |
| 2 | **2** Auth / chat / LLM | Impede abuso e vazamento no piloto |
| 3 | **3** Crise + LGPD | Exigência ética e comercial em saúde mental |
| 4 | **4** RH operacional | Valor para quem compra |
| 5 | **5** Engajamento | Adocão do colaborador |
| 6 | **6** Testes e unificação | Em paralelo a partir do Bloco 1 (6.1 primeiro) |

---

## Resumo

| Prioridade | Blocos | Descrição |
|------------|--------|-----------|
| **P0 — Impede piloto** | 1, 2 | Tenant, convites, auth, chat, segredos |
| **P1 — Impede contrato** | 3, 4 | Crise, LGPD, RH com times reais |
| **P2 — Impede hábito / escala** | 5, 6 | Onboarding, lembretes, testes, dívida técnica |
| **Depois** | ML roadmap | Motor preditivo só com dados limpos |

---

> **Meta:** um piloto com duas empresas no mesmo banco, sem vazamento cruzado, com RH vendo só agregados da própria conta e colaborador entrando por convite — não por “criar conta e escolher ser RH”.
