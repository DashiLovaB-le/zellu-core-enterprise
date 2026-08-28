import { createFileRoute } from "@tanstack/react-router";
import { Fragment, useEffect, useMemo, useState } from "react";
import { BRANDING } from "@/lib/branding";
import {
  AdminPageFrame,
  AdminSection,
  useAdminGate,
} from "@/components/admin/AdminShared";
import { Icon } from "@/components/Icon";
import {
  loadLandingLeads,
  saveLandingLead,
  removeLandingLead,
  type LandingLead,
  type LandingLeadStatus,
} from "@/lib/services/admin-service";

export const Route = createFileRoute("/dashiadmin/leads")({
  head: () => ({
    meta: [
      { title: `Leads — Admin ${BRANDING.shortName}` },
      { name: "description", content: "Pedidos de teste enviados pela landing." },
    ],
  }),
  component: AdminLeadsPage,
});

const STATUS_LABEL: Record<LandingLeadStatus, string> = {
  new: "Novo",
  contacted: "Contatado",
  in_progress: "Em andamento",
  qualified: "Qualificado",
  converted: "Convertido",
  archived: "Arquivado",
};

const STATUS_CLASS: Record<LandingLeadStatus, string> = {
  new: "bg-sky-50 text-sky-700",
  contacted: "bg-amber-50 text-amber-700",
  in_progress: "bg-violet-50 text-violet-700",
  qualified: "bg-emerald-50 text-emerald-700",
  converted: "bg-slate-900 text-white",
  archived: "bg-slate-100 text-slate-500",
};

const EMAIL_LABEL: Record<LandingLead["email_status"], string> = {
  pending: "E-mail pendente",
  sent: "E-mail enviado",
  skipped: "Sem e-mail",
  failed: "E-mail falhou",
};

const FILTERS: Array<{ id: "all" | LandingLeadStatus; label: string }> = [
  { id: "all", label: "Todos" },
  { id: "new", label: "Novos" },
  { id: "contacted", label: "Contatados" },
  { id: "in_progress", label: "Em andamento" },
  { id: "qualified", label: "Qualificados" },
  { id: "converted", label: "Convertidos" },
  { id: "archived", label: "Arquivados" },
];

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function AdminLeadsPage() {
  const { session, loading, isAuthorized } = useAdminGate();
  const [leads, setLeads] = useState<LandingLead[]>([]);
  const [ready, setReady] = useState(false);
  const [filter, setFilter] = useState<"all" | LandingLeadStatus>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const refresh = async () => {
    const list = await loadLandingLeads();
    setLeads(list);
  };

  useEffect(() => {
    if (!session || ready) return;
    (async () => {
      await refresh();
      setReady(true);
    })();
  }, [session, ready]);

  const visible = useMemo(
    () => (filter === "all" ? leads : leads.filter((lead) => lead.status === filter)),
    [filter, leads],
  );

  const newCount = leads.filter((lead) => lead.status === "new").length;

  const openLead = (lead: LandingLead) => {
    setOpenId(lead.id);
    setNotesDraft(lead.notes ?? "");
    setError("");
  };

  const handleStatus = async (id: string, status: LandingLeadStatus) => {
    setSaving(true);
    setError("");
    const result = await saveLandingLead({ id, status });
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    await refresh();
  };

  const handleNotes = async (id: string) => {
    setSaving(true);
    setError("");
    const result = await saveLandingLead({ id, notes: notesDraft });
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    await refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remover este pedido? Esta ação não pode ser desfeita.")) return;
    await removeLandingLead(id);
    if (openId === id) setOpenId(null);
    await refresh();
  };

  if (loading || !isAuthorized) return <AdminPageFrame loading />;

  return (
    <AdminPageFrame>
      <div>
        <h1 className="font-display text-2xl text-slate-800">Leads da landing</h1>
        <p className="mt-1 text-xs text-slate-500">
          Pedidos de teste do formulário público · {leads.length} no total
          {newCount > 0 ? ` · ${newCount} novos` : ""}
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-1.5">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold ${
              filter === item.id
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error && <p className="mt-3 text-xs text-rose-500">{error}</p>}

      <AdminSection title="Pedidos" subtitle="Tratamento comercial — nome, e-mail e empresa informados no formulário">
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-400">
                <th className="px-4 py-3 font-semibold">Quando</th>
                <th className="px-4 py-3 font-semibold">Nome</th>
                <th className="px-4 py-3 font-semibold">Empresa</th>
                <th className="px-4 py-3 font-semibold">E-mail</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Aviso</th>
                <th className="px-4 py-3 font-semibold" />
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-xs text-slate-400">
                    Nenhum pedido neste filtro.
                  </td>
                </tr>
              )}
              {visible.map((lead) => {
                const open = openId === lead.id;
                return (
                  <Fragment key={lead.id}>
                    <tr className="border-b border-slate-50 hover:bg-slate-50/80">
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                        {formatWhen(lead.created_at)}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800">{lead.name}</td>
                      <td className="px-4 py-3 text-slate-600">{lead.company}</td>
                      <td className="px-4 py-3">
                        <a
                          href={`mailto:${lead.email}`}
                          className="text-xs text-sky-700 hover:underline"
                        >
                          {lead.email}
                        </a>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_CLASS[lead.status]}`}
                        >
                          {STATUS_LABEL[lead.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[11px] text-slate-400">
                        {EMAIL_LABEL[lead.email_status]}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => (open ? setOpenId(null) : openLead(lead))}
                            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                            aria-label="Tratar pedido"
                          >
                            <Icon name="edit" className="text-sm" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(lead.id)}
                            className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                            aria-label="Remover pedido"
                          >
                            <Icon name="delete" className="text-sm" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {open && (
                      <tr className="border-b border-slate-100 bg-slate-50/70">
                        <td colSpan={7} className="px-4 py-4">
                          <div className="grid gap-3 md:grid-cols-[220px_1fr]">
                            <div>
                              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Tratamento
                              </label>
                              <select
                                value={lead.status}
                                disabled={saving}
                                onChange={(e) =>
                                  handleStatus(lead.id, e.target.value as LandingLeadStatus)
                                }
                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none"
                              >
                                {(Object.keys(STATUS_LABEL) as LandingLeadStatus[]).map((status) => (
                                  <option key={status} value={status}>
                                    {STATUS_LABEL[status]}
                                  </option>
                                ))}
                              </select>
                              {lead.email_error ? (
                                <p className="mt-2 text-[11px] text-rose-500">{lead.email_error}</p>
                              ) : null}
                            </div>
                            <div>
                              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Notas internas
                              </label>
                              <textarea
                                value={notesDraft}
                                onChange={(e) => setNotesDraft(e.target.value)}
                                rows={3}
                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none"
                                placeholder="O que foi combinado, próximo passo, responsável…"
                              />
                              <button
                                type="button"
                                disabled={saving}
                                onClick={() => handleNotes(lead.id)}
                                className="mt-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                              >
                                {saving ? "Salvando…" : "Salvar notas"}
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </AdminSection>
    </AdminPageFrame>
  );
}
