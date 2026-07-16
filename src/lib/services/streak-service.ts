import { getWellnessStreak } from "@/lib/api/streak-system.server";
import type { StreakData } from "@/lib/api/streak-system.server";

let cached: StreakData | null = null;
let cacheTime = 0;
const CACHE_TTL = 60_000;

export async function loadStreak(accessToken: string): Promise<StreakData | null> {
  if (cached && Date.now() - cacheTime < CACHE_TTL) return cached;
  try {
    const result = await getWellnessStreak({ data: { accessToken } });
    cached = result as StreakData | null;
    cacheTime = Date.now();
    return cached;
  } catch {
    return null;
  }
}

export function clearStreakCache(): void {
  cached = null;
  cacheTime = 0;
}
