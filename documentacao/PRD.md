# PRD — Mundo Mental Care

> **Versão:** 1.1  
> **Data:** 2026-08-18  
> **Produto:** Mundo Mental Care  
> **Tagline:** Cuidado emocional no ritmo do trabalho

---

## 1. Sumário Executivo

**Mundo Mental Care** é o companion digital de bem-estar emocional corporativo da oferta Mundo Mental. O produto oferece chat terapêutico com IA, check-in diário, diário/timeline, hábitos, plano de cuidado, dashboard emocional, insights, alertas preventivos, painel de RH e Portal Administrativo.

O app **não substitui** psicólogos, psiquiatras, terapia nem diagnóstico. É companion de bem-estar; o disclaimer aparece no login, no termo de privacidade (versão 3.0), no onboarding, no Chat e no Perfil.

---

## 2. Problema

Empresas contratam serviços de saúde mental, mas o engajamento dos colaboradores cai entre consultas e campanhas. Sem um hábito diário de cuidado, o benefício fica subutilizado e o ROI torna-se difícil de demonstrar.

**Dores identificadas:**
- Baixa adesão a programas de wellness corporativo
- Falta de visibilidade do RH sobre o estado emocional das equipes
- Descontinuidade entre sessões clínicas
- Ausência de sinais precoces de risco (burnout, crise de sono, desengajamento)

---

## 3. Solução

Um companion white-label, pronto para uso diário, que:

1. **Mantém o colaborador** em contato leve e frequente com o cuidado emocional
2. **Gera sinais agregados** para RH (adoção, tendências, alertas)
3. **Amplia o valor percebido** da jornada Mundo Mental sem competir com a clínica

---

## 4. Público-Alvo

### 4.1 Usuários Finais
| Perfil | Descrição |
|---|---|
| **Colaborador (Companion)** | Funcionários de empresas clientes que buscam autocuidado emocional no dia a dia do trabalho |
| **RH/Gestor (Manager)** | Profissionais de RH e gestores de equipe que precisam de visão agregada do bem-estar |
| **Administrador (Admin)** | Equipe comercial/operacional da Mundo Mental que gerencia empresas, licenças e contratos |
| **Desenvolvedor (Dev)** | Equipe técnica com acesso total para configuração e monitoramento |

### 4.2 Stakeholders
- **Mundo Mental:** negócio clínico que oferta o produto
- **Empresas clientes:** organizações que contratam a solução para seus colaboradores
- **Gestores de RH:** responsáveis pela adoção e engajamento

---

## 5. Objetivos do Produto

### 5.1 Objetivos de Negócio
| Objetivo | Métrica | Meta |
|---|---|---|
| Engajamento diário | DAU/MAU | ≥ 40% |
| Adesão ao check-in | % de colaboradores com check-in semanal | ≥ 60% |
| Retenção de contas | Churn anual | < 10% |
| Diferenciação comercial | Uso em apresentações/pilotos | 100% dos novos deals |

### 5.2 Objetivos do Usuário
| Objetivo | Métrica | Meta |
|---|---|---|
| Consistência de cuidado | Streak médio | ≥ 7 dias |
| Autocuidado | Uso semanal de funcionalidades | ≥ 3 features/semana |
| Satisfação | NPS interno | ≥ 50 |

---

## 6. Funcionalidades Principais

### 6.1 Companion (Colaborador)
| Funcionalidade | Descrição |
|---|---|
| **Onboarding e privacidade** | Aceite de convite → consentimento LGPD (IA / RH / e-mail) → nome/fuso → primeiro check-in |
| **Chat com IA** | Conversa contextual via OpenRouter (só com opt-in); histórico do banco; detector de crise (CVV 188); fallback local |
| **Check-in Matinal** | Fluxo em 3 etapas: sono → água → humor (6 principais + 19 extras); um check-in por dia |
| **Dashboard Emocional** | Gráficos de humor, tendência 30d, métricas de sono/água/movimento |
| **Timeline/Diário** | Visualização cronológica de entradas, check-ins e interações |
| **Meu Bem-estar** | Indicadores consolidados: água, sono, humor, energia, movimento |
| **Plano de Cuidado** | Checklist diário personalizado + streak de consistência |
| **Espaço do Respiro** | Exercícios guiados de respiração com sons ambiente |
| **Perfil** | Avatar (Amora, Chico, Pipoca, Zeca), nome, tema, preferências LGPD, exportar/excluir dados, ajuda em crise |

