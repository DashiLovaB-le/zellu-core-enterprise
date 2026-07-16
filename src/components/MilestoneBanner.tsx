import { useState, useEffect } from "react";
import { Icon } from "./Icon";

interface MilestoneBannerProps {
  currentStreak: number;
  todayActive: boolean;
  milestones: number[];
}

type MilestoneInfo = {
  title: string;
  message: string;
  icon: string;
  gradient: string;
};

const MILESTONE_MAP: Record<number, MilestoneInfo> = {
  3: {
    title: "3 dias de consistência",
    message: "Você está estabelecendo uma rotina de cuidado. Mantenha o ritmo.",
    icon: "spa",
    gradient: "from-[#99BEE5]/20 to-[#C5D9F1]/20",
  },
  7: {
    title: "1 semana de cuidado",
    message: "Uma semana completa de acompanhamento. Bom trabalho.",
    icon: "emoji_events",
    gradient: "from-[#E5C299]/20 to-[#F1D9C5]/20",
  },
  14: {
    title: "14 dias de consistência",
    message: "Duas semanas de dedicação ao seu bem-estar.",
    icon: "stars",
    gradient: "from-[#99E5C2]/20 to-[#C5F1D9]/20",
  },
  21: {
    title: "21 dias de hábito",
    message: "Três semanas de prática contínua — a rotina está se consolidando.",
    icon: "auto_awesome",
    gradient: "from-[#C299E5]/20 to-[#D9C5F1]/20",
  },
  30: {
    title: "1 mês de jornada",
    message: "Um mês de acompanhamento consistente do seu bem-estar.",
    icon: "celebration",
    gradient: "from-[#E5C299]/20 to-[#F1E5C5]/20",
  },
  60: {
    title: "2 meses de dedicação",
    message: "Dois meses de compromisso com o cuidado diário.",
    icon: "celebration",
    gradient: "from-[#99BEE5]/30 to-[#C5D9F1]/30",
  },
  90: {
    title: "3 meses de evolução",
    message: "Três meses construindo uma relação mais estável com o autocuidado.",
    icon: "celebration",
    gradient: "from-[#E59999]/20 to-[#F1C5C5]/20",
  },
};

export function MilestoneBanner({ currentStreak, todayActive, milestones }: MilestoneBannerProps) {
  const [visible, setVisible] = useState<MilestoneInfo | null>(null);

  useEffect(() => {
    if (!todayActive || milestones.length === 0) {
      setVisible(null);
      return;
    }

    const highest = [...milestones].sort((a, b) => b - a)[0];
    if (!highest || highest < 3) {
      setVisible(null);
      return;
    }

    const key = `milestone-dismissed-${highest}`;
    if (localStorage.getItem(key) === "1") {
      setVisible(null);
      return;
    }

    setVisible(MILESTONE_MAP[highest] ?? null);
  }, [milestones, currentStreak, todayActive]);

  if (!visible) return null;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${visible.gradient} p-4 shadow-sm`}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/40">
          <Icon name={visible.icon} filled className="text-lg text-[var(--clay-title)]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display text-sm font-semibold text-[var(--clay-title)]">{visible.title}</p>
          <p className="mt-0.5 text-xs text-[var(--clay-text)]/70">{visible.message}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            const highest = [...milestones].sort((a, b) => b - a)[0];
            if (highest) localStorage.setItem(`milestone-dismissed-${highest}`, "1");
            setVisible(null);
          }}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full hover:bg-white/50"
        >
          <Icon name="close" className="text-sm text-[var(--clay-title)]/50" />
        </button>
      </div>
    </div>
  );
}
