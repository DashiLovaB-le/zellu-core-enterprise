import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BRANDING } from "@/lib/branding";
import {
  AdminPageFrame,
  AdminKpiCard,
  AdminSection,
  useAdminGate,
} from "@/components/admin/AdminShared";
import { loadSentimentData } from "@/lib/services/admin-service";
import type { AdminSentimentData } from "@/lib/api/admin.server";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";

export const Route = createFileRoute("/dashiadmin/sentimentos")({
  head: () => ({
    meta: [
      { title: `Sentimentos — Admin ${BRANDING.shortName}` },
      { name: "description", content: "Sentimentos agregados do ecossistema." },
    ],
  }),
  component: AdminSentimentosPage,
});

function AdminSentimentosPage() {
  const { session, loading, isAuthorized } = useAdminGate();
  const [data, setData] = useState<AdminSentimentData | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!session || ready) return;
    (async () => {
      const s = await loadSentimentData();
      setData(s);
      setReady(true);
    })();
  }, [session, ready]);

  if (loading || !isAuthorized) return <AdminPageFrame loading />;

  const moodBars = Object.entries(data?.moodDistribution ?? {}).map(([mood, count]) => ({
    mood,
    count,
  }));

  return (
    <AdminPageFrame>
      <div>
        <h1 className="font-display text-2xl text-slate-800">Sentimentos agregados</h1>
        <p className="mt-1 text-xs text-slate-500">
          Distribuição de humor anônima · últimos 30 dias
        </p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <AdminKpiCard
          icon="sentiment_satisfied"
          label="Humor médio"
          value={data ? `${data.avgMoodScore}/5` : "—"}
        />
        <AdminKpiCard
          icon="sentiment_dissatisfied"
          label="Negativo"
          value={data ? `${data.negativePct}%` : "—"}
        />
        <AdminKpiCard
          icon="apartment"
          label="Empresas c/ dados"
          value={String(data?.byCompany.length ?? "—")}
        />
      </div>

      <AdminSection title="Distribuição de humor">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={moodBars}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="mood" tick={{ fontSize: 10, fill: "#64748b" }} />
              <YAxis tick={{ fontSize: 10, fill: "#64748b" }} />
              <Tooltip
                contentStyle={{
                  background: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="count" name="Check-ins" fill="#0f172a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </AdminSection>

      <AdminSection title="Tendência (humor médio)">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data?.trends ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: "#64748b" }}
                tickFormatter={(v: string) => v.slice(5)}
              />
              <YAxis domain={[1, 5]} tick={{ fontSize: 10, fill: "#64748b" }} />
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
                dataKey="avgMood"
                name="Humor"
                stroke="#0f172a"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="negativePct"
                name="% Negativo"
                stroke="#f43f5e"
                strokeWidth={1.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </AdminSection>

      <AdminSection title="Por empresa">
        {(data?.byCompany.length ?? 0) === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center text-xs text-slate-400">
            Sem dados por empresa — vincule usuários às contas cliente.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-400">
                  <th className="px-4 py-3 font-semibold">Empresa</th>
                  <th className="px-4 py-3 font-semibold">Humor médio</th>
                  <th className="px-4 py-3 font-semibold">Negativo</th>
                  <th className="px-4 py-3 font-semibold">Amostra</th>
                </tr>
              </thead>
              <tbody>
                {data?.byCompany.map((row) => (
                  <tr key={row.companyId} className="border-b border-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{row.companyName}</td>
                    <td className="px-4 py-3 text-slate-600">{row.avgMood}/5</td>
                    <td className="px-4 py-3 text-slate-600">{row.negativePct}%</td>
                    <td className="px-4 py-3 text-slate-500">{row.sampleSize}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminSection>
    </AdminPageFrame>
  );
}
