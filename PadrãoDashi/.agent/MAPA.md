# MAPA DO ECOSSISTEMA `.agent`

> Estrutura completa e organizada de todas as ferramentas do Antigravity Kit.
> Atualizado: Julho 2026

---

## ARVORE DE DIRETORIOS

```
.agent/
├── agents/                   19 agentes especialistas
├── skills/                   40 skills proprias + 2 sub-ecossistemas
│   ├── animacoes-js/         (skill: animacoes JS c/ Anime.js)
│   ├── anthropics/           (ecossistema: 15 skills da Anthropic)
│   ├── huggingface/          (ecossistema: 12 skills da HuggingFace)
│   ├── supabase/             (skill: Supabase completo)
│   └── ...                   (37 skills nativas)
├── workflows/                11 workflows slash command
├── vendor/                   3 repositorios externos
│   ├── awesome-agent-skills-list/
│   ├── design-skills/        (18 skills UX)
│   └── openai/               (42 skills OpenAI)
├── shared/                   assets compartilhados (ui-ux-pro-max data/scripts)
├── rules/                    regras globais (GEMINI.md)
├── scripts/                  scripts mestre de validacao
├── .archive/                 arquivos de sessao anteriores
├── ARCHITECTURE.md           arquitetura original
├── MAPA.md                   este documento
└── squaddashi.md             registro mestre do projeto AgroFruta
```

---

## 1. AGENTES (19)

### Coordenacao & Planejamento
| Arquivo | Foco | Skills Principais |
|---------|------|-------------------|
| `orchestrator.md` | Coordenacao multi-agente | parallel-agents |
| `project-planner.md` | Descoberta, planejamento | brainstorming, plan-writing |
| `product-manager.md` | Requisitos, user stories | plan-writing, brainstorming |

### Descoberta & Analise
| Arquivo | Foco | Skills Principais |
|---------|------|-------------------|
| `explorer-agent.md` | Mapeamento de codebase | - |
| `code-archaeologist.md` | Codigo legado, refatoracao | systematic-debugging |

### Frontend & Mobile
| Arquivo | Foco | Skills Principais |
|---------|------|-------------------|
| `frontend-specialist.md` | Web UI/UX | react-patterns, tailwind-patterns, frontend-design |
| `mobile-developer.md` | iOS, Android, RN | mobile-design |
| `game-developer.md` | Jogos multiplataforma | game-development |

### Backend & Dados
| Arquivo | Foco | Skills Principais |
|---------|------|-------------------|
| `backend-specialist.md` | API, servidor | api-patterns, nodejs-best-practices |
| `database-architect.md` | Schema, SQL, Supabase | database-design, supabase |

### Testes & Qualidade
| Arquivo | Foco | Skills Principais |
|---------|------|-------------------|
| `test-engineer.md` | Estrategias de teste | testing-patterns, tdd-workflow |
| `qa-automation-engineer.md` | E2E, CI | webapp-testing, testing-patterns |
| `debugger.md` | Analise de causa raiz | systematic-debugging |

### Seguranca
| Arquivo | Foco | Skills Principais |
|---------|------|-------------------|
| `security-auditor.md` | Auditoria defensiva | vulnerability-scanner |
| `penetration-tester.md` | Ofensivo | red-team-tactics |

### Performance & Operacoes
| Arquivo | Foco | Skills Principais |
|---------|------|-------------------|
| `performance-optimizer.md` | Web Vitals, bundle | performance-profiling |
| `devops-engineer.md` | CI/CD, deploy | deployment-procedures, server-management |

### Especializados
| Arquivo | Foco | Skills Principais |
|---------|------|-------------------|
| `seo-specialist.md` | SEO, GEO | seo-fundamentals, geo-fundamentals |
| `documentation-writer.md` | Documentacao tecnica | documentation-templates |

---

## 2. SKILLS NATIVAS (40)

### Frontend & UI
| Skill | Descricao | Scripts |
|-------|-----------|---------|
| `react-patterns` | React hooks, estado, performance | - |
| `nextjs-best-practices` | App Router, Server Components | - |
| `tailwind-patterns` | Tailwind CSS v4 | - |
| `frontend-design` | UI/UX patterns, design systems | `scripts/ux_audit.py` |
| `animacoes-js` | Animacoes JS com Anime.js (steering) | - |

### Backend & API
| Skill | Descricao | Scripts |
|-------|-----------|---------|
| `api-patterns` | REST, GraphQL, tRPC | - |
| `nodejs-best-practices` | Node.js async, modulos | - |
| `python-patterns` | Python, FastAPI | - |

### Database
| Skill | Descricao | Scripts |
|-------|-----------|---------|
| `database-design` | Schema, indexing, SQL | `scripts/schema_validator.py` |
| `supabase` | Supabase completo (auth, storage, realtime) | - |

