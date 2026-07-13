import { WATER_GOAL } from "@/data";
import { getHabits as fetchHabits } from "@/lib/api/habitos.server";

export async function loadWaterGoal(accessToken: string | null): Promise<{
  water: number;
  goal: number;
}> {
  if (!accessToken) return { water: 1200, goal: WATER_GOAL };
  try {
    const habits = await fetchHabits({ data: { accessToken } });
    if (habits?.water_ml) {
      return { water: habits.water_ml, goal: WATER_GOAL };
    }
  } catch {
    // fallback
  }
  return { water: 1200, goal: WATER_GOAL };
}
