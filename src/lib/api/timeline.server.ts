import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getUserIdFromAccessToken, getEmailFromAccessToken } from "@/lib/auth-token";

export interface TimelineEvent {
  type: "sleep" | "water" | "mood" | "movement" | "energy" | "meals" | "chat" | "diary";
  emoji: string;
  description: string;
}

export interface TimelineDay {
  date: string;
  dayLabel: string;
  mood: string | null;
  moodEmoji: string;
  events: TimelineEvent[];
  diaryEntry: { id: string; content: string; mood?: string } | null;
}

export interface TimelineData {
  days: TimelineDay[];
  moodGrid: { color: string | null; mood: string | null; day: number }[];
  aiInsight: string;
}

const MOOD_EMOJI: Record<string, string> = {
  feliz: "😊",
  calmo: "😌",
  neutro: "😐",
  ansioso: "😟",
  triste: "😢",
  irritado: "😤",
};

const MOOD_COLOR: Record<string, string> = {
  feliz: "#C8E6C9",
  calmo: "#99BEE5",
  neutro: "#C5D9F1",
  ansioso: "#FFCC80",
  triste: "#90CAF9",
  irritado: "#EF9A9A",
};

function dateKey(d: Date): string {
  return d.toISOString().split("T")[0];
}

function getDayLabel(dateStr: string): string {
  const today = dateKey(new Date());
  const yesterday = dateKey(new Date(Date.now() - 86400000));
  if (dateStr === today) return "Hoje";
  if (dateStr === yesterday) return "Ontem";
  const d = new Date(dateStr + "T12:00:00");
  const diff = Math.round((Date.now() - d.getTime()) / 86400000);
  if (diff < 7) {
    return ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"][d.getDay()];
  }
  return d.toLocaleDateString("pt-BR", { day: "numeric", month: "short" });
}

