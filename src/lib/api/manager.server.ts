import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireManager } from "@/lib/require-user";
import { logEvent } from "@/lib/api/logs.server";
import { getMoodScore, isNegativeMood, MAIN_MOOD_ORDER } from "@/data/moods";
import {
  applyKAnonymity,
  companyMetricsAllowed,
  hideAlertsForSmallTeams,
  type TeamAggregate,
} from "@/lib/tenant";
import { createAdminClient } from "@/lib/supabase/admin.server";

export type TeamMetrics = {
  name: string;
  stress: string;
  energy: string;
  sleep: string;
  engagement: string;
  color: string;
  memberCount: number;
  metricsHidden?: boolean;
};

export type DashboardData = {
  totalUsers: number;
  checkinsToday: number;
  weeklyAdhesion: number;
  activeAlerts: number;
  teams: TeamMetrics[];
};

const TEAM_COLORS = [
  "var(--clay-anxiety)",
  "var(--clay-joy)",
  "var(--clay-stress)",
  "var(--clay-self)",
  "var(--clay-cta)",
  "var(--clay-cta-2)",
];

const UNASSIGNED_TEAM = "Sem equipe";

type CheckinRow = {
  user_id: string;
  created_at: string;
  mood: string;
  sleep_hours: number;
  water_ml: number;
};

type MemberRow = {
  id: string;
  team_id: string | null;
  role: string;
  privacy_rh_opt_in?: boolean | null;
};

export type RhTeamMetrics = TeamAggregate;

export type RhTrendPoint = {
  date: string;
  avgMood: number;
  avgSleep: number;
  avgWater: number;
  checkinCount: number;
};

export type RhAlert = {
  id: string;
  team: string;
  type: "stress" | "sleep" | "engagement" | "hydration";
  severity: "low" | "medium" | "high";
  message: string;
};

export type RhDashboardData = {
  totalUsers: number;
  checkinsToday: number;
  checkinsThisWeek: number;
  weeklyAdhesion: number;
  teams: RhTeamMetrics[];
  trends: RhTrendPoint[];
  alerts: RhAlert[];
  moodDistribution: Record<string, number>;
};

function trendFromNegativePct(pct: number): string {
  if (pct >= 40) return "\u2191";
  if (pct >= 20) return "\u2193";
  return "\u2192";
}

function teamStatus(negativeMoodPct: number): "stable" | "attention" | "monitor" {
  if (negativeMoodPct >= 40) return "attention";
  if (negativeMoodPct >= 20) return "monitor";
  return "stable";
}

