import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { logEvent } from "@/lib/api/logs.server";

const MOOD_SCORE: Record<string, number> = {
  irritado: 1,
  triste: 2,
  ansioso: 3,
  neutro: 4,
  calmo: 5,
  feliz: 6,
};

const NEGATIVE_MOODS = ["irritado", "triste", "ansioso"];

export interface PreventiveAlert {
  type: "burnout-risk" | "sleep-crisis" | "mood-crisis" | "disengagement" | "hydration" | "energy" | "movement" | "none";
  severity: "low" | "medium" | "high" | "none";
  message: string;
  suggestion: string;
  details: {
    sleepChange: number;
    moodChange: number;
    interactionChange: number;
    hydrationChange?: number;
    movementChange?: number;
    energyChange?: number;
    streakDays?: number;
    correlationNote?: string;
  };
}

export interface PreventiveNotification {
  id: string;
  type: string;
  severity: string;
  message: string;
  suggestion: string;
  details: Record<string, unknown>;
  dismissed: boolean;
  created_at: string;
}

function dateKey(d: Date): string {
  return d.toISOString().split("T")[0];
}

function getMoodScore(mood: string | null): number {
  if (!mood) return 0;
  return MOOD_SCORE[mood] ?? 0;
}

function getTimeOfDay(): "manha" | "tarde" | "noite" {
  const hour = new Date().getHours();
  if (hour < 12) return "manha";
  if (hour < 18) return "tarde";
  return "noite";
}

function calculateStreak(days: Map<string, { mood: string | null; sleepHours: number }>): number {
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = dateKey(d);
    const data = days.get(key);
    if (data && data.mood) {
      const score = getMoodScore(data.mood);
      if (score <= 3) {
        streak++;
      } else {
        break;
      }
    } else {
      break;
    }
  }
  return streak;
}

function detectCorrelation(
  dayData: Map<string, { mood: string | null; sleepHours: number; waterMl: number; movementMin: number; energyLevel: number }>
): string | null {
  const entries = Array.from(dayData.values()).filter((d) => d.mood && d.sleepHours > 0);
  if (entries.length < 4) return null;

  const lowSleepWithBadMood = entries.filter(
    (e) => e.sleepHours < 6 && getMoodScore(e.mood) <= 3
  ).length;
  const lowSleepTotal = entries.filter((e) => e.sleepHours < 6).length;

  if (lowSleepTotal >= 2 && lowSleepWithBadMood / lowSleepTotal >= 0.6) {
    return "sono-humor";
  }

  const lowWaterWithLowEnergy = entries.filter(
    (e) => e.waterMl < 1500 && e.energyLevel < 40
  ).length;
  const lowWaterTotal = entries.filter((e) => e.waterMl < 1500).length;

  if (lowWaterTotal >= 2 && lowWaterWithLowEnergy / lowWaterTotal >= 0.6) {
    return "agua-energia";
  }

  return null;
}

