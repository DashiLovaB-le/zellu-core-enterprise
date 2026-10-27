#!/usr/bin/env node
// Popula a "Empresa Demo Zellu" com colaboradores fictícios e ~60 dias de check-ins
// que imitam uso real (adesão variável, fim de semana, fechamento de mês, equipe em queda).
//
//   node scripts/seed-demo-colaboradores.mjs          cria / recria os dados
//   node scripts/seed-demo-colaboradores.mjs --limpar remove tudo o que o script criou
//
// Tudo que o script cria usa o domínio @demo.zellu.app e equipes marcadas com SEED_TAG.

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const COMPANY_ID = "3748ec42-bfde-4b72-814b-d1fd51e3e5a0"; // Empresa Demo Zellu
const EMAIL_DOMAIN = "demo.zellu.app";
const SEED_TAG = "Equipe de demonstração (gerada por script)";
const DAYS = 60;
const PRIVACY_CONSENT_VERSION = "3.0";

const env = Object.fromEntries(
  readFileSync(resolve(process.cwd(), ".env"), "utf8")
    .split(/\r?\n/)
    .map((l) => l.match(/^\s*([A-Z0-9_]+)=(.*)$/))
    .filter(Boolean)
    .map((m) => [m[1], m[2].trim()]),
);
const BASE = env.SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!BASE || !KEY) throw new Error("SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY precisam estar no .env");

const headers = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };

async function api(path, { method = "GET", body, prefer } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: prefer ? { ...headers, Prefer: prefer } : headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const err = new Error(`${method} ${path} -> ${res.status}: ${text}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

// ---------- aleatoriedade reprodutível ----------
let rngState = 20261014;
function rand() {
  rngState |= 0;
  rngState = (rngState + 0x6d2b79f5) | 0;
  let t = Math.imul(rngState ^ (rngState >>> 15), 1 | rngState);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const gauss = () => Math.sqrt(-2 * Math.log(rand() || 1e-9)) * Math.cos(2 * Math.PI * rand());
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
function weighted(items) {
  const total = items.reduce((s, [, w]) => s + w, 0);
  let r = rand() * total;
  for (const [v, w] of items) if ((r -= w) <= 0) return v;
  return items[items.length - 1][0];
}

// ---------- equipes e pessoas ----------
// moodAt(daysAgo, localDate) devolve o humor médio esperado da equipe naquele dia (escala 1–6).
const TEAMS = [
  {
    name: "Produto",
    sleep: 7.1,
    moodAt: () => 5.0,
    people: [
      ["Larissa Mendes", "Product Manager"], ["Rafael Oliveira", "Desenvolvedor Front-end"],
      ["Juliana Prado", "UX Designer"], ["Thiago Almeida", "Desenvolvedor Back-end"],
      ["Beatriz Cardoso", "QA Analyst"], ["Lucas Ferreira", "Tech Lead"],
      ["Mariana Lopes", "Product Designer"], ["Pedro Henrique Souza", "Desenvolvedor Mobile"],
      ["Isabela Ramos", "Analista de Dados"],
    ],
    optOut: [8],
  },
  {
    name: "Comercial",
    sleep: 6.8,
    // pressão de meta no fim do mês
    moodAt: (_d, date) => (date.getUTCDate() >= 22 ? 3.7 : 4.6),
    people: [
      ["Fernanda Costa", "Executiva de Contas"], ["Gustavo Ribeiro", "SDR"],
      ["Aline Barbosa", "Executiva de Contas"], ["Rodrigo Teixeira", "Gerente Comercial"],
      ["Patrícia Gomes", "SDR"], ["Vinícius Martins", "Customer Success"],
      ["Carolina Dias", "Analista de Pré-vendas"], ["André Moreira", "Executivo de Contas"],
    ],
    optOut: [7],
  },
  {
    name: "Atendimento",
    sleep: 6.6,
    // equipe em queda nas últimas semanas: é o caso de alerta precoce
    moodAt: (d) => (d > 35 ? 4.6 : 2.6 + (2.0 * d) / 35),
    people: [
      ["Camila Freitas", "Analista de Suporte"], ["Felipe Araújo", "Analista de Suporte"],
      ["Renata Carvalho", "Coordenadora de Atendimento"], ["Eduardo Pinto", "Atendente N1"],
      ["Natália Rocha", "Atendente N1"], ["Marcelo Santos", "Atendente N2"],
      ["Tatiane Lima", "Analista de Qualidade"], ["Daniel Correia", "Atendente N1"],
      ["Priscila Azevedo", "Atendente N2"], ["Leonardo Castro", "Analista de Suporte"],
    ],
    optOut: [7, 9],
  },
  {
    name: "Operações",
    sleep: 6.0, // turnos: sono é o ponto de atenção
    moodAt: () => 4.5,
    people: [
      ["Simone Nascimento", "Supervisora de Operações"], ["Ricardo Batista", "Analista de Logística"],
      ["Cláudia Monteiro", "Analista de Processos"], ["Fábio Cunha", "Operador"],
      ["Viviane Duarte", "Operadora"], ["Henrique Vieira", "Analista de Logística"],
      ["Sandra Moura", "Operadora"],
    ],
    optOut: [6],
  },
  {
    name: "Financeiro",
    sleep: 7.0,
    // pequena queda no fechamento (primeiros dias do mês)
    moodAt: (_d, date) => (date.getUTCDate() <= 5 ? 4.3 : 5.0),
    people: [
      ["Roberta Fonseca", "Controller"], ["Marcos Pereira", "Analista Financeiro"],
      ["Luciana Barros", "Analista Contábil"], ["Paulo Machado", "Analista de Contas a Pagar"],
      ["Débora Reis", "Analista Fiscal"], ["Alexandre Nogueira", "Gerente Financeiro"],
    ],
    optOut: [],
  },
];

const MOODS_BY_SCORE = {
  1: [["irritado", 4], ["bravo", 1]],
  2: [["triste", 4], ["desanimado", 1], ["inseguro", 1], ["carente", 1]],
  3: [["ansioso", 4], ["preocupado", 1], ["sobrecarregado", 1], ["confuso", 1]],
  4: [["neutro", 4], ["cansado", 1], ["pensativo", 1]],
  5: [["calmo", 4], ["focado", 1], ["sereno", 1], ["acolhido", 1]],
  6: [["feliz", 4], ["animado", 1], ["grato", 1], ["motivado", 1], ["contente", 1]],
};

// mesmas faixas de getSleepLabel em src/data/habitos.ts
function sleepLabel(hours) {
  const v = (hours / 12) * 100;
  if (v < 25) return "Cansado";
  if (v < 50) return "Moderado";
  if (v < 75) return "Revigorante";
  return "Descansado";
}

const slug = (s) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.|\.$/g, "");

// Brasil sem horário de verão: São Paulo = UTC-3
const SP_OFFSET_H = 3;
function spMidnightUtc(daysAgo) {
  const nowSp = new Date(Date.now() - SP_OFFSET_H * 3600e3);
  return new Date(Date.UTC(nowSp.getUTCFullYear(), nowSp.getUTCMonth(), nowSp.getUTCDate() - daysAgo, SP_OFFSET_H));
}

function engagementProfile() {
  return weighted([
    [{ kind: "regular", weekday: 0.85, weekend: 0.3 }, 55],
    [{ kind: "moderado", weekday: 0.55, weekend: 0.15 }, 25],
    [{ kind: "baixo", weekday: 0.25, weekend: 0.05 }, 12],
    [{ kind: "abandonou", weekday: 0.7, weekend: 0.2, stopsAfter: 18 + Math.floor(rand() * 15) }, 4],
    [{ kind: "chegou depois", weekday: 0.8, weekend: 0.25, startsAt: 15 + Math.floor(rand() * 15) }, 4],
  ]);
}

function generateCheckins(userId, team) {
  const eng = engagementProfile();
  const moodBias = gauss() * 0.4;
  const sleepBias = gauss() * 0.5;
  const waterBase = 1200 + Math.floor(rand() * 1000);
  const rows = [];
  const now = Date.now();
  for (let d = DAYS - 1; d >= 0; d--) {
    if (eng.startsAt !== undefined && d > eng.startsAt) continue;
    if (eng.stopsAfter !== undefined && d < eng.stopsAfter) continue;
    const midnight = spMidnightUtc(d);
    const localDate = new Date(midnight.getTime() - SP_OFFSET_H * 3600e3);
    const dow = localDate.getUTCDay();
    const weekend = dow === 0 || dow === 6;
    if (rand() > (weekend ? eng.weekend : eng.weekday)) continue;

    const weekdayEffect = dow === 1 ? -0.3 : dow === 5 ? 0.3 : 0;
    const x = team.moodAt(d, localDate) + moodBias + weekdayEffect + gauss() * 0.85;
    const score = clamp(Math.round(x), 1, 6);
    const mood = weighted(MOODS_BY_SCORE[score]);

    const sleepRaw = team.sleep + sleepBias - Math.max(0, 4 - score) * 0.25 + (weekend ? 0.6 : 0) + gauss() * 0.7;
    const sleep = clamp(Math.round(sleepRaw * 2) / 2, 3.5, 10);
    const water = clamp(Math.round((waterBase + gauss() * 400) / 250) * 250, 250, 3500);

    const slot = weighted([[[7.5, 10.5], 60], [[12, 14], 25], [[19, 22], 15]]);
    const hour = slot[0] + rand() * (slot[1] - slot[0]);
    const created = new Date(midnight.getTime() + hour * 3600e3);
    if (created.getTime() > now) continue;

    rows.push({
      user_id: userId,
      sleep_hours: sleep,
      sleep_label: sleepLabel(sleep),
      water_ml: water,
      mood,
      created_at: created.toISOString(),
    });
  }
  return { rows, eng };
}

// ---------- operações no banco ----------
async function getCompany() {
  const rows = await api(`/rest/v1/companies?select=id,name,seats&id=eq.${COMPANY_ID}`);
  if (!rows?.length) throw new Error(`Empresa ${COMPANY_ID} não encontrada`);
  return rows[0];
}

async function seedProfiles() {
  return api(`/rest/v1/profiles?select=id,email&email=like.*%40${EMAIL_DOMAIN}`);
}

async function limpar() {
  const company = await getCompany();
  const profiles = await seedProfiles();
  for (const p of profiles) {
    await api(`/auth/v1/admin/users/${p.id}`, { method: "DELETE" });
  }
  const teams = await api(
    `/rest/v1/teams?company_id=eq.${company.id}&description=eq.${encodeURIComponent(SEED_TAG)}`,
    { method: "DELETE", prefer: "return=representation" },
  );
  console.log(`Removidos ${profiles.length} colaboradores de demonstração e ${teams.length} equipes.`);
}

async function ensureUser(name) {
  const email = `${slug(name)}@${EMAIL_DOMAIN}`;
  try {
    const user = await api("/auth/v1/admin/users", {
      method: "POST",
      body: {
        email,
        password: `Demo-${Math.floor(rand() * 1e12).toString(36)}-Zellu!`,
        email_confirm: true,
        user_metadata: { display_name: name, seed: "demo-zellu" },
      },
    });
    return { id: user.id, email };
  } catch (e) {
    if (e.status !== 422) throw e;
    const rows = await api(`/rest/v1/profiles?select=id&email=eq.${encodeURIComponent(email)}`);
    if (!rows?.length) throw e;
    return { id: rows[0].id, email };
  }
}

async function seed() {
  const company = await getCompany();
  const total = TEAMS.reduce((s, t) => s + t.people.length, 0);
  const existing = await api(`/rest/v1/profiles?select=id,email&company_id=eq.${company.id}`);
  const nonSeed = existing.filter((p) => !p.email?.endsWith(`@${EMAIL_DOMAIN}`)).length;
  if (nonSeed + total > company.seats) {
    throw new Error(`Faltam licenças: ${nonSeed} já usadas + ${total} novas > ${company.seats}`);
  }

  const teams = await api("/rest/v1/teams?on_conflict=company_id,name", {
    method: "POST",
    prefer: "resolution=merge-duplicates,return=representation",
    body: TEAMS.map((t) => ({ company_id: company.id, name: t.name, description: SEED_TAG })),
  });
  const teamId = Object.fromEntries(teams.map((t) => [t.name, t.id]));

  const allCheckins = [];
  const habits = [];
  const summary = [];

  for (const team of TEAMS) {
    for (const [i, [name, job]] of team.people.entries()) {
      const user = await ensureUser(name);
      const joinedDaysAgo = DAYS + 5 + Math.floor(rand() * 20);
      const joined = spMidnightUtc(joinedDaysAgo);
      const optIn = !team.optOut.includes(i);

      await api(`/rest/v1/profiles?id=eq.${user.id}`, {
        method: "PATCH",
        body: {
          display_name: name,
          role: "companion",
          company_id: company.id,
          team_id: teamId[team.name],
          job_title: job,
          is_active: true,
          timezone: "America/Sao_Paulo",
          privacy_consent_at: joined.toISOString(),
          privacy_consent_version: PRIVACY_CONSENT_VERSION,
          privacy_rh_opt_in: optIn,
          privacy_ai_opt_in: rand() < 0.7,
          privacy_email_opt_in: false,
          adult_confirmed_at: joined.toISOString(),
          onboarding_completed_at: joined.toISOString(),
          product_tour_completed_at: joined.toISOString(),
          created_at: joined.toISOString(),
        },
      });

      const { rows, eng } = generateCheckins(user.id, team);
      allCheckins.push(...rows);
      const last = rows[rows.length - 1];
      if (last) {
        habits.push({
          user_id: user.id,
          water_ml: last.water_ml,
          sleep_quality: Math.round(clamp((last.sleep_hours / 12) * 100, 0, 100)),
        });
      }
      summary.push({ equipe: team.name, nome: name, compartilhaComRH: optIn, perfil: eng.kind, checkins: rows.length });
    }
  }

  const ids = [...new Set(allCheckins.map((c) => c.user_id))];
  const seededIds = (await seedProfiles()).map((p) => p.id);
  for (let i = 0; i < seededIds.length; i += 50) {
    const chunk = seededIds.slice(i, i + 50).join(",");
    await api(`/rest/v1/checkins?user_id=in.(${chunk})`, { method: "DELETE" });
    await api(`/rest/v1/habits?user_id=in.(${chunk})`, { method: "DELETE" });
  }
  for (let i = 0; i < allCheckins.length; i += 500) {
    await api("/rest/v1/checkins", { method: "POST", body: allCheckins.slice(i, i + 500), prefer: "return=minimal" });
  }
  if (habits.length) {
    await api("/rest/v1/habits", { method: "POST", body: habits, prefer: "return=minimal" });
  }

  console.table(summary);
  const byKind = summary.reduce((acc, s) => ((acc[s.perfil] = (acc[s.perfil] ?? 0) + 1), acc), {});
  console.log(`\n${summary.length} colaboradores em ${TEAMS.length} equipes, ${allCheckins.length} check-ins em ${DAYS} dias.`);
  console.log(`Usuários com check-in: ${ids.length}. Perfis de uso:`, byKind);
}

const run = process.argv.includes("--limpar") ? limpar : seed;
run().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
