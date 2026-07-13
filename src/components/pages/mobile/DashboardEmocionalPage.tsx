import { useMemo } from "react";
import { MobileShell } from "@/components/MobileShell";
import { Avatar } from "@/components/Avatar";
import { Icon } from "@/components/Icon";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from "recharts";
import type { DashboardData } from "@/lib/services/dashboard-service";

interface Props {
  data: DashboardData;
}

const MOOD_LABELS: Record<string, string> = {
  feliz: "Feliz",
  calmo: "Calmo",
  neutro: "Neutro",
  ansioso: "Ansioso",
  triste: "Triste",
  irritado: "Irritado",
};

const MOOD_COLORS: Record<string, string> = {
  feliz: "#C8E6C9",
  calmo: "#99BEE5",
  neutro: "#C5D9F1",
  ansioso: "#FFCC80",
  triste: "#90CAF9",
  irritado: "#EF9A9A",
};

const MOOD_ORDER = ["feliz", "calmo", "neutro", "ansioso", "triste", "irritado"];

export function MobileDashboardEmocionalPage({ data }: Props) {
  const moodChartData = useMemo(() => {
    return MOOD_ORDER.filter(
      (m) =>
        (data.currentWeek.moodDistribution[m] ?? 0) > 0 ||
        (data.previousWeek.moodDistribution[m] ?? 0) > 0,
    ).map((m) => ({
      mood: MOOD_LABELS[m] ?? m,
      Essa: data.currentWeek.moodDistribution[m] ?? 0,
      Semana: data.currentWeek.moodDistribution[m] ?? 0,
      Anterior: data.previousWeek.moodDistribution[m] ?? 0,
      fill: MOOD_COLORS[m] ?? "#C5D9F1",
    }));
  }, [data]);

  const weekCompData = [
    {
      métrica: "Sono (h)",
      Essa: data.currentWeek.sleepAvg,
      Anterior: data.previousWeek.sleepAvg,
    },
    {
      métrica: "Água (ml)",
      Essa: data.currentWeek.waterAvg,
      Anterior: data.previousWeek.waterAvg,
    },
    {
      métrica: "Movimento (min)",
      Essa: data.currentWeek.movementAvg,
      Anterior: data.previousWeek.movementAvg,
    },
  ];

  const moodTrendData = useMemo(() => {
    return data.dailyMoodTrend.map((d) => ({
      date: new Date(d.date + "T12:00:00").toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      }),
      score: d.score,
    }));
  }, [data]);

  const sleepTrendData = useMemo(() => {
    return data.dailySleepTrend.map((d) => ({
      date: new Date(d.date + "T12:00:00").toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      }),
      hours: d.hours,
    }));
  }, [data]);

  const weeklyMoodData = useMemo(() => {
    return data.weeklySummaries.map((w) => ({
      week: w.weekLabel.length > 12 ? w.weekLabel.slice(0, 10) + "..." : w.weekLabel,
      humor: w.moodAvg,
    }));
  }, [data]);

  const hasCurrentData = data.currentWeek.totalDays > 0;
  const hasPrevData = data.previousWeek.totalDays > 0;

  function formatAnxietyText(): string {
    if (data.anxietyChangePercent === null)
      return "Registre mais dias para começar a ver sua evolução.";
    const abs = Math.abs(data.anxietyChangePercent);
    if (data.anxietyChangePercent <= 0) {
      return `Você teve ${abs}% menos ansiedade comparado à semana anterior. Continue assim!`;
    }
    return `Você teve ${abs}% mais dias de ansiedade que na semana anterior. Que tal incluir pausas de respiração?`;
  }

  return (
    <MobileShell>
      <header className="mb-4 flex items-center gap-3">
        <Avatar size={36} />
        <div>
          <h1 className="font-display text-xl text-[var(--clay-title)]">Dashboard Emocional</h1>
          <p className="text-xs text-[var(--clay-text)]/70">Sua evolução em números</p>
        </div>
      </header>

      <section className="mb-4 rounded-2xl bg-gradient-to-br from-[#C5D9F1]/30 to-[#D7CBE8]/30 p-4 shadow-sm backdrop-blur-md">
        <div className="mb-1 flex items-center gap-2">
          <Icon name="auto_awesome" filled className="text-sm text-[var(--clay-cta)]" />
          <h2 className="text-xs font-semibold text-[var(--clay-title)]">Insight</h2>
        </div>
        <p className="text-sm leading-relaxed text-[var(--clay-text)]">{formatAnxietyText()}</p>
      </section>

      <section className="mb-4">
        <h3 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--clay-title)]/60">
          Resumo
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-white/60 p-3 shadow-sm">
            <p className="text-[10px] text-[var(--clay-title)]/60">Dias com registro</p>
            <p className="mt-0.5 text-lg font-bold text-[var(--clay-title)]">{data.daysTracked}</p>
          </div>
          <div className="rounded-xl bg-white/60 p-3 shadow-sm">
            <p className="text-[10px] text-[var(--clay-title)]/60">Humor predominante</p>
            <p className="mt-0.5 text-lg font-bold text-[var(--clay-cta)] capitalize">
              {MOOD_LABELS[data.dominantMood] ?? data.dominantMood}
            </p>
          </div>
        </div>
      </section>

      <section className="mb-4">
        <h3 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--clay-title)]/60">
          Distribuição de Humor: Essa Semana
        </h3>
        <div className="rounded-xl bg-white/60 p-3 shadow-sm">
          {hasCurrentData ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart
                data={moodChartData}
                layout="vertical"
                margin={{ left: 0, right: 0, top: 4, bottom: 4 }}
              >
                <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="mood"
                  tick={{ fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  width={60}
                />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="Semana" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-4 text-center text-xs text-[var(--clay-title)]/50">
              Nenhum registro esta semana.
            </p>
          )}
        </div>
      </section>

      <section className="mb-4">
        <h3 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--clay-title)]/60">
          Comparativo: Essa Semana vs Anterior
        </h3>
        <div className="rounded-xl bg-white/60 p-3 shadow-sm">
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={weekCompData} margin={{ left: 0, right: 0, top: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(142,163,193,0.1)" />
              <XAxis dataKey="métrica" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9 }} axisLine={false} tickLine={false} width={30} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Bar dataKey="Essa" fill="#99BEE5" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Anterior" fill="#C5D9F1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {data.dailyMoodTrend.length > 0 && (
        <section className="mb-4">
          <h3 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--clay-title)]/60">
            Tendência de Humor (30 dias)
          </h3>
          <div className="rounded-xl bg-white/60 p-3 shadow-sm">
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={moodTrendData} margin={{ left: 0, right: 0, top: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(142,163,193,0.08)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 8 }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  domain={[1, 6]}
                  ticks={[1, 2, 3, 4, 5, 6]}
                  tick={{ fontSize: 9 }}
                  axisLine={false}
                  tickLine={false}
                  width={20}
                />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#99BEE5"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-1 flex justify-between text-[8px] text-[var(--clay-title)]/50">
              <span>Irritado</span>
              <span>Neutro</span>
              <span>Feliz</span>
            </div>
          </div>
        </section>
      )}

      {data.dailySleepTrend.length > 0 && (
        <section className="mb-4">
          <h3 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--clay-title)]/60">
            Tendência de Sono (30 dias)
          </h3>
          <div className="rounded-xl bg-white/60 p-3 shadow-sm">
            <ResponsiveContainer width="100%" height={140}>
              <LineChart data={sleepTrendData} margin={{ left: 0, right: 0, top: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(142,163,193,0.08)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 8 }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  domain={[0, 12]}
                  tick={{ fontSize: 9 }}
                  axisLine={false}
                  tickLine={false}
                  width={20}
                />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Line
                  type="monotone"
                  dataKey="hours"
                  stroke="#D7CBE8"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {data.weeklySummaries.length > 0 && (
        <section className="mb-4">
          <h3 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--clay-title)]/60">
            Média de Humor por Semana
          </h3>
          <div className="rounded-xl bg-white/60 p-3 shadow-sm">
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={weeklyMoodData} margin={{ left: 0, right: 0, top: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(142,163,193,0.08)" />
                <XAxis dataKey="week" tick={{ fontSize: 8 }} axisLine={false} tickLine={false} />
                <YAxis
                  domain={[1, 6]}
                  tick={{ fontSize: 9 }}
                  axisLine={false}
                  tickLine={false}
                  width={20}
                />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="humor" fill="#99BEE5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}
    </MobileShell>
  );
}