export const detectPatterns = createServerFn({ method: "POST" })
  .inputValidator(z.object({ accessToken: z.string() }))
  .handler(async ({ data }: { data: { accessToken: string } }) => {
    const supabase = await createClient(data.accessToken);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return buildEmptyAlert();

    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const since = fourteenDaysAgo.toISOString();
    const sinceDate = since.split("T")[0];

    const [habitsRes, checkinsRes, chatsRes, diaryRes] = await Promise.allSettled([
      supabase
        .from("habits")
        .select("*")
        .eq("user_id", user.id)
        .gte("date", sinceDate)
        .order("date", { ascending: true }),
      supabase
        .from("checkins")
        .select("*")
        .eq("user_id", user.id)
        .gte("created_at", since)
        .order("created_at", { ascending: true }),
      supabase
        .from("chat_messages")
        .select("created_at, from")
        .eq("user_id", user.id)
        .gte("created_at", since)
        .order("created_at", { ascending: true }),
      supabase
        .from("diary_entries")
        .select("created_at")
        .eq("user_id", user.id)
        .gte("created_at", since)
        .order("created_at", { ascending: true }),
    ]);

    const habits = habitsRes.status === "fulfilled" ? (habitsRes.value.data ?? []) : [];
    const checkins = checkinsRes.status === "fulfilled" ? (checkinsRes.value.data ?? []) : [];
    const chats = chatsRes.status === "fulfilled" ? (chatsRes.value.data ?? []) : [];
    const diaryEntries = diaryRes.status === "fulfilled" ? (diaryRes.value.data ?? []) : [];

    const recentDays = new Set<string>();
    const baselineDays = new Set<string>();

    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      recentDays.add(dateKey(d));
    }
    for (let i = 7; i < 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      baselineDays.add(dateKey(d));
    }

    const dayData = new Map<string, {
      mood: string | null;
      sleepHours: number;
      hasInteraction: boolean;
      waterMl: number;
      movementMin: number;
      energyLevel: number;
      mealsCount: number;
    }>();

    for (const h of habits) {
      const key = h.date;
      const existing = dayData.get(key) ?? {
        mood: null, sleepHours: 0, hasInteraction: false,
        waterMl: 0, movementMin: 0, energyLevel: 50, mealsCount: 0,
      };
      if (h.mood && !existing.mood) existing.mood = h.mood;
      if (h.sleep_quality > 0 && existing.sleepHours === 0) {
        existing.sleepHours = h.sleep_quality / 10;
      }
      if (h.water_ml > 0) existing.waterMl = h.water_ml;
      if (h.movement_minutes > 0) existing.movementMin = h.movement_minutes;
      if (h.energy_level > 0) existing.energyLevel = h.energy_level;
      if (h.meals && Array.isArray(h.meals)) existing.mealsCount = h.meals.length;
      existing.hasInteraction = true;
      dayData.set(key, existing);
    }

    for (const c of checkins) {
      const key = dateKey(new Date(c.created_at));
      const existing = dayData.get(key) ?? {
        mood: null, sleepHours: 0, hasInteraction: false,
        waterMl: 0, movementMin: 0, energyLevel: 50, mealsCount: 0,
      };
      if (c.mood && !existing.mood) existing.mood = c.mood;
      if (c.sleep_hours > 0 && existing.sleepHours === 0) existing.sleepHours = c.sleep_hours;
      if (c.water_ml > 0 && existing.waterMl === 0) existing.waterMl = c.water_ml;
      existing.hasInteraction = true;
      dayData.set(key, existing);
    }

    for (const msg of chats) {
      const key = dateKey(new Date(msg.created_at));
      const existing = dayData.get(key) ?? {
        mood: null, sleepHours: 0, hasInteraction: false,
        waterMl: 0, movementMin: 0, energyLevel: 50, mealsCount: 0,
      };
      existing.hasInteraction = true;
      dayData.set(key, existing);
    }

    for (const entry of diaryEntries) {
      const key = dateKey(new Date(entry.created_at));
      const existing = dayData.get(key) ?? {
        mood: null, sleepHours: 0, hasInteraction: false,
        waterMl: 0, movementMin: 0, energyLevel: 50, mealsCount: 0,
      };
      existing.hasInteraction = true;
      dayData.set(key, existing);
    }

    let recentSleepSum = 0, recentSleepCount = 0;
    let recentMoodSum = 0, recentMoodCount = 0;
    let recentInteractionDays = 0;
    let recentWaterSum = 0, recentWaterCount = 0;
    let recentMovementSum = 0, recentMovementCount = 0;
    let recentEnergySum = 0, recentEnergyCount = 0;

    let baselineSleepSum = 0, baselineSleepCount = 0;
    let baselineMoodSum = 0, baselineMoodCount = 0;
    let baselineInteractionDays = 0;
    let baselineWaterSum = 0, baselineWaterCount = 0;
    let baselineMovementSum = 0, baselineMovementCount = 0;
    let baselineEnergySum = 0, baselineEnergyCount = 0;

    for (const [key, vals] of dayData) {
      if (recentDays.has(key)) {
        if (vals.sleepHours > 0) { recentSleepSum += vals.sleepHours; recentSleepCount++; }
        if (vals.mood) { recentMoodSum += getMoodScore(vals.mood); recentMoodCount++; }
        if (vals.hasInteraction) recentInteractionDays++;
        if (vals.waterMl > 0) { recentWaterSum += vals.waterMl; recentWaterCount++; }
        if (vals.movementMin > 0) { recentMovementSum += vals.movementMin; recentMovementCount++; }
        if (vals.energyLevel > 0) { recentEnergySum += vals.energyLevel; recentEnergyCount++; }
      } else if (baselineDays.has(key)) {
        if (vals.sleepHours > 0) { baselineSleepSum += vals.sleepHours; baselineSleepCount++; }
        if (vals.mood) { baselineMoodSum += getMoodScore(vals.mood); baselineMoodCount++; }
        if (vals.hasInteraction) baselineInteractionDays++;
        if (vals.waterMl > 0) { baselineWaterSum += vals.waterMl; baselineWaterCount++; }
        if (vals.movementMin > 0) { baselineMovementSum += vals.movementMin; baselineMovementCount++; }
        if (vals.energyLevel > 0) { baselineEnergySum += vals.energyLevel; baselineEnergyCount++; }
      }
    }

    const recentSleepAvg = recentSleepCount > 0 ? recentSleepSum / recentSleepCount : 0;
    const baselineSleepAvg = baselineSleepCount > 0 ? baselineSleepSum / baselineSleepCount : 0;
    const sleepChange = recentSleepAvg - baselineSleepAvg;

    const recentMoodAvg = recentMoodCount > 0 ? recentMoodSum / recentMoodCount : 0;
    const baselineMoodAvg = baselineMoodCount > 0 ? baselineMoodSum / baselineMoodCount : 0;
    const moodChange = recentMoodAvg - baselineMoodAvg;

    const interactionChange = recentInteractionDays - baselineInteractionDays;

    const recentWaterAvg = recentWaterCount > 0 ? recentWaterSum / recentWaterCount : 0;
    const baselineWaterAvg = baselineWaterCount > 0 ? baselineWaterSum / baselineWaterCount : 0;
    const hydrationChange = recentWaterAvg - baselineWaterAvg;

    const recentMovementAvg = recentMovementCount > 0 ? recentMovementSum / recentMovementCount : 0;
    const baselineMovementAvg = baselineMovementCount > 0 ? baselineMovementSum / baselineMovementCount : 0;
    const movementChange = recentMovementAvg - baselineMovementAvg;

    const recentEnergyAvg = recentEnergyCount > 0 ? recentEnergySum / recentEnergyCount : 0;
    const baselineEnergyAvg = baselineEnergyCount > 0 ? baselineEnergySum / baselineEnergyCount : 0;
    const energyChange = recentEnergyAvg - baselineEnergyAvg;

    const streakDays = calculateStreak(dayData);
    const correlation = detectCorrelation(dayData);
    const timeOfDay = getTimeOfDay();

    const sleepDrop = sleepChange <= -1;
    const mildSleepDrop = sleepChange <= -0.5 && sleepChange > -1;
    const moodDrop = moodChange <= -1;
    const mildMoodDrop = moodChange <= -0.5 && moodChange > -1;
    const interactionDrop = interactionChange <= -2;
    const mildInteractionDrop = interactionChange <= -1 && interactionChange > -2;
    const hydrationDrop = hydrationChange <= -300;
    const mildHydrationDrop = hydrationChange <= -150 && hydrationChange > -300;
    const movementDrop = movementChange <= -15;
    const mildMovementDrop = movementChange <= -7 && movementChange > -15;
    const energyDrop = energyChange <= -15;
    const mildEnergyDrop = energyChange <= -7 && energyChange > -15;

    const baseDetails = {
      sleepChange: parseFloat(sleepChange.toFixed(1)),
      moodChange: parseFloat(moodChange.toFixed(1)),
      interactionChange,
      hydrationChange: parseFloat(hydrationChange.toFixed(0)),
      movementChange: parseFloat(movementChange.toFixed(1)),
      energyChange: parseFloat(energyChange.toFixed(1)),
      streakDays,
      correlationNote: correlation === "sono-humor"
        ? "Seu sono e humor parecem conectados"
        : correlation === "agua-energia"
          ? "Sua hidratação pode estar afetando sua energia"
          : undefined,
    };

    if ((sleepDrop && moodDrop && interactionDrop) && baselineSleepCount >= 2 && baselineMoodCount >= 2) {
      const alert = buildAlert("burnout-risk", "high", baseDetails, timeOfDay, streakDays, correlation);
      await saveNotification(supabase, user.id, alert);
      return alert;
    }

    if (((sleepDrop || mildSleepDrop) && (moodDrop || mildMoodDrop) && (interactionDrop || mildInteractionDrop)) && baselineSleepCount >= 2 && baselineMoodCount >= 2) {
      const alert = buildAlert("burnout-risk", "medium", baseDetails, timeOfDay, streakDays, correlation);
      await saveNotification(supabase, user.id, alert);
      return alert;
    }

    if (sleepDrop) {
      const alert = buildAlert("sleep-crisis", "high", baseDetails, timeOfDay, streakDays, correlation);
      await saveNotification(supabase, user.id, alert);
      return alert;
    }

    if (moodDrop) {
      const alert = buildAlert("mood-crisis", "high", baseDetails, timeOfDay, streakDays, correlation);
      await saveNotification(supabase, user.id, alert);
      return alert;
    }

    if (hydrationDrop) {
      const alert = buildAlert("hydration", "medium", baseDetails, timeOfDay, streakDays, correlation);
      await saveNotification(supabase, user.id, alert);
      return alert;
    }

    if (movementDrop) {
      const alert = buildAlert("movement", "medium", baseDetails, timeOfDay, streakDays, correlation);
      await saveNotification(supabase, user.id, alert);
      return alert;
    }

    if (energyDrop) {
      const alert = buildAlert("energy", "medium", baseDetails, timeOfDay, streakDays, correlation);
      await saveNotification(supabase, user.id, alert);
      return alert;
    }

    if (mildSleepDrop) {
      const alert = buildAlert("sleep-crisis", "low", baseDetails, timeOfDay, streakDays, correlation);
      await saveNotification(supabase, user.id, alert);
      return alert;
    }

    if (mildMoodDrop) {
      const alert = buildAlert("mood-crisis", "low", baseDetails, timeOfDay, streakDays, correlation);
      await saveNotification(supabase, user.id, alert);
      return alert;
    }

    if (mildHydrationDrop) {
      const alert = buildAlert("hydration", "low", baseDetails, timeOfDay, streakDays, correlation);
      await saveNotification(supabase, user.id, alert);
      return alert;
    }

    if (mildMovementDrop) {
      const alert = buildAlert("movement", "low", baseDetails, timeOfDay, streakDays, correlation);
      await saveNotification(supabase, user.id, alert);
      return alert;
    }

    if (mildEnergyDrop) {
      const alert = buildAlert("energy", "low", baseDetails, timeOfDay, streakDays, correlation);
      await saveNotification(supabase, user.id, alert);
      return alert;
    }

    if (interactionDrop) {
      const alert = buildAlert("disengagement", "medium", baseDetails, timeOfDay, streakDays, correlation);
      await saveNotification(supabase, user.id, alert);
      return alert;
    }

    if (mildInteractionDrop) {
      const alert = buildAlert("disengagement", "low", baseDetails, timeOfDay, streakDays, correlation);
      await saveNotification(supabase, user.id, alert);
      return alert;
    }

    return buildEmptyAlert();
  });

