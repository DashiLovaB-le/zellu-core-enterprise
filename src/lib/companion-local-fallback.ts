import { ALL_MOODS } from "@/data/moods";

export type LocalFallbackContext = {
  sleepHours?: number;
  sleepLabel?: string;
  waterMl?: number;
  mood?: string;
  greeting?: string;
  preferredName?: string;
  planGoal?: string;
};

export type LocalFallbackTurn = { role: "user" | "assistant"; content: string };

const POSITIVE_MOOD = /\b(grat\w*|feliz|animad\w*|bem|ótimo|otimo|leve|tranquil\w*|calm\w*|contente|motivad\w*)\b/i;
const GREETING = /\b(ol[aá]|oi|bom dia|boa tarde|boa noite|e a[ií]|hey|hello)\b/i;
const MOVEMENT = /\b(along\w*|moviment\w*|camih\w*|exerc[ií]c\w*|stretch|corrid\w*|academia)\b/i;
const WORK_STRESS = /\b(trabalh\w*|reuni[aã]o|prazo|chefe|equipe|sobrecar\w*|deadline|tarefa\w*)\b/i;
const GRATITUDE = /\b(grat\w*|agradec\w*|obrigad\w*)\b/i;
const PAUSE = /\b(pausa|descans\w*|parar\s+um\s+pouco)\b/i;
const BREATHE = /\b(respir\w*|respiração)\b/i;
const HYDRATION = /\b(água|agua|beber|hidrat\w*)\b/i;
const REPEAT_FRUSTRATION =
  /\b(j[aá]\s+respondi|respondi\s+isso|de\s+novo|repet\w*|u[eé]|ser[ií]o|outra\s+vez)\b/i;
const MOOD_STILL = /\b(ainda|continuo|continua|mesmo|mesma)\b/i;

const MOOD_LABELS = new Set(ALL_MOODS.map((m) => m.label.toLowerCase()));
const MOOD_VALUES = new Set(ALL_MOODS.map((m) => m.value.toLowerCase()));

function address(name: string, context: LocalFallbackContext): string {
  const who = context.preferredName?.trim() || name;
  return who.trim().toLowerCase() === "você" ? "" : `${who.split(/\s+/)[0]}, `;
}

function normalizeMoodLabel(text: string): string | null {
  const key = text.trim().toLowerCase();
  if (MOOD_LABELS.has(key)) {
    const found = ALL_MOODS.find((m) => m.label.toLowerCase() === key);
    return found?.label ?? key;
  }
  if (MOOD_VALUES.has(key)) {
    const found = ALL_MOODS.find((m) => m.value.toLowerCase() === key);
    return found?.label ?? key;
  }
  return null;
}

function assistantAlreadyAskedMoodCheck(history: LocalFallbackTurn[]): boolean {
  return history.some(
    (turn) =>
      turn.role === "assistant" &&
      /como você se sente\s+\*?agora|humor estava|check-in recente/i.test(turn.content),
  );
}

function userAlreadySharedCurrentMood(history: LocalFallbackTurn[]): boolean {
  return history.some(
    (turn) =>
      turn.role === "user" &&
      (POSITIVE_MOOD.test(turn.content) ||
        GRATITUDE.test(turn.content) ||
        normalizeMoodLabel(turn.content) !== null ||
        /\b(me\s+sinto|estou\s+me\s+sentindo|sinto-me)\b/i.test(turn.content)),
  );
}

function lastAssistantReply(history: LocalFallbackTurn[]): string | null {
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i]?.role === "assistant") return history[i].content;
  }
  return null;
}

