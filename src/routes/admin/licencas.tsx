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
  loadLicenses,
  loadContracts,
  saveLicense,
  saveContract,
} from "@/lib/services/admin-service";
import type { AdminCompany, AdminLicense, AdminContract } from "@/lib/api/admin.server";

export const Route = createFileRoute("/admin/licencas")({
  head: () => ({
    meta: [
      { title: `Licenças — Admin ${BRANDING.shortName}` },
      { name: "description", content: "Licenças e contratos dos clientes." },
    ],
  }),
  component: AdminLicencasPage,
});

function AdminLicencasPage() {
  const { session, loading, isAuthorized } = useAdminGate();
  const [licenses, setLicenses] = useState<AdminLicense[]>([]);
  const [contracts, setContracts] = useState<AdminContract[]>([]);
  const [companies, setCompanies] = useState<AdminCompany[]>([]);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<"licenses" | "contracts">("licenses");
  const [showLicenseForm, setShowLicenseForm] = useState(false);
  const [showContractForm, setShowContractForm] = useState(false);
  const [licenseForm, setLicenseForm] = useState({
    company_id: "",
    plan_name: "standard",
    seats: 50,
    seats_used: 0,
    status: "active" as const,
    ends_at: "",
  });
  const [contractForm, setContractForm] = useState({
    company_id: "",
    title: "",
    contract_type: "saas" as const,
    value_brl: 0,
    status: "draft" as const,
    starts_at: "",
    ends_at: "",
    notes: "",
  });
  const [error, setError] = useState("");

  const refresh = async (token: string) => {
    const [l, c, comps] = await Promise.all([
      loadLicenses(token),
      loadContracts(token),
      loadCompanies(token),
    ]);
    setLicenses(l);
    setContracts(c);
    setCompanies(comps);
  };

  useEffect(() => {
    if (!session?.access_token || ready) return;
    (async () => {
      await refresh(session.access_token!);
      setReady(true);
    })();
  }, [session, ready]);

  const handleSaveLicense = async () => {
    if (!session?.access_token || !licenseForm.company_id) return;
    setError("");
    const result = await saveLicense(session.access_token, {
      company_id: licenseForm.company_id,
      plan_name: licenseForm.plan_name,
      seats: licenseForm.seats,
      seats_used: licenseForm.seats_used,
      status: licenseForm.status,
      ends_at: licenseForm.ends_at || null,
    });
    if (result.error) {
      setError(result.error);
      return;
    }
    setShowLicenseForm(false);
    await refresh(session.access_token);
  };

  const handleSaveContract = async () => {
    if (!session?.access_token || !contractForm.company_id || !contractForm.title.trim()) return;
    setError("");
    const result = await saveContract(session.access_token, {
      company_id: contractForm.company_id,
      title: contractForm.title,
      contract_type: contractForm.contract_type,
      value_brl: contractForm.value_brl,
      status: contractForm.status,
      starts_at: contractForm.starts_at || null,
      ends_at: contractForm.ends_at || null,
      notes: contractForm.notes || null,
    });
    if (result.error) {
      setError(result.error);
      return;
    }
    setShowContractForm(false);
    await refresh(session.access_token);
  };

  if (loading || !isAuthorized) return <AdminPageFrame loading />;

  return (
    <AdminPageFrame>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="font-display text-2xl text-slate-800">Licenças e Contratos</h1>
          <p className="mt-1 text-xs text-slate-500">
            Controle comercial de planos, assentos e contratos
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setTab("licenses")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
              tab === "licenses" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"
            }`}
          >
            Licenças
          </button>
          <button
            type="button"
            onClick={() => setTab("contracts")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
              tab === "contracts" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"
            }`}
          >
            Contratos
          </button>
        </div>
      </div>

      {error && <p className="mt-3 text-xs text-rose-500">{error}</p>}

      {tab === "licenses" && (
        <AdminSection
          title={`Licenças (${licenses.length})`}
          action={
            <button
              type="button"
              onClick={() => setShowLicenseForm(true)}
              className="flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white"
            >
              <Icon name="add" className="text-sm" /> Nova
            </button>
          }
        >
          {showLicenseForm && (
            <div className="mb-4 grid grid-cols-1 gap-2 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2">
              <select
                value={licenseForm.company_id}
                onChange={(e) => setLicenseForm({ ...licenseForm, company_id: e.target.value })}
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
                value={licenseForm.plan_name}
                onChange={(e) => setLicenseForm({ ...licenseForm, plan_name: e.target.value })}
                placeholder="Plano"
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <input
                type="number"
                value={licenseForm.seats}
                onChange={(e) =>
                  setLicenseForm({ ...licenseForm, seats: Number(e.target.value) || 0 })
                }
                placeholder="Assentos"
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <input
                type="date"
                value={licenseForm.ends_at}
                onChange={(e) => setLicenseForm({ ...licenseForm, ends_at: e.target.value })}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <div className="flex gap-2 sm:col-span-2">
                <button
                  type="button"
                  onClick={handleSaveLicense}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
                >
                  Salvar
                </button>
                <button
                  type="button"
                  onClick={() => setShowLicenseForm(false)}
                  className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-400">
                  <th className="px-4 py-3 font-semibold">Empresa</th>
                  <th className="px-4 py-3 font-semibold">Plano</th>
                  <th className="px-4 py-3 font-semibold">Assentos</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Vigência</th>
                </tr>
              </thead>
              <tbody>
                {licenses.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-xs text-slate-400">
                      Nenhuma licença cadastrada.
                    </td>
                  </tr>
                )}
                {licenses.map((l) => (
                  <tr key={l.id} className="border-b border-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{l.company_name}</td>
                    <td className="px-4 py-3 text-slate-600">{l.plan_name}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {l.seats_used}/{l.seats}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={l.status} />
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {l.starts_at}
                      {l.ends_at ? ` → ${l.ends_at}` : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminSection>
      )}

      {tab === "contracts" && (
        <AdminSection
          title={`Contratos (${contracts.length})`}
          action={
            <button
              type="button"
              onClick={() => setShowContractForm(true)}
              className="flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white"
            >
              <Icon name="add" className="text-sm" /> Novo
            </button>
          }
        >
          {showContractForm && (
            <div className="mb-4 grid grid-cols-1 gap-2 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2">
              <select
                value={contractForm.company_id}
                onChange={(e) => setContractForm({ ...contractForm, company_id: e.target.value })}
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
                value={contractForm.title}
                onChange={(e) => setContractForm({ ...contractForm, title: e.target.value })}
                placeholder="Título do contrato"
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <select
                value={contractForm.contract_type}
                onChange={(e) =>
                  setContractForm({
                    ...contractForm,
                    contract_type: e.target.value as typeof contractForm.contract_type,
                  })
                }
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="saas">saas</option>
                <option value="pilot">pilot</option>
                <option value="enterprise">enterprise</option>
                <option value="renewal">renewal</option>
              </select>
              <input
                type="number"
                value={contractForm.value_brl}
                onChange={(e) =>
                  setContractForm({ ...contractForm, value_brl: Number(e.target.value) || 0 })
                }
                placeholder="Valor R$"
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <div className="flex gap-2 sm:col-span-2">
                <button
                  type="button"
                  onClick={handleSaveContract}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
                >
                  Salvar
                </button>
                <button
                  type="button"
                  onClick={() => setShowContractForm(false)}
                  className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-400">
                  <th className="px-4 py-3 font-semibold">Título</th>
                  <th className="px-4 py-3 font-semibold">Empresa</th>
                  <th className="px-4 py-3 font-semibold">Tipo</th>
                  <th className="px-4 py-3 font-semibold">Valor</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {contracts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-xs text-slate-400">
                      Nenhum contrato cadastrado.
                    </td>
                  </tr>
                )}
                {contracts.map((c) => (
                  <tr key={c.id} className="border-b border-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{c.title}</td>
                    <td className="px-4 py-3 text-slate-600">{c.company_name}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{c.contract_type}</td>
                    <td className="px-4 py-3 text-slate-600">
                      R$ {Number(c.value_brl).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={c.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminSection>
      )}
    </AdminPageFrame>
  );
}