### Arquitetura & Planejamento
| Skill | Descricao | Scripts |
|-------|-----------|---------|
| `app-builder` | Scaffolding full-stack (13 templates) | - |
| `architecture` | Decisoes arquiteturais, ADRs | - |
| `plan-writing` | Task planning estruturado | - |
| `brainstorming` | Protocolo Socratico | - |

### Testes & Qualidade
| Skill | Descricao | Scripts |
|-------|-----------|---------|
| `testing-patterns` | Jest, Vitest, estrategias | `scripts/test_runner.py` |
| `tdd-workflow` | Test-Driven Development | - |
| `webapp-testing` | E2E com Playwright | `scripts/playwright_runner.py` |
| `lint-and-validate` | Linting, validacao | `scripts/lint_runner.py`, `type_coverage.py` |
| `code-review-checklist` | Code review standards | - |

### Seguranca
| Skill | Descricao | Scripts |
|-------|-----------|---------|
| `vulnerability-scanner` | OWASP, auditoria | `scripts/security_scan.py` |
| `red-team-tactics` | Ofensivo, MITRE ATTACK | - |

### Mobile
| Skill | Descricao | Scripts |
|-------|-----------|---------|
| `mobile-design` | Mobile UI/UX patterns | `scripts/mobile_audit.py` |

### Game Development
| Skill | Descricao | Sub-skills |
|-------|-----------|------------|
| `game-development` | Jogos multiplataforma | web, mobile, pc, vr-ar, game-design, multiplayer, art, audio |

### Performance
| Skill | Descricao | Scripts |
|-------|-----------|---------|
| `performance-profiling` | Web Vitals, bundle | `scripts/lighthouse_audit.py` |

### SEO & Growth
| Skill | Descricao | Scripts |
|-------|-----------|---------|
| `seo-fundamentals` | SEO, E-E-A-T | `scripts/seo_checker.py` |
| `geo-fundamentals` | Generative Engine Optimization | `scripts/geo_checker.py` |

### Shell & CLI
| Skill | Descricao |
|-------|-----------|
| `bash-linux` | Linux commands, scripting |
| `powershell-windows` | Windows PowerShell |

### DevOps & Infra
| Skill | Descricao |
|-------|-----------|
| `deployment-procedures` | CI/CD, deploy workflows |
| `server-management` | Gerenciamento de servidores |

### Documentacao & MCP
| Skill | Descricao |
|-------|-----------|
| `documentation-templates` | README, API docs, ADRs |
| `mcp-builder` | Model Context Protocol servers |
| `i18n-localization` | Internacionalizacao |

### Outras
| Skill | Descricao |
|-------|-----------|
| `clean-code` | Coding standards (GLOBAL) |
| `behavioral-modes` | Modos de agente (BRAINSTORM, IMPLEMENT, etc.) |
| `parallel-agents` | Orquestracao multi-agente |
| `systematic-debugging` | Debug 4-fases |
| `squaddashi` | Skill mestre do projeto AgroFruta |

---

## 3. ECOSSISTEMA ANTHROPIC (15 skills em `skills/anthropics/`)

