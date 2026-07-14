import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const MOOD_SCORE: Record<string, number> = {
  irritado: 1,
  triste: 2,
  ansioso: 3,
  neutro: 4,
  calmo: 5,
  feliz: 6,
};

export interface PreventiveAlert {
  type: "burnout-risk" | "sleep-crisis" | "mood-crisis" | "disengagement" | "none";
  severity: "low" | "medium" | "high" | "none";
  message: string;
  suggestion: string;
  details: {
    sleepChange: number;
    moodChange: number;
    interactionChange: number;
  };
}

function dateKey(d: Date): string {
  return d.toISOString().split("T")[0];
}

function getMoodScore(mood: string | null): number {
  if (!mood) return 0;
  return MOOD_SCORE[mood] ?? 0;
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

    const recentStart = new Date();
    recentStart.setDate(recentStart.getDate() - 7);
    const recentKey = dateKey(recentStart);

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

    function isIn(dayKey: string, set: Set<string>): boolean {
      return set.has(dayKey);
    }

    const dayData = new Map<string, { mood: string | null; sleepHours: number; hasInteraction: boolean }>();

    for (const h of habits) {
      const key = h.date;
      const existing = dayData.get(key) ?? { mood: null, sleepHours: 0, hasInteraction: false };
      if (h.mood && !existing.mood) existing.mood = h.mood;
      if (h.sleep_quality > 0 && existing.sleepHours === 0) {
        existing.sleepHours = h.sleep_quality / 10;
      }
      existing.hasInteraction = true;
      dayData.set(key, existing);
    }

    for (const c of checkins) {
      const key = dateKey(new Date(c.created_at));
      const existing = dayData.get(key) ?? { mood: null, sleepHours: 0, hasInteraction: false };
      if (c.mood && !existing.mood) existing.mood = c.mood;
      if (c.sleep_hours > 0 && existing.sleepHours === 0) existing.sleepHours = c.sleep_hours;
      existing.hasInteraction = true;
      dayData.set(key, existing);
    }

    for (const msg of chats) {
      const key = dateKey(new Date(msg.created_at));
      const existing = dayData.get(key) ?? { mood: null, sleepHours: 0, hasInteraction: false };
      existing.hasInteraction = true;
      dayData.set(key, existing);
    }

    for (const entry of diaryEntries) {
      const key = dateKey(new Date(entry.created_at));
      const existing = dayData.get(key) ?? { mood: null, sleepHours: 0, hasInteraction: false };
      existing.hasInteraction = true;
      dayData.set(key, existing);
    }

    let recentSleepSum = 0;
    let recentSleepCount = 0;
    let recentMoodSum = 0;
    let recentMoodCount = 0;
    let recentInteractionDays = 0;

    let baselineSleepSum = 0;
    let baselineSleepCount = 0;
    let baselineMoodSum = 0;
    let baselineMoodCount = 0;
    let baselineInteractionDays = 0;

    for (const [key, vals] of dayData) {
      if (isIn(key, recentDays)) {
        if (vals.sleepHours > 0) {
          recentSleepSum += vals.sleepHours;
          recentSleepCount++;
        }
        if (vals.mood) {
          recentMoodSum += getMoodScore(vals.mood);
          recentMoodCount++;
        }
        if (vals.hasInteraction) recentInteractionDays++;
      } else if (isIn(key, baselineDays)) {
        if (vals.sleepHours > 0) {
          baselineSleepSum += vals.sleepHours;
          baselineSleepCount++;
        }
        if (vals.mood) {
          baselineMoodSum += getMoodScore(vals.mood);
          baselineMoodCount++;
        }
        if (vals.hasInteraction) baselineInteractionDays++;
      }
    }

    const recentSleepAvg = recentSleepCount > 0 ? recentSleepSum / recentSleepCount : 0;
    const baselineSleepAvg = baselineSleepCount > 0 ? baselineSleepSum / baselineSleepCount : 0;
    const sleepChange = recentSleepAvg - baselineSleepAvg;

    const recentMoodAvg = recentMoodCount > 0 ? recentMoodSum / recentMoodCount : 0;
    const baselineMoodAvg = baselineMoodCount > 0 ? baselineMoodSum / baselineMoodCount : 0;
    const moodChange = recentMoodAvg - baselineMoodAvg;

    const interactionChange = recentInteractionDays - baselineInteractionDays;

    const sleepDrop = sleepChange <= -1;
    const mildSleepDrop = sleepChange <= -0.5 && sleepChange > -1;
    const moodDrop = moodChange <= -1;
    const mildMoodDrop = moodChange <= -0.5 && moodChange > -1;
    const interactionDrop = interactionChange <= -2;
    const mildInteractionDrop = interactionChange <= -1 && interactionChange > -2;

    const sleepCrisis = sleepDrop || mildSleepDrop;
    const moodCrisis = moodDrop || mildMoodDrop;
    const disengagement = interactionDrop || mildInteractionDrop;

    const burnoutRisk = sleepDrop && moodDrop && interactionDrop;
    const burnoutRiskMild = (sleepDrop || mildSleepDrop) && (moodDrop || mildMoodDrop) && (interactionDrop || mildInteractionDrop);

    if (burnoutRisk && baselineSleepCount >= 2 && baselineMoodCount >= 2) {
      return {
        type: "burnout-risk" as const,
        severity: "high" as const,
        message: "Percebi uma mudança no seu padrão: seu sono diminuiu, seu humor está mais desafiador e você tem interagido menos. Pode ser um sinal de sobrecarga.",
        suggestion: "Que tal reservar um momento hoje para uma pausa de respiração ou uma conversa? Cuidar de você agora faz diferença.",
        details: {
          sleepChange: parseFloat(sleepChange.toFixed(1)),
          moodChange: parseFloat(moodChange.toFixed(1)),
          interactionChange,
        },
      };
    }

    if (burnoutRiskMild && baselineSleepCount >= 2 && baselineMoodCount >= 2) {
      return {
        type: "burnout-risk" as const,
        severity: "medium" as const,
        message: "Tenho notado alguns sinais de que você pode estar se sentindo mais sobrecarregado. Seu padrão de sono, humor e interações mudaram um pouco.",
        suggestion: "Uma pausa leve, uma caminhada curta ou conversar com alguém pode ajudar a recarregar as energias.",
        details: {
          sleepChange: parseFloat(sleepChange.toFixed(1)),
          moodChange: parseFloat(moodChange.toFixed(1)),
          interactionChange,
        },
      };
    }

    if (sleepDrop) {
      return {
        type: "sleep-crisis" as const,
        severity: "high" as const,
        message: "Percebi que seu sono reduziu bastante nos últimos dias. Isso pode impactar sua energia e humor.",
        suggestion: "Que tal tentar ir para cama um pouco mais cedo hoje? Um ambiente escuro e sem telas ajuda.",
        details: {
          sleepChange: parseFloat(sleepChange.toFixed(1)),
          moodChange: parseFloat(moodChange.toFixed(1)),
          interactionChange,
        },
      };
    }

    if (moodDrop) {
      return {
        type: "mood-crisis" as const,
        severity: "high" as const,
        message: "Notei que seu humor tem sido mais desafiador nos últimos dias. Isso acontece, e é importante acolher.",
        suggestion: "Que tal um exercício de respiração ou uma breve pausa para se reconectar? Você não precisa passar por isso sozinho.",
        details: {
          sleepChange: parseFloat(sleepChange.toFixed(1)),
          moodChange: parseFloat(moodChange.toFixed(1)),
          interactionChange,
        },
      };
    }

    if (mildSleepDrop) {
      return {
        type: "sleep-crisis" as const,
        severity: "low" as const,
        message: "Seu sono diminuiu um pouco nos últimos dias. Pequenas mudanças na rotina podem ajudar.",
        suggestion: "Tente manter um horário regular para dormir e evite café à noite.",
        details: {
          sleepChange: parseFloat(sleepChange.toFixed(1)),
          moodChange: parseFloat(moodChange.toFixed(1)),
          interactionChange,
        },
      };
    }

    if (mildMoodDrop) {
      return {
        type: "mood-crisis" as const,
        severity: "low" as const,
        message: "Percebi uma leve mudança no seu humor. Como você está se sentindo hoje?",
        suggestion: "Conversar sobre como você está pode ajudar. Estou aqui para ouvir.",
        details: {
          sleepChange: parseFloat(sleepChange.toFixed(1)),
          moodChange: parseFloat(moodChange.toFixed(1)),
          interactionChange,
        },
      };
    }

    if (disengagement) {
      return {
        type: "disengagement" as const,
        severity: "medium" as const,
        message: "Notei que você tem interagido menos nos últimos dias. Às vezes, uma pausa é necessária.",
        suggestion: "Que tal dar um passeio curto ou fazer algo que você gosta? Pequenos momentos de cuidado contam muito.",
        details: {
          sleepChange: parseFloat(sleepChange.toFixed(1)),
          moodChange: parseFloat(moodChange.toFixed(1)),
          interactionChange,
        },
      };
    }

    if (mildInteractionDrop) {
      return {
        type: "disengagement" as const,
        severity: "low" as const,
        message: "Você tem estado mais quieto(a) nos últimos dias. Tudo bem?",
        suggestion: "Se precisar, estou aqui para conversar. Um momento de conexão pode fazer bem.",
        details: {
          sleepChange: parseFloat(sleepChange.toFixed(1)),
          moodChange: parseFloat(moodChange.toFixed(1)),
          interactionChange,
        },
      };
    }

    return buildEmptyAlert();
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
