import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const env = Object.fromEntries(
  readFileSync(resolve(root, ".env"), "utf8")
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => {
      const i = line.indexOf("=");
      return [line.slice(0, i).trim(), line.slice(i + 1).trim().replace(/^"|"$/g, "")];
    }),
);

const url = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  throw new Error("VITE_SUPABASE_URL/SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias no .env");
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const EMAIL = "colaborador.teste@mundomental.care";
const HISTORY_DAYS = 30;

const person = {
  email: EMAIL,
  displayName: "Colaborador Teste",
  avatar: "Zeca",
  goal: "equilibrio-emocional",
  moods: ["neutro", "calmo", "feliz", "cansado", "motivado", "ansioso", "grato"],
  sleepBase: 7.0,
  waterBase: 1700,
  energy: 65,
  movement: 28,
  meals: ["Café da Manhã", "Almoço", "Jantar"],
  diary: "Rotina de teste mais estável. Check-ins diários ajudam a perceber o ritmo da semana.",
};

function sleepLabelFromHours(hours) {
  const val = (hours / 12) * 100;
  if (val < 25) return "Cansado";
  if (val < 50) return "Moderado";
  if (val < 75) return "Revigorante";
  return "Descansado";
}

function atSaoPaulo(daysAgo, hour, minute = 12) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hh = String(hour).padStart(2, "0");
  const mm = String(minute).padStart(2, "0");
  return `${y}-${m}-${day}T${hh}:${mm}:00-03:00`;
}

function isoDate(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split("T")[0];
}

async function resolveUserId() {
  const { data: profile } = await admin
    .from("profiles")
    .select("id, email, company_id, team_id")
    .eq("email", EMAIL)
    .maybeSingle();
  if (profile?.id) return profile;

  const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const found = list?.users?.find((u) => u.email?.toLowerCase() === EMAIL.toLowerCase());
  if (!found) throw new Error(`Usuário ${EMAIL} não encontrado`);
  return { id: found.id, email: EMAIL, company_id: null, team_id: null };
}

async function ensureTeam(companyId) {
  if (!companyId) return null;
  const { data: existing } = await admin
    .from("teams")
    .select("id, name")
    .eq("company_id", companyId)
    .eq("name", "Equipe Demo")
    .maybeSingle();
  if (existing) return existing.id;
  const { data } = await admin
    .from("teams")
    .select("id")
    .eq("company_id", companyId)
    .order("name")
    .limit(1)
    .maybeSingle();
  return data?.id ?? null;
}

async function habitColumns() {
  const { data, error } = await admin.from("habits").select("*").limit(1);
  if (error) return new Set();
  return new Set(Object.keys(data?.[0] ?? {}));
}

const profile = await resolveUserId();
const id = profile.id;
const now = new Date().toISOString();
const teamId = profile.team_id ?? (await ensureTeam(profile.company_id));
const habitCols = await habitColumns();

const { error: profileError } = await admin.from("profiles").upsert({
  id,
  email: person.email,
  display_name: person.displayName,
  role: "companion",
  company_id: profile.company_id,
  team_id: teamId,
  avatar_url: person.avatar,
  is_active: true,
  timezone: "America/Sao_Paulo",
  onboarding_completed_at: now,
  adult_confirmed_at: now,
  privacy_consent_at: now,
  privacy_consent_version: "3.0",
  privacy_ai_opt_in: true,
  privacy_rh_opt_in: true,
  privacy_email_opt_in: false,
});
if (profileError) throw new Error(`profile: ${profileError.message}`);

await admin.from("checkins").delete().eq("user_id", id);
await admin.from("habits").delete().eq("user_id", id);
await admin.from("wellness_checklist").delete().eq("user_id", id);
await admin.from("wellness_plans").delete().eq("user_id", id);
await admin.from("diary_entries").delete().eq("user_id", id);

const checkins = [];
for (let daysAgo = HISTORY_DAYS - 1; daysAgo >= 0; daysAgo--) {
  const mood = person.moods[daysAgo % person.moods.length];
  const jitter = ((daysAgo % 3) - 1) * 0.35;
  const sleep = Math.max(4, Math.min(9.5, +(person.sleepBase + jitter).toFixed(1)));
  const water = Math.max(500, person.waterBase + ((daysAgo % 4) - 1) * 150);
  checkins.push({
    user_id: id,
    sleep_hours: sleep,
    sleep_label: sleepLabelFromHours(sleep),
    water_ml: water,
    mood,
    created_at: atSaoPaulo(daysAgo, 8, 10 + (daysAgo % 50)),
  });
}
const { error: checkinError } = await admin.from("checkins").insert(checkins);
if (checkinError) throw new Error(`checkins: ${checkinError.message}`);

const habitPayload = {
  user_id: id,
  water_ml: person.waterBase,
  sleep_quality: Math.round((person.sleepBase / 12) * 100),
};
if (habitCols.has("date")) habitPayload.date = isoDate(0);
if (habitCols.has("mood")) habitPayload.mood = person.moods[0];
if (habitCols.has("movement_minutes")) habitPayload.movement_minutes = person.movement;
if (habitCols.has("energy_level")) habitPayload.energy_level = person.energy;
if (habitCols.has("meals")) habitPayload.meals = person.meals;
const { error: habitError } = await admin.from("habits").insert(habitPayload);
if (habitError) throw new Error(`habits: ${habitError.message}`);

const { data: plan, error: planError } = await admin
  .from("wellness_plans")
  .insert({
    user_id: id,
    goal: person.goal,
    custom_goal: "",
    start_date: isoDate(HISTORY_DAYS - 1),
    is_active: true,
  })
  .select("id")
  .single();
if (planError) throw new Error(`plan: ${planError.message}`);

const checks = [];
for (let daysAgo = HISTORY_DAYS - 1; daysAgo >= 0; daysAgo--) {
  checks.push({
    user_id: id,
    plan_id: plan.id,
    date: isoDate(daysAgo),
    water_done: person.waterBase >= 1500 || daysAgo % 2 === 0,
    walk_done: person.movement >= 20 && daysAgo !== 2,
    breathe_done: daysAgo % 3 === 0,
    talk_done: daysAgo === 0 || daysAgo === 4,
    notes: daysAgo === 0 ? "Check-in do dia feito." : "",
  });
}
const { error: clError } = await admin.from("wellness_checklist").insert(checks);
if (clError) throw new Error(`checklist: ${clError.message}`);

const { error: diaryError } = await admin.from("diary_entries").insert([
  {
    user_id: id,
    content: person.diary,
    mood: person.moods[0],
    created_at: atSaoPaulo(0, 21, 15),
  },
  {
    user_id: id,
    content: `Há cerca de duas semanas: ${person.diary}`,
    mood: person.moods[3 % person.moods.length],
    created_at: atSaoPaulo(14, 20, 40),
  },
  {
    user_id: id,
    content: "No começo do período: registro rápido do bem-estar.",
    mood: person.moods[5 % person.moods.length],
    created_at: atSaoPaulo(28, 19, 5),
  },
]);
if (diaryError) throw new Error(`diary: ${diaryError.message}`);

console.log(
  JSON.stringify(
    {
      email: EMAIL,
      userId: id,
      checkins: checkins.length,
      habits: 1,
      wellness_checklist: checks.length,
      diary_entries: 3,
      goal: person.goal,
      privacy_rh_opt_in: true,
      privacy_ai_opt_in: true,
    },
    null,
    2,
  ),
);
