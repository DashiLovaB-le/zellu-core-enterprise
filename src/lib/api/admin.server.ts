import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin.server";
import { requireAdmin as requireAdminRole } from "@/lib/require-user";
import { getMoodScore, isNegativeMood, MAIN_MOOD_ORDER } from "@/data/moods";
import { K_ANONYMITY_MIN } from "@/lib/tenant";

function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

const MOOD_ORDER = MAIN_MOOD_ORDER;

// ─── Types ───

export type AdminCompany = {
  id: string;
  name: string;
  slug: string | null;
  document: string | null;
  industry: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  status: string;
  seats: number;
  notes: string | null;
  created_at: string;
  employee_count?: number;
};

export type AdminEmployee = {
  id: string;
  email: string | null;
  display_name: string | null;
  role: string;
  company_id: string | null;
  team_id: string | null;
  job_title: string | null;
  is_active: boolean;
  company_name?: string | null;
  team_name?: string | null;
  created_at: string;
};

export type AdminLicense = {
  id: string;
  company_id: string;
  company_name?: string;
  plan_name: string;
  seats: number;
  seats_used: number;
  status: string;
  starts_at: string;
  ends_at: string | null;
};

export type AdminContract = {
  id: string;
  company_id: string;
  company_name?: string;
  title: string;
  contract_type: string;
  value_brl: number;
  status: string;
  starts_at: string | null;
  ends_at: string | null;
  notes: string | null;
};

export type AdminAlertConfig = {
  id: string;
  company_id: string | null;
  company_name?: string | null;
  name: string;
  mood_negative_warn: number;
  mood_negative_critical: number;
  sleep_hours_min: number;
  water_ml_min: number;
  adhesion_min_pct: number;
  enabled: boolean;
};

export type AdminKpiData = {
  totalCompanies: number;
  activeCompanies: number;
  totalEmployees: number;
  activeLicenses: number;
  checkinsToday: number;
  checkinsThisWeek: number;
  weeklyAdhesion: number;
  avgMood: number;
  negativeMoodPct: number;
  seatsTotal: number;
  seatsUsed: number;
};

export type AdminUsageMetrics = {
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;
  checkinsLast30d: number;
  adoptionByCompany: Array<{
    companyId: string;
    companyName: string;
    employees: number;
    activeUsers: number;
    adhesionPct: number;
  }>;
  dailyTrend: Array<{ date: string; checkins: number; uniqueUsers: number }>;
};

export type AdminSentimentData = {
  moodDistribution: Record<string, number>;
  avgMoodScore: number;
  negativePct: number;
  byCompany: Array<{
    companyId: string;
    companyName: string;
    avgMood: number;
    negativePct: number;
    sampleSize: number;
  }>;
  trends: Array<{ date: string; avgMood: number; negativePct: number }>;
};

export type AdminEvaluatedAlert = {
  id: string;
  companyName: string;
  type: string;
  severity: "low" | "medium" | "high";
  message: string;
};

// ─── KPIs globais ───

export const getAdminKpis = createServerFn({ method: "POST" })
  .inputValidator(z.object({ accessToken: z.string() }))
  .handler(async ({ data }: { data: { accessToken: string } }) => {
    const auth = await requireAdminRole(data.accessToken);
    if ("error" in auth) return { data: null, error: auth.error };

    const admin = createAdminClient();
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 86400000);

    const [companiesRes, employeesRes, licensesRes, checkinsRes] = await Promise.allSettled([
      admin.from("companies").select("id, status, seats"),
      admin.from("profiles").select("id, is_active").eq("role", "companion"),
      admin.from("licenses").select("id, status, seats, seats_used"),
      admin
        .from("checkins")
        .select("created_at, mood, user_id")
        .gte("created_at", weekAgo.toISOString()),
    ]);

    const companies =
      companiesRes.status === "fulfilled" ? (companiesRes.value.data ?? []) : [];
    const employees =
      employeesRes.status === "fulfilled" ? (employeesRes.value.data ?? []) : [];
    const licenses =
      licensesRes.status === "fulfilled" ? (licensesRes.value.data ?? []) : [];
    const checkins =
      (checkinsRes.status === "fulfilled" ? checkinsRes.value.data ?? [] : []) as Array<{
        created_at: string;
        mood: string;
        user_id: string;
      }>;

    const totalEmployees = employees.length;
    const checkinsToday = checkins.filter((c) => new Date(c.created_at) >= todayStart).length;
    const checkinsThisWeek = checkins.length;
    const weeklyAdhesion =
      totalEmployees > 0
        ? Math.min(100, Math.round((checkinsThisWeek / (totalEmployees * 7)) * 100))
        : 0;

    const avgMood =
      checkins.length > 0
        ? Math.round(
            (checkins.reduce((s, c) => s + getMoodScore(c.mood), 0) / checkins.length) * 10,
          ) / 10
        : 0;
    const negativeMoodPct =
      checkins.length > 0
        ? Math.round(
            (checkins.filter((c) => isNegativeMood(c.mood)).length / checkins.length) * 100,
          )
        : 0;

    const activeLicenses = licenses.filter((l) => l.status === "active" || l.status === "trial");
    const seatsTotal = activeLicenses.reduce((s, l) => s + (l.seats ?? 0), 0);
    const seatsUsed = activeLicenses.reduce((s, l) => s + (l.seats_used ?? 0), 0);

    const kpi: AdminKpiData = {
      totalCompanies: companies.length,
      activeCompanies: companies.filter((c) => c.status === "active" || c.status === "trial")
        .length,
      totalEmployees,
      activeLicenses: activeLicenses.length,
      checkinsToday,
      checkinsThisWeek,
      weeklyAdhesion,
      avgMood,
      negativeMoodPct,
      seatsTotal,
      seatsUsed,
    };

    return { data: kpi, error: null };
  });