### 6.2 Manager (RH/Gestor)
| Funcionalidade | Descrição |
|---|---|
| **Dashboard RH** | KPIs agregados da própria empresa; k-anonimato (mín. 5 opt-ins); nunca diário/chat/humor individual |
| **Gestão de Equipes** | Times reais do cadastro; status Estável/Monitorar/Atenção; métricas ocultas se o time for pequeno |
| **Pessoas e convites** | Convites companion/manager por e-mail (Resend) ou link copiável; cancelar pendentes; desativação (`is_active`); teto de licenças |
| **Relatórios** | Centro de exportação: CSV/PDF com filtros (período, equipe, tipo) |

### 6.3 Admin (Portal Administrativo)
| Funcionalidade | Descrição |
|---|---|
| **KPIs Globais** | Métricas de adoção, alertas ativos, resumo operacional |
| **Gestão de Empresas** | CRUD de empresas/clientes B2B |
| **Gestão de Funcionários** | Pessoas e equipes vinculadas |
| **Licenças e Contratos** | Controle de planos, validade e status |
| **Métricas de Uso** | DAU/WAU/MAU e taxa de adesão |
| **Sentimentos** | Humor agregado dos últimos 30 dias |
| **Alertas** | Thresholds configuráveis + avaliação |
| **Relatórios** | Exportação CSV/PDF |

### 6.4 IA e Inteligência
| Funcionalidade | Descrição |
|---|---|
| **Insights IA** | Análise de padrões (sono, humor, água, energia) com fallback local |
| **IA Preventiva** | Detecção de riscos: burnout, crise de sono, crise de humor, desengajamento |
| **Gamificação** | Streaks com marcos (3, 7, 14, 21, 30, 60, 90 dias) |

### 6.5 Dev Tools
| Funcionalidade | Descrição |
|---|---|
| **LLM Config** | Modelo, temperatura, tokens, system prompt; chave só em `OPENROUTER_API_KEY` |
| **System Logs** | Logs sanitizados (sem e-mail, humor ou texto de saúde) |

---

## 7. Requisitos Não-Funcionais

| Requisito | Especificação |
|---|---|
| **Performance** | Tempo de carregamento inicial < 3s; lazy loading de rotas |
| **Escalabilidade** | Supabase (auto-scaling); cache React Query |
| **Disponibilidade** | 99.5% uptime (meta) |
| **Segurança** | CSRF, RLS, JWT validado no servidor, HTTPS, LGPD (consentimento 3.0, retenção automática, exportar/excluir) |
| **Acessibilidade** | Componentes Radix UI (headless acessíveis) |
| **Responsividade** | Mobile-first; páginas companion unificadas onde possível |
| **Multi-tenant** | Manager só da própria `company_id`; painel RH via RPC agregada (`get_rh_dashboard`), sem service role |

---

## 8. Restrições

- **Não substitui** atendimento clínico (posição regulatória)
- **White-label** para Mundo Mental (não é produto genérico)
- **Dependência externa:** OpenRouter (LLM), Supabase (backend)
- **LGPD:** consentimento versionado; opt-in separado para IA, RH e e-mail; retenção (chat/diário 180d, check-ins 365d, logs 90d)
- **IA:** sem opt-in não sai dado do servidor; com opt-in, OpenRouter com `data_collection=deny` e ZDR

---

## 9. Sucesso do Produto

| Critério | Indicador |
|---|---|
| adoção | ≥ 70% dos colaboradores cadastrados usam o app pelo menos 1x/semana |
| consistência | ≥ 50% dos ativos mantêm streak ≥ 7 dias |
| engajamento RH | ≥ 80% dos gestores acessam o Dashboard RH pelo menos 1x/mês |
| retenção | Churn de empresas clientes < 10% ao ano |

---

## 10. Aprovação

| Papel | Nome | Data |
|---|---|---|
| Product Owner | — | — |
| Tech Lead | — | — |
| Stakeholder (Mundo Mental) | — | — |
