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
import {
  assertRhSummarySafe,
  unavailableWellness,
  type RhMemberSignalRow,
  type RhMemberSummary,
  type RhWellnessSignals,
} from "@/lib/rh-member-summary";

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
  moodDistribution7d: Record<string, number>;
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

  const alerts = buildRhAlerts(teams);

  return {
    totalUsers,
    checkinsToday,
    checkinsThisWeek,
    weeklyAdhesion,
    teams,
    trends: companyAllowed ? trends : [],
    alerts: companyAllowed ? hideAlertsForSmallTeams(alerts, teams) : [],
    moodDistribution: companyAllowed ? moodDist : {},
    moodDistribution7d: {},
  };
}

export function buildRhAlerts(teams: RhTeamMetrics[]): RhAlert[] {
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
  return alerts;
}

const rhTeamSchema = z.object({
  name: z.string(),
  memberCount: z.coerce.number(),
  avgSleep: z.coerce.number(),
  avgMood: z.coerce.number(),
  avgWater: z.coerce.number(),
  negativeMoodPct: z.coerce.number(),
  status: z.enum(["stable", "attention", "monitor"]),
  metricsHidden: z.boolean(),
});

const rhRpcSchema = z.object({
  totalUsers: z.coerce.number(),
  checkinsToday: z.coerce.number(),
  checkinsThisWeek: z.coerce.number(),
  weeklyAdhesion: z.coerce.number(),
  companyMetricsAllowed: z.boolean(),
  teams: z.array(rhTeamSchema),
  trends: z.array(
    z.object({
      date: z.string(),
      avgMood: z.coerce.number(),
      avgSleep: z.coerce.number(),
      avgWater: z.coerce.number(),
      checkinCount: z.coerce.number(),
    }),
  ),
  moodDistribution: z.record(z.coerce.number()),
});

function dashboardFromRpc(parsed: z.infer<typeof rhRpcSchema>): RhDashboardData {
  const teams = parsed.teams.map((team) => applyKAnonymity(team));
  const companyAllowed = parsed.companyMetricsAllowed && companyMetricsAllowed(parsed.totalUsers);
  const alerts = companyAllowed ? hideAlertsForSmallTeams(buildRhAlerts(teams), teams) : [];
  return {
    totalUsers: parsed.totalUsers,
    checkinsToday: parsed.checkinsToday,
    checkinsThisWeek: parsed.checkinsThisWeek,
    weeklyAdhesion: parsed.weeklyAdhesion,
    teams,
    trends: companyAllowed ? parsed.trends : [],
    alerts,
    moodDistribution: companyAllowed ? parsed.moodDistribution : {},
    moodDistribution7d: {},
  };
}

async function fetchManagerRhDashboard(
  periodDays = 30,
): Promise<{ error: string } | { companyId: string; userId: string; dashboard: RhDashboardData }> {
  const auth = await requireManager();
  if ("error" in auth) return auth;
  if (!auth.companyId) return { error: "Unauthorized — sem empresa" };

  const { data, error } = await auth.supabase.rpc("get_rh_dashboard", {
    p_period_days: periodDays,
  });
  if (error) return { error: error.message };

  const payload = typeof data === "string" ? JSON.parse(data) : data;
  const parsed = rhRpcSchema.safeParse(payload);
  if (!parsed.success) return { error: "Painel RH indisponível" };

  return {
    companyId: auth.companyId,
    userId: auth.userId,
    dashboard: dashboardFromRpc(parsed.data),
  };
}