export function buildLocalFallbackReply(
  text: string,
  name: string,
  context: LocalFallbackContext,
  history: LocalFallbackTurn[] = [],
): string {
  const lower = text.toLowerCase().trim();
  const who = address(name, context);
  const moodLabel = normalizeMoodLabel(text);
  const askedMoodBefore = assistantAlreadyAskedMoodCheck(history);
  const sharedMoodBefore = userAlreadySharedCurrentMood(history);

  if (REPEAT_FRUSTRATION.test(lower)) {
    const lastReply = lastAssistantReply(history);
    if (lastReply && /pausa|alongamento|grato|gratidão/i.test(lastReply)) {
      return `Faz sentido — você já tinha compartilhado isso comigo.\n\nVamos seguir de onde paramos: se quiser, faça aquela **pausa curta** agora (2–3 minutos sem tela) ou me conte o que mais está ocupando sua mente hoje.`;
    }
    return `Você tem razão, desculpe pela repetição.\n\nMe conta: o que seria mais útil agora — **conversar**, **respirar** um pouco ou **registrar** como está se sentindo?`;
  }

  if (GREETING.test(lower) && lower.length < 40) {
    const salutation = context.greeting ?? "Olá";
    return `${salutation}! Estou por aqui para apoiar seu bem-estar no dia a dia.\n\nO que você gostaria de conversar ou cuidar agora?`;
  }

  if (moodLabel) {
    const planHint = context.planGoal ? ` Seu plano agora é ${context.planGoal.toLowerCase()}.` : "";
    return `Entendo — agora você se sente **${moodLabel.toLowerCase()}**.${planHint}\n\nObrigado por compartilhar. Quer me contar o que mais está presente para você neste momento?`;
  }

  if (BREATHE.test(lower)) {
    return `${who}vamos respirar juntos por um instante.\n\n- Inspire contando até **4**\n- Segure por **2**\n- Solte contando até **6**\n\nRepita mais duas vezes, no seu ritmo.`;
  }

  if (PAUSE.test(lower)) {
    return `Boa escolha. Uma **pausa curta** já ajuda:\n\n- Afaste-se da tela por 2–3 minutos\n- Beba um gole de água ou alongue ombros e pescoço\n- Volte quando se sentir um pouco mais presente`;
  }

  if (HYDRATION.test(lower)) {
    return `Boa ideia cuidar da **hidratação**.\n\nUm copo de água agora já conta — pequenos hábitos sustentam o bem-estar ao longo do dia.`;
  }

  if (lower.includes("ansios") || lower.includes("preocup") || lower.includes("nervos")) {
    return `${who}entendo que a **ansiedade** pode pesar.\n\nQue tal uma respiração curta?\n- Inspire contando até **4**\n- Segure por **2**\n- Solte contando até **6**`;
  }

  if (lower.includes("triste") || lower.includes("mal") || lower.includes("desanim") || lower.includes("baixo")) {
    return `${who}obrigado por compartilhar como está se sentindo.\n\nMomentos difíceis fazem parte — um passo pequeno, como *beber água* ou *uma caminhada curta*, pode ajudar.`;
  }

  if (GRATITUDE.test(lower) || POSITIVE_MOOD.test(lower)) {
    if (MOOD_STILL.test(lower) && (context.mood || sharedMoodBefore)) {
      const moodWord = context.mood ?? "bem";
      return `${who}que bom saber que você **continua se sentindo ${moodWord}**.\n\nEsse tipo de momento vale ser notado. Se fizer sentido, aproveite para uma pausa curta ou um alongamento leve e mantenha esse cuidado ao longo do dia.`;
    }
    if (context.mood && POSITIVE_MOOD.test(context.mood)) {
      return `${who}que bom saber que você está se sentindo **${context.mood}** hoje.\n\nEsse tipo de momento vale ser notado. Se fizer sentido, aproveite para uma pausa curta ou um alongamento leve e mantenha esse cuidado ao longo do dia.`;
    }
    return `${who}fico feliz em saber que o dia está indo bem.\n\nSe quiser, vale registrar isso no check-in ou fazer uma pausa breve para prolongar essa sensação.`;
  }

  if (MOVEMENT.test(lower)) {
    return `Ótima ideia. Um **alongamento curto** (pescoço, ombros e costas por 2–3 minutos) pode ajudar corpo e mente.\n\nRespire devagar enquanto alonga e volte ao que estava fazendo com mais presença.`;
  }

  if (lower.includes("sono") || lower.includes("dorm") || lower.includes("cansad")) {
    return context.sleepLabel
      ? `Vi que seu sono recente foi **${context.sleepLabel.toLowerCase()}**.\n\nSe puder hoje: reduzir telas antes de dormir e manter um horário mais regular.`
      : `${who}o **cansaço** pede cuidado.\n\nPriorize uma pausa sem telas e, se possível, um horário de sono mais estável esta noite.`;
  }

  if (WORK_STRESS.test(lower)) {
    return `${who}parece que o **trabalho** está pesando.\n\nTalvez ajude separar uma tarefa de cada vez e fazer uma pausa curta antes de retomar. Quer me contar o que está mais intenso agora?`;
  }

  if (
    context.mood &&
    lower.length < 24 &&
    !askedMoodBefore &&
    !sharedMoodBefore
  ) {
    return `${who}obrigado por escrever.\n\nPelo seu check-in recente, seu humor estava **"${context.mood}"** — como você se sente *agora*, comparado a isso?`;
  }

  if (context.mood) {
    const snippet = text.length > 80 ? `${text.slice(0, 77)}…` : text;
    return `${who}obrigado por compartilhar.\n\nPelo que você escreveu — *"${snippet}"* — o que você gostaria de fazer a seguir para cuidar de si?`;
  }

  return `${who}obrigado por escrever. Estou disponível para conversar.\n\nPode me contar um pouco mais sobre como está se *sentindo* agora?`;
}
