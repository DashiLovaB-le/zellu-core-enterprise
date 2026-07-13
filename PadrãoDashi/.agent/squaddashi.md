# SquadHashi - Skill Directory

> **Master skill registry for AgroFruta Insights project**
> 
> This document consolidates all tools, skills, agents, and workflows available in the `.agent` directory. Use it to orient new agents and understand the complete capability set of this project's development toolkit.

---

## Tech Stack Overview

| Category | Technology |
|----------|-----------|
| **Frontend** | React 18 + TypeScript + Vite + SWC |
| **UI Library** | shadcn/ui + Radix UI + Tailwind CSS 3 |
| **State Management** | TanStack React Query v5 |
| **Backend** | Supabase (PostgreSQL + Auth + Storage) |
| **Forms** | react-hook-form + Zod validation |
| **Routing** | React Router DOM v6 |
| **Charts** | Recharts |
| **Animations** | Framer Motion v11 (motion components, variants, spring physics) |
| **Testing** | Vitest + Testing Library + jsdom |
| **Linting** | ESLint 9 + typescript-eslint |
| **Package Manager** | Bun / npm |

---

## Available Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `dev` | `vite` | Start dev server (port 8080) |
| `build` | `vite build` | Production build |
| `build:dev` | `vite build --mode development` | Development build |
| `preview` | `vite preview` | Preview production build |
| `lint` | `eslint .` | Run ESLint |
| `test` | `vitest run` | Run tests once |
| `test:watch` | `vitest` | Run tests in watch mode |

---

# AGENTS (19 Total)

## Coordination & Planning

### orchestrator
- **Domain:** Multi-agent coordination
- **Use when:** Complex tasks requiring 3+ domain experts
- **Key capabilities:** Task decomposition, agent selection, conflict resolution, sequential/parallel invocation
- **Strict rule:** Minimum 3 agents per orchestration
- **Trigger:** multi-agent coordination, complex tasks requiring multiple perspectives

### project-planner
- **Domain:** Project planning and task breakdown
- **Use when:** Starting new projects, breaking down features
- **Key capabilities:** 4-phase workflow (Analysis → Planning → Solutioning → Implementation), dependency graphs, agent assignment
- **Trigger:** project planning, task breakdown, file structure planning

### product-manager
- **Domain:** Product requirements and user stories
- **Use when:** Gathering requirements, writing PRDs, prioritizing features
- **Key capabilities:** User story formatting (As a/I want/So that), MoSCoW prioritization, acceptance criteria (Given/When/Then)
- **Trigger:** requirements, user story, acceptance criteria, product specs

## Discovery & Analysis

### explorer-agent
- **Domain:** Codebase discovery and deep architectural analysis
- **Use when:** Mapping codebase, discovering dependencies, feasibility research
- **Key capabilities:** 3 modes (Audit, Mapping, Feasibility), Socratic Discovery Protocol, risk analysis
- **Trigger:** codebase exploration, dependencies, initial audits, refactoring plans

### code-archaeologist
- **Domain:** Legacy code analysis and refactoring
- **Use when:** Understanding undocumented systems, safe refactoring
- **Key capabilities:** Strangler Fig pattern, characterization tests, static analysis, modernization planning
- **Trigger:** legacy, refactor, spaghetti code, analyze repo, explain codebase

## Frontend & Mobile

### animation-patterns-framer-motion
- **What:** Framer Motion animation library patterns (motion components, variants, transitions, spring physics)
- **When:** Building animated components, interaction feedback, page transitions, data entry animations
- **Key rules:** Use motion.div/button/etc instead of HTML elements, always check prefers-reduced-motion, use variants for reusable logic, spring animations for natural feel
- **Patterns:** Entry animations (fade+slide 0.4s), Hover interactions (y:-4px), Card stagger (0.05-0.1s), Number counting (animated values), Pulse effects (scale loop)
- **Performance:** Transform + opacity only, avoid animating width/height/left/right
- **Accessibility:** Wrap in useReducedMotion() check, provide duration: 0 when disabled

### frontend-specialist
- **Domain:** React/Next.js frontend architecture with animation-first design
- **Use when:** Building UI components, state management, performance optimization, animated interactions
- **Key capabilities:** Anti-Safe Harbor enforcement, Purple Ban, deep design thinking, bundle analysis, accessibility, **Framer Motion integration**
- **Trigger:** component, react, vue, ui, ux, css, tailwind, responsive, animation

### mobile-developer
- **Domain:** React Native / Flutter mobile development
- **Use when:** Building mobile apps, native features, app store deployment
- **Key capabilities:** Touch-first design (44pt/48dp), offline patterns, SecureStore, FlatList optimization
- **Trigger:** mobile, react native, flutter, ios, android, app store, expo

