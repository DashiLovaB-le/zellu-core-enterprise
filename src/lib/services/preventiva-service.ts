import { detectPatterns, type PreventiveAlert } from "@/lib/api/preventiva-ai.server";

export type { PreventiveAlert } from "@/lib/api/preventiva-ai.server";

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