// ─── Companies CRUD ───

export const listCompanies = createServerFn({ method: "POST" })
  .inputValidator(z.object({ accessToken: z.string() }))
  .handler(async ({ data }: { data: { accessToken: string } }) => {
    const auth = await requireAdminRole(data.accessToken);
    if ("error" in auth) return { data: [] as AdminCompany[], error: auth.error };

    const admin = createAdminClient();
    const { data: companies, error } = await admin
      .from("companies")
      .select("*")
      .order("name", { ascending: true });

    if (error) return { data: [] as AdminCompany[], error: error.message };

    const { data: profiles } = await admin
      .from("profiles")
      .select("company_id")
      .eq("role", "companion");

    const counts: Record<string, number> = {};
    for (const p of profiles ?? []) {
      if (p.company_id) counts[p.company_id] = (counts[p.company_id] ?? 0) + 1;
    }

    const result: AdminCompany[] = (companies ?? []).map((c) => ({
      ...c,
      employee_count: counts[c.id] ?? 0,
    }));

    return { data: result, error: null };
  });

export const upsertCompany = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      accessToken: z.string(),
      id: z.string().uuid().optional(),
      name: z.string().min(2).max(120),
      document: z.string().max(30).optional().nullable(),
      industry: z.string().max(80).optional().nullable(),
      contact_email: z.string().email().optional().nullable().or(z.literal("")),
      contact_phone: z.string().max(30).optional().nullable(),
      status: z.enum(["active", "inactive", "trial", "churned"]).default("active"),
      seats: z.number().int().min(0).max(100000).default(50),
      notes: z.string().max(2000).optional().nullable(),
    }),
  )
  .handler(async ({ data }: { data: any }) => {
    const auth = await requireAdminRole(data.accessToken);
    if ("error" in auth) return { data: null, error: auth.error };

    const admin = createAdminClient();
    const payload = {
      name: data.name.trim(),
      slug: slugify(data.name),
      document: data.document || null,
      industry: data.industry || null,
      contact_email: data.contact_email || null,
      contact_phone: data.contact_phone || null,
      status: data.status,
      seats: data.seats,
      notes: data.notes || null,
    };

    if (data.id) {
      const { data: row, error } = await admin
        .from("companies")
        .update(payload)
        .eq("id", data.id)
        .select("*")
        .single();
      return { data: row as AdminCompany | null, error: error?.message ?? null };
    }

    const { data: row, error } = await admin.from("companies").insert(payload).select("*").single();
    return { data: row as AdminCompany | null, error: error?.message ?? null };
  });

export const deleteCompany = createServerFn({ method: "POST" })
  .inputValidator(z.object({ accessToken: z.string(), id: z.string().uuid() }))
  .handler(async ({ data }: { data: any }) => {
    const auth = await requireAdminRole(data.accessToken);
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();
    const { error } = await admin.from("companies").delete().eq("id", data.id);
    return { error: error?.message ?? null };
  });

// ─── Employees ───

export const listEmployees = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      accessToken: z.string(),
      companyId: z.string().uuid().optional(),
    }),
  )
  .handler(async ({ data }: { data: any }) => {
    const auth = await requireAdminRole(data.accessToken);
    if ("error" in auth) return { data: [] as AdminEmployee[], error: auth.error };

    const admin = createAdminClient();
    let query = admin
      .from("profiles")
      .select("id, email, display_name, role, company_id, team_id, job_title, is_active, created_at")
      .in("role", ["companion", "manager"])
      .order("display_name", { ascending: true });

    if (data.companyId) query = query.eq("company_id", data.companyId);

    const { data: profiles, error } = await query;
    if (error) return { data: [] as AdminEmployee[], error: error.message };

    const [companiesRes, teamsRes] = await Promise.all([
      admin.from("companies").select("id, name"),
      admin.from("teams").select("id, name"),
    ]);

    const companyMap = Object.fromEntries((companiesRes.data ?? []).map((c) => [c.id, c.name]));
    const teamMap = Object.fromEntries((teamsRes.data ?? []).map((t) => [t.id, t.name]));

    const result: AdminEmployee[] = (profiles ?? []).map((p) => ({
      ...p,
      company_name: p.company_id ? companyMap[p.company_id] ?? null : null,
      team_name: p.team_id ? teamMap[p.team_id] ?? null : null,
      is_active: p.is_active ?? true,
    }));

    return { data: result, error: null };
  });

