# BRD — Business Requirement Document

> **Projeto:** Zēllu  
> **Versão:** 1.2  
> **Data:** 2026-08-26  
> **Autor:** Equipe de Produto Zēllu

---

## 1. Sumário Executivo

O Zēllu é um companion digital de bem-estar emocional corporativo da Dashitecnology. O produto visa aumentar o engajamento de colaboradores em empresas clientes, gerar visibilidade para o RH e ampliar o valor percebido da oferta de bem-estar.

---

## 2. Contexto de Negócio

### 2.1 Cenário de Mercado
- Empresas brasileiras investem em programas de saúde mental corporativa, mas enfrentam **baixa adesão** e **dificuldade de mensurar ROI**
- O mercado de corporate wellness cresce 15% ao ano no Brasil
- A World Health Organization (WHO) estima que depressão e ansiedade custam US$ 1 trilhão/ano em produtividade perdida globalmente

### 2.2 Problema de Negócio
| Problema | Impacto |
|---|---|
| Baixa adesão a programas de wellness | Benefício subutilizado; custo por usuário efetivo alto |
| Falta de visibilidade do RH | Dificuldade em intervir preventivamente |
| Descontinuidade entre sessões clínicas | Perda de engajamento e resultados |
| Ausência de dados para tomada de decisão | Investimentos sem métricas claras |

### 2.3 Solução de Negócio
O Zēllu resolve esses problemas ao:
1. **Engajar diariamente** com check-in, chat e hábitos leves
2. **Gerar dados agregados** para RH sem expor conteúdo privado
3. **Detectar riscos precocemente** via IA preventiva
4. **Ampliar o valor da oferta** Zēllu com diferencial competitivo

---

## 3. Objetivos de Negócio

### 3.1 Objetivos Estratégicos
| Objetivo | Prazo | Métrica de Sucesso |
|---|---|---|
| Posicionar Zēllu como diferencial comercial | Q3 2026 | Usado em 100% das apresentações para novos clientes |
| Expandir base de clientes B2B | Q4 2026 | 10 empresas clientes ativas |
| Atingir massa crítica de usuários | Q4 2026 | 100 usuários ativos mensais |
| Reduzir churn de clientes | Q1 2027 | Churn anual < 10% |

### 3.2 Objetivos Financeiros
| Métrica | Meta | Prazo |
|---|---|---|
| Receita recorrente (MRR) | R$ 50.000 | Q1 2027 |
| Custo de aquisição por cliente (CAC) | < R$ 5.000 | Q4 2026 |
| Lifetime value (LTV) | > R$ 60.000 | Q1 2027 |
| LTV/CAC ratio | > 12x | Q1 2027 |

### 3.3 Objetivos Operacionais
| Objetivo | Meta |
|---|---|
| Disponibilidade (uptime) | 99.5% |
| Tempo de resposta médio | < 2s |
| Tempo de carregamento inicial | < 3s |
| Suporte ao cliente | < 24h para resolução |

---

## 4. Escopo do Negócio

### 4.1 Em Escopo
| Área | Entregas |
|---|---|
| **Produto Digital** | App web responsivo (mobile-first) com funcionalidades de cuidado emocional |
| **Autenticação** | Login; cadastro **somente por convite** (e-mail Resend ou link); role definida no servidor |
| **Companion** | Chat IA, check-in, diário, bem-estar, plano de cuidado, respiro |
| **Manager** | Dashboard RH, gestão de equipes, relatórios |
| **Admin** | Portal B2B: empresas, funcionários, licenças, contratos, métricas |
| **Confiança** | Isolamento por empresa, RH só com agregados (k-anonimato), LGPD, crise/CVV, disclaimer clínico |
| **IA** | Insights e preventiva com opt-in; sem treino/retenção no provedor; fallback local |
| **Infraestrutura** | Supabase (Auth + DB + RLS), OpenRouter (LLM) |

### 4.2 Fora de Escopo (Atual)
| Item | Motivo |
|---|---|
| App nativo (iOS/Android) | Fase futura (Fase 20) |
| Atendimento clínico | Posicionamento: não substitui profissionais |
| Integração com ERPs | Complexidade; fase futura |
| Multi-idioma | Mercado inicial: Brasil |
| Telemedicina | Não faz parte do escopo do companion |