## Backend & Database

### backend-specialist
- **Domain:** Server-side architecture and APIs
- **Use when:** Building APIs, server logic, authentication
- **Key capabilities:** REST/GraphQL/tRPC, layered architecture (Controller → Service → Repository), JWT/OAuth, Zod validation
- **Trigger:** backend, server, api, endpoint, database, auth

### database-architect
- **Domain:** Database schema design and optimization
- **Use when:** Designing schemas, query optimization, migrations
- **Key capabilities:** EXPLAIN ANALYZE, index strategy (B-tree, GIN, GiST), N+1 prevention, zero-downtime migrations, Supabase expertise
- **Trigger:** database, sql, schema, migration, query, postgres, index, table

## Testing & Quality

### test-engineer
- **Domain:** Testing pyramid and TDD
- **Use when:** Writing unit/integration/E2E tests, implementing TDD
- **Key capabilities:** Red → Green → Refactor, AAA pattern, coverage strategy, mocking principles
- **Trigger:** test, spec, coverage, jest, pytest, playwright, e2e, unit test

### qa-automation-engineer
- **Domain:** E2E test automation and CI/CD
- **Use when:** Setting up Playwright/Cypress, regression testing, CI pipelines
- **Key capabilities:** Page Object Model, unhappy path automation, flakiness detection, cross-browser testing
- **Trigger:** e2e, automated test, pipeline, playwright, cypress, regression

### debugger
- **Domain:** Systematic debugging and root cause analysis
- **Use when:** Investigating bugs, crashes, production issues
- **Key capabilities:** 4-phase process (Reproduce → Isolate → Understand → Fix), 5 Whys, git bisect, binary search debugging
- **Trigger:** bug, error, crash, not working, broken, investigate, fix

## Security

### security-auditor
- **Domain:** Defensive security and OWASP 2025
- **Use when:** Security reviews, vulnerability scanning, supply chain audits
- **Key capabilities:** Zero Trust principles, OWASP Top 10:2025, CVSS-based risk prioritization, code pattern detection
- **Trigger:** security, vulnerability, owasp, xss, injection, auth, encrypt, supply chain, pentest

### penetration-tester
- **Domain:** Offensive security and red team operations
- **Use when:** Penetration testing, exploit analysis, attack surface mapping
- **Key capabilities:** PTES methodology (7 phases), OWASP Top 10, MITRE ATT&CK, vulnerability prioritization
- **Trigger:** pentest, exploit, attack, hack, breach, pwn, redteam, offensive

## Performance & Operations

### performance-optimizer
- **Domain:** Performance profiling and optimization
- **Use when:** Optimizing Core Web Vitals, bundle size, runtime performance
- **Key capabilities:** LCP < 2.5s, INP < 200ms, CLS < 0.1, bundle analysis, Lighthouse, virtualization
- **Trigger:** performance, optimize, speed, slow, memory, cpu, benchmark, lighthouse

### devops-engineer
- **Domain:** Deployment, CI/CD, and production operations
- **Use when:** Deploying to production, setting up pipelines, server management
- **Key capabilities:** 5-phase deployment (Prepare → Backup → Deploy → Verify → Confirm/Rollback), blue-green/canary, monitoring, scaling
- **Trigger:** deploy, production, server, pm2, ssh, release, rollback, ci/cd

## Specialized

### seo-specialist
- **Domain:** SEO and Generative Engine Optimization (GEO)
- **Use when:** Optimizing for search engines, AI search visibility, schema markup
- **Key capabilities:** E-E-A-T framework, Core Web Vitals, GEO (ChatGPT/Claude/Perplexity), schema markup
- **Trigger:** SEO audits, Core Web Vitals, E-E-A-T, AI search visibility, schema markup

### documentation-writer
- **Domain:** Technical documentation
- **Use when:** Writing README, API docs, changelogs, ADRs (only on explicit request)
- **Key capabilities:** README structure, OpenAPI/Swagger, JSDoc/TSDoc, llms.txt, MCP-ready docs
- **Trigger:** documentation, README, API docs, changelog

### game-developer
- **Domain:** Multi-platform game development
- **Use when:** Building games (PC, Web, Mobile, VR/AR)
- **Key capabilities:** Game loop (Input → Update → Render), State Machine, Object Pooling, ECS, 60fps targets
- **Trigger:** game development, Unity, Godot, Unreal, Phaser, Three.js, game mechanics, multiplayer

---

# SKILLS (36 Total)

## Security & Vulnerability

