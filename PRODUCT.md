# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary visitor of the public landing: profissionais de RH / People em empresas brasileiras que ainda não investem em ferramenta de acompanhamento emocional no dia a dia do colaborador. Chegam pelo LinkedIn, em processo de validação do produto. O trabalho deles nesta superfície: decidir se topam testar.

Outros públicos (superfícies Operate, não a landing): colaborador (companion), gestor RH (painel agregado), admin e dev da operação Zēllu.

## Product Purpose

Zēllu é o companion digital de bem-estar emocional corporativo da Dashitecnology. Mantém o colaborador em um cuidado leve e frequente (check-in, conversa, respiro) e entrega ao RH sinais agregados de equipe — sem expor diário, chat ou humor individual. Não substitui psicólogo, psiquiatra nem terapia.

Sucesso nesta fase: profissionais de RH pedem para testar, via formulário na landing (nome, e-mail corporativo, empresa).

## Positioning

A maior parte das empresas só vê saúde mental quando o problema já chegou na mesa. Zēllu ocupa essa ausência: acompanhamento no ritmo do trabalho, com privacidade de verdade (k-anonimato; RH nunca vê o indivíduo). Mecanismo que um vizinho não copia honestamente: o mesmo hábito diário do colaborador alimenta tendência de equipe sem abrir a vida da pessoa.

## Operating Context

App web (TanStack Start + Vite). Acesso companion/manager por convite. Visitante não autenticado em `/` vê a landing; colaborador autenticado em `/` continua no dashboard. Login, convite, privacidade e `/sobre` permanecem públicos à parte.

## Capabilities and Constraints

- Companion: check-in diário, chat com IA (opt-in), diário, hábitos, plano de cuidado, espaço do respiro, dashboard emocional.
- RH: dashboard agregado, equipes, convites, relatórios. Métricas ocultas abaixo de 5 opt-ins.
- Landing: formulário de interesse (nome, e-mail corporativo, empresa); a equipe entra em contato. Sem pitch de preço.
- Não inventar clientes, depoimentos, métricas de tração, planos ou ROI.
- Não afirmar que é terapia, diagnóstico ou atendimento clínico.
- Dashboard companion em `/` (usuário logado) não pode ser substituído; a landing só aparece para visitante.

## Brand Commitments

- Nome **Zēllu**, tagline **Cuidado emocional no ritmo do trabalho**.
- Mascote urso (poses reais em `src/assets/mascote` e companions).
- Marca visual existente: terracota, sage, cream, ink; faces **Quicksand** (display) e **Nunito Sans** (corpo); lockups em `src/assets/logo-zellu`.
- Voz: humana, de quem construiu a ferramenta; convite sem vender; português do Brasil.
- Powered by Dashitecnology.

## Evidence on Hand

- Produto rodando, mascote, logo, telas do companion e do painel RH — usar como prova visual, rotulando recortes sintéticos/demo quando não forem dados reais.
- Texto de convite LinkedIn (validação com RH) como tom de copy.
- Ausente e proibido fabricar: cases, logos de clientes, números de adesão, pricing.

## Product Principles

1. Privacidade é o produto, não um rodapé.
2. Cuidado diário e leve; nunca teatro clínico.
3. Mostrar o mecanismo, não listar features.
4. Convidar o RH a validar; não fechar venda.
5. Só afirmar o que o produto faz hoje.

## Accessibility & Inclusion

Interface web em português. Respeitar `prefers-reduced-motion`. Contraste legível sobre cream/terracota/sage. Formulário com labels reais, erros honestos e alvo de toque adequado.