export const updateEmployee = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      accessToken: z.string(),
      id: z.string().uuid(),
      company_id: z.string().uuid().nullable().optional(),
      team_id: z.string().uuid().nullable().optional(),
      job_title: z.string().max(100).nullable().optional(),
      role: z.enum(["companion", "manager"]).optional(),
      is_active: z.boolean().optional(),
      display_name: z.string().min(1).max(100).optional(),
    }),
  )
  .handler(async ({ data }: { data: any }) => {
    const auth = await requireAdminRole(data.accessToken);
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();
    const payload: Record<string, unknown> = {};
    if (data.company_id !== undefined) payload.company_id = data.company_id;
    if (data.team_id !== undefined) payload.team_id = data.team_id;
    if (data.job_title !== undefined) payload.job_title = data.job_title;
    if (data.role !== undefined) payload.role = data.role;
    if (data.is_active !== undefined) payload.is_active = data.is_active;
    if (data.display_name !== undefined) payload.display_name = data.display_name;

    const { error } = await admin.from("profiles").update(payload).eq("id", data.id);
    return { error: error?.message ?? null };
  });

export const listTeams = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      accessToken: z.string(),
      companyId: z.string().uuid().optional(),
    }),
  )
  .handler(async ({ data }: { data: any }) => {
    const auth = await requireAdminRole(data.accessToken);
    if ("error" in auth) return { data: [], error: auth.error };

    const admin = createAdminClient();
    let query = admin.from("teams").select("id, company_id, name, description").order("name");
    if (data.companyId) query = query.eq("company_id", data.companyId);

    const { data: teams, error } = await query;
    return { data: teams ?? [], error: error?.message ?? null };
  });

export const upsertTeam = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      accessToken: z.string(),
      id: z.string().uuid().optional(),
      company_id: z.string().uuid(),
      name: z.string().min(2).max(80),
      description: z.string().max(500).optional().nullable(),
    }),
  )
  .handler(async ({ data }: { data: any }) => {
    const auth = await requireAdminRole(data.accessToken);
    if ("error" in auth) return { data: null, error: auth.error };

    const admin = createAdminClient();
    const payload = {
      company_id: data.company_id,
      name: data.name.trim(),
      description: data.description || null,
    };

    if (data.id) {
      const { data: row, error } = await admin
        .from("teams")
        .update(payload)
        .eq("id", data.id)
        .select("*")
        .single();
      return { data: row, error: error?.message ?? null };
    }

    const { data: row, error } = await admin.from("teams").insert(payload).select("*").single();
    return { data: row, error: error?.message ?? null };
  });

// ─── Licenses & Contracts ───

export const listLicenses = createServerFn({ method: "POST" })
  .inputValidator(z.object({ accessToken: z.string() }))
  .handler(async ({ data }: { data: any }) => {
    const auth = await requireAdminRole(data.accessToken);
    if ("error" in auth) return { data: [] as AdminLicense[], error: auth.error };

    const admin = createAdminClient();
    const { data: licenses, error } = await admin
      .from("licenses")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) return { data: [] as AdminLicense[], error: error.message };

    const { data: companies } = await admin.from("companies").select("id, name");
    const map = Object.fromEntries((companies ?? []).map((c) => [c.id, c.name]));

    const result: AdminLicense[] = (licenses ?? []).map((l) => ({
      ...l,
      company_name: map[l.company_id] ?? "—",
    }));

    return { data: result, error: null };
  });

export const upsertLicense = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      accessToken: z.string(),
      id: z.string().uuid().optional(),
      company_id: z.string().uuid(),
      plan_name: z.string().min(1).max(80).default("standard"),
      seats: z.number().int().min(0).max(100000).default(50),
      seats_used: z.number().int().min(0).max(100000).default(0),
      status: z.enum(["active", "expired", "suspended", "trial"]).default("active"),
      starts_at: z.string().optional(),
      ends_at: z.string().optional().nullable(),
    }),
  )
  .handler(async ({ data }: { data: any }) => {
    const auth = await requireAdminRole(data.accessToken);
    if ("error" in auth) return { data: null, error: auth.error };

    const admin = createAdminClient();
    const payload = {
      company_id: data.company_id,
      plan_name: data.plan_name,
      seats: data.seats,
      seats_used: data.seats_used,
      status: data.status,
      starts_at: data.starts_at ?? new Date().toISOString().slice(0, 10),
      ends_at: data.ends_at || null,
    };

    if (data.id) {
      const { data: row, error } = await admin
        .from("licenses")
        .update(payload)
        .eq("id", data.id)
        .select("*")
        .single();
      return { data: row, error: error?.message ?? null };
    }

    const { data: row, error } = await admin.from("licenses").insert(payload).select("*").single();
    return { data: row, error: error?.message ?? null };
  });

