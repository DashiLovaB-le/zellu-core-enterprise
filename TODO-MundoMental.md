# TODO — Reposicionamento Mundo Mental

> Plano de implementação baseado em `P-MundoMental-v1.md.MD`
> Status atual: ~70-75% do caminho para apresentação comercial
> Última atualização: Fase 0 concluída ✅

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

## Fase 2 — Dois Modos: Companion + Manager

- [ ] **2.1** Criar estrutura de rotas protegidas por role (`companion` | `manager`)
- [ ] **2.2** **Modo Companion** — experiência do funcionário (apps existentes + reformulações abaixo)
- [ ] **2.3** **Modo Manager** — painel do RH (nova aplicação)
- [ ] **2.4** Criar seletor/fluxo de login que direcione para o modo correto
- [ ] **2.5** Adicionar navegação específica para cada modo (bottom tabs diferentes)

---

## Fase 3 — Redesign Visual do Companion

- [ ] **3.1** Reduzir ~40% do aspecto "ursinho" — suavizar mascotes sem eliminar acolhimento
- [ ] **3.2** Substituir personagens atuais por formas orgânicas/abstratas (Lumis, Guardiões, Espíritos)
- [ ] **3.3** Incorporar avatares já existentes em `src/assets/avatar/cabeca/` na UI
- [ ] **3.4** Remover ou atenuar excesso de gradientes e sombras pesadas
- [ ] **3.5** Redimensionar botões grandes para interações mais profissionais
- [ ] **3.6** Substituir linguagem infantil ("ursinho", "fofinho") por tom acolhedor porém corporativo
- [ ] **3.7** Evoluir identidade visual para estilo **premium** (referências: Apple, Nothing, Headspace, Calm, Duolingo — sem infantilizar)

---

## Fase 4 — Chat com IA Contextual

- [ ] **4.1** Substituir chat mockado por integração real com LLM (IA generativa)
- [ ] **4.2** Implementar saudação contextual: "Bom dia [nome]. Dormiu bem? Percebi que acordou mais cedo..."
- [ ] **4.3** Adicionar estado de digitação natural (typing indicator com delay variável)
- [ ] **4.4** Mensagens com dados reais do usuário (sono, humor, check-in)
- [ ] **4.5** Sugestões inteligentes pós-resposta (respiração, exercício, pausa)
- [ ] **4.6** **IA com Memória** — lembrar de conversas anteriores ("Você comentou na segunda que estava preocupado com a reunião. Como foi?")

---

## Fase 5 — "Hábitos" → "Meu Bem-estar"

- [ ] **5.1** Renomear rota `/habitos` → `/meu-bem-estar` (com redirect)
- [ ] **5.2** Unificar módulos em uma única tela integrada:
  - [ ] 5.2.1 Água (já existe, integrar)
  - [ ] 5.2.2 Sono (já existe, integrar)
  - [ ] 5.2.3 Humor (já existe no diário, integrar)
  - [ ] 5.2.4 Movimento (novo)
  - [ ] 5.2.5 Respiração (já existe em `/respiro`, integrar)
  - [ ] 5.2.6 Energia (novo)
  - [ ] 5.2.7 Alimentação (já existe, integrar)
- [ ] **5.3** Criar visão consolidada do dia com todos os indicadores

---

## Fase 6 — Diário → Timeline

- [ ] **6.1** Reformular página `/diario` para formato de Timeline
- [ ] **6.2** Cada entrada da timeline deve conter: emoticon, eventos do dia (conversou com Amora, dormiu 7h, etc.)
- [ ] **6.3** Manter calendário de humor existente, mas integrado à timeline
- [ ] **6.4** Frase gerada por IA no topo: "IA percebe evolução."

---

## Fase 7 — Dashboard Emocional

- [ ] **7.1** Criar novo dashboard focado em **evolução** (não apenas dados isolados)
- [ ] **7.2** Métricas como: "Você teve +18% menos ansiedade nos últimos 30 dias"
- [ ] **7.3** Gráficos de progresso semanal/mensal (recharts já disponível)
- [ ] **7.4** Comparação de períodos (semana atual vs anterior)

---

## Fase 8 — Check-in Inteligente

- [ ] **8.1** Criar modal/fluxo de check-in diário (máx 15 segundos)
- [ ] **8.2** Perguntas rápidas: "Como você chega hoje?", "Como está sua energia?", "Você conseguiu descansar?"
- [ ] **8.3** Disparar check-in automaticamente ao abrir o app (uma vez por dia)
- [ ] **8.4** Cruzar dados do check-in com sono, hábitos e conversas anteriores
- [ ] **8.5** Gerar resposta personalizada pós-check-in

---

## Fase 9 — Insights IA

- [ ] **9.1** Substituir textos genéricos por insights gerados por IA
- [ ] **9.2** Formato natural e inteligente (ex: "Nas últimas duas semanas você demonstrou mais tranquilidade após dias com sono acima de 7h...")
- [ ] **9.3** Correlacionar variáveis (sono ↔ humor, alimentação ↔ energia)
- [ ] **9.4** Posicionar insights na timeline, dashboard e chat

