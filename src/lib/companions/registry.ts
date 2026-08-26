import type { CompanionDefinition } from "./types";
import { CHICO_COMPANION } from "./chico";
import { AMORA_COMPANION } from "./amora";
import { PIPOCA_COMPANION } from "./pipoca";
import { ZECA_COMPANION } from "./zeca";

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
