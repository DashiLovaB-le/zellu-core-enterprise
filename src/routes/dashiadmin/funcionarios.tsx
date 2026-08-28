import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BRANDING } from "@/lib/branding";
import {
  AdminPageFrame,
  AdminSection,
  StatusBadge,
  useAdminGate,
} from "@/components/admin/AdminShared";
import { Icon } from "@/components/Icon";
import {
  loadCompanies,
  loadEmployees,
  loadTeams,
  saveEmployee,
  saveTeam,
} from "@/lib/services/admin-service";
import type { AdminCompany, AdminEmployee } from "@/lib/api/admin.server";

export const Route = createFileRoute("/dashiadmin/funcionarios")({
  head: () => ({
    meta: [
      { title: `Funcionários — Admin ${BRANDING.shortName}` },
      { name: "description", content: "Gerenciamento de funcionários e equipes." },
    ],
  }),
  component: AdminFuncionariosPage,
});

type TeamRow = { id: string; company_id: string; name: string; description?: string | null };

function AdminFuncionariosPage() {
  const { session, loading, isAuthorized } = useAdminGate();
  const [employees, setEmployees] = useState<AdminEmployee[]>([]);
  const [companies, setCompanies] = useState<AdminCompany[]>([]);
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [filterCompany, setFilterCompany] = useState("");
  const [ready, setReady] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    company_id: "",
    team_id: "",
    job_title: "",
    role: "companion" as "companion" | "manager",
    is_active: true,
  });
  const [teamForm, setTeamForm] = useState({ company_id: "", name: "" });
  const [msg, setMsg] = useState("");

  const refresh = async (companyId?: string) => {
    const [emps, comps, tms] = await Promise.all([
      loadEmployees(companyId || undefined),
      loadCompanies(),
      loadTeams(companyId || undefined),
    ]);
    setEmployees(emps);
    setCompanies(comps);
    setTeams(tms as TeamRow[]);
  };

  useEffect(() => {
    if (!session || ready) return;
    (async () => {
      await refresh();
      setReady(true);
    })();
  }, [session, ready]);

  const applyFilter = async (companyId: string) => {
    setFilterCompany(companyId);
    if (!session) return;
    await refresh(companyId || undefined);
  };

  const openEdit = (e: AdminEmployee) => {
    setEditId(e.id);
    setEditForm({
      company_id: e.company_id ?? "",
      team_id: e.team_id ?? "",
      job_title: e.job_title ?? "",
      role: e.role === "manager" ? "manager" : "companion",
      is_active: e.is_active,
    });
  };

  const handleSaveEmployee = async () => {
    if (!session || !editId) return;
    const result = await saveEmployee({
      id: editId,
      company_id: editForm.company_id || null,
      team_id: editForm.team_id || null,
      job_title: editForm.job_title || null,
      role: editForm.role,
      is_active: editForm.is_active,
    });
    if (result.error) {
      setMsg(result.error);
      return;
    }
    setEditId(null);
    setMsg("Funcionário atualizado");
    await refresh(filterCompany || undefined);
    setTimeout(() => setMsg(""), 2000);
  };

  const handleCreateTeam = async () => {
    if (!session || !teamForm.company_id || !teamForm.name.trim()) return;
    const result = await saveTeam({
      company_id: teamForm.company_id,
      name: teamForm.name,
    });
    if (result.error) {
      setMsg(result.error);
      return;
    }
    setTeamForm({ company_id: "", name: "" });
    setMsg("Equipe criada");
    await refresh(filterCompany || undefined);
    setTimeout(() => setMsg(""), 2000);
  };

  if (loading || !isAuthorized) return <AdminPageFrame loading />;

  const filteredTeams = editForm.company_id
    ? teams.filter((t) => t.company_id === editForm.company_id)
    : teams;

  return (
    <AdminPageFrame>
      <div>
        <h1 className="font-display text-2xl text-slate-800">Funcionários</h1>
        <p className="mt-1 text-xs text-slate-500">
          Vincule colaboradores e gestores às empresas e equipes
        </p>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <select
          value={filterCompany}
          onChange={(e) => applyFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
        >
          <option value="">Todas as empresas</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {msg && <span className="text-xs text-emerald-600">{msg}</span>}
      </div>

      <AdminSection title="Equipes" subtitle="Crie departamentos dentro de cada cliente">
        <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <select
            value={teamForm.company_id}
            onChange={(e) => setTeamForm({ ...teamForm, company_id: e.target.value })}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">Empresa…</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            value={teamForm.name}
            onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
            placeholder="Nome da equipe"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={handleCreateTeam}
            className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white"
          >
            Criar equipe
          </button>
        </div>
        {teams.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {teams.map((t) => (
              <span
                key={t.id}
                className="rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600"
              >
                {t.name}
              </span>
            ))}
          </div>
        )}
      </AdminSection>

      <AdminSection title={`Pessoas (${employees.length})`}>
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-400">
                <th className="px-4 py-3 font-semibold">Nome</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Empresa</th>
                <th className="px-4 py-3 font-semibold">Equipe</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold" />
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-xs text-slate-400">
                    Nenhum funcionário encontrado.
                  </td>
                </tr>
              )}
              {employees.map((e) => (
                <tr key={e.id} className="border-b border-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{e.display_name || "—"}</p>
                    <p className="text-[11px] text-slate-400">{e.email}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">{e.role}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">{e.company_name || "—"}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">{e.team_name || "—"}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={e.is_active ? "active" : "inactive"} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => openEdit(e)}
                      className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100"
                    >
                      <Icon name="edit" className="text-sm" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminSection>

      {editId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
            <h3 className="font-display text-base text-slate-800">Editar funcionário</h3>
            <div className="mt-4 space-y-3">
              <select
                value={editForm.company_id}
                onChange={(e) =>
                  setEditForm({ ...editForm, company_id: e.target.value, team_id: "" })
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="">Sem empresa</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <select
                value={editForm.team_id}
                onChange={(e) => setEditForm({ ...editForm, team_id: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="">Sem equipe</option>
                {filteredTeams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <input
                value={editForm.job_title}
                onChange={(e) => setEditForm({ ...editForm, job_title: e.target.value })}
                placeholder="Cargo"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <select
                value={editForm.role}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    role: e.target.value as "companion" | "manager",
                  })
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="companion">companion</option>
                <option value="manager">manager</option>
              </select>
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={editForm.is_active}
                  onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                />
                Ativo
              </label>
            </div>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={handleSaveEmployee}
                className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
              >
                Salvar
              </button>
              <button
                type="button"
                onClick={() => setEditId(null)}
                className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-600"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminPageFrame>
  );
}
