import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BRANDING } from "@/lib/branding";
import {
  AdminPageFrame,
  AdminKpiCard,
  AdminSection,
  useAdminGate,
} from "@/components/admin/AdminShared";
import { loadUsageMetrics } from "@/lib/services/admin-service";
import type { AdminUsageMetrics } from "@/lib/api/admin.server";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";

export const Route = createFileRoute("/admin/metricas")({
  head: () => ({
    meta: [
      { title: `Métricas — Admin ${BRANDING.shortName}` },
      { name: "description", content: "Métricas de uso e adoção." },
    ],
  }),
  component: AdminMetricasPage,
});

function AdminMetricasPage() {
  const { session, loading, isAuthorized } = useAdminGate();
  const [data, setData] = useState<AdminUsageMetrics | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!session || ready) return;
    (async () => {
      const m = await loadUsageMetrics();
      setData(m);
      setReady(true);
    })();
  }, [session, ready]);

  if (loading || !isAuthorized) return <AdminPageFrame loading />;

  return (
    <AdminPageFrame>
      <div>
        <h1 className="font-display text-2xl text-slate-800">Métricas de uso</h1>
        <p className="mt-1 text-xs text-slate-500">
          Adoção, usuários ativos e check-ins por empresa
        </p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <AdminKpiCard icon="today" label="DAU" value={String(data?.dailyActiveUsers ?? "—")} />
        <AdminKpiCard icon="date_range" label="WAU" value={String(data?.weeklyActiveUsers ?? "—")} />
        <AdminKpiCard
          icon="calendar_month"
          label="MAU"
          value={String(data?.monthlyActiveUsers ?? "—")}
        />
        <AdminKpiCard
          icon="bar_chart"
          label="Check-ins 30d"
          value={String(data?.checkinsLast30d ?? "—")}
        />
      </div>

      <AdminSection title="Tendência diária (30 dias)">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={data?.dailyTrend ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: "#64748b" }}
                tickFormatter={(v: string) => v.slice(5)}
              />
              <YAxis tick={{ fontSize: 10, fill: "#64748b" }} />
              <Tooltip
                contentStyle={{
                  background: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Line
                type="monotone"
                dataKey="checkins"
                name="Check-ins"
                stroke="#0f172a"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="uniqueUsers"
                name="Usuários"
                stroke="#38bdf8"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </AdminSection>

      <AdminSection title="Adoção por empresa">
        {(data?.adoptionByCompany?.length ?? 0) === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center text-xs text-slate-400">
            Vincule funcionários às empresas para ver adesão por cliente.
          </p>
        ) : (
          <>
            <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data?.adoptionByCompany ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="companyName" tick={{ fontSize: 10, fill: "#64748b" }} />
                  <YAxis tick={{ fontSize: 10, fill: "#64748b" }} />
                  <Tooltip
                    contentStyle={{
                      background: "#fff",
                      border: "1px solid #e2e8f0",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="adhesionPct" name="Adesão %" fill="#0f172a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-400">
                    <th className="px-4 py-3 font-semibold">Empresa</th>
                    <th className="px-4 py-3 font-semibold">Colaboradores</th>
                    <th className="px-4 py-3 font-semibold">Ativos 30d</th>
                    <th className="px-4 py-3 font-semibold">Adesão</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.adoptionByCompany.map((row) => (
                    <tr key={row.companyId} className="border-b border-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-800">{row.companyName}</td>
                      <td className="px-4 py-3 text-slate-600">{row.employees}</td>
                      <td className="px-4 py-3 text-slate-600">{row.activeUsers}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{row.adhesionPct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </AdminSection>
    </AdminPageFrame>
  );
}