function buildAlert(
  type: PreventiveAlert["type"],
  severity: PreventiveAlert["severity"],
  details: PreventiveAlert["details"],
  timeOfDay: "manha" | "tarde" | "noite",
  streakDays: number,
  correlation: string | null,
): PreventiveAlert {
  const messages = getMessages(type, severity, timeOfDay, streakDays, details, correlation);
  const suggestions = getSuggestions(type, severity, timeOfDay);

  return {
    type,
    severity,
    message: messages,
    suggestion: suggestions,
    details,
  };
}

function getMessages(
  type: PreventiveAlert["type"],
  severity: PreventiveAlert["severity"],
  timeOfDay: "manha" | "tarde" | "noite",
  streakDays: number,
  details: PreventiveAlert["details"],
  correlation: string | null,
): string {
  const streakRef = streakDays >= 3 ? ` Já faz ${streakDays} dias seguidos.` : "";

  if (type === "burnout-risk") {
    if (severity === "high") {
      return `Percebi uma mudança importante no seu padrão: seu sono, humor e interações diminuíram最近. Isso pode ser um sinal de sobrecarga.${streakRef} Que tal reservar um momento para si mesmo hoje?`;
    }
    return `Tenho notado alguns sinais de que você pode estar se sentindo mais sobrecarregado. Seu padrão de sono, humor e interações mudou um pouco nos últimos dias.${streakRef}`;
  }

  if (type === "sleep-crisis") {
    if (severity === "high") {
      return `Seu sono reduziu bastante最近 — isso pode estar afetando sua energia e humor. ${timeOfDay === "noite" ? "Que tal se preparar para uma noite mais tranquila?" : "Cuidar do sono hoje pode fazer diferença."}`;
    }
    return `Seu sono diminuiu um pouco nos últimos dias. Pequenas mudanças na rotina de sono podem ajudar.`;
  }

  if (type === "mood-crisis") {
    if (severity === "high") {
      return `Notei que seu humor tem sido mais desafiador最近. Isso acontece com todos, e é importante se permitir sentir. ${timeOfDay === "manha" ? "Comece o dia com gentileza." : "Que tal uma pausa para se reconectar?"}`;
    }
    return `Percebi uma leve mudança no seu humor. Como você está se sentindo hoje?`;
  }

  if (type === "hydration") {
    if (severity === "medium") {
      return `Sua ingestão de água caiu最近. Manter-se hidratado ajuda na energia e concentração.`;
    }
    return `Você tem bebido um pouco menos de água nos últimos dias. Uma garrafa por perto pode ajudar.`;
  }

  if (type === "movement") {
    if (severity === "medium") {
      return `Seu nível de atividade física diminuiu最近. Movimento corporal é importante para o bem-estar.`;
    }
    return `Você tem se movimentado menos nos últimos dias. Uma caminhada curta pode ajudar.`;
  }

  if (type === "energy") {
    if (severity === "medium") {
      return `Sua energia tem estado mais baixa最近. Isso pode estar conectado a outros fatores como sono ou alimentação.`;
    }
    return `Percebi que sua energia está um pouco mais baixa. Cuidar de pequenos hábitos pode ajudar.`;
  }

  if (type === "disengagement") {
    if (severity === "medium") {
      return `Você tem interagido menos nos últimos dias. Às vezes, uma pausa é necessária, e tudo bem.`;
    }
    return `Você tem estado mais quieto(a) nos últimos dias. Tudo bem?`;
  }

  return "";
}

