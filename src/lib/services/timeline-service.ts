import { getTimelineData as apiGetTimeline, type TimelineData } from "@/lib/api/timeline.server";

export type { TimelineData, TimelineDay, TimelineEvent } from "@/lib/api/timeline.server";

export async function loadTimeline(): Promise<TimelineData> {
    try {
    return await apiGetTimeline();
  } catch {
    return { days: [], moodGrid: [], aiInsight: "Não foi possível carregar seus registros." };
  }
}
