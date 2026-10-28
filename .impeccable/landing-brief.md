# Landing `/` (visitante)

- **Mode:** Persuade
- **Audience:** Profissionais de RH / People de empresas brasileiras sem ferramenta de acompanhamento emocional; chegam por LinkedIn, indicação ou parceiros.
- **Job:** Entender que o Zēllu mostra, por equipe, onde o trabalho está pesando sem expor ninguém, e agendar uma demonstração.
- **Action:** Formulário "Agendar demonstração": nome, e-mail corporativo, empresa e número de colaboradores (`landing_leads.company_size`, migration 023).
- **Proof:** Componentes reais do app rodando com dados de exemplo rotulados: painel de fatores de trabalho com "Como agir" aberto, pergunta de check-in do dia, regra de 5 respostas (`aggregateWorkFactors`), e-mail real do resumo mensal (`buildMonthlyReportEmail`) e primeira página do PDF do painel gerada pelo código do relatório. Sem clientes, métricas de tração, preço ou ROI.
- **Direction:** Perguntas do RH. A página responde, na ordem, "O que o colaborador faz?", "O RH vê o que cada pessoa respondeu?", "Quanto trabalho isso dá para o RH?", "E a NR-01?" e "Como começamos?" (o formulário). Escolhida pelo usuário na página de decisão em 27/10/2026, entre três estruturas sorteadas por `concept-seed.mjs --scope surface --mode persuade` (seed `ce65901c`, cartas 5, 4 e 3 da lista; registro em `.impeccable/decision-landing-v2.json`). Construção direta em código; não houve comps.
- **Memorable moment:** Na seção escura da privacidade, as respostas da equipe Comercial enchem os círculos e o fator só "revela" no painel real quando chega a 5 respostas.
- **Constraints:** Identidade Zēllu (creme, tinta, terracota, sálvia; Quicksand e Nunito; mascote). Não substituir o dashboard do colaborador logado. NR-01 só como apoio ao acompanhamento; nunca conformidade, laudo ou substituto do PGR.
- **Open:** Destino do e-mail dos leads (`LEADS_TO_EMAIL`). Ao mudar o relatório PDF, regenerar a prévia com `landing-assets.test.ts`.
