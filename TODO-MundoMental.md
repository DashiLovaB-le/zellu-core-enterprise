# TODO — Reposicionamento Mundo Mental

> Plano de implementação baseado em `P-MundoMental-v1.md.MD`
> Status atual: Fase 16 — limpeza técnica concluída; validação humana e fechamento comercial pendentes
> Última atualização: Fase 16 (16.1–16.3 + 16.5) ✅

---

## Fase 0 — Fundação Arquitetural ✅

- [X] **0.1** Centralizar branding em arquivo de configuração (`src/lib/branding.ts`) — nome, tagline, cores, fonts
- [X] **0.2** Criar sistema de temas dinâmicos (`ThemeProvider` + `useTheme` em `src/lib/theme.tsx`) com toggle claro/escuro
- [X] **0.3** Configurar autenticação e sessão de usuário via Supabase (`.env`, `src/lib/supabase/`, `src/lib/auth-context.tsx`)
- [X] **0.4** Estruturar store global de usuário (`AuthProvider` + `useAuth`) com login, signup, logout
- [X] **0.5** Substituir dados mockados por server functions (`src/lib/api/*.server.ts` + service layer em `src/lib/services/`)
- [X] **0.6** Corrigir navegação inferior — `Perfil` agora aponta para `/perfil` (rota real), não mais duplicata de `/respiro`
- [X] **0.7** Meta tags e head dinâmicos via branding config
- [X] **0.8** Mobile/Desktop toggle via CSS (`block md:hidden` / `hidden md:block`) — sem flash, sem JS

---

## Fase 1 — White Label & Rebranding ✅

- [X] **1.1** Substituir "Sereno" por "Mundo Mental Companion" (via `src/lib/branding.ts`) — DesktopShell, Mobile RespiroPage, rotas
- [X] **1.2** Adicionar selo "Powered by Zellu" internamente — footer do MobileShell e DesktopShell
- [X] **1.3** Metadados, head, título e OG tags dinâmicos via `BRANDING` config (já feito na Fase 0)
- [X] **1.4** Favicon — mantido o existente em `public/favicon.ico` (substituir quando houver asset da MM)
- [X] **1.5** Paleta de cores configurável via CSS custom properties em `styles.css` (já feito na Fase 0)

---

## Fase 2 — Dois Modos: Companion + Manager ✅

- [X] **2.1** Estrutura de rotas protegidas por role via `useRequireAuth("companion" | "manager")` — redireciona para `/login` se não autenticado
- [X] **2.2** **Modo Companion** — rotas existentes protegidas (`/`, `/diario`, `/habitos`, `/respiro`, `/perfil`)
- [X] **2.3** **Modo Manager** — novas rotas em `/manager/` (dashboard, equipes, relatórios) com `ManagerShell` próprio
- [X] **2.4** Tela de login (`/login`) com cadastro + seleção de role (Colaborador / RH) — redireciona para o modo correto após autenticação
- [X] **2.5** Navegação específica para cada modo: `MobileShell` (Companion: Chat, Diário, Hábitos, Respiro, Perfil) e `ManagerShell` (Manager: Dashboard, Equipes, Relatórios, Perfil)

---

## Fase 3 — Redesign Visual do Companion ✅

- [X] **3.1** Reduzir ~40% do aspecto "ursinho" — CSS refinado (saturação reduzida, blur menor, cores mais contidas)
- [X] **3.2** Substituir personagens atuais por formas orgânicas/abstratas — estrutura `Avatar` pronta para troca de assets
- [X] **3.3** Incorporar avatares existentes em `src/components/Avatar.tsx` — Amora, Chico, Pipoca, Zeca exibidos em toda a UI
- [X] **3.4** Atenuar gradientes e sombras pesadas — `styles.css` revisado com opacidades reduzidas em ~40%
- [X] **3.5** Redimensionar botões para interações profissionais — inputs menores, paddings reduzidos, tipografia mais compacta
- [X] **3.6** Substituir linguagem infantil por tom acolhedor corporativo — textos revisados (ex: "Alimentação Afetiva" → "Alimentação")
- [X] **3.7** Evoluir identidade visual para estilo premium — paleta refinada, glassmorphism sutil, ícones consistentes, grid limpo

---

## Fase 4 — Chat com IA Contextual ✅

- [X] **4.1** Substituir chat mockado por integração real com LLM via OpenRouter (GPT-4o-mini) — `src/lib/api/chat-ai.server.ts`
- [X] **4.2** Implementar saudação contextual: "Bom dia [nome]. Dormiu bem?" com dados de sono, hidratação, humor e período do dia
- [X] **4.3** Adicionar estado de digitação natural (typing indicator com bolinhas animadas)
- [X] **4.4** Mensagens com dados reais do usuário (sono, humor, check-in no system prompt)
- [X] **4.5** Sugestões inteligentes pós-resposta (respiração, água, pausa, movimento)
- [X] **4.6** **IA com Memória** — últimos 10 turnos incluídos no contexto da conversa

---

## Fase 5 — Check-in Matinal Inteligente ✅