export const getManagerDashboard = createServerFn({ method: "POST" })

  .handler(async () => {
    const scope = await fetchManagerRhDashboard( 7);
    if ("error" in scope) return scope;

    const rh = scope.dashboard;

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
    z.object({ periodDays: z.number().min(1).max(90).default(30) }),
  )
  .handler(async ({ data }: { data: { periodDays: number } }) => {
    const scope = await fetchManagerRhDashboard( data.periodDays);
    if ("error" in scope) return scope;

    const rh = scope.dashboard;

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
    z.object({ periodDays: z.number().min(1).max(365).default(30) }),
  )
  .handler(async ({ data }: { data: { periodDays: number } }) => {
    const scope = await fetchManagerRhDashboard( data.periodDays);
    if ("error" in scope) return scope;

    const rh = scope.dashboard;

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

  .handler(async () => {
    const [scope30, scope7] = await Promise.all([
      fetchManagerRhDashboard(30),
      fetchManagerRhDashboard(7),
    ]);
    if ("error" in scope30) return scope30;

    const dashboard: RhDashboardData = {
      ...scope30.dashboard,
      moodDistribution7d:
        "error" in scope7 ? {} : scope7.dashboard.moodDistribution,
    };

    void logEvent(
      "info",
      "manager.getRhDashboard",
      "Dashboard RH lido",
      { company_id: scope30.companyId },
      scope30.userId,
    );

    return { data: dashboard, error: null };
  });

export const getRhMoodDistribution = createServerFn({ method: "POST" })
  .inputValidator(z.object({ periodDays: z.number().int().min(1).max(365) }))
  .handler(async ({ data }) => {
    const scope = await fetchManagerRhDashboard(data.periodDays);
    if ("error" in scope) return { data: {} as Record<string, number>, error: scope.error };
    return { data: scope.dashboard.moodDistribution, error: null };
  });

export const listManagerTeams = createServerFn({ method: "POST" })

  .handler(async () => {
    const scope = await fetchManagerRhDashboard( 30);
    if ("error" in scope) return scope;
    return { data: scope.dashboard.teams, error: null };
  });

export type ManagerDirectoryMember = {
  id: string;
  email: string | null;
  display_name: string | null;
  role: string;
  team_id: string | null;
  is_active: boolean;
  company_id: string | null;
  job_title: string | null;
  created_at: string | null;
  avatar_url: string | null;
};

export type ManagerTeamRecord = {
  id: string;
  name: string;
  description: string | null;
};

export type ManagerTeamRoster = {
  teams: ManagerTeamRecord[];
  members: ManagerDirectoryMember[];
};

const DIRECTORY_FORBIDDEN = ["mood", "sleep", "water", "diary", "chat", "privacy_"];

export function assertDirectoryHasNoHealthFields(row: Record<string, unknown>): string[] {
  return Object.keys(row).filter((key) =>
    DIRECTORY_FORBIDDEN.some((f) => key.toLowerCase().includes(f)),
  );
}

function mapDirectoryRow(row: Record<string, unknown>): ManagerDirectoryMember {
  return {
    id: String(row.id),
    email: typeof row.email === "string" ? row.email : null,
    display_name: typeof row.display_name === "string" ? row.display_name : null,
    role: typeof row.role === "string" ? row.role : "companion",
    team_id: typeof row.team_id === "string" ? row.team_id : null,
    is_active: row.is_active !== false,
    company_id: typeof row.company_id === "string" ? row.company_id : null,
    job_title: typeof row.job_title === "string" ? row.job_title : null,
    created_at: typeof row.created_at === "string" ? row.created_at : null,
    avatar_url: typeof row.avatar_url === "string" ? row.avatar_url : null,
  };
}

export const getManagerTeamRoster = createServerFn({ method: "POST" }).handler(async () => {
  const auth = await requireManager();
  if ("error" in auth) return { data: null as ManagerTeamRoster | null, error: auth.error };
  if (!auth.companyId) return { data: null, error: "Unauthorized — sem empresa" };

  const [teamsRes, membersRes] = await Promise.all([
    auth.supabase
      .from("teams")
      .select("id, name, description")
      .eq("company_id", auth.companyId)
      .order("name"),
    auth.supabase.rpc("list_company_directory"),
  ]);

  if (teamsRes.error) return { data: null, error: teamsRes.error.message };
  if (membersRes.error) return { data: null, error: membersRes.error.message };

  const rawRows = (membersRes.data as Record<string, unknown>[]) ?? [];
  for (const raw of rawRows) {
    const leaked = assertDirectoryHasNoHealthFields(raw);
    if (leaked.length > 0) return { data: null, error: "Diretório indisponível" };
  }

  return {
    data: {
      teams: (teamsRes.data ?? []) as ManagerTeamRecord[],
      members: rawRows.map(mapDirectoryRow),
    } satisfies ManagerTeamRoster,
    error: null,
  };
});

export const renameManagerTeam = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      teamId: z.string().uuid(),
      name: z.string().min(2).max(80),
    }),
  )
  .handler(async ({ data }) => {
    const auth = await requireManager();
    if ("error" in auth) return { error: auth.error };
    if (!auth.companyId) return { error: "Unauthorized — sem empresa" };

    const name = data.name.trim().replace(/\s+/g, " ");
    if (name.length < 2) return { error: "Informe um nome válido" };

    const { error } = await auth.supabase
      .from("teams")
      .update({ name })
      .eq("id", data.teamId)
      .eq("company_id", auth.companyId);

    if (error) {
      if (error.code === "23505") return { error: "Já existe uma equipe com esse nome." };
      return { error: error.message };
    }

    void logEvent(
      "info",
      "manager.renameManagerTeam",
      "Equipe renomeada",
      { team_id: data.teamId, company_id: auth.companyId },
      auth.userId,
    );
    return { error: null };
  });

export const assignManagerTeamMember = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      profileId: z.string().uuid(),
      teamId: z.string().uuid().nullable(),
    }),
  )
  .handler(async ({ data }) => {
    const auth = await requireManager();
    if ("error" in auth) return { error: auth.error };
    if (!auth.companyId) return { error: "Unauthorized — sem empresa" };

    const { error } = await auth.supabase.rpc("assign_team_member", {
      p_profile_id: data.profileId,
      p_team_id: data.teamId,
    });

    if (error) return { error: error.message };

    void logEvent(
      "info",
      "manager.assignManagerTeamMember",
      data.teamId ? "Colaborador adicionado à equipe" : "Colaborador removido da equipe",
      { team_id: data.teamId, company_id: auth.companyId },
      auth.userId,
    );
    return { error: null };
  });

