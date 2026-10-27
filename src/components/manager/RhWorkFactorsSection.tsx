import { useId, useState } from "react";
import { Icon } from "@/components/Icon";
import type { RhWorkFactorReport, RhWorkFactorSignal } from "@/lib/work-factors";
import { workFactorLevelLabel } from "@/lib/work-factors";
import {
  WORK_FACTOR_GUIDE_PRIVACY_NOTE,
  workFactorGuide,
  workFactorGuideIntro,
} from "@/lib/work-factor-guides";

const levelClass = {
  favoravel: "bg-green-100 text-green-800",
  atencao: "bg-yellow-100 text-yellow-800",
  risco: "bg-red-100 text-red-800",
} as const;

function FactorGuide({
  factor,
  id,
  open,
}: {
  factor: RhWorkFactorSignal;
  id: string;
  open: boolean;
}) {
  const guide = workFactorGuide(factor.factorId);
  const intro = workFactorGuideIntro(factor.level);
  return (
    <div id={id} hidden={!open} className="border-t border-[var(--clay-title)]/10 px-3 pb-3 pt-2">
      {intro ? <p className="text-[11px] font-semibold text-[var(--clay-title)]">{intro}</p> : null}
      <p className="mt-1 text-[11px] text-[var(--clay-text)]/70">{guide.signal}</p>
      <ol className="mt-2 list-decimal space-y-1 pl-4 text-xs text-[var(--clay-text)]">
        {guide.actions.map((action) => (
          <li key={action}>{action}</li>
        ))}
      </ol>
      <p className="mt-2 flex items-start gap-1.5 text-[10px] text-[var(--clay-text)]/60">
        <Icon name="lock" className="mt-px shrink-0 text-xs" />
        {WORK_FACTOR_GUIDE_PRIVACY_NOTE}
      </p>
    </div>
  );
}

function FactorLine({ factor }: { factor: RhWorkFactorSignal }) {
  const [open, setOpen] = useState(false);
  const guideId = useId();

  if (!factor.available || factor.level == null || factor.average == null) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl bg-white/50 px-3 py-2">
        <p className="text-xs font-semibold text-[var(--clay-title)]">{factor.label}</p>
        <p className="text-[11px] text-[var(--clay-text)]/60">Ainda sem 5 respostas</p>
      </div>
    );
  }

  const hasGuide = workFactorGuideIntro(factor.level) !== null;

  return (
    <div className="rounded-xl bg-white/50">
      <div className="flex items-center justify-between gap-3 px-3 py-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-[var(--clay-title)]">{factor.label}</p>
          <p className="text-[11px] text-[var(--clay-text)]/60">
            Média {factor.average} de 5 · {factor.respondents} pessoas
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {hasGuide ? (
            <button
              type="button"
              aria-expanded={open}
              aria-controls={guideId}
              onClick={() => setOpen((value) => !value)}
              className="flex items-center gap-0.5 rounded-lg px-2 py-1 text-[11px] font-semibold text-[var(--clay-title)] hover:bg-white/70"
            >
              Como agir
              <Icon name={open ? "expand_less" : "expand_more"} className="text-sm" />
            </button>
          ) : null}
          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${levelClass[factor.level]}`}
          >
            {workFactorLevelLabel(factor.level)}
          </span>
        </div>
      </div>
      {hasGuide ? <FactorGuide factor={factor} id={guideId} open={open} /> : null}
    </div>
  );
}

export function RhWorkFactorsSection({
  report,
  error,
}: {
  report: RhWorkFactorReport | null;
  error: string | null;
}) {
  return (
    <section className="mt-8">
      <h2 className="font-display text-sm font-semibold text-[var(--clay-title)]">
        Fatores de trabalho
        {report ? ` (últimos ${report.periodDays} dias)` : ""}
      </h2>
      <p className="mt-1 text-xs text-[var(--clay-text)]/70">
        Cada dia o check-in pergunta um fator. A média só aparece com 5 ou mais pessoas que
        autorizaram o compartilhamento. A nota individual não entra aqui. Em fatores com atenção ou
        risco, abra "Como agir" para ver ações sugeridas para a liderança.
      </p>

      {error ? (
        <p className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-xs text-amber-900">{error}</p>
      ) : null}

      {!error && report && report.teams.length === 0 ? (
        <p className="mt-3 rounded-xl bg-white/70 px-4 py-3 text-xs text-[var(--clay-text)]/80">
          Nenhuma equipe com pessoas que autorizaram o compartilhamento com o RH.
        </p>
      ) : null}

      {!error && report && report.teams.length > 0 ? (
        <div className="mt-3 grid grid-cols-1 items-start gap-3 lg:grid-cols-2">
          {report.teams.map((team) => (
            <div key={team.teamName} className="rounded-2xl bg-white/60 p-4 shadow-sm">
              <h3 className="font-display text-sm font-semibold text-[var(--clay-title)]">
                {team.teamName}
              </h3>
              {team.metricsHidden ? (
                <p className="mt-2 text-xs text-[var(--clay-text)]/70">
                  Menos de 5 pessoas autorizaram o compartilhamento. Os fatores desta equipe ficam
                  ocultos.
                </p>
              ) : (
                <div className="mt-3 space-y-2">
                  {team.factors.map((factor) => (
                    <FactorLine key={factor.factorId} factor={factor} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
