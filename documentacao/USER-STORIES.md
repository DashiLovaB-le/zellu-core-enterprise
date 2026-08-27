# User Stories — Zēllu

> **Versão:** 1.2  
> **Data:** 2026-08-26

---

## 1. Companion (Colaborador)

### 1.1 Autenticação

| ID | História | Critério de Aceite |
|---|---|---|
| US-C01 | **Como** colaborador, **eu quero** entrar com o convite da minha empresa, **para** acessar o app sem escolher meu próprio papel. | Token válido cria conta; `profiles.role` e `company_id` vêm do convite; sem convite o cadastro falha. |
| US-C02 | **Como** colaborador, **eu quero** fazer login com email e senha, **para** acessar meu conteúdo pessoal. | Credenciais válidas autenticam; sessão persiste; role lida de `profiles`. |
| US-C03 | **Como** colaborador, **eu quero** escolher um avatar (Amora, Chico, Pipoca ou Zeca) no perfil, **para** personalizar minha experiência. | Avatar é salvo no perfil; define companion no chat (voz, quick replies, fallback local); Chico exibe poses dinâmicas. |
| US-C03b | **Como** colaborador, **eu quero** atalhos de conversa no chat, **para** iniciar temas comuns com um toque. | `ChatStarterReplies` e sugestões da IA respeitam o companion escolhido. |
| US-C03c | **Como** colaborador novo, **eu quero** um guia rápido das telas principais, **para** entender o app sem manual. | `ProductTourModal` após onboarding LGPD; marca `product_tour_completed_at`. |

### 1.2 Check-in Matinal

| ID | História | Critério de Aceite |
|---|---|---|
| US-C04 | **Como** colaborador, **eu quero** registrar meu sono (horas + qualidade), **para** acompanhar meu descanso. | Formulário aceita horas (0–12) e rótulo de qualidade; salva no Supabase. |
| US-C05 | **Como** colaborador, **eu quero** registrar quanto de água bebi, **para** monitorar minha hidratação. | Campo aceita ml (0–5000); persiste na tabela `checkins`. |
| US-C06 | **Como** colaborador, **eu quero** selecionar meu humor entre 6 opções principais ou +19 extras, **para** expressar como me sinto. | Humor é salvo com timestamp; não permite duplicata no mesmo dia. |
| US-C07 | **Como** colaborador, **eu quero** ver meu check-in do dia anterior ao acessar o dashboard, **para** manter consistência. | Dashboard exibe último check-in registrado. |

### 1.3 Chat com IA

| ID | História | Critério de Aceite |
|---|---|---|
| US-C08 | **Como** colaborador, **eu quero** conversar com uma IA empática, **para** ter apoio emocional imediato. | Cloud IA só com opt-in; contexto sem nome/e-mail; crise vai para CVV; Markdown. |
| US-C09 | **Como** colaborador, **eu quero** ver o histórico das últimas 10 mensagens, **para** retomar conversas. | Chat carrega histórico ao abrir; scroll automático para baixo. |
| US-C10 | **Como** colaborador, **eu quero** receber sugestões pós-resposta, **para** explorar temas relacionados. | 3 sugestões aparecem após cada resposta da IA. |
| US-C11 | **Como** colaborador, **eu quero** ver um indicador de "digitando..." enquanto a IA processa, **para** saber que minha mensagem foi recebida. | Typing indicator visível durante processamento. |

### 1.4 Dashboard Emocional

| ID | História | Critério de Aceite |
|---|---|---|
| US-C12 | **Como** colaborador, **eu quero** ver gráficos do meu humor ao longo do tempo, **para** identificar padrões. | Gráfico de linha com dados dos últimos 30 dias; tooltip com detalhes. |
| US-C13 | **Como** colaborador, **eu quero** ver métricas consolidadas (dias rastreados, humor predominante, média de sono), **para** ter uma visão geral. | Cards com valores numéricos e unidades; atualizados em tempo real. |
| US-C14 | **Como** colaborador, **eu quero** receber insights automáticos sobre minhas tendências, **para** entender melhor meu bem-estar. | Insight gerado por IA com fallback local; exibido no topo do dashboard. |

