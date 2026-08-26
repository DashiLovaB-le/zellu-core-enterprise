import { ProductTourModal, type ProductTourStep } from "@/components/ProductTourModal";
import { BRANDING } from "@/lib/branding";

const STEPS: ProductTourStep[] = [
  {
    pose: "wave",
    title: "Olá! Que bom ter você aqui",
    body: `Sou o companheiro do ${BRANDING.shortName}. Em poucos passos, mostro o essencial para cuidar do seu bem-estar no ritmo do trabalho.`,
    hint: "Leva menos de um minuto",
  },
  {
    pose: "encourage",
    title: "Check-in matinal",
    body: "Registre sono, água e humor uma vez por dia. É o ponto de partida do seu dashboard e ajuda a perceber padrões com o tempo.",
    icon: "checklist",
    hint: "Menu · Check-in",
  },
  {
    pose: "listen",
    title: "Chat com o companion",
    body: "Converse quando precisar desabafar ou organizar o dia. Em momentos de crise, o app prioriza ajuda real (CVV 188) — não substitui cuidado profissional.",
    icon: "chat_bubble",
    hint: "Menu · Chat",
  },
  {
    pose: "idle-calm",
    title: "Diário, plano e bem-estar",
    body: "Acompanhe sua timeline, o plano de cuidado com checklist diário e os indicadores de bem-estar. Tudo no seu ritmo, com privacidade.",
    icon: "auto_stories",
    hint: "Diário · Plano · Bem-estar",
  },
  {
    pose: "breathe",
    title: "Respiro e Perfil",
    body: "Use o Respiro para uma pausa guiada. No Perfil, ajuste privacidade, tema e dados da conta — você controla o que compartilha com a IA e com o RH.",
    icon: "air",
    hint: "Respiro · Perfil",
  },
  {
    pose: "cheer",
    title: "Pronto para começar",
    body: "Explore com calma. Se precisar, volte ao check-in ou ao chat a qualquer momento. Estamos juntos no cuidado do dia a dia.",
    hint: "Bom uso!",
  },
];

/** Pop-up educativo do companion — após onboarding LGPD, no primeiro uso. */
export function CompanionProductTour() {
  return (
    <ProductTourModal audience="companion" steps={STEPS} eyebrow="Guia rápido" />
  );
}