export const listContracts = createServerFn({ method: "POST" })
  .inputValidator(z.object({ accessToken: z.string() }))
  .handler(async ({ data }: { data: any }) => {
    const auth = await requireAdminRole(data.accessToken);
    if ("error" in auth) return { data: [] as AdminContract[], error: auth.error };

    const admin = createAdminClient();
    const { data: contracts, error } = await admin
      .from("contracts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) return { data: [] as AdminContract[], error: error.message };

    const { data: companies } = await admin.from("companies").select("id, name");
    const map = Object.fromEntries((companies ?? []).map((c) => [c.id, c.name]));

    const result: AdminContract[] = (contracts ?? []).map((c) => ({
      ...c,
      value_brl: Number(c.value_brl ?? 0),
      company_name: map[c.company_id] ?? "—",
    }));

    return { data: result, error: null };
  });

export const upsertContract = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      accessToken: z.string(),
      id: z.string().uuid().optional(),
      company_id: z.string().uuid(),
      title: z.string().min(2).max(120),
      contract_type: z.enum(["saas", "pilot", "enterprise", "renewal"]).default("saas"),
      value_brl: z.number().min(0).default(0),
      status: z.enum(["draft", "active", "expired", "cancelled"]).default("draft"),
      starts_at: z.string().optional().nullable(),
      ends_at: z.string().optional().nullable(),
      notes: z.string().max(2000).optional().nullable(),
    }),
  )
  .handler(async ({ data }: { data: any }) => {
    const auth = await requireAdminRole(data.accessToken);
    if ("error" in auth) return { data: null, error: auth.error };

    const admin = createAdminClient();
    const payload = {
      company_id: data.company_id,
      title: data.title.trim(),
      contract_type: data.contract_type,
      value_brl: data.value_brl,
      status: data.status,
      starts_at: data.starts_at || null,
      ends_at: data.ends_at || null,
      notes: data.notes || null,
    };

    if (data.id) {
      const { data: row, error } = await admin
        .from("contracts")
        .update(payload)
        .eq("id", data.id)
        .select("*")
        .single();
      return { data: row, error: error?.message ?? null };
    }

    const { data: row, error } = await admin.from("contracts").insert(payload).select("*").single();
    return { data: row, error: error?.message ?? null };
  });

// ─── Usage metrics ───

export const getUsageMetrics = createServerFn({ method: "POST" })
  .inputValidator(z.object({ accessToken: z.string() }))
  .handler(async ({ data }: { data: any }) => {
    const auth = await requireAdminRole(data.accessToken);
    if ("error" in auth) return { data: null, error: auth.error };

    const admin = createAdminClient();
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 1 * 86400000);
    const weekAgo = new Date(now.getTime() - 7 * 86400000);
    const monthAgo = new Date(now.getTime() - 30 * 86400000);

    const [checkinsRes, profilesRes, companiesRes] = await Promise.all([
      admin
        .from("checkins")
        .select("user_id, created_at")
        .gte("created_at", monthAgo.toISOString()),
      admin.from("profiles").select("id, company_id").eq("role", "companion"),
      admin.from("companies").select("id, name"),
    ]);

    const checkins = (checkinsRes.data ?? []) as Array<{ user_id: string; created_at: string }>;
    const profiles = profilesRes.data ?? [];
    const companies = companiesRes.data ?? [];

    const uniqueIn = (since: Date) =>
      new Set(checkins.filter((c) => new Date(c.created_at) >= since).map((c) => c.user_id)).size;

    const companyMap = Object.fromEntries(companies.map((c) => [c.id, c.name]));
    const employeesByCompany: Record<string, number> = {};
    for (const p of profiles) {
      if (!p.company_id) continue;
      employeesByCompany[p.company_id] = (employeesByCompany[p.company_id] ?? 0) + 1;
    }

    const profileCompany = Object.fromEntries(
      profiles.filter((p) => p.company_id).map((p) => [p.id, p.company_id as string]),
    );

    const activeByCompany: Record<string, Set<string>> = {};
    for (const c of checkins) {
      const companyId = profileCompany[c.user_id];
      if (!companyId) continue;
      if (!activeByCompany[companyId]) activeByCompany[companyId] = new Set();
      activeByCompany[companyId].add(c.user_id);
    }

    const adoptionByCompany = Object.keys(employeesByCompany).map((companyId) => {
      const employees = employeesByCompany[companyId] ?? 0;
      const activeUsers = activeByCompany[companyId]?.size ?? 0;
      return {
        companyId,
        companyName: companyMap[companyId] ?? "—",
        employees,
        activeUsers,
        adhesionPct: employees > 0 ? Math.round((activeUsers / employees) * 100) : 0,
      };
    });

    const dailyBuckets: Record<string, { users: Set<string>; count: number }> = {};
    for (const c of checkins) {
      const day = c.created_at.split("T")[0];
      if (!dailyBuckets[day]) dailyBuckets[day] = { users: new Set(), count: 0 };
      dailyBuckets[day].users.add(c.user_id);
      dailyBuckets[day].count++;
    }

    const dailyTrend = Object.entries(dailyBuckets)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, bucket]) => ({
        date,
        checkins: bucket.count,
        uniqueUsers: bucket.users.size,
      }));

    const metrics: AdminUsageMetrics = {
      dailyActiveUsers: uniqueIn(dayAgo),
      weeklyActiveUsers: uniqueIn(weekAgo),
      monthlyActiveUsers: uniqueIn(monthAgo),
      checkinsLast30d: checkins.length,
      adoptionByCompany,
      dailyTrend,
    };

    return { data: metrics, error: null };
  });

