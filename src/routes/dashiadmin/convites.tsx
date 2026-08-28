import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BRANDING } from "@/lib/branding";
import {
  AdminPageFrame,
  AdminSection,
  useAdminGate,
} from "@/components/admin/AdminShared";
import { Icon } from "@/components/Icon";
import { cancelInvite, createInvite, listInvites } from "@/lib/api/invites.server";
import { loadCompanies, loadTeams } from "@/lib/services/admin-service";
import type { AdminCompany } from "@/lib/api/admin.server";

export const Route = createFileRoute("/dashiadmin/convites")({
  head: () => ({
    meta: [
      { title: `Convites — Admin ${BRANDING.shortName}` },
      { name: "description", content: "Envie convites de acesso para gestores RH e colaboradores." },
    ],
  }),
  component: AdminConvitesPage,
});

type InviteRow = {
  id: string;
  email: string;
  role: string;
  team_id: string | null;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
  company_id: string;
};

type TeamRow = { id: string; company_id: string; name: string };

function inviteStatus(inv: InviteRow) {
  if (inv.accepted_at) return "aceito";
  if (new Date(inv.expires_at) < new Date()) return "expirado";
  return "pendente";
}

function AdminConvitesPage() {
  const { session, loading, isAuthorized } = useAdminGate();
  const [companies, setCompanies] = useState<AdminCompany[]>([]);
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [invites, setInvites] = useState<InviteRow[]>([]);
  const [ready, setReady] = useState(false);

  const [filterCompanyId, setFilterCompanyId] = useState("");
  const [formCompanyId, setFormCompanyId] = useState("");
  const [formTeamId, setFormTeamId] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"companion" | "manager">("manager");

  const [submitting, setSubmitting] = useState(false);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const companyMap = useMemo(
    () => Object.fromEntries(companies.map((c) => [c.id, c.name])),
    [companies],
  );

  const formTeams = useMemo(
    () => teams.filter((t) => t.company_id === formCompanyId),
    [teams, formCompanyId],
  );

  const reloadInvites = useCallback(
    async (companyId?: string) => {
      const result = await listInvites({
        data: companyId ? { companyId } : {},
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      setInvites((result.data ?? []) as InviteRow[]);
    },
    [],
  );

  const refresh = useCallback(async () => {
    const [comps, tms] = await Promise.all([loadCompanies(), loadTeams()]);
    setCompanies(comps);
    setTeams(tms as TeamRow[]);
    await reloadInvites(filterCompanyId || undefined);
  }, [filterCompanyId, reloadInvites]);

  useEffect(() => {
    if (!session || ready) return;
    void (async () => {
      await refresh();
      setReady(true);
    })();
  }, [session, ready, refresh]);

  useEffect(() => {
    if (!ready) return;
    void reloadInvites(filterCompanyId || undefined);
  }, [filterCompanyId, ready, reloadInvites]);

  useEffect(() => {
    setFormTeamId("");
  }, [formCompanyId]);

  const handleCopyLink = async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Não foi possível copiar o link. Selecione e copie manualmente.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCompanyId) {
      setError("Selecione a empresa do convite.");
      return;
    }
    setSubmitting(true);
    setError(null);
    setFeedback(null);
    setInviteUrl(null);
    setCopied(false);

    const trimmedEmail = email.trim();
    const result = await createInvite({
      data: {
        email: trimmedEmail,
        role,
        companyId: formCompanyId,
        teamId: formTeamId || null,
      },
    });

    setSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (result.emailSent) {
      setFeedback(`Convite enviado para ${trimmedEmail}. A pessoa receberá um e-mail com o link de acesso.`);
      setInviteUrl(null);
    } else if (result.emailSkipped) {
      setFeedback("Convite criado. E-mail não configurado — copie o link abaixo e envie ao gestor.");
      setInviteUrl(result.inviteUrl);
    } else {
      setFeedback(
        result.emailError
          ? "Convite criado, mas o e-mail falhou. Copie o link abaixo."
          : "Convite criado.",
      );
      setInviteUrl(result.inviteUrl);
      if (result.emailError) setError(`E-mail: ${result.emailError}`);
    }

    setEmail("");
    await reloadInvites(filterCompanyId || undefined);
  };

  const handleCancel = async (inv: InviteRow) => {
    if (inv.accepted_at) return;
    if (!window.confirm(`Cancelar convite para ${inv.email}? O link deixará de funcionar.`)) return;

    setCancelingId(inv.id);
    setError(null);
    const result = await cancelInvite({ data: { inviteId: inv.id } });
    setCancelingId(null);
    if (result.error) {
      setError(result.error);
      return;
    }
    await reloadInvites(filterCompanyId || undefined);
  };

  if (loading || !isAuthorized) return <AdminPageFrame loading />;

  return (
    <AdminPageFrame>
      <div>
        <h1 className="font-display text-2xl text-slate-800">Convites de acesso</h1>
        <p className="mt-1 max-w-2xl text-xs text-slate-500">
          Use após cadastrar a empresa e a licença. O primeiro convite costuma ser{" "}
          <strong className="font-semibold text-slate-700">RH (manager)</strong> — a pessoa cria a
          senha em <code className="rounded bg-slate-100 px-1">/aceitar-convite</code> e acessa o
          painel em <code className="rounded bg-slate-100 px-1">/manager</code>.
        </p>
      </div>

      {error && <p className="mt-4 text-xs text-rose-500">{error}</p>}
      {feedback && <p className="mt-4 text-xs text-emerald-700">{feedback}</p>}

      {inviteUrl && (
        <div className="mt-3 flex flex-col gap-2 rounded-xl border border-sky-200 bg-sky-50/80 p-3 sm:flex-row sm:items-center">
          <p className="min-w-0 flex-1 break-all text-[11px] text-slate-700">{inviteUrl}</p>
          <button
            type="button"
            onClick={() => void handleCopyLink()}
            className="shrink-0 rounded-lg bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-white"
          >
            {copied ? "Copiado!" : "Copiar link"}
          </button>
        </div>
      )}

      <AdminSection
        title="Novo convite"
        subtitle="Empresa + e-mail corporativo + papel (RH ou colaborador)"
      >
        <form
          onSubmit={(e) => void handleSubmit(e)}
          className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2"
        >
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Empresa *
            </span>
            <select
              required
              value={formCompanyId}
              onChange={(e) => setFormCompanyId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
            >
              <option value="">Selecione a empresa cliente…</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.status !== "active" ? ` (${c.status})` : ""}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              E-mail *
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="rh@empresa.com"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Papel *
            </span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "companion" | "manager")}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="manager">RH / Gestor (manager)</option>
              <option value="companion">Colaborador (companion)</option>
            </select>
          </label>

          <label className="block sm:col-span-2">
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Equipe (opcional)
            </span>
            <select
              value={formTeamId}
              onChange={(e) => setFormTeamId(e.target.value)}
              disabled={!formCompanyId || formTeams.length === 0}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-50"
            >
              <option value="">Sem equipe definida</option>
              {formTeams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
            >
              <Icon name="send" className="text-sm" />
              {submitting ? "Enviando…" : "Gerar convite"}
            </button>
          </div>
        </form>
      </AdminSection>

      <AdminSection title={`Convites (${invites.length})`} subtitle="Filtre por empresa ou veja todos">
        <div className="mb-3">
          <select
            value={filterCompanyId}
            onChange={(e) => setFilterCompanyId(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
          >
            <option value="">Todas as empresas</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-400">
                <th className="px-4 py-3 font-semibold">E-mail</th>
                <th className="px-4 py-3 font-semibold">Empresa</th>
                <th className="px-4 py-3 font-semibold">Papel</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Criado</th>
                <th className="px-4 py-3 font-semibold" />
              </tr>
            </thead>
            <tbody>
              {invites.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-xs text-slate-400">
                    Nenhum convite encontrado.
                  </td>
                </tr>
              )}
              {invites.map((inv) => {
                const status = inviteStatus(inv);
                const canCancel = !inv.accepted_at;
                return (
                  <tr key={inv.id} className="border-b border-slate-50">
                    <td className="px-4 py-3 text-slate-800">{inv.email}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {companyMap[inv.company_id] ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {inv.role === "manager" ? "RH" : "Colaborador"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase ${
                          status === "aceito"
                            ? "bg-emerald-50 text-emerald-700"
                            : status === "expirado"
                              ? "bg-slate-100 text-slate-500"
                              : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[11px] text-slate-500">
                      {new Date(inv.created_at).toLocaleString("pt-BR")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {canCancel ? (
                        <button
                          type="button"
                          disabled={cancelingId === inv.id}
                          onClick={() => void handleCancel(inv)}
                          className="text-[11px] font-semibold text-rose-500 hover:text-rose-600 disabled:opacity-50"
                        >
                          {cancelingId === inv.id ? "Cancelando…" : "Cancelar"}
                        </button>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </AdminSection>
    </AdminPageFrame>
  );
}
