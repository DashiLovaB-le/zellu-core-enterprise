<h1 align="center">Mundo Mental Care</h1>

<p align="center">
  <strong>Cuidado emocional no ritmo do trabalho</strong>
</p>

<p align="center">
  Companion digital de bem-estar emocional corporativo da <a href="#">DashiTecnology</a>.
</p>

<p align="center">
  <a href="#-funcionalidades">Funcionalidades</a> •
  <a href="#-stack-tecnológica">Stack</a> •
  <a href="#-início-rápido">Início Rápido</a> •
  <a href="#-estrutura-do-projeto">Estrutura</a> •
  <a href="#-ambiente">Ambiente</a> •
  <a href="#-deploy">Deploy</a> •
  <a href="#-licença">Licença</a>
</p>

---

## 📌 Sobre

**Mundo Mental Care** é o companion digital de bem-estar emocional da oferta DashiTecnology. Ele acompanha o colaborador no dia a dia — check-in, conversa assistida, hábitos, diário e plano de cuidado — e entrega visibilidade agregada para RH e gestão.

> O app **não substitui** psicólogos nem a plataforma clínica da DashiTecnology — ele **aumenta o engajamento** e sustenta o cuidado emocional entre as interações especializadas.

---

## ✨ Funcionalidades

### 🧑‍💻 Companion (Colaborador)
- **Chat com IA** — Conversa empática com GPT-4o-mini via OpenRouter, memória de contexto e respostas em Markdown
- **Check-in Matinal** — Fluxo em 3 etapas: sono, água e humor (6 principais + 19 extras)
- **Dashboard Emocional** — Distribuição de humor da semana (6 categorias, incl. humores extras), comparativo com a semana anterior e tendências de 30 dias
- **Timeline/Diário** — Visualização cronológica de atividades com calendário de humor
- **Meu Bem-estar** — Indicadores consolidados: água, sono, humor, energia, movimento, refeições
- **Plano de Cuidado** — Checklist diário personalizado com streaks e gamificação elegante
- **Espaço do Respiro** — Exercícios guiados de respiração com sons ambiente
- **Perfil** — Avatar, tema claro/escuro, preferências LGPD (IA, RH, e-mail), exportação e exclusão de dados

### 👥 Manager (RH/Gestor)
- **Dashboard RH** — KPIs agregados: estresse, energia, sono, engajamento (dados anonimizados)
- **Gestão de Equipes** — Visão por departamento com status Estável, Monitorar ou Atenção
- **Relatórios** — Exportação CSV de indicadores agregados

### 🏢 Admin (Portal Administrativo)
- **KPIs Globais** — Métricas de adoção, alertas ativos e resumo operacional
- **Gestão de Empresas** — CRUD completo de empresas e clientes B2B
- **Licenças e Contratos** — Controle de planos, validade e valores
- **Métricas de Uso** — DAU, WAU, MAU e taxa de adesão por empresa
- **Alertas Configuráveis** — Thresholds personalizados por empresa
- **Relatórios** — Exportação CSV e PDF

### 🤖 IA e Inteligência
- **Insights IA** — Análise automática de padrões com fallback local
- **IA Preventiva** — Detecção proativa de burnout, crises de sono, humor e desengajamento
- **Gamificação** — Streaks com marcos em 3, 7, 14, 21, 30, 60 e 90 dias

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| **Frontend** | React 19, TypeScript, Vite 7, TanStack Router |
| **Estilo** | Tailwind CSS 4, shadcn/ui (New York) |
| **Estado** | TanStack Query, Context API |
| **Backend** | TanStack Start (SSR), Nitro, Server Functions |
| **Banco de Dados** | PostgreSQL via Supabase |
| **Autenticação** | Supabase Auth (JWT + RLS) |
| **IA** | OpenRouter (GPT-4o-mini) |
| **Ícones** | Material Symbols Outlined, Lucide React |
| **Gráficos** | Recharts |
| **Animações** | Framer Motion |
| **Formulários** | React Hook Form + Zod |

---

## 🚀 Início Rápido

### Pré-requisitos

