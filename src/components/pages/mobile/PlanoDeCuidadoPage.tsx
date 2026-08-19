import { useState } from "react";
import { MobileShell } from "@/components/MobileShell";
import { Avatar } from "@/components/Avatar";
import { Icon } from "@/components/Icon";
import { useAuth } from "@/lib/auth-context";
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
  { value: "reduzir-ansiedade", label: "Reduzir ansiedade", icon: "spa" },
  { value: "melhorar-sono", label: "Melhorar o sono", icon: "bedtime" },
  { value: "aumentar-energia", label: "Aumentar energia", icon: "bolt" },
  { value: "equilibrio-emocional", label: "Equilíbrio emocional", icon: "balance" },
  { value: "autocuidado-rotina", label: "Autocuidado na rotina", icon: "self_improvement" },
  { value: "custom", label: "Meu próprio objetivo", icon: "edit_note" },
];

const ACTION_LABEL: Record<string, string> = {
  water_done: "Registrar água",
  walk_done: "Ir ao bem-estar",
  breathe_done: "Abrir Respiro",
  talk_done: "Abrir Chat",
};

interface Props {
  plan: WellnessPlan | null;
  checklist: WellnessChecklist | null;
  progress: PlanProgress | null;
  aiSuggestion: string;
  insight: string;
  saving: boolean;
  creating: boolean;
  goalError: string;
  showGoalForm: boolean;
  confirmNewPlan: boolean;
  onShowGoalForm: (v: boolean) => void;
  onRequestNewPlan: () => void;
  onConfirmNewPlan: () => void;
  onCancelNewPlan: () => void;
  onSaveGoal: (goal: string, customGoal?: string) => void;
  onToggleItem: (key: string, value: boolean) => void;
  onItemAction: (key: string) => void;
  onRefreshSuggestion: () => void;
}

function GoalPicker({
  onSaveGoal,
  onCancel,
  showCancel,
  creating,
  goalError,
}: {
  onSaveGoal: (goal: string, customGoal?: string) => void;
  onCancel?: () => void;
  showCancel?: boolean;
  creating?: boolean;
  goalError?: string;
}) {
  const [selectedGoal, setSelectedGoal] = useState("");
  const [customGoal, setCustomGoal] = useState("");

  return (
    <section className="rounded-2xl bg-white/70 p-4 shadow-sm backdrop-blur-md">
      <h2 className="mb-1 text-sm font-bold text-[var(--clay-title)]">Qual seu objetivo?</h2>
      <p className="mb-3 text-[11px] text-[var(--clay-title)]/60">
        Escolha em um toque e já comece o checklist de hoje.
      </p>
      {goalError ? (
        <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{goalError}</p>
      ) : null}
      <div className="flex flex-col gap-2">
        {goalOptions.map((opt) => (
          <button
            key={opt.value}
            type="button"
            disabled={creating}
            onClick={() => {
              setSelectedGoal(opt.value);
              if (opt.value !== "custom") onSaveGoal(opt.value);
            }}
            className={`flex items-center gap-3 rounded-xl p-3 text-left text-sm transition-all disabled:opacity-60 ${
              selectedGoal === opt.value
                ? "bg-gradient-to-br from-[#99BEE5]/30 to-[#C5D9F1]/30 shadow-sm"
                : "bg-white/50 hover:bg-white/70"
            }`}
          >
            <Icon name={opt.icon} className="text-lg text-[var(--clay-cta)]" />
            <div>
              <p className="font-semibold text-[var(--clay-title)]">{opt.label}</p>
              {GOAL_BENEFITS[opt.value] && (
                <p className="text-[10px] text-[var(--clay-title)]/60">{GOAL_BENEFITS[opt.value]}</p>
              )}
            </div>
          </button>
        ))}
        {selectedGoal === "custom" && (
          <div className="mt-2 space-y-2">
            <input
              value={customGoal}
              onChange={(e) => setCustomGoal(e.target.value)}
              placeholder="Digite seu objetivo..."
              disabled={creating}
              className="w-full rounded-xl bg-white/60 px-3 py-2 text-sm text-[var(--clay-title)] outline-none placeholder:text-[var(--clay-title)]/50 disabled:opacity-60"
            />
            <button
              type="button"
              onClick={() => {
                if (customGoal.trim()) onSaveGoal("custom", customGoal.trim());
              }}
              disabled={creating || !customGoal.trim()}
              className="w-full rounded-xl bg-gradient-to-br from-[#99BEE5] to-[#C5D9F1] py-2 text-sm font-bold text-[oklch(0.25_0.04_254)] shadow-sm disabled:opacity-50"
            >
              {creating ? "Criando plano..." : "Começar plano"}
            </button>
          </div>
        )}
        {creating && selectedGoal !== "custom" ? (
          <p className="pt-1 text-center text-xs text-[var(--clay-title)]/60">Criando seu plano...</p>
        ) : null}
      </div>
      {showCancel && onCancel && (
        <button
          type="button"
          disabled={creating}
          onClick={onCancel}
          className="mt-3 w-full text-center text-xs text-[var(--clay-title)]/60 disabled:opacity-60"
        >
          Manter plano atual
        </button>
      )}
    </section>
  );
}

