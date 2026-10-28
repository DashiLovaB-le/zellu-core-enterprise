# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary visitor of the public landing: profissionais de RH / People em empresas brasileiras que ainda não investem em ferramenta de acompanhamento emocional no dia a dia do colaborador. Chegam pelo LinkedIn, por indicação ou por parceiros. O trabalho deles nesta superfície: decidir se agendam uma demonstração.

Outros públicos (superfícies Operate, não a landing): colaborador (companion), gestor RH (painel agregado), admin e dev da operação Zēllu.

## Product Purpose

Zēllu é o companion digital de bem-estar emocional corporativo da Dashitecnology. Mantém o colaborador em um cuidado leve e frequente (check-in, conversa, respiro) e entrega ao RH sinais agregados de equipe — sem expor diário, chat ou humor individual. Não substitui psicólogo, psiquiatra nem terapia.

Sucesso nesta fase: profissionais de RH agendam uma demonstração pelo formulário da landing (nome, e-mail corporativo, empresa, número de colaboradores).

## Positioning

A maior parte das empresas só vê saúde mental quando o problema já chegou na mesa. Zēllu ocupa essa ausência: acompanhamento no ritmo do trabalho, com privacidade de verdade (k-anonimato; RH nunca vê o indivíduo). Mecanismo que um vizinho não copia honestamente: o mesmo hábito diário do colaborador alimenta tendência de equipe sem abrir a vida da pessoa. O check-in inclui uma pergunta diária sobre fatores de trabalho (carga, autonomia, apoio da liderança, relações), o que apoia o acompanhamento de riscos psicossociais da NR-01 sem substituir a avaliação técnica do PGR.

## Operating Context

App web (TanStack Start + Vite). Acesso companion/manager por convite. Visitante não autenticado em `/` vê a landing; colaborador autenticado em `/` continua no dashboard. Login, convite, privacidade e `/sobre` permanecem públicos à parte.

## Capabilities and Constraints

- Companion: check-in diário (sono, água, humor e uma pergunta de fator de trabalho), chat com IA (opt-in), diário, hábitos, plano de cuidado, espaço do respiro, dashboard emocional, orientação de crise com CVV.
- RH: dashboard agregado, fatores de trabalho por equipe com guias "Como agir", equipes, convites, relatórios CSV/PDF e resumo mensal por e-mail. Métricas ocultas abaixo de 5 opt-ins ou 5 respostas.
- Landing: comercial, com formulário de demonstração (nome, e-mail corporativo, empresa, número de colaboradores); a equipe responde por e-mail. Sem preço público: proposta depois da demonstração.
- NR-01: pode ser citada como apoio ao acompanhamento de riscos psicossociais; nunca prometer conformidade, emitir laudo ou substituir o PGR.
- Não inventar clientes, depoimentos, métricas de tração, planos ou ROI.
- Não afirmar que é terapia, diagnóstico ou atendimento clínico.
- Dashboard companion em `/` (usuário logado) não pode ser substituído; a landing só aparece para visitante.

## Brand Commitments

- Nome **Zēllu**, tagline **Cuidado emocional no ritmo do trabalho**.
- Mascote urso (poses reais em `src/assets/mascote` e companions).
- Marca visual existente: terracota, sage, cream, ink; faces **Quicksand** (display) e **Nunito Sans** (corpo); lockups em `src/assets/logo-zellu`.
- Voz: humana e comercial, confiante sem exagero; vende mostrando o produto real; português do Brasil.
- Powered by Dashitecnology.

## Evidence on Hand

- Produto rodando, mascote, logo, telas do companion e do painel RH — na landing, como componentes reais do app renderizados com dados de exemplo rotulados; a prévia do PDF é gerada pelo próprio código do relatório (`src/components/landing/landing-assets.test.ts`).
- Ausente e proibido fabricar: cases, logos de clientes, números de adesão, pricing.

## Product Principles

1. Privacidade é o produto, não um rodapé.
2. Cuidado diário e leve; nunca teatro clínico.
3. Mostrar o mecanismo, não listar features.
4. Vender com o produto real: levar o RH a agendar uma demonstração.
5. Só afirmar o que o produto faz hoje.

## Accessibility & Inclusion

Interface web em português. Respeitar `prefers-reduced-motion`. Contraste legível sobre cream/terracota/sage. Formulário com labels reais, erros honestos e alvo de toque adequado.
