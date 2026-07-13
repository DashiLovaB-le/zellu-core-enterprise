import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { DevShell } from "@/components/DevShell";
import { Icon } from "@/components/Icon";
import { useAuth } from "@/lib/auth-context";
import { BRANDING } from "@/lib/branding";
import { useEffect, useState, useCallback } from "react";
import {
  getLlmConfig,
  setLlmConfig,
  resetLlmConfig,
  testLlmConnection,
} from "@/lib/api/llm-config.server";

export const Route = createFileRoute("/dashitecnology/$painel-dev")({
  head: ({ params }) => ({
    meta: [{ title: `${params["painel-dev"]} — Dev Tools — ${BRANDING.shortName}` }],
  }),
  component: PanelRouter,
});

function PanelRouter() {
  const { "painel-dev": panelId } = useParams({ from: "/dashitecnology/$painel-dev" });

  switch (panelId) {
    case "llm-config":
      return <LlmConfigPanel />;
    default:
      return <NotFoundPanel panelId={panelId} />;
  }
}

function NotFoundPanel({ panelId }: { panelId: string }) {
  const navigate = useNavigate();
  return (
    <DevShell>
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <Icon name="error_outline" className="text-4xl text-[var(--clay-anxiety)]" />
        <h2 className="font-display text-xl text-[var(--clay-title)]">Painel não encontrado</h2>
        <p className="text-sm text-[var(--clay-text)]/60">O painel "{panelId}" não existe.</p>
        <button
          onClick={() => navigate({ to: "/dashitecnology" })}
          className="rounded-xl bg-white/70 px-4 py-2 text-sm shadow-sm"
        >
          Voltar
        </button>
      </div>
    </DevShell>
  );
}

