export type WellnessStatus = "stable" | "monitor" | "attention" | "unknown";
export type WellnessTrend = "improving" | "stable" | "worsening" | "unknown";
export type WellnessParticipation = "regular" | "low" | "none";
export type SleepSignal = "ok" | "attention" | "unknown";

export type RhWellnessSignals = {
  available: boolean;
  status: WellnessStatus;
  trend: WellnessTrend;
  participation: WellnessParticipation;
  lastActivity: string;
  sleepSignal: SleepSignal;
};

export type RhMemberSummary = {
  id: string;
  displayName: string | null;
  email: string | null;
  role: string;
  jobTitle: string | null;
  isActive: boolean;
  teamId: string | null;
  teamName: string | null;
  createdAt: string | null;
  wellness: RhWellnessSignals;
};

export type RhMemberSignalRow = {
  id: string;
  wellness: RhWellnessSignals;
};

export const RH_SUMMARY_FORBIDDEN = [
  "mood",
  "sleep_hours",
  "water",
  "diary",
  "chat",
  "privacy_",
  "checkins",
];

export function assertRhSummarySafe(payload: Record<string, unknown>): string[] {
  const keys = collectKeys(payload);
  return keys.filter((key) =>
    RH_SUMMARY_FORBIDDEN.some((f) => key.toLowerCase().includes(f)),
  );
}

function collectKeys(value: unknown, acc: string[] = []): string[] {
  if (!value || typeof value !== "object") return acc;
  if (Array.isArray(value)) {
    for (const item of value) collectKeys(item, acc);
    return acc;
  }
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    acc.push(key);
    collectKeys(nested, acc);
  }
  return acc;
}

export function wellnessStatusFromNegativePct(
  checkinCount: number,
  negativePct: number,
): WellnessStatus {
  if (checkinCount <= 0) return "unknown";
  if (negativePct >= 40) return "attention";
  if (negativePct >= 20) return "monitor";
  return "stable";
}

export function wellnessTrendFromPcts(
  recentCount: number,
  previousCount: number,
  recentNegativePct: number,
  previousNegativePct: number,
): WellnessTrend {
  if (recentCount <= 0 || previousCount <= 0) return "unknown";
  const delta = recentNegativePct - previousNegativePct;
  if (delta >= 15) return "worsening";
  if (delta <= -15) return "improving";
  return "stable";
}

export function participationFromDays(daysWithCheckin: number): WellnessParticipation {
  if (daysWithCheckin >= 4) return "regular";
  if (daysWithCheckin >= 1) return "low";
  return "none";
}

export function sleepSignalFromAvg(avgSleep: number | null): SleepSignal {
  if (avgSleep == null || avgSleep <= 0) return "unknown";
  return avgSleep < 6.5 ? "attention" : "ok";
}

export function lastActivityLabel(daysAgo: number | null): string {
  if (daysAgo == null) return "Sem check-in recente";
  if (daysAgo <= 0) return "Check-in hoje";
  if (daysAgo === 1) return "Check-in ontem";
  if (daysAgo <= 14) return `Último check-in há ${daysAgo} dias`;
  return "Sem check-in recente";
}

export function statusLabelPt(status: WellnessStatus): string {
  if (status === "attention") return "Atenção";
  if (status === "monitor") return "Monitorar";
  if (status === "stable") return "Estável";
  return "Sem dados";
}

export function trendLabelPt(trend: WellnessTrend): string {
  if (trend === "improving") return "Melhorando";
  if (trend === "worsening") return "Piorando";
  if (trend === "stable") return "Estável";
  return "Sem dados";
}

export function participationLabelPt(value: WellnessParticipation): string {
  if (value === "regular") return "Participação regular";
  if (value === "low") return "Participação baixa";
  return "Sem registros na semana";
}

export function sleepSignalLabelPt(value: SleepSignal): string {
  if (value === "ok") return "Sono em faixa adequada";
  if (value === "attention") return "Sono pedindo atenção";
  return "Sono sem dados suficientes";
}

export function unavailableWellness(): RhWellnessSignals {
  return {
    available: false,
    status: "unknown",
    trend: "unknown",
    participation: "none",
    lastActivity: "Resumo indisponível",
    sleepSignal: "unknown",
  };
}

export function buildRhWellnessSignals(input: {
  optedIn: boolean;
  recentCheckinCount: number;
  previousCheckinCount: number;
  recentNegativePct: number;
  previousNegativePct: number;
  daysWithCheckinLast7: number;
  lastCheckinDaysAgo: number | null;
  avgSleepLast7: number | null;
}): RhWellnessSignals {
  if (!input.optedIn) return unavailableWellness();
  return {
    available: true,
    status: wellnessStatusFromNegativePct(input.recentCheckinCount, input.recentNegativePct),
    trend: wellnessTrendFromPcts(
      input.recentCheckinCount,
      input.previousCheckinCount,
      input.recentNegativePct,
      input.previousNegativePct,
    ),
    participation: participationFromDays(input.daysWithCheckinLast7),
    lastActivity: lastActivityLabel(input.lastCheckinDaysAgo),
    sleepSignal: sleepSignalFromAvg(input.avgSleepLast7),
  };
}
