# Roadmap do Produto — Zēllu

> **Versão:** 1.2  
> **Data:** 2026-08-26  
> **Última atualização de fase:** 2026-08-26

---

## 1. Visão Geral do Roadmap

O desenvolvimento do Zēllu segue um modelo de fases Incrementais, construindo da fundação técnica até o produto completo para operação B2B.

---

## 2. Fases Concluídas

### Fase 0 — Fundação Arquitetural ✅
**Status:** Concluída  
**Objetivo:** Setup do projeto, stack e estrutura base.

| Entrega | Status |
|---|---|
| Template TanStack Start + Vite | ✅ |
| Supabase (Auth + DB) integrado | ✅ |
| Tailwind CSS + shadcn/ui | ✅ |
| Estrutura de diretórios definida | ✅ |
| ESLint + Prettier configurados | ✅ |

---

### Fase 1 — White Label & Rebranding ✅
**Status:** Concluída (marca única por deploy via `branding.ts` + assets Zēllu)  
**Objetivo:** Personalizar o app para a marca Zēllu.  
**Nota:** Multi-marca por empresa (logo/cores por `company_id`) permanece deferida.

| Entrega | Status |
|---|---|
| Branding (`branding.ts`) | ✅ |
| Logo e favicon | ✅ |
| Paleta de cores (clay/OKLCH) | ✅ |
| Tipografia (Quicksand + Nunito Sans) | ✅ |

---

### Fase 2 — Dois Modos (Companion + Manager) ✅
**Status:** Concluída  
**Objetivo:** Separar experiências por perfil de usuário.

| Entrega | Status |
|---|---|
| MobileShell / DesktopShell (Companion) | ✅ |
| ManagerShell (RH/Gestor) | ✅ |
| AuthContext com roles | ✅ |
| Proteção de rotas por role | ✅ |
| Redirect pós-login por role | ✅ |

---

### Fase 3 — Redesign Visual ✅
**Status:** Concluída  
**Objetivo:** Refinar a UI para tom corporativo-acolhedor.

| Entrega | Status |
|---|---|
| Componentes clay-card, clay-soft, clay-pressed | ✅ |
| Glassmorphism contido | ✅ |
| Animações com framer-motion | ✅ |
| PageTransition nos shells | ✅ |

---

### Fase 4 — Chat com IA Contextual ✅
**Status:** Concluída  
**Objetivo:** Implementar conversa com IA integrada.

| Entrega | Status |
|---|---|
| Integração OpenRouter (GPT-4o-mini) | ✅ |
| Contexto (nome, humor, período do dia) | ✅ |
| Histórico (últimos 10 turnos) | ✅ |
| Sugestões pós-resposta | ✅ |
| Typing indicator | ✅ |
| Persistência no Supabase | ✅ |
| Respostas em Markdown | ✅ |

---

### Fase 5 — Check-in Matinal ✅
**Status:** Concluída  
**Objetivo:** Fluxo diário de rastreamento de humor e hábitos.

| Entrega | Status |
|---|---|
| Fluxo em 3 etapas (sono → água → humor) | ✅ |
| 6 humores principais + 19 extras | ✅ |
| Prevenção de duplicata | ✅ |
| Alimenta contexto do chat | ✅ |

---

### Fase 6 — Manager Pages Responsivas ✅
**Status:** Concluída  
**Objetivo:** Páginas de gestão para RH/gestores.

| Entrega | Status |
|---|---|
| Layout Manager responsivo | ✅ |
| Navegação Desktop Manager | ✅ |
| Proteção de acesso | ✅ |

---

### Fase 7 — Hábitos → Meu Bem-estar ✅
**Status:** Concluída  
**Objetivo:** Consolidar indicadores de bem-estar em uma página.

| Entrega | Status |
|---|---|
| Rota `/meu-bem-estar` | ✅ |
| Campos: água, sono, humor, movimento, energia, refeições | ✅ |
| Pré-popula do check-in | ✅ |
| Salvamento consolidado | ✅ |

---

### Fase 8 — Diário → Timeline ✅
**Status:** Concluída  
**Objetivo:** Visualização cronológica de atividades.

| Entrega | Status |
|---|---|
| Timeline agregada (diário, check-ins, hábitos, chat) | ✅ |
| Calendário de humor (14 dias) | ✅ |
| Entrada de texto livre | ✅ |
| Insight de IA + alerta preventivo | ✅ |