export function buildRhDashboard(input: {
  members: MemberRow[];
  teams: Array<{ id: string; name: string }>;
  checkins: CheckinRow[];
  now?: Date;
}): RhDashboardData {
  const now = input.now ?? new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(now.getTime() - 7 * 86400000);

  const companions = input.members.filter((m) => m.role === "companion");
  const totalUsers = companions.length;
  const companyAllowed = companyMetricsAllowed(totalUsers);
  const teamNameById = new Map(input.teams.map((t) => [t.id, t.name]));

  const memberTeam = new Map<string, string>();
  for (const m of companions) {
    memberTeam.set(m.id, (m.team_id && teamNameById.get(m.team_id)) || UNASSIGNED_TEAM);
  }

  const teamNames = [...input.teams.map((t) => t.name), UNASSIGNED_TEAM];
  const uniqueNames = [...new Set(teamNames)];

  const checkinsToday = input.checkins.filter((c) => new Date(c.created_at) >= todayStart).length;
  const checkinsThisWeek = input.checkins.filter((c) => new Date(c.created_at) >= weekAgo).length;
  const weeklyAdhesion =
    totalUsers > 0 ? Math.min(100, Math.round((checkinsThisWeek / (totalUsers * 7)) * 100)) : 0;

  const teamBuckets: Record<string, CheckinRow[]> = {};
  const memberCounts: Record<string, number> = {};
  for (const name of uniqueNames) {
    teamBuckets[name] = [];
    memberCounts[name] = 0;
  }
  for (const m of companions) {
    const name = memberTeam.get(m.id) ?? UNASSIGNED_TEAM;
    memberCounts[name] = (memberCounts[name] ?? 0) + 1;
  }
  for (const c of input.checkins) {
    const name = memberTeam.get(c.user_id) ?? UNASSIGNED_TEAM;
    if (!teamBuckets[name]) teamBuckets[name] = [];
    teamBuckets[name].push(c);
  }

  const teams: RhTeamMetrics[] = uniqueNames
    .filter((name) => name !== UNASSIGNED_TEAM || (memberCounts[name] ?? 0) > 0)
    .map((name) => {
      const entries = teamBuckets[name] ?? [];
      const memberCount = memberCounts[name] ?? 0;
      const avgSleep =
        entries.length > 0
          ? Math.round((entries.reduce((s, e) => s + (e.sleep_hours ?? 0), 0) / entries.length) * 10) /
            10
          : 0;
      const avgMood =
        entries.length > 0
          ? Math.round((entries.reduce((s, e) => s + getMoodScore(e.mood), 0) / entries.length) * 10) /
            10
          : 0;
      const avgWater =
        entries.length > 0
          ? Math.round(entries.reduce((s, e) => s + (e.water_ml ?? 0), 0) / entries.length)
          : 0;
      const negativeCount = entries.filter((e) => isNegativeMood(e.mood)).length;
      const negativeMoodPct =
        entries.length > 0 ? Math.round((negativeCount / entries.length) * 100) : 0;
      return applyKAnonymity({
        name,
        memberCount,
        avgSleep,
        avgMood,
        avgWater,
        negativeMoodPct,
        status: teamStatus(negativeMoodPct),
        metricsHidden: false,
      });
    });

  const dailyBuckets: Record<string, CheckinRow[]> = {};
  for (const c of input.checkins) {
    const day = c.created_at.split("T")[0];
    if (!dailyBuckets[day]) dailyBuckets[day] = [];
    dailyBuckets[day].push(c);
  }

  const trends: RhTrendPoint[] = Object.entries(dailyBuckets)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, entries]) => ({
      date,
      avgMood: Math.round((entries.reduce((s, e) => s + getMoodScore(e.mood), 0) / entries.length) * 10) / 10,
      avgSleep:
        Math.round((entries.reduce((s, e) => s + (e.sleep_hours ?? 0), 0) / entries.length) * 10) / 10,
      avgWater: Math.round(entries.reduce((s, e) => s + (e.water_ml ?? 0), 0) / entries.length),
      checkinCount: entries.length,
    }));

  const moodDist: Record<string, number> = {};
  for (const m of MAIN_MOOD_ORDER) moodDist[m] = 0;
  for (const c of input.checkins) {
    const key = c.mood?.toLowerCase();
    if (key && moodDist[key] !== undefined) moodDist[key] += 1;
  }

  const alerts: RhAlert[] = [];
  let alertId = 0;
  for (const team of teams) {
    if (team.metricsHidden || team.memberCount === 0) continue;
    if (team.negativeMoodPct >= 40) {
      alerts.push({
        id: `alert-${alertId++}`,
        team: team.name,
        type: "stress",
        severity: "high",
        message: `${team.name}: ${team.negativeMoodPct}% dos check-ins indicam humor negativo. Recomenda-se atenção da liderança.`,
      });
    } else if (team.negativeMoodPct >= 20) {
      alerts.push({
        id: `alert-${alertId++}`,
        team: team.name,
        type: "stress",
        severity: "medium",
        message: `${team.name}: ${team.negativeMoodPct}% de relatos negativos. Monitore a equipe.`,
      });
    }
    if (team.avgSleep < 6) {
      alerts.push({
        id: `alert-${alertId++}`,
        team: team.name,
        type: "sleep",
        severity: "medium",
        message: `${team.name}: média de sono de ${team.avgSleep}h abaixo do ideal.`,
      });
    }
    if (team.avgWater < 1000) {
      alerts.push({
        id: `alert-${alertId++}`,
        team: team.name,
        type: "hydration",
        severity: "low",
        message: `${team.name}: média de hidratação baixa (${team.avgWater}ml/dia).`,
      });
    }
  }

  return {
    totalUsers,
    checkinsToday,
    checkinsThisWeek,
    weeklyAdhesion,
    teams,
    trends: companyAllowed ? trends : [],
    alerts: companyAllowed ? hideAlertsForSmallTeams(alerts, teams) : [],
    moodDistribution: companyAllowed ? moodDist : {},
  };
}

async function loadCompanyScope(
  accessToken: string,
  periodDays = 30,
): Promise<
  | { error: string }
  | {
      companyId: string | null;
      isDev: boolean;
      userId: string;
      members: MemberRow[];
      teams: Array<{ id: string; name: string }>;
      checkins: CheckinRow[];
    }
> {
  const auth = await requireManager(accessToken);
  if ("error" in auth) return auth;

  const { companyId, isDev, userId } = auth;

  if (!companyId) return { error: "Unauthorized — sem empresa" };

  const admin = createAdminClient();

  const membersQuery = admin
    .from("profiles")
    .select("id, team_id, role, company_id, privacy_rh_opt_in")
    .eq("company_id", companyId)
    .in("role", ["companion", "manager"]);
  const teamsQuery = admin.from("teams").select("id, name, company_id").eq("company_id", companyId);

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - periodDays);

  const [membersRes, teamsRes] = await Promise.all([membersQuery, teamsQuery]);
  const members = ((membersRes.data ?? []) as Array<MemberRow & { privacy_rh_opt_in?: boolean | null }>).filter(
    (m) => m.role !== "companion" || m.privacy_rh_opt_in === true,
  );
  const optedInIds = members.filter((m) => m.role === "companion").map((m) => m.id);

  let checkins: CheckinRow[] = [];
  if (optedInIds.length > 0) {
    const { data } = await admin
      .from("checkins")
      .select("user_id, created_at, mood, sleep_hours, water_ml")
      .in("user_id", optedInIds)
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: true });
    checkins = (data ?? []) as CheckinRow[];
  }

  return {
    companyId,
    isDev,
    userId,
    members,
    teams: (teamsRes.data ?? []).map((t) => ({ id: t.id, name: t.name })),
    checkins,
  };
}

