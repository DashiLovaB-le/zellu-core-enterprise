import type { WorkFactorId, WorkFactorLevel } from "@/lib/work-factors";

export type WorkFactorGuide = {
  factorId: WorkFactorId;
  signal: string;
  actions: string[];
};

export const WORK_FACTOR_GUIDES: Record<WorkFactorId, WorkFactorGuide> = {
  carga: {
    factorId: "carga",
    signal: "A equipe relata que o volume de trabalho do dia tem sido difícil de dar conta.",
    actions: [
      "Reveja as prioridades com a equipe: o que é urgente nesta semana e o que pode esperar ou sair da fila.",
      "Confira se poucas pessoas concentram as demandas e redistribua quando possível.",
      "Renegocie prazos e metas que dependem de esforço extra contínuo com quem pede as entregas.",
      "Proteja as pausas e o fim do expediente: evite reuniões e mensagens fora do horário.",
    ],
  },
  autonomia: {
    factorId: "autonomia",
    signal: "As pessoas sentem pouco espaço para decidir como fazer o próprio trabalho.",
    actions: [
      "Combine o resultado esperado e deixe a equipe escolher o caminho para chegar lá.",
      "Corte aprovações e checagens que não mudam a decisão final.",
      "Chame a equipe para as decisões que afetam a rotina dela, como escalas, processos e ferramentas.",
      "Explique o porquê das regras que não podem mudar.",
    ],
  },
  apoio: {
    factorId: "apoio",
    signal: "A equipe não tem certeza de que encontraria apoio da liderança se precisasse.",
    actions: [
      "Marque conversas individuais curtas e regulares; 15 minutos a cada duas semanas já ajudam.",
      "Deixe claro como e quando a equipe pode pedir ajuda, e responda a esses pedidos com rapidez.",
      "Reconheça o esforço e as entregas da equipe, não só os resultados.",
      "Se a liderança também estiver sobrecarregada, peça apoio do RH com redistribuição ou formação.",
    ],
  },
  relacoes: {
    factorId: "relacoes",
    signal: "O convívio na equipe não tem sido percebido como respeitoso.",
    actions: [
      "Converse com a equipe sobre combinados de convivência: como discordar, pedir e dar retorno.",
      "Observe reuniões e canais de mensagem, onde interrupções, tom e exclusão costumam aparecer primeiro.",
      "Lembre a equipe dos canais da empresa para relatar desrespeito ou assédio, sem risco de retaliação.",
      "Se houver conflito entre pessoas específicas, envolva o RH para mediar.",
    ],
  },
};

export const WORK_FACTOR_GUIDE_PRIVACY_NOTE =
  "O sinal é da equipe, e as ações também. Não tente descobrir quem respondeu nem cobre respostas individuais.";

export function workFactorGuide(factorId: WorkFactorId): WorkFactorGuide {
  return WORK_FACTOR_GUIDES[factorId];
}

/** Guia só aparece quando o fator pede atenção; favorável não tem ação sugerida. */
export function workFactorGuideIntro(level: WorkFactorLevel | null): string | null {
  if (level === "risco") {
    return "Prioridade: comece nesta semana e acompanhe a média nas próximas semanas.";
  }
  if (level === "atencao") {
    return "Vale agir antes que piore. Escolha uma ação e acompanhe a média.";
  }
  return null;
}
