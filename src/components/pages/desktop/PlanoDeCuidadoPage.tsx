import { useState } from "react";
import { DesktopShell } from "@/components/DesktopShell";
import { Avatar } from "@/components/Avatar";
import { Icon } from "@/components/Icon";
import type { WellnessPlan, WellnessChecklist, PlanProgress } from "@/lib/services/wellness-plan-service";
import { CHECKLIST_ITEMS } from "@/lib/api/wellness-plan.server";

const GOAL_BENEFITS: Record<string, string> = {
  "reduzir-ansiedade": "Foco em técnicas de respiração e pausas conscientes",
  "melhorar-sono": "Rotina noturna e preparação para o descanso",
  "aumentar-energia": "Movimento corporal e hidratação ao longo do dia",
  "equilibrio-emocional": "Check-ins regulares e conversas acolhedoras",
  "autocuidado-rotina": "Pequenos momentos de cuidado integrados ao seu dia",
};

const goalOptions = [
  { value: "reduzir-ansiedade", label: "Reduzir ansiedade", icon: "spa", desc: "Técnicas de respiração e pausas conscientes" },
  { value: "melhorar-sono", label: "Melhorar o sono", icon: "bedtime", desc: "Rotina noturna e preparação para o descanso" },
  { value: "aumentar-energia", label: "Aumentar energia", icon: "bolt", desc: "Movimento corporal e hidratação" },
  { value: "equilibrio-emocional", label: "Equilíbrio emocional", icon: "balance", desc: "Check-ins regulares e conversas acolhedoras" },
  { value: "autocuidado-rotina", label: "Autocuidado na rotina", icon: "self_improvement", desc: "Pequenos momentos de cuidado" },
  { value: "custom", label: "Meu próprio objetivo", icon: "edit_note", desc: "Defina seu objetivo personalizado" },
];

interface Props {
  plan: WellnessPlan | null;
  checklist: WellnessChecklist | null;
  progress: PlanProgress | null;
  aiSuggestion: string;
  saving: boolean;
  showGoalForm: boolean;
  onShowGoalForm: (v: boolean) => void;
  onSaveGoal: (goal: string, customGoal?: string) => void;
  onToggleItem: (key: string, value: boolean) => void;
  onSaveChecklist: () => void;
  onRefreshSuggestion: () => void;
}

