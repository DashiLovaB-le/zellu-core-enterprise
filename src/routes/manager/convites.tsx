import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ManagerShell } from "@/components/ManagerShell";
import { useAuth } from "@/lib/auth-context";
import { BRANDING } from "@/lib/branding";
import {
  createInvite,
  listCompanyMembers,
  listInvites,
  setEmployeeActive,
} from "@/lib/api/invites.server";
import { listManagerTeams } from "@/lib/api/manager.server";

export const Route = createFileRoute("/manager/convites")({
  head: () => ({
    meta: [{ title: `Pessoas — ${BRANDING.shortName}` }],
  }),
  component: ManagerConvitesPage,
});

function ManagerConvitesPage() {
  const { session } = useAuth();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"companion" | "manager">("companion");
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [invites, setInvites] = useState<Array<{ id: string; email: string; role: string; accepted_at: string | null }>>([]);
  const [members, setMembers] = useState<
    Array<{ id: string; email: string | null; display_name: string | null; role: string; is_active: boolean }>
  >([]);

  const reload = async () => {
    if (!session) return;
    const [inv, mem] = await Promise.all([
      listInvites({ data: {} }),
      listCompanyMembers(),
    ]);
    setInvites((inv.data ?? []) as typeof invites);
    setMembers((mem.data ?? []) as typeof members);
  };

  useEffect(() => {
    void reload();
    void listManagerTeams();
  }, [session]);

  const sendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInviteUrl(null);
    const result = await createInvite({
      data: { email, role },
    });
    if (result.error) {
      setError(result.error);
      return;
    }
    setInviteUrl(result.inviteUrl);
    setEmail("");
    await reload();
  };

  return (
    <ManagerShell>
      <h1 className="font-display text-2xl text-[var(--clay-title)]">Pessoas e convites</h1>
      <p className="mt-1 text-xs text-[var(--clay-text)]/70">
        Convites substituem o cadastro aberto. Novos acessos respeitam as licenças da empresa.
      </p>

      <form onSubmit={sendInvite} className="mt-5 flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@empresa.com"
          className="flex-1 rounded-xl bg-white/70 px-3 py-2 text-sm outline-none shadow-sm"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as "companion" | "manager")}
          className="rounded-xl bg-white/70 px-3 py-2 text-sm outline-none shadow-sm"
        >
          <option value="companion">Colaborador</option>
          <option value="manager">RH</option>
        </select>
        <button
          type="submit"
          className="rounded-xl bg-gradient-to-br from-[#99BEE5] to-[#C5D9F1] px-4 py-2 text-sm font-bold text-[oklch(0.25_0.04_254)]"
        >
          Gerar convite
        </button>
      </form>
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
      {inviteUrl && (
        <p className="mt-2 break-all text-xs text-[var(--clay-text)]">
          Link: {inviteUrl}
        </p>
      )}

      <h2 className="mt-8 text-sm font-bold text-[var(--clay-title)]">Convites</h2>
      <ul className="mt-2 space-y-2">
        {invites.map((inv) => (
          <li key={inv.id} className="rounded-xl bg-white/70 p-3 text-xs shadow-sm">
            {inv.email} · {inv.role} · {inv.accepted_at ? "aceito" : "pendente"}
          </li>
        ))}
      </ul>

      <h2 className="mt-8 text-sm font-bold text-[var(--clay-title)]">Equipe</h2>
      <ul className="mt-2 space-y-2">
        {members.map((m) => (
          <li key={m.id} className="flex items-center justify-between rounded-xl bg-white/70 p-3 text-xs shadow-sm">
            <span>
              {m.display_name ?? m.email} · {m.role}
            </span>
            <button
              type="button"
              onClick={async () => {
                await setEmployeeActive({
                  data: { profileId: m.id, isActive: !m.is_active },
                });
                await reload();
              }}
              className="font-semibold text-[var(--clay-cta)]"
            >
              {m.is_active ? "Desativar" : "Reativar"}
            </button>
          </li>
        ))}
      </ul>
    </ManagerShell>
  );
}
