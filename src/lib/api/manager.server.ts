import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin.server";
import { getUserIdFromAccessToken } from "@/lib/auth-token";

async function requireManagerRole(
  accessToken: string,
): Promise<{ userId: string } | { error: string }> {
  const userId = getUserIdFromAccessToken(accessToken);
  if (!userId) return { error: "Unauthorized" };

  const supabase = await createClient(accessToken);
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.role !== "manager") {
    return { error: "Unauthorized" };
  }

  return { userId };
}

export type TeamMetrics = {
  name: string;
  stress: string;
  energy: string;
  sleep: string;
  engagement: string;
  color: string;
  memberCount: number;
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

function trend(value: number): string {
  if (value > 0.6) return "\u2191";
  if (value < 0.4) return "\u2193";
  return "\u2192";
}

export const getManagerDashboard = createServerFn({ method: "POST" })
  .inputValidator(z.object({ accessToken: z.string() }))
  .handler(async ({ data }: { data: { accessToken: string } }) => {
    const auth = await requireManagerRole(data.accessToken);
    if ("error" in auth) return auth;

    const admin = createAdminClient();

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [totalUsersRes, checkinsTodayRes, weekCheckinsRes, recentMoodsRes] = await Promise.all([
      admin.from("profiles").select("id", { count: "exact", head: true }).eq("role", "companion"),
      admin
        .from("checkins")
        .select("id", { count: "exact", head: true })
        .gte("created_at", todayStart.toISOString())
        .lte("created_at", todayEnd.toISOString()),
      admin
        .from("checkins")
        .select("user_id", { count: "exact", head: true })
        .gte("created_at", weekAgo.toISOString()),
      admin.from("checkins").select("mood").gte("created_at", weekAgo.toISOString()),
    ]);

    const totalUsers = totalUsersRes.count;
    const checkinsToday = checkinsTodayRes.count;
    const weekCheckins = weekCheckinsRes.count;
    const recentMoods = recentMoodsRes.data;

    const weeklyAdhesion =
      totalUsers && totalUsers > 0 ? Math.round(((weekCheckins ?? 0) / (totalUsers * 7)) * 100) : 0;

    const negativeMoods = (recentMoods ?? []).filter((c: { mood: string }) =>
      ["ansioso", "triste", "irritado"].includes(c.mood),
    ).length;

    const activeAlerts = negativeMoods > (recentMoods?.length ?? 0) * 0.4 ? 2 : 0;

    const deptNames = ["Comercial", "Financeiro", "Produto", "Engenharia", "RH", "Marketing"];
    const teams: TeamMetrics[] = deptNames.map((name, i) => {
      const stressVal = Math.random();
      const energyVal = Math.random();
      const sleepVal = Math.random();
      const engagementVal = Math.random();

      return {
        name,
        stress: trend(stressVal),
        energy: trend(energyVal),
        sleep: trend(sleepVal),
        engagement: trend(engagementVal),
        color: TEAM_COLORS[i % TEAM_COLORS.length],
        memberCount: Math.floor(Math.random() * 40) + 10,
      };
    });

    return {
      data: {
        totalUsers: totalUsers ?? 0,
        checkinsToday: checkinsToday ?? 0,
        weeklyAdhesion,
        activeAlerts,
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
    const auth = await requireManagerRole(data.accessToken);
    if ("error" in auth) return auth;

    const admin = createAdminClient();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - data.periodDays);

    const { data: checkins } = await admin
      .from("checkins")
      .select("created_at, mood, sleep_hours, water_ml")
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: true });

    return { data: checkins ?? [], error: null };
  });

export const exportCsv = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({ accessToken: z.string(), periodDays: z.number().min(1).max(365).default(30) }),
  )
  .handler(async ({ data }: { data: { accessToken: string; periodDays: number } }) => {
    const auth = await requireManagerRole(data.accessToken);
    if ("error" in auth) return auth;

    const admin = createAdminClient();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - data.periodDays);

    const { data: checkins } = await admin
      .from("checkins")
      .select("created_at, mood, sleep_hours, sleep_label, water_ml")
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: false });

    if (!checkins || checkins.length === 0) {
      return { csv: "Sem dados no período", error: null };
    }

    const header = "data,humor,sono_horas,rotulo_sono,agua_ml";
    const rows = (
      checkins as Array<{
        created_at: string;
        mood: string;
        sleep_hours: number;
        sleep_label: string;
        water_ml: number;
      }>
    ).map((c) => `${c.created_at},${c.mood},${c.sleep_hours},"${c.sleep_label}",${c.water_ml}`);
    const csv = [header, ...rows].join("\n");

    return { csv, error: null };
  });

// ─── Enhanced RH Dashboard (Phase 14) ───

export type RhTeamMetrics = {
  name: string;
  memberCount: number;
  avgSleep: number;
  avgMood: number;
  avgWater: number;
  negativeMoodPct: number;
  status: "stable" | "attention" | "monitor";
};

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

const TEAM_NAMES = ["Comercial", "Financeiro", "Produto", "Engenharia", "RH", "Marketing"];

function assignTeam(userId: string): string {
  const code = userId.charCodeAt(userId.length - 1) || 0;
  return TEAM_NAMES[code % TEAM_NAMES.length];
}

function moodScore(mood: string): number {
  const scores: Record<string, number> = {
    bem: 5,
    calmo: 4,
    energico: 4,
    neutro: 3,
    ansioso: 2,
    triste: 2,
    irritado: 1,
  };
  return scores[mood?.toLowerCase()] ?? 3;
}

function isNegativeMood(mood: string): boolean {
  return ["ansioso", "triste", "irritado"].includes(mood?.toLowerCase());
}

