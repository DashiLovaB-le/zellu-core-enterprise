export type LocalFallbackContext = {
  sleepHours?: number;
  sleepLabel?: string;
  waterMl?: number;
  mood?: string;
  greeting?: string;
};

const POSITIVE_MOOD = /\b(grat\w*|feliz|animad\w*|bem|ótimo|otimo|leve|tranquil\w*|calm\w*|contente|motivad\w*)\b/i;
const GREETING = /\b(ol[aá]|oi|bom dia|boa tarde|boa noite|e a[ií]|hey|hello)\b/i;
const MOVEMENT = /\b(along\w*|moviment\w*|camih\w*|exerc[ií]c\w*|stretch|corrid\w*|academia)\b/i;
const WORK_STRESS = /\b(trabalh\w*|reuni[aã]o|prazo|chefe|equipe|sobrecar\w*|deadline|tarefa\w*)\b/i;
const GRATITUDE = /\b(grat\w*|agradec\w*|obrigad\w*)\b/i;

function address(name: string): string {
  return name.trim().toLowerCase() === "você" ? "" : `${name}, `;
}

export function buildLocalFallbackReply(
  text: string,
  name: string,
  context: LocalFallbackContext,
): string {
  const lower = text.toLowerCase().trim();
  const who = address(name);

  if (GREETING.test(lower) && lower.length < 40) {
    const salutation = context.greeting ?? "Olá";
    return `${salutation}! Estou por aqui para apoiar seu bem-estar no dia a dia.\n\nO que você gostaria de conversar ou cuidar agora?`;
  }

  if (lower.includes("ansios") || lower.includes("preocup") || lower.includes("nervos")) {
    return `${who}entendo que a **ansiedade** pode pesar.\n\nQue tal uma respiração curta?\n- Inspire contando até **4**\n- Segure por **2**\n- Solte contando até **6**`;
  }

  if (lower.includes("triste") || lower.includes("mal") || lower.includes("desanim") || lower.includes("baixo")) {
    return `${who}obrigado por compartilhar como está se sentindo.\n\nMomentos difíceis fazem parte — um passo pequeno, como *beber água* ou *uma caminhada curta*, pode ajudar.`;
  }

  if (GRATITUDE.test(lower) || POSITIVE_MOOD.test(lower)) {
    if (context.mood && POSITIVE_MOOD.test(context.mood)) {
      return `Que bom saber que você está se sentindo **${context.mood}** hoje.\n\nEsse tipo de momento vale ser notado. Se fizer sentido, aproveite para uma pausa curta ou um alongamento leve e mantenha esse cuidado ao longo do dia.`;
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

  if (lower.includes("água") || lower.includes("agua") || lower.includes("hidrat")) {
    return `Boa ideia cuidar da **hidratação**.\n\nUm copo de água agora já conta — pequenos hábitos sustentam o bem-estar ao longo do dia.`;
  }

  if (WORK_STRESS.test(lower)) {
    return `${who}parece que o **trabalho** está pesando.\n\nTalvez ajude separar uma tarefa de cada vez e fazer uma pausa curta antes de retomar. Quer me contar o que está mais intenso agora?`;
  }

  if (context.mood && lower.length < 24) {
    return `${who}obrigado por escrever.\n\nPelo seu check-in recente, seu humor estava **"${context.mood}"** — como você se sente *agora*, comparado a isso?`;
  }

  if (context.mood) {
    const snippet = text.length > 80 ? `${text.slice(0, 77)}…` : text;
    return `${who}obrigado por compartilhar.\n\nPelo que você escreveu — *"${snippet}"* — parece um momento importante. O que você gostaria de fazer a seguir para cuidar de si?`;
  }

  return `${who}obrigado por escrever. Estou disponível para conversar.\n\nPode me contar um pouco mais sobre como está se *sentindo* agora?`;
}