- [X] **5.1** Criar server functions para check-in (`saveCheckin` + `getLatestCheckin`) — tabela `checkins` no Supabase
- [X] **5.2** Criar tela de check-in matinal em 3 etapas: sono (5-9h), hidratação (500-2500ml), humor (6 emojis)
- [X] **5.3** Salvar respostas no Supabase e conectar ao contexto da IA no chat
- [X] **5.4** Adicionar rota `/checkin` e link na navegação (MobileShell + DesktopShell)
- [X] **5.5** IA usa dados do check-in mais recente como contexto automaticamente

---

## Fase 6 — Manager Pages Responsivas ✅

- [X] **6.1** Redesign `ManagerShell` com sidebar em desktop e bottom nav em mobile
- [X] **6.2** Dashboard RH com grid adaptável (`sm:grid-cols-2`, resumo em sidebar)
- [X] **6.3** Página de Equipes com grid 1/2/3 colunas responsivo
- [X] **6.4** Página de Relatórios com grid 1/2 colunas
- [X] **6.5** Auto-confirmação de email no cadastro via `SUPABASE_SERVICE_ROLE_KEY`

---

## Fase 7 — "Hábitos" → "Meu Bem-estar" ✅

- [X] **7.1** Renomear rota `/habitos` → `/meu-bem-estar` (com redirect) — rota `/habitos` redireciona para `/meu-bem-estar`, navegação já aponta para a nova rota
- [X] **7.2** Unificar módulos em uma única tela integrada — `BemEstarPage` (mobile + desktop) com todos os cards:
  - [X] 7.2.1 Água (já existe, integrar) — `WaterCard` com slider + botões ±, meta 2000ml
  - [X] 7.2.2 Sono (já existe, integrar) — `SleepCard` com barra estática e legenda de qualidade
  - [X] 7.2.3 Humor (já existe no diário, integrar) — `MoodCard` com 6 opções (Feliz, Calmo, Neutro, Ansioso, Triste, Irritado)
  - [X] 7.2.4 Movimento (novo) — `MovementCard` com slider 0-120 min
  - [X] 7.2.5 Respiração (já existe em `/respiro`, integrar) — `RespiroCard` com link para `/respiro`
  - [X] 7.2.6 Energia (novo) — `EnergyCard` com slider e classificação Baixa/Média/Alta
  - [X] 7.2.7 Alimentação (já existe, integrar) — `MealsCard` com toggle de refeições (Café da Manhã, Almoço, Lanche, Jantar)
- [X] **7.3** Criar visão consolidada do dia com todos os indicadores — todos os cards em tela única, dados integrados com check-in matinal, botão "Salvar dia" para persistência

---

## Fase 8 — Diário → Timeline ✅

- [X] **8.1** Reformular página `/diario` para formato de Timeline — novos componentes `MobileTimelinePage` e `DesktopTimelinePage` com dados agregados de `diary_entries`, `checkins`, `habits` e `chat_messages` via `getTimelineData` server function
- [X] **8.2** Cada entrada da timeline contém: emoticon (baseado no humor do dia), eventos do dia (💬 Conversou com Amora, 🛌 Dormiu 7h, 💧 Bebeu 1500ml, 🏃 Movimento, ⚡ Energia, 🍽️ Refeições, 📝 texto do diário)
- [X] **8.3** Calendário de humor de 14 dias mantido e integrado à timeline — grid dinâmico com cores mapeadas do banco de dados, destacando o dia atual
- [X] **8.4** Frase gerada por IA no topo: "IA percebe evolução." — insight dinâmico gerado por análise de padrões (humor predominante, consistência de sono/hidratação/movimento, tom do dia atual), com fallback para mensagens contextuais

---

## Fase 9 — Dashboard Emocional ✅

- [X] **9.1** Criar novo dashboard focado em **evolução** — rota `/dashboard-emocional`, dados agregados de `checkins`, `habits` e `diary_entries` dos últimos 60 dias, com componentes `MobileDashboardEmocionalPage` e `DesktopDashboardEmocionalPage`
- [X] **9.2** Métricas como: "Você teve +18% menos ansiedade" — insight dinâmico calculando delta de dias ansiosos entre semana atual e anterior; cartões de resumo com dias tracked, humor predominante, média de sono
- [X] **9.3** Gráficos de progresso semanal/mensal com recharts — `BarChart` (distribuição de humor, comparativo semanal, média semanal), `LineChart` (tendência de humor 30d, tendência de sono 30d)
- [X] **9.4** Comparação de períodos (semana atual vs anterior) — `BarChart` agrupado comparando sono, água e movimento entre as duas semanas, mais distribuição de humor lado a lado

---

## Fase 10 — Insights IA ✅

- [X] **10.1** Substituir textos genéricos por insights gerados por IA
- [X] **10.2** Formato natural e inteligente (ex: "Nas últimas duas semanas você demonstrou mais tranquilidade após dias com sono acima de 7h...")
- [X] **10.3** Correlacionar variáveis (sono ↔ humor, alimentação ↔ energia)
- [X] **10.4** Posicionar insights na timeline, dashboard e chat