---

## Fase 10 — IA Preventiva

- [ ] **10.1** Implementar detecção de padrões: sono caiu + humor caiu + interações diminuíram
- [ ] **10.2** Alertas sutis e preventivos ("Percebi uma mudança no seu padrão...")
- [ ] **10.3** Sugerir ação antes do burnout: exercício, conversa, pausa, mindfulness
- [ ] **10.4** Notificações preventivas com tom de cuidado, não de alarme

---

## Fase 11 — Plano de Cuidado (Bem-estar)

- [ ] **11.1** Criar "Plano de Bem-estar" com objetivo definido pelo usuário (ex: reduzir ansiedade)
- [ ] **11.2** Checklist diário: ✔ água, ✔ caminhada, ✔ respirar, ✔ conversar
- [ ] **11.3** Progresso visual do plano
- [ ] **11.4** Sugestões da IA para ajustes no plano

---

## Fase 12 — Gamificação Elegante

- [ ] **12.1** Remover sistema de moedas/pontos se existir
- [ ] **12.2** Substituir por contagem de progresso: "Você cultivou 14 dias de autocuidado"
- [ ] **12.3** Metas baseadas em consistência, não competição
- [ ] **12.4** Pequenas celebrações visuais (sem animações infantis)

---

## Fase 13 — Dashboard do RH (Modo Manager)

- [ ] **13.1** Criar nova seção/rota para o painel administrativo
- [ ] **13.2** Exibir apenas dados agregados e anonimizados (nunca indivíduos)
- [ ] **13.3** KPIs por equipe: Estresse ↑, Energia ↓, Sono ↓, Engajamento ↑
- [ ] **13.4** Cards de resumo por departamento (ex: "Equipe Financeira — Excelente estabilidade emocional")
- [ ] **13.5** Gráficos de tendência ao longo do tempo
- [ ] **13.6** Alertas de equipe (quando métricas indicam risco)

---

## Fase 14 — Pulse Inteligente com IA ⭐

> Funcionalidade #1 para aumentar valor percebido

- [ ] **14.1** Criar fluxo diário de < 20 segundos combinando check-in + IA
- [ ] **14.2** IA cruza check-in com sono, hábitos, conversas e padrões
- [ ] **14.3** Resultado duplo:
  - [ ] 14.3.1 Experiência personalizada para o colaborador
  - [ ] 14.3.2 Indicadores agregados e anonimizados para o RH
- [ ] **14.4** Conectar exatamente o que a Mundo Mental vende com o que o Zēllu faz melhor

---

## Fase 15 — Portal Administrativo (Mundo Mental)

- [ ] **15.1** Criar painel administrativo separado (super-admin)
- [ ] **15.2** Módulos do portal:
  - [ ] 15.2.1 KPIs globais
  - [ ] 15.2.2 Gerenciamento de empresas/clientes
  - [ ] 15.2.3 Gerenciamento de funcionários
  - [ ] 15.2.4 Licenças e contratos
  - [ ] 15.2.5 Métricas de uso e adoção
  - [ ] 15.2.6 Sentimentos agregados
  - [ ] 15.2.7 Alertas configuráveis
  - [ ] 15.2.8 Relatórios exportáveis (PDF/CSV)
- [ ] **15.3** Design limpo e profissional (painel B2B)

---

## Fase 16 — Limpeza & Refinamento

- [ ] **16.1** Revisar todos os textos para tom corporativo-acolhedor
- [ ] **16.2** Eliminar sinais de MVP (telas que parecem demonstração)
- [ ] **16.3** Garantir que toda a experiência parece um produto pronto para uso diário
- [ ] **16.4** Testes de percepção: pedir feedback sobre aparência "enterprise"
- [ ] **16.5** Documentar posicionamento: o app não substitui psicólogos nem a plataforma MM — ele aumenta engajamento
- [ ] **16.6** Apresentar proposta comercial: um **ativo estratégico** que amplia o valor da oferta da Mundo Mental

---

## Resumo por Prioridade

| Prioridade | Fases | Descrição |
|------------|-------|-----------|
| **P0 — Crítico** | Fase 0, 1, 16 | Fundação, white label, limpeza de MVP |
| **P1 — Alto** | Fase 2, 4, 8, 14 | Modos, chat real, check-in, pulse inteligente |
| **P2 — Médio** | Fase 3, 5, 6, 7 | Redesign visual, bem-estar, timeline, dashboard |
| **P3 — Estratégico** | Fase 9, 10, 11, 12 | Insights IA, preventiva, plano, gamificação |
| **P4 — Corporativo** | Fase 13, 15 | Dashboard RH + Portal Administrativo |

---

> **Meta final:** O Zēllu deixa de parecer "um app bonito de saúde mental" e passa a parecer um **ativo estratégico** que amplia o valor da oferta da Mundo Mental para seus próprios clientes.
