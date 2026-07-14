# Análise Completa da Aplicação — LVB-ZelluApp (Mundo Mental)

## 1. Visão Geral

**Nome do projeto:** `tanstack_start_ts` (nome interno)
**Nome de exibição:** Mundo Mental Companion / Zēllu
**Descrição:** Uma plataforma completa de bem-estar e saúde mental corporativo, com chat terapêutico com IA, diário emocional, rastreamento de hábitos, dashboard emocional, insights de IA e painel administrativo para RH.

**Template base:** `tanstack_start_ts_2026-05-29` (via Lovable.dev)
**Gerenciador de pacotes:** bun (com `bun.lock` e `bunfig.toml`)
**Node:** Módulos ES (`"type": "module"`)
**Linguagem:** TypeScript + TSX (React 19)
**Build tool:** Vite 7
**Estilo:** Tailwind CSS 4 + shadcn/ui (New York style)
**Ícones:** Google Material Symbols Outlined + lucide-react
**Backend:** Supabase (PostgreSQL + Auth + Storage)
**IA:** OpenRouter (GPT-4o-mini)

---

## 2. Estrutura de Diretórios

```
LVB-ZelluApp/
├── .git/
├── .gitignore
├── .lovable/
│   └── project.json
├── .prettierrc
├── .prettierignore
├── .tanstack/tmp/
├── bun.lock
├── bunfig.toml
├── components.json
├── eslint.config.js
├── node_modules/
├── package.json
├── public/
│   ├── favicon.ico
│   └── logo.png
├── src/
│   ├── assets/avatar/cabeca/
│   │   ├── Amora.png
│   │   ├── Chico.png
│   │   ├── Pipoca.png
│   │   └── Zeca.png
│   ├── components/
│   │   ├── Avatar.tsx               # Componente de avatares Amora, Chico, Pipoca, Zeca
│   │   ├── Icon.tsx                  # Wrapper Material Symbols Outlined
│   │   ├── MobileShell.tsx           # Layout mobile + navegação inferior
│   │   ├── DesktopShell.tsx          # Layout desktop com sidebar
│   │   ├── ManagerShell.tsx          # Layout para área de RH/Manager
│   │   ├── DevShell.tsx              # Layout para ferramentas de desenvolvimento
│   │   └── ui/                       # 46 componentes shadcn/ui
│   ├── data/
│   │   └── index.ts                  # Tipos e dados mockados
│   ├── hooks/
│   │   └── use-mobile.tsx            # Hook useIsMobile
│   ├── lib/
│   │   ├── api/                      # Server Functions
│   │   │   ├── auth.server.ts        # Autenticação e perfis
│   │   │   ├── checkin.server.ts     # Check-ins matinais
│   │   │   ├── chat-ai.server.ts     # Integração OpenRouter
│   │   │   ├── chat.server.ts        # Mensagens do chat
│   │   │   ├── diario.server.ts      # Entradas de diário
│   │   │   ├── habits.server.ts      # Hábitos diários
│   │   │   ├── dashboard.server.ts   # Dashboard emocional
│   │   │   ├── timeline.server.ts    # Timeline com IA
│   │   │   ├── manager.server.ts     # Dados de RH
│   │   │   ├── llm-config.server.ts  # Configuração de IA (dev)
│   │   │   └── insights-ai.server.ts # Geração de insights por IA
│   │   ├── services/                 # Camada de serviços
│   │   │   ├── chat-service.ts
│   │   │   ├── checkin-service.ts
│   │   │   ├── diario-service.ts
│   │   │   ├── habitos-service.ts
│   │   │   ├── dashboard-service.ts
│   │   │   ├── timeline-service.ts
│   │   │   └── manager-service.ts
│   │   ├── supabase/
│   │   │   ├── client.ts             # Cliente Supabase browser
│   │   │   └── server.ts             # Cliente Supabase server-side
│   │   ├── auth-context.tsx          # Context de autenticação
│   │   ├── use-require-auth.ts       # Proteção de rotas por role
│   │   ├── branding.ts               # Config de marca (nome, cores, fontes)
│   │   ├── theme.tsx                 # ThemeProvider + useTheme
│   │   ├── config.server.ts
│   │   ├── error-capture.ts
│   │   ├── error-page.ts
│   │   ├── lovable-error-reporting.ts
│   │   └── utils.ts
│   ├── routes/
│   │   ├── README.md
│   │   ├── __root.tsx                # Root layout com providers
│   │   ├── index.tsx                 # Dashboard Emocional (/)
│   │   ├── login.tsx                 # Tela de login/cadastro
│   │   ├── chat.tsx                  # Chat com IA
│   │   ├── checkin.tsx               # Check-in matinal
│   │   ├── diario.tsx                # Timeline/Diário
│   │   ├── habitos.tsx               # Redirect → /meu-bem-estar
│   │   ├── meu-bem-estar.tsx         # Visão consolidada de bem-estar
│   │   ├── respiro.tsx               # Exercícios de respiração
│   │   ├── perfil.tsx                # Perfil do usuário
│   │   ├── dashboard-emocional.tsx   # Redirect → /
│   │   ├── manager/
│   │   │   ├── index.tsx             # Dashboard RH
│   │   │   ├── equipes.tsx           # Gestão de equipes
│   │   │   └── relatorios.tsx        # Relatórios e exportações
│   │   └── dashitecnology/
│   │       ├── index.tsx             # Ferramentas de desenvolvimento
│   │       └── $painelDev.tsx        # Painéis dinâmicos (LLM Config)
│   ├── components/pages/             # Páginas por dispositivo
│   │   ├── mobile/
│   │   │   ├── ChatPage.tsx
│   │   │   ├── CheckinPage.tsx
│   │   │   ├── TimelinePage.tsx
│   │   │   ├── BemEstarPage.tsx
│   │   │   ├── RespiroPage.tsx
│   │   │   ├── PerfilPage.tsx
│   │   │   └── DashboardEmocionalPage.tsx
│   │   └── desktop/
│   │       ├── ChatPage.tsx
│   │       ├── CheckinPage.tsx
│   │       ├── TimelinePage.tsx
│   │       ├── BemEstarPage.tsx
│   │       ├── RespiroPage.tsx
│   │       ├── PerfilPage.tsx
│   │       └── DashboardEmocionalPage.tsx
│   ├── routeTree.gen.ts
│   ├── router.tsx
│   ├── server.ts
│   ├── start.ts                      # CSRF middleware adicionado
│   └── styles.css
├── supabase/                         # Configurações e migrations
├── tsconfig.json
├── vite.config.ts
├── .env                              # Variáveis de ambiente
├── TODO-MundoMental.md               # Plano de implementação
├── CORRECOES_ROTAS.md                # Documentação de correções
├── DEV_ACESSO_COMPLETO.md            # Acesso do role dev
└── FASE_10_INSIGHTS_IA.md            # Documentação de insights IA
```

