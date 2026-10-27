#!/usr/bin/env node
// Completa os check-ins da Empresa Demo Zellu com a resposta do fator de trabalho daquele dia.
// Rodar depois de seed-uso-mes.mjs. Só cria resposta para check-in que ainda não tem.
//
//   node scripts/seed-fatores-trabalho.mjs            últimos 35 dias, grava no banco
//   node scripts/seed-fatores-trabalho.mjs --dry      só mostra o que seria criado
//   node scripts/seed-fatores-trabalho.mjs --limpar   remove o que este script criou (via manifesto)
//
// Os IDs criados ficam em scripts/.seed-fatores-trabalho/manifesto.json.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";

const COMPANY_ID = "3748ec42-bfde-4b72-814b-d1fd51e3e5a0"; // Empresa Demo Zellu
const SP_OFFSET_H = 3; // Brasil sem horário de verão: São Paulo = UTC-3
const WINDOW_DAYS = 35;
const K_MIN = 5;

const env = Object.fromEntries(
  readFileSync(resolve(process.cwd(), ".env"), "utf8")
    .split(/\r?\n/)
    .map((l) => l.match(/^\s*([A-Z0-9_]+)=(.*)$/))
    .filter(Boolean)
    .map((m) => [m[1], m[2].trim()]),
);
const BASE = env.SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!BASE || !KEY)
  throw new Error("SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY precisam estar no .env");
const headers = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };

