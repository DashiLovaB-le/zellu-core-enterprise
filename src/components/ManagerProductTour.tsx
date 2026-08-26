import { ProductTourModal, type ProductTourStep } from "@/components/ProductTourModal";
import { BRANDING } from "@/lib/branding";

const STEPS: ProductTourStep[] = [
  {
    pose: "wave",
    title: "Bem-vindo ao painel RH",
    body: `Aqui o ${BRANDING.shortName} mostra sinais agregados de bem-estar da sua empresa — com privacidade e k-anonimato. Vou te mostrar o essencial.`,
    hint: "Leva menos de um minuto",
  },
  {
    pose: "think",
    title: "Dashboard RH",
    body: "Veja participação, tendências e distribuição de humor em pizzas (7 dias fixos e um período que você escolhe). Exporte o relatório em PDF quando precisar.",
    icon: "dashboard",
    hint: "Menu · Dashboard RH",
  },
  {
    pose: "encourage",
    title: "Equipes",
    body: "Organize times, renomeie e mova pessoas. Métricas de time só aparecem com k-anonimato (mínimo de colaboradores com opt-in RH).",
    icon: "groups",
    hint: "Menu · Equipes",
  },
  {
    pose: "idle-calm",
    title: "Pessoas e convites",
    body: "Convide colaboradores, veja o diretório e abra a ficha de cada pessoa — com resumo de bem-estar, sem humor diário, diário ou chat individual.",
    icon: "person_add",
    hint: "Menu · Pessoas",
  },
  {
    pose: "listen",
    title: "Relatórios",
    body: "Filtre o período e exporte CSV ou PDF com dados agregados e opt-in. Nada de conteúdo sensível nominativo.",
    icon: "bar_chart",
    hint: "Menu · Relatórios",
  },
  {
    pose: "cheer",
    title: "Pronto para o painel",
    body: "Use os alertas e tendências para apoiar ações de cuidado — sempre no agregado. Em Perfil você ajusta sua conta; o modo colaborador fica no menu lateral.",
    hint: "Bom trabalho!",
  },
];

/** Pop-up educativo do RH/manager — no primeiro acesso ao painel. */
export function ManagerProductTour() {
  return (
    <ProductTourModal audience="manager" steps={STEPS} eyebrow="Guia RH" />
  );
}
