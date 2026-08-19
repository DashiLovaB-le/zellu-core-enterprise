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

export async function loadDiaryEntries(): Promise<DiaryEntry[]> {
    try {
    const entries = await getDiaryEntries();
    return (entries ?? []) as DiaryEntry[];
  } catch {
    return [];
  }
}

export async function saveEntry(
  data: { content: string; mood?: string },
): Promise<{ data: DiaryEntry | null; error: string | null }> {
  try {
    const result = await apiSaveEntry({ data: { ...data } });
    if (!("data" in result)) {
      return { data: null, error: result.error };
    }
    return { data: result.data ?? null, error: result.error ?? null };
  } catch {
    return { data: null, error: "Erro ao salvar entrada" };
  }
}

export async function deleteEntry(
  entryId: string,
): Promise<{ error: string | null }> {
  try {
    return await apiDeleteEntry({ data: { entryId } });
  } catch {
    return { error: "Erro ao excluir entrada" };
  }
}