// ─── Sentiments ───

export const getSentimentData = createServerFn({ method: "POST" })
  .inputValidator(z.object({ accessToken: z.string() }))
  .handler(async ({ data }: { data: any }) => {
    const auth = await requireAdminRole(data.accessToken);
    if ("error" in auth) return { data: null, error: auth.error };

    const admin = createAdminClient();
    const monthAgo = new Date(Date.now() - 30 * 86400000);

    const [checkinsRes, profilesRes, companiesRes] = await Promise.all([
      admin
        .from("checkins")
        .select("user_id, created_at, mood")
        .gte("created_at", monthAgo.toISOString()),
      admin.from("profiles").select("id, company_id").eq("role", "companion"),
      admin.from("companies").select("id, name"),
    ]);

    const checkins = (checkinsRes.data ?? []) as Array<{
      user_id: string;
      created_at: string;
      mood: string;
    }>;
    const profiles = profilesRes.data ?? [];
    const companies = companiesRes.data ?? [];

    const moodDistribution: Record<string, number> = {};
    for (const m of MOOD_ORDER) moodDistribution[m] = 0;
    for (const c of checkins) {
      const key = c.mood?.toLowerCase();
      if (key && moodDistribution[key] !== undefined) moodDistribution[key]++;
    }

    const avgMoodScore =
      checkins.length > 0
        ? Math.round(
            (checkins.reduce((s, c) => s + getMoodScore(c.mood), 0) / checkins.length) * 10,
          ) / 10
        : 0;
    const negativePct =
      checkins.length > 0
        ? Math.round(
            (checkins.filter((c) => isNegativeMood(c.mood)).length / checkins.length) * 100,
          )
        : 0;

    const profileCompany = Object.fromEntries(
      profiles.filter((p) => p.company_id).map((p) => [p.id, p.company_id as string]),
    );
    const companyMap = Object.fromEntries(companies.map((c) => [c.id, c.name]));

    const byCompanyBuckets: Record<string, Array<{ mood: string; user_id: string }>> = {};
    for (const c of checkins) {
      const companyId = profileCompany[c.user_id];
      if (!companyId) continue;
      if (!byCompanyBuckets[companyId]) byCompanyBuckets[companyId] = [];
      byCompanyBuckets[companyId].push({ mood: c.mood, user_id: c.user_id });
    }

    const byCompany = Object.entries(byCompanyBuckets).map(([companyId, entries]) => {
      const uniqueUsers = new Set(entries.map((e) => e.user_id)).size;
      if (uniqueUsers < K_ANONYMITY_MIN) {
        return {
          companyId,
          companyName: companyMap[companyId] ?? "—",
          avgMood: 0,
          negativePct: 0,
          sampleSize: 0,
        };
      }
      const avgMood =
        Math.round(
          (entries.reduce((s, e) => s + getMoodScore(e.mood), 0) / entries.length) * 10,
        ) / 10;
      const neg = Math.round(
        (entries.filter((e) => isNegativeMood(e.mood)).length / entries.length) * 100,
      );
      return {
        companyId,
        companyName: companyMap[companyId] ?? "—",
        avgMood,
        negativePct: neg,
        sampleSize: entries.length,
      };
    });

    const daily: Record<string, Array<{ mood: string }>> = {};
    for (const c of checkins) {
      const day = c.created_at.split("T")[0];
      if (!daily[day]) daily[day] = [];
      daily[day].push(c);
    }

    const trends = Object.entries(daily)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, entries]) => ({
        date,
        avgMood:
          Math.round(
            (entries.reduce((s, e) => s + getMoodScore(e.mood), 0) / entries.length) * 10,
          ) / 10,
        negativePct: Math.round(
          (entries.filter((e) => isNegativeMood(e.mood)).length / entries.length) * 100,
        ),
      }));

    const result: AdminSentimentData = {
      moodDistribution,
      avgMoodScore,
      negativePct,
      byCompany,
      trends,
    };

    return { data: result, error: null };
  });

