import { WATER_GOAL } from "@/data";
import { getHabits as fetchHabits } from "@/lib/api/habitos.server";
import { updateHabits as saveHabits } from "@/lib/api/habitos.server";
import { getTodaysCheckin } from "@/lib/api/checkin.server";

export interface BemEstarData {
  water: number;
  sleepQuality: number;
  mood: string;
  movementMinutes: number;
  energyLevel: number;
  meals: string[];
  goal: number;
}

export interface BemEstarState extends BemEstarData {
  fromCheckin: {
    water: boolean;
    sleep: boolean;
    mood: boolean;
  };
  hasCheckin: boolean;
}

export async function loadBemEstar(accessToken: string | null): Promise<BemEstarState> {
  const defaults: BemEstarState = {
    water: 0, sleepQuality: 50, mood: "", movementMinutes: 0,
    energyLevel: 50, meals: [], goal: WATER_GOAL,
    fromCheckin: { water: false, sleep: false, mood: false },
    hasCheckin: false,
  };

  if (!accessToken) return defaults;

  try {
    const [checkinResult, habitsResult] = await Promise.allSettled([
      getTodaysCheckin({ data: { accessToken } }),
      fetchHabits({ data: { accessToken } }),
    ]);

    const checkin = checkinResult.status === "fulfilled" ? checkinResult.value.data : null;
    const habits = habitsResult.status === "fulfilled" ? habitsResult.value : null;

    return {
      water: checkin?.water_ml ?? habits?.water_ml ?? 0,
      sleepQuality: habits?.sleep_quality ?? 50,
      mood: checkin?.mood ?? habits?.mood ?? "",
      movementMinutes: habits?.movement_minutes ?? 0,
      energyLevel: habits?.energy_level ?? 50,
      meals: Array.isArray(habits?.meals) ? habits.meals : [],
      goal: WATER_GOAL,
      fromCheckin: {
        water: !!checkin?.water_ml,
        sleep: !!checkin?.sleep_hours,
        mood: !!checkin?.mood,
      },
      hasCheckin: !!checkin,
    };
  } catch {
    return defaults;
  }
}

export async function saveBemEstar(
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
    // silent fail
  }
}