### vulnerability-scanner
- **What:** Advanced vulnerability analysis (OWASP Top 10:2025, supply chain security, attack surface mapping)
- **When:** Scanning for vulnerabilities, security audits, prioritizing fixes
- **Key rules:** Think like an attacker, prioritize by exploitability + asset value, continuous scanning
- **Script:** `scripts/security_scan.py`

### red-team-tactics
- **What:** Adversary simulation based on MITRE ATT&CK framework
- **When:** Security assessments, penetration testing, defensive gap analysis
- **Key rules:** Follow attack lifecycle, minimize impact, document everything, stay in scope

## Performance

### performance-profiling
- **What:** Performance profiling methodology (Measure → Analyze → Optimize)
- **When:** Profiling web app performance, bundle analysis, runtime optimization
- **Key rules:** Profile first (never guess), Core Web Vitals targets, remove before optimizing
- **Script:** `scripts/lighthouse_audit.py`

### clean-code
- **What:** Pragmatic coding standards (SRP, DRY, KISS, YAGNI, naming, function rules)
- **When:** EVERY coding task (CRITICAL priority skill)
- **Key rules:** Max 20 lines per function, max 3 args, guard clauses, self-check before completing

## Frontend & Design

### frontend-design
- **What:** Web UI design thinking (UX psychology, color theory, typography, layout) with Framer Motion animations
- **When:** Designing components, layouts, color schemes, web interfaces, interaction states
- **Key rules:** Anti-Safe Harbor (no bento grids/hero splits), Purple Ban, always read ux-psychology.md first, USE FRAMER MOTION for all component animations
- **Animation defaults:** `whileHover={{ y: -4 }}` for cards, `initial={{ opacity: 0, y: 20 }}` for entries, `exit={{ opacity: 0 }}` for exits
- **Script:** `scripts/ux_audit.py`

### tailwind-patterns
- **What:** Tailwind CSS v4 principles with animation utilities (CSS-first config, container queries, OKLCH colors)
- **When:** Building UIs with Tailwind, responsive layouts, dark mode, component animations
- **Key rules:** v4 is CSS-first, mobile-first breakpoints, extract components at 3+ occurrences, use will-change-transform with Framer Motion

### react-patterns
- **What:** Modern React patterns (Server/Client components, hooks, state management) with animation hooks
- **When:** Building React apps, optimizing renders, managing state, animation sequences
- **Key rules:** Server Components default, state by complexity (useState → Context → React Query → Zustand), use motion.* components instead of div/span, implement variants for reusable animations, use useReducedMotion() for accessibility

### nextjs-best-practices
- **What:** Next.js App Router principles (Server vs Client, data fetching, routing)
- **When:** Building Next.js applications with App Router
- **Key rules:** Server Components default, 'use client' only when needed, always use loading.tsx + error.tsx

### webapp-testing
- **What:** E2E testing with Playwright
- **When:** Writing E2E tests, setting up Playwright, comprehensive web app testing
- **Key rules:** E2E for critical paths only, Page Object Model, auto-wait (never hardcoded sleeps)
- **Script:** `scripts/playwright_runner.py`

## Mobile

### mobile-design
- **What:** Mobile-first design for iOS/Android (touch, platform conventions, performance)
- **When:** Building React Native, Flutter, or native mobile apps
- **Key rules:** Mobile is NOT small desktop, touch targets 44-48px minimum, mandatory checkpoint before work
- **Script:** `scripts/mobile_audit.py`

## Backend & API

### api-patterns
- **What:** API design principles and decision trees (REST vs GraphQL vs tRPC)
- **When:** Choosing API style, designing endpoints, structuring responses
- **Key rules:** Never default to REST, no verbs in REST endpoints, consistent response formats
- **Script:** `scripts/api_validator.py`

### nodejs-best-practices
- **What:** Node.js development for 2025 (framework selection, layered architecture)
- **When:** Building Node.js apps, choosing frameworks, backend architecture
- **Key rules:** Choose framework by context (Hono → edge, Fastify → perf, NestJS → enterprise), layered architecture

### python-patterns
- **What:** Python development (FastAPI, Django, Flask, async patterns)
- **When:** Building Python apps, choosing frameworks
- **Key rules:** I/O-bound → async, CPU-bound → sync + multiprocessing, always type hints

## Database

### database-design
- **What:** Database design principles (schema, indexing, query optimization)
- **When:** Designing schemas, choosing databases, performance tuning
- **Key rules:** Ask user for DB preferences, don't default to PostgreSQL, plan for N+1 queries
- **Script:** `scripts/schema_validator.py`

## Testing & TDD

### tdd-workflow
- **What:** Test-Driven Development (RED → GREEN → REFACTOR)
- **When:** New features, bug fixes, complex logic
- **Key rules:** Three Laws of TDD, one assertion per test, watch test fail first