// ─── Alert configs ───

export const listAlertConfigs = createServerFn({ method: "POST" })
  .inputValidator(z.object({ accessToken: z.string() }))
  .handler(async ({ data }: { data: any }) => {
    const auth = await requireAdminRole(data.accessToken);
    if ("error" in auth) return { data: [] as AdminAlertConfig[], error: auth.error };

    const admin = createAdminClient();
    const { data: configs, error } = await admin
      .from("alert_configs")
      .select("*")
      .order("name");

    if (error) return { data: [] as AdminAlertConfig[], error: error.message };

    const { data: companies } = await admin.from("companies").select("id, name");
    const map = Object.fromEntries((companies ?? []).map((c) => [c.id, c.name]));

    const result: AdminAlertConfig[] = (configs ?? []).map((c) => ({
      ...c,
      company_name: c.company_id ? map[c.company_id] ?? null : "Global",
    }));

    return { data: result, error: null };
  });

export const upsertAlertConfig = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      accessToken: z.string(),
      id: z.string().uuid().optional(),
      company_id: z.string().uuid().nullable().optional(),
      name: z.string().min(2).max(80),
      mood_negative_warn: z.number().int().min(0).max(100).default(20),
      mood_negative_critical: z.number().int().min(0).max(100).default(40),
      sleep_hours_min: z.number().min(0).max(24).default(6),
      water_ml_min: z.number().int().min(0).max(10000).default(1000),
      adhesion_min_pct: z.number().int().min(0).max(100).default(40),
      enabled: z.boolean().default(true),
    }),
  )
  .handler(async ({ data }: { data: any }) => {
    const auth = await requireAdminRole(data.accessToken);
    if ("error" in auth) return { data: null, error: auth.error };

    const admin = createAdminClient();
    const payload = {
      company_id: data.company_id ?? null,
      name: data.name.trim(),
      mood_negative_warn: data.mood_negative_warn,
      mood_negative_critical: data.mood_negative_critical,
      sleep_hours_min: data.sleep_hours_min,
      water_ml_min: data.water_ml_min,
      adhesion_min_pct: data.adhesion_min_pct,
      enabled: data.enabled,
    };

    if (data.id) {
      const { data: row, error } = await admin
        .from("alert_configs")
        .update(payload)
        .eq("id", data.id)
        .select("*")
        .single();
      return { data: row, error: error?.message ?? null };
    }

    const { data: row, error } = await admin
      .from("alert_configs")
      .insert(payload)
      .select("*")
      .single();
    return { data: row, error: error?.message ?? null };
  });