function getSuggestions(
  type: PreventiveAlert["type"],
  severity: PreventiveAlert["severity"],
  timeOfDay: "manha" | "tarde" | "noite",
): string {
  if (type === "burnout-risk") {
    if (severity === "high") {
      return "Que tal reservar 5 minutos para uma respiração profunda ou uma caminhada curta? Cuidar de você agora faz diferença.";
    }
    return "Uma pausa leve, uma caminhada curta ou conversar com alguém pode ajudar a recarregar as energias.";
  }

  if (type === "sleep-crisis") {
    if (severity === "high") {
      return timeOfDay === "noite"
        ? "Que tal criar um ritual de relaxamento antes de dormir? Evite telas e tente uma respiração calma."
        : "Considere ir dormir um pouco mais cedo hoje. Um ambiente escuro e sem telas ajuda muito.";
    }
    return "Tente manter um horário regular para dormir e evite cafeína à noite.";
  }

  if (type === "mood-crisis") {
    if (severity === "high") {
      return "Que tal um exercício de respiração ou conversar com alguém de confiança? Você não precisa passar por isso sozinho.";
    }
    return "Conversar sobre como você está pode ajudar. Estou aqui para ouvir.";
  }

  if (type === "hydration") {
    if (severity === "medium") {
      return "Tente manter uma garrafa de água por perto. Beber um copo a cada hora pode ajudar.";
    }
    return "Um copo de água agora pode fazer bem. Pequenos passos contam.";
  }

  if (type === "movement") {
    if (severity === "medium") {
      return "Que tal uma caminhada curta de 10 minutos? Movimento corporal ajuda no humor e na energia.";
    }
    return "Mesmo uma caminhada breve pode fazer diferença. Comece pequeno.";
  }

  if (type === "energy") {
    if (severity === "medium") {
      return "Uma pausa curta e um lanche saudável podem ajudar a recuperar a energia.";
    }
    return "Respirar fundo e se hidratar são bons primeiros passos.";
  }

  if (type === "disengagement") {
    if (severity === "medium") {
      return "Que tal dar um passeio curto ou fazer algo que você gosta? Pequenos momentos de cuidado contam muito.";
    }
    return "Se precisar, estou aqui para conversar. Um momento de conexão pode fazer bem.";
  }

  return "";
}

