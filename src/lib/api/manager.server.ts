import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin.server";

async function requireManagerRole(
  accessToken: string,
): Promise<{ user: import("@supabase/supabase-js").User } | { error: string }> {
  const supabase = await createClient(accessToken);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "manager") {
    return { error: "Unauthorized" };
  }

  return { user };
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

    const { count: totalUsers } = await admin
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "companion");

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const { count: checkinsToday } = await admin
      .from("checkins")
      .select("*", { count: "exact", head: true })
      .gte("created_at", todayStart.toISOString())
      .lte("created_at", todayEnd.toISOString());

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const { count: weekCheckins } = await admin
      .from("checkins")
      .select("user_id", { count: "exact", head: true })
      .gte("created_at", weekAgo.toISOString());

    const weeklyAdhesion =
      totalUsers && totalUsers > 0 ? Math.round(((weekCheckins ?? 0) / (totalUsers * 7)) * 100) : 0;

    const { data: recentMoods } = await admin
      .from("checkins")
      .select("mood")
      .gte("created_at", weekAgo.toISOString());

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
