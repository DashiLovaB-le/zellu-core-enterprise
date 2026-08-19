import type { SupabaseClient } from "@supabase/supabase-js";
import {
  COMPANION_MEMORY_LIMIT,
  formatCompanionContextBlock,
  pickMemoryIdsToPrune,
  sanitizeCompanionMemory,
  type CompanionAiPayload,
  type CompanionSnapshot,
} from "@/lib/companion-agent";
import { computeCheckinStreak, planGoalLabel } from "@/lib/companion-portrait";
import { canonicalMood } from "@/data/moods";

type DbClient = Pick<SupabaseClient, "from">;

export type CompanionContextOptions = {
  preferredName: string;
  streakDays?: number;
};

export async function loadCompanionSnapshot(
  supabase: DbClient,
  userId: string,
  preventiveLine: string,
): Promise<CompanionSnapshot> {
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const today = new Date().toISOString().slice(0, 10);

  const [checkinsRes, habitsRes, planRes, checklistRes, memoriesRes] = await Promise.all([
    supabase
      .from("checkins")
      .select("sleep_hours, sleep_label, water_ml, mood, created_at")
      .eq("user_id", userId)
      .gte("created_at", weekAgo)
      .order("created_at", { ascending: false })
      .limit(7),
    supabase
      .from("habits")
      .select("water_ml, sleep_quality, mood, movement_minutes, energy_level, date")
      .eq("user_id", userId)
      .eq("date", today)
      .maybeSingle(),
    supabase
      .from("wellness_plans")
      .select("id, goal, custom_goal")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("wellness_checklist")
      .select("water_done, walk_done, breathe_done, talk_done")
      .eq("user_id", userId)
      .eq("date", today)
      .maybeSingle(),
    supabase
      .from("companion_memories")
      .select("content, importance")
      .eq("user_id", userId)
      .order("importance", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(COMPANION_MEMORY_LIMIT),
  ]);

  const planRow = planRes.data as { id: string; goal: string; custom_goal: string | null } | null;
  const checklist = checklistRes.data as {
    water_done: boolean;
    walk_done: boolean;
    breathe_done: boolean;
    talk_done: boolean;
  } | null;

  const snapshot: CompanionSnapshot = {
    checkins: (checkinsRes.data ?? []).map((row) => ({
      day: String(row.created_at).slice(0, 10),
      mood: canonicalMood(row.mood) ?? String(row.mood ?? ""),
      sleepHours: typeof row.sleep_hours === "number" ? row.sleep_hours : null,
      sleepLabel: String(row.sleep_label ?? ""),
      waterMl: typeof row.water_ml === "number" ? row.water_ml : null,
    })),
    habitsToday: habitsRes.data
      ? {
          waterMl: habitsRes.data.water_ml ?? null,
          sleepQuality: habitsRes.data.sleep_quality ?? null,
          mood: habitsRes.data.mood ?? null,
          movementMinutes: habitsRes.data.movement_minutes ?? null,
          energyLevel: habitsRes.data.energy_level ?? null,
        }
      : null,
    plan: planRow
      ? {
          goal: planRow.goal === "custom" ? "custom" : planRow.goal,
          customGoal: planRow.custom_goal,
          today: checklist
            ? {
                water: checklist.water_done,
                walk: checklist.walk_done,
                breathe: checklist.breathe_done,
                talk: checklist.talk_done,
              }
            : null,
        }
      : null,
    preventiveLine,
    memories: (memoriesRes.data ?? []).map((row) => ({
      importance: Number(row.importance) || 1,
      content: String(row.content ?? ""),
    })),
  };

  return snapshot;
}

export function companionContextBlock(
  snapshot: CompanionSnapshot,
  opts: CompanionContextOptions,
): string {
  return formatCompanionContextBlock(snapshot, {
    preferredName: opts.preferredName,
    streakDays: opts.streakDays,
  });
}

export async function syncAutoCompanionMemories(
  supabase: DbClient,
  userId: string,
  snapshot: CompanionSnapshot,
): Promise<void> {
  const candidates: Array<{ content: string; importance: number }> = [];
  const planGoal = planGoalLabel(snapshot);
  if (planGoal) {
    candidates.push({ content: `Objetivo de bem-estar: ${planGoal}`, importance: 4 });
  }

  const streak = computeCheckinStreak(snapshot.checkins.map((c) => c.day));
  if (streak >= 3) {
    candidates.push({
      content: `Mantém sequência de ${streak} dias com check-in`,
      importance: 3,
    });
  }

  for (const candidate of candidates) {
    const content = sanitizeCompanionMemory(candidate.content);
    if (!content) continue;

    const { data: existing } = await supabase
      .from("companion_memories")
      .select("id, importance")
      .eq("user_id", userId)
      .eq("content", content)
      .maybeSingle();

    if (existing?.id) {
      const nextImportance = Math.max(Number(existing.importance) || 1, candidate.importance);
      await supabase
        .from("companion_memories")
        .update({ importance: nextImportance })
        .eq("id", existing.id);
    } else {
      await supabase.from("companion_memories").insert({
        user_id: userId,
        content,
        importance: candidate.importance,
      });
    }
  }
}

export async function persistCompanionMemory(
  supabase: DbClient,
  userId: string,
  payload: CompanionAiPayload,
): Promise<void> {
  const content = sanitizeCompanionMemory(payload.memory);
  if (!content) return;

  const { data: existing } = await supabase
    .from("companion_memories")
    .select("id, importance")
    .eq("user_id", userId)
    .eq("content", content)
    .maybeSingle();

  if (existing?.id) {
    const nextImportance = Math.max(Number(existing.importance) || 1, payload.memoryImportance);
    await supabase
      .from("companion_memories")
      .update({ importance: nextImportance })
      .eq("id", existing.id);
  } else {
    await supabase.from("companion_memories").insert({
      user_id: userId,
      content,
      importance: payload.memoryImportance,
    });
  }

  const { data: rows } = await supabase
    .from("companion_memories")
    .select("id, importance, created_at")
    .eq("user_id", userId);

  const pruneIds = pickMemoryIdsToPrune(rows ?? []);
  if (pruneIds.length > 0) {
    await supabase.from("companion_memories").delete().in("id", pruneIds);
  }
}

export function snapshotStreakDays(snapshot: CompanionSnapshot): number {
  return computeCheckinStreak(snapshot.checkins.map((c) => c.day));
}
