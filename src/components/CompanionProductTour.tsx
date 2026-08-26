import { useEffect, useId, useState } from "react";
import { Mascot, type MascotPose } from "@/components/Mascot";
import { Icon } from "@/components/Icon";
import { ClayLoader } from "@/components/ClayLoader";
import { completeProductTour, getProductTourStatus } from "@/lib/api/tour.server";
import { BRANDING } from "@/lib/branding";

type TourStep = {
  pose: MascotPose;
  title: string;
  body: string;
  hint?: string;
  icon?: string;
};

const STEPS: TourStep[] = [
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

const HOST_ATTR = "data-mmc-product-tour-host";

/**
 * Pop-up educativo do companion — aparece após o onboarding LGPD,
 * no primeiro uso (product_tour_completed_at nulo).
 * Só uma instância ativa (mobile+desktop shells montam juntos).
 */
export function CompanionProductTour() {
  const instanceId = useId();
  const [isHost, setIsHost] = useState(false);
  const [open, setOpen] = useState(false);
  const [checking, setChecking] = useState(true);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const existing = document.documentElement.getAttribute(HOST_ATTR);
    if (existing && existing !== instanceId) return;

    document.documentElement.setAttribute(HOST_ATTR, instanceId);
    setIsHost(true);

    return () => {
      if (document.documentElement.getAttribute(HOST_ATTR) === instanceId) {
        document.documentElement.removeAttribute(HOST_ATTR);
      }
    };
  }, [instanceId]);

  useEffect(() => {
    if (!isHost) return;
    let cancelled = false;
    (async () => {
      const result = await getProductTourStatus();
      if (cancelled) return;
      if (result.status?.needsTour) setOpen(true);
      setChecking(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [isHost]);

  const finish = async () => {
    if (saving) return;
    setSaving(true);
    await completeProductTour();
    setSaving(false);
    setOpen(false);
  };

  const next = () => {
    if (step >= STEPS.length - 1) {
      void finish();
      return;
    }
    setStep((s) => s + 1);
  };

  const back = () => {
    setStep((s) => Math.max(0, s - 1));
  };

  if (!isHost || checking || !open) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-[oklch(0.25_0.02_260/0.45)] p-3 backdrop-blur-[2px] sm:items-center sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-tour-title"
    >
      <div
        className="w-full max-w-[400px] overflow-hidden rounded-[1.5rem] bg-white/95 backdrop-blur-md sm:rounded-[1.75rem]"
        style={{
          boxShadow:
            "0 12px 40px rgba(74, 106, 138, 0.16), inset 2px 2px 4px rgba(255, 255, 255, 0.9)",
        }}
      >
        <div className="h-1 w-full bg-[var(--clay-cta-2)]/40">
          <div
            className="h-full rounded-r-full bg-gradient-to-r from-[#99BEE5] to-[#C5D9F1] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="px-5 pb-5 pt-4 sm:px-6 sm:pb-6 sm:pt-5">
          <div className="mb-1 flex items-start justify-between gap-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--clay-title)]/45">
              Guia rápido · {step + 1}/{STEPS.length}
            </p>
            <button
              type="button"
              onClick={() => void finish()}
              disabled={saving}
              className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-[var(--clay-title)]/50 hover:bg-white/80 hover:text-[var(--clay-title)] disabled:opacity-50"
            >
              Pular
            </button>
          </div>

          <div className="mb-3 flex justify-center sm:mb-4">
            <Mascot pose={current.pose} size="md" className="sm:hidden" />
            <Mascot pose={current.pose} size="lg" className="hidden sm:block" />
          </div>

          {current.icon ? (
            <div className="mb-2 flex justify-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--clay-cta-2)]/50 px-2.5 py-1 text-[var(--icon-stroke)]">
                <Icon name={current.icon} className="text-base" />
              </span>
            </div>
          ) : null}

          <h2
            id="product-tour-title"
            className="text-center font-display text-lg leading-snug text-[var(--clay-title)] sm:text-xl"
          >
            {current.title}
          </h2>
          <p className="mt-2 text-center text-xs leading-relaxed text-[var(--clay-text)]/75 sm:text-sm">
            {current.body}
          </p>
          {current.hint ? (
            <p className="mt-2 text-center text-[10px] font-semibold text-[var(--clay-cta)] sm:text-xs">
              {current.hint}
            </p>
          ) : null}

          <div className="mt-5 flex items-center gap-2 sm:mt-6">
            {step > 0 ? (
              <button
                type="button"
                onClick={back}
                disabled={saving}
                className="rounded-full px-4 py-2 text-xs font-semibold text-[var(--clay-title)]/70 hover:bg-white/70 disabled:opacity-50 sm:text-sm"
              >
                Voltar
              </button>
            ) : (
              <span className="w-[4.5rem]" />
            )}
            <button
              type="button"
              onClick={next}
              disabled={saving}
              className="clay-cta ml-auto flex min-w-[8.5rem] items-center justify-center gap-2 px-5 py-2 text-xs font-bold active:clay-cta-active disabled:opacity-50 sm:text-sm"
            >
              {saving ? (
                <ClayLoader size="sm" className="text-[oklch(0.25_0.04_254)]" />
              ) : isLast ? (
                "Começar"
              ) : (
                "Próximo"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