---

### Fase 9 — Dashboard Emocional ✅
**Status:** Concluída  
**Objetivo:** Central de métricas e gráficos do colaborador.

| Entrega | Status |
|---|---|
| Gráficos de humor e sono (recharts) | ✅ |
| Comparativo semanal | ✅ |
| Tendência 30 dias | ✅ |
| Métricas consolidadas | ✅ |
| Versões mobile e desktop | ✅ |

---

### Fase 10 — Insights IA ✅
**Status:** Concluída  
**Objetivo:** Análise inteligente de padrões e tendências.

| Entrega | Status |
|---|---|
| Sistema de insights (`insights-ai.server.ts`) | ✅ |
| Contextos: timeline, dashboard, anxiety-change, sleep-quality, weekly-summary, chat | ✅ |
| Correlações (sono↔humor, movimento↔energia) | ✅ |
| Fallback local quando API indisponível | ✅ |

---

### Fase 11 — IA Preventiva ✅
**Status:** Concluída  
**Objetivo:** Detecção proativa de riscos emocionais.

| Entrega | Status |
|---|---|
| Detecção de padrões (sono, humor, engajamento, hidratação, energia, movimento) | ✅ |
| Tipos: burnout-risk, sleep-crisis, mood-crisis, disengagement | ✅ |
| Severidade: low/medium/high | ✅ |
| UI: PreventiveAlertBanner (Dashboard, Chat, Timeline) | ✅ |
| Persistência: `preventive_notifications` | ✅ |
| Cache server-side (~30 min) | ✅ |

---

### Fase 12 — Plano de Cuidado ✅
**Status:** Concluída  
**Objetivo:** Plano personalizado de bem-estar com checklist diário.

| Entrega | Status |
|---|---|
| Rota `/plano-de-cuidado` | ✅ |
| Objetivo definido pelo usuário | ✅ |
| Checklist diário (água, caminhada, respirar, conversar) | ✅ |
| Progresso visual | ✅ |
| Sugestões da IA para ajustes | ✅ |
| Schema: `wellness_plans`, `wellness_checklist` | ✅ |

---

### Fase 13 — Gamificação Elegante ✅
**Status:** Concluída  
**Objetivo:** Motivação através de streaks e marcos.

| Entrega | Status |
|---|---|
| Streak baseada em check-ins + checklist | ✅ |
| Marcos: 3, 7, 14, 21, 30, 60, 90 dias | ✅ |
| MilestoneBanner (tom corporativo) | ✅ |

---

### Fase 14 — Dashboard do RH ✅
**Status:** Concluída  
**Objetivo:** Painel de métricas agregadas para gestores.

| Entrega | Status |
|---|---|
| KPIs por equipe (estresse, energia, sono, engajamento) | ✅ |
| Tendências 30 dias | ✅ |
| Distribuição de humor | ✅ |
| Alertas por equipe | ✅ |
| Dados agregados/anonimizados | ✅ |

---

### Fase 15 — Portal Administrativo ✅
**Status:** Concluída  
**Objetivo:** Painel B2B para gestão de empresas, licenças e contratos.

| Entrega | Status |
|---|---|
| AdminShell (layout B2B) | ✅ |
| KPIs globais | ✅ |
| Gestão de empresas (CRUD) | ✅ |
| Gestão de funcionários | ✅ |
| Licenças e contratos | ✅ |
| Métricas de uso (DAU/WAU/MAU) | ✅ |
| Sentimentos agregados | ✅ |
| Configuração de alertas | ✅ |
| Relatórios CSV/PDF | ✅ |
| Schema: `006_admin_portal.sql` | ✅ |

---

## 3. Fase em Andamento

### Fase 16 — Limpeza & Refinamento 🟡
**Status:** Quase concluída  
**Objetivo:** Eliminar sinais de MVP e preparar para produção.

| Item | Status |
|---|---|
| 16.1 Textos corporativo-acolhedor | ✅ |
| 16.2 Eliminar sinais de MVP | ✅ |
| 16.3 Experiência "produto pronto" | ✅ |
| 16.4 Testes de percepção (feedback humano) | ⏳ Pendente |
| 16.5 Documentar posicionamento | ✅ |
| 16.6 Apresentar proposta comercial | ⏳ Rascunho em `docs/PROPOSTA-COMERCIAL.md` |

