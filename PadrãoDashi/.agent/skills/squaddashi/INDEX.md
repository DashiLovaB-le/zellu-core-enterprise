# 📑 Squad Dashi - Índice de Conteúdo

## 🌾 Agrofruta Insights Toolkit

Guia estratégico para desenvolvimento de alta qualidade com foco em segurança, performance, clean-code, design, front-end, back-end, banco de dados e mobile.

---

## 📋 Seções Principais

### 1. 🔐 SEGURANÇA (CRÍTICO)
- **Skill:** `vulnerability-scanner`
- **Foco:** OWASP Top 10:2025, detecção de secrets, análise de dependências
- **Scripts:** `security_scan.py`
- **Quando usar:** Antes de cada deploy, após adicionar dependências, em PRs

### 2. ⚡ PERFORMANCE (CRÍTICO)
- **Skill:** `performance-profiling`
- **Foco:** Core Web Vitals, Lighthouse, bundle analysis
- **Scripts:** `lighthouse_audit.py`
- **Quando usar:** Após mudanças significativas, antes de deploy, em PRs
- **Targets:** LCP < 2.5s, INP < 200ms, CLS < 0.1

### 3. 🧹 CLEAN CODE (CRÍTICO)
- **Skill:** `clean-code`
- **Foco:** SRP, DRY, KISS, YAGNI, Boy Scout
- **Quando usar:** Em TODA mudança de código
- **Checklist:** Nomes claros, funções pequenas, sem comentários óbvios, estrutura plana

### 4. 🎨 DESIGN & UX (ALTO)
- **Skill:** `frontend-design`
- **Foco:** UX Psychology, 60-30-10 rule, accessibility
- **Scripts:** `ux_audit.py`, `accessibility_checker.py`
- **Quando usar:** Ao criar/modificar componentes, páginas, layouts
- **Padrão:** Verde (natureza) + Neutros (profissional)

### 5. 🚀 FRONT-END (ALTO)
- **Skill:** `react-patterns`
- **Foco:** React 18.3, hooks, state management, performance
- **Stack:** React + Vite + React Router + shadcn/ui + Tailwind
- **Quando usar:** Ao criar componentes, páginas, lógica de UI
- **Padrões:** Compound Components, Custom Hooks, Context API

### 6. 🔌 BACK-END (MÉDIO-ALTO)
- **Skill:** `nodejs-best-practices`
- **Foco:** APIs, validação, error handling, security
- **Frameworks:** Hono (edge) ou Express (tradicional)
- **Quando usar:** Ao criar APIs, serviços, lógica de negócio
- **Padrões:** REST, GraphQL, tRPC

### 7. 🗄️ BANCO DE DADOS (MÉDIO)
- **Skill:** `database-design`
- **Foco:** Schema design, indexing, migrations, optimization
- **Stack:** PostgreSQL (Neon) + Prisma
- **Quando usar:** Ao planejar schema, migrations, queries
- **Entidades:** Usuários, Propriedades, Culturas, Dados

### 8. 📱 MOBILE (MÉDIO)
- **Skill:** `mobile-design`
- **Foco:** Touch-first, responsive, offline-ready, battery-conscious
- **Quando usar:** Se expandir para mobile (React Native, Flutter)
- **Princípios:** Touch targets ≥ 44-48px, thumb zone, offline support

### 9. ✅ TESTES (ALTO)
- **Skill:** `testing-patterns`
- **Foco:** Unit, Integration, E2E tests
- **Stack:** Vitest + React Testing Library + Playwright
- **Quando usar:** Ao implementar features, antes de merge
- **Pirâmide:** Unit (muitos) > Integration (alguns) > E2E (poucos)

### 10. 🔍 DEBUGGING (MÉDIO)
- **Skill:** `systematic-debugging`
- **Foco:** 4-fase methodology (Reproduzir, Isolar, Entender, Verificar)
- **Quando usar:** Ao investigar bugs, issues em produção
- **Método:** 5 Whys para root cause analysis

### 11. 📊 SEO & ANALYTICS (MÉDIO)
- **Skill:** `seo-fundamentals`
- **Foco:** Meta tags, Core Web Vitals, schema markup
- **Quando usar:** Ao criar landing pages, conteúdo público
- **Checklist:** Títulos 50-60 chars, descrições 150-160 chars, alt text

### 12. 🚀 DEPLOYMENT (ALTO)
- **Skill:** `deployment-procedures`
- **Foco:** Safe deployment, rollback strategies, verification
- **Plataformas:** Vercel (frontend), Railway (backend), Fly.io (containerized)
- **Quando usar:** Antes de cada release
- **Workflow:** Pre-deploy → Backup → Deploy → Verify → Confirm/Rollback

---

## 📋 SCRIPTS MESTRES