### testing-patterns
- **What:** Testing patterns (unit, integration, E2E, mocking)
- **When:** Writing tests, designing test architecture
- **Key rules:** Tests are documentation, one assert per test, mock external APIs/DB, fix flaky tests

### lint-and-validate
- **What:** Automatic quality control and static analysis
- **When:** After EVERY code modification (MANDATORY)
- **Key rules:** No code committed without passing checks, quality loop (Write → Audit → Fix)
- **Script:** `scripts/lint_runner.py`, `scripts/type_coverage.py`

### code-review-checklist
- **What:** Comprehensive code review checklist (correctness, security, performance, quality)
- **When:** Reviewing PRs, security audits, code quality reviews
- **Key rules:** Severity markers (BLOCKING/SUGGESTION/NIT/QUESTION), check AI-specific issues

## Architecture & Planning

### architecture
- **What:** Architectural decision-making framework (requirements, trade-offs, ADRs)
- **When:** Making architecture decisions, analyzing system design
- **Key rules:** Start simple, add complexity only when proven necessary, document with ADRs

### app-builder
- **What:** Full-stack application building orchestrator (13 project templates)
- **When:** Starting new projects from natural language description
- **Key rules:** Detect project type → choose stack → scaffold → coordinate agents

### plan-writing
- **What:** Structured task planning framework (breakdown, dependencies, verification)
- **When:** Implementing features, refactoring, multi-step work
- **Key rules:** Max 10 tasks, specific actions, dynamic naming ({task-slug}.md in project root)

### brainstorming
- **What:** Socratic questioning protocol for complex/vague requests
- **When:** Complex feature requests, new features, unclear requirements
- **Key rules:** STOP → ASK 3 questions (Purpose, Users, Scope) → WAIT, reveal architectural consequences

### behavioral-modes
- **What:** Six adaptive AI modes (BRAINSTORM, IMPLEMENT, DEBUG, REVIEW, TEACH, SHIP)
- **When:** Auto-detected from user triggers ("what if" → BRAINSTORM, "build" → IMPLEMENT, etc.)
- **Key rules:** IMPLEMENT = no tutorial explanations, quality > speed

## Deployment & Operations

### deployment-procedures
- **What:** Production deployment principles (5-phase workflow, rollback strategies)
- **When:** Deploying to production, planning deployment strategies
- **Key rules:** Never deploy on Friday, always backup, monitor 15+ min after deploy

### server-management
- **What:** Server management for production operations (PM2, monitoring, logging)
- **When:** Managing production servers, setting up monitoring, troubleshooting
- **Key rules:** Never run as root, monitor from day one, log rotation, "boring server = good server"

## Localization & SEO

### i18n-localization
- **What:** Internationalization and localization (react-i18next, RTL, pluralization)
- **When:** Making apps translatable, adding language support, RTL layouts
- **Key rules:** Never hardcode strings, plan for RTL from start, CSS logical properties
- **Script:** `scripts/i18n_checker.py`

### seo-fundamentals
- **What:** SEO principles (E-E-A-T, Core Web Vitals, technical SEO, schema markup)
- **When:** Optimizing for search engines, creating SEO-friendly content
- **Key rules:** Quality content + technical excellence + patience, never publish raw AI content

### geo-fundamentals
- **What:** Generative Engine Optimization for AI search (ChatGPT, Claude, Perplexity)
- **When:** Optimizing for AI-powered search citations
- **Key rules:** AI cites clear/authoritative content, question-based titles, TL;DR at top
- **Script:** `scripts/geo_checker.py`

## Shell & Platform

### bash-linux
- **What:** Essential Bash patterns for Linux/macOS
- **When:** Terminal work on macOS/Linux systems
- **Key rules:** `set -euo pipefail` in scripts, `&&` for success chains, text-based pipelines

### powershell-windows
- **What:** Critical PowerShell patterns and pitfalls for Windows
- **When:** PowerShell scripting on Windows systems
- **Key rules:** Parentheses required around cmdlets with logical operators, ASCII only (no Unicode/emojis)

## Documentation & MCP

### documentation-templates
- **What:** Documentation structure guidelines (README, API docs, ADRs, changelogs)
- **When:** Writing README, documenting APIs, creating changelogs
- **Key rules:** Comment WHY not WHAT, outdated docs worse than no docs, AI-friendly structure

### mcp-builder
- **What:** MCP (Model Context Protocol) server building
- **When:** Building MCP servers, designing AI-callable tools
- **Key rules:** Tool names action-oriented, single purpose, validated input schemas, structured output

## Specialized