export const evaluateAlerts = createServerFn({ method: "POST" })
  .inputValidator(z.object({ accessToken: z.string() }))
  .handler(async ({ data }: { data: any }) => {
    const auth = await requireAdminRole(data.accessToken);
    if ("error" in auth) return { data: [] as AdminEvaluatedAlert[], error: auth.error };

    const admin = createAdminClient();
    const weekAgo = new Date(Date.now() - 7 * 86400000);

    const [configsRes, checkinsRes, profilesRes, companiesRes] = await Promise.all([
      admin.from("alert_configs").select("*").eq("enabled", true),
      admin
        .from("checkins")
        .select("user_id, mood, sleep_hours, water_ml, created_at")
        .gte("created_at", weekAgo.toISOString()),
      admin.from("profiles").select("id, company_id").eq("role", "companion"),
      admin.from("companies").select("id, name"),
    ]);

    const configs = configsRes.data ?? [];
    const checkins = (checkinsRes.data ?? []) as Array<{
      user_id: string;
      mood: string;
      sleep_hours: number;
      water_ml: number;
    }>;
    const profiles = profilesRes.data ?? [];
    const companies = companiesRes.data ?? [];
    const companyMap = Object.fromEntries(companies.map((c) => [c.id, c.name]));
    const profileCompany = Object.fromEntries(
      profiles.filter((p) => p.company_id).map((p) => [p.id, p.company_id as string]),
    );

    const globalConfig =
      configs.find((c) => !c.company_id) ??
      ({
        mood_negative_warn: 20,
        mood_negative_critical: 40,
        sleep_hours_min: 6,
        water_ml_min: 1000,
        adhesion_min_pct: 40,
      } as const);

    const byCompany: Record<string, typeof checkins> = {};
    for (const c of checkins) {
      const companyId = profileCompany[c.user_id] ?? "__unassigned__";
      if (!byCompany[companyId]) byCompany[companyId] = [];
      byCompany[companyId].push(c);
    }

    const employeesByCompany: Record<string, number> = {};
    for (const p of profiles) {
      const key = p.company_id ?? "__unassigned__";
      employeesByCompany[key] = (employeesByCompany[key] ?? 0) + 1;
    }

    const alerts: AdminEvaluatedAlert[] = [];
    let idx = 0;

    for (const [companyId, entries] of Object.entries(byCompany)) {
      const config =
        configs.find((c) => c.company_id === companyId) ?? globalConfig;
      const companyName =
        companyId === "__unassigned__"
          ? "Sem empresa"
          : (companyMap[companyId] ?? "Empresa");

      const negPct =
        entries.length > 0
          ? Math.round(
              (entries.filter((e) => isNegativeMood(e.mood)).length / entries.length) * 100,
            )
          : 0;
      const avgSleep =
        entries.length > 0
          ? entries.reduce((s, e) => s + e.sleep_hours, 0) / entries.length
          : 0;
      const avgWater =
        entries.length > 0
          ? entries.reduce((s, e) => s + e.water_ml, 0) / entries.length
          : 0;
      const uniqueUsers = new Set(entries.map((e) => e.user_id)).size;
      const employees = employeesByCompany[companyId] ?? 0;
      const adhesion =
        employees > 0 ? Math.round((uniqueUsers / employees) * 100) : 0;

      if (negPct >= config.mood_negative_critical) {
        alerts.push({
          id: `a-${idx++}`,
          companyName,
          type: "mood",
          severity: "high",
          message: `${companyName}: ${negPct}% de humor negativo (limite crítico ${config.mood_negative_critical}%).`,
        });
      } else if (negPct >= config.mood_negative_warn) {
        alerts.push({
          id: `a-${idx++}`,
          companyName,
          type: "mood",
          severity: "medium",
          message: `${companyName}: ${negPct}% de humor negativo (limite alerta ${config.mood_negative_warn}%).`,
        });
      }

      if (avgSleep > 0 && avgSleep < config.sleep_hours_min) {
        alerts.push({
          id: `a-${idx++}`,
          companyName,
          type: "sleep",
          severity: "medium",
          message: `${companyName}: sono médio ${avgSleep.toFixed(1)}h abaixo de ${config.sleep_hours_min}h.`,
        });
      }

      if (avgWater > 0 && avgWater < config.water_ml_min) {
        alerts.push({
          id: `a-${idx++}`,
          companyName,
          type: "hydration",
          severity: "low",
          message: `${companyName}: hidratação média ${Math.round(avgWater)}ml abaixo de ${config.water_ml_min}ml.`,
        });
      }

      if (employees > 0 && adhesion < config.adhesion_min_pct) {
        alerts.push({
          id: `a-${idx++}`,
          companyName,
          type: "adhesion",
          severity: "medium",
          message: `${companyName}: adesão ${adhesion}% abaixo do mínimo ${config.adhesion_min_pct}%.`,
        });
      }
    }

    return { data: alerts, error: null };
  });

// ─── Reports export ───

export const exportAdminCsv = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      accessToken: z.string(),
      periodDays: z.number().min(1).max(365).default(30),
      reportType: z.enum(["checkins", "companies", "employees"]).default("checkins"),
    }),
  )
  .handler(async ({ data }: { data: any }) => {
    const auth = await requireAdminRole(data.accessToken);
    if ("error" in auth) return { csv: "", error: auth.error };

    const admin = createAdminClient();

    if (data.reportType === "companies") {
      const { data: companies } = await admin.from("companies").select("*").order("name");
      const header = "id,nome,status,assentos,industria,email,documento";
      const rows = (companies ?? []).map(
        (c) =>
          `${c.id},"${c.name}",${c.status},${c.seats},"${c.industry ?? ""}","${c.contact_email ?? ""}","${c.document ?? ""}"`,
      );
      return { csv: [header, ...rows].join("\n"), error: null };
    }

    if (data.reportType === "employees") {
      const { data: profiles } = await admin
        .from("profiles")
        .select("id, email, display_name, role, company_id, is_active, job_title")
        .in("role", ["companion", "manager"]);
      const header = "id,nome,email,role,company_id,ativo,cargo";
      const rows = (profiles ?? []).map(
        (p) =>
          `${p.id},"${p.display_name ?? ""}","${p.email ?? ""}",${p.role},${p.company_id ?? ""},${p.is_active ?? true},"${p.job_title ?? ""}"`,
      );
      return { csv: [header, ...rows].join("\n"), error: null };
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - data.periodDays);
    const { data: checkins } = await admin
      .from("checkins")
      .select("created_at, mood, sleep_hours, sleep_label, water_ml, user_id")
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: false });

    if (!checkins?.length) return { csv: "Sem dados no período", error: null };

    const header = "data,user_id,humor,sono_horas,rotulo_sono,agua_ml";
    const rows = checkins.map(
      (c) =>
        `${c.created_at},${c.user_id},${c.mood},${c.sleep_hours},"${c.sleep_label}",${c.water_ml}`,
    );
    return { csv: [header, ...rows].join("\n"), error: null };
  });

