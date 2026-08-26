import type { CompanionId } from "./types";

export type FallbackVoiceParams = {
  who: string;
  salutation?: string;
  moodLabel?: string;
  planHint?: string;
  moodWord?: string;
  sleepLabel?: string;
  snippet?: string;
};

export type FallbackVoiceKey =
  | "repeatWithLast"
  | "repeatGeneric"
  | "greeting"
  | "moodLabel"
  | "breathe"
  | "pause"
  | "hydration"
  | "anxiety"
  | "sad"
  | "positiveStill"
  | "positiveContextMood"
  | "positiveGeneric"
  | "movement"
  | "sleepWithLabel"
  | "sleepTired"
  | "workStress"
  | "moodCheckShort"
  | "moodGenericSnippet"
  | "default";

type VoiceFn = (p: FallbackVoiceParams) => string;

const CHICO_VOICE: Record<FallbackVoiceKey, VoiceFn> = {
  repeatWithLast: () =>
    "Faz sentido — você já tinha compartilhado isso comigo.\n\nVamos seguir de onde paramos: se quiser, faça aquela **pausa curta** agora (2–3 minutos sem tela) ou me conte o que mais está ocupando sua mente hoje.",
  repeatGeneric: () =>
    "Você tem razão, desculpe pela repetição.\n\nMe conta: o que seria mais útil agora — **conversar**, **respirar** um pouco ou **registrar** como está se sentindo?",
  greeting: ({ salutation }) =>
    `${salutation ?? "Olá"}! Estou por aqui para apoiar seu bem-estar no dia a dia.\n\nO que você gostaria de conversar ou cuidar agora?`,
  moodLabel: ({ moodLabel, planHint }) =>
    `Entendo — agora você se sente **${moodLabel ?? "assim"}**.${planHint ?? ""}\n\nObrigado por compartilhar. Quer me contar o que mais está presente para você neste momento?`,
  breathe: ({ who }) =>
    `${who}vamos respirar juntos por um instante.\n\n- Inspire contando até **4**\n- Segure por **2**\n- Solte contando até **6**\n\nRepita mais duas vezes, no seu ritmo.`,
  pause: () =>
    "Boa escolha. Uma **pausa curta** já ajuda:\n\n- Afaste-se da tela por 2–3 minutos\n- Beba um gole de água ou alongue ombros e pescoço\n- Volte quando se sentir um pouco mais presente",
  hydration: () =>
    "Boa ideia cuidar da **hidratação**.\n\nUm copo de água agora já conta — pequenos hábitos sustentam o bem-estar ao longo do dia.",
  anxiety: ({ who }) =>
    `${who}entendo que a **ansiedade** pode pesar.\n\nQue tal uma respiração curta?\n- Inspire contando até **4**\n- Segure por **2**\n- Solte contando até **6**`,
  sad: ({ who }) =>
    `${who}obrigado por compartilhar como está se sentindo.\n\nMomentos difíceis fazem parte — um passo pequeno, como *beber água* ou *uma caminhada curta*, pode ajudar.`,
  positiveStill: ({ who, moodWord }) =>
    `${who}que bom saber que você **continua se sentindo ${moodWord ?? "bem"}**.\n\nEsse tipo de momento vale ser notado. Se fizer sentido, aproveite para uma pausa curta ou um alongamento leve e mantenha esse cuidado ao longo do dia.`,
  positiveContextMood: ({ who, moodWord }) =>
    `${who}que bom saber que você está se sentindo **${moodWord ?? "bem"}** hoje.\n\nEsse tipo de momento vale ser notado. Se fizer sentido, aproveite para uma pausa curta ou um alongamento leve e mantenha esse cuidado ao longo do dia.`,
  positiveGeneric: ({ who }) =>
    `${who}fico feliz em saber que o dia está indo bem.\n\nSe quiser, vale registrar isso no check-in ou fazer uma pausa breve para prolongar essa sensação.`,
  movement: () =>
    "Ótima ideia. Um **alongamento curto** (pescoço, ombros e costas por 2–3 minutos) pode ajudar corpo e mente.\n\nRespire devagar enquanto alonga e volte ao que estava fazendo com mais presença.",
  sleepWithLabel: ({ sleepLabel }) =>
    `Vi que seu sono recente foi **${sleepLabel ?? "irregular"}**.\n\nSe puder hoje: reduzir telas antes de dormir e manter um horário mais regular.`,
  sleepTired: ({ who }) =>
    `${who}o **cansaço** pede cuidado.\n\nPriorize uma pausa sem telas e, se possível, um horário de sono mais estável esta noite.`,
  workStress: ({ who }) =>
    `${who}parece que o **trabalho** está pesando.\n\nTalvez ajude separar uma tarefa de cada vez e fazer uma pausa curta antes de retomar. Quer me contar o que está mais intenso agora?`,
  moodCheckShort: ({ who, moodWord }) =>
    `${who}obrigado por escrever.\n\nPelo seu check-in recente, seu humor estava **"${moodWord ?? ""}"** — como você se sente *agora*, comparado a isso?`,
  moodGenericSnippet: ({ who, snippet }) =>
    `${who}obrigado por compartilhar.\n\nPelo que você escreveu — *"${snippet ?? ""}"* — o que você gostaria de fazer a seguir para cuidar de si?`,
  default: ({ who }) =>
    `${who}obrigado por escrever. Estou disponível para conversar.\n\nPode me contar um pouco mais sobre como está se *sentindo* agora?`,
};

