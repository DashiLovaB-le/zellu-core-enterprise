import { AI_SUMMARY } from "@/data";
import {
  getDiaryEntries,
  saveDiaryEntry as apiSaveEntry,
  deleteDiaryEntry as apiDeleteEntry,
} from "@/lib/api/diario.server";

export type DiaryEntry = {
  id: string;
  user_id: string;
  content: string;
  mood: string | null;
  created_at: string;
  updated_at: string;
};

export async function loadDiaryEntries(accessToken: string | null): Promise<DiaryEntry[]> {
  if (!accessToken) return [];
  try {
    const entries = await getDiaryEntries({ data: { accessToken } });
    return (entries ?? []) as DiaryEntry[];
  } catch {
    return [];
  }
}

export async function saveEntry(
  accessToken: string,
  data: { content: string; mood?: string },
): Promise<{ data: DiaryEntry | null; error: string | null }> {
  try {
    return await apiSaveEntry({ data: { accessToken, ...data } });
  } catch {
    return { data: null, error: "Erro ao salvar entrada" };
  }
}

export async function deleteEntry(
  accessToken: string,
  entryId: string,
): Promise<{ error: string | null }> {
  try {
    return await apiDeleteEntry({ data: { accessToken, entryId } });
  } catch {
    return { error: "Erro ao excluir entrada" };
  }
}
