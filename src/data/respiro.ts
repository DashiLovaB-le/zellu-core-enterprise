import chuvaSrc from "@/assets/respiro/sounds/chuva.mp3";
import florestaSrc from "@/assets/respiro/sounds/floresta.mp3";
import fogueiraSrc from "@/assets/respiro/sounds/fogueira.mp3";
import ondasSrc from "@/assets/respiro/sounds/ondas.mp3";

/** Ambient loops — Mixkit License (mixkit.co/free-sound-effects) */
export const RESPIRO_SOUND_IDS = ["chuva", "floresta", "fogueira", "ondas"] as const;

export type RespiroSoundId = (typeof RESPIRO_SOUND_IDS)[number];

export type RespiroSound = {
  id: RespiroSoundId;
  name: string;
  icon: string;
  color: string;
  src: string;
};

export const SOUNDS: RespiroSound[] = [
  { id: "chuva", name: "Chuva", icon: "rainy", color: "var(--clay-joy)", src: chuvaSrc },
  { id: "floresta", name: "Floresta", icon: "forest", color: "var(--clay-joy)", src: florestaSrc },
  {
    id: "fogueira",
    name: "Fogueira",
    icon: "local_fire_department",
    color: "var(--clay-anxiety)",
    src: fogueiraSrc,
  },
  { id: "ondas", name: "Ondas", icon: "waves", color: "var(--clay-cta)", src: ondasSrc },
];

export const BREATH_PHASES = [
  { text: "Inspire…", duration: 2800 },
  { text: "Segure…", duration: 1200 },
  { text: "Expire…", duration: 2000 },
];

export function getRespiroSound(id: string | null | undefined): RespiroSound | undefined {
  if (!id) return undefined;
  return SOUNDS.find((s) => s.id === id);
}
