import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import type { ManagerDirectoryMember, ManagerTeamRecord } from "@/lib/api/manager.server";

export function TeamEditorModal({
  team,
  members,
  candidates,
  busy,
  onClose,
  onRename,
  onAdd,
  onRemove,
}: {
  team: ManagerTeamRecord;
  members: ManagerDirectoryMember[];
  candidates: ManagerDirectoryMember[];
  busy: boolean;
  onClose: () => void;
  onRename: (name: string) => Promise<void>;
  onAdd: (profileId: string) => Promise<void>;
  onRemove: (profileId: string) => Promise<void>;
}) {
  const [nameDraft, setNameDraft] = useState(team.name);
  const [addId, setAddId] = useState("");

  useEffect(() => {
    setNameDraft(team.name);
    setAddId("");
  }, [team.id, team.name]);

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-900/40 p-3 sm:items-center">
      <div className="flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div>
            <h2 className="font-display text-base text-[var(--clay-title)]">Editar equipe</h2>
            <p className="text-[11px] text-[var(--clay-text)]/60">Nome e composição da equipe</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
            aria-label="Fechar"
          >
            <Icon name="close" className="text-lg" />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto px-4 py-4">
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Nome da equipe
            </span>
            <div className="flex gap-2">
              <input
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                maxLength={80}
                className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#99BEE5]"
              />
              <button
                type="button"
                disabled={busy || nameDraft.trim() === team.name || nameDraft.trim().length < 2}
                onClick={() => void onRename(nameDraft)}
                className="rounded-xl bg-gradient-to-br from-[#99BEE5] to-[#C5D9F1] px-3 py-2 text-xs font-semibold text-[oklch(0.25_0.04_254)] disabled:opacity-40"
              >
                Salvar
              </button>
            </div>
          </label>

          <section>
            <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Membros ({members.length})
            </h3>
            {members.length === 0 ? (
              <p className="rounded-xl bg-slate-50 px-3 py-4 text-center text-xs text-slate-400">
                Ninguém nesta equipe ainda.
              </p>
            ) : (
              <ul className="space-y-2">
                {members.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">
                        {m.display_name || "Sem nome"}
                      </p>
                      <p className="truncate text-[11px] text-slate-500">{m.email || "—"}</p>
                    </div>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void onRemove(m.id)}
                      className="shrink-0 rounded-lg px-2 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-50 disabled:opacity-40"
                    >
                      Remover
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Adicionar pessoa
            </h3>
            <div className="flex gap-2">
              <select
                value={addId}
                onChange={(e) => setAddId(e.target.value)}
                className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none"
              >
                <option value="">Selecionar colaborador…</option>
                {candidates.map((m) => (
                  <option key={m.id} value={m.id}>
                    {(m.display_name || m.email || m.id) +
                      (m.team_id ? " (outra equipe)" : " (sem equipe)")}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={busy || !addId}
                onClick={() => {
                  const id = addId;
                  setAddId("");
                  void onAdd(id);
                }}
                className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40"
              >
                Inserir
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
