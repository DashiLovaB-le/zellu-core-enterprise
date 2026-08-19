# API — Documentação de Server Functions

> **Projeto:** Mundo Mental Care  
> **Versão:** 1.1  
> **Data:** 2026-08-18  
> **Tipo:** Server Functions (TanStack Start)

---

## 1. Visão Geral

Não há API REST pública. As rotas de produto chamam `createServerFn` em `src/lib/api/*.server.ts`.

**Contrato comum:**
- Quase todas as funções recebem `accessToken` no body (débito: ainda não é cookie httpOnly).
- Identidade: `requireUser` / `requireCompanionConsent` / `requireManager` / `requireAdmin` via `supabase.auth.getUser(accessToken)`.
- Role vem de `profiles`, nunca de `user_metadata`.
- CSRF ativo nas server functions (`start.ts`).
- Retornos reais tendem a `{ error, data }` ou o payload direto — **não** há envelope `{ success, code }` padronizado em todas as funções.

**Job de retenção (exceção):** `POST /api/jobs/retention` com `Authorization: Bearer CRON_SECRET`.

---

## 2. Autenticação (`auth.server.ts` + `auth-context.tsx`)

Login e logout acontecem **no cliente** (`signInWithPassword` / `signOut`). Não existem `login()` / `signup()` server functions.

Funções reais:

| Função | Uso |
|---|---|
| `getProfile` | Profile do usuário autenticado |
| `getUserRole` | `profiles.role` |
| `updateProfile` | nome, avatar, timezone |
| `updateEmail` | troca de e-mail no Auth |
| `updatePassword` | senha mínima 8 |

Cadastro: `invites.server.ts` → `acceptInvite`.

---

## 3. Convites (`invites.server.ts`)

| Função | Quem chama | Efeito |
|---|---|---|
| `createInvite` | manager/admin | Token, e-mail, role companion\|manager, respeita seats |
| `listInvites` | manager/admin | Lista da empresa |
| `getInviteByToken` | público | Preview do convite |
| `acceptInvite` | público autenticável | Cria user + vincula empresa/role |
| `listCompanyMembers` | manager | RPC `list_company_directory` (sem flags de saúde) |
| `setEmployeeActive` | manager/admin | `is_active` |
| `completeOnboarding` | companion | nome + timezone |

---

## 4. Privacidade (`privacy.server.ts`)

Consentimento versão **3.0**. Companion precisa de termo atual + maioridade.

| Função | Efeito |
|---|---|
| `savePrivacyConsent` | Termo + opt-ins IA/RH/e-mail + `adult_confirmed_at` |
| `updatePrivacyPreferences` | Revogar/alterar opt-ins |
| `withdrawPrivacyConsent` | Zera termo e opt-ins |
| `exportMyData` | JSON do titular |
| `deleteMyAccount` | Exclui usuário Auth |
| `purgeExpiredPersonalData` | Admin dispara retenção (180/365/90 dias) |

---

## 5. Check-in (`checkin.server.ts`)

### `saveCheckin`

```typescript
{ accessToken, sleepHours: 0–24, sleepLabel, waterMl: 0–10000, mood }
```

- Um por dia; segundo envio retorna erro (não atualiza).
- Exige consentimento.

Também: `getTodaysCheckin` / `getLatestCheckin`.

---

## 6. Chat IA (`chat-ai.server.ts`, `chat.server.ts`)

### `sendChatMessage`

```typescript
{ accessToken, text: 1–2000, history?, context? }
```

`history` e `context` do cliente são **ignorados** (`chat-guard.ts`).

Retorno: `{ reply, suggestion, crisis, error? }`

Regras: 20 msgs/hora; crise → CVV sem LLM; IA cloud só com opt-in; ZDR + `data_collection=deny`.

UI: `getMessages` (até 80), `sendMessage` (persistência local da thread), `getContextualGreeting`.

---

## 7. Diário e Timeline

| Arquivo | Funções |
|---|---|
| `diario.server.ts` | `getDiaryEntries`, `saveDiaryEntry`, `deleteDiaryEntry` |
| `timeline.server.ts` | `getTimelineData` (check-in + diário + hábitos + chat) |

Não existe `getTimeline(userId)`.

---

## 8. Dashboard companion (`dashboard.server.ts`)

`getDashboardData({ accessToken })` — métricas pessoais 30d, não o painel RH.

---

## 9. Bem-estar (`habitos.server.ts`)

`getHabits` / `updateHabits` — não `saveWellness` / `getTodayWellness`.

---

## 10. Plano de Cuidado (`wellness-plan.server.ts`)

`getWellnessPlan`, `saveWellnessPlan`, `getTodaysChecklist`, `updateChecklist`, `getPlanProgress`, `generatePlanSuggestion`.

Streak: `getWellnessStreak` em `streak-system.server.ts` (não `calculateStreak`).

---

## 11. Insights e preventiva

- `generateInsight` — opt-in de IA; senão fallback local.
- `detectPatterns`, `getNotificationHistory`, `dismissNotification`, `getUnreadNotificationCount`.

---

## 12. Manager (`manager.server.ts`)

Todas exigem `requireManager` + `company_id`. **Não usam service role.** Chamam RPC `get_rh_dashboard`.

| Função | Uso |
|---|---|
| `getManagerDashboard` | KPIs + times (7d) |
| `getRhDashboard` | Times, trends, moodDistribution, alerts (30d) |
| `getCheckinStats` | Série agregada |
| `listManagerTeams` | Agregados por equipe |
| `exportCsv` | CSV sem indivíduo |

K-anonimato: times com menos de 5 opt-ins ocultam métricas; empresa com menos de 5 opt-ins zera trends/alertas.

Payload **não** inclui conteúdo de diário nem chat.

---

## 13. Admin (`admin.server.ts`)

Funções reais (todas com `accessToken` + role admin/dev):

`getAdminKpis`, `listCompanies`, `upsertCompany`, `deleteCompany`, `listEmployees`, `updateEmployee`, `listTeams`, `upsertTeam`, `listLicenses`, `upsertLicense`, `listContracts`, `upsertContract`, `getUsageMetrics`, `getSentimentData`, `listAlertConfigs`, `upsertAlertConfig`, `evaluateAlerts`, `exportAdminCsv`, `exportAdminPdf`.

---

## 14. Lembretes (`reminders.server.ts`)

`sendCheckinReminders` (admin; também dispara retenção) e `hasCheckinToday`.

---

## 15. Dev Tools

`getSystemLogs` (role **dev**), `logClientEvent`.

LLM: `getLlmConfig`, `setLlmConfig`, `resetLlmConfig`, `testLlmConnection`. Chave efetiva: `OPENROUTER_API_KEY` (não persistir no banco).

---

## 16. Erros

Não há catálogo único `AUTH_REQUIRED` / `FORBIDDEN`. O padrão mais comum é `{ error: "Unauthorized" }` ou mensagem em português (consentimento, convite, licença).

---

## 17. Rate limiting

| Recurso | Limite | Onde |
|---|---|---|
| Chat IA (LLM) | 20 mensagens / hora | `chat-ai.server.ts` |
| Chat persistência UI | 30 / minuto | `chat.server.ts` (memória do processo) |
| Check-in | 1 por dia (regra de negócio) | `checkin.server.ts` |
| Login | limite do Supabase Auth | — |
