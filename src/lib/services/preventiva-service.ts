import {
  detectPatterns,
  getNotificationHistory,
  dismissNotification,
  getUnreadNotificationCount,
  type PreventiveAlert,
  type PreventiveNotification,
} from "@/lib/api/preventiva-ai.server";

export type { PreventiveAlert, PreventiveNotification } from "@/lib/api/preventiva-ai.server";

const EMPTY_ALERT: PreventiveAlert = {
  type: "none",
  severity: "none",
  message: "",
  suggestion: "",
  details: { sleepChange: 0, moodChange: 0, interactionChange: 0 },
};

export async function loadPreventiveAlert(): Promise<PreventiveAlert> {
  try {
    return await detectPatterns();
  } catch {
    return EMPTY_ALERT;
  }
}

export async function loadNotificationHistory(limit = 20): Promise<PreventiveNotification[]> {
  try {
    return await getNotificationHistory({ data: { limit } });
  } catch {
    return [];
  }
}

export async function dismissPreventiveNotification(
  notificationId: string,
): Promise<{ success: boolean }> {
  try {
    return await dismissNotification({ data: { notificationId } });
  } catch {
    return { success: false };
  }
}

export async function loadUnreadNotificationCount(): Promise<{ count: number }> {
  try {
    return await getUnreadNotificationCount();
  } catch {
    return { count: 0 };
  }
}