---

## 5. Público-Alvo e Segmentos

### 5.1 Cliente Primário
- **Empresas com 200+ funcionários** que já contratam serviços de saúde mental
- **Segmentos:** Tecnologia, financeiro, indústria, varejo, consultoria

### 5.2 Usuários Finais
| Perfil | Quantidade Estimada | Necessidade Principal |
|---|---|---|
| Colaboradores | 80% da base | Autocuidado, rotina de bem-estar |
| Gestores de RH | 5% da base | Visão agregada, alertas |
| Administradores MM | 3% da base | Gestão comercial e operacional |
| Desenvolvedores | 2% da base | Configuração e monitoramento |

### 5.3 Stakeholders
| Stakeholder | Papel | Interesse |
|---|---|---|
| Zēllu (negócio) | Proprietário do produto | Diferenciação, retenção, receita |
| Empresas clientes | Compradoras | ROI, adoção, engajamento |
| Colaboradores | Usuários finais | Facilidade, consistência, valor |
| Gestores de RH | Gestores de adoção | Visibilidade, dados, ação |

---

## 6. Modelo de Receita

### 6.1 Estrutura de Pricing (Proposta)
| Plano | Preço por Usuário/Mês | Inclui |
|---|---|---|
| **Standard** | R$ 15–25 | Companion + Manager básico |
| **Enterprise** | R$ 30–50 | Standard + Admin + IA avançada + SLA dedicado |
| **Pilot** | Customizado | 30 dias grátis para validação |

### 6.2 Fluxo de Receita
```
Empresa assina contrato
  → Licença criada no Admin
        → Convites criam usuários
          → Usuários ativos geram valor
        → Métricas de adoção justificam renovação
```

---

## 7. Análise de Viabilidade

### 7.1 Viabilidade Técnica
| Fator | Avaliação |
|---|---|
| Stack tecnológica | Moderna e madura (React, Supabase, Vite) |
| Escalabilidade | Supabase auto-scaling; arquitetura serverless |
| Custo de infraestrutura | Baixo (Supabase free tier → pago conforme escala) |
| Time necessário | 1–2 devs full-stack + 1 designer |

### 7.2 Viabilidade Financeira
| Fator | Avaliação |
|---|---|
| Custo de desenvolvimento | Baixo (ferramentas open-source) |
| Custo operacional mensal | Estimado R$ 500–2.000 (Supabase + OpenRouter) |
| Break-even | 20–30 empresas clientes (plano Standard) |

### 7.3 Viabilidade de Mercado
| Fator | Avaliação |
|---|---|
| Demanda | Alta (mercado de wellness corporativo em crescimento) |
| Concorrência | Moderada (apps genéricos vs. solução white-label integrada) |
| Diferencial | Integração com jornada clínica (ecossistema Zēllu) |

---

## 8. Riscos de Negócio

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| Baixa adoção inicial | Média | Alto | Pilotos gratuitos; onboarding guiado |
| Regulamentação (LGPD/ANS) | Média | Alto | Compliance desde o início; não substitui clínica |
| Dependência de OpenRouter | Baixa | Médio | Fallback local para IA; evaluated alternatives |
| Churn de clientes | Média | Alto | Dashboard de valor; success stories; SLA |
| Concorrência de grandes players | Média | Médio | Foco em nicho B2B + integração clínica |

---

## 9. Cronograma de Negócio

| Fase | Prazo | Entregas de Negócio |
|---|---|---|
| Validação | Ago 2026 | Feedback de percepção enterprise (16.4) |
| Proposta Comercial | Ago 2026 | Apresentação da proposta (16.6) |
| Piloto | Set 2026 | 1–2 empresas piloto |
| Lançamento Beta | Out 2026 | Lançamento controlado |
| Escala | Q1 2027 | 10+ empresas clientes |

---

## 10. Aprovação

| Papel | Nome | Data | Assinatura |
|---|---|---|---|
| Diretor de Negócio | — | — | — |
| Product Owner | — | — | — |
| Financeiro | — | — | — |
| Jurídico (LGPD) | — | — | — |
