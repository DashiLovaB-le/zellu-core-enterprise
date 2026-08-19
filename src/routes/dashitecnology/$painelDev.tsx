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
import { getSystemLogs, type LogEntry, type LogLevel } from "@/lib/api/logs.server";

export const Route = createFileRoute("/dashitecnology/$painelDev")({
  head: ({ params }) => ({
    meta: [{ title: `${params.painelDev} — Dev Tools — ${BRANDING.shortName}` }],
  }),
  component: PanelRouter,
});

function PanelRouter() {
  const { painelDev: panelId } = useParams({ from: "/dashitecnology/$painelDev" });

  switch (panelId) {
    case "llm-config":
      return <LlmConfigPanel />;
    case "system-logs":
      return <SystemLogsPanel />;
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
    if (!user || !session) return;
    const result = await getLlmConfig();
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
    if (!loading && !user) {
      navigate({ to: "/login", replace: true });
      return;
    }
    
    // Apenas dev tem acesso a dashitecnology
    if (!loading && user && role && role !== "dev") {
      const target = role === "manager" ? "/manager/rh-dashboard" : role === "admin" ? "/admin" : "/";
      navigate({ to: target, replace: true });
      return;
    }
    
    if (user && !loaded) loadConfig();
  }, [user, loading, role, navigate, loaded, loadConfig]);

  const handleSave = async () => {
    if (!user || !session) return;
    setSaving(true);
    setMessage(null);
    try {
      const result = await setLlmConfig({ data: { model,
          temperature,
          max_tokens: maxTokens,
          system_prompt: systemPrompt,
          api_key: apiKey,
        },
      });
      if ("success" in result && result.success) {
        setMessage({ type: "success", text: "Configuração salva com sucesso!" });
        // Recarrega para mostrar a chave mascarada
        loadConfig();
      } else {
        setMessage({
          type: "error",
          text: (result as { error: string }).error ?? "Erro ao salvar configuração",
        });
      }
    } catch (err) {
      console.error("Erro ao salvar:", err);
      setMessage({
        type: "error",
        text: `Erro inesperado ao salvar. Verifique o console para detalhes.`,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!user || !session) return;
    setSaving(true);
    setMessage(null);
    try {
      const result = await resetLlmConfig();
      if ("success" in result && result.success) {
        setMessage({ type: "success", text: "Configuração resetada para o padrão." });
        loadConfig();
      } else {
        setMessage({
          type: "error",
          text: (result as { error: string }).error ?? "Erro ao resetar",
        });
      }
    } catch (err) {
      console.error("Erro ao resetar:", err);
      setMessage({ type: "error", text: "Erro inesperado ao resetar configuração." });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!user || !session) return;
    setTesting(true);
    setMessage(null);
    try {
      const result = await testLlmConnection({ data: { model, api_key: apiKey },
      });
      if ("success" in result && result.success) {
        setMessage({ type: "success", text: "Conexão com OpenRouter OK!" });
      } else {
        setMessage({
          type: "error",
          text: (result as { error: string }).error ?? "Falha na conexão",
        });
      }
    } catch (err) {
      console.error("Erro ao testar:", err);
      setMessage({ type: "error", text: "Erro inesperado ao testar conexão." });
    } finally {
      setTesting(false);
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

        <LlmFailuresSection session={session} />
      </div>
    </DevShell>
  );
}

const LEVEL_COLORS: Record<LogLevel, string> = {
  debug: "bg-gray-100 text-gray-600",
  info: "bg-blue-50 text-blue-700",
  warn: "bg-amber-50 text-amber-700",
  error: "bg-red-50 text-red-700",
};

function SystemLogsPanel() {
  const { user, session, loading, role } = useAuth();
  const navigate = useNavigate();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [levelFilter, setLevelFilter] = useState<LogLevel | "">("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const pageSize = 50;

  const fetchLogs = useCallback(async () => {
    if (!user || !session) return;
    setLoadingLogs(true);
    setError(null);
    try {
      const result = await getSystemLogs({ data: { limit: pageSize,
          offset: page * pageSize,
          level: levelFilter || undefined,
          source: sourceFilter || undefined,
        },
      });
      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }
      const r = result as { data: LogEntry[]; total: number; error: null };
      setLogs(r.data);
      setTotal(r.total);
      setLoaded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar logs");
    } finally {
      setLoadingLogs(false);
    }
  }, [user, session, page, levelFilter, sourceFilter]);

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/login", replace: true });
      return;
    }
    if (!loading && user && role && role !== "dev") {
      const target = role === "manager" ? "/manager/rh-dashboard" : role === "admin" ? "/admin" : "/";
      navigate({ to: target, replace: true });
      return;
    }
    if (user && !loaded) fetchLogs();
  }, [user, loading, role, navigate, loaded, fetchLogs]);

  useEffect(() => {
    if (loaded) fetchLogs();
  }, [page, levelFilter, sourceFilter]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchLogs, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchLogs]);

  const totalPages = Math.ceil(total / pageSize);

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
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl text-[var(--clay-title)]">System Logs</h1>
            <p className="mt-1 text-xs text-[var(--clay-text)]/70">
              {total} registro{total !== 1 ? "s" : ""} —{" "}
              {loaded && !loadingLogs ? `página ${page + 1} de ${totalPages || 1}` : "carregando..."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setAutoRefresh(!autoRefresh); if (!autoRefresh) fetchLogs(); }}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs shadow-sm transition-all ${
                autoRefresh
                  ? "bg-gradient-to-br from-[#99BEE5] to-[#C5D9F1] text-[oklch(0.25_0.04_254)]"
                  : "bg-white/70"
              }`}
            >
              <Icon name={autoRefresh ? "sync" : "sync_disabled"} className="text-sm" />
              Auto
            </button>
            <button
              onClick={fetchLogs}
              disabled={loadingLogs}
              className="flex items-center gap-1.5 rounded-xl bg-white/70 px-3 py-2 text-xs shadow-sm active:translate-y-px disabled:opacity-50"
            >
              <Icon name="refresh" className="text-sm" />
              Atualizar
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
        )}

        <div className="flex flex-wrap gap-2">
          <select
            value={levelFilter}
            onChange={(e) => { setLevelFilter(e.target.value as LogLevel | ""); setPage(0); }}
            className="rounded-xl bg-white/70 px-3 py-2 text-xs shadow-sm outline-none focus:ring-2 focus:ring-[#99BEE5]"
          >
            <option value="">Todos os níveis</option>
            <option value="error">Erro</option>
            <option value="warn">Warning</option>
            <option value="info">Info</option>
            <option value="debug">Debug</option>
          </select>
          <input
            type="text"
            value={sourceFilter}
            onChange={(e) => { setSourceFilter(e.target.value); setPage(0); }}
            placeholder="Filtrar por source..."
            className="w-48 rounded-xl bg-white/70 px-3 py-2 text-xs shadow-sm outline-none focus:ring-2 focus:ring-[#99BEE5]"
          />
          {total > 0 && (
            <span className="flex items-center text-[10px] text-[var(--clay-text)]/50">
              {page * pageSize + 1}–{Math.min((page + 1) * pageSize, total)} de {total}
            </span>
          )}
        </div>

        {loadingLogs && !logs.length ? (
          <div className="flex items-center justify-center py-16">
            <Icon name="sync" className="animate-spin text-2xl text-[var(--clay-title)]" />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-[var(--clay-text)]/50">
            <Icon name="inbox" className="text-3xl" />
            <p className="text-xs">Nenhum log encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl bg-white/70 shadow-sm backdrop-blur-md">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--clay-title)]/10">
                  <th className="px-3 py-2.5 font-semibold text-[var(--clay-title)]/60">Nível</th>
                  <th className="px-3 py-2.5 font-semibold text-[var(--clay-title)]/60">Data</th>
                  <th className="px-3 py-2.5 font-semibold text-[var(--clay-title)]/60">Source</th>
                  <th className="px-3 py-2.5 font-semibold text-[var(--clay-title)]/60">Mensagem</th>
                  <th className="px-3 py-2.5 font-semibold text-[var(--clay-title)]/60">Detalhes</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-[var(--clay-title)]/5 hover:bg-white/50"
                  >
                    <td className="px-3 py-2">
                      <span
                        className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase ${
                          LEVEL_COLORS[log.level]
                        }`}
                      >
                        {log.level}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-[var(--clay-text)]/70">
                      {new Date(log.created_at).toLocaleString("pt-BR")}
                    </td>
                    <td className="max-w-[120px] truncate px-3 py-2 font-medium text-[var(--clay-title)]">
                      {log.source}
                    </td>
                    <td className="max-w-[300px] truncate px-3 py-2 text-[var(--clay-text)]/80">
                      {log.message}
                    </td>
                    <td className="px-3 py-2">
                      {log.details ? (
                        <button
                          onClick={() =>
                            alert(JSON.stringify(log.details, null, 2))
                          }
                          className="rounded-md bg-white/50 px-2 py-1 text-[10px] shadow-sm hover:bg-white"
                        >
                          Ver JSON
                        </button>
                      ) : (
                        <span className="text-[var(--clay-text)]/30">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="flex items-center gap-1 rounded-xl bg-white/70 px-3 py-2 text-xs shadow-sm active:translate-y-px disabled:opacity-30"
            >
              <Icon name="chevron_left" className="text-sm" />
              Anterior
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const start = Math.max(0, Math.min(page - 3, totalPages - 7));
              const p = start + i;
              if (p >= totalPages) return null;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`flex h-8 w-8 items-center justify-center rounded-xl text-xs shadow-sm transition-all ${
                    p === page
                      ? "bg-gradient-to-br from-[#99BEE5] to-[#C5D9F1] text-[oklch(0.25_0.04_254)]"
                      : "bg-white/70"
                  }`}
                >
                  {p + 1}
                </button>
              );
            })}
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="flex items-center gap-1 rounded-xl bg-white/70 px-3 py-2 text-xs shadow-sm active:translate-y-px disabled:opacity-30"
            >
              Próximo
              <Icon name="chevron_right" className="text-sm" />
            </button>
          </div>
        )}
      </div>
    </DevShell>
  );
}

