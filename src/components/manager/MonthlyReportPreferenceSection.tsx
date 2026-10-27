import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import {
  getMonthlyReportPreference,
  setMonthlyReportPreference,
} from "@/lib/api/report-preferences.server";

const LABEL = "Resumo mensal por e-mail";

export function MonthlyReportPreferenceSection() {
  const [receive, setReceive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const result = await getMonthlyReportPreference();
      if (cancelled) return;
      if (result.receive !== null) setReceive(result.receive);
      if (result.error) setError(result.error);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const save = async (next: boolean) => {
    const previous = receive;
    setReceive(next);
    setSaving(true);
    setError(null);
    setStatus(null);
    const result = await setMonthlyReportPreference({ data: { receive: next } });
    setSaving(false);
    if (result.error || result.receive === null) {
      setReceive(previous);
      setError(result.error ?? "Não foi possível salvar. Tente novamente.");
      return;
    }
    setReceive(result.receive);
    setStatus("Preferência salva");
    window.setTimeout(() => setStatus(null), 2000);
  };

  return (
    <section className="rounded-2xl bg-white/70 p-4 shadow-sm backdrop-blur-md">
      <h3 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--clay-title)]/60">
        Relatórios do RH
      </h3>
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="text-[var(--clay-text)]">{LABEL}</span>
        <Switch
          checked={receive}
          disabled={loading || saving}
          onCheckedChange={(checked) => void save(checked === true)}
          aria-label={LABEL}
          className="data-[state=checked]:bg-[#99BEE5]"
        />
      </div>
      <p className="mt-2 text-xs text-[var(--clay-text)]/70">
        No dia 1 de cada mês, um resumo do mês anterior com adesão, equipes em atenção e fatores de
        trabalho. Só dados agregados.
      </p>
      {loading && (
        <p className="mt-2 text-xs text-[var(--clay-text)]/60">Carregando preferência…</p>
      )}
      {error && <p className="mt-2 text-xs text-red-700">{error}</p>}
      {status && !error && <p className="mt-2 text-xs text-[var(--clay-title)]">{status}</p>}
    </section>
  );
}
