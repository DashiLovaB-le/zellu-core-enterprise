import { useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { buildMoodPieSlices } from "@/data/moods";

const PERIOD_OPTIONS = [
  { days: 14, label: "Últimos 14 dias" },
  { days: 30, label: "Últimos 30 dias" },
  { days: 60, label: "Últimos 60 dias" },
  { days: 90, label: "Últimos 90 dias" },
] as const;

function MoodPieCard({
  title,
  distribution,
  periodSelect,
}: {
  title: string;
  distribution: Record<string, number>;
  periodSelect?: {
    value: number;
    disabled?: boolean;
    onChange: (days: number) => void;
  };
}) {
  const slices = useMemo(() => buildMoodPieSlices(distribution), [distribution]);
  const total = slices.reduce((sum, row) => sum + row.count, 0);

  return (
    <div className="flex min-w-0 flex-col rounded-2xl bg-white/60 p-4 shadow-sm">
      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
        <h3 className="min-w-0 font-display text-sm font-semibold leading-snug text-[var(--clay-title)]">
          {title}
        </h3>
        {periodSelect && (
          <label className="flex min-w-0 items-center gap-2 text-xs text-[var(--clay-text)]/70">
            <span className="shrink-0 whitespace-nowrap">Período</span>
            <select
              className="max-w-full min-w-0 rounded-lg border border-[var(--clay-title)]/15 bg-white/80 px-2 py-1 text-xs font-semibold text-[var(--clay-title)] outline-none"
              value={periodSelect.value}
              disabled={periodSelect.disabled}
              onChange={(e) => periodSelect.onChange(Number(e.target.value))}
              aria-label="Período da distribuição de humor"
            >
              {PERIOD_OPTIONS.map((opt) => (
                <option key={opt.days} value={opt.days}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {total === 0 ? (
        <p className="flex min-h-[220px] items-center justify-center px-2 text-center text-xs leading-relaxed text-[var(--clay-text)]/60">
          Sem check-ins agregados neste período (ou métricas ocultas pelo k-anonimato).
        </p>
      ) : (
        <div className="min-h-[240px] w-full min-w-0">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
              <Pie
                data={slices}
                dataKey="count"
                nameKey="mood"
                cx="50%"
                cy="46%"
                innerRadius={0}
                outerRadius="68%"
                paddingAngle={1.5}
                stroke="rgba(255,255,255,0.7)"
                strokeWidth={1}
              >
                {slices.map((entry) => (
                  <Cell key={entry.key} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number | string, name: string) => {
                  const n = Number(value) || 0;
                  const pct = total > 0 ? Math.round((n / total) * 100) : 0;
                  return [`${n} (${pct}%)`, name];
                }}
                contentStyle={{
                  background: "rgba(255,255,255,0.95)",
                  border: "none",
                  borderRadius: 12,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  fontSize: 12,
                  whiteSpace: "nowrap",
                }}
              />
              <Legend
                layout="horizontal"
                verticalAlign="bottom"
                align="center"
                wrapperStyle={{
                  fontSize: 11,
                  lineHeight: "1.35",
                  paddingTop: 4,
                  width: "100%",
                }}
                formatter={(value: string) => (
                  <span className="whitespace-nowrap text-[var(--clay-text)]">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export function RhMoodDistributionPies({
  distribution7d,
  distributionPeriod,
  periodDays,
  periodLoading,
  onPeriodChange,
}: {
  distribution7d: Record<string, number>;
  distributionPeriod: Record<string, number>;
  periodDays: number;
  periodLoading?: boolean;
  onPeriodChange: (days: number) => void;
}) {
  const hasAny =
    Object.values(distribution7d).some((v) => v > 0) ||
    Object.values(distributionPeriod).some((v) => v > 0);

  if (!hasAny) return null;

  return (
    <section className="mt-8 min-w-0">
      <h2 className="mb-3 font-display text-sm font-semibold text-[var(--clay-title)]">
        Distribuição de Humor
      </h2>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <MoodPieCard title="Últimos 7 dias" distribution={distribution7d} />
        <MoodPieCard
          title={`Últimos ${periodDays} dias`}
          distribution={distributionPeriod}
          periodSelect={{
            value: periodDays,
            disabled: periodLoading,
            onChange: onPeriodChange,
          }}
        />
      </div>
    </section>
  );
}