const AMORA_VOICE: Partial<Record<FallbackVoiceKey, VoiceFn>> = {
  greeting: ({ salutation }) =>
    `${salutation ?? "Olá"}! Que bom ter você aqui comigo.\n\nEstou por perto — o que você gostaria de conversar ou cuidar agora?`,
  moodLabel: ({ moodLabel, planHint }) =>
    `Entendo — você se sente **${moodLabel ?? "assim"}** agora.${planHint ?? ""}\n\nObrigada por confiar isso comigo. Quer me contar um pouco mais do que está presente aí dentro?`,
  breathe: ({ who }) =>
    `${who}vamos respirar juntas, no seu tempo.\n\n- Inspire contando até **4**\n- Segure por **2**\n- Solte contando até **6**\n\nRepita mais duas vezes — estou aqui com você.`,
  anxiety: ({ who }) =>
    `${who}a ansiedade pode pesar mesmo. Obrigada por compartilhar.\n\nQue tal uma respiração curta agora?\n- Inspire até **4**\n- Segure **2**\n- Solte até **6**`,
  sad: ({ who }) =>
    `${who}obrigada por me contar como está se sentindo.\n\nMomentos difíceis fazem parte — um passo pequeno, como *beber água* ou *uma pausa sem tela*, pode ajudar um pouco.`,
  workStress: ({ who }) =>
    `${who}parece que o **trabalho** está ocupando bastante espaço.\n\nTalvez ajude pausar um instante antes de retomar. Quer me contar o que está mais pesado agora?`,
  default: ({ who }) =>
    `${who}obrigada por escrever. Estou aqui com você.\n\nPode me contar um pouco mais sobre como está se *sentindo* neste momento?`,
};

const PIPOCA_VOICE: Partial<Record<FallbackVoiceKey, VoiceFn>> = {
  greeting: ({ salutation }) =>
    `${salutation ?? "Olá"}! Que bom te ver por aqui.\n\nO que você quer conversar ou cuidar hoje?`,
  moodLabel: ({ moodLabel, planHint }) =>
    `Entendi — você está se sentindo **${moodLabel ?? "assim"}**.${planHint ?? ""}\n\nVale a pena notar isso. Quer me contar o que mais está na sua cabeça agora?`,
  breathe: ({ who }) =>
    `${who}bora respirar juntos?\n\n- Inspire contando até **4**\n- Segure **2**\n- Solte até **6**\n\nMais duas vezes, no seu ritmo — já ajuda!`,
  positiveGeneric: ({ who }) =>
    `${who}que bom saber que o dia está indo bem!\n\nSe quiser, registra no check-in ou faz uma pausinha para prolongar essa vibe.`,
  movement: () =>
    "Boa! Um **alongamento curto** (pescoço, ombros e costas por 2–3 min) já anima o corpo.\n\nRespira devagar e volta com mais presença.",
  default: ({ who }) =>
    `${who}obrigada por escrever! Estou por aqui.\n\nMe conta um pouco mais de como você está se *sentindo* agora?`,
};

const ZECA_VOICE: Partial<Record<FallbackVoiceKey, VoiceFn>> = {
  greeting: ({ salutation }) =>
    `${salutation ?? "Olá"}! Vamos cuidar do seu dia com foco.\n\nO que você quer resolver ou conversar agora?`,
  moodLabel: ({ moodLabel, planHint }) =>
    `Anotado — humor **${moodLabel ?? "assim"}** agora.${planHint ?? ""}\n\nO que mais está impactando seu dia? Isso ajuda a escolher o próximo passo.`,
  breathe: ({ who }) =>
    `${who}antes de continuar, vamos respirar:\n\n- Inspire até **4**\n- Segure **2**\n- Solte até **6**\n\nDuas repetições — depois retomamos com mais clareza.`,
  pause: () =>
    "Boa call. **Pausa curta**:\n\n- 2–3 minutos longe da tela\n- Água ou alongamento rápido\n- Volta quando estiver mais presente",
  workStress: ({ who }) =>
    `${who}parece que o **trabalho** está pesando.\n\nSepara uma tarefa de cada vez. Qual é a mais urgente agora — ou vale uma pausa antes de decidir?`,
  positiveGeneric: ({ who }) =>
    `${who}bom sinal — dia fluindo bem.\n\nVale registrar no check-in ou usar esse momento para consolidar um hábito do plano.`,
  default: ({ who }) =>
    `${who}obrigado por escrever. Estou aqui.\n\nMe diz: o que seria mais útil agora — conversar, pausar ou organizar o próximo passo?`,
};

const VOICES: Record<CompanionId, Partial<Record<FallbackVoiceKey, VoiceFn>>> = {
  Chico: CHICO_VOICE,
  Amora: AMORA_VOICE,
  Pipoca: PIPOCA_VOICE,
  Zeca: ZECA_VOICE,
};

export function companionFallbackPhrase(
  companionId: CompanionId,
  key: FallbackVoiceKey,
  params: FallbackVoiceParams,
): string {
  const fn = VOICES[companionId]?.[key] ?? CHICO_VOICE[key];
  return fn(params);
}