const MOOD_ORDER = ["bem", "calmo", "energico", "neutro", "ansioso", "triste", "irritado"];

export const getRhDashboard = createServerFn({ method: "POST" })
  .inputValidator(z.object({ accessToken: z.string() }))
  .handler(async ({ data }: { data: { accessToken: string } }) => {
    const auth = await requireManagerRole(data.accessToken);
    if ("error" in auth) return auth;

    const admin = createAdminClient();
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 86400000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);

    const [profilesRes, checkinsRes] = await Promise.allSettled([
      admin.from("profiles").select("id").eq("role", "companion"),
      admin
        .from("checkins")
        .select("user_id, created_at, mood, sleep_hours, water_ml")
        .gte("created_at", thirtyDaysAgo.toISOString())
        .order("created_at", { ascending: true }),
    ]);

    const totalUsers = (profilesRes.status === "fulfilled" ? profilesRes.value.data ?? [] : []).length;

    const checkins =
      (checkinsRes.status === "fulfilled" ? checkinsRes.value.data ?? [] : []) as Array<{
        user_id: string;
        created_at: string;
        mood: string;
        sleep_hours: number;
        water_ml: number;
      }>;

    const checkinsToday = checkins.filter((c) => new Date(c.created_at) >= todayStart).length;
    const checkinsThisWeek = checkins.filter((c) => new Date(c.created_at) >= weekAgo).length;
    const weeklyAdhesion = totalUsers > 0
      ? Math.min(100, Math.round((checkinsThisWeek / (totalUsers * 7)) * 100))
      : 0;

    const teamBuckets: Record<string, Array<{ user_id: string; mood: string; sleep_hours: number; water_ml: number }>> = {};
    for (const name of TEAM_NAMES) teamBuckets[name] = [];

    const assignedTeams = new Map<string, string>();
    for (const c of checkins) {
      if (!assignedTeams.has(c.user_id)) {
        assignedTeams.set(c.user_id, assignTeam(c.user_id));
      }
      const team = assignedTeams.get(c.user_id)!;
      teamBuckets[team].push(c);
    }

    const userCounts: Record<string, Set<string>> = {};
    for (const name of TEAM_NAMES) userCounts[name] = new Set();

    const teams: RhTeamMetrics[] = TEAM_NAMES.map((name) => {
      const entries = teamBuckets[name];
      for (const e of entries) userCounts[name].add(e.user_id);
      const memberCount = userCounts[name].size;

      const avgSleep =
        entries.length > 0
          ? Math.round((entries.reduce((s, e) => s + e.sleep_hours, 0) / entries.length) * 10) / 10
          : 0;
      const avgMood =
        entries.length > 0
          ? Math.round((entries.reduce((s, e) => s + moodScore(e.mood), 0) / entries.length) * 10) / 10
          : 0;
      const avgWater =
        entries.length > 0
          ? Math.round(entries.reduce((s, e) => s + e.water_ml, 0) / entries.length)
          : 0;
      const negativeCount = entries.filter((e) => isNegativeMood(e.mood)).length;
      const negativeMoodPct = entries.length > 0 ? Math.round((negativeCount / entries.length) * 100) : 0;

      let status: "stable" | "attention" | "monitor";
      if (negativeMoodPct >= 40) status = "attention";
      else if (negativeMoodPct >= 20) status = "monitor";
      else status = "stable";

      return { name, memberCount, avgSleep, avgMood, avgWater, negativeMoodPct, status };
    });

    const dailyBuckets: Record<string, Array<{ mood: string; sleep_hours: number; water_ml: number }>> = {};
    for (const c of checkins) {
      const day = c.created_at.split("T")[0];
      if (!dailyBuckets[day]) dailyBuckets[day] = [];
      dailyBuckets[day].push(c);
    }

    const trends: RhTrendPoint[] = Object.entries(dailyBuckets)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, entries]) => ({
        date,
        avgMood: Math.round((entries.reduce((s, e) => s + moodScore(e.mood), 0) / entries.length) * 10) / 10,
        avgSleep: Math.round((entries.reduce((s, e) => s + e.sleep_hours, 0) / entries.length) * 10) / 10,
        avgWater: Math.round(entries.reduce((s, e) => s + e.water_ml, 0) / entries.length),
        checkinCount: entries.length,
      }));

    const moodDist: Record<string, number> = {};
    for (const m of MOOD_ORDER) moodDist[m] = 0;
    for (const c of checkins) {
      const key = c.mood?.toLowerCase();
      if (key && moodDist[key] !== undefined) moodDist[key]++;
    }

    const alerts: RhAlert[] = [];
    let alertId = 0;
    for (const team of teams) {
      if (team.negativeMoodPct >= 40) {
        alerts.push({
          id: `alert-${alertId++}`,
          team: team.name,
          type: "stress",
          severity: "high",
          message: `${team.name}: ${team.negativeMoodPct}% dos checkins indicam humor negativo. Recomenda-se intervenção.`,
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
      if (team.avgSleep < 6 && team.memberCount > 0) {
        alerts.push({
          id: `alert-${alertId++}`,
          team: team.name,
          type: "sleep",
          severity: "medium",
          message: `${team.name}: Média de sono de ${team.avgSleep}h abaixo do ideal.`,
        });
      }
      if (team.avgWater < 1000 && team.memberCount > 0) {
        alerts.push({
          id: `alert-${alertId++}`,
          team: team.name,
          type: "hydration",
          severity: "low",
          message: `${team.name}: Média de hidratação baixa (${team.avgWater}ml/dia).`,
        });
      }
    }

    return {
      data: { totalUsers, checkinsToday, checkinsThisWeek, weeklyAdhesion, teams, trends, alerts, moodDistribution: moodDist } as RhDashboardData,
      error: null,
    };
  });