### Script 1: `checklist.py` (Desenvolvimento)
**Uso:** Após cada mudança significativa
```bash
python .agent/scripts/checklist.py .
```
**Verifica:** Segurança, Qualidade, Testes, UX, SEO
**Tempo:** ~2-3 minutos

### Script 2: `verify_all.py` (Pré-Deploy)
**Uso:** Antes de cada release
```bash
python .agent/scripts/verify_all.py . --url http://localhost:5173
```
**Verifica:** Tudo do checklist.py + Performance, E2E, Bundle, Mobile, i18n
**Tempo:** ~5-10 minutos

---

## 🎯 WORKFLOW RECOMENDADO

### Desenvolvimento Diário
1. Criar branch feature
2. Implementar mudanças
3. Rodar: `npm run lint && npm run test`
4. Rodar: `python .agent/scripts/checklist.py .`
5. Commit & Push
6. PR review
7. Merge

### Antes de Deploy
1. Merge para main
2. Build: `npm run build`
3. Rodar: `python .agent/scripts/verify_all.py . --url http://localhost:5173`
4. Revisar relatório
5. Deploy em staging
6. Testes manuais
7. Deploy em produção
8. Monitorar por 15+ minutos

---

## 🤖 AGENTES ESPECIALIZADOS

| Agente | Quando Usar | Skills |
|--------|-------------|--------|
| **frontend-specialist** | UI/UX, componentes | react-patterns, tailwind-patterns, frontend-design |
| **backend-specialist** | APIs, lógica | api-patterns, nodejs-best-practices |
| **database-architect** | Schema, queries | database-design, prisma-expert |
| **security-auditor** | Segurança | vulnerability-scanner, red-team-tactics |
| **performance-optimizer** | Speed, Web Vitals | performance-profiling |
| **test-engineer** | Testes | testing-patterns, webapp-testing |
| **debugger** | Bugs, issues | systematic-debugging |
| **devops-engineer** | Deploy, CI/CD | deployment-procedures, docker-expert |

---

## 📚 SKILLS RELACIONADAS

### Frontend & UI
- `react-patterns` - React hooks, state, performance
- `nextjs-best-practices` - App Router, Server Components
- `tailwind-patterns` - Tailwind CSS v4 utilities
- `frontend-design` - UI/UX patterns, design systems
- `ui-ux-pro-max` - 50 styles, 21 palettes, 50 fonts

### Backend & API
- `api-patterns` - REST, GraphQL, tRPC
- `nestjs-expert` - NestJS modules, DI, decorators
- `nodejs-best-practices` - Node.js async, modules
- `python-patterns` - Python standards, FastAPI

### Database
- `database-design` - Schema design, optimization
- `prisma-expert` - Prisma ORM, migrations

### Testing & Quality
- `testing-patterns` - Jest, Vitest, strategies
- `webapp-testing` - E2E, Playwright
- `tdd-workflow` - Test-driven development
- `code-review-checklist` - Code review standards
- `lint-and-validate` - Linting, validation

### Security
- `vulnerability-scanner` - Security auditing, OWASP
- `red-team-tactics` - Offensive security

### Architecture & Planning
- `app-builder` - Full-stack app scaffolding
- `architecture` - System design patterns
- `plan-writing` - Task planning, breakdown
- `brainstorming` - Socratic questioning

### Mobile
- `mobile-design` - Mobile UI/UX patterns

### SEO & Growth
- `seo-fundamentals` - SEO, E-E-A-T, Core Web Vitals
- `geo-fundamentals` - GenAI optimization

### Deployment
- `deployment-procedures` - CI/CD, deploy workflows
- `docker-expert` - Containerization, Compose
- `server-management` - Infrastructure management

---

## 🔗 REFERÊNCIAS RÁPIDAS

### Documentação Oficial
- [React 18 Docs](https://react.dev)
- [Vite Docs](https://vitejs.dev)
- [Tailwind CSS v3](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com)
- [React Router v6](https://reactrouter.com)
- [React Query](https://tanstack.com/query)
- [Zod](https://zod.dev)

### Ferramentas Internas
- `.agent/skills/` - 36 skills especializadas
- `.agent/agents/` - 19 agentes especializados
- `.agent/scripts/` - Scripts de validação
- `.agent/workflows/` - Automações

---

## ✨ PRIORIDADES

1. 🔐 **Segurança** - Sempre primeiro
2. ⚡ **Performance** - Usuários felizes
3. 🧹 **Clean Code** - Manutenibilidade
4. 🎨 **Design** - Experiência
5. ✅ **Testes** - Confiança

---

## 📖 Como Usar Este Índice

1. **Encontre sua tarefa** na seção apropriada
2. **Leia a skill correspondente** para orientação detalhada
3. **Use os scripts** para validação automática
4. **Consulte os agentes** para trabalho especializado
5. **Siga o workflow** recomendado

---

> **Desenvolvido com ❤️ para Agrofruta Insights**
> 
> *Qualidade, segurança e performance em cada linha de código.*
