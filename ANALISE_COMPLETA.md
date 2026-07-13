# Análise Completa da Aplicação — LVB-ZelluApp (Sereno)

## 1. Visão Geral

**Nome do projeto:** `tanstack_start_ts` (nome interno)
**Nome de exibição:** LVB-ZelluApp / Sereno
**Descrição:** Um aplicativo mobile-first de bem-estar e saúde mental, com chat terapêutico simulado, diário emocional, rastreador de hábitos (água, alimentação, sono) e exercícios de respiração guiada.

**Template base:** `tanstack_start_ts_2026-05-29` (via Lovable.dev)
**Gerenciador de pacotes:** bun (com `bun.lock` e `bunfig.toml`)
**Node:** Módulos ES (`"type": "module"`)
**Linguagem:** TypeScript + TSX (React 19)
**Build tool:** Vite 7
**Estilo:** Tailwind CSS 4 + shadcn/ui (New York style)
**Ícones:** Google Material Symbols Outlined + lucide-react

---

## 2. Estrutura de Diretórios

```
LVB-ZelluApp/
├── .git/
├── .gitignore
├── .lovable/
│   └── project.json            # Metadados do template Lovable
├── .prettierrc                  # Config Prettier (100 col, aspas duplas, trailing comma)
├── .prettierignore              # node_modules, dist, .output, .vinxi, lock, routeTree.gen.ts
├── .tanstack/
│   └── tmp/
├── bun.lock
├── bunfig.toml                  # minimumReleaseAge: 86400s (24h), exclui @lovable.dev/*
├── components.json              # Config shadcn/ui (New York, slate base, ícone lucide)
├── eslint.config.js             # ESLint flat config (TS, React Hooks, React Refresh, Prettier)
├── node_modules/
├── package-lock.json
├── package.json
├── public/
│   └── favicon.ico
├── src/
│   ├── assets/
│   │   └── avatar/
│   │       └── cabeca/
│   │           ├── Amora.png
│   │           ├── Chico.png
│   │           ├── Pipoca.png
│   │           └── Zeca.png
│   ├── components/
│   │   ├── MobileShell.tsx      # Layout mobile + navegação inferior + componente Icon
│   │   └── ui/                  # 46 componentes shadcn/ui (accordion ao tooltip)
│   ├── hooks/
│   │   └── use-mobile.tsx       # Hook useIsMobile (breakpoint 768px)
│   ├── lib/
│   │   ├── api/
│   │   │   └── example.functions.ts  # Exemplo de createServerFn (TanStack Start)
│   │   ├── config.server.ts     # Config server-side (.server.ts, não vai pro client)
│   │   ├── error-capture.ts     # Captura global de erros (error/unhandledrejection)
│   │   ├── error-page.ts        # Página de erro SSR inline (HTML puro)
│   │   ├── lovable-error-reporting.ts  # Report de erros para Lovable
│   │   └── utils.ts             # Função cn() (clsx + tailwind-merge)
│   ├── routes/
│   │   ├── README.md            # Documentação interna do sistema de rotas
│   │   ├── __root.tsx            # Root layout (QueryClientProvider, head, error/404)
│   │   ├── index.tsx            # Rota "/" — Página de Chat
│   │   ├── diario.tsx           # Rota "/diario" — Meu Diário
│   │   ├── habitos.tsx          # Rota "/habitos" — Meus Hábitos
│   │   └── respiro.tsx          # Rota "/respiro" — Espaço do Respiro
│   ├── routeTree.gen.ts          # Árvore de rotas gerada automaticamente
│   ├── router.tsx                # Factory do Router TanStack
│   ├── server.ts                 # Entrypoint SSR (fetch handler com error recovery)
│   ├── start.ts                  # Instância createStart com middleware de erro
│   └── styles.css                # Estilos globais Tailwind + tema Clay + animações
├── teste.md
├── tsconfig.json
└── vite.config.ts
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
| TanStack React Start | ^1.167.50 | Framework full-stack SSR |
| Nitro (beta) | 3.0.260429-beta | Servidor de produção SSR |
| Tailwind CSS | ^4.2.1 | Utilitários CSS |
| shadcn/ui | — | Componentes headless estilizados |

### 3.2 Componentes e UI
| Pacote | Versão | Uso |
|---|---|---|
| @radix-ui/* | múltiplos | 24 pacotes de primitivas headless acessíveis |
| class-variance-authority | ^0.7.1 | Variantes de componentes (cva) |
| clsx + tailwind-merge | ^2.1.1 / ^3.5.0 | Combinação de classes CSS |
| lucide-react | ^0.575.0 | Ícones |
| Material Symbols Outlined | — | Ícones (via Google Fonts) |
| recharts | ^2.15.4 | Gráficos |
| embla-carousel-react | ^8.6.0 | Carrossel |
| cmdk | ^1.1.1 | Command palette |
| input-otp | ^1.4.2 | Input OTP |
| react-day-picker | ^9.14.0 | Calendário |
| react-hook-form | ^7.71.2 | Formulários |
| @hookform/resolvers | ^5.2.2 | Validação de formulários |
| sonner | ^2.0.7 | Toast notifications |
| vaul | ^1.1.2 | Drawer component |
| react-resizable-panels | ^4.6.5 | Painéis redimensionáveis |
| date-fns | ^4.1.0 | Manipulação de datas |
| zod | ^3.24.2 | Validação de schemas |
| tw-animate-css | ^1.3.4 | Animações CSS |
| lightningcss-win32-x64-msvc | ^1.32.0 | Processador CSS |

### 3.3 Dev Dependencies
| Pacote | Versão |
|---|---|
| @vitejs/plugin-react | ^5.0.4 |
| @lovable.dev/vite-tanstack-config | ^2.1.1 |
| eslint + prettier | ^9.32.0 / ^3.7.3 |
| typescript-eslint | ^8.56.1 |

---

## 4. Configurações do Projeto

### 4.1 TypeScript (`tsconfig.json`)
- **Target:** ES2022
- **JSX:** react-jsx
- **Module:** ESNext + Bundler resolution
- **Strict mode:** ativado
- **Path alias:** `@/*` → `./src/*`
- **Libs:** ES2022, DOM, DOM.Iterable

### 4.2 Vite (`vite.config.ts`)
- Usa o preset `@lovable.dev/vite-tanstack-config`
- Entrypoint SSR: `src/server.ts`
- **Não** adicionar manualmente: tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro, componentTagger

### 4.3 ESLint (`eslint.config.js`)
- Flat config com TypeScript-ESLint
- Plugins: react-hooks, react-refresh, prettier
- Regra especial: bloqueia importação de `server-only` (não usado no TanStack Start)
- Ignora: dist, .output, .vinxi

### 4.4 Prettier (`.prettierrc`)
- 100 colunas, aspas duplas, trailing comma all, ponto e vírgula

### 4.5 shadcn/ui (`components.json`)
- Estilo: New York
- Base color: Slate
- RSC: false
- CSS variables: true
- Biblioteca de ícones: lucide
- Alias: `@/components`, `@/lib`, `@/hooks`, `@/components/ui`

---

## 5. Sistema de Rotas (TanStack Router)

**Tipo:** File-based routing

| Arquivo | URL | Componente | Descrição |
|---|---|---|---|
| `__root.tsx` | — | RootLayout | Layout raiz, providers, head HTML, error/404 |
| `index.tsx` | `/` | ChatPage | Chat com IA assistente |
| `diario.tsx` | `/diario` | DiarioPage | Diário emocional com humor |
| `habitos.tsx` | `/habitos` | HabitosPage | Hábitos: água, alimentação, sono |
| `respiro.tsx` | `/respiro` | RespiroPage | Exercício de respiração guiada |

**Geração automática:** `routeTree.gen.ts` — não editar manualmente.

**Registro TypeScript:** `@tanstack/react-start` module augmentation com `ssr: true`, tipo do router e tipo do startInstance.

---

## 6. Páginas / Funcionalidades

### 6.1 `__root.tsx` — Layout Raiz
- **Head:** charset utf-8, viewport com `maximum-scale=1`, theme-color `#F3EEE1`, título "LVB-ZelluApp"
- **Descrição:** "Um espaço gentil para acolher sua mente, dia após dia."
- **Fontes:** Quicksand (títulos), Nunito Sans (corpo), Material Symbols Outlined (ícones)
- **OG Image:** Chico.webp (armazenamento Google Cloud)
- **ShellComponent:** `<html>` + `<HeadContent>` + `<Scripts>`
- **Providers:** `QueryClientProvider` com `QueryClient` instanciado por requisição
- **NotFoundComponent:** Página 404 com link para home
- **ErrorComponent:** Error boundary com botão "Try again" (router.invalidate + reset) e report Lovable

### 6.2 `index.tsx` — Chat (`/`)
- **Título:** "Chat — Sereno"
- **Estado:** mensagens mockadas com `useState<Msg[]>`
- **Funcionalidade:** Balões de conversa (AI à esquerda, User à direita)
- **Botões rápidos:** "Suave", "Médio", "Forte" (escala de ansiedade)
- **Input:** campo de texto + botão de microone (estático)
- **Simulação:** resposta automática da IA após 700ms
- **Design:** Glassmorphism, gradientes sutis, clay-card, clay-soft

### 6.3 `diario.tsx` — Meu Diário (`/diario`)
- **Título:** "Meu Diário — Sereno"
- **Seções:**
  - **Resumo da IA:** insights mockados sobre padrões de humor
  - **Humor Recente:** grid 7x2 (14 dias) com círculos coloridos, gradientes por humor
  - **Conversas Anteriores:** lista de 3 entries mockadas com tintas coloridas
- **Paleta:** `clay-anxiety`, `clay-joy`, `clay-cta`, `clay-stress`, `clay-cta-2`, `clay-self`
- **Design:** clay-card, clay-soft, ícones Material Symbols

### 6.4 `habitos.tsx` — Meus Hábitos (`/habitos`)
- **Título:** "Meus Hábitos — Sereno"
- **Seções:**
  - **Hidratação:** barra interativa drag-and-drop (mouse/touch) com recipiente visual. Meta: 2000ml. Slider com handle de gota d'água.
  - **Alimentação Afetiva:** cards horizontais com scroll (Café da Manhã 🥞, Almoço 🥗, Lanche 🍎, Jantar 🍲)
  - **Monitoramento do Sono:** slider com caminho SVG curvo + indicador de lua. Estados: Cansado (<25), Moderado (<50), Revigorante (<75), Radiante (>=75)
- **Interatividade:** listeners `mousemove/mouseup/touchmove/touchend` com cleanup em useEffect

### 6.5 `respiro.tsx` — Espaço do Respiro (`/respiro`)
- **Título:** "Espaço do Respiro — Sereno"
- **Funcionalidades:**
  - **Exercício de Respiração:** ciclo Inspirar (2.8s) → Segurar (1.2s) → Expirar (2.0s) com animação de fade
  - **Círculo pulsante:** animação CSS `breathe` (6s ease-in-out) com gradiente radial e sombras
  - **Botão do Pânico:** área destacada com gradiente laranja (não funcional, apenas visual)
  - **Sons Ambiente:** grid 2×2 (Chuva, Floresta, Fogueira, Ondas) com toggle visual clay-pressed/clay-soft
- **Header:** logotipo "Sereno" + ícone de perfil

---

## 7. Componentes

### 7.1 `MobileShell.tsx`
- **Função:** Layout principal mobile-first
- **Estrutura:**
  - Container com `max-w-[440px]`, padding, `min-h-[100dvh]`
  - Navegação inferior fixa (4 botões) com clay-card
- **NavItems definidos:**
  1. `/diario` — "Diário" (ícone: auto_stories)
  2. `/respiro` — "Respiro" (ícone: air) — duplicado no array (também usado como "Perfil")
  3. `/` — "Chat" (ícone: chat_bubble)
  4. `/habitos` — "Hábitos" (ícone: task_alt)
  5. `/respiro` — "Perfil" (ícone: air) — duplicado, label "Perfil" mas rota é `/respiro`
- **Componente `<Icon>`**: wrapper Material Symbols Outlined com suporte a `filled` e `fontVariationSettings`

### 7.2 Componentes `ui/` (shadcn/ui)
46 componentes disponíveis: accordion, alert, alert-dialog, aspect-ratio, avatar, badge, breadcrumb, button, calendar, card, carousel, chart, checkbox, collapsible, command, context-menu, dialog, drawer, dropdown-menu, form, hover-card, input, input-otp, label, menubar, navigation-menu, pagination, popover, progress, radio-group, resizable, scroll-area, select, separator, sheet, sidebar, skeleton, slider, sonner, switch, table, tabs, textarea, toggle, toggle-group, tooltip.

**Nota:** Nenhum deles é atualmente importado nas páginas — todo o estilo é feito com utilitários Tailwind + classes customizadas (clay-*).

---

## 8. Sistema de Design — Tema "Clay"

### 8.1 Paleta de Cores (OKLCH)
| Variável | Valor | Uso |
|---|---|---|
| `--clay-cream` | oklch(0.945 0.022 84) | Fundo principal (#F3EEE1) |
| `--clay-title` | oklch(0.71 0.045 254) | Títulos (#8EA3C1) |
| `--clay-text` | oklch(0.48 0.03 260) | Texto corporal (#5A677D) |
| `--clay-cta` | oklch(0.82 0.05 250) | CTA primário (#A9C7E9) |
| `--clay-cta-2` | oklch(0.88 0.035 250) | CTA secundário (#C5D9F1) |
| `--clay-anxiety` | oklch(0.88 0.045 50) | Ansiedade/calor (#F5D6C1) |
| `--clay-stress` | oklch(0.93 0.06 95) | Estresse (#F9E7B5) |
| `--clay-self` | oklch(0.84 0.05 305) | Autocuidado(#D7CBE8) |
| `--clay-joy` | oklch(0.9 0.06 145) | Alegria (#C8E6C9) |

### 8.2 Utilities CSS Customizadas
- **`clay-card`**: card com backdrop-filter blur(14px), sombras múltiplas, border-radius 1.5rem
- **`clay-soft`**: versão mais suave com blur(10px) e sombras reduzidas
- **`clay-pressed`**: estado pressionado com sombras internas
- **`clay-cta`**: botão CTA com gradiente linear, border-radius 999px, transição
- **`clay-cta-active`**: estado ativo do CTA com sombras internas e translateY

### 8.3 Tipografia
- **Display/Títulos:** Quicksand (500-700 weight, tracking -0.01em)
- **Corpo:** Nunito Sans (400-700 weight)

### 8.4 Fundo da Página
- Background: `--clay-cream` com dois gradientes radiais decorativos (tom pêssego no topo, tom azul no canto inferior direito)
- Fixed attachment

### 8.5 Modo Escuro
- Definição inicial de `.dark` com fundo escuro e texto claro (parcial)

### 8.6 Animações
- **`breathe`**: scale(0.85 ↔ 1.05), opacity(0.85 ↔ 1), 6s infinite
- **`bounce-dot`**: escala de 0.4 a 1, usado com delays (-0.32s, -0.16s, 0s) para efeito de loading

---

## 9. Tratamento de Erros

### 9.1 `server.ts` — Entrypoint SSR
- Importa `error-capture.ts` no topo
- Lazy import do `@tanstack/react-start/server-entry`
- Função `normalizeCatastrophicSsrResponse`: detecta respostas 500 com corpo `{"unhandled":true,"message":"HTTPError"}` do h3 e as substitui por página de erro amigável
- Try/catch global que renderiza `renderErrorPage()` em caso de falha

### 9.2 `error-capture.ts`
- Escuta eventos globais `error` e `unhandledrejection`
- Armazena o último erro capturado com TTL de 5 segundos
- `consumeLastCapturedError()`: recupera e limpa o erro capturado

### 9.3 `error-page.ts`
- Função `renderErrorPage()`: retorna HTML inline com CSS embutido
- Página minimalista com título, descrição, botão "Try again" e link "Go home"

### 9.4 `lovable-error-reporting.ts`
- Interface `Window.__lovableEvents` para report de erros ao Lovable
- Função `reportLovableError()`: chama `captureException` se disponível

### 9.5 Middleware de Erro (`start.ts`)
- `errorMiddleware`: middleware server-side que captura erros e retorna `renderErrorPage()`
- Ignora erros com `statusCode` (provavelmente erros HTTP intencionais)

### 9.6 Error Boundary (`__root.tsx`)
- `errorComponent`: componente de erro com console.error, report Lovable, botão "Try again" (router.invalidate) e "Go home"

---

## 10. Recursos Estáticos

### 10.1 Avatares
4 imagens PNG em `src/assets/avatar/cabeca/`:
- Amora.png
- Chico.png
- Pipoca.png
- Zeca.png

**Nota:** Nenhuma dessas imagens é referenciada no código atual.

### 10.2 Favicon
- `public/favicon.ico`

---

## 11. Server Functions

### 11.1 `example.functions.ts`
- `getGreeting()` — `createServerFn({ method: "POST" })`
- Validates input com Zod (`z.object({ name: z.string().min(1) })`)
- Retorna saudação + modo (dev/prod)
- **Não é usado** em nenhuma página atualmente (apenas exemplo)

### 11.2 `config.server.ts`
- `getServerConfig()` — retorna `{ nodeEnv: process.env.NODE_ENV }`
- Padrão `.server.ts`: não é bundled no client
- Comentários documentam padrões de acesso a env vars

---

## 12. Observações e Problemas Identificados

### 12.1 Problemas
1. **Duplicação na navegação:** `MobileShell.tsx` define 5 nav items, mas o label "Perfil" aponta para `/respiro` (mesma rota de "Respiro"). Provavelmente deveria apontar para uma rota `/perfil` ainda não criada ou usar outro ícone.
2. **NavItem "Perfil" ausente:** não há rota `/perfil` definida na route tree.
3. **Avatares não utilizados:** 4 PNGs de cabeças de personagens em `src/assets/avatar/cabeca/` não são importados em nenhum componente.
4. **Server Function não integrada:** `example.functions.ts` é apenas boilerplate — nenhuma página consome `getGreeting()`.
5. **Modo escuro incompleto:** apenas `--background` e `--foreground` são definidos em `.dark`, faltando as demais variáveis.
6. **Chat não funcional:** as mensagens e respostas da IA são puramente mockadas com `setTimeout`.
7. **Componentes shadcn/ui não utilizados:** 46 componentes instalados mas nenhum importado nas páginas atuais.

### 12.2 Observações
- Aplicação mobile-first com `max-w-[440px]` e `maximum-scale=1`
- Estilo visual consistente com paleta "Clay" — tons pastel suaves, efeitos glassmorphism, cantos arredondados
- Navegação inferior fixa com indicador de rota ativa
- Todos os dados são mockados (sem backend real)
- Código bem comentado em inglês, exceto textos de UI que estão em português
- Uso de OKLCH para cores (maior gama de cores perceptualmente uniforme)
- Padrão `.server.ts` para código server-side que não vai ao bundle client

### 12.3 Histórico de Commits
```
9289b8d teste
345ffe2 Update site info for publish
36a6a2a assets de cabeça inseridos, verificação das páginas verificada
0614fdf Criou layout mobile e 4 páginas
c3e612f Changes
51c0787 Changes
e44628f Changes
f120d60 Changes
f319173 template: tanstack_start_ts_2026-05-29
```

---

## 13. Scripts Disponíveis

| Script | Comando | Descrição |
|---|---|---|
| `dev` | `vite dev` | Servidor de desenvolvimento |
| `build` | `vite build` | Build de produção |
| `build:dev` | `vite build --mode development` | Build modo dev |
| `preview` | `vite preview` | Preview do build |
| `lint` | `eslint .` | Lint em todo o projeto |
| `format` | `prettier --write .` | Formatação Prettier |

---

## 14. Dependências Instaladas (node_modules notáveis)

Fora dos pacotes padrão, o `node_modules` contém custom builds de `zod` v4-mini e v4 mini (schemas, parse, iso, external, coerce), indicando uso experimental de Zod v4 em paralelo com v3.

---

## 15. Fluxo de Inicialização

1. **Vite** inicia com configuração do `@lovable.dev/vite-tanstack-config`
2. **Entrypoint SSR:** `src/server.ts` — importa `error-capture.ts`, faz lazy import do server entry do TanStack Start
3. **Router:** `src/router.tsx` — cria `QueryClient` + `createRouter` com routeTree
4. **Start instance:** `src/start.ts` — `createStart` com middleware de erro
5. **Route tree:** auto-gerada em `routeTree.gen.ts`
6. **Root layout:** `__root.tsx` — carrega CSS, fontes, providers, error/404
7. **Páginas renderizadas** dentro de `<MobileShell>` com navegação inferior
