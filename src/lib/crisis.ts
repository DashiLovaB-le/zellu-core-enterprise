export const CVV_PHONE = "188";
export const CVV_LABEL = "CVV — Centro de Valorização da Vida";

const CRISIS_PATTERNS: RegExp[] = [
  /\bsuicid/i,
  /\bme matar\b/i,
  /\btirar minha vida\b/i,
  /\bn[aã]o quero mais (viver|viver|acordar)\b/i,
  /\bquero morrer\b/i,
  /\bvontade de morrer\b/i,
  /\bacabar com (tudo|a minha vida)\b/i,
  /\bme machucar\b/i,
  /\bautomutil/i,
  /\bme cortar\b/i,
  /\bsem raz[aã]o para (viver|continuar)\b/i,
  /\bplano de (me )?matar\b/i,
];

export function detectCrisisLanguage(text: string): boolean {
  const normalized = text.trim();
  if (!normalized) return false;
  return CRISIS_PATTERNS.some((re) => re.test(normalized));
}

export function buildCrisisReply(name?: string, companyChannel?: string | null): string {
  const who = name?.trim() ? name.trim() : "você";
  const channel = companyChannel?.trim()
    ? `\n- Canal da sua empresa: ${companyChannel.trim()}`
    : "";
  return `${who}, obrigado por falar o que está sentindo. Este espaço **não substitui ajuda profissional**, e o que você descreveu merece apoio agora.

Procure ajuda imediatamente:
- ${CVV_LABEL}: ligue **${CVV_PHONE}** (24h, gratuito)
- Emergência: **192** (SAMU) ou **190**${channel}

Se estiver em risco neste momento, peça ajuda a alguém próximo ou ligue agora. Estou aqui para acompanhar o cuidado no dia a dia, não para tratar uma crise.`;
}