| Skill | Descricao | Scripts |
|-------|-----------|---------|
| `algorithmic-art` | Arte generativa | templates JS/HTML |
| `brand-guidelines` | Diretrizes de marca | - |
| `canvas-design` | Design canvas c/ fontes | 30 fontes TTF |
| `claude-api` | API Claude (Python, TS, Go, Java, C#, PHP, Ruby, cURL) | - |
| `doc-coauthoring` | Coautoria de documentos | - |
| `docx` | Manipulacao DOCX | `scripts/comment.py`, `accept_changes.py` + schemas OOXML |
| `frontend-design` | Design frontend Anthropic | - |
| `internal-comms` | Comunicacao interna | exemplos |
| `mcp-builder` | MCP servers Anthropic | `scripts/connections.py`, `evaluation.py` |
| `pdf` | PDF forms | `scripts/check_bounding_boxes.py`, `fill_fillable_fields.py` |
| `pptx` | PowerPoint | `scripts/add_slide.py`, `clean.py`, `thumbnail.py` |
| `skill-creator` | Criacao de skills | 7 scripts, 3 sub-agentes |
| `slack-gif-creator` | Criacao de GIFs | core Python |
| `theme-factory` | Tema factory | 10 temas |
| `web-artifacts-builder` | Web artifacts | scripts sh |
| `webapp-testing` | Testing web Anthropic | `scripts/with_server.py` |
| `xlsx` | Excel | `scripts/recalc.py` + schemas OOXML |

---

## 4. ECOSSISTEMA HUGGINGFACE (12 skills em `skills/huggingface/`)

| Skill | Descricao | Scripts |
|-------|-----------|---------|
| `hf-cli` | CLI HuggingFace | - |
| `huggingface-community-evals` | Avaliacoes comunidade | 3 scripts Python |
| `huggingface-datasets` | Datasets HF | - |
| `huggingface-gradio` | Gradio apps | - |
| `huggingface-jobs` | Jobs HF | 3 scripts + references |
| `huggingface-llm-trainer` | Treinamento LLM | 6 scripts + 10 references |
| `huggingface-paper-publisher` | Publicacao de papers | 4 templates |
| `huggingface-papers` | Papers HF | - |
| `huggingface-tool-builder` | Ferramentas HF | references |
| `huggingface-trackio` | Tracking metrics | references |
| `huggingface-vision-trainer` | Treinamento visao | 5 scripts + references |
| `transformers-js` | Transformers.js | 6 references |

---

## 5. VENDOR (4 repositorios externos)

### `vendor/awesome-agent-skills-list/`
Lista curada de skills para agents (referencia apenas).

### `vendor/design-skills/` (18 skills UX)
| Skill | Foco |
|-------|------|
| `ux-accessibility` | Acessibilidade |
| `ux-ai-automation` | Automacao IA |
| `ux-content` | Conteudo |
| `ux-error-handling` | Tratamento de erros |
| `ux-forms` | Formularios |
| `ux-general` | UX geral |
| `ux-help-onboarding` | Help & onboarding |
| `ux-information-architecture` | Arquitetura de informacao |
| `ux-navigation` | Navegacao |
| `ux-network` | Rede/offline |
| `ux-notifications` | Notificacoes |
| `ux-review` | Revisao |
| `ux-safety-privacy` | Seguranca & privacidade |
| `ux-search` | Busca |
| `ux-settings` | Configuracoes |
| `ux-user-account` | Conta de usuario |
| `ux-utility` | Utilitarios |
| `ux-visual-design` | Design visual |

### `vendor/openai/` (42 skills)
Inclui skills para: Figma (criacao, design, uso), GitHub, OpenAI Docs, Render/Vercel/Netlify Deploy, Playwright, Sentry, Notion, ImageGen, Sora, Speech, Slides, Spreadsheet, Seguranca, e mais.

### `vendor/ui-ux-pro-max-skill/`
Repositorio fonte completo do workflow `/ui-ux-pro-max`:
- Runtime: `src/ui-ux-pro-max/` (scripts Python + dados CSV)
- Templates para 18 plataformas AI (Claude, Cursor, Gemini, Copilot, Windsurf, **opencode**, etc.)
- Documentacao, exemplos, projetos de amostra
- Referencia via `workflows/ui-ux-pro-max.md`

---

## 6. WORKFLOWS (11)

| Comando | Descricao |
|---------|-----------|
| `/brainstorm` | Exploracao Socratica de ideias |
| `/create` | Criacao de nova aplicacao |
| `/debug` | Investigacao sistematica de problemas |
| `/deploy` | Deploy em producao (check/preview/production/rollback) |
| `/enhance` | Melhoria de codigo existente |
| `/orchestrate` | Coordenacao multi-agente (min. 3) |
| `/plan` | Modo de planejamento (sem codigo) |
| `/preview` | Preview da aplicacao |
| `/status` | Status do projeto |
| `/test` | Geracao e execucao de testes |
| `/ui-ux-pro-max` | Sistema de design inteligente (50+ estilos) |

---

## 7. SCRIPTS MESTRE (2)

| Script | Proposito | Quando usar |
|--------|-----------|-------------|
| `checklist.py` | Validacao prioritaria (core checks) | Desenvolvimento, pre-commit |
| `verify_all.py` | Verificacao completa | Pre-deploy, releases |

**O que verificam:**
- `checklist.py`: Seguranca, Lint, Schema, Testes, UX, SEO
- `verify_all.py`: Tudo do checklist + Lighthouse, Playwright, Bundle, Mobile, i18n

---

## 8. REGRAS GLOBAIS

| Arquivo | Descricao |
|---------|-----------|
| `rules/GEMINI.md` | Regras globais de comportamento do AI (TIER 0/1/2) |

---

## 9. SHARED

| Caminho | Descricao |
|---------|-----------|
| `shared/ui-ux-pro-max/` | Dados e scripts do workflow `/ui-ux-pro-max` (~28 arquivos CSV + 3 scripts Python) |

---

## 10. DOCUMENTOS RAIZ

| Arquivo | Descricao |
|---------|-----------|
| `ARCHITECTURE.md` | Arquitetura original do Antigravity Kit |
| `MAPA.md` | Este documento - mapa completo do ecossistema |
| `squaddashi.md` | Skill mestre do projeto AgroFruta Insights |
| `.archive/PROMPT01.md` | Prompt original que gerou squaddashi.md |

---

## RESUMO ESTATISTICO

| Categoria | Quantidade |
|-----------|------------|
| Agentes nativos | 19 |
| Skills nativas | 40 |
| Skills Anthropic | 17 |
| Skills HuggingFace | 12 |
| Skills UX (vendor) | 18 |
| Skills OpenAI (vendor) | 42 |
| ui-ux-pro-max-skill (vendor) | 1 repo completo |
| Workflows | 11 |
| Scripts mestre | 2 |
| Regras globais | 1 |
| **Total de skills disponiveis** | **~129** |
