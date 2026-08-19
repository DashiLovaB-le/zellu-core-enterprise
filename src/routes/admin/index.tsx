import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BRANDING } from "@/lib/branding";
import { AdminPageFrame, AdminKpiCard, useAdminGate } from "@/components/admin/AdminShared";
import { loadAdminKpis, loadEvaluatedAlerts } from "@/lib/services/admin-service";
import type { AdminKpiData, AdminEvaluatedAlert } from "@/lib/api/admin.server";
import { Icon } from "@/components/Icon";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: `Portal Admin — ${BRANDING.shortName}` },
      { name: "description", content: "KPIs globais do ecossistema Mundo Mental." },
    ],
  }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const { session, loading, isAuthorized } = useAdminGate();
  const [kpis, setKpis] = useState<AdminKpiData | null>(null);
  const [alerts, setAlerts] = useState<AdminEvaluatedAlert[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!session || ready) return;
    (async () => {
      const [k, a] = await Promise.all([
        loadAdminKpis(),
        loadEvaluatedAlerts(),
      ]);
      if (k) setKpis(k);
      setAlerts(a);
      setReady(true);
    })();
  }, [session, ready]);

  if (loading || !isAuthorized) {
    return <AdminPageFrame loading />;
  }

  return (
    <AdminPageFrame>
      <div>
        <h1 className="font-display text-2xl text-slate-800">Operação Mundo Mental</h1>
        <p className="mt-1 text-xs text-slate-500">
          Empresas, contratos, licenças, colaboradores, uso e alertas — visão global da operadora
        </p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <AdminKpiCard
          icon="apartment"
          label="Empresas"
          value={String(kpis?.totalCompanies ?? "—")}
          hint={`${kpis?.activeCompanies ?? 0} ativas`}
        />
        <AdminKpiCard
          icon="people"
          label="Colaboradores"
          value={String(kpis?.totalEmployees ?? "—")}
        />
        <AdminKpiCard
          icon="verified"
          label="Licenças"
          value={String(kpis?.activeLicenses ?? "—")}
          hint={`${kpis?.seatsUsed ?? 0}/${kpis?.seatsTotal ?? 0} assentos`}
        />
        <AdminKpiCard
          icon="today"
          label="Check-ins hoje"
          value={String(kpis?.checkinsToday ?? "—")}
        />
        <AdminKpiCard
          icon="trending_up"
          label="Adesão 7d"
          value={kpis ? `${kpis.weeklyAdhesion}%` : "—"}
        />
        <AdminKpiCard
          icon="sentiment_satisfied"
          label="Humor médio"
          value={kpis ? `${kpis.avgMood}/5` : "—"}
        />
        <AdminKpiCard
          icon="warning"
          label="Humor negativo"
          value={kpis ? `${kpis.negativeMoodPct}%` : "—"}
        />
        <AdminKpiCard
          icon="bar_chart"
          label="Check-ins 7d"
          value={String(kpis?.checkinsThisWeek ?? "—")}
        />
      </div>

      {alerts.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 font-display text-sm font-semibold text-slate-800">
            Alertas ativos
          </h2>
          <div className="space-y-2">
            {alerts.slice(0, 8).map((alert) => (
              <div
                key={alert.id}
                className={`flex items-start gap-3 rounded-xl border bg-white p-3 shadow-sm ${
                  alert.severity === "high"
                    ? "border-rose-200"
                    : alert.severity === "medium"
                      ? "border-amber-200"
                      : "border-slate-200"
                }`}
              >
                <Icon
                  name="notifications_active"
                  className={`mt-0.5 text-base ${
                    alert.severity === "high"
                      ? "text-rose-500"
                      : alert.severity === "medium"
                        ? "text-amber-500"
                        : "text-slate-400"
                  }`}
                />
                <div>
                  <p className="text-xs font-semibold text-slate-700">{alert.companyName}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{alert.message}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </AdminPageFrame>
  );
}
