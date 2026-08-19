import { useMemo } from "react";
import { DesktopShell } from "@/components/DesktopShell";
import { Avatar } from "@/components/Avatar";
import { Icon } from "@/components/Icon";
import { useAuth } from "@/lib/auth-context";
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
import { PreventiveAlertBanner } from "@/components/PreventiveAlertBanner";
import type { PreventiveAlert } from "@/lib/services/preventiva-service";
import { MoodDistributionChart } from "@/components/MoodDistributionChart";
import { MOOD_MAP } from "@/data/moods";

interface Props {
  data: DashboardData;
  aiAnxietyInsight?: string;
  preventiveAlert?: PreventiveAlert;
  onSuggestionClick?: (suggestion: string) => void;
}

const MOOD_LABELS: Record<string, string> = Object.fromEntries(
  Object.values(MOOD_MAP).map((m) => [m.value, m.label]),
);

export function DesktopDashboardEmocionalPage({ data, aiAnxietyInsight, preventiveAlert, onSuggestionClick }: Props) {
  const { user } = useAuth();
  const weekCompData = [
    { métrica: "Sono (h)", Essa: data.currentWeek.sleepAvg, Anterior: data.previousWeek.sleepAvg },
    { métrica: "Água (ml)", Essa: data.currentWeek.waterAvg, Anterior: data.previousWeek.waterAvg },
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
      week: w.weekLabel.length > 14 ? w.weekLabel.slice(0, 12) + "..." : w.weekLabel,
      humor: w.moodAvg,
      sono: w.sleepAvg,
      movimento: w.movementAvg,
    }));
  }, [data]);

  function formatAnxietyText(): string {
    // Se há insight de IA, usar ele
    if (aiAnxietyInsight) {
      return aiAnxietyInsight;
    }
    
    // Fallback para o texto baseado em regras
    if (data.anxietyChangePercent === null)
      return "Registre mais dias para começar a ver sua evolução.";
    const abs = Math.abs(data.anxietyChangePercent);
    if (data.anxietyChangePercent <= 0) {
      return `Você teve ${abs}% menos ansiedade comparado à semana anterior. Mantenha os hábitos que estão funcionando.`;
    }
    return `Você teve ${abs}% mais dias de ansiedade que na semana anterior. Considere incluir pausas de respiração na rotina.`;
  }

  return (
    <DesktopShell>
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex items-center gap-3">
          <Avatar name={user?.avatar_url ?? undefined} size={40} />
          <div>
            <h1 className="font-display text-2xl text-[var(--clay-title)]">Dashboard Emocional</h1>
            <p className="text-sm text-[var(--clay-text)]/70">Sua evolução em números</p>
          </div>
        </header>

        {preventiveAlert && (
          <PreventiveAlertBanner alert={preventiveAlert} onSuggestionClick={onSuggestionClick} />
        )}

        <section className="mb-6 rounded-2xl bg-gradient-to-br from-[#C5D9F1]/30 to-[#D7CBE8]/30 p-5 shadow-sm backdrop-blur-md">
          <div className="mb-2 flex items-center gap-2">
            <Icon name="auto_awesome" filled className="text-base text-[var(--clay-cta)]" />
            <h2 className="text-sm font-semibold text-[var(--clay-title)]">Insight</h2>
          </div>
          <p className="text-sm leading-relaxed text-[var(--clay-text)]">{formatAnxietyText()}</p>
        </section>

        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="rounded-xl bg-white/60 p-4 shadow-sm">
            <p className="text-xs text-[var(--clay-title)]/60">Dias com registro</p>
            <p className="mt-1 text-2xl font-bold text-[var(--clay-title)]">{data.daysTracked}</p>
          </div>
          <div className="rounded-xl bg-white/60 p-4 shadow-sm">
            <p className="text-xs text-[var(--clay-title)]/60">Humor predominante</p>
            <p className="mt-1 text-2xl font-bold text-[var(--clay-cta)] capitalize">
              {MOOD_LABELS[data.dominantMood] ?? data.dominantMood}
            </p>
          </div>
          <div className="rounded-xl bg-white/60 p-4 shadow-sm">
            <p className="text-xs text-[var(--clay-title)]/60">Média de sono (semana)</p>
            <p className="mt-1 text-2xl font-bold text-[var(--clay-self)]">
              {data.currentWeek.sleepAvg}h
            </p>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="rounded-2xl bg-white/70 p-5 shadow-sm backdrop-blur-md">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-[var(--clay-title)]/60">
              Distribuição de Humor: Essa Semana
            </h3>
            <MoodDistributionChart
              distribution={data.currentWeek.moodDistribution}
              height={240}
              tickFontSize={11}
            />
          </section>

          <section className="rounded-2xl bg-white/70 p-5 shadow-sm backdrop-blur-md">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-[var(--clay-title)]/60">
              Comparativo: Essa Semana vs Anterior
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={weekCompData} margin={{ left: 0, right: 8, top: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(142,163,193,0.1)" />
                <XAxis
                  dataKey="métrica"
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={35} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Essa" fill="#99BEE5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Anterior" fill="#C5D9F1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </section>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {data.dailyMoodTrend.length > 0 && (
            <section className="rounded-2xl bg-white/70 p-5 shadow-sm backdrop-blur-md">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-[var(--clay-title)]/60">
                Tendência de Humor (30 dias)
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={moodTrendData} margin={{ left: 0, right: 8, top: 4, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(142,163,193,0.08)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    domain={[1, 6]}
                    ticks={[1, 2, 3, 4, 5, 6]}
                    tick={{ fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    width={25}
                  />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#99BEE5"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </section>
          )}

          {data.dailySleepTrend.length > 0 && (
            <section className="rounded-2xl bg-white/70 p-5 shadow-sm backdrop-blur-md">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-[var(--clay-title)]/60">
                Tendência de Sono (30 dias)
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={sleepTrendData} margin={{ left: 0, right: 8, top: 4, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(142,163,193,0.08)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    domain={[0, 12]}
                    tick={{ fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    width={25}
                  />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Line
                    type="monotone"
                    dataKey="hours"
                    stroke="#D7CBE8"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </section>
          )}
        </div>

        {data.weeklySummaries.length > 0 && (
          <section className="mb-6 rounded-2xl bg-white/70 p-5 shadow-sm backdrop-blur-md">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-[var(--clay-title)]/60">
              Média de Humor por Semana
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weeklyMoodData} margin={{ left: 0, right: 8, top: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(142,163,193,0.08)" />
                <XAxis dataKey="week" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis
                  domain={[1, 6]}
                  tick={{ fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  width={25}
                />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="humor" fill="#99BEE5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </section>
        )}
      </div>
    </DesktopShell>
  );
}
