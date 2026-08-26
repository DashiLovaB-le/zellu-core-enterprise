import type { CompanionSuggestion } from "@/lib/companion-agent";
import type { CompanionId } from "./types";

export type QuickReplyAction = CompanionSuggestion | "checkin" | "plano";

export type ResolvedQuickReply = {
  buttonLabel: string;
  messageText: string;
  navigates?: boolean;
};

const SUGGESTION_LABELS: Record<CompanionSuggestion, string> = {
  respirar: "Respirar",
  agua: "Beber água",
  pausa: "Fazer pausa",
  movimento: "Alongar",
  checkin: "Fazer check-in",
  plano: "Abrir plano",
  humor: "Ver humor",
  sono: "Ver sono",
};

/** Texto enviado ao chat quando o usuário toca na sugestão da IA — varia por companion */
const SUGGESTION_MESSAGES: Record<CompanionId, Record<CompanionSuggestion, string>> = {
  Chico: {
    respirar: "Vamos respirar",
    agua: "Beber água",
    pausa: "Fazer uma pausa",
    movimento: "Fazer um alongamento",
    checkin: "fazer check-in",
    plano: "abrir plano de cuidado",
    humor: "Como está meu humor",
    sono: "Preciso cuidar do sono",
  },
  Amora: {
    respirar: "Quero respirar com calma",
    agua: "Vou beber água agora",
    pausa: "Preciso de uma pausa",
    movimento: "Quero me alongar um pouco",
    checkin: "fazer check-in",
    plano: "abrir plano de cuidado",
    humor: "Quero falar do meu humor",
    sono: "Quero cuidar do meu sono",
  },
  Pipoca: {
    respirar: "Bora respirar juntos?",
    agua: "Hora de beber água!",
    pausa: "Vou fazer uma pausinha",
    movimento: "Quero me mexer um pouco",
    checkin: "fazer check-in",
    plano: "abrir plano de cuidado",
    humor: "Como está meu humor hoje?",
    sono: "Preciso descansar melhor",
  },
  Zeca: {
    respirar: "Vamos respirar antes de continuar",
    agua: "Beber água agora",
    pausa: "Pausa rápida e retomo",
    movimento: "Alongamento de 2 minutos",
    checkin: "fazer check-in",
    plano: "abrir plano de cuidado",
    humor: "Revisar meu humor",
    sono: "Organizar minha rotina de sono",
  },
};

export type StarterQuickReply = { label: string; text: string };

/** Atalhos opcionais quando o chat ainda está vazio (além dos humores) */
export const COMPANION_STARTER_REPLIES: Record<CompanionId, StarterQuickReply[]> = {
  Chico: [
    { label: "Vamos respirar", text: "Vamos respirar" },
    { label: "Organizar o dia", text: "Preciso organizar o dia" },
  ],
  Amora: [
    { label: "Preciso desabafar", text: "Preciso desabafar um pouco" },
    { label: "Me sinto sobrecarregada", text: "Me sinto sobrecarregada" },
  ],
  Pipoca: [
    { label: "Animar o dia", text: "Preciso animar o dia" },
    { label: "Contar algo bom", text: "Quero contar algo bom que aconteceu" },
  ],
  Zeca: [
    { label: "Próximo passo", text: "Qual o próximo passo que faz sentido agora?" },
    { label: "Organizar tarefas", text: "Preciso organizar minhas tarefas" },
  ],
};

export function resolveCompanionQuickReply(
  companionId: CompanionId,
  aiSuggestion: QuickReplyAction,
): ResolvedQuickReply | null {
  if (aiSuggestion === "checkin") {
    return {
      buttonLabel: SUGGESTION_LABELS.checkin,
      messageText: SUGGESTION_MESSAGES[companionId].checkin,
      navigates: true,
    };
  }
  if (aiSuggestion === "plano") {
    return {
      buttonLabel: SUGGESTION_LABELS.plano,
      messageText: SUGGESTION_MESSAGES[companionId].plano,
      navigates: true,
    };
  }

  const key = aiSuggestion as CompanionSuggestion;
  if (!(key in SUGGESTION_LABELS)) return null;

  return {
    buttonLabel: SUGGESTION_LABELS[key],
    messageText: SUGGESTION_MESSAGES[companionId][key],
  };
}

export function getCompanionStarterReplies(companionId: CompanionId): StarterQuickReply[] {
  return COMPANION_STARTER_REPLIES[companionId] ?? COMPANION_STARTER_REPLIES.Chico;
}
