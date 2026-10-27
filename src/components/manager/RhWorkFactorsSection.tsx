import type { RhWorkFactorReport, RhWorkFactorSignal } from "@/lib/work-factors";
import { workFactorLevelLabel } from "@/lib/work-factors";

const levelClass = {
  favoravel: "bg-green-100 text-green-800",
  atencao: "bg-yellow-100 text-yellow-800",
  risco: "bg-red-100 text-red-800",
} as const;

function FactorLine({ factor }: { factor: RhWorkFactorSignal }) {
  if (!factor.available || factor.level == null || factor.average == null) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl bg-white/50 px-3 py-2">
        <p className="text-xs font-semibold text-[var(--clay-title)]">{factor.label}</p>
        <p className="text-[11px] text-[var(--clay-text)]/60">Ainda sem 5 respostas</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-white/50 px-3 py-2">
      <div className="min-w-0">
        <p className="text-xs font-semibold text-[var(--clay-title)]">{factor.label}</p>
        <p className="text-[11px] text-[var(--clay-text)]/60">
          Média {factor.average} de 5 · {factor.respondents} pessoas
        </p>
      </div>
      <span
        className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${levelClass[factor.level]}`}
      >
        {workFactorLevelLabel(factor.level)}
      </span>
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
        autorizaram o compartilhamento. A nota individual não entra aqui.
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
        <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
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
