import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BRANDING } from "@/lib/branding";
import {
  AdminPageFrame,
  AdminSection,
  useAdminGate,
} from "@/components/admin/AdminShared";
import { Icon } from "@/components/Icon";
import {
  loadAlertConfigs,
  loadCompanies,
  loadEvaluatedAlerts,
  saveAlertConfig,
} from "@/lib/services/admin-service";
import type { AdminAlertConfig, AdminCompany, AdminEvaluatedAlert } from "@/lib/api/admin.server";

export const Route = createFileRoute("/admin/alertas")({
  head: () => ({
    meta: [
      { title: `Alertas — Admin ${BRANDING.shortName}` },
      { name: "description", content: "Alertas configuráveis por empresa." },
    ],
  }),
  component: AdminAlertasPage,
});

function AdminAlertasPage() {
  const { session, loading, isAuthorized } = useAdminGate();
  const [configs, setConfigs] = useState<AdminAlertConfig[]>([]);
  const [alerts, setAlerts] = useState<AdminEvaluatedAlert[]>([]);
  const [companies, setCompanies] = useState<AdminCompany[]>([]);
  const [ready, setReady] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    company_id: "",
    mood_negative_warn: 20,
    mood_negative_critical: 40,
    sleep_hours_min: 6,
    water_ml_min: 1000,
    adhesion_min_pct: 40,
    enabled: true,
  });
  const [error, setError] = useState("");

  const refresh = async () => {
    const [c, a, comps] = await Promise.all([
      loadAlertConfigs(),
      loadEvaluatedAlerts(),
      loadCompanies(),
    ]);
    setConfigs(c);
    setAlerts(a);
    setCompanies(comps);
  };

  useEffect(() => {
    if (!session || ready) return;
    (async () => {
      await refresh();
      setReady(true);
    })();
  }, [session, ready]);

  const openCreate = () => {
    setEditingId(null);
    setForm({
      name: "",
      company_id: "",
      mood_negative_warn: 20,
      mood_negative_critical: 40,
      sleep_hours_min: 6,
      water_ml_min: 1000,
      adhesion_min_pct: 40,
      enabled: true,
    });
    setShowForm(true);
    setError("");
  };

  const openEdit = (c: AdminAlertConfig) => {
    setEditingId(c.id);
    setForm({
      name: c.name,
      company_id: c.company_id ?? "",
      mood_negative_warn: c.mood_negative_warn,
      mood_negative_critical: c.mood_negative_critical,
      sleep_hours_min: c.sleep_hours_min,
      water_ml_min: c.water_ml_min,
      adhesion_min_pct: c.adhesion_min_pct,
      enabled: c.enabled,
    });
    setShowForm(true);
    setError("");
  };

  const handleSave = async () => {
    if (!session || !form.name.trim()) return;
    const result = await saveAlertConfig({
      id: editingId ?? undefined,
      name: form.name,
      company_id: form.company_id || null,
      mood_negative_warn: form.mood_negative_warn,
      mood_negative_critical: form.mood_negative_critical,
      sleep_hours_min: form.sleep_hours_min,
      water_ml_min: form.water_ml_min,
      adhesion_min_pct: form.adhesion_min_pct,
      enabled: form.enabled,
    });
    if (result.error) {
      setError(result.error);
      return;
    }
    setShowForm(false);
    await refresh();
  };

  if (loading || !isAuthorized) return <AdminPageFrame loading />;

  return (
    <AdminPageFrame>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="font-display text-2xl text-slate-800">Alertas configuráveis</h1>
          <p className="mt-1 text-xs text-slate-500">
            Thresholds globais ou por empresa · avaliação automática
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-1 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
        >
          <Icon name="add" className="text-sm" />
          Nova regra
        </button>
      </div>

      {showForm && (
        <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-slate-800">
            {editingId ? "Editar regra" : "Nova regra"}
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Nome da regra"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            <select
              value={form.company_id}
              onChange={(e) => setForm({ ...form, company_id: e.target.value })}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="">Global (todas)</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <NumField
              label="Humor negativo — alerta %"
              value={form.mood_negative_warn}
              onChange={(v) => setForm({ ...form, mood_negative_warn: v })}
            />
            <NumField
              label="Humor negativo — crítico %"
              value={form.mood_negative_critical}
              onChange={(v) => setForm({ ...form, mood_negative_critical: v })}
            />
            <NumField
              label="Sono mínimo (h)"
              value={form.sleep_hours_min}
              onChange={(v) => setForm({ ...form, sleep_hours_min: v })}
            />
            <NumField
              label="Água mínima (ml)"
              value={form.water_ml_min}
              onChange={(v) => setForm({ ...form, water_ml_min: v })}
            />
            <NumField
              label="Adesão mínima %"
              value={form.adhesion_min_pct}
              onChange={(v) => setForm({ ...form, adhesion_min_pct: v })}
            />
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={form.enabled}
                onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
              />
              Habilitada
            </label>
          </div>
          {error && <p className="mt-2 text-xs text-rose-500">{error}</p>}
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
            >
              Salvar
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

      <AdminSection title="Regras">
        <div className="space-y-2">
          {configs.length === 0 && (
            <p className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center text-xs text-slate-400">
              Nenhuma regra encontrada.
            </p>
          )}
          {configs.map((c) => (
            <div
              key={c.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div>
                <p className="text-sm font-semibold text-slate-800">{c.name}</p>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  {c.company_name ?? "Global"} · humor {c.mood_negative_warn}/
                  {c.mood_negative_critical}% · sono {c.sleep_hours_min}h · água {c.water_ml_min}
                  ml · adesão {c.adhesion_min_pct}%
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase ${
                    c.enabled
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {c.enabled ? "on" : "off"}
                </span>
                <button
                  type="button"
                  onClick={() => openEdit(c)}
                  className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100"
                >
                  <Icon name="edit" className="text-sm" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </AdminSection>

      <AdminSection title={`Alertas disparados (${alerts.length})`}>
        <div className="space-y-2">
          {alerts.length === 0 && (
            <p className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center text-xs text-slate-400">
              Nenhum alerta ativo com as regras atuais.
            </p>
          )}
          {alerts.map((a) => (
            <div
              key={a.id}
              className={`rounded-xl border bg-white p-3 shadow-sm ${
                a.severity === "high"
                  ? "border-rose-200"
                  : a.severity === "medium"
                    ? "border-amber-200"
                    : "border-slate-200"
              }`}
            >
              <p className="text-xs font-semibold text-slate-700">
                {a.companyName} · {a.type} · {a.severity}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">{a.message}</p>
            </div>
          ))}
        </div>
      </AdminSection>
    </AdminPageFrame>
  );
}

function NumField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
      />
    </div>
  );
}