### 1.5 Timeline/Diário

| ID | História | Critério de Aceite |
|---|---|---|
| US-C15 | **Como** colaborador, **eu quero** ver uma timeline com minhas atividades, **para** revisar minha jornada. | Timeline agrega: diário, check-ins, hábitos, chat; ordenação cronológica. |
| US-C16 | **Como** colaborador, **eu quero** adicionar uma entrada de texto ao diário, **para** registrar pensamentos. | Campo de texto com salvamento; mood opcional; aparece na timeline. |
| US-C17 | **Como** colaborador, **eu quero** ver um calendário de humor dos últimos 14 dias, **para** visualizar padrões semanais. | Calendário com cores por humor; tooltip com detalhes do dia. |

### 1.6 Meu Bem-estar

| ID | História | Critério de Aceite |
|---|---|---|
| US-C18 | **Como** colaborador, **eu quero** registrar água, sono, humor, movimento, energia e refeições em um só lugar, **para** consolidar meu dia. | Formulário com campos pré-populados do check-in; salvamento consolidado. |
| US-C19 | **Como** colaborador, **eu quero** acessar exercícios de respiração a partir do bem-estar, **para** relaxar rapidamente. | Link direto para `/respiro`; transição suave. |

### 1.7 Plano de Cuidado

| ID | História | Critério de Aceite |
|---|---|---|
| US-C20 | **Como** colaborador, **eu quero** definir um objetivo de bem-estar, **para** ter direção no autocuidado. | Campo de objetivo editável; salva no Supabase. |
| US-C21 | **Como** colaborador, **eu quero** completar um checklist diário (água, caminhada, respirar, conversar), **para** manter consistência. | Checkbox com estado persistido; progresso visual. |
| US-C22 | **Como** colaborador, **eu quero** ver minha sequência de dias (streak), **para** me motivar. | Streak exibido com marcos (3, 7, 14, 21, 30, 60, 90); banner de celebração. |

### 1.8 Espaço do Respiro

| ID | História | Critério de Aceite |
|---|---|---|
| US-C23 | **Como** colaborador, **eu quero** fazer um exercício guiado de respiração, **para** aliviar o estresse. | Ciclo: inspirar → segurar → expirar; animação visual; timer. |
| US-C24 | **Como** colaborador, **eu quero** escolher sons ambiente (chuva, floresta, fogueira, ondas), **para** ambientar o exercício. | Player de áudio com seleção; volume ajustável; loop contínuo. |

### 1.9 Perfil

| ID | História | Critério de Aceite |
|---|---|---|
| US-C25 | **Como** colaborador, **eu quero** alterar meu nome e avatar, **para** manter meu perfil atualizado. | Edição salva no Supabase; refletido imediatamente na UI. |
| US-C26 | **Como** colaborador, **eu quero** alternar entre tema claro e escuro, **para** usar conforme minha preferência. | Toggle persiste entre sessões; transição suave. |
| US-C27 | **Como** colaborador, **eu quero** fazer logout, **para** encerrar minha sessão de forma segura. | Sessão Supabase encerrada; redirect para `/login`. |
| US-C28 | **Como** colaborador, **eu quero** aceitar o termo de privacidade e escolher o que compartilho (IA, RH, e-mail), **para** ter controle LGPD. | Onboarding com versão 3.0; disclaimer clínico visível; opt-ins revogáveis no Perfil. |
| US-C29 | **Como** colaborador, **eu quero** exportar ou excluir meus dados, **para** exercer meus direitos. | JSON no Perfil; exclusão de conta. |
| US-C30 | **Como** colaborador, **eu quero** ver que o app não substitui terapia e ter o CVV à mão, **para** saber quando buscar ajuda profissional. | Disclaimer no login, termo, Chat e Perfil; crise no chat responde 188 sem aconselhar. |

---

## 2. Manager (RH/Gestor)

### 2.1 Dashboard RH