export function DesktopPlanoDeCuidadoPage({
  plan,
  checklist,
  progress,
  aiSuggestion,
  saving,
  showGoalForm,
  onShowGoalForm,
  onSaveGoal,
  onToggleItem,
  onSaveChecklist,
  onRefreshSuggestion,
}: Props) {
  const [selectedGoal, setSelectedGoal] = useState("");
  const [customGoal, setCustomGoal] = useState("");

  if (!plan) {
    return (
      <DesktopShell>
        <header className="mb-6 flex items-center gap-4">
          <Avatar size={48} />
          <div>
            <h1 className="font-display text-2xl text-[var(--clay-title)]">Plano de Cuidado</h1>
            <p className="text-sm text-[var(--clay-text)]/70">Crie seu plano de bem-estar personalizado</p>
          </div>
        </header>

        {showGoalForm ? (
          <section className="mx-auto max-w-xl">
            <div className="rounded-2xl bg-white/70 p-6 shadow-sm backdrop-blur-md">
              <h2 className="mb-4 text-lg font-bold text-[var(--clay-title)]">Qual seu objetivo?</h2>
              <div className="grid grid-cols-2 gap-3">
                {goalOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setSelectedGoal(opt.value);
                      if (opt.value !== "custom") {
                        onSaveGoal(opt.value);
                        onShowGoalForm(false);
                      }
                    }}
                    className={`flex items-start gap-3 rounded-xl p-4 text-left transition-all ${
                      selectedGoal === opt.value
                        ? "bg-gradient-to-br from-[#99BEE5]/30 to-[#C5D9F1]/30 shadow-sm ring-1 ring-[#99BEE5]/30"
                        : "bg-white/50 hover:bg-white/70 hover:shadow-sm"
                    }`}
                  >
                    <Icon name={opt.icon} className="mt-0.5 text-xl text-[var(--clay-cta)]" />
                    <div>
                      <p className="font-semibold text-[var(--clay-title)]">{opt.label}</p>
                      <p className="text-xs text-[var(--clay-title)]/60">{opt.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
              {selectedGoal === "custom" && (
                <div className="mt-4 space-y-3">
                  <input
                    value={customGoal}
                    onChange={(e) => setCustomGoal(e.target.value)}
                    placeholder="Digite seu objetivo..."
                    className="w-full rounded-xl bg-white/60 px-4 py-2.5 text-sm text-[var(--clay-title)] outline-none placeholder:text-[var(--clay-title)]/50"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        onShowGoalForm(false);
                        setSelectedGoal("");
                        setCustomGoal("");
                      }}
                      className="flex-1 rounded-xl bg-white/60 py-2 text-sm font-semibold text-[var(--clay-title)]/70 shadow-sm"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => {
                        if (customGoal.trim()) {
                          onSaveGoal("custom", customGoal.trim());
                          onShowGoalForm(false);
                          setCustomGoal("");
                        }
                      }}
                      disabled={!customGoal.trim()}
                      className="flex-1 rounded-xl bg-gradient-to-br from-[#99BEE5] to-[#C5D9F1] py-2 text-sm font-bold text-[oklch(0.25_0.04_254)] shadow-sm disabled:opacity-50"
                    >
                      Salvar
                    </button>
                  </div>
                </div>
              )}
              <button
                onClick={() => {
                  onShowGoalForm(false);
                  setSelectedGoal("");
                  setCustomGoal("");
                }}
                className="mt-3 w-full text-center text-xs text-[var(--clay-title)]/60"
              >
                Cancelar
              </button>
            </div>
          </section>
        ) : (
          <section className="mx-auto max-w-lg rounded-2xl bg-gradient-to-br from-[#C5D9F1]/30 to-[#D7CBE8]/30 p-8 text-center shadow-sm backdrop-blur-md">
            <Icon name="self_improvement" className="mb-3 text-4xl text-[var(--clay-cta)]" />
            <h2 className="mb-2 text-xl font-bold text-[var(--clay-title)]">
              Ainda não há um plano
            </h2>
            <p className="mb-5 text-sm text-[var(--clay-text)]/70">
              Defina um objetivo para começar seu plano de cuidado personalizado.
            </p>
            <button
              onClick={() => onShowGoalForm(true)}
              className="rounded-xl bg-gradient-to-br from-[#99BEE5] to-[#C5D9F1] px-8 py-2.5 text-sm font-bold text-[oklch(0.25_0.04_254)] shadow-sm"
            >
              Criar plano de cuidado
            </button>
          </section>
        )}
      </DesktopShell>
    );
  }

  const goalLabel = goalOptions.find((g) => g.value === plan.goal)?.label ?? (plan.custom_goal || plan.goal);
  const itemsDone = checklist
    ? [checklist.water_done, checklist.walk_done, checklist.breathe_done, checklist.talk_done].filter(Boolean).length
    : 0;

  return (
    <DesktopShell>
      <header className="mb-6 flex items-center gap-4">
        <Avatar size={48} />
        <div className="flex-1">
          <h1 className="font-display text-2xl text-[var(--clay-title)]">Plano de Cuidado</h1>
          <p className="text-sm text-[var(--clay-text)]/70">{goalLabel}</p>
        </div>
        <button
          onClick={() => onShowGoalForm(true)}
          className="flex items-center gap-2 rounded-lg bg-white/70 px-4 py-2 text-xs font-semibold text-[var(--clay-cta)] shadow-sm hover:bg-white/90"
        >
          <Icon name="add" className="text-sm" />
          Novo plano
        </button>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {aiSuggestion && (
            <section className="rounded-2xl bg-gradient-to-br from-[#C5D9F1]/20 to-[#D7CBE8]/20 p-4 shadow-sm backdrop-blur-md">
              <div className="mb-1 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon name="auto_awesome" filled className="text-sm text-[var(--clay-cta)]" />
                  <h2 className="text-xs font-semibold text-[var(--clay-title)]">Sugestão da IA</h2>
                </div>
                <button
                  onClick={onRefreshSuggestion}
                  className="flex items-center gap-1 text-[10px] text-[var(--clay-title)]/40 hover:text-[var(--clay-title)]/70"
                >
                  <Icon name="refresh" className="text-xs" />
                  Atualizar
                </button>
              </div>
              <p className="text-sm leading-relaxed text-[var(--clay-text)]">{aiSuggestion}</p>
            </section>
          )}

          <section>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-[var(--clay-title)]/60">
              Checklist de hoje
            </h3>
            <div className="rounded-2xl bg-white/60 p-5 shadow-sm backdrop-blur-md">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm text-[var(--clay-title)]/70">
                  {itemsDone} de {CHECKLIST_ITEMS.length} concluídos
                </span>
                <span className="text-sm font-semibold text-[var(--clay-cta)]">
                  {Math.round((itemsDone / CHECKLIST_ITEMS.length) * 100)}%
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {CHECKLIST_ITEMS.map((item) => {
                  const done = checklist
                    ? checklist[item.key as keyof WellnessChecklist] === true
                    : false;
                  return (
                    <button
                      key={item.key}
                      onClick={() => onToggleItem(item.key, !done)}
                      className={`flex items-center gap-4 rounded-xl p-3 text-left transition-all ${
                        done
                          ? "bg-gradient-to-br from-[#C8E6C9]/40 to-[#D7CBE8]/30"
                          : "bg-white/50 hover:bg-white/70"
                      }`}
                    >
                      <span
                        className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${
                          done
                            ? "bg-gradient-to-br from-[#99BEE5] to-[#C5D9F1] text-white"
                            : "border border-[var(--clay-title)]/20 text-[var(--clay-title)]/40"
                        }`}
                      >
                        {done ? <Icon name="check" className="text-base" /> : <span className="text-base">{item.emoji}</span>}
                      </span>
                      <div className="flex-1">
                        <p
                          className={`text-sm font-semibold ${
                            done ? "text-[var(--clay-title)]" : "text-[var(--clay-title)]/70"
                          }`}
                        >
                          {item.label}
                        </p>
                        <p className="text-xs text-[var(--clay-title)]/50">{item.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
              <button
                onClick={onSaveChecklist}
                disabled={saving}
                className="mt-4 w-full rounded-xl bg-gradient-to-br from-[#99BEE5] to-[#C5D9F1] py-2.5 text-sm font-bold text-[oklch(0.25_0.04_254)] shadow-sm transition-all hover:opacity-90 active:translate-y-px disabled:opacity-50"
              >
                {saving ? "Salvando..." : "Salvar checklist do dia"}
              </button>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          {progress && (
            <section>
              <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-[var(--clay-title)]/60">
                Progresso
              </h3>
              <div className="rounded-2xl bg-white/60 p-4 shadow-sm backdrop-blur-md">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs text-[var(--clay-title)]/70">Conclusão</span>
                  <span className="text-2xl font-bold text-[var(--clay-cta)]">{progress.completionRate}%</span>
                </div>
                <div className="mb-4 h-2.5 overflow-hidden rounded-full bg-[var(--clay-title)]/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#99BEE5] to-[#D7CBE8] transition-all"
                    style={{ width: `${progress.completionRate}%` }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-white/50 p-3 text-center">
                    <p className="text-xl font-bold text-[var(--clay-title)]">{progress.currentStreak}</p>
                    <p className="text-[10px] text-[var(--clay-title)]/60">Sequência atual</p>
                  </div>
                  <div className="rounded-xl bg-white/50 p-3 text-center">
                    <p className="text-xl font-bold text-[var(--clay-title)]">{progress.totalDays}</p>
                    <p className="text-[10px] text-[var(--clay-title)]/60">Dias no plano</p>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  {[
                    { key: "waterRate", label: "💧 Água", value: progress.waterRate },
                    { key: "walkRate", label: "🚶 Caminhada", value: progress.walkRate },
                    { key: "breatheRate", label: "🌬️ Respirar", value: progress.breatheRate },
                    { key: "talkRate", label: "💬 Conversar", value: progress.talkRate },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center gap-2">
                      <span className="w-28 text-xs text-[var(--clay-title)]/70">{item.label}</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--clay-title)]/10">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#99BEE5] to-[#C5D9F1] transition-all"
                          style={{ width: `${item.value}%` }}
                        />
                      </div>
                      <span className="w-8 text-right text-xs font-semibold text-[var(--clay-title)]/70">
                        {item.value}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </DesktopShell>
  );
}