### parallel-agents
- **What:** Multi-agent orchestration patterns (17 agents available)
- **When:** Complex tasks requiring multiple expertise domains
- **Key rules:** Logical order (Discovery → Analysis → Implementation → Testing), single synthesis report

### systematic-debugging
- **What:** 4-phase debugging methodology (Reproduce → Isolate → Understand → Fix)
- **When:** Debugging complex issues that require structured investigation
- **Key rules:** Never make random changes, reproduce first, find root cause not symptoms

### game-development
- **What:** Game development orchestrator (10 sub-skills: web, mobile, PC, VR/AR, 2D, 3D, design, multiplayer, art, audio)
- **When:** Building games on any platform
- **Key rules:** Game loop (input/update/render), State Machine first, profile before optimizing

### framer-motion-components
- **What:** Reusable animated component library (motion wrappers, transition presets, variant patterns)
- **When:** Building animated UI components, interaction patterns, page transitions
- **Available patterns:** FadeInUp, ScaleIn, StaggerContainer, HoverLift, PulseEffect, SlideInLeft
- **Key files:** src/hooks/useCountAnimation.ts, src/hooks/useMetricPulseAnimation.ts, src/components/dashboard/StatCard.tsx

---

# Animation Implementation Rules (Dashboard Components)

## StatCard Animation Pattern
```typescript
// All dashboard stat cards use Framer Motion
<motion.div
  initial={{ opacity: 0, y: 15 }}
  animate={{ opacity: 1, y: 0 }}
  whileHover={{ y: -4 }}
  transition={{ duration: 0.4, delay: index * 0.1 }}
  className="rounded-lg border bg-card p-6 shadow-sm will-change-transform"
/>
```

## Number Counting Animation (StatCard Values)
```typescript
// Animated number counting from 0 to target value
// Implementation: src/components/dashboard/StatCard.tsx

import { motion, useMotionValue, animate } from 'framer-motion';
import { useEffect, useState } from 'react';

const StatCard = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(value);
  const motionValue = useMotionValue(0);

  // Extract numeric value from formatted string (handles R$, %, etc)
  const numericValue = parseFloat(value.replace(/[^0-9.]/g, ''));

  useEffect(() => {
    const controls = animate(motionValue, numericValue, {
      duration: 1.5,              // 1500ms smooth animation
      ease: [0.25, 0.1, 0.25, 1], // easeOutQuad for professional feel
      delay: index * 0.1,          // Stagger effect (100ms per card)
      onUpdate: (latest) => {
        setDisplayValue(formatValue(latest)); // Format with prefix/suffix
      },
    });
    return controls.stop;
  }, [numericValue]);

  return <p>{displayValue}</p>;
};
```

**Key Rules:**
- Duration: 1.5s (1500ms) for smooth, professional animation
- Easing: `[0.25, 0.1, 0.25, 1]` (easeOutQuad) - starts fast, ends slow
- Stagger: `index * 0.1` (100ms delay per card) for cascading effect
- Format handling: Preserve currency (R$), percentages (%), thousand separators
- Accessibility: Respects `prefers-reduced-motion` (duration: 0 when disabled)
- Performance: Uses `useMotionValue` for 60fps animation without re-renders

**Format Handling:**
- Currency (R$): Remove thousand separators before parsing, re-add after animation
- Percentages (%): Keep decimal separator, don't remove dots
- Regular numbers: Parse directly, format with appropriate decimals

**When to Use:**
- Dashboard stat cards showing metrics (orders, revenue, rates)
- Any numeric display that benefits from visual impact on load
- Data that changes frequently (real-time updates)

## Chart Animation Pattern
```typescript
// Recharts with Framer Motion wrapper
<motion.div
  initial={{ opacity: 0, scale: 0.95 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{ duration: 0.6 }}
>
  <LineChart isAnimationActive={true} animationDuration={1500} />
</motion.div>
```

## List Stagger Pattern (RecentOrders)
```typescript
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

<motion.ul variants={containerVariants} initial="hidden" animate="visible">
  {orders.map((order, i) => (
    <motion.li variants={itemVariants} key={order.id} />
  ))}
</motion.ul>
```

## Accessibility Wrapper (All Animations - MANDATORY)
```typescript
import { useReducedMotion } from 'framer-motion';

function Component() {
  const shouldReduceMotion = useReducedMotion();
  return (
    <motion.div
      animate={shouldReduceMotion ? {} : { x: 100 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.5 }}
    />
  );
}
```