| ID | História | Critério de Aceite |
|---|---|---|
| US-M01 | **Como** gestor, **eu quero** ver KPIs da **minha empresa** (estresse, energia, sono, engajamento), **para** entender o estado do time. | Só a `company_id` do manager; dados agregados; k-anonimato se o time tiver menos de 5 opt-ins. |
| US-M02 | **Como** gestor, **eu quero** ver tendências dos últimos 30 dias, **para** identificar padrões ao longo do tempo. | Gráficos de linha com tendências; comparação com período anterior. |
| US-M03 | **Como** gestor, **eu quero** ver a distribuição de humor da equipe, **para** ter uma visão qualitativa. | Gráfico de pizza/barras com percentuais por humor. |
| US-M04 | **Como** gestor, **eu quero** visualizar alertas por equipe, **para** intervir quando necessário. | Lista de alertas com severidade; filto por equipe. |

### 2.2 Gestão de Equipes

| ID | História | Critério de Aceite |
|---|---|---|
| US-M05 | **Como** gestor, **eu quero** ver as equipes organizadas por departamento, **para** navegar pela estrutura. | Grid responsivo com cards por departamento; status colorido. |
| US-M06 | **Como** gestor, **eu quero** ver o status de cada equipe (Estável/Monitorar/Atenção), **para** priorizar ações. | Status calculado com base em métricas agregadas; legenda visível. |

### 2.3 Relatórios e pessoas

| ID | História | Critério de Aceite |
|---|---|---|
| US-M07 | **Como** gestor, **eu quero** exportar dados em CSV, **para** analisar em ferramentas externas. | CSV com indicadores agregados; sem indivíduo; k-anonimato. |
| US-M08 | **Como** gestor, **eu quero** convidar colaboradores e gestores da minha empresa, **para** não depender de cadastro aberto. | E-mail via Resend (se configurado) ou link copiável; `/aceitar-convite`; role no convite; bloqueio se licenças esgotarem. |
| US-M08b | **Como** gestor, **eu quero** cancelar convites pendentes, **para** liberar vagas e invalidar links enviados por engano. | `cancelInvite` remove convite não aceito; link deixa de funcionar. |
| US-M09 | **Como** gestor, **eu quero** desativar um colaborador, **para** cortar o acesso sem apagar o histórico da empresa. | `is_active=false`; usuário deixa de autenticar nas server functions. |
| US-M10 | **Como** gestor novo, **eu quero** um tour do painel RH, **para** saber onde ficam dashboard, equipes, pessoas e relatórios. | `ManagerProductTour` no 1º acesso manager; `product_tour_completed_at`. |

---

## 3. Admin (Portal Administrativo)

### 3.1 KPIs e Visão Geral

| ID | História | Critério de Aceite |
|---|---|---|
| US-A01 | **Como** admin, **eu quero** ver KPIs globais (empresas ativas, usuários, alertas), **para** ter visão operacional. | Dashboard com cards e gráficos; atualizado em tempo real. |
| US-A02 | **Como** admin, **eu quero** ver alertas ativos com severidade, **para** priorizar respostas. | Lista filtrável por status e severidade. |

### 3.2 Gestão de Empresas

| ID | História | Critério de Aceite |
|---|---|---|
| US-A03 | **Como** admin, **eu quero** cadastrar empresas clientes, **para** Expandir a base. | Formulário com: nome, slug, documento, indústria, contato, status, seats. |
| US-A04 | **Como** admin, **eu quero** editar e desativar empresas, **para** manter dados atualizados. | Edição inline ou modal; soft delete (status → inactive). |
| US-A05 | **Como** admin, **eu quero** ver a lista de empresas com filtros, **para** localizar rapidamente. | Tabela paginada; busca por nome; filtro por status. |

### 3.3 Gestão de Funcionários

| ID | História | Critério de Aceite |
|---|---|---|
| US-A06 | **Como** admin, **eu quero** listar funcionários por empresa/equipe, **para** gerenciar vínculos. | Tabela com filtros por empresa, equipe e status; busca por nome/email. |
| US-A07 | **Como** admin, **eu quero** ativar/desativar funcionários, **para** controlar acesso. | Toggle de status; confirmação antes de desativar. |

### 3.4 Licenças e Contratos

