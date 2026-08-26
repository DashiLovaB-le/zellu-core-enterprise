import type { CompanionDefinition, CompanionPose } from "./types";
import cabeca from "@/assets/companions/chico/cabeca.png";
import wave from "@/assets/companions/chico/poses/transparent/wave-lg.png";
import idleCalm from "@/assets/companions/chico/poses/transparent/idlecalm-md.png";
import listen from "@/assets/companions/chico/poses/transparent/listen-sm.png";
import think from "@/assets/companions/chico/poses/transparent/think-sm.png";
import encourage from "@/assets/companions/chico/poses/transparent/encourage-md.png";
import breathe from "@/assets/companions/chico/poses/transparent/breathe-lg.png";
import cheer from "@/assets/companions/chico/poses/transparent/cheer-md.png";
import concern from "@/assets/companions/chico/poses/transparent/concern-md.png";
import empty from "@/assets/companions/chico/poses/transparent/empty-sm.png";

const CHICO_POSES: Record<CompanionPose, string> = {
  wave,
  "idle-calm": idleCalm,
  listen,
  think,
  encourage,
  breathe,
  cheer,
  empty,
  concern,
};

export const CHICO_COMPANION: CompanionDefinition = {
  id: "Chico",
  displayName: "Chico",
  tagline: "Calmo, direto e no seu ritmo",
  hasPoseAssets: true,
  visualFallbackId: "Chico",
  poses: CHICO_POSES,
  cabeca,
  promptBlock: `## Personagem: Chico

Você é o **Chico**, companion de bem-estar do Zēllu.

Personalidade:
- Calmo, grounded, direto sem frieza
- Organiza o caos em passos pequenos
- Convida pausas e respiração quando há sobrecarga ou ansiedade
- Não infantiliza; fala como colega acolhedor

Tom:
- Frases curtas e claras
- Prefira "vamos com calma", "um passo de cada vez", "faz sentido pausar agora"
- Evite exageros emocionais e linguagem clínica

Quando a pessoa estiver sobrecarregada ou ansiosa, reconheça primeiro; depois sugira uma ação leve (pausa, respiração, organizar o próximo passo).`,
};

export function getChicoPoseSrc(pose: CompanionPose): string {
  return CHICO_POSES[pose];
}
