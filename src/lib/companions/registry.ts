import amoraCabeca from "@/assets/avatar/cabeca/Amora.png";
import pipocaCabeca from "@/assets/avatar/cabeca/Pipoca.png";
import zecaCabeca from "@/assets/avatar/cabeca/Zeca.png";
import type { CompanionDefinition } from "./types";
import { CHICO_COMPANION } from "./chico";

const PLACEHOLDER_PROMPT = (name: string, tone: string) => `## Personagem: ${name}

Você é **${name}**, companion de bem-estar do Zēllu.
${tone}`;

export const AMORA_COMPANION: CompanionDefinition = {
  id: "Amora",
  displayName: "Amora",
  tagline: "Acolhedora e empática",
  hasPoseAssets: false,
  visualFallbackId: "Chico",
  poses: {},
  cabeca: amoraCabeca,
  promptBlock: PLACEHOLDER_PROMPT(
    "Amora",
    "Tom suave, empático e acolhedor. Reconheça sentimentos antes de sugerir ações.",
  ),
};

export const PIPOCA_COMPANION: CompanionDefinition = {
  id: "Pipoca",
  displayName: "Pipoca",
  tagline: "Leve, calorosa e animada",
  hasPoseAssets: false,
  visualFallbackId: "Chico",
  poses: {},
  cabeca: pipocaCabeca,
  promptBlock: PLACEHOLDER_PROMPT(
    "Pipoca",
    "Tom leve e caloroso. Celebre pequenas vitórias com naturalidade.",
  ),
};

export const ZECA_COMPANION: CompanionDefinition = {
  id: "Zeca",
  displayName: "Zeca",
  tagline: "Focado e motivador",
  hasPoseAssets: false,
  visualFallbackId: "Chico",
  poses: {},
  cabeca: zecaCabeca,
  promptBlock: PLACEHOLDER_PROMPT(
    "Zeca",
    "Tom prático e motivador. Sugira próximos passos concretos e alcançáveis.",
  ),
};

export const COMPANION_REGISTRY: Record<
  CompanionDefinition["id"],
  CompanionDefinition
> = {
  Chico: CHICO_COMPANION,
  Amora: AMORA_COMPANION,
  Pipoca: PIPOCA_COMPANION,
  Zeca: ZECA_COMPANION,
};

export const DEFAULT_COMPANION_ID = "Chico" as const;

export function resolveCompanionId(avatarUrl?: string | null): CompanionDefinition["id"] {
  const name = avatarUrl?.trim();
  if (name && name in COMPANION_REGISTRY) {
    return name as CompanionDefinition["id"];
  }
  return DEFAULT_COMPANION_ID;
}

export function getCompanion(id: CompanionDefinition["id"]): CompanionDefinition {
  return COMPANION_REGISTRY[id];
}

export function getCompanionForAvatar(avatarUrl?: string | null): CompanionDefinition {
  return getCompanion(resolveCompanionId(avatarUrl));
}

/** Companion usado para render visual (poses) — fallback Chico até assets existirem */
export function getVisualCompanion(avatarUrl?: string | null): CompanionDefinition {
  const selected = getCompanionForAvatar(avatarUrl);
  if (selected.hasPoseAssets) return selected;
  return getCompanion(selected.visualFallbackId);
}

export function getCompanionPoseSrc(
  companion: CompanionDefinition,
  pose: keyof CompanionDefinition["poses"] | string,
): string | undefined {
  const visual = companion.hasPoseAssets ? companion : getCompanion(companion.visualFallbackId);
  const key = pose as keyof typeof visual.poses;
  return visual.poses[key];
}

export function getCompanionPromptBlock(avatarUrl?: string | null): string {
  return getCompanionForAvatar(avatarUrl).promptBlock;
}

export function getCompanionDisplayName(avatarUrl?: string | null): string {
  return getCompanionForAvatar(avatarUrl).displayName;
}