function LlmConfigPanel() {
  const { user, session, loading, role } = useAuth();
  const navigate = useNavigate();
  const [model, setModel] = useState("openai/gpt-4o-mini");
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(300);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loaded, setLoaded] = useState(false);

  const loadConfig = useCallback(async () => {
    if (!user || !session?.access_token) return;
    const result = await getLlmConfig({ data: { accessToken: session.access_token } });
    if ("error" in result && result.error) {
      if (result.error !== "Unauthorized — role dev required") {
        setMessage({ type: "error", text: result.error });
      }
      return;
    }
    const config = result as {
      model: string;
      temperature: number;
      max_tokens: number;
      system_prompt: string;
      api_key: string;
    };
    setModel(config.model);
    setTemperature(config.temperature);
    setMaxTokens(config.max_tokens);
    setSystemPrompt(config.system_prompt);
    setApiKey(config.api_key);
    setLoaded(true);
  }, [user, session]);

  useEffect(() => {
    if (!loading && (!user || role !== "dev")) {
      navigate({ to: "/login", replace: true });
      return;
    }
    if (user && !loaded) loadConfig();
  }, [user, loading, role, navigate, loaded, loadConfig]);

  const handleSave = async () => {
    if (!user || !session?.access_token) return;
    setSaving(true);
    setMessage(null);
    const result = await setLlmConfig({
      data: {
        accessToken: session.access_token,
        model,
        temperature,
        max_tokens: maxTokens,
        system_prompt: systemPrompt,
        api_key: apiKey,
      },
    });
    setSaving(false);
    if ("success" in result && result.success) {
      setMessage({ type: "success", text: "Configuração salva com sucesso!" });
    } else {
      setMessage({ type: "error", text: (result as { error: string }).error ?? "Erro ao salvar" });
    }
  };

  const handleReset = async () => {
    if (!user || !session?.access_token) return;
    setSaving(true);
    setMessage(null);
    const result = await resetLlmConfig({ data: { accessToken: session.access_token } });
    setSaving(false);
    if ("success" in result && result.success) {
      setMessage({ type: "success", text: "Configuração resetada para o padrão." });
      loadConfig();
    } else {
      setMessage({ type: "error", text: (result as { error: string }).error ?? "Erro ao resetar" });
    }
  };

  const handleTest = async () => {
    if (!user || !session?.access_token) return;
    setTesting(true);
    setMessage(null);
    const result = await testLlmConnection({
      data: { accessToken: session.access_token, model, api_key: apiKey },
    });
    setTesting(false);
    if ("success" in result && result.success) {
      setMessage({ type: "success", text: "Conexão com OpenRouter OK!" });
    } else {
      setMessage({
        type: "error",
        text: (result as { error: string }).error ?? "Falha na conexão",
      });
    }
  };

  if (loading || !user || role !== "dev") {
    return (
      <DevShell>
        <div className="flex flex-1 items-center justify-center">
          <Icon name="sync" className="animate-spin text-3xl text-[var(--clay-title)]" />
        </div>
      </DevShell>
    );
  }

  return (
    <DevShell>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="font-display text-2xl text-[var(--clay-title)]">LLM Config</h1>
          <p className="mt-1 text-xs text-[var(--clay-text)]/70">
            Configuração do modelo de IA via OpenRouter
          </p>
        </div>

        {message && (
          <div
            className={`rounded-xl px-4 py-3 text-sm ${
              message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
            }`}
          >
            {message.text}
          </div>
        )}

        <section className="rounded-2xl bg-white/70 p-5 shadow-sm backdrop-blur-md">
          <div className="space-y-5">
            <Field label="Modelo">
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="openai/gpt-4o-mini"
                className="w-full rounded-xl bg-white/50 px-4 py-2.5 text-sm shadow-sm outline-none focus:ring-2 focus:ring-[#99BEE5]"
              />
              <p className="mt-1 text-[10px] text-[var(--clay-text)]/50">
                Ex: openai/gpt-4o-mini, anthropic/claude-sonnet-4, google/gemini-pro
              </p>
            </Field>

            <Field label={`Temperatura: ${temperature.toFixed(1)}`}>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full accent-[#99BEE5]"
              />
              <div className="flex justify-between text-[10px] text-[var(--clay-text)]/50">
                <span>0.0 (preciso)</span>
                <span>2.0 (criativo)</span>
              </div>
            </Field>

            <Field label="Max Tokens">
              <input
                type="number"
                min={1}
                max={8192}
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value) || 300)}
                className="w-full rounded-xl bg-white/50 px-4 py-2.5 text-sm shadow-sm outline-none focus:ring-2 focus:ring-[#99BEE5]"
              />
            </Field>

            <Field label="System Prompt">
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                rows={8}
                className="w-full rounded-xl bg-white/50 px-4 py-2.5 text-sm shadow-sm outline-none focus:ring-2 focus:ring-[#99BEE5] resize-y"
              />
            </Field>

            <Field label="API Key (OpenRouter)">
              <div className="relative">
                <input
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-or-v1-..."
                  className="w-full rounded-xl bg-white/50 px-4 py-2.5 pr-10 text-sm shadow-sm outline-none focus:ring-2 focus:ring-[#99BEE5]"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--clay-title)]/50 hover:text-[var(--clay-title)]"
                >
                  <Icon name={showKey ? "visibility_off" : "visibility"} className="text-sm" />
                </button>
              </div>
              <p className="mt-1 text-[10px] text-[var(--clay-text)]/50">
                Deixe em branco para usar a chave do arquivo .env
              </p>
            </Field>
          </div>
        </section>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-[#99BEE5] to-[#C5D9F1] px-6 py-2.5 text-sm font-semibold text-[oklch(0.25_0.04_254)] shadow-sm active:translate-y-px disabled:opacity-50"
          >
            {saving ? (
              <Icon name="sync" className="animate-spin text-sm" />
            ) : (
              <Icon name="save" className="text-sm" />
            )}
            Salvar
          </button>
          <button
            onClick={handleTest}
            disabled={testing}
            className="flex items-center gap-2 rounded-xl bg-white/70 px-4 py-2.5 text-sm shadow-sm active:translate-y-px disabled:opacity-50"
          >
            {testing ? (
              <Icon name="sync" className="animate-spin text-sm" />
            ) : (
              <Icon name="wifi" className="text-sm" />
            )}
            Testar Conexão
          </button>
          <button
            onClick={handleReset}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-white/70 px-4 py-2.5 text-sm text-red-600 shadow-sm active:translate-y-px disabled:opacity-50"
          >
            <Icon name="restart_alt" className="text-sm" />
            Resetar Padrão
          </button>
        </div>
      </div>
    </DevShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-[var(--clay-title)]/70">{label}</span>
      {children}
    </label>
  );
}