## Framer Motion Integration Checklist
- [ ] Import motion from 'framer-motion'
- [ ] Replace HTML elements with motion.* versions
- [ ] Define animation states: initial, animate, whileHover, whileTap, exit
- [ ] Add transition prop with duration (0.3-0.6s typical)
- [ ] Check prefers-reduced-motion via useReducedMotion()
- [ ] Use will-change-transform Tailwind class for animated elements
- [ ] Test on mobile (ensure touch targets remain 44-48px)
- [ ] Wrap with AnimatePresence if using exit animations
- [ ] Run performance audit (60fps target on mobile)
- [ ] Document animation intent with JSDoc comment

---

# WORKFLOWS (11 Total)

## /brainstorm - Structured Idea Exploration
- **Purpose:** Explore multiple options before implementation
- **Process:** Understand goal → Generate 3+ options → Compare and recommend
- **Key rule:** No code, visual when helpful, honest tradeoffs, defer to user

## /create - Create Application
- **Purpose:** Start new application creation process
- **Process:** Request analysis → Project planning → Build → Preview
- **Key rule:** If unclear, ask (type of app, basic features, who will use it)

## /debug - Systematic Problem Investigation
- **Purpose:** Investigate issues, errors, or unexpected behavior
- **Process:** Gather info → Form hypotheses → Investigate → Fix and prevent
- **Key rule:** Ask before assuming, test hypotheses, explain why, prevent recurrence

## /deploy - Production Deployment
- **Purpose:** Production releases with pre-flight checks and verification
- **Sub-commands:** `/deploy check`, `/deploy preview`, `/deploy production`, `/deploy rollback`
- **Key rule:** Pre-deploy checklist (lint, tests, audit, no console.log), monitor after deploy

## /orchestrate - Multi-Agent Coordination
- **Purpose:** Coordinate 3+ agents for complex tasks
- **Process:** Phase 1 (Planning with project-planner) → User approval → Phase 2 (Parallel implementation)
- **Key rule:** MINIMUM 3 agents, user approval required before Phase 2, verification scripts mandatory

## /plan - Project Planning Mode
- **Purpose:** Create project plan (no code writing)
- **Process:** Socratic Gate → Create PLAN-{slug}.md with task breakdown
- **Key rule:** NO CODE, dynamic naming, Socratic Gate before planning

## /test - Test Generation and Execution
- **Purpose:** Generate tests, run existing tests, check coverage
- **Sub-commands:** `/test [file/feature]`, `/test coverage`, `/test watch`
- **Key rule:** Test behavior not implementation, AAA pattern, mock external dependencies

## /enhance - Code Enhancement
- **Purpose:** Enhance and improve existing code
- **Process:** Analyze current state → Identify improvements → Apply enhancements → Verify

## /preview - Preview Application
- **Purpose:** Start preview server and present URL to user
- **Process:** Build application → Start preview server → Present URL

## /status - Project Status
- **Purpose:** Check and report project status
- **Process:** Analyze current state → Report progress → Identify blockers → Recommend next steps

## /ui-ux-pro-max - AI-Powered Design Intelligence
- **Purpose:** Comprehensive design system generation (50+ styles, 97 color palettes, 57 font pairings)
- **Process:** Analyze requirements → Generate design system → Supplement with searches → Apply stack guidelines
- **Key rule:** Always start with `--design-system`, default stack is html-tailwind
- **Script:** `.shared/ui-ux-pro-max/scripts/search.py`

---

# CORE RULES & PRINCIPLES

## Language Handling
- Respond in user's language (PT-BR when requested)
- Code comments/variables always in English

## Clean Code (Global Mandatory)
- Concise, direct, solution-focused
- No verbose explanations, no over-commenting, no over-engineering
- Every agent documents their own changes
- Every agent writes and runs tests for their changes

## Socratic Gate
- For complex requests: STOP → ASK minimum 3 questions → WAIT
- Never assume, if 1% is unclear, ASK
- Questions must reveal architectural consequences

## Deployment & Safety
- 5-Phase Deployment Process (Prepare → Backup → Deploy → Verify → Confirm/Rollback)
- Always verify environment variables and secrets security
- Measure first, optimize second

## File Dependency Awareness
- Before modifying ANY file: check dependents, update all affected files together

## Quality Loop
- Write/Edit → Run Audit → Analyze Report → Fix & Repeat
- No code committed or "done" without passing checks