async function saveNotification(
  supabaseClient: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  alert: PreventiveAlert,
): Promise<void> {
  try {
    await supabaseClient.from("preventive_notifications").insert({
      user_id: userId,
      type: alert.type,
      severity: alert.severity,
      message: alert.message,
      suggestion: alert.suggestion,
      details: alert.details,
    });
  } catch (err) {
    await logEvent("warn", "preventiva-ai.saveNotification", "Falha ao salvar notificação", { error: String(err) }, userId);
  }
}

export const getNotificationHistory = createServerFn({ method: "POST" })
  .inputValidator(z.object({ accessToken: z.string(), limit: z.number().optional().default(20) }))
  .handler(async ({ data }: { data: { accessToken: string; limit: number } }) => {
    const supabase = await createClient(data.accessToken);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: notifications } = await supabase
      .from("preventive_notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(data.limit);

    return (notifications ?? []) as PreventiveNotification[];
  });

export const dismissNotification = createServerFn({ method: "POST" })
  .inputValidator(z.object({ accessToken: z.string(), notificationId: z.string() }))
  .handler(async ({ data }: { data: { accessToken: string; notificationId: string } }) => {
    const supabase = await createClient(data.accessToken);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false };

    await supabase
      .from("preventive_notifications")
      .update({ dismissed: true, dismissed_at: new Date().toISOString() })
      .eq("id", data.notificationId)
      .eq("user_id", user.id);

    return { success: true };
  });

export const getUnreadNotificationCount = createServerFn({ method: "POST" })
  .inputValidator(z.object({ accessToken: z.string() }))
  .handler(async ({ data }: { data: { accessToken: string } }) => {
    const supabase = await createClient(data.accessToken);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { count: 0 };

    const { count } = await supabase
      .from("preventive_notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("dismissed", false);

    return { count: count ?? 0 };
  });

function buildEmptyAlert(): PreventiveAlert {
  return {
    type: "none",
    severity: "none",
    message: "",
    suggestion: "",
    details: { sleepChange: 0, moodChange: 0, interactionChange: 0 },
  };
}
