import { useState } from "react";
import { Icon } from "@/components/Icon";
import type { PreventiveAlert } from "@/lib/services/preventiva-service";

const SEVERITY_STYLES: Record<string, { bg: string; icon: string; border: string }> = {
  high: {
    bg: "from-[#FFCC80]/20 to-[#EF9A9A]/20",
    icon: "warning",
    border: "border-[#EF9A9A]/30",
  },
  medium: {
    bg: "from-[#FFCC80]/15 to-[#FFCC80]/5",
    icon: "info",
    border: "border-[#FFCC80]/30",
  },
  low: {
    bg: "from-[#C5D9F1]/20 to-[#D7CBE8]/20",
    icon: "psychiatry",
    border: "border-[#C5D9F1]/30",
  },
};

interface Props {
  alert: PreventiveAlert;
  onSuggestionClick?: (suggestion: string) => void;
}

export function PreventiveAlertBanner({ alert, onSuggestionClick }: Props) {
  const [dismissed, setDismissed] = useState(false);

  if (alert.type === "none" || !alert.message || dismissed) return null;

  const style = SEVERITY_STYLES[alert.severity] ?? SEVERITY_STYLES.low;

  return (
    <section
      className={`mb-4 rounded-2xl border bg-gradient-to-br ${style.bg} ${style.border} p-4 shadow-sm backdrop-blur-md`}
    >
      <div className="mb-1 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon
            name={style.icon}
            filled
            className={`text-sm ${alert.severity === "high" ? "text-[#EF9A9A]" : "text-[var(--clay-cta)]"}`}
          />
          <h2 className="text-xs font-semibold text-[var(--clay-title)]">
            {alert.severity === "high" ? "Atenção" : alert.severity === "medium" ? "Observe" : "Com cuidado"}
          </h2>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] text-[var(--clay-title)]/40 hover:bg-white/30 hover:text-[var(--clay-title)]/70"
          aria-label="Fechar"
        >
          <Icon name="close" className="text-sm" />
        </button>
      </div>
      <p className="text-sm leading-relaxed text-[var(--clay-text)]">{alert.message}</p>
      {alert.suggestion && (
        <button
          onClick={() => onSuggestionClick?.(alert.suggestion)}
          className="mt-2 rounded-lg bg-white/60 px-3 py-1.5 text-xs font-semibold text-[var(--clay-cta)] shadow-sm hover:bg-white/80"
        >
          {alert.suggestion.length > 60 ? alert.suggestion.slice(0, 60) + "..." : alert.suggestion}
        </button>
      )}
    </section>
  );
}