## Dashboard Icon Assets (Branding)
- **Location:** `src/assets/icons/` (pedidos.png, enviados.png, entregues.png, entregaok.png)
- **Usage:** Import como módulo (ex: `import pedidosIcon from "@/assets/icons/pedidos.png"`) e passar para StatCard via `iconSrc` prop
- **Sizing:** StatCard renderiza ícone com `h-[1.875rem] w-[1.875rem]` (25% boost: 1.5rem × 1.25 = 1.875rem/30px) em container fixo `h-10 w-10`, mantendo visual clean e ícone destacado
- **Fallback:** Quando `iconSrc` é string, StatCard renderiza `<img>` com `object-contain`; caso contrário renderiza Lucide component
- **Aplicação Atual:** Aba Logística (Pedidos Ativos, Em Rota, Entregues, Taxa de Entrega) usa PNG assets exclusivamente
- **Hover Animation:** Framer Motion `whileHover={{ y: -4 }}` eleva o card 4px com transição suave, combinado com Tailwind `hover:shadow-elevated` para shadow increase. Efeito sutil e elegante.

---
- **Method:** Raw HTML/CSS string injection via `window.open("", "_blank")` sem dimensões restritas (para forçar nova guia no navegador). Usar delay de 500ms antes de `print()` para carregamento seguro de web fonts.
- **Topografia & Theming:** Minimalista B2B (estilo CEO/Sebrae). Fontes `Plus Jakarta Sans` (Cabeçalhos/Valores) e `Inter` (Dados). Cor primária Emerald (`#047857`).
- **Tabelas:** Usar `border-collapse: separate` e `border-spacing: 0`. O cabeçalho (`thead tr th`) deve ter fundo claro (`--primary-light: #ecfdf5`) com cantos arredondados de 8px nas extremidades (`th:first-child`, `th:last-child`).
- **Pílulas de Status:** Alta legibilidade. Devem usar `padding: 6px 12px`, `font-weight: 700`, leve `box-shadow` e um contorno sutil misturando a cor principal com 20% de opacidade (ex: `outline: 1px solid {text-color}33`).

## Dashboard Tab Pattern (Index.tsx)
- **Architecture:** Usar `useState<TabType>` para gerenciar aba ativa; cada aba renderiza um conjunto independente de StatCards + charts.
- **Tab Navigation:** Border-bottom com cor `primary` quando ativa. Ícone + label em cada abaBotões com `transition-all` e hover state.
- **Content Sections:** Usar `space-y-6` para grid de 4 StatCards (responsive: `sm:grid-cols-2 lg:grid-cols-4`) seguido de charts/widgets.
- **Data Source:** Tabela `agrofruta_pedidos` (fonte canônica de dados de pedidos do sistema)
- **Abas Atuais:** 
  - `logistics` (Pedidos, Em Transporte, Entregues, Taxa de Entrega) → OrdersEvolutionChart + RecentOrders
  - `financial` (Receita, Contas a Receber, Contas a Pagar, Resultado Operacional) → RevenueChart

## Logistics Tab Metrics (Real Database Data)
- **Pedidos Ativos:** Count de pedidos com `status !== "cancelled"` nos últimos 30 dias → **Ícone:** pedidos.png
- **Em Rota:** Count de pedidos com `status = "shipped"` (sem filtro de data) → **Ícone:** enviados.png
- **Entregues:** Count de pedidos com `status = "delivered"` nos últimos 30 dias → **Ícone:** entregues.png
- **Taxa de Entrega:** % calculado como (Entregues / Pedidos Ativos) * 100, com indicador de meta (≥95% = positive, <95% = negative) → **Ícone:** entregaok.png
- **Fonte de Cálculo:** Query única em dashboard-stats que filtra pedidos por status e data_pedido
- **Atualização:** Real-time via Supabase Realtime + fallback polling (60s), stale time 30s
- **Icon Implementation:** Todos os cards da aba Logística usam `iconSrc` com imports PNG assets (não Lucide icons)
- **Real-time Hook:** `useRealtimeDashboardStats` (src/hooks/useRealtimeDashboardStats.ts) - subscreve a tabela `agrofruta_pedidos` e invalida queries automaticamente

## Orders Evolution Chart (OrdersEvolutionChart.tsx)
- **Purpose:** Mostrar evolução do número de pedidos no mês atual com animação suave
- **Chart Type:** LineChart (Recharts) com efeito gradiente abaixo da linha
- **Data Source:** `agrofruta_pedidos` com filtro de data_pedido no mês atual
- **Styling:** 
  - Cor: `hsl(142 71% 45%)` (Green primary) com suporte a dark mode `hsl(142 76% 36%)`
  - Gradient fill com `linearGradient` (Recharts defs) para efeito de iluminação
  - Animação: `animationDuration={1500}` com `ease-in-out`
  - Dots: `r=4` com stroke branco, activeDot `r=6`
- **Data:** Agrupa pedidos por dia do mês atual, preenche dias sem pedidos com 0
- **Features:** Motion wrapper com fade-in, responsivo com ChartContainer

