import {
  detectPatterns,
  getNotificationHistory,
  dismissNotification,
  getUnreadNotificationCount,
  type PreventiveAlert,
  type PreventiveNotification,
} from "@/lib/api/preventiva-ai.server";

export type { PreventiveAlert, PreventiveNotification } from "@/lib/api/preventiva-ai.server";

export async function loadPreventiveAlert(accessToken: string | null): Promise<PreventiveAlert> {
  if (!accessToken) {
    return {
      type: "none",
      severity: "none",
      message: "",
      suggestion: "",
      details: { sleepChange: 0, moodChange: 0, interactionChange: 0 },
    };
  }
  try {
    return await detectPatterns({ data: { accessToken } });
  } catch {
    return {
      type: "none",
      severity: "none",
      message: "",
      suggestion: "",
      details: { sleepChange: 0, moodChange: 0, interactionChange: 0 },
    };
  }
}

export async function loadNotificationHistory(
  accessToken: string | null,
  limit = 20,
): Promise<PreventiveNotification[]> {
  if (!accessToken) return [];
  try {
    return await getNotificationHistory({ data: { accessToken, limit } });
  } catch {
    return [];
  }
}

export async function dismissPreventiveNotification(
  accessToken: string | null,
  notificationId: string,
): Promise<{ success: boolean }> {
  if (!accessToken) return { success: false };
  try {
    return await dismissNotification({ data: { accessToken, notificationId } });
  } catch {
    return { success: false };
  }
}

export async function loadUnreadNotificationCount(
  accessToken: string | null,
): Promise<{ count: number }> {
  if (!accessToken) return { count: 0 };
  try {
    return await getUnreadNotificationCount({ data: { accessToken } });
  } catch {
    return { count: 0 };
  }
}