| ID | História | Critério de Aceite |
|---|---|---|
| US-A08 | **Como** admin, **eu quero** criar e gerenciar licenças por empresa, **para** controlar acesso ao produto. | Formulário: plano, seats, datas, status; validação de capacidade. |
| US-A09 | **Como** admin, **eu quero** vincular contratos a empresas, **para** rastrear value. | CRUD de contratos com tipo (SaaS, pilot, enterprise), valor, status, datas. |

### 3.5 Métricas de Uso

| ID | História | Critério de Aceite |
|---|---|---|
| US-A10 | **Como** admin, **eu quero** ver DAU/WAU/MAU, **para** medir adoção. | Gráficos com tendências; segmentação por empresa. |
| US-A11 | **Como** admin, **eu quero** ver taxa de adesão por empresa, **para** identificar underperformers. | Tabela com % de adesão; ordenação; destaque para abaixo da meta. |

### 3.6 Sentimentos e Alertas

| ID | História | Critério de Aceite |
|---|---|---|
| US-A12 | **Como** admin, **eu quero** ver o humor agregado dos últimos 30 dias, **para** identificar tendências globais. | Gráfico de distribuição; comparativo entre empresas. |
| US-A13 | **Como** admin, **eu quero** configurar thresholds de alerta (sono mínimo, água mínima, adesão mínima), **para** personalizar monitoramento. | Formulário com validação; impacta geração de alertas preventivos. |

### 3.7 Relatórios

| ID | História | Critério de Aceite |
|---|---|---|
| US-A14 | **Como** admin, **eu quero** gerar relatórios em CSV/PDF, **para** compartilhar com stakeholders. | Seleção de período e empresa; geração assíncrona; download. |

---

## 4. Dev (Desenvolvedor)

### 4.1 LLM Config

| ID | História | Critério de Aceite |
|---|---|---|
| US-D01 | **Como** dev, **eu quero** configurar modelo, temperatura, max tokens e system prompt, **para** ajustar o comportamento da IA. | Formulário com validação; salvamento com confirmação; teste rápido. |
| US-D02 | **Como** dev, **eu quero** testar a IA com uma mensagem de exemplo, **para** validar a configuração antes de aplicar. | Input + botão de teste; resposta exibida em tempo real. |
| US-D03 | **Como** dev, **eu quero** resetar a configuração para os valores padrão, **para** reverter erros. | Botão de reset com confirmação; restaura defaults do schema. |

### 4.2 System Logs

| ID | História | Critério de Aceite |
|---|---|---|
| US-D04 | **Como** dev, **eu quero** visualizar logs de sistema, **para** monitorar erros e eventos. | Tabela paginada com timestamp, tipo, mensagem; busca; filtro por nível. |
| US-D05 | **Como** dev, **eu quero** ver logs em tempo real (ou com polling), **para** detectar problemas rapidamente. | Atualização automática a cada 30s; indicador de novos logs. |

---

## 5. Funcionalidades Transversais

### 5.1 IA Preventiva

| ID | História | Critério de Aceite |
|---|---|---|
| US-T01 | **Como** colaborador, **eu quero** receber alertas quando a IA detectar riscos (burnout, sono, humor), **para** agir preventivamente. | Alerta exibido no Dashboard, Chat e Timeline; severidade (low/medium/high); sugestão acionável. |
| US-T02 | **Como** gestor, **eu quero** ver alertas preventivos da equipe, **para** oferecer suporte. | Alertas agregados no Dashboard RH; sem expor conteúdo privado. |

### 5.2 Gamificação

| ID | História | Critério de Aceite |
|---|---|---|
| US-T03 | **Como** colaborador, **eu quero** ver minha sequência de dias (streak) e marcos, **para** manter motivação. | Streak calculada com base em check-ins + checklist; marcos: 3, 7, 14, 21, 30, 60, 90; banner de celebração. |
| US-T04 | **Como** colaborador, **eu quero** ver um banner quando atingir um novo marco, **para** celebrar conquistas. | Banner `MilestoneBanner` no Dashboard e Plano de Cuidado; tom corporativo, sem infantilizar. |
