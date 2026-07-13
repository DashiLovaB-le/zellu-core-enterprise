import { AI_SUMMARY } from "@/data";
import { getDiaryEntries } from "@/lib/api/diario.server";

export async function loadDiarySummary(accessToken: string | null): Promise<string> {
  if (!accessToken) return AI_SUMMARY;
  try {
    const entries = await getDiaryEntries({ data: { accessToken } });
    if (entries.length > 0) {
      return "Seu diário está sincronizado.";
    }
  } catch {
    // fallback
  }
  return AI_SUMMARY;
}