export const getTimelineData = createServerFn({ method: "GET" })
  .inputValidator(z.object({ accessToken: z.string() }))
  .handler(async ({ data }: { data: { accessToken: string } }) => {
    const userId = getUserIdFromAccessToken(data.accessToken);
    if (!userId) return { days: [], moodGrid: [], aiInsight: "Faça login para ver seu diário." };

    const supabase = await createClient(data.accessToken);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const since = thirtyDaysAgo.toISOString();
    const sinceDate = since.split("T")[0];

    const [entriesRes, checkinsRes, habitsRes, chatsRes] = await Promise.allSettled([
      supabase
        .from("diary_entries")
        .select("id, content, mood, created_at")
        .eq("user_id", userId)
        .gte("created_at", since)
        .order("created_at", { ascending: false }),
      supabase
        .from("checkins")
        .select("created_at, mood, sleep_hours, water_ml")
        .eq("user_id", userId)
        .gte("created_at", since)
        .order("created_at", { ascending: false }),
      supabase
        .from("habits")
        .select("date, mood, sleep_quality, water_ml, movement_minutes, energy_level, meals")
        .eq("user_id", userId)
        .gte("date", sinceDate)
        .order("date", { ascending: false }),
      supabase
        .from("chat_messages")
        .select("created_at, from")
        .eq("user_id", userId)
        .gte("created_at", since)
        .order("created_at", { ascending: true }),
    ]);

    const entries = entriesRes.status === "fulfilled" ? (entriesRes.value.data ?? []) : [];
    const checkins = checkinsRes.status === "fulfilled" ? (checkinsRes.value.data ?? []) : [];
    const habits = habitsRes.status === "fulfilled" ? (habitsRes.value.data ?? []) : [];
    const chats = chatsRes.status === "fulfilled" ? (chatsRes.value.data ?? []) : [];

    const dayMap = new Map<string, TimelineDay>();

    function ensureDay(d: Date): TimelineDay {
      const key = dateKey(d);
      let day = dayMap.get(key);
      if (!day) {
        day = {
          date: key,
          dayLabel: getDayLabel(key),
          mood: null,
          moodEmoji: "",
          events: [],
          diaryEntry: null,
        };
        dayMap.set(key, day);
      }
      return day;
    }

    for (const entry of entries) {
      const d = new Date(entry.created_at);
      const day = ensureDay(d);
      if (entry.mood && !day.mood) {
        day.mood = entry.mood;
        day.moodEmoji = MOOD_EMOJI[entry.mood] ?? "";
      }
      if (!day.diaryEntry) {
        day.diaryEntry = { id: entry.id, content: entry.content, mood: entry.mood ?? undefined };
      }
    }

    for (const c of checkins) {
      const d = new Date(c.created_at);
      const day = ensureDay(d);
      if (c.mood && !day.mood) {
        day.mood = c.mood;
        day.moodEmoji = MOOD_EMOJI[c.mood] ?? "";
      }
      if (c.sleep_hours > 0) {
        day.events.push({ type: "sleep", emoji: "🛌", description: `Dormiu ${c.sleep_hours}h` });
      }
      if (c.water_ml > 0) {
        day.events.push({
          type: "water",
          emoji: "💧",
          description: `Bebeu ${c.water_ml}ml de água`,
        });
      }
    }

    for (const h of habits) {
      const d = new Date(h.date + "T12:00:00");
      const day = ensureDay(d);
      if (h.mood && !day.mood) {
        day.mood = h.mood;
        day.moodEmoji = MOOD_EMOJI[h.mood] ?? "";
      }
      if (h.sleep_quality > 0 && !day.events.find((e) => e.type === "sleep")) {
        const lbl =
          h.sleep_quality < 25
            ? "Cansado"
            : h.sleep_quality < 50
              ? "Moderado"
              : h.sleep_quality < 75
                ? "Revigorante"
                : "Descansado";
        day.events.push({ type: "sleep", emoji: "🛌", description: `Sono: ${lbl}` });
      }
      if (h.water_ml > 0 && !day.events.find((e) => e.type === "water")) {
        day.events.push({
          type: "water",
          emoji: "💧",
          description: `Bebeu ${h.water_ml}ml de água`,
        });
      }
      if (h.movement_minutes > 0) {
        day.events.push({
          type: "movement",
          emoji: "🏃",
          description: `${h.movement_minutes} min de movimento`,
        });
      }
      if (h.energy_level && h.energy_level !== 50) {
        const lbl = h.energy_level < 33 ? "Baixa" : h.energy_level < 66 ? "Média" : "Alta";
        day.events.push({ type: "energy", emoji: "⚡", description: `Energia: ${lbl}` });
      }
      if (Array.isArray(h.meals) && h.meals.length > 0) {
        day.events.push({
          type: "meals",
          emoji: "🍽️",
          description: `Refeições: ${h.meals.join(", ")}`,
        });
      }
    }

    const chatByDay = new Map<string, { userMsgs: number; aiMsgs: number }>();
    for (const msg of chats) {
      const key = dateKey(new Date(msg.created_at));
      let entry = chatByDay.get(key);
      if (!entry) {
        entry = { userMsgs: 0, aiMsgs: 0 };
        chatByDay.set(key, entry);
      }
      if (msg.from === "user") entry.userMsgs++;
      else entry.aiMsgs++;
    }
    for (const [key, counts] of chatByDay) {
      if (counts.aiMsgs > 0 || counts.userMsgs > 0) {
        const total = counts.userMsgs + counts.aiMsgs;
        const day = dayMap.get(key);
        if (day) {
          day.events.push({
            type: "chat",
            emoji: "💬",
            description: `Conversou com Amora (${total} ${total === 1 ? "mensagem" : "mensagens"})`,
          });
        }
      }
    }

    const sortedKeys = [...dayMap.keys()].sort().reverse();
    const sortedDays = sortedKeys.map((k) => dayMap.get(k)!).filter(Boolean);

    // Insight baseado em regras no caminho crítico (evita 10–15s de LLM no carregamento)
    const email = getEmailFromAccessToken(data.accessToken) ?? "Usuário";
    const aiInsight = generateFallbackInsight(sortedDays, email);

    const moodGrid: { color: string | null; mood: string | null; day: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = dateKey(d);
      const dayData = dayMap.get(key);
      const mood = dayData?.mood ?? null;
      moodGrid.push({
        color: mood ? (MOOD_COLOR[mood] ?? null) : null,
        mood,
        day: d.getDate(),
      });
    }

    return { days: sortedDays, moodGrid, aiInsight };
  });

function generateFallbackInsight(recentDays: TimelineDay[], userEmail?: string): string {
  if (recentDays.length === 0) {
    return "Registre seus dias para começar a ver seus padrões de bem-estar.";
  }

  const moods = recentDays.filter((d) => d.mood).map((d) => d.mood!);
  const hasSleep = recentDays.some((d) => d.events.some((e) => e.type === "sleep"));
  const hasMovement = recentDays.some((d) => d.events.some((e) => e.type === "movement"));
  const hasWater = recentDays.some((d) => d.events.some((e) => e.type === "water"));
  const name = userEmail?.split("@")[0];

  if (moods.length >= 3) {
    const posMoods = moods.filter((m) => m === "feliz" || m === "calmo").length;
    const posRatio = posMoods / moods.length;
    if (posRatio >= 0.7) {
      return name
        ? `${name}, percebemos que seus dias têm sido majoritariamente positivos. Continue cultivando esse estado de bem-estar!`
        : "Percebemos que seus dias têm sido majoritariamente positivos. Continue cultivando esse estado de bem-estar!";
    }
    if (posRatio <= 0.3) {
      return "Notamos que os últimos dias têm sido mais desafiadores emocionalmente. Que tal incluir uma pausa de respiração na sua rotina?";
    }
  }

  if (hasSleep && hasWater && hasMovement) {
    return "Você tem mantido uma rotina equilibrada com sono, hidratação e movimento. Isso é um ótimo sinal!";
  }

  return "Cada registro que você faz ajuda a entender melhor seus padrões. Continue cuidando de você!";
}
