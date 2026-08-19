import type { SupabaseClient } from "@supabase/supabase-js";
import {
  COMPANION_MEMORY_LIMIT,
  formatCompanionContextBlock,
  pickMemoryIdsToPrune,
  sanitizeCompanionMemory,
  type CompanionAiPayload,
  type CompanionSnapshot,
} from "@/lib/companion-agent";
import { canonicalMood } from "@/data/moods";

type DbClient = Pick<SupabaseClient, "from">;

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

  const planRow = planRes.data as { id: string; goal: string; custom_goal: string } | null;
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

export function companionContextBlock(snapshot: CompanionSnapshot): string {
  return formatCompanionContextBlock(snapshot);
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