---

## Fase 11 — IA Preventiva ✅

- [X] **11.1** Implementar detecção de padrões: sono caiu + humor caiu + interações diminuíram
- [X] **11.2** Alertas sutis e preventivos ("Percebi uma mudança no seu padrão...")
- [X] **11.3** Sugerir ação antes do burnout: exercício, conversa, pausa, mindfulness
- [X] **11.4** Notificações preventivas com tom de cuidado, não de alarme

---

## Fase 12 — Plano de Cuidado (Bem-estar) ✅

- [X] **12.1** Criar "Plano de Bem-estar" com objetivo definido pelo usuário (ex: reduzir ansiedade)
- [X] **12.2** Checklist diário: ✔ água, ✔ caminhada, ✔ respirar, ✔ conversar
- [X] **12.3** Progresso visual do plano
- [X] **12.4** Sugestões da IA para ajustes no plano

---

## Fase 13 — Gamificação Elegante ✅

- [X] **13.1** Sistema de contagem de streak visível no Dashboard e Plano de Cuidado (`streak-system.server.ts`, `MilestoneBanner.tsx`)
- [X] **13.2** Celebrações visuais sutis em marcos: 3, 7, 14, 21, 30, 60, 90 dias (banner gradiente com ícone, sem animações infantis)

---

## Fase 14 — Dashboard do RH (Modo Manager) ✅

- [X] **14.1** Nova rota `/manager/rh-dashboard` com navegação no ManagerShell (substitui Dashboard anterior)
- [X] **14.2** Dados agregados e anonimizados via `getRhDashboard` (consulta real ao banco, sem expor indivíduos)
- [X] **14.3** KPIs por equipe: humor, sono, hidratação, % negativo — com status (Estável/Monitorar/Atenção)
- [X] **14.4** Cards de resumo por departamento com indicadores em grid adaptável
- [X] **14.5** Gráficos de tendência (LineChart: humor, sono, água 30d) e distribuição de humor (BarChart)
- [X] **14.6** Alertas automáticos por equipe (humor negativo ≥20% / ≥40%, sono baixo, hidratação baixa)

---

## Fase 15 — Portal Administrativo (Mundo Mental) ✅

- [X] **15.1** Criar painel administrativo separado (super-admin)
- [X] **15.2** Módulos do portal:
  - [X] 15.2.1 KPIs globais
  - [X] 15.2.2 Gerenciamento de empresas/clientes
  - [X] 15.2.3 Gerenciamento de funcionários
  - [X] 15.2.4 Licenças e contratos
  - [X] 15.2.5 Métricas de uso e adoção
  - [X] 15.2.6 Sentimentos agregados
  - [X] 15.2.7 Alertas configuráveis
  - [X] 15.2.8 Relatórios exportáveis (PDF/CSV)
- [X] **15.3** Design limpo e profissional (painel B2B)

---

## Fase 16 — Limpeza & Refinamento

- [X] **16.1** Revisar todos os textos para tom corporativo-acolhedor
- [X] **16.2** Eliminar sinais de MVP (telas que parecem demonstração)
- [X] **16.3** Garantir que toda a experiência parece um produto pronto para uso diário
- [ ] **16.4** Testes de percepção: pedir feedback de outras pessoas sobre aparência "enterprise"
- [X] **16.5** Documentar posicionamento: o app não substitui psicólogos nem a plataforma MM — ele aumenta engajamento (`docs/POSICIONAMENTO.md`)
- [ ] **16.6** Apresentar proposta comercial: um **ativo estratégico** que amplia o valor da oferta da Mundo Mental (rascunho em `docs/PROPOSTA-COMERCIAL.md`)

---

## Resumo por Prioridade

| Prioridade | Fases | Descrição |
|------------|-------|-----------|
| **P0 — Crítico** | Fase 0, 1, 16 | Fundação, white label, limpeza de MVP |
| **P1 — Alto** | Fase 2, 4, 5, 6 | Modos, chat real, check-in, manager responsivo |
| **P2 — Médio** | Fase 3, 7, 8, 9 | Redesign visual, bem-estar, timeline, dashboard |
| **P3 — Estratégico** | Fase 10, 11, 12, 13 | Insights IA, preventiva, plano, gamificação |
| **P4 — Corporativo** | Fase 14, 15 | Dashboard RH + Portal Administrativo |

---

> **Meta final:** O Mundo Mental Care deixa de parecer "um app bonito de saúde mental" e passa a parecer um **ativo estratégico** que amplia o valor da oferta da Mundo Mental para seus próprios clientes.

---

## Próximo trabalho (produção)

Fases 0–16 entregam o produto visual e os modos companion/manager/admin. O que falta para piloto real está em **`todo/TODO-PRIORIDADES-PRODUCAO.md`** (isolamento por empresa, convites, auth, crise/LGPD). O motor de ML (`todo/ROADMAP-MOTOR-INTELIGENCIA-EMOCIONAL.md`) permanece bloqueado até os Blocos 1–2 desse TODO.