function parseWellness(raw: unknown): RhWellnessSignals {
  if (!raw || typeof raw !== "object") return unavailableWellness();
  const row = raw as Record<string, unknown>;
  return {
    available: row.available === true,
    status:
      row.status === "stable" || row.status === "monitor" || row.status === "attention"
        ? row.status
        : "unknown",
    trend:
      row.trend === "improving" || row.trend === "stable" || row.trend === "worsening"
        ? row.trend
        : "unknown",
    participation:
      row.participation === "regular" || row.participation === "low" || row.participation === "none"
        ? row.participation
        : "none",
    lastActivity: typeof row.lastActivity === "string" ? row.lastActivity : "Resumo indisponível",
    sleepSignal:
      row.sleepSignal === "ok" || row.sleepSignal === "attention" ? row.sleepSignal : "unknown",
  };
}

export const getRhMemberSummary = createServerFn({ method: "POST" })
  .inputValidator(z.object({ profileId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const auth = await requireManager();
    if ("error" in auth) return { data: null as RhMemberSummary | null, error: auth.error };
    if (!auth.companyId) return { data: null, error: "Unauthorized — sem empresa" };

    const { data: payload, error } = await auth.supabase.rpc("get_rh_member_summary", {
      p_profile_id: data.profileId,
    });
    if (error) return { data: null, error: error.message };

    const parsed = typeof payload === "string" ? JSON.parse(payload) : payload;
    if (!parsed || typeof parsed !== "object") return { data: null, error: "Resumo indisponível" };
    const leaked = assertRhSummarySafe(parsed as Record<string, unknown>);
    if (leaked.length > 0) return { data: null, error: "Resumo indisponível" };

    const row = parsed as Record<string, unknown>;
    const summary: RhMemberSummary = {
      id: String(row.id),
      displayName: typeof row.displayName === "string" ? row.displayName : null,
      email: typeof row.email === "string" ? row.email : null,
      role: typeof row.role === "string" ? row.role : "companion",
      jobTitle: typeof row.jobTitle === "string" ? row.jobTitle : null,
      isActive: row.isActive !== false,
      teamId: typeof row.teamId === "string" ? row.teamId : null,
      teamName: typeof row.teamName === "string" ? row.teamName : null,
      createdAt:
        typeof row.createdAt === "string"
          ? row.createdAt
          : row.createdAt
            ? String(row.createdAt)
            : null,
      wellness: parseWellness(row.wellness),
    };

    void logEvent(
      "info",
      "manager.getRhMemberSummary",
      "Resumo RH de colaborador lido",
      { company_id: auth.companyId },
      auth.userId,
    );

    return { data: summary, error: null };
  });

export const listRhMemberSignals = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      teamId: z.string().uuid().nullable().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const auth = await requireManager();
    if ("error" in auth) return { data: [] as RhMemberSignalRow[], error: auth.error };
    if (!auth.companyId) return { data: [], error: "Unauthorized — sem empresa" };

    const { data: payload, error } = await auth.supabase.rpc("list_rh_member_signals", {
      p_team_id: data.teamId ?? null,
    });
    if (error) return { data: [], error: error.message };

    const parsed = typeof payload === "string" ? JSON.parse(payload) : payload;
    if (!Array.isArray(parsed)) return { data: [], error: null };
    const leaked = assertRhSummarySafe({ items: parsed });
    if (leaked.length > 0) return { data: [], error: "Sinais indisponíveis" };

    const rows: RhMemberSignalRow[] = parsed.map((item: Record<string, unknown>) => ({
      id: String(item.id),
      wellness: parseWellness(item.wellness),
    }));
    return { data: rows, error: null };
  });

export const setManagerJobTitle = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      profileId: z.string().uuid(),
      jobTitle: z.string().max(100),
    }),
  )
  .handler(async ({ data }) => {
    const auth = await requireManager();
    if ("error" in auth) return { error: auth.error };
    if (!auth.companyId) return { error: "Unauthorized — sem empresa" };

    const { error } = await auth.supabase.rpc("set_employee_job_title", {
      p_profile_id: data.profileId,
      p_job_title: data.jobTitle,
    });
    if (error) return { error: error.message };

    void logEvent(
      "info",
      "manager.setManagerJobTitle",
      "Cargo atualizado pelo RH",
      { company_id: auth.companyId },
      auth.userId,
    );
    return { error: null };
  });