export const getManagerDashboard = createServerFn({ method: "POST" })
  .inputValidator(z.object({ accessToken: z.string() }))
  .handler(async ({ data }: { data: { accessToken: string } }) => {
    const scope = await loadCompanyScope(data.accessToken, 7);
    if ("error" in scope) return scope;

    const rh = buildRhDashboard({
      members: scope.members,
      teams: scope.teams,
      checkins: scope.checkins,
    });

    void logEvent(
      "info",
      "manager.getManagerDashboard",
      "Painel manager lido",
      { company_id: scope.companyId },
      scope.userId,
    );

    const teams: TeamMetrics[] = rh.teams.map((team, i) => ({
      name: team.name,
      stress: team.metricsHidden ? "—" : trendFromNegativePct(team.negativeMoodPct),
      energy: team.metricsHidden ? "—" : team.avgMood >= 4 ? "\u2191" : "\u2193",
      sleep: team.metricsHidden ? "—" : team.avgSleep >= 7 ? "\u2191" : "\u2193",
      engagement: team.metricsHidden ? "—" : team.memberCount > 0 ? "\u2192" : "—",
      color: TEAM_COLORS[i % TEAM_COLORS.length],
      memberCount: team.memberCount,
      metricsHidden: team.metricsHidden,
    }));

    return {
      data: {
        totalUsers: rh.totalUsers,
        checkinsToday: rh.checkinsToday,
        weeklyAdhesion: rh.weeklyAdhesion,
        activeAlerts: rh.alerts.length,
        teams,
      } as DashboardData,
      error: null,
    };
  });

export const getCheckinStats = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({ accessToken: z.string(), periodDays: z.number().min(1).max(90).default(30) }),
  )
  .handler(async ({ data }: { data: { accessToken: string; periodDays: number } }) => {
    const scope = await loadCompanyScope(data.accessToken, data.periodDays);
    if ("error" in scope) return scope;

    const rh = buildRhDashboard({
      members: scope.members,
      teams: scope.teams,
      checkins: scope.checkins,
    });

    const anonymized = companyMetricsAllowed(rh.totalUsers)
      ? rh.trends.map((t) => ({
          date: t.date,
          avgMood: t.avgMood,
          avgSleep: t.avgSleep,
          avgWater: t.avgWater,
          checkinCount: t.checkinCount,
        }))
      : [];

    return { data: anonymized, error: null };
  });

export const exportCsv = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({ accessToken: z.string(), periodDays: z.number().min(1).max(365).default(30) }),
  )
  .handler(async ({ data }: { data: { accessToken: string; periodDays: number } }) => {
    const scope = await loadCompanyScope(data.accessToken, data.periodDays);
    if ("error" in scope) return scope;

    const rh = buildRhDashboard({
      members: scope.members,
      teams: scope.teams,
      checkins: scope.checkins,
    });

    void logEvent(
      "info",
      "manager.exportCsv",
      "Relatório CSV exportado",
      { company_id: scope.companyId, periodDays: data.periodDays },
      scope.userId,
    );

    const header = "equipe,membros,metricas_ocultas,humor_medio,sono_medio,agua_media,humor_negativo_pct,status";
    const rows = rh.teams.map((t) =>
      [
        `"${t.name}"`,
        t.memberCount,
        t.metricsHidden ? "sim" : "nao",
        t.metricsHidden ? "" : t.avgMood,
        t.metricsHidden ? "" : t.avgSleep,
        t.metricsHidden ? "" : t.avgWater,
        t.metricsHidden ? "" : t.negativeMoodPct,
        t.status,
      ].join(","),
    );
    const csv = [header, ...rows].join("\n");
    return { csv, error: null };
  });

export const getRhDashboard = createServerFn({ method: "POST" })
  .inputValidator(z.object({ accessToken: z.string() }))
  .handler(async ({ data }: { data: { accessToken: string } }) => {
    const scope = await loadCompanyScope(data.accessToken, 30);
    if ("error" in scope) return scope;

    const dashboard = buildRhDashboard({
      members: scope.members,
      teams: scope.teams,
      checkins: scope.checkins,
    });

    void logEvent(
      "info",
      "manager.getRhDashboard",
      "Dashboard RH lido",
      { company_id: scope.companyId },
      scope.userId,
    );

    return { data: dashboard as RhDashboardData, error: null };
  });

export const listManagerTeams = createServerFn({ method: "POST" })
  .inputValidator(z.object({ accessToken: z.string() }))
  .handler(async ({ data }: { data: { accessToken: string } }) => {
    const scope = await loadCompanyScope(data.accessToken, 30);
    if ("error" in scope) return scope;
    const rh = buildRhDashboard({
      members: scope.members,
      teams: scope.teams,
      checkins: scope.checkins,
    });
    return { data: rh.teams, error: null };
  });
