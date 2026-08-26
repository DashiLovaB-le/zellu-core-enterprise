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

const PEOPLE = [
  {
    email: "ana.silva.demo@zellu.app",
    password: "Ana#Care2026",
    displayName: "Ana Silva",
    avatar: "Amora",
    goal: "equilibrio-emocional",
    moods: ["feliz", "grato", "calmo", "contente", "feliz", "sereno", "motivado"],
    sleepBase: 7.6,
    waterBase: 1900,
    energy: 78,
    movement: 35,
    meals: ["Café da Manhã", "Almoço", "Jantar"],
    diary: "Semana mais leve no comercial. Consegui pausar na hora do almoço.",
  },
  {
    email: "bruno.costa.demo@zellu.app",
    password: "Bruno#Care2026",
    displayName: "Bruno Costa",
    avatar: "Chico",
    goal: "reduzir-ansiedade",
    moods: ["sobrecarregado", "ansioso", "cansado", "preocupado", "ansioso", "irritado", "neutro"],
    sleepBase: 5.2,
    waterBase: 900,
    energy: 38,
    movement: 10,
    meals: ["Café da Manhã", "Almoço"],
    diary: "Muitos prazos. Dormi mal e acordei já tenso com as reuniões.",
  },
  {
    email: "camila.rocha.demo@zellu.app",
    password: "Camila#Care2026",
    displayName: "Camila Rocha",
    avatar: "Pipoca",
    goal: "melhorar-sono",
    moods: ["cansado", "neutro", "triste", "calmo", "pensativo", "neutro", "esperancoso"],
    sleepBase: 6.1,
    waterBase: 1400,
    energy: 52,
    movement: 20,
    meals: ["Almoço", "Lanche", "Jantar"],
    diary: "Tentei reduzir tela à noite. Ainda acordo cansada, mas um pouco melhor.",
  },
  {
    email: "diego.nunes.demo@zellu.app",
    password: "Diego#Care2026",
    displayName: "Diego Nunes",
    avatar: "Zeca",
    goal: "aumentar-energia",
    moods: ["focado", "motivado", "feliz", "calmo", "entusiasmado", "focado", "orgulhoso"],
    sleepBase: 8.0,
    waterBase: 2300,
    energy: 86,
    movement: 50,
    meals: ["Café da Manhã", "Almoço", "Lanche", "Jantar"],
    diary: "Voltei a caminhar cedo. Energia bem diferente no meio da tarde.",
  },
  {
    email: "elisa.martins.demo@zellu.app",
    password: "Elisa#Care2026",
    displayName: "Elisa Martins",
    avatar: "Amora",
    goal: "autocuidado-rotina",
    moods: ["inseguro", "preocupado", "neutro", "acolhido", "calmo", "ansioso", "grato"],
    sleepBase: 6.8,
    waterBase: 1600,
    energy: 58,
    movement: 25,
    meals: ["Café da Manhã", "Almoço", "Jantar"],
    diary: "Conversei com a equipe e pedi ajuda num projeto. Aliviou um pouco.",
  },
  {
    email: "colaborador.teste@zellu.app",
    password: "MmcTeste#2026",
    displayName: "Colaborador Teste",
    avatar: "Chico",
    goal: "equilibrio-emocional",
    moods: ["neutro", "calmo", "feliz", "cansado", "motivado", "ansioso", "grato"],
    sleepBase: 7.0,
    waterBase: 1700,
    energy: 65,
    movement: 28,
    meals: ["Café da Manhã", "Almoço", "Jantar"],
    diary: "Rotina de teste mais estável. Check-ins diários ajudam a perceber o ritmo da semana.",
  },
];

const HISTORY_DAYS = 30;

const COMPANY_NAME = "Empresa Demo Zēllu";

function legacyEmail(email) {
  return email.replace(/@zellu\.app$/i, "@mundomental.care");
}

async function listAllUsers() {
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (error) throw new Error(`listUsers: ${error.message}`);
  return data?.users ?? [];
}

async function ensureCompany() {
  const { data, error } = await admin.from("companies").select("id, name").limit(1);
  if (error) throw new Error(`companies: ${error.message}`);
  if (!data?.[0]) throw new Error("Empresa demo não encontrada. Crie os usuários base primeiro.");
  if (data[0].name === COMPANY_NAME) return data[0];
  const { data: renamed, error: renameError } = await admin
    .from("companies")
    .update({ name: COMPANY_NAME })
    .eq("id", data[0].id)
    .select("id, name")
    .single();
  if (renameError) throw new Error(`companies rename: ${renameError.message}`);
  return renamed;
}

