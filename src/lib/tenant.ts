export const K_ANONYMITY_MIN = 5;

export type TeamAggregate = {
  name: string;
  memberCount: number;
  avgSleep: number;
  avgMood: number;
  avgWater: number;
  negativeMoodPct: number;
  status: "stable" | "attention" | "monitor";
  metricsHidden: boolean;
};

export function scopeByCompanyId<T extends { company_id: string | null }>(
  rows: T[],
  companyId: string,
): T[] {
  return rows.filter((row) => row.company_id === companyId);
}

export function applyKAnonymity<T extends TeamAggregate>(
  team: T,
  minMembers = K_ANONYMITY_MIN,
): T {
  if (team.memberCount > 0 && team.memberCount < minMembers) {
    return {
      ...team,
      avgSleep: 0,
      avgMood: 0,
      avgWater: 0,
      negativeMoodPct: 0,
      status: "stable",
      metricsHidden: true,
    };
  }
  return { ...team, metricsHidden: false };
}

export function companyMetricsAllowed(
  optedInCompanionCount: number,
  minMembers = K_ANONYMITY_MIN,
): boolean {
  return optedInCompanionCount >= minMembers;
}

export function hideAlertsForSmallTeams<T extends { team: string }>(
  alerts: T[],
  teams: Array<{ name: string; metricsHidden: boolean }>,
): T[] {
  const hidden = new Set(teams.filter((t) => t.metricsHidden).map((t) => t.name));
  return alerts.filter((alert) => !hidden.has(alert.team));
}

export function assertNoPrivateFields(payload: Record<string, unknown>): string[] {
  const forbidden = ["content", "text", "diary", "chat_messages"];
  return Object.keys(payload).filter((key) =>
    forbidden.some((f) => key.toLowerCase().includes(f)),
  );
}

export function applyProfileUpdateGuard<T extends Record<string, unknown>>(
  oldRow: T,
  newRow: T,
  callerRole: string | null,
  isServiceRole: boolean,
): T {
  if (isServiceRole || callerRole === "admin" || callerRole === "dev") {
    return newRow;
  }
  return {
    ...newRow,
    role: oldRow.role,
    company_id: oldRow.company_id,
    team_id: oldRow.team_id,
    is_active: oldRow.is_active,
  };
}