---

## 3. Stack Tecnológica Detalhada

### 3.1 Core
| Tecnologia | Versão | Função |
|---|---|---|
| React | ^19.2.0 | UI Library |
| TypeScript | ^5.8.3 | Tipagem |
| Vite | ^7.3.1 | Bundler / Dev Server |
| TanStack React Router | ^1.168.25 | Roteamento SPA/SSR |
| TanStack React Query | ^5.83.0 | Gerenciamento de estado server-side |
| TanStack React Start | ^1.168.20 | Framework full-stack SSR |
| Nitro (beta) | 3.0.260429-beta | Servidor de produção SSR |
| Tailwind CSS | ^4.2.1 | Utilitários CSS |
| shadcn/ui | — | Componentes headless estilizados |
| Supabase | ^2.110.3 | Backend as a Service (Auth, DB, Storage) |
| OpenRouter | — | Gateway para LLMs (GPT-4o-mini) |

### 3.2 Componentes e UI
| Pacote | Versão | Uso |
|---|---|---|
| @radix-ui/* | múltiplos | 24 pacotes de primitivas headless acessíveis |
| class-variance-authority | ^0.7.1 | Variantes de componentes (cva) |
| clsx + tailwind-merge | ^2.1.1 / ^3.5.0 | Combinação de classes CSS |
| lucide-react | ^0.575.0 | Ícones |
| Material Symbols Outlined | — | Ícones (via Google Fonts) |
| recharts | ^2.15.4 | Gráficos (Dashboard Emocional) |
| embla-carousel-react | ^8.6.0 | Carrossel |
| cmdk | ^1.1.1 | Command palette |
| input-otp | ^1.4.2 | Input OTP |
| react-day-picker | ^9.14.0 | Calendário |
| react-hook-form | ^7.81.0 | Formulários |
| @hookform/resolvers | ^5.2.2 | Validação de formulários |
| sonner | ^2.0.7 | Toast notifications |
| vaul | ^1.1.2 | Drawer component |
| react-resizable-panels | ^4.6.5 | Painéis redimensionáveis |
| date-fns | ^4.1.0 | Manipulação de datas |
| zod | ^3.24.2 | Validação de schemas |
| framer-motion | ^12.42.2 | Animações |
| tw-animate-css | ^1.3.4 | Animações CSS |

---

## 4. Sistema de Rotas (TanStack Router)

**Tipo:** File-based routing com proteção por role

### 4.1 Rotas Públicas
| Arquivo | URL | Componente | Descrição |
|---|---|---|---|
| `__root.tsx` | — | RootLayout | Layout raiz, providers, error/404 |
| `login.tsx` | `/login` | LoginPage | Login e cadastro com seleção de role |

### 4.2 Rotas de Colaborador (Companion)
| Arquivo | URL | Descrição |
|---|---|---|
| `index.tsx` | `/` | Dashboard Emocional com gráficos e insights IA |
| `chat.tsx` | `/chat` | Chat com IA contextual (OpenRouter) |
| `checkin.tsx` | `/checkin` | Check-in matinal (sono, água, humor) |
| `diario.tsx` | `/diario` | Timeline com entradas e insights IA |
| `meu-bem-estar.tsx` | `/meu-bem-estar` | Visão consolidada de todos os indicadores |
| `respiro.tsx` | `/respiro` | Exercícios de respiração com sons ambiente |
| `perfil.tsx` | `/perfil` | Perfil e configurações do usuário |
| `habitos.tsx` | `/habitos` | Redirect → /meu-bem-estar |
| `dashboard-emocional.tsx` | `/dashboard-emocional` | Redirect → / |

### 4.3 Rotas de Manager (RH/Gestor)
| Arquivo | URL | Descrição |
|---|---|---|
| `manager/index.tsx` | `/manager` | Dashboard RH com métricas de equipes |
| `manager/equipes.tsx` | `/manager/equipes` | Gestão de equipes por departamento |
| `manager/relatorios.tsx` | `/manager/relatorios` | Exportação de relatórios CSV |

### 4.4 Rotas de Dev (Desenvolvedor)
| Arquivo | URL | Descrição |
|---|---|---|
| `dashitecnology/index.tsx` | `/dashitecnology` | Índice de ferramentas de dev |
| `dashitecnology/$painelDev.tsx` | `/dashitecnology/:painelDev` | Painéis dinâmicos (ex: llm-config) |

### 4.5 Hierarquia de Acesso por Role

**Companion (Colaborador):**
- ✅ Todas as rotas de companion
- ❌ Bloqueado em /manager e /dashitecnology

**Manager (RH/Gestor):**
- ✅ Todas as rotas de manager
- ❌ Bloqueado em rotas de companion e /dashitecnology
- 🔄 Pode alternar entre views se tiver múltiplos roles

**Dev (Desenvolvedor):**
- ✅ **Acesso TOTAL** a todas as rotas (companion + manager + dev)
- 🔄 Pode alternar entre as 3 views: Colaborador → Manager → Dev Tools

---

## 5. Funcionalidades Implementadas

### 5.1 Autenticação e Autorização
- **Login/Cadastro** com email e senha
- **Seleção de role** no cadastro (Colaborador ou RH/Gestor)
- **Redirecionamento automático** após login baseado no role
- **Proteção de rotas** via hook `useRequireAuth()`
- **Context global** de autenticação (`AuthProvider`)
- **Sessão persistente** via Supabase Auth

### 5.2 Dashboard Emocional (`/`)
- **Gráficos de evolução** com recharts:
  - Distribuição de humor (barras)
  - Comparativo semanal (barras agrupadas)
  - Tendência de humor 30 dias (linha)
  - Tendência de sono 30 dias (linha)
- **Métricas resumidas**:
  - Dias rastreados
  - Humor predominante
  - Média de sono
- **Insight de IA** sobre mudança de ansiedade
- **Comparação semanal** (sono, água, movimento)
- **Versões mobile e desktop** responsivas

### 5.3 Chat com IA (`/chat`)
- **Integração real** com OpenRouter (GPT-4o-mini)
- **Contexto personalizado**:
  - Nome do usuário
  - Último check-in (sono, água, humor)
  - Hora do dia (bom dia/tarde/noite)
- **Saudação contextual**: "Bom dia [nome]. Dormiu bem?"
- **Estado de digitação** natural (typing indicator)
- **Histórico de conversa** (últimos 10 turnos)
- **Sugestões inteligentes** pós-resposta
- **Persistência** no Supabase

### 5.4 Check-in Matinal (`/checkin`)
- **Fluxo em 3 etapas**:
  1. Sono (5-9 horas)
  2. Hidratação (500-2500ml)
  3. Humor (6 emojis: Feliz, Calmo, Neutro, Ansioso, Triste, Irritado)
- **Salvamento automático** no Supabase
- **Integração com chat** (IA usa dados do check-in)
- **Verificação de check-in existente** (não duplica)
- **Versões mobile e desktop**

### 5.5 Timeline/Diário (`/diario`)
- **Formato de timeline** com entradas agregadas:
  - Entradas de diário
  - Check-ins (sono, água, humor)
  - Hábitos (movimento, energia, refeições)
  - Mensagens do chat
- **Calendário de humor** (14 dias)
- **Insight de IA** no topo ("IA percebe evolução")
- **Adicionar nova entrada** de texto
- **Cores por humor** (emoji + gradiente)

### 5.6 Meu Bem-estar (`/meu-bem-estar`)
- **Visão consolidada** de todos os indicadores:
  - 💧 Água (slider interativo, meta 2000ml)
  - 🛌 Sono (barra de qualidade)
  - 😊 Humor (6 opções)
  - 🏃 Movimento (0-120 min)
  - ⚡ Energia (slider Baixa/Média/Alta)
  - 🍽️ Refeições (toggle: café, almoço, lanche, jantar)
  - 🧘 Respiração (link para /respiro)
- **Integração com check-in** (pré-popula dados)
- **Salvamento consolidado**
- **Versões mobile e desktop**

### 5.7 Espaço do Respiro (`/respiro`)
- **Exercício de respiração guiada**:
  - Inspirar (2.8s) → Segurar (1.2s) → Expirar (2.0s)
  - Animação CSS `breathe` (6s)
  - Círculo pulsante com gradiente
- **Sons ambiente** (grid 2×2):
  - 🌧️ Chuva
  - 🌲 Floresta
  - 🔥 Fogueira
  - 🌊 Ondas
- **Toggle visual** clay-pressed/clay-soft
- **Versões mobile e desktop**

### 5.8 Perfil (`/perfil`)
- **Dados pessoais**:
  - Nome de exibição (editável)
  - Avatar (seleção entre Amora, Chico, Pipoca, Zeca)
  - Email (editável com confirmação)
  - Senha (alteração com verificação)
- **Configurações**:
  - Tema claro/escuro
  - Logout
- **Para Dev**: Botão de trocar entre modos

### 5.9 Dashboard RH (`/manager`)
- **Métricas por equipe**:
  - Estresse ↑/↓
  - Energia ↑/↓
  - Sono ↑/↓
  - Engajamento ↑/↓
- **Cards de resumo**:
  - Total de colaboradores
  - Check-ins hoje
  - Adesão semanal
  - Alertas ativos
- **Navegação**: Equipes, Relatórios, Perfil
- **Versões mobile e desktop**

### 5.10 Gestão de Equipes (`/manager/equipes`)
- **Lista de equipes** com status:
  - Nome do departamento
  - Número de membros
  - Badge de status (Estável, Monitorar, Atenção)
- **Indicadores por equipe**
- **Grid responsivo** (1/2/3 colunas)

### 5.11 Relatórios (`/manager/relatorios`)
- **Exportação CSV** (últimos 30 dias)
- **Indicadores agregados** e anonimizados
- **Download automático**

### 5.12 Dev Tools (`/dashitecnology`)
- **Painel LLM Config**:
  - Modelo (ex: openai/gpt-4o-mini)
  - Temperatura (0.0-2.0)
  - Max tokens
  - System prompt
  - API Key (OpenRouter)
  - Teste de conexão
  - Reset para padrão
- **Proteção**: Apenas role "dev"

---

## 6. Insights com IA (Fase 10)

### 6.1 Sistema de Insights (`insights-ai.server.ts`)
- **Integração com OpenRouter** (GPT-4o-mini)
- **6 contextos diferentes**:
  - `timeline` - Evolução recente
  - `dashboard` - Correlações entre métricas
  - `anxiety-change` - Mudança de ansiedade
  - `sleep-quality` - Qualidade do sono
  - `weekly-summary` - Resumo semanal
  - `chat` - Observações contextuais

### 6.2 Dados Processados
- **Métricas agregadas**:
  - Médias de sono, água, movimento, energia
  - Distribuição de humor
  - Tendências (melhorando/piorando/estável)
  - Comparação semanal
- **Correlações identificadas**:
  - Sono ↔ Humor
  - Movimento ↔ Energia
  - Hidratação ↔ Bem-estar
  - Ansiedade ↔ Sono

### 6.3 Exemplos de Insights
- *"Nas últimas duas semanas, você demonstrou mais tranquilidade após dias com sono acima de 7h."*
- *"Você teve 18% menos dias ansiosos esta semana. Suas 7h de sono médias estão fazendo diferença!"*
- *"Seus dias com melhor humor coincidem com noites de sono de qualidade e movimento regular."*

### 6.4 Fallback Inteligente
- Sistema de regras quando API não disponível
- Sempre retorna insight relevante
- Baseado nos dados reais do usuário

---

## 7. Sistema de Design

### 7.1 Paleta de Cores (OKLCH)
| Variável | Valor | Uso |
|---|---|---|
| `--clay-cream` | oklch(0.945 0.022 84) | Fundo principal |
| `--clay-title` | oklch(0.71 0.045 254) | Títulos |
| `--clay-text` | oklch(0.48 0.03 260) | Texto corporal |
| `--clay-cta` | oklch(0.82 0.05 250) | CTA primário |
| `--clay-cta-2` | oklch(0.88 0.035 250) | CTA secundário |
| `--clay-anxiety` | oklch(0.88 0.045 50) | Ansiedade |
| `--clay-stress` | oklch(0.93 0.06 95) | Estresse |
| `--clay-joy` | oklch(0.9 0.06 145) | Alegria |

### 7.2 Componentes de UI
- **clay-card**: Card com backdrop-filter blur(14px)
- **clay-soft**: Versão suave com blur(10px)
- **clay-pressed**: Estado pressionado
- **clay-cta**: Botão com gradiente

### 7.3 Tipografia
- **Display:** Quicksand (500-700 weight)
- **Corpo:** Nunito Sans (400-700 weight)
- **Ícones:** Material Symbols Outlined

### 7.4 Tema Claro/Escuro
- ThemeProvider com toggle
- CSS variables dinâmicas
- Persistência da preferência

---

## 8. Backend (Supabase)

### 8.1 Tabelas
- **profiles**: dados do usuário (role, display_name, avatar_url)
- **checkins**: check-ins matinais (sleep_hours, water_ml, mood)
- **habits**: hábitos diários (water_ml, sleep_quality, movement_minutes, energy_level, meals)
- **diary_entries**: entradas de diário (content, mood)
- **chat_messages**: histórico de chat (from, text)
- **llm_config**: configuração de IA (model, temperature, max_tokens, system_prompt, api_key)

### 8.2 Row Level Security (RLS)
- Políticas por tabela
- Acesso apenas aos próprios dados
- Manager acessa dados agregados/anonimizados

### 8.3 Autenticação
- Email + senha
- Confirmação de email automática
- Metadados do usuário (role, avatar_url)
- Sessão persistente

---

## 9. Segurança

### 9.1 CSRF Protection
- Middleware CSRF em `start.ts`
- Proteção de server functions
- Tokens únicos por requisição

### 9.2 Autenticação
- Supabase Auth
- Tokens JWT
- Refresh automático

### 9.3 Autorização
- Hook `useRequireAuth()`
- Verificação de role
- Redirecionamento automático

### 9.4 Variáveis de Ambiente
```
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
OPENROUTER_API_KEY=sk-or-v1-...
```

---

## 10. Status do Projeto

### 10.1 Fases Concluídas ✅

- **Fase 0:** Fundação Arquitetural ✅
- **Fase 1:** White Label & Rebranding ✅
- **Fase 2:** Dois Modos (Companion + Manager) ✅
- **Fase 3:** Redesign Visual ✅
- **Fase 4:** Chat com IA Contextual ✅
- **Fase 5:** Check-in Matinal ✅
- **Fase 6:** Manager Pages Responsivas ✅
- **Fase 7:** "Hábitos" → "Meu Bem-estar" ✅
- **Fase 8:** Diário → Timeline ✅
- **Fase 9:** Dashboard Emocional ✅
- **Fase 10:** Insights IA ✅

### 10.2 Progresso Geral
- **~88%** do caminho para apresentação comercial
- **Próximas fases:** IA Preventiva, Plano de Cuidado, Gamificação, Portal Admin

### 10.3 Problemas Resolvidos
1. ✅ Corrigido erro de navegação no login
2. ✅ Renomeado parâmetro de rota ($painel-dev → $painelDev)
3. ✅ Adicionado middleware CSRF
4. ✅ Implementado acesso total para role dev
5. ✅ Sistema de insights com IA funcionando

---

## 11. Observações

### 11.1 Arquitetura
- **Mobile-first** com suporte desktop
- **SSR** para melhor performance e SEO
- **Server Functions** para lógica server-side
- **Context API** para estado global
- **React Query** para cache de dados

### 11.2 Padrões
- `.server.ts` para código server-side
- Componentes separados por dispositivo (mobile/desktop)
- Services layer entre componentes e APIs
- Validação com Zod
- Tipagem forte em TypeScript

### 11.3 Performance
- Lazy loading de componentes
- Cache de dados com React Query
- Otimização de imagens
- CSS otimizado com Tailwind
- Build otimizado com Vite

---

## 12. Documentação

### 12.1 Arquivos de Documentação
- `TODO-MundoMental.md` - Plano de implementação completo
- `ANALISE_COMPLETA.md` - Este arquivo
- `CORRECOES_ROTAS.md` - Correções realizadas
- `DEV_ACESSO_COMPLETO.md` - Sistema de acesso por role
- `FASE_10_INSIGHTS_IA.md` - Documentação de insights IA

### 12.2 Scripts
- `dev` - Servidor de desenvolvimento
- `build` - Build de produção
- `build:dev` - Build modo dev
- `preview` - Preview do build
- `lint` - Lint ESLint
- `format` - Formatação Prettier

---

## 13. Conclusão

A aplicação evoluiu de um MVP de demonstração para uma plataforma completa de bem-estar corporativo, com:

- ✅ Backend real com Supabase
- ✅ Chat com IA contextual
- ✅ Dashboard emocional com gráficos
- ✅ Timeline integrada
- ✅ Check-in matinal inteligente
- ✅ Visão consolidada de bem-estar
- ✅ Insights gerados por IA
- ✅ Painel de RH com métricas
- ✅ Sistema de roles (Companion, Manager, Dev)
- ✅ Proteção de rotas e CSRF
- ✅ Design responsivo e profissional

O sistema está pronto para uso diário e demonstração comercial, com 88% das funcionalidades planejadas implementadas.