---

## 4. Fases Futuras (Planejadas)

### Fase 17 — Testes & QA 🟡
**Status:** Parcialmente entregue

| Entrega | Status |
|---|---|
| Vitest + testes P0 (isolamento, k-anonimato, crise, chat-guard, LGPD) | ✅ |
| CI GitHub Actions (`tsc`, lint, `npm test`) | ✅ |
| Testes de integração RLS no Postgres | ⏳ |
| E2E (Playwright) | ⏳ |

### Fase 18 — Deploy & Produção 🟡
**Status:** Parcialmente entregue

| Entrega | Status |
|---|---|
| CI no PR | ✅ |
| Workflow de retenção (`APP_URL` + `CRON_SECRET`) | ✅ (requer secrets) |
| Deploy automatizado de app | ⏳ |
| Monitoramento além de `system_logs` | ⏳ |

### Fase 19 — LGPD & Segurança ✅
**Status:** Implementada no produto (migrations 007–009 aplicadas no remoto)

| Entrega | Status |
|---|---|
| Convites; sem self-signup com escolha de role | ✅ |
| Consentimento explícito versionado (3.0) + maioridade | ✅ |
| Opt-in IA / RH / e-mail | ✅ |
| RH só agregados + k-anonimato | ✅ |
| Controle de retenção (SQL + cron + job) | ✅ |
| Portabilidade e exclusão (Perfil) | ✅ |
| Protocolo de crise + disclaimer clínico | ✅ |
| Cookie httpOnly no lugar do token no body | ⏳ débito 2.6 |

### Fase 20 — Experiência e operação B2B ✅ (parcial)
**Status:** Entregas recentes (ago/2026)

| Entrega | Status |
|---|---|
| Mascote Zēllu nas telas companion + PageLoader | ✅ |
| Login card clay compacto | ✅ |
| Convites por e-mail (Resend) + cancelamento | ✅ |
| Guia de produto companion + RH | ✅ |
| Companions Amora/Pipoca/Zeca (voz, quick replies, fallback) | ✅ |
| Chico com poses dinâmicas no chat | ✅ |
| Centro de exportação RH (CSV/PDF filtrável) | ✅ |
| White-label multi-marca por empresa | ⏳ deferido |
| UI Admin para 1º convite manager | ⏳ gap operacional |

### Fase 21 — Expansão
**Status:** Futura

| Entrega | Prioridade |
|---|---|
| Notificações push | Alta |
| Modo offline (cache local) | Média |
| Integração com calendário corporativo | Média |
| App nativo (React Native) | Baixa |

---

## 5. Resumo Visual

```
Fase 0  ✅ Fundação
Fase 1  ✅ White Label
Fase 2  ✅ Companion + Manager
Fase 3  ✅ Redesign Visual
Fase 4  ✅ Chat IA
Fase 5  ✅ Check-in
Fase 6  ✅ Manager Pages
Fase 7  ✅ Meu Bem-estar
Fase 8  ✅ Timeline
Fase 9  ✅ Dashboard Emocional
Fase 10 ✅ Insights IA
Fase 11 ✅ IA Preventiva
Fase 12 ✅ Plano de Cuidado
Fase 13 ✅ Gamificação
Fase 14 ✅ Dashboard RH
Fase 15 ✅ Portal Admin
Fase 16 🟡 Limpeza & Refinamento
Fase 17 🟡 Testes & QA (Vitest/CI ok; E2E pendente)
Fase 18 🟡 Deploy (CI ok; hospedagem a fechar)
Fase 19 ✅ LGPD, convites, RLS, crise
Fase 20 ✅ UX companion/RH, e-mail convites, companions
Fase 21 🔮 Expansão
```

---

## 6. Marcos Chave

| Marco | Data Alvo | Descrição |
|---|---|---|
| MVP Funcional | Jul 2026 | Fases 0–15 concluídas |
| Produto Pronto p/ piloto | Ago 2026 | Isolamento B2B + LGPD no banco remoto |
| Lançamento Beta | Set 2026 | Deploy + primeiros clientes |
| 100 Usuários Ativos | Out 2026 | Meta de adoção inicial |
| 10 Empresas Clientes | Dez 2026 | Meta comercial |