export const exportAdminPdf = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      accessToken: z.string(),
      periodDays: z.number().min(1).max(365).default(30),
    }),
  )
  .handler(async ({ data }: { data: any }) => {
    const auth = await requireAdminRole(data.accessToken);
    if ("error" in auth) return { pdfBase64: "", error: auth.error };

    const admin = createAdminClient();
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 86400000);
    const periodStart = new Date(now.getTime() - data.periodDays * 86400000);

    const [companiesRes, employeesRes, checkinsRes, licensesRes] = await Promise.all([
      admin.from("companies").select("id, name, status", { count: "exact" }),
      admin.from("profiles").select("id", { count: "exact", head: true }).eq("role", "companion"),
      admin
        .from("checkins")
        .select("created_at, mood")
        .gte("created_at", periodStart.toISOString()),
      admin.from("licenses").select("id, status", { count: "exact" }),
    ]);

    const companies = companiesRes.data ?? [];
    const totalEmployees = employeesRes.count ?? 0;
    const checkins = (checkinsRes.data ?? []) as Array<{ created_at: string; mood: string }>;
    const licenses = licensesRes.data ?? [];

    const checkinsToday = checkins.filter((c) => new Date(c.created_at) >= todayStart).length;
    const checkinsWeek = checkins.filter((c) => new Date(c.created_at) >= weekAgo).length;
    const avgMood =
      checkins.length > 0
        ? (
            checkins.reduce((s, c) => s + getMoodScore(c.mood), 0) / checkins.length
          ).toFixed(1)
        : "0";
    const negPct =
      checkins.length > 0
        ? Math.round(
            (checkins.filter((c) => isNegativeMood(c.mood)).length / checkins.length) * 100,
          )
        : 0;

    const lines = [
      "Mundo Mental — Relatorio Administrativo",
      `Gerado em: ${now.toLocaleString("pt-BR")}`,
      `Periodo: ultimos ${data.periodDays} dias`,
      "",
      "=== KPIs GLOBAIS ===",
      `Empresas: ${companies.length} (${companies.filter((c) => c.status === "active").length} ativas)`,
      `Colaboradores: ${totalEmployees}`,
      `Licencas ativas: ${licenses.filter((l) => l.status === "active" || l.status === "trial").length}`,
      `Check-ins hoje: ${checkinsToday}`,
      `Check-ins (7d): ${checkinsWeek}`,
      `Check-ins (periodo): ${checkins.length}`,
      `Humor medio: ${avgMood}/5`,
      `Humor negativo: ${negPct}%`,
      "",
      "=== EMPRESAS ===",
      ...companies.slice(0, 40).map((c) => `- ${c.name} [${c.status}]`),
      companies.length > 40 ? `... e mais ${companies.length - 40}` : "",
      "",
      "Documento confidencial — uso interno Mundo Mental",
    ].filter((l) => l !== undefined);

    const pdfBase64 = buildSimplePdf(lines);
    return { pdfBase64, error: null };
  });

/** Minimal single-page PDF (Helvetica) without external deps */
function buildSimplePdf(lines: string[]): string {
  const sanitized = lines.map((l) =>
    l
      .replace(/[^\x20-\x7E]/g, (ch) => {
        const map: Record<string, string> = {
          "—": "-",
          "–": "-",
          á: "a",
          à: "a",
          ã: "a",
          â: "a",
          é: "e",
          ê: "e",
          í: "i",
          ó: "o",
          ô: "o",
          õ: "o",
          ú: "u",
          ç: "c",
          Á: "A",
          É: "E",
          Í: "I",
          Ó: "O",
          Ú: "U",
          Ç: "C",
        };
        return map[ch] ?? "?";
      })
      .slice(0, 90),
  );

  const contentLines: string[] = ["BT", "/F1 10 Tf", "50 780 Td", "14 TL"];
  sanitized.forEach((line, i) => {
    const escaped = line.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
    if (i === 0) contentLines.push(`(${escaped}) Tj`);
    else contentLines.push(`T* (${escaped}) Tj`);
  });
  contentLines.push("ET");
  const stream = contentLines.join("\n");

  const objects: string[] = [];
  objects.push("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
  objects.push("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");
  objects.push(
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n",
  );
  objects.push(
    `4 0 obj\n<< /Length ${byteLength(stream)} >>\nstream\n${stream}\nendstream\nendobj\n`,
  );
  objects.push("5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n");

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(byteLength(pdf));
    pdf += obj;
  }
  const xrefPos = byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i < offsets.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  pdf += `startxref\n${xrefPos}\n%%EOF`;

  return bytesToBase64(pdf);
}

function byteLength(str: string): number {
  let len = 0;
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    len += code < 0x80 ? 1 : code < 0x800 ? 2 : 3;
  }
  return len;
}

function bytesToBase64(str: string): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(str, "utf8").toString("base64");
  }
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
  return btoa(binary);
}
