import { WATER_GOAL } from "@/data";
import { getHabits as fetchHabits } from "@/lib/api/habitos.server";
import { updateHabits as saveHabits } from "@/lib/api/habitos.server";

export interface BemEstarData {
  water: number;
  sleepQuality: number;
  mood: string;
  movementMinutes: number;
  energyLevel: number;
  meals: string[];
  goal: number;
}

export async function loadHabits(accessToken: string | null): Promise<BemEstarData> {
  if (!accessToken) {
    return { water: 0, sleepQuality: 50, mood: "", movementMinutes: 0, energyLevel: 50, meals: [], goal: WATER_GOAL };
  }
  try {
    const habits = await fetchHabits({ data: { accessToken } });
    if (habits) {
      return {
        water: habits.water_ml ?? 0,
        sleepQuality: habits.sleep_quality ?? 50,
        mood: habits.mood ?? "",
        movementMinutes: habits.movement_minutes ?? 0,
        energyLevel: habits.energy_level ?? 50,
        meals: Array.isArray(habits.meals) ? habits.meals : [],
        goal: WATER_GOAL,
      };
    }
  } catch {
    // fallback
  }
  return { water: 0, sleepQuality: 50, mood: "", movementMinutes: 0, energyLevel: 50, meals: [], goal: WATER_GOAL };
}

export async function persistHabits(
  accessToken: string,
  data: {
    waterMl?: number;
    sleepQuality?: number;
    mood?: string;
    movementMinutes?: number;
    energyLevel?: number;
    meals?: string[];
  },
): Promise<void> {
  try {
    await saveHabits({ data: { accessToken, ...data } });
  } catch {
    // silent fail — UI already optimistic
  }
}