async function api(path, { method = "GET", body, prefer, range } = {}) {
  const h = { ...headers };
  if (prefer) h.Prefer = prefer;
  if (range) h.Range = range;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: h,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status}: ${text}`);
  return text ? JSON.parse(text) : null;
}

async function getAll(path) {
  const out = [];
  for (let from = 0; ; from += 1000) {
    const page = await api(path, { range: `${from}-${from + 999}` });
    out.push(...page);
    if (page.length < 1000) return out;
  }
}

// ---------- fator do dia: mesma regra de src/lib/work-factors.ts e do banco ----------
const FACTORS = ["carga", "autonomia", "apoio", "relacoes"];
const spDateOf = (iso) =>
  new Date(new Date(iso).getTime() - SP_OFFSET_H * 3600e3).toISOString().slice(0, 10);
function factorForDay(dayKey) {
  const [y, m, d] = dayKey.split("-").map(Number);
  const index = Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
  return FACTORS[((index % 4) + 4) % 4];
}

// ---------- aleatoriedade reprodutível ----------
let rngState = 20261027;
function rand() {
  rngState |= 0;
  rngState = (rngState + 0x6d2b79f5) | 0;
  let t = Math.imul(rngState ^ (rngState >>> 15), 1 | rngState);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const gauss = () => Math.sqrt(-2 * Math.log(rand() || 1e-9)) * Math.cos(2 * Math.PI * rand());
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// ---------- média esperada (1–5) por equipe e fator; dia = dia do mês ----------
// Coerente com a história de seed-uso-mes.mjs: Atendimento sobrecarregado até o RH agir (dia 20),
// Comercial com pressão de meta no fim do mês, Financeiro com fechamento no início.
const TEAM_FACTORS = {
  Produto: {
    carga: (day) => (day >= 19 && day <= 22 ? 3.0 : 3.7),
    autonomia: () => 4.3,
    apoio: () => 4.2,
    relacoes: () => 4.4,
  },
  Comercial: {
    carga: (day) => (day >= 22 ? 2.6 : 3.4),
    autonomia: () => 3.6,
    apoio: (day) => (day >= 22 ? 3.1 : 3.6),
    relacoes: () => 4.0,
  },
  Atendimento: {
    carga: (day) => (day < 20 ? 2.2 : 3.3),
    autonomia: () => 2.8,
    apoio: (day) => (day < 20 ? 2.6 : 3.9),
    relacoes: () => 3.3,
  },
  Operações: {
    carga: () => 3.5,
    autonomia: () => 3.1,
    apoio: () => 3.9,
    relacoes: () => 4.1,
  },
  Financeiro: {
    carga: (day) => (day <= 5 ? 2.9 : 3.9),
    autonomia: () => 4.0,
    apoio: () => 4.1,
    relacoes: () => 4.3,
  },
};
const DEFAULT_FACTOR = () => 3.8;

const MOOD_SCORE = {
  irritado: 1,
  bravo: 1,
  triste: 2,
  desanimado: 2,
  inseguro: 2,
  carente: 2,
  ansioso: 3,
  preocupado: 3,
  sobrecarregado: 3,
  confuso: 3,
  neutro: 4,
  cansado: 4,
  pensativo: 4,
  calmo: 5,
  focado: 5,
  sereno: 5,
  acolhido: 5,
  feliz: 6,
  animado: 6,
  grato: 6,
  motivado: 6,
  contente: 6,
  esperancoso: 6,
  entusiasmado: 6,
  orgulhoso: 6,
};

// ---------- execução ----------
const manifestDir = resolve(process.cwd(), "scripts/.seed-fatores-trabalho");
const manifestPath = resolve(manifestDir, "manifesto.json");

async function limpar() {
  if (!existsSync(manifestPath)) throw new Error(`Manifesto não encontrado: ${manifestPath}`);
  const m = JSON.parse(readFileSync(manifestPath, "utf8"));
  const ids = m.work_factor_responses ?? [];
  for (let i = 0; i < ids.length; i += 100) {
    await api(`/rest/v1/work_factor_responses?id=in.(${ids.slice(i, i + 100).join(",")})`, {
      method: "DELETE",
    });
  }
  console.log(`work_factor_responses: ${ids.length} removidos`);
  writeFileSync(
    manifestPath,
    JSON.stringify(
      { ...m, work_factor_responses: [], removidoEm: new Date().toISOString() },
      null,
      1,
    ),
  );
}

async function seed(dry) {
  const profiles = await getAll(
    `/rest/v1/profiles?select=id,team_id,privacy_rh_opt_in&company_id=eq.${COMPANY_ID}&role=eq.companion&is_active=eq.true`,
  );
  const teams = await getAll(`/rest/v1/teams?select=id,name&company_id=eq.${COMPANY_ID}`);
  const teamName = Object.fromEntries(teams.map((t) => [t.id, t.name]));
  const teamOf = Object.fromEntries(
    profiles.map((p) => [p.id, teamName[p.team_id] ?? "Sem equipe"]),
  );
  const optedIn = new Set(profiles.filter((p) => p.privacy_rh_opt_in).map((p) => p.id));
  const ids = profiles.map((p) => p.id);
  const since = new Date(Date.now() - WINDOW_DAYS * 86_400_000).toISOString();
  const inIds = (chunk) => `user_id=in.(${chunk.join(",")})`;

  const checkins = [];
  const answered = new Set();
  for (let i = 0; i < ids.length; i += 50) {
    const c = ids.slice(i, i + 50);
    checkins.push(
      ...(await getAll(
        `/rest/v1/checkins?select=id,user_id,mood,created_at&${inIds(c)}&created_at=gte.${since}&order=created_at.desc`,
      )),
    );
    for (const r of await getAll(
      `/rest/v1/work_factor_responses?select=user_id,answered_on&${inIds(c)}&answered_on=gte.${spDateOf(since)}`,
    )) {
      answered.add(`${r.user_id}|${r.answered_on}`);
    }
  }

  const bias = Object.fromEntries(ids.map((id) => [id, gauss() * 0.35]));
  const rows = [];
  for (const c of checkins) {
    const day = spDateOf(c.created_at);
    const key = `${c.user_id}|${day}`;
    if (answered.has(key)) continue;
    answered.add(key);
    const factor = factorForDay(day);
    const curve = TEAM_FACTORS[teamOf[c.user_id]]?.[factor] ?? DEFAULT_FACTOR;
    const moodEffect = ((MOOD_SCORE[c.mood] ?? 4) - 4) * 0.25;
    const score = clamp(
      Math.round(curve(Number(day.slice(8, 10))) + moodEffect + bias[c.user_id] + gauss() * 0.6),
      1,
      5,
    );
    rows.push({
      id: randomUUID(),
      user_id: c.user_id,
      checkin_id: c.id,
      factor_id: factor,
      score,
      answered_on: day,
      created_at: c.created_at,
    });
  }

  // prévia do que o RH verá nos últimos 28 dias (só quem autorizou)
  const cutoff = spDateOf(new Date(Date.now() - 27 * 86_400_000).toISOString());
  const preview = {};
  for (const r of rows) {
    if (!optedIn.has(r.user_id) || r.answered_on < cutoff) continue;
    const team = teamOf[r.user_id];
    preview[team] ??= Object.fromEntries(
      FACTORS.map((f) => [f, { users: new Set(), sum: 0, n: 0 }]),
    );
    const cell = preview[team][r.factor_id];
    cell.users.add(r.user_id);
    cell.sum += r.score;
    cell.n += 1;
  }
  const table = Object.entries(preview).map(([team, byFactor]) => ({
    equipe: team,
    ...Object.fromEntries(
      FACTORS.map((f) => {
        const cell = byFactor[f];
        return [
          f,
          cell.users.size >= K_MIN
            ? `${(cell.sum / cell.n).toFixed(1)} (${cell.users.size}p)`
            : `oculto (${cell.users.size}p)`,
        ];
      }),
    ),
  }));

  console.log(
    `${checkins.length} check-ins nos últimos ${WINDOW_DAYS} dias. ${rows.length} respostas novas.`,
  );
  console.log("Prévia do painel do RH (novas respostas, 28 dias, só quem autorizou):");
  console.table(table);
  if (dry) return console.log("--dry: nada foi gravado.");

  for (let i = 0; i < rows.length; i += 500) {
    await api("/rest/v1/work_factor_responses", {
      method: "POST",
      body: rows.slice(i, i + 500),
      prefer: "return=minimal",
    });
  }
  console.log(`work_factor_responses: ${rows.length} inseridos`);

  mkdirSync(manifestDir, { recursive: true });
  const prev = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, "utf8")) : {};
  const manifest = {
    geradoEm: new Date().toISOString(),
    work_factor_responses: [
      ...(prev.removidoEm ? [] : (prev.work_factor_responses ?? [])),
      ...rows.map((r) => r.id),
    ],
  };
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 1));
  console.log(`Manifesto: ${manifestPath}`);
}

const run = process.argv.includes("--limpar") ? limpar : () => seed(process.argv.includes("--dry"));
run().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