async function ensureTeam(companyId) {
  const name = "Equipe Demo";
  const { data: existing } = await admin
    .from("teams")
    .select("id, name")
    .eq("company_id", companyId)
    .eq("name", name)
    .maybeSingle();
  if (existing) return existing;
  const { data, error } = await admin
    .from("teams")
    .insert({ company_id: companyId, name, description: "Equipe de demonstração" })
    .select("id, name")
    .single();
  if (error) throw new Error(`teams: ${error.message}`);
  return data;
}

async function ensureUser({ email, password, displayName }) {
  const users = await listAllUsers();
  const legacy = legacyEmail(email);
  const found =
    users.find((u) => u.email?.toLowerCase() === email.toLowerCase()) ??
    users.find((u) => u.email?.toLowerCase() === legacy.toLowerCase());

  if (found) {
    const { error } = await admin.auth.admin.updateUserById(found.id, {
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: displayName },
    });
    if (error) throw new Error(`updateUser ${email}: ${error.message}`);
    return found.id;
  }

  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: displayName },
  });
  if (error || !created?.user) throw new Error(`createUser ${email}: ${error?.message ?? "falhou"}`);
  return created.user.id;
}

async function habitColumns() {
  const { data, error } = await admin.from("habits").select("*").limit(1);
  if (error) return new Set();
  return new Set(Object.keys(data?.[0] ?? {}));
}

const now = new Date().toISOString();
const company = await ensureCompany();
const team = await ensureTeam(company.id);
const habitCols = await habitColumns();

const created = [];

for (const person of PEOPLE) {
  const id = await ensureUser(person);

  const { error: profileError } = await admin.from("profiles").upsert({
    id,
    email: person.email,
    display_name: person.displayName,
    role: "companion",
    company_id: company.id,
    team_id: team.id,
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
  if (profileError) throw new Error(`profile ${person.email}: ${profileError.message}`);

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
  if (checkinError) throw new Error(`checkins ${person.email}: ${checkinError.message}`);

  const habitPayload = { user_id: id, water_ml: person.waterBase, sleep_quality: Math.round((person.sleepBase / 12) * 100) };
  if (habitCols.has("date")) habitPayload.date = isoDate(0);
  if (habitCols.has("mood")) habitPayload.mood = person.moods[0];
  if (habitCols.has("movement_minutes")) habitPayload.movement_minutes = person.movement;
  if (habitCols.has("energy_level")) habitPayload.energy_level = person.energy;
  if (habitCols.has("meals")) habitPayload.meals = person.meals;
  const { error: habitError } = await admin.from("habits").insert(habitPayload);
  if (habitError) throw new Error(`habits ${person.email}: ${habitError.message}`);

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
  if (planError) throw new Error(`plan ${person.email}: ${planError.message}`);

  const checks = [];
  for (let daysAgo = HISTORY_DAYS - 1; daysAgo >= 0; daysAgo--) {
    checks.push({
      user_id: id,
      plan_id: plan.id,
      date: isoDate(daysAgo),
      water_done: person.waterBase >= 1500 || daysAgo % 2 === 0,
      walk_done: person.movement >= 20 && daysAgo !== 2,
      breathe_done: person.goal === "reduzir-ansiedade" || daysAgo % 3 === 0,
      talk_done: daysAgo === 0 || daysAgo === 4,
      notes: daysAgo === 0 ? "Check-in do dia feito." : "",
    });
  }
  const { error: clError } = await admin.from("wellness_checklist").insert(checks);
  if (clError) throw new Error(`checklist ${person.email}: ${clError.message}`);

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
  if (diaryError) throw new Error(`diary ${person.email}: ${diaryError.message}`);

  created.push({
    nome: person.displayName,
    email: person.email,
    senha: person.password,
    avatar: person.avatar,
    objetivo: person.goal,
    checkins: checkins.length,
  });
}

console.log(
  JSON.stringify(
    {
      empresa: company.name,
      equipe: team.name,
      colaboradores: created,
    },
    null,
    2,
  ),
);
