import { getTimelineData as apiGetTimeline, type TimelineData } from "@/lib/api/timeline.server";

export type { TimelineData, TimelineDay, TimelineEvent } from "@/lib/api/timeline.server";

export async function loadTimeline(accessToken: string | null): Promise<TimelineData> {
  if (!accessToken) return { days: [], moodGrid: [], aiInsight: "Faça login para ver seu diário." };
  try {
    return await apiGetTimeline({ data: { accessToken } });
  } catch {
    return { days: [], moodGrid: [], aiInsight: "Não foi possível carregar seus registros." };
  }
}
