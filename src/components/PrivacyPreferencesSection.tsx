import { useCallback, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Switch } from "@/components/ui/switch";
import {
  deleteMyAccount,
  exportMyData,
  getPrivacyPreferences,
  updatePrivacyPreferences,
  withdrawPrivacyConsent,
  type PrivacyPreferences,
} from "@/lib/api/privacy.server";

type PreferenceKey = keyof PrivacyPreferences;

const PREFERENCE_ROWS: Array<{ key: PreferenceKey; label: string }> = [
  { key: "aiOptIn", label: "IA na nuvem (OpenRouter)" },
  { key: "rhOptIn", label: "Indicadores agregados no RH" },
  { key: "emailOptIn", label: "E-mail de lembrete" },
];

export function PrivacyPreferencesSection({
  onWithdraw,
  onDeleteAccount,
}: {
  onWithdraw: () => void | Promise<void>;
  onDeleteAccount: () => void | Promise<void>;
}) {
  const [preferences, setPreferences] = useState<PrivacyPreferences>({
    aiOptIn: false,
    rhOptIn: false,
    emailOptIn: false,
  });
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<PreferenceKey | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const result = await getPrivacyPreferences();
      if (cancelled) return;
      if (result.preferences) setPreferences(result.preferences);
      if (result.error) setError(result.error);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const savePreference = useCallback(async (key: PreferenceKey, next: boolean) => {
    let previous = false;
    setPreferences((current) => {
      previous = current[key];
      return { ...current, [key]: next };
    });
    setSavingKey(key);
    setError(null);
    setStatus(null);

    const result = await updatePrivacyPreferences({ data: { [key]: next } });

    if (result.error || !result.preferences) {
      setPreferences((current) => ({ ...current, [key]: previous }));
      setError(result.error ?? "Não foi possível salvar. Tente novamente.");
      setSavingKey(null);
      return;
    }

    setPreferences(result.preferences);
    setStatus("Preferência salva");
    setSavingKey(null);
    window.setTimeout(() => setStatus(null), 2000);
  }, []);

  return (
    <section className="rounded-2xl bg-white/70 p-4 shadow-sm backdrop-blur-md">
      <h3 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--clay-title)]/60">
        Seus dados (LGPD)
      </h3>
      <p className="mb-3 text-xs text-[var(--clay-text)]/70">
        <Link to="/privacidade" className="underline">
          Política de privacidade
        </Link>
      </p>

      <div className="mb-3 space-y-3">
        {PREFERENCE_ROWS.map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between gap-3 text-sm">
            <span className="text-[var(--clay-text)]">{label}</span>
            <Switch
              checked={preferences[key]}
              disabled={loading || savingKey === key}
              onCheckedChange={(checked) => void savePreference(key, checked === true)}
              aria-label={label}
              className="data-[state=checked]:bg-[#99BEE5]"
            />
          </div>
        ))}
      </div>

      {loading && <p className="mb-3 text-xs text-[var(--clay-text)]/60">Carregando preferências…</p>}
      {error && <p className="mb-3 text-xs text-red-700">{error}</p>}
      {status && !error && <p className="mb-3 text-xs text-[var(--clay-title)]">{status}</p>}

      <button
        type="button"
        className="mb-2 w-full rounded-xl bg-white/50 p-3 text-left text-sm"
        onClick={async () => {
          const result = await exportMyData();
          if (!result.data) return;
          const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "mundo-mental-meus-dados.json";
          a.click();
          URL.revokeObjectURL(url);
        }}
      >
        Exportar meus dados
      </button>
      <button
        type="button"
        className="mb-2 w-full rounded-xl bg-white/50 p-3 text-left text-sm"
        onClick={() => void onWithdraw()}
      >
        Revogar consentimento
      </button>
      <button
        type="button"
        className="w-full rounded-xl bg-white/50 p-3 text-left text-sm text-red-700"
        onClick={() => void onDeleteAccount()}
      >
        Excluir conta
      </button>
    </section>
  );
}