- [Node.js](https://nodejs.org/) 20.18+ (veja `package.json`) ou [Bun](https://bun.sh/) 1.0+
- Conta no [Supabase](https://supabase.com/)
- Chave de API do [OpenRouter](https://openrouter.ai/)

### Instalação

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/mundo-mental-care.git
cd mundo-mental-care

# Instale as dependências (use um dos)
bun install
# ou
npm install
```

### Configuração do Ambiente

Crie o arquivo `.env` na raiz do projeto:

```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anon
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role
OPENROUTER_API_KEY=sua_chave_openrouter
```

Copie `.env.example` para `.env` e preencha os valores. Variáveis `VITE_*` vão para o bundle do browser.

### Rodando o Projeto

```bash
npm run dev
npm run build
npm run preview
```

Acesse http://localhost:8080

---

## 📁 Estrutura do Projeto

```
mundo-mental-care/
├── public/                  # Assets estáticos (favicon, logo)
├── src/
│   ├── assets/              # Avatares e imagens
│   ├── components/          # Componentes React
│   │   ├── admin/           # Componentes do portal admin
│   │   ├── ui/              # shadcn/ui (46 componentes)
│   │   ├── MoodDistributionChart.tsx  # Barras semanais de humor
│   │   └── *.tsx            # Componentes compartilhados
│   ├── data/                # Dados estáticos (humores e categorias do gráfico)
│   ├── hooks/               # Custom hooks
│   ├── lib/                 # Lógica de negócio
│   │   ├── api/             # Server Functions (*.server.ts)
│   │   ├── services/        # Serviços de transformação
│   │   └── supabase/        # Client e configuração
│   ├── routes/              # Rotas (TanStack Router)
│   └── components/pages/    # Páginas (mobile/desktop)
├── supabase/
│   └── migrations/          # Migrations do banco de dados
├── documentacao/            # Documentação completa do projeto
└── vite.config.ts           # Configuração do Vite
```

---

## 🔐 Variáveis de Ambiente

| Variável | Descrição | Obrigatória |
|---|---|---|
| `VITE_SUPABASE_URL` | URL do projeto Supabase (pública) | ✅ |
| `VITE_SUPABASE_ANON_KEY` | Chave pública (anon) do Supabase | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de serviço (somente servidor) | ✅ |
| `OPENROUTER_API_KEY` | Chave de API do OpenRouter (somente servidor) | ✅ |
| `CRON_SECRET` | Autoriza o job de retenção LGPD | Produção |
| `APP_BASE_URL` / `VITE_APP_URL` | URL canônica (convites) | Produção |

> ⚠️ **Nunca** commite o arquivo `.env`. Segredos não podem ter prefixo `VITE_`.

---

## 🎨 Temas

O app suporta **tema claro** e **tema escuro**, com persistência entre sessões.

- **Companion:** Paleta clay com glassmorphism contido
- **Admin:** Paleta slate com visual B2B

---

## 📊 Banco de Dados

Principais tabelas:

| Tabela | Descrição |
|---|---|
| `profiles` | Usuários e roles (companion, manager, dev, admin) |
| `checkins` | Check-in matinal (sono, água, humor) |
| `chat_messages` | Mensagens do chat com IA |
| `diary_entries` | Entradas de diário |
| `wellness_plans` | Planos de cuidado |
| `companies` | Empresas clientes |
| `licenses` | Licenças e planos |
| `system_logs` | Logs operacionais |

Migrations estão em `supabase/migrations/`.

---

## 🧪 Testes

```bash
# Rodar testes unitários
bun test
# ou
npm run test

# Rodar com cobertura
bun test --coverage
```

---

## 📦 Deploy

A plataforma alvo é a **Vercel** (TanStack Start + Nitro). Detalhes em [`documentacao/DEPLOY-PLAYBOOK.md`](./documentacao/DEPLOY-PLAYBOOK.md).

1. Importe o repositório em [vercel.com/new](https://vercel.com/new).
2. Confirme o Framework Preset **TanStack Start**.
3. Cadastre as variáveis de `.env.example` em Production e Preview (`VITE_*` também no Build).
4. No Supabase, acrescente a URL da Vercel em Authentication → URL Configuration (Site URL e Redirect URLs).
5. Faça o primeiro deploy. O cron diário `/api/jobs/retention` já está em `vercel.json`.

---

## 📚 Documentação

Toda a documentação detalhada está na pasta [`documentacao/`](./documentacao/):

| Documento | Descrição |
|---|---|
| [PRD](./documentacao/PRD.md) | Product Requirement Document |
| [User Stories](./documentacao/USER-STORIES.md) | Histórias de usuário |
| [Roadmap](./documentacao/ROADMAP.md) | Cronograma de fases |
| [BRD](./documentacao/BRD.md) | Business Requirement Document |
| [FRD](./documentacao/FRD.md) | Functional Requirement Document |
| [SDD](./documentacao/SDD.md) | Arquitetura e Design do Sistema |
| [API Docs](./documentacao/API-DOCS.md) | Documentação de Server Functions |
| [Test Plan](./documentacao/TEST-PLAN.md) | Plano de testes |
| [Deploy Playbook](./documentacao/DEPLOY-PLAYBOOK.md) | Playbook de deploy e operação |

---


### Convenções

- **Commits:** [Conventional Commits](https://www.conventionalcommits.org/)
- **Branches:** `feature/`, `fix/`, `docs/`, `chore/`
- **Código:** ESLint + Prettier (executar `bun lint` e `bun format` antes de commitar)

---

## 📄 Licença

Este é um projeto privado da DashiTecnology. Todos os direitos reservados.

---

<p align="center">
  Isso é <a href="#">DashiTecnology</a>
</p>
