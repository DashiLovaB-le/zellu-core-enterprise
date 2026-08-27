export type SobreSection = {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
};

export type SobrePage = {
  slug: string;
  title: string;
  summary: string;
  icon: string;
  sections: SobreSection[];
};

export const SOBRE_DEFAULT_SLUG = "o-que-e";

export const SOBRE_PAGES: SobrePage[] = [
  {
    slug: "o-que-e",
    title: "O que é o Zēllu",
    summary: "Visão geral da plataforma e para quem ela serve.",
    icon: "favorite",
    sections: [
      {
        heading: "Companion de bem-estar no trabalho",
        paragraphs: [
          "O Zēllu é uma plataforma de bem-estar emocional para empresas. Ela acompanha colaboradores no dia a dia — com check-ins, hábitos, conversa com um companion e pausas de cuidado — e oferece ao RH uma visão agregada, com privacidade.",
          "O foco é apoiar autocuidado e percepção de tendências nas equipes, não substituir saúde mental clínica ou terapia.",
        ],
      },
      {
        heading: "Dois perfis de uso",
        bullets: [
          "Colaborador: usa o app no celular ou computador para registrar bem-estar, conversar com o companion e cuidar da rotina.",
          "RH / gestor: acessa um painel com indicadores agregados, equipes, convites e relatórios — sempre respeitando o que cada pessoa autorizou compartilhar.",
        ],
      },
      {
        heading: "Modelo B2B",
        paragraphs: [
          "Cada empresa contrata o acesso para seus colaboradores. Os dados ficam isolados por empresa. Convites são enviados por e-mail corporativo; o colaborador aceita termos de privacidade no primeiro acesso.",
        ],
      },
    ],
  },
  {
    slug: "colaborador",
    title: "Experiência do colaborador",
    summary: "O que a pessoa usa no dia a dia dentro do app.",
    icon: "person",
    sections: [
      {
        heading: "Primeiro acesso",
        bullets: [
          "Recebe convite por e-mail e define senha.",
          "Lê e aceita a política de privacidade (maior de 18 anos).",
          "Escolhe nome de exibição, fuso horário e companion (personagem de apoio).",
          "Pode autorizar ou não: IA na conversa, compartilhamento agregado com RH e lembretes por e-mail.",
        ],
      },
      {
        heading: "Check-in matinal",
        paragraphs: [
          "Em poucos passos a pessoa registra sono, hidratação e humor. Isso alimenta o acompanhamento personalizado e, se autorizado, entra nos indicadores agregados do RH.",
        ],
      },
      {
        heading: "Companion e chat",
        paragraphs: [
          "O colaborador conversa com um personagem fixo (Chico, Amora, Pipoca ou Zeca). O tom muda conforme o companion escolhido.",
          "A conversa pode incluir sugestões práticas: respirar, pausar, beber água, retomar o plano de cuidado. Se a pessoa autorizar IA, as respostas são geradas com contexto de bem-estar — nunca com dados de identificação.",
        ],
      },
      {
        heading: "Outras ferramentas",
        bullets: [
          "Diário pessoal (privado; o RH não vê o conteúdo).",
          "Plano de cuidado com metas e checklist do dia.",
          "Espaço do Respiro: exercício guiado de respiração, com sons ambiente opcionais.",
          "Dashboard emocional e linha do tempo da própria jornada.",
        ],
      },
    ],
  },
  {
    slug: "painel-rh",
    title: "Painel RH",
    summary: "O que o gestor acompanha e como usar os relatórios.",
    icon: "dashboard",
    sections: [
      {
        heading: "Dashboard RH",
        bullets: [
          "Participação: quantas pessoas fizeram check-in e usaram o app no período.",
          "Tendências de humor, sono e hidratação em visão agregada.",
          "Distribuição de humores em gráficos (por equipe ou empresa, conforme filtros).",
          "Alertas preventivos quando há sinais de queda coletiva — sempre em grupo, nunca individual.",
        ],
      },
      {
        heading: "Equipes",
        paragraphs: [
          "O RH organiza colaboradores em equipes, renomeia times e move pessoas entre grupos. Métricas de equipe só aparecem quando há participação suficiente com opt-in de RH (proteção de anonimato).",
        ],
      },
      {
        heading: "Pessoas e convites",
        bullets: [
          "Envio de convites por e-mail para novos colaboradores ou gestores.",
          "Diretório com quem já aceitou e status de participação.",
          "Ficha resumida por colaborador: tendências gerais, sem humor diário identificado, sem chat e sem diário.",
        ],
      },
      {
        heading: "Relatórios",
        paragraphs: [
          "Exportação em PDF ou planilha com dados agregados do período escolhido. Indicado para reuniões de cuidado, QVT ou acompanhamento de programas internos.",
        ],
      },
    ],
  },
  {
    slug: "privacidade-e-dados",
    title: "Privacidade e dados",
    summary: "O que pode ser compartilhado, o que nunca é, e como funciona o opt-in.",
    icon: "shield",
    sections: [
      {
        heading: "Princípios",
        bullets: [
          "O colaborador controla o que autoriza: IA, RH e e-mails.",
          "Sem opt-in de RH, o gestor não vê indicadores daquela pessoa no agregado.",
          "Relatórios de equipe exigem um número mínimo de participantes com opt-in (anonimato coletivo).",
        ],
      },
      {
        heading: "O que o RH nunca vê",
        bullets: [
          "Texto do diário.",
          "Mensagens do chat com o companion.",
          "Humor, sono ou hidratação identificados por nome.",
        ],
      },
      {
        heading: "O que o RH pode ver (com opt-in)",
        bullets: [
          "Indicadores agregados por equipe ou empresa.",
          "Tendências e alertas preventivos em grupo.",
          "Resumo de participação (check-ins, engajamento).",
        ],
      },
      {
        heading: "IA na conversa",
        paragraphs: [
          "Só funciona se a pessoa autorizar. O contexto enviado é de bem-estar (humor recente, hábitos, plano), sem nome nem e-mail. Quem não autoriza recebe respostas locais pré-definidas, sem envio a serviço externo de IA.",
          "Para detalhes legais completos, consulte a política de privacidade do produto.",
        ],
      },
    ],
  },
  {
    slug: "convites-e-equipes",
    title: "Convites e equipes",
    summary: "Como começar na empresa e organizar os times.",
    icon: "groups",
    sections: [
      {
        heading: "Convidar colaboradores",
        bullets: [
          "O RH envia convite por e-mail corporativo.",
          "O link leva à tela de aceite: a pessoa cria senha e entra no onboarding.",
          "Convites expiram se não forem usados; é possível reenviar.",
        ],
      },
      {
        heading: "Papéis",
        bullets: [
          "Colaborador (companion): usa o app de bem-estar.",
          "Gestor / RH (manager): acessa painel, equipes, convites e relatórios.",
        ],
      },
      {
        heading: "Organização em equipes",
        paragraphs: [
          "Equipes ajudam a filtrar dashboards e relatórios. Ao mover alguém de time, os indicadores passam a contar no novo grupo — sempre de forma agregada.",
        ],
      },
    ],
  },
  {
    slug: "companion-e-ia",
    title: "Companion e conversa",
    summary: "Como funciona o personagem e as respostas inteligentes.",
    icon: "psychology",
    sections: [
      {
        heading: "Personagem fixo",
        paragraphs: [
          "Cada colaborador escolhe um companion. A interface e o tom da conversa seguem esse personagem. O objetivo é criar continuidade e proximidade, não parecer um chat genérico.",
        ],
      },
      {
        heading: "O que o companion faz",
        bullets: [
          "Escuta e responde sobre rotina, humor e autocuidado.",
          "Sugere pausas, respiração, hidratação ou retomada do plano quando faz sentido.",
          "Lembra preferências úteis entre conversas (com autorização de IA).",
          "Interrompe e orienta para ajuda profissional se detectar linguagem de crise.",
        ],
      },
      {
        heading: "Limites importantes",
        bullets: [
          "Não diagnostica condições de saúde mental.",
          "Não prescreve medicamentos ou tratamentos.",
          "Não substitui psicólogo, psiquiatra ou emergência (CVV 188, SAMU 192).",
        ],
      },
    ],
  },
  {
    slug: "limites-do-produto",
    title: "Limites do produto",
    summary: "O que o Zēllu é — e o que não é.",
    icon: "info",
    sections: [
      {
        heading: "O Zēllu é",
        bullets: [
          "Ferramenta de bem-estar e autocuidado no contexto de trabalho.",
          "Apoio emocional cotidiano com linguagem acolhedora.",
          "Painel de sinais agregados para RH com privacidade.",
        ],
      },
      {
        heading: "O Zēllu não é",
        bullets: [
          "Terapia, psicologia ou psiquiatria.",
          "Serviço de diagnóstico ou laudo clínico.",
          "Canal de denúncia trabalhista ou jurídico.",
          "Sistema de monitoramento individual de performance.",
        ],
      },
      {
        heading: "Recomendação",
        paragraphs: [
          "Programas de QVT e saúde mental da empresa devem combinar o Zēllu com políticas internas, canais de escuta humana e rede de assistência profissional quando necessário.",
        ],
      },
    ],
  },
  {
    slug: "perguntas-frequentes",
    title: "Perguntas frequentes",
    summary: "Respostas rápidas para dúvidas comuns de clientes e RH.",
    icon: "help",
    sections: [
      {
        heading: "Implementação",
        bullets: [
          "Precisa de convite? Sim — acesso B2B por e-mail corporativo.",
          "Funciona no celular? Sim — interface responsiva para mobile e desktop.",
          "Quantos colaboradores por empresa? Conforme contrato de licenças.",
        ],
      },
      {
        heading: "Privacidade",
        bullets: [
          "O RH vê mensagens do chat? Não.",
          "Posso usar sem compartilhar nada com o RH? Sim — basta não autorizar o opt-in de RH.",
          "A IA é obrigatória? Não — é opcional no onboarding e no perfil.",
        ],
      },
      {
        heading: "Uso diário",
        bullets: [
          "Quanto tempo leva o check-in? Poucos minutos (sono, água, humor).",
          "O colaborador pode trocar de companion? Sim, no perfil.",
          "Há lembrete de check-in? Sim, se a pessoa autorizar e-mail.",
        ],
      },
      {
        heading: "Suporte comercial",
        paragraphs: [
          "Para proposta, piloto ou dúvidas contratuais, entre em contato com a equipe comercial da Dashitecnology / Zēllu.",
        ],
      },
    ],
  },
];

export function getSobrePage(slug: string): SobrePage | undefined {
  return SOBRE_PAGES.find((p) => p.slug === slug);
}

export function getSobreNavItems(): Pick<SobrePage, "slug" | "title" | "icon">[] {
  return SOBRE_PAGES.map(({ slug, title, icon }) => ({ slug, title, icon }));
}