## Recent Orders Component (RecentOrders.tsx)
- **Purpose:** Exibir pedidos recentes (últimos 30 dias) para visualização rápida
- **Data Source:** `agrofruta_pedidos` com join em `agrofruta_clientes` via `agrofruta_pedidos_cliente_id_fkey`
- **Display:** Máximo 8 pedidos, scrollable até 400px com hover effect
- **Columns:** Número do pedido (numero_pedido), nome do cliente (via join), valor, data (formatada "dia mês"), status com ícone
- **Styling:** Status badge com cor dinamicamente definida baseada no campo `status` da tabela
- **Features:** Link "Ver todos" para página `/pedidos`, sem opções de edição (apenas visualização)

## Critical Rule: Always Use agrofruta_pedidos for Orders Data
- `agrofruta_pedidos` é a **tabela canônica** para dados de pedidos do sistema (contém todos os campos essenciais: numero_pedido, cliente_id, status, data_pedido, valor_total, etc.)
- Não usar `insummo_pedido_cliente` no dashboard (tabela legada/integração apenas)
- Sempre fazer join com `agrofruta_clientes` usando `agrofruta_pedidos_cliente_id_fkey` quando nome do cliente é necessário
- Status válidos: "production" | "separation" | "shipped" | "delivered" | "cancelled" | "approved" | "repeat" | "typing" | "atrasado"
- **OPERACIONAL:** Todos os cards na aba Logística dependem de dados reais do `agrofruta_pedidos`. Qualquer modificação nos filtros de status ou data DEVE ser propagada para todos os componentes que usam essas métricas (StatCard no Index.tsx, cálculos em dashboard-stats, etc). Mudanças no banco sem atualizar queries resultará em inconsistências críticas.

## Real-time Dashboard Updates (Supabase Realtime)
- **Implementation:** `useRealtimeDashboardStats` hook (src/hooks/useRealtimeDashboardStats.ts)
- **Subscription:** Supabase Realtime channel listening to `agrofruta_pedidos` table changes
- **Events:** INSERT, UPDATE, DELETE operations trigger automatic query invalidation
- **Behavior:** When database changes occur, React Query automatically refetches dashboard stats
- **Fallback:** Polling every 60 seconds as backup mechanism
- **Stale Time:** 30 seconds for near real-time feel
- **Performance:** Minimal overhead - only invalidates queries, doesn't fetch on every change
- **Usage Pattern:**
```typescript
// In dashboard component
import { useRealtimeDashboardStats } from '@/hooks/useRealtimeDashboardStats';

const Dashboard = () => {
  const [periodStart, setPeriodStart] = useState<Date>(new Date());
  const [periodEnd, setPeriodEnd] = useState<Date>(new Date());
  
  // Enable real-time updates
  useRealtimeDashboardStats(periodStart, periodEnd);
  
  // Regular useQuery - will auto-refetch on realtime events
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats', periodStart, periodEnd],
    queryFn: fetchStats,
    staleTime: 1000 * 30, // 30s
    refetchInterval: 1000 * 60, // 60s fallback
  });
};
```

**Key Benefits:**
- Instant updates when orders change (create, update, delete)
- No manual refresh needed
- Efficient - uses WebSocket connection
- Automatic cleanup on component unmount
- Works across all dashboard metrics simultaneously

---

# VERIFICATION SCRIPTS (12 Total)

| Script | Skill | When to Use |
|--------|-------|-------------|
| `security_scan.py` | vulnerability-scanner | Always on deploy |
| `dependency_analyzer.py` | vulnerability-scanner | Weekly / Deploy |
| `lint_runner.py` | lint-and-validate | Every code change |
| `test_runner.py` | testing-patterns | After logic change |
| `schema_validator.py` | database-design | After DB change |
| `ux_audit.py` | frontend-design | After UI change |
| `accessibility_checker.py` | frontend-design | After UI change |
| `seo_checker.py` | seo-fundamentals | After page change |
| `bundle_analyzer.py` | performance-profiling | Before deploy |
| `mobile_audit.py` | mobile-design | After mobile change |
| `lighthouse_audit.py` | performance-profiling | Before deploy |
| `playwright_runner.py` | webapp-testing | Before deploy |

---

# HOW TO USE THIS DOCUMENT

1. **Orienting New Agents:** Share this document as the master reference for all available tools
2. **Selecting the Right Tool:** Match the task domain to the appropriate agent + skill
3. **Triggering Workflows:** Use `/command` syntax for structured workflows
4. **Running Verification:** Always run appropriate verification scripts after changes
5. **Building Complex Features:** Use `/orchestrate` to coordinate multiple agents

---

*Generated: April 2026 | Project: AgroFruta Insights | Source: .agent directory*
