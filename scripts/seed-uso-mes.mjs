#!/usr/bin/env node
// Simula um mês de uso real para todos os colaboradores (role companion) da Empresa Demo Zellu:
// check-ins, hábitos, diário, conversas com o companion e checklist do plano de cuidado.
// Complementa scripts/seed-demo-colaboradores.mjs: não duplica dia que já tem check-in/hábito/checklist
// e mantém o ritmo de adesão que cada pessoa já vinha tendo no mês.
//
//   node scripts/seed-uso-mes.mjs                 mês corrente (até agora), grava no banco
//   node scripts/seed-uso-mes.mjs --mes=2026-10   mês específico
//   node scripts/seed-uso-mes.mjs --dry           só mostra o que seria criado
//   node scripts/seed-uso-mes.mjs --limpar        remove o que este script criou no mês (via manifesto)
//
// Os IDs criados ficam em scripts/.seed-uso-mes/<mes>.json — é o que permite desfazer.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";

const COMPANY_ID = "3748ec42-bfde-4b72-814b-d1fd51e3e5a0"; // Empresa Demo Zellu
const SP_OFFSET_H = 3; // Brasil sem horário de verão: São Paulo = UTC-3

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

async function api(path, { method = "GET", body, prefer, range } = {}) {
  const h = { ...headers };
  if (prefer) h.Prefer = prefer;
  if (range) h.Range = range;
  const res = await fetch(`${BASE}${path}`, { method, headers: h, body: body === undefined ? undefined : JSON.stringify(body) });
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

async function insertAll(table, rows) {
  for (let i = 0; i < rows.length; i += 500) {
    await api(`/rest/v1/${table}`, { method: "POST", body: rows.slice(i, i + 500), prefer: "return=minimal" });
  }
}

async function deleteIds(table, ids) {
  for (let i = 0; i < ids.length; i += 100) {
    await api(`/rest/v1/${table}?id=in.(${ids.slice(i, i + 100).join(",")})`, { method: "DELETE" });
  }
}

// ---------- datas (São Paulo) ----------
const nowMs = Date.now();
const nowSp = new Date(nowMs - SP_OFFSET_H * 3600e3);
const mesArg = process.argv.find((a) => a.startsWith("--mes="))?.slice(6);
const [YEAR, MONTH] = (mesArg ?? `${nowSp.getUTCFullYear()}-${String(nowSp.getUTCMonth() + 1).padStart(2, "0")}`)
  .split("-")
  .map(Number);
const MES = `${YEAR}-${String(MONTH).padStart(2, "0")}`;
const daysInMonth = new Date(Date.UTC(YEAR, MONTH, 0)).getUTCDate();
const isCurrentMonth = nowSp.getUTCFullYear() === YEAR && nowSp.getUTCMonth() + 1 === MONTH;
const LAST_DAY = isCurrentMonth ? nowSp.getUTCDate() : daysInMonth;

const spMidnight = (day) => Date.UTC(YEAR, MONTH - 1, day, SP_OFFSET_H);
const isoDate = (day) => `${MES}-${String(day).padStart(2, "0")}`;
const spDateOf = (iso) => new Date(new Date(iso).getTime() - SP_OFFSET_H * 3600e3).toISOString().slice(0, 10);
const dowOf = (day) => new Date(Date.UTC(YEAR, MONTH - 1, day)).getUTCDay();
const at = (day, hour) => spMidnight(day) + hour * 3600e3;
const MONTH_START_ISO = new Date(spMidnight(1)).toISOString();
const MONTH_END_ISO = new Date(spMidnight(daysInMonth + 1)).toISOString();

// ---------- aleatoriedade reprodutível ----------
let rngState = YEAR * 100 + MONTH;
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
const chance = (p) => rand() < p;
function weighted(items) {
  const total = items.reduce((s, [, w]) => s + w, 0);
  let r = rand() * total;
  for (const [v, w] of items) if ((r -= w) <= 0) return v;
  return items[items.length - 1][0];
}
function sample(arr, n) {
  const copy = [...arr];
  const out = [];
  while (out.length < n && copy.length) out.push(copy.splice(Math.floor(rand() * copy.length), 1)[0]);
  return out;
}

// ---------- equipes: humor médio esperado (1–6) e sono base ----------
const TEAM_PROFILE = {
  Produto: { sleep: 7.1, moodAt: (day) => (day >= 19 && day <= 22 ? 4.6 : 5.0) }, // entrega de release
  Comercial: { sleep: 6.8, moodAt: (day) => (day >= 22 ? 3.7 : 4.6) }, // pressão de meta no fim do mês
  // vinha em queda; atinge o fundo por volta do dia 15 e se recupera depois que o RH age (dia 20)
  Atendimento: { sleep: 6.6, moodAt: (day) => (day <= 14 ? 3.35 - (0.75 * (day - 1)) / 13 : day < 20 ? 2.65 : 2.65 + (1.25 * (day - 20)) / 10) },
  Operações: { sleep: 6.0, moodAt: () => 4.5 },
  Financeiro: { sleep: 7.0, moodAt: (day) => (day <= 5 ? 4.3 : 5.0) }, // fechamento
};
const DEFAULT_TEAM = { sleep: 6.9, moodAt: () => 4.7 };

const MOODS_BY_SCORE = {
  1: [["irritado", 4], ["bravo", 1]],
  2: [["triste", 4], ["desanimado", 1], ["inseguro", 1], ["carente", 1]],
  3: [["ansioso", 4], ["preocupado", 1], ["sobrecarregado", 1], ["confuso", 1]],
  4: [["neutro", 4], ["cansado", 1], ["pensativo", 1]],
  5: [["calmo", 4], ["focado", 1], ["sereno", 1], ["acolhido", 1]],
  6: [["feliz", 4], ["animado", 1], ["grato", 1], ["motivado", 1], ["contente", 1]],
};
const MOOD_SCORE = Object.fromEntries(Object.entries(MOODS_BY_SCORE).flatMap(([s, list]) => list.map(([m]) => [m, Number(s)])));

// mesmas faixas de getSleepLabel em src/data/habitos.ts
function sleepLabel(hours) {
  const v = (hours / 12) * 100;
  if (v < 25) return "Cansado";
  if (v < 50) return "Moderado";
  if (v < 75) return "Revigorante";
  return "Descansado";
}

// ---------- textos ----------
const DIARY = {
  baixo: [
    "Dia pesado. Tudo pareceu urgente e eu não consegui fechar quase nada.",
    "Acordei cansado e fui me arrastando até o fim do expediente.",
    "Fiquei remoendo uma conversa difícil da manhã. Preciso deixar isso ir.",
    "Hoje não foi um bom dia. Vou tentar dormir mais cedo e recomeçar amanhã.",
    "Senti que não dei conta de tudo. Anotei o que ficou para não esquecer.",
    "Muita cobrança e pouca pausa. Quase não almocei direito.",
  ],
  medio: [
    "Muitos prazos juntos. Fiz uma lista e isso ajudou a respirar um pouco.",
    "A cabeça ficou acelerada à tarde. A respiração guiada deu uma acalmada.",
    "Semana corrida. Ainda estou tentando achar um ritmo que funcione.",
    "Fiquei preocupado com a entrega de amanhã, mas conversei com o time e dividimos as tarefas.",
    "Dormi pouco e senti o dia inteiro. Hoje vou desligar o celular mais cedo.",
    "Reunião atrás de reunião. Bloqueei meia hora na agenda para amanhã.",
  ],
  neutro: [
    "Dia normal. Nada de muito diferente, só o de sempre.",
    "Rotina tranquila. Consegui beber mais água do que ontem.",
    "Um pouco cansado, mas nada fora do comum.",
    "Fiquei pensando em como organizar melhor a semana que vem.",
    "Dia ok. Fiz uma caminhada curta depois do almoço.",
  ],
  bom: [
    "Consegui fechar o que estava pendente. Saí do trabalho mais leve.",
    "Dia produtivo e com tempo para almoçar com calma.",
    "Recebi um retorno bom sobre o meu trabalho. Fiquei feliz.",
    "Dormi bem e senti a diferença na disposição.",
    "Caminhei no fim da tarde e cheguei em casa bem mais tranquilo.",
    "Conversa boa com o time hoje. Senti que estamos alinhados.",
    "Mantive o plano de cuidado a semana toda. Pequenas coisas fazem diferença.",
  ],
};
const DIARY_TEAM = {
  Comercial: { baixo: ["Fim de mês e a meta ainda longe. A pressão está grande."], medio: ["Muitas ligações hoje. Fechei uma proposta, mas ainda falta bastante para a meta."], bom: ["Fechei um contrato importante hoje. Valeu o esforço da semana."] },
  Atendimento: { baixo: ["Fila enorme o dia todo. Atendi um cliente muito nervoso e fiquei mal depois."], medio: ["Volume alto de chamados de novo. Fiz pausas curtas entre os atendimentos."], bom: ["A fila diminuiu e a nova escala ajudou. Consegui respirar entre os atendimentos."] },
  Operações: { baixo: ["Turno puxado e dormi mal de novo. O sono está me derrubando."], medio: ["Troca de turno essa semana. O corpo ainda está se acostumando."], bom: ["Turno tranquilo hoje. Consegui dormir bem antes."] },
  Financeiro: { medio: ["Fechamento do mês. Muitas planilhas e conferências."], bom: ["Fechamento entregue no prazo. Alívio."] },
  Produto: { medio: ["Semana de release. Muitos ajustes de última hora."], bom: ["A entrega saiu e o time comemorou. Bom ver o trabalho no ar."] },
};
const diaryBucket = (score) => (score <= 2 ? "baixo" : score === 3 ? "medio" : score === 4 ? "neutro" : "bom");

const VOICE = {
  Chico: { open: ["Entendo.", "Obrigado por me contar.", "Faz sentido se sentir assim."], close: ["Estou por aqui se precisar.", "Um passo de cada vez, combinado?"] },
  Amora: { open: ["Que bom que você trouxe isso para cá.", "Imagino como deve ter sido.", "Acolho o que você está sentindo."], close: ["Seja gentil com você hoje.", "Você não precisa dar conta de tudo de uma vez."] },
  Pipoca: { open: ["Poxa, entendi!", "Bora cuidar disso juntos?", "Ei, que bom te ver por aqui!"], close: ["Você consegue, viu?", "Depois me conta como foi!"] },
  Zeca: { open: ["Certo, vamos por partes.", "Entendido.", "Ok, vamos organizar isso."], close: ["Foco no próximo passo.", "Revise isso amanhã cedo."] },
};
const CONVERSAS = [
  {
    tema: "sono",
    msgs: [
      ["user", ["Tenho dormido mal essa semana.", "Não consigo desligar a cabeça para dormir.", "Acordei várias vezes de madrugada."]],
      ["ai", ["Noites mal dormidas pesam no dia seguinte. Que tal reduzir telas meia hora antes de deitar e deixar o quarto mais escuro?"]],
      ["user", ["Vou tentar hoje.", "Faz sentido, fico no celular até tarde.", "Pode me lembrar disso amanhã?"]],
      ["ai", ["Combinado. Amanhã no check-in a gente vê como foi a noite."]],
    ],
  },
  {
    tema: "prazos",
    msgs: [
      ["user", ["Estou com muitos prazos ao mesmo tempo.", "Preciso organizar o dia, está tudo atrasado.", "Me sinto sobrecarregado com as entregas."]],
      ["ai", ["Vamos listar as três coisas mais importantes de hoje? O resto pode esperar um pouco."]],
      ["user", ["Relatório, reunião com o cliente e revisar a proposta.", "Acho que a apresentação é a mais urgente.", "Ok, fiz a lista."]],
      ["ai", ["Ótimo. Comece pela primeira e faça uma pausa curta entre elas. Já é um bom plano."]],
    ],
  },
  {
    tema: "respirar",
    msgs: [
      ["user", ["Vamos respirar", "Quero respirar com calma", "Bora respirar juntos?"]],
      ["ai", ["Vamos lá: inspire contando até quatro, segure um pouco e solte devagar. Repita algumas vezes no seu ritmo."]],
      ["user", ["Ajudou bastante.", "Fiz três vezes, estou mais calmo.", "Obrigado, precisava disso."]],
      ["ai", ["Que bom. Sempre que quiser, a respiração guiada está no menu Respiro."]],
    ],
  },
  {
    tema: "cansaco",
    msgs: [
      ["user", ["Estou muito cansado hoje.", "Sem energia nenhuma desde cedo.", "O dia mal começou e já estou exausto."]],
      ["ai", ["Cansaço acumulado é um sinal para desacelerar. Você conseguiu beber água e fazer alguma pausa hoje?"]],
      ["user", ["Quase nada de água.", "Ainda não parei nenhuma vez.", "Só tomei café."]],
      ["ai", ["Que tal começar por um copo de água agora e uma pausa de cinco minutos longe da tela?"]],
    ],
  },
  {
    tema: "dia-bom",
    msgs: [
      ["user", ["Hoje foi um dia bom!", "Consegui fechar tudo o que planejei.", "Recebi um elogio no trabalho hoje."]],
      ["ai", ["Que notícia boa! O que você acha que ajudou a deixar o dia assim?"]],
      ["user", ["Dormi bem e me organizei cedo.", "Acho que a pausa no almoço fez diferença.", "O time estava bem alinhado."]],
      ["ai", ["Vale guardar isso. Pode ser uma boa ideia repetir essa rotina amanhã."]],
    ],
  },
  {
    tema: "desabafo",
    msgs: [
      ["user", ["Preciso desabafar um pouco.", "Tive uma conversa difícil hoje.", "Fiquei chateado com uma situação no trabalho."]],
      ["ai", ["Estou aqui para ouvir. Quer me contar o que aconteceu?"]],
      ["user", ["Senti que meu esforço não foi reconhecido.", "Recebi uma crítica de um jeito ruim.", "Fiquei sozinho com um problema que era do time."]],
      ["ai", ["Isso pode doer mesmo. Seu sentimento é válido. Se fizer sentido, conversar com alguém de confiança no time pode ajudar."]],
    ],
  },
];
const themesForScore = (score) =>
  score <= 2 ? ["desabafo", "cansaco", "respirar"] : score === 3 ? ["prazos", "respirar", "sono", "cansaco"] : score === 4 ? ["sono", "cansaco", "prazos"] : ["dia-bom", "prazos", "sono"];

const MEALS_MAIN = ["Café da Manhã", "Almoço", "Lanche", "Jantar"];
const PLAN_GOALS = ["reduzir-ansiedade", "melhorar-sono", "aumentar-energia", "equilibrio-emocional", "autocuidado-rotina"];

// ---------- perfil de uso ----------
function engagementProfile() {
  return weighted([
    [{ kind: "regular", weekday: 0.85, weekend: 0.3 }, 55],
    [{ kind: "moderado", weekday: 0.55, weekend: 0.15 }, 30],
    [{ kind: "baixo", weekday: 0.25, weekend: 0.05 }, 15],
  ]);
}

function inferEngagement(existingDays, hadHistoryBefore, observedUntil, isSeedUser) {
  let wd = 0, we = 0, wdHit = 0, weHit = 0;
  for (let d = 1; d <= observedUntil; d++) {
    const weekend = [0, 6].includes(dowOf(d));
    if (weekend) { we++; if (existingDays.has(isoDate(d))) weHit++; } else { wd++; if (existingDays.has(isoDate(d))) wdHit++; }
  }
  if (existingDays.size >= 3 && wd > 0) {
    const weekday = clamp(wdHit / wd, 0.15, 0.95);
    const weekend = clamp(we ? weHit / we : weekday * 0.3, 0.03, 0.6);
    const kind = weekday >= 0.7 ? "regular" : weekday >= 0.4 ? "moderado" : "baixo";
    return { kind, weekday, weekend };
  }
  // colaborador de demonstração que tinha desistido: volta depois que o RH reforça o convite
  if (isSeedUser && hadHistoryBefore && existingDays.size === 0 && observedUntil >= 7) {
    return { kind: "voltou", weekday: 0.6, weekend: 0.15, startsAt: Math.min(LAST_DAY, 20 + Math.floor(rand() * 3)) };
  }
  return engagementProfile();
}

// ---------- geração ----------
function hourIn(slots) {
  const [a, b] = weighted(slots);
  return a + rand() * (b - a);
}

function buildForUser(p, team, ctx) {
  const tp = TEAM_PROFILE[team] ?? DEFAULT_TEAM;
  const companion = ["Amora", "Chico", "Pipoca", "Zeca"].includes(p.avatar_url) ? p.avatar_url : "Chico";
  const eng = inferEngagement(ctx.checkinDays, ctx.hadHistoryBefore, ctx.observedUntil, p.email?.endsWith("@demo.zellu.app"));
  const moodBias = ctx.avgScore != null ? clamp(ctx.avgScore - 4.5, -1, 1) * 0.5 + gauss() * 0.2 : gauss() * 0.4;
  const sleepBase = ctx.avgSleep ?? tp.sleep + gauss() * 0.5;
  const waterBase = ctx.avgWater ?? 1200 + Math.floor(rand() * 1000);
  const out = { checkins: [], habits: [], diary: [], chat: [], checklist: [], plan: null, eng, dayScores: {} };

  // check-ins
  for (let day = 1; day <= LAST_DAY; day++) {
    const date = isoDate(day);
    if (ctx.checkinDays.has(date)) {
      out.dayScores[day] = ctx.checkinScores[date] ?? 4;
      continue;
    }
    if (eng.startsAt !== undefined && day < eng.startsAt) continue;
    const dow = dowOf(day);
    const weekend = dow === 0 || dow === 6;
    if (!chance(weekend ? eng.weekend : eng.weekday)) continue;

    const weekdayEffect = dow === 1 ? -0.3 : dow === 5 ? 0.3 : 0;
    const score = clamp(Math.round(tp.moodAt(day) + moodBias + weekdayEffect + gauss() * 0.85), 1, 6);
    const mood = weighted(MOODS_BY_SCORE[score]);
    const sleep = clamp(Math.round((sleepBase - Math.max(0, 4 - score) * 0.25 + (weekend ? 0.6 : 0) + gauss() * 0.7) * 2) / 2, 3.5, 10);
    const water = clamp(Math.round((waterBase + gauss() * 400) / 250) * 250, 250, 3500);
    const created = at(day, hourIn([[[7.5, 10.5], 60], [[12, 14], 25], [[19, 22], 15]]));
    if (created > nowMs) continue;

    out.checkins.push({ id: randomUUID(), user_id: p.id, sleep_hours: sleep, sleep_label: sleepLabel(sleep), water_ml: water, mood, created_at: new Date(created).toISOString() });
    out.dayScores[day] = score;

    // hábitos do dia (quem faz check-in às vezes também registra hábitos)
    if (!ctx.habitDays.has(date) && chance(eng.kind === "regular" ? 0.55 : 0.3)) {
      const updated = Math.min(at(day, 18 + rand() * 4), nowMs);
      out.habits.push({
        id: randomUUID(),
        user_id: p.id,
        date,
        water_ml: clamp(water + Math.round((gauss() * 300) / 50) * 50, 0, 4000),
        sleep_quality: Math.round(clamp((sleep / 12) * 100, 0, 100)),
        mood,
        movement_minutes: Math.max(0, Math.round((team === "Operações" ? 45 : 20) + gauss() * 15 + (score - 4) * 5)),
        energy_level: Math.round(clamp(30 + score * 9 + gauss() * 8, 10, 95)),
        meals: [...sample(MEALS_MAIN, 2 + Math.floor(rand() * 3))],
        updated_at: new Date(updated).toISOString(),
      });
    }
  }

  const activeDays = Object.keys(out.dayScores).map(Number);
  if (activeDays.length === 0) return out;

  // diário: quem é mais engajado escreve mais; à noite
  const diaryRate = { regular: 0.2, moderado: 0.1, baixo: 0.05 }[eng.kind] ?? 0.08;
  for (const day of activeDays) {
    if (!chance(diaryRate)) continue;
    const created = at(day, 19.5 + rand() * 3.5);
    if (created > nowMs) continue;
    const score = out.dayScores[day];
    const bucket = diaryBucket(score);
    const pool = [...DIARY[bucket], ...(DIARY_TEAM[team]?.[bucket] ?? [])];
    const text = pick(pool);
    out.diary.push({ id: randomUUID(), user_id: p.id, content: text, mood: weighted(MOODS_BY_SCORE[score]), created_at: new Date(created).toISOString(), updated_at: new Date(created).toISOString() });
  }

  // conversas com o companion
  const nConv = { regular: [2, 5], moderado: [1, 3], baixo: [0, 1] }[eng.kind] ?? [0, 1];
  const convCount = nConv[0] + Math.floor(rand() * (nConv[1] - nConv[0] + 1));
  for (const day of sample(activeDays, convCount)) {
    const score = out.dayScores[day];
    const tema = pick(themesForScore(score));
    const conv = CONVERSAS.find((c) => c.tema === tema);
    let t = at(day, hourIn([[[9, 12], 35], [[13, 17], 35], [[19, 23], 30]]));
    if (t > nowMs - 20 * 60e3) continue;
    const voice = VOICE[companion];
    conv.msgs.forEach(([from, options], i) => {
      let text = pick(options);
      if (from === "ai" && i === 1) text = `${pick(voice.open)} ${text}`;
      if (from === "ai" && i === conv.msgs.length - 1) text = `${text} ${pick(voice.close)}`;
      out.chat.push({ id: randomUUID(), user_id: p.id, from, text, created_at: new Date(t).toISOString() });
      t += (from === "user" ? 8 + rand() * 20 : 40 + rand() * 150) * 1000;
    });
  }

  // plano de cuidado + checklist
  let plan = ctx.activePlan;
  if (!plan && chance(eng.kind === "regular" ? 0.4 : eng.kind === "moderado" ? 0.2 : 0.05)) {
    const startDay = clamp(2 + Math.floor(rand() * 10), 1, LAST_DAY);
    plan = { id: randomUUID(), user_id: p.id, goal: pick(PLAN_GOALS), custom_goal: "", start_date: isoDate(startDay), is_active: true, created_at: new Date(at(startDay, 12)).toISOString(), updated_at: new Date(at(startDay, 12)).toISOString() };
    out.plan = plan;
  }
  if (plan) {
    const startDay = plan.start_date.startsWith(MES) ? Number(plan.start_date.slice(8, 10)) : 1;
    for (let day = startDay; day <= LAST_DAY; day++) {
      const date = isoDate(day);
      if (ctx.checklistDays.has(date)) continue;
      if (!chance(out.dayScores[day] ? 0.75 : 0.15)) continue;
      const updated = Math.min(at(day, 20 + rand() * 2.5), nowMs);
      const row = {
        id: randomUUID(),
        user_id: p.id,
        plan_id: plan.id,
        date,
        water_done: chance(0.75),
        walk_done: chance(team === "Operações" ? 0.6 : 0.45),
        breathe_done: chance(0.55),
        talk_done: chance(0.35),
        notes: "",
        created_at: new Date(updated).toISOString(),
        updated_at: new Date(updated).toISOString(),
      };
      if (row.water_done || row.walk_done || row.breathe_done || row.talk_done) out.checklist.push(row);
    }
  }
  return out;
}

// ---------- execução ----------
const manifestDir = resolve(process.cwd(), "scripts/.seed-uso-mes");
const manifestPath = resolve(manifestDir, `${MES}.json`);

async function limpar() {
  if (!existsSync(manifestPath)) throw new Error(`Manifesto não encontrado: ${manifestPath}`);
  const m = JSON.parse(readFileSync(manifestPath, "utf8"));
  for (const t of ["wellness_checklist", "chat_messages", "diary_entries", "habits", "checkins", "wellness_plans"]) {
    const ids = m[t] ?? [];
    await deleteIds(t, ids);
    console.log(`${t}: ${ids.length} removidos`);
  }
  writeFileSync(manifestPath, JSON.stringify({ ...m, removidoEm: new Date().toISOString() }, null, 1));
}

async function seed(dry) {
  const profiles = await getAll(
    `/rest/v1/profiles?select=id,email,display_name,avatar_url,team_id,is_active&company_id=eq.${COMPANY_ID}&role=eq.companion&is_active=eq.true`,
  );
  const teams = await getAll(`/rest/v1/teams?select=id,name&company_id=eq.${COMPANY_ID}`);
  const teamName = Object.fromEntries(teams.map((t) => [t.id, t.name]));
  const ids = profiles.map((p) => p.id);
  const inIds = (chunk) => `user_id=in.(${chunk.join(",")})`;

  const existing = { checkins: [], before: [], habits: [], checklist: [], plans: [] };
  for (let i = 0; i < ids.length; i += 50) {
    const c = ids.slice(i, i + 50);
    existing.checkins.push(...(await getAll(`/rest/v1/checkins?select=user_id,created_at,mood,sleep_hours,water_ml&${inIds(c)}&created_at=gte.${MONTH_START_ISO}&created_at=lt.${MONTH_END_ISO}`)));
    existing.before.push(...(await getAll(`/rest/v1/checkins?select=user_id&${inIds(c)}&created_at=lt.${MONTH_START_ISO}&created_at=gte.${new Date(spMidnight(1) - 45 * 86400e3).toISOString()}`)));
    existing.habits.push(...(await getAll(`/rest/v1/habits?select=user_id,date&${inIds(c)}&date=gte.${isoDate(1)}&date=lte.${isoDate(daysInMonth)}`)));
    existing.checklist.push(...(await getAll(`/rest/v1/wellness_checklist?select=user_id,date&${inIds(c)}&date=gte.${isoDate(1)}&date=lte.${isoDate(daysInMonth)}`)));
    existing.plans.push(...(await getAll(`/rest/v1/wellness_plans?select=id,user_id,goal,start_date&${inIds(c)}&is_active=eq.true`)));
  }
  // último dia com volume de uso (um check-in avulso hoje não significa que o mês já está preenchido)
  const perDay = {};
  for (const c of existing.checkins) {
    const d = Number(spDateOf(c.created_at).slice(8, 10));
    perDay[d] = (perDay[d] ?? 0) + 1;
  }
  const minVolume = Math.max(3, Math.ceil(profiles.length * 0.08));
  const observedUntil = Object.keys(perDay).map(Number).filter((d) => perDay[d] >= minVolume).reduce((mx, d) => Math.max(mx, d), 0);

  const all = { checkins: [], habits: [], diary_entries: [], chat_messages: [], wellness_checklist: [], wellness_plans: [] };
  const summary = [];
  for (const p of profiles) {
    const mine = existing.checkins.filter((c) => c.user_id === p.id);
    const checkinDays = new Set(mine.map((c) => spDateOf(c.created_at)));
    const checkinScores = Object.fromEntries(mine.map((c) => [spDateOf(c.created_at), MOOD_SCORE[c.mood] ?? 4]));
    const avg = (arr) => (arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : null);
    const ctx = {
      checkinDays,
      checkinScores,
      observedUntil,
      hadHistoryBefore: existing.before.some((c) => c.user_id === p.id),
      avgScore: avg(mine.map((c) => MOOD_SCORE[c.mood] ?? 4)),
      avgSleep: avg(mine.map((c) => Number(c.sleep_hours))),
      avgWater: avg(mine.map((c) => Number(c.water_ml))),
      habitDays: new Set(existing.habits.filter((h) => h.user_id === p.id).map((h) => h.date)),
      checklistDays: new Set(existing.checklist.filter((h) => h.user_id === p.id).map((h) => h.date)),
      activePlan: existing.plans.find((pl) => pl.user_id === p.id) ?? null,
    };
    const team = teamName[p.team_id] ?? "-";
    const r = buildForUser(p, team, ctx);
    all.checkins.push(...r.checkins);
    all.habits.push(...r.habits);
    all.diary_entries.push(...r.diary);
    all.chat_messages.push(...r.chat);
    all.wellness_checklist.push(...r.checklist);
    if (r.plan) all.wellness_plans.push(r.plan);
    summary.push({
      nome: p.display_name,
      equipe: team,
      perfil: r.eng.kind,
      "check-ins já existentes": checkinDays.size,
      "check-ins novos": r.checkins.length,
      hábitos: r.habits.length,
      diário: r.diary.length,
      "msgs chat": r.chat.length,
      checklist: r.checklist.length,
      "plano novo": r.plan ? r.plan.goal : "",
    });
  }

  console.log(`Mês ${MES} — dias 1 a ${LAST_DAY} (já havia check-ins até o dia ${observedUntil}). ${profiles.length} colaboradores.`);
  console.table(summary);
  console.log(Object.fromEntries(Object.entries(all).map(([k, v]) => [k, v.length])));
  if (dry) return console.log("--dry: nada foi gravado.");

  // planos antes do checklist (FK plan_id)
  for (const t of ["wellness_plans", "checkins", "habits", "diary_entries", "chat_messages", "wellness_checklist"]) {
    await insertAll(t, all[t]);
    console.log(`${t}: ${all[t].length} inseridos`);
  }
  mkdirSync(manifestDir, { recursive: true });
  const prev = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, "utf8")) : {};
  const manifest = { mes: MES, geradoEm: new Date().toISOString() };
  for (const [t, rows] of Object.entries(all)) manifest[t] = [...(prev.removidoEm ? [] : prev[t] ?? []), ...rows.map((r) => r.id)];
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 1));
  console.log(`Manifesto: ${manifestPath}`);
}

const run = process.argv.includes("--limpar") ? limpar : () => seed(process.argv.includes("--dry"));
run().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