function LlmFailuresSection({ session }: { session: { user: { id: string } } | null }) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const fetchFailures = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const result = await getSystemLogs({ data: { level: "error",
          limit: 20,
          offset: 0,
        },
      });
      if ("error" in result && result.error) return;
      const r = result as { data: LogEntry[]; total: number; error: null };
      const llmLogs = r.data.filter(
        (l) =>
          l.source.startsWith("chat-ai") ||
          l.source.startsWith("insights-ai") ||
          l.source.startsWith("llm-config"),
      );
      setLogs(llmLogs);
    } catch {
      // Falha de fetch não deve derrubar o painel de logs.
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    fetchFailures();
  }, [fetchFailures]);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <section className="rounded-2xl bg-white/70 p-5 shadow-sm backdrop-blur-md">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="font-display text-base text-[var(--clay-title)]">LLM Failures</h2>
          <p className="text-[10px] text-[var(--clay-text)]/50">
            Últimos erros do chat IA, insights e configuração
          </p>
        </div>
        <button
          onClick={fetchFailures}
          disabled={loading}
          className="flex items-center gap-1 rounded-xl bg-white/50 px-3 py-1.5 text-xs shadow-sm active:translate-y-px disabled:opacity-50"
        >
          <Icon name="refresh" className="text-sm" />
          Atualizar
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Icon name="sync" className="animate-spin text-xl text-[var(--clay-title)]" />
        </div>
      ) : logs.length === 0 ? (
        <div className="flex items-center justify-center gap-2 py-8 text-[var(--clay-text)]/50">
          <Icon name="check_circle" className="text-lg" />
          <p className="text-xs">Nenhuma falha registrada</p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <div
              key={log.id}
              className="rounded-xl border border-red-100 bg-red-50/50 p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-block rounded-md bg-red-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-red-700">
                      {log.level}
                    </span>
                    <span className="text-[10px] text-[var(--clay-text)]/50">
                      {new Date(log.created_at).toLocaleString("pt-BR")}
                    </span>
                    <span className="rounded-md bg-white/60 px-1.5 py-0.5 text-[10px] font-mono text-[var(--clay-title)]/60">
                      {log.source}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[var(--clay-title)]/80">{log.message}</p>
                </div>
                {log.details && (
                  <button
                    onClick={() => toggleExpand(log.id)}
                    className="shrink-0 rounded-md bg-white/50 px-2 py-1 text-[10px] shadow-sm hover:bg-white"
                  >
                    {expanded[log.id] ? "Fechar" : "Detalhes"}
                  </button>
                )}
              </div>
              {expanded[log.id] && log.details && (
                <pre className="mt-2 overflow-x-auto rounded-lg bg-white/60 p-2 text-[10px] text-[var(--clay-text)]/70">
                  {JSON.stringify(log.details, null, 2)}
                </pre>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
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