export function MobilePlanoDeCuidadoPage({
  plan,
  checklist,
  progress,
  aiSuggestion,
  insight,
  saving,
  creating,
  goalError,
  showGoalForm,
  confirmNewPlan,
  onRequestNewPlan,
  onConfirmNewPlan,
  onCancelNewPlan,
  onSaveGoal,
  onToggleItem,
  onItemAction,
  onRefreshSuggestion,
}: Props) {
  const { user } = useAuth();
  if (!plan || showGoalForm) {
    return (
      <MobileShell>
        <header className="mb-4 flex items-center gap-3">
          <Avatar name={user?.avatar_url ?? undefined} size={36} />
          <div>
            <h1 className="font-display text-xl text-[var(--clay-title)]">Plano de Cuidado</h1>
            <p className="text-xs text-[var(--clay-text)]/70">
              {plan ? "Definir novo objetivo" : "Defina seu objetivo e comece o checklist de hoje"}
            </p>
          </div>
        </header>
        <GoalPicker
          onSaveGoal={onSaveGoal}
          onCancel={plan ? onCancelNewPlan : undefined}
          showCancel={!!plan}
          creating={creating}
          goalError={goalError}
        />
      </MobileShell>
    );
  }

  const goalLabel =
    goalOptions.find((g) => g.value === plan.goal)?.label ?? (plan.custom_goal || plan.goal);
  const itemsDone = checklist
    ? [checklist.water_done, checklist.walk_done, checklist.breathe_done, checklist.talk_done].filter(
        Boolean,
      ).length
    : 0;

  return (
    <MobileShell>
      <header className="mb-4 flex items-center gap-3">
        <Avatar name={user?.avatar_url ?? undefined} size={36} />
        <div className="flex-1">
          <h1 className="font-display text-xl text-[var(--clay-title)]">Plano de Cuidado</h1>
          <p className="text-xs text-[var(--clay-text)]/70">{goalLabel}</p>
        </div>
        <button
          type="button"
          onClick={onRequestNewPlan}
          className="flex items-center gap-1 rounded-lg bg-white/70 px-2.5 py-1.5 text-[10px] font-semibold text-[var(--clay-cta)] shadow-sm"
        >
          <Icon name="edit" className="text-xs" />
          Novo plano
        </button>
      </header>

      {confirmNewPlan && (
        <section className="mb-4 rounded-2xl border border-[var(--clay-title)]/10 bg-white/80 p-4 shadow-sm">
          <p className="mb-3 text-sm text-[var(--clay-title)]">
            Trocar de objetivo encerra o plano atual e inicia um novo. Continuar?
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancelNewPlan}
              className="flex-1 rounded-xl bg-white/70 py-2 text-xs font-semibold text-[var(--clay-title)]/70"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onConfirmNewPlan}
              className="flex-1 rounded-xl bg-gradient-to-br from-[#99BEE5] to-[#C5D9F1] py-2 text-xs font-bold text-[oklch(0.25_0.04_254)]"
            >
              Continuar
            </button>
          </div>
        </section>
      )}

      <section className="mb-4 rounded-2xl bg-white/60 p-3 shadow-sm backdrop-blur-md">
        <p className="text-xs leading-relaxed text-[var(--clay-text)]">{insight}</p>
        {saving && (
          <p className="mt-1 text-[10px] text-[var(--clay-title)]/50">Salvando...</p>
        )}
      </section>

      <section className="mb-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--clay-title)]/60">
            Hoje
          </h3>
          <span className="text-xs font-semibold text-[var(--clay-cta)]">
            {itemsDone}/{CHECKLIST_ITEMS.length}
          </span>
        </div>
        <div className="rounded-2xl bg-white/60 p-4 shadow-sm backdrop-blur-md">
          <div className="mb-3 h-2 overflow-hidden rounded-full bg-[var(--clay-title)]/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#99BEE5] to-[#D7CBE8] transition-all"
              style={{ width: `${(itemsDone / CHECKLIST_ITEMS.length) * 100}%` }}
            />
          </div>
          <div className="flex flex-col gap-2">
            {CHECKLIST_ITEMS.map((item) => {
              const done = checklist ? checklist[item.key as keyof WellnessChecklist] === true : false;
              return (
                <div
                  key={item.key}
                  className={`rounded-xl p-3 transition-all ${
                    done
                      ? "bg-gradient-to-br from-[#C8E6C9]/40 to-[#D7CBE8]/30"
                      : "bg-white/50"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onToggleItem(item.key, !done)}
                    className="flex w-full items-center gap-3 text-left"
                  >
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-sm transition-all ${
                        done
                          ? "bg-gradient-to-br from-[#99BEE5] to-[#C5D9F1] text-white"
                          : "border border-[var(--clay-title)]/20 text-[var(--clay-title)]/40"
                      }`}
                    >
                      {done ? <Icon name="check" className="text-sm" /> : item.emoji}
                    </span>
                    <div className="flex-1">
                      <p
                        className={`text-sm font-semibold ${
                          done ? "text-[var(--clay-title)]" : "text-[var(--clay-title)]/70"
                        }`}
                      >
                        {item.label}
                      </p>
                      <p className="text-[10px] text-[var(--clay-title)]/50">{item.description}</p>
                    </div>
                  </button>
                  {!done && (
                    <button
                      type="button"
                      onClick={() => onItemAction(item.key)}
                      className="mt-2 w-full rounded-lg bg-white/60 py-1.5 text-[10px] font-semibold text-[var(--clay-cta)]"
                    >
                      {ACTION_LABEL[item.key] ?? "Fazer agora"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {progress && (
        <section className="mb-4">
          <h3 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--clay-title)]/60">
            Progresso
          </h3>
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-white/60 p-3 text-center shadow-sm">
              <p className="text-lg font-bold text-[var(--clay-cta)]">{progress.completionRate}%</p>
              <p className="text-[9px] text-[var(--clay-title)]/60">Conclusão</p>
            </div>
            <div className="rounded-xl bg-white/60 p-3 text-center shadow-sm">
              <p className="text-lg font-bold text-[var(--clay-title)]">{progress.currentStreak}</p>
              <p className="text-[9px] text-[var(--clay-title)]/60">Sequência</p>
            </div>
            <div className="rounded-xl bg-white/60 p-3 text-center shadow-sm">
              <p className="text-lg font-bold text-[var(--clay-title)]">{progress.totalDays}</p>
              <p className="text-[9px] text-[var(--clay-title)]/60">Dias</p>
            </div>
          </div>
        </section>
      )}

      {aiSuggestion && (
        <section className="mb-6 rounded-2xl bg-gradient-to-br from-[#C5D9F1]/20 to-[#D7CBE8]/20 p-3 shadow-sm backdrop-blur-md">
          <div className="mb-1 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Icon name="auto_awesome" filled className="text-xs text-[var(--clay-cta)]" />
              <h2 className="text-[10px] font-semibold text-[var(--clay-title)]">Sugestão</h2>
            </div>
            <button
              type="button"
              onClick={onRefreshSuggestion}
              className="text-[var(--clay-title)]/40 hover:text-[var(--clay-title)]/70"
            >
              <Icon name="refresh" className="text-xs" />
            </button>
          </div>
          <p className="text-xs leading-relaxed text-[var(--clay-text)]">{aiSuggestion}</p>
        </section>
      )}
    </MobileShell>
  );
}
