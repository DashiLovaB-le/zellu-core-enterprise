# 🧠 Mundo Mental Companion — TODO

> **Stack:** TanStack Start (React 19, Vite), Supabase (auth + DB), OpenRouter (IA), Tailwind v4
> **Princípio:** Mobile-first com toggle CSS (`block md:hidden` / `hidden md:block`) — sem JS para exibição condicional

---

## ✅ Fase 0 — Fundação do app (Concluído)

- [x] Configurar branding (`branding.ts`)
- [x] Criar `ThemeProvider` com tema claro/escuro
- [x] Configurar Supabase (cliente browser + servidor)
- [x] Criar `AuthContext` + `useRequireAuth`
- [x] Criar server functions (exemplo, chat)
- [x] Criar service layer (`chat-service.ts`)
- [x] Corrigir navegação para usar CSS (não JS) no toggle mobile/desktop
- [x] Meta tags dinâmicas via `head` nos componentes de rota
- [x] TODO.md criado

## ✅ Fase 1 — White Label / Rebranding (Concluído)

- [x] Nome "Mundo Mental Companion" configurado em `branding.ts`
- [x] Favicon mantido como `zellu-favicon.ico`
- [x] Footer "Powered by Zellu" presente em `DesktopShell` e `MobileShell`
- [x] Substituir "Sereno" pelo nome do app

## ✅ Fase 2 — Dois modos de uso (Concluído)

- [x] Criar `useRequireAuth` com verificação de role
- [x] Página de login funcional
- [x] Roteamento por role: `/manager/*` para manager, `/` para companion
- [x] `ManagerShell` com navegação lateral
- [x] Rotas manager: overview, equipe, relatórios, configurações
- [x] Alternar modo no profile: "Alternar para modo Gestor"

## ✅ Fase 3 — Redesign Visual (Concluído)

- [x] `Avatar` component com Amora, Chico, Pipoca, Zeca
- [x] Paleta refinada: clay, sage, blush, mist
- [x] Glassmorphism consistente, sombras reduzidas em 40%
- [x] Premium CSS (font-display, tracking, gradientes suaves)
- [x] Redesign `MobileShell`, `DesktopShell`, `ManagerShell`
- [x] Redesign `IndexPage`, `SleepPage`, `WaterPage`, `MoodPage`
- [x] Página de perfil com avatar e alternância de modo

## ✅ Fase 4 — Chat com IA Contextual (Concluído)

- [x] Adicionar `OPENROUTER_API_KEY` ao `.env`
- [x] Criar `src/lib/api/chat-ai.server.ts` com server function chamando OpenRouter (GPT-4o-mini)
- [x] Sistema de contexto: sono, água, humor, check-in, saudação por período
- [x] Atualizar `chat-service.ts` com integração real de IA
- [x] Atualizar `routes/index.tsx` com `greeting`, `isAiThinking`, `aiSuggestion`, `onQuickReply`
- [x] Typing indicator (bolinhas animadas) no mobile e desktop
- [x] Sugestões inteligentes pós-resposta (respirar, água, pausa, movimento)
- [x] Quick replies fixos (Suave, Médio, Forte)
- [x] Scroll automático para nova mensagem

## 🔲 Fase 5 — Check-in matinal inteligente

- [ ] Tela de check-in matinal com perguntas (sono, hidratação, humor)
- [ ] Respostas salvas no Supabase (tabela `checkins`)
- [ ] IA usa dados do check-in mais recente como contexto
- [ ] Notificação/lembrete de check-in matinal

## 🔲 Fase 6 — Dashboard de bem-estar

- [ ] Dashboard com gráficos de humor, sono, hidratação (últimos 7 dias)
- [ ] Cards resumo no `ManagerShell`
- [ ] Exportar relatório de bem-estar (PDF)

## 🔲 Fase 7 — Modo Offline / PWA

- [ ] Service worker com cache de assets
- [ ] Mensagens do chat armazenadas localmente (IndexedDB)
- [ ] Sincronizar mensagens quando voltar online

## 🔲 Fase 8 — Melhorias finas

- [ ] Animação de entrada nas bolhas de chat
- [ ] Haptic feedback (mobile)
- [ ] Suporte a áudio (voz para texto)
- [ ] Testes E2E
