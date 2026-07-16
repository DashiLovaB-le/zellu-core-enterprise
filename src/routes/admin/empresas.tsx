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
  saveCompany,
  removeCompany,
} from "@/lib/services/admin-service";
import type { AdminCompany } from "@/lib/api/admin.server";

export const Route = createFileRoute("/admin/empresas")({
  head: () => ({
    meta: [
      { title: `Empresas — Admin ${BRANDING.shortName}` },
      { name: "description", content: "Gerenciamento de empresas e clientes." },
    ],
  }),
  component: AdminEmpresasPage,
});

const EMPTY_FORM = {
  name: "",
  document: "",
  industry: "",
  contact_email: "",
  contact_phone: "",
  status: "active" as const,
  seats: 50,
  notes: "",
};

function AdminEmpresasPage() {
  const { session, loading, isAuthorized } = useAdminGate();
  const [companies, setCompanies] = useState<AdminCompany[]>([]);
  const [ready, setReady] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const refresh = async (token: string) => {
    const list = await loadCompanies(token);
    setCompanies(list);
  };

  useEffect(() => {
    if (!session?.access_token || ready) return;
    (async () => {
      await refresh(session.access_token!);
      setReady(true);
    })();
  }, [session, ready]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
    setError("");
  };

  const openEdit = (c: AdminCompany) => {
    setEditingId(c.id);
    setForm({
      name: c.name,
      document: c.document ?? "",
      industry: c.industry ?? "",
      contact_email: c.contact_email ?? "",
      contact_phone: c.contact_phone ?? "",
      status: (c.status as typeof EMPTY_FORM.status) || "active",
      seats: c.seats,
      notes: c.notes ?? "",
    });
    setShowForm(true);
    setError("");
  };

  const handleSave = async () => {
    if (!session?.access_token || !form.name.trim()) return;
    setSaving(true);
    setError("");
    const result = await saveCompany(session.access_token, {
      id: editingId ?? undefined,
      name: form.name,
      document: form.document || null,
      industry: form.industry || null,
      contact_email: form.contact_email || null,
      contact_phone: form.contact_phone || null,
      status: form.status,
      seats: form.seats,
      notes: form.notes || null,
    });
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setShowForm(false);
    await refresh(session.access_token);
  };

  const handleDelete = async (id: string) => {
    if (!session?.access_token) return;
    if (!confirm("Remover esta empresa? Equipes, licenças e contratos serão apagados.")) return;
    await removeCompany(session.access_token, id);
    await refresh(session.access_token);
  };

  if (loading || !isAuthorized) return <AdminPageFrame loading />;

  return (
    <AdminPageFrame>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="font-display text-2xl text-slate-800">Empresas / Clientes</h1>
          <p className="mt-1 text-xs text-slate-500">
            Contas B2B da Mundo Mental · {companies.length} registradas
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
        >
          <Icon name="add" className="text-sm" />
          Nova empresa
        </button>
      </div>

      {showForm && (
        <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-slate-800">
            {editingId ? "Editar empresa" : "Nova empresa"}
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Nome" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
            <Field
              label="Documento (CNPJ)"
              value={form.document}
              onChange={(v) => setForm({ ...form, document: v })}
            />
            <Field
              label="Setor"
              value={form.industry}
              onChange={(v) => setForm({ ...form, industry: v })}
            />
            <Field
              label="E-mail"
              value={form.contact_email}
              onChange={(v) => setForm({ ...form, contact_email: v })}
            />
            <Field
              label="Telefone"
              value={form.contact_phone}
              onChange={(v) => setForm({ ...form, contact_phone: v })}
            />
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value as typeof form.status })
                }
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none"
              >
                <option value="active">active</option>
                <option value="trial">trial</option>
                <option value="inactive">inactive</option>
                <option value="churned">churned</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Assentos
              </label>
              <input
                type="number"
                min={0}
                value={form.seats}
                onChange={(e) => setForm({ ...form, seats: Number(e.target.value) || 0 })}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none"
              />
            </div>
            <Field
              label="Notas"
              value={form.notes}
              onChange={(v) => setForm({ ...form, notes: v })}
            />
          </div>
          {error && <p className="mt-2 text-xs text-rose-500">{error}</p>}
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
            >
              {saving ? "Salvando…" : "Salvar"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-600"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <AdminSection title="Lista de clientes">
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-400">
                <th className="px-4 py-3 font-semibold">Empresa</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Colaboradores</th>
                <th className="px-4 py-3 font-semibold">Assentos</th>
                <th className="px-4 py-3 font-semibold">Contato</th>
                <th className="px-4 py-3 font-semibold" />
              </tr>
            </thead>
            <tbody>
              {companies.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-xs text-slate-400">
                    Nenhuma empresa cadastrada. Crie a primeira conta cliente.
                  </td>
                </tr>
              )}
              {companies.map((c) => (
                <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50/80">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{c.name}</p>
                    <p className="text-[11px] text-slate-400">{c.industry || "—"}</p>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-600">{c.employee_count ?? 0}</td>
                  <td className="px-4 py-3 text-slate-600">{c.seats}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{c.contact_email || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(c)}
                        className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      >
                        <Icon name="edit" className="text-sm" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(c.id)}
                        className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Icon name="delete" className="text-sm" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminSection>
    </AdminPageFrame>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-400"
      />
    </div>
  );
}
