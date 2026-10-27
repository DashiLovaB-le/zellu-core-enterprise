import {
  WORK_FACTOR_SCORES,
  factorById,
  type WorkFactor,
  type WorkFactorScore,
} from "@/lib/work-factors";

export function WorkFactorQuestion({
  variant,
  factor,
  score,
  onScore,
  note,
}: {
  variant: "mobile" | "desktop";
  factor: WorkFactor;
  score: WorkFactorScore | null;
  onScore: (score: WorkFactorScore) => void;
  note?: string;
}) {
  const titleClass =
    variant === "mobile"
      ? "font-display text-base text-[var(--clay-title)]"
      : "font-display text-lg text-[var(--clay-title)]";

  return (
    <section
      className={`rounded-2xl bg-white/70 shadow-sm backdrop-blur-md ${
        variant === "mobile" ? "p-5" : "p-6"
      }`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--clay-text)]/50">
        {factor.label}
      </p>
      <h2 className={`mt-1 ${titleClass}`}>{factor.question}</h2>
      <p
        className={`mt-1 text-[var(--clay-text)]/60 ${variant === "mobile" ? "text-xs" : "text-sm"}`}
      >
        O RH vê a média da equipe, nunca a sua nota. Ela só aparece com 5 ou mais respostas.
      </p>
      {note ? (
        <p className="mt-3 rounded-xl bg-white/60 px-3 py-2 text-xs text-[var(--clay-title)]">
          {note}
        </p>
      ) : null}

      <div className="mt-4 grid grid-cols-5 gap-2">
        {WORK_FACTOR_SCORES.map((value) => {
          const selected = score === value;
          const end =
            value === 1 ? factor.lowLabel : value === 5 ? factor.highLabel : `Nota ${value}`;
          return (
            <button
              key={value}
              type="button"
              aria-pressed={selected}
              aria-label={`${value}, ${end}`}
              onClick={() => onScore(value)}
              className={`flex h-12 items-center justify-center rounded-xl text-sm font-bold transition-all ${
                selected
                  ? "bg-gradient-to-br from-[#99BEE5] to-[#C5D9F1] text-[oklch(0.25_0.04_254)] shadow-sm"
                  : "bg-white/50 text-[var(--clay-title)]/70"
              }`}
            >
              {value}
            </button>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between gap-3 text-[10px] text-[var(--clay-text)]/60">
        <span>{factor.lowLabel}</span>
        <span className="text-right">{factor.highLabel}</span>
      </div>
    </section>
  );
}

export function WorkFactorRecap({
  factorId,
  score,
}: {
  factorId: string | null;
  score: number | null;
}) {
  const factor = factorId ? factorById(factorId) : null;
  if (!factor || score == null) return null;
  return (
    <p className="mt-4 text-sm text-[var(--clay-title)]">
      {factor.label}: {score} de 5
    </p>
  );
}
