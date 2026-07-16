import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { ManagerShell } from "@/components/ManagerShell";
import { Icon } from "@/components/Icon";
import { useAuth } from "@/lib/auth-context";
import { BRANDING } from "@/lib/branding";
import { useState, useEffect } from "react";
import { loadRhDashboard } from "@/lib/services/rh-dashboard-service";
import type { RhDashboardData, RhAlert } from "@/lib/api/manager.server";
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
} from "recharts";

export const Route = createFileRoute("/manager/rh-dashboard")({
  head: () => ({
    meta: [
      { title: `Dashboard RH — ${BRANDING.shortName}` },
      { name: "description", content: "Painel completo de indicadores de bem-estar." },
    ],
  }),
  component: RhDashboard,
});

function RhDashboard() {
  const { user, session, loading, role } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<RhDashboardData | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/login", replace: true });
      return;
    }
    if (role === "dev") return;
    if (!loading && user && role !== "manager") {
      navigate({ to: "/login", replace: true });
    }
  }, [user, loading, role, navigate]);

  useEffect(() => {
    if (!session?.access_token || loaded) return;
    (async () => {
      const d = await loadRhDashboard(session.access_token!);
      if (d) setData(d);
      setLoaded(true);
    })();
  }, [session, loaded]);

  if (loading || !user || (role !== "manager" && role !== "dev")) {
    return (
      <ManagerShell>
        <div className="flex flex-1 items-center justify-center">
          <Icon name="sync" className="animate-spin text-3xl text-[var(--clay-title)]" />
        </div>
      </ManagerShell>
    );
  }

  return (
    <ManagerShell>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="font-display text-2xl text-[var(--clay-title)]">Dashboard RH</h1>
          <p className="mt-1 text-xs text-[var(--clay-text)]/70">
            Indicadores anônimos agregados · {data?.teams.length ?? 0} equipes
          </p>
        </div>
        <Link
          to="/manager/equipes"
          className="flex items-center gap-2 rounded-xl bg-white/60 px-4 py-2 text-xs font-semibold text-[var(--clay-title)] shadow-sm hover:bg-white/80"
        >
          <Icon name="groups" className="text-base" />
          Ver Equipes
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard icon="people" label="Colaboradores" value={String(data?.totalUsers ?? "—")} />
        <KpiCard
          icon="today"
          label="Check-ins hoje"
          value={String(data?.checkinsToday ?? "—")}
        />
        <KpiCard
          icon="trending_up"
          label="Adesão semanal"
          value={data ? `${data.weeklyAdhesion}%` : "—"}
        />
        <KpiCard
          icon="warning"
          label="Alertas"
          value={String(data?.alerts.length ?? 0)}
          highlight={data && data.alerts.length > 0 ? "var(--clay-anxiety)" : undefined}
        />
      </div>

      {data && data.alerts.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-3 font-display text-sm font-semibold text-[var(--clay-title)]">
            Alertas
          </h2>
          <div className="space-y-2">
            {data.alerts.map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-8">
        <h2 className="mb-3 font-display text-sm font-semibold text-[var(--clay-title)]">
          Equipes
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data?.teams.map((team) => (
            <TeamCard key={team.name} team={team} />
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 font-display text-sm font-semibold text-[var(--clay-title)]">
          Tendências (últimos 30 dias)
        </h2>
        <div className="rounded-2xl bg-white/60 p-4 shadow-sm">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={data?.trends ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--clay-text)/10" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: "var(--clay-text)" }}
                tickFormatter={(v: string) => v.slice(5)}
              />
              <YAxis tick={{ fontSize: 10, fill: "var(--clay-text)" }} />
              <Tooltip
                contentStyle={{
                  background: "rgba(255,255,255,0.9)",
                  border: "none",
                  borderRadius: 12,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  fontSize: 12,
                }}
              />
              <Line
                type="monotone"
                dataKey="avgMood"
                stroke="var(--clay-joy)"
                strokeWidth={2}
                dot={false}
                name="Humor"
              />
              <Line
                type="monotone"
                dataKey="avgSleep"
                stroke="var(--clay-cta)"
                strokeWidth={2}
                dot={false}
                name="Sono (h)"
              />
              <Line
                type="monotone"
                dataKey="avgWater"
                stroke="var(--clay-anxiety)"
                strokeWidth={2}
                dot={false}
                name="Água (ml)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {data && Object.values(data.moodDistribution).some((v) => v > 0) && (
        <section className="mt-8">
          <h2 className="mb-3 font-display text-sm font-semibold text-[var(--clay-title)]">
            Distribuição de Humor
          </h2>
          <div className="rounded-2xl bg-white/60 p-4 shadow-sm">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={Object.entries(data.moodDistribution)
                  .filter(([, v]) => v > 0)
                  .map(([mood, count]) => ({ mood, count }))}
                layout="vertical"
                margin={{ left: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--clay-text)/10" />
                <XAxis type="number" tick={{ fontSize: 10, fill: "var(--clay-text)" }} />
                <YAxis
                  type="category"
                  dataKey="mood"
                  tick={{ fontSize: 11, fill: "var(--clay-text)" }}
                />
                <Tooltip
                  contentStyle={{
                    background: "rgba(255,255,255,0.9)",
                    border: "none",
                    borderRadius: 12,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="count" fill="var(--clay-self)" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}
    </ManagerShell>
  );
}

function KpiCard({
  icon,
  label,
  value,
  highlight,
}: {
  icon: string;
  label: string;
  value: string;
  highlight?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white/60 p-4 shadow-sm">
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
        style={{
          backgroundColor: highlight ? "var(--clay-anxiety)" : "var(--clay-joy)",
          opacity: 0.2,
        }}
      >
        <span
          className="material-symbols-outlined select-none text-lg"
          style={{
            fontVariationSettings: "'FILL' 1, 'wght' 500",
            color: highlight ?? "var(--clay-title)",
          }}
        >
          {icon}
        </span>
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--clay-text)]/60">
          {label}
        </p>
        <p
          className="mt-0.5 truncate font-display text-lg font-bold"
          style={{ color: highlight ?? "var(--clay-title)" }}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

function TeamCard({
  team,
}: {
  team: RhDashboardData["teams"][number];
}) {
  const statusColor = {
    stable: "bg-green-100 text-green-800",
    monitor: "bg-yellow-100 text-yellow-800",
    attention: "bg-red-100 text-red-800",
  }[team.status];

  const statusLabel = {
    stable: "Estável",
    monitor: "Monitorar",
    attention: "Atenção",
  }[team.status];

  return (
    <div className="rounded-2xl bg-white/60 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-sm font-semibold text-[var(--clay-title)]">{team.name}</h3>
          <p className="text-xs text-[var(--clay-text)]/50">{team.memberCount} membros</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-[10px] font-bold ${statusColor}`}>{statusLabel}</span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <MiniMetric label="Humor" value={String(team.avgMood)} unit="/5" />
        <MiniMetric label="Sono" value={String(team.avgSleep)} unit="h" />
        <MiniMetric label="Água" value={String(team.avgWater)} unit="ml" />
        <MiniMetric label="Negativos" value={`${team.negativeMoodPct}%`} />
      </div>
    </div>
  );
}

function MiniMetric({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="rounded-xl bg-white/50 p-2 text-center">
      <p className="text-[10px] text-[var(--clay-text)]/60">{label}</p>
      <p className="mt-0.5 text-sm font-bold text-[var(--clay-title)]">
        {value}
        {unit && <span className="text-[10px] font-normal text-[var(--clay-text)]/50">{unit}</span>}
      </p>
    </div>
  );
}

function AlertCard({ alert }: { alert: RhAlert }) {
  const severityColors: Record<string, { bg: string; border: string; icon: string }> = {
    high: { bg: "bg-red-50", border: "border-l-red-400", icon: "error" },
    medium: { bg: "bg-yellow-50", border: "border-l-yellow-400", icon: "warning" },
    low: { bg: "bg-blue-50", border: "border-l-blue-400", icon: "info" },
  };
  const s = severityColors[alert.severity] ?? severityColors.low;

  return (
    <div className={`rounded-xl ${s.bg} border-l-4 ${s.border} p-3 shadow-sm`}>
      <div className="flex items-start gap-2">
        <Icon name={s.icon} filled className="mt-0.5 shrink-0 text-base" />
        <p className="text-xs text-[var(--clay-text)]/80">{alert.message}</p>
      </div>
    </div>
  );
}
