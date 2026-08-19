export const DEFAULT_TIMEZONE = "America/Sao_Paulo";

export type TimeOfDay = "manha" | "tarde" | "noite";

export function getZonedHour(timeZone = DEFAULT_TIMEZONE, at = new Date()): number {
  try {
    const hourStr = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour: "numeric",
      hourCycle: "h23",
    }).format(at);
    const hour = Number.parseInt(hourStr, 10);
    return Number.isFinite(hour) ? hour : at.getHours();
  } catch {
    return at.getHours();
  }
}

export function getTimeOfDay(timeZone = DEFAULT_TIMEZONE, at = new Date()): TimeOfDay {
  const hour = getZonedHour(timeZone, at);
  if (hour < 12) return "manha";
  if (hour < 18) return "tarde";
  return "noite";
}

export function getGreeting(timeZone = DEFAULT_TIMEZONE, at = new Date()): string {
  const tod = getTimeOfDay(timeZone, at);
  if (tod === "manha") return "Bom dia";
  if (tod === "tarde") return "Boa tarde";
  return "Boa noite";
}

export function zonedDateKey(timeZone = DEFAULT_TIMEZONE, at = new Date()): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(at);
  } catch {
    return at.toISOString().split("T")[0];
  }
}

export function addDaysToDateKey(key: string, days: number): string {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** Segunda-feira da semana civil no fuso (semana começa na segunda). */
export function mondayOfWeekKey(timeZone = DEFAULT_TIMEZONE, at = new Date()): string {
  const key = zonedDateKey(timeZone, at);
  const [y, m, d] = key.split("-").map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d, 12, 0, 0)).getUTCDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  return addDaysToDateKey(key, diff);
}

export function startOfZonedDayUtc(timeZone = DEFAULT_TIMEZONE, at = new Date()): Date {
  const key = zonedDateKey(timeZone, at);
  const probe = new Date(`${key}T12:00:00.000Z`);
  for (let offsetMin = -12 * 60; offsetMin <= 14 * 60; offsetMin += 30) {
    const candidate = new Date(probe.getTime() + offsetMin * 60 * 1000);
    candidate.setUTCHours(candidate.getUTCHours(), 0, 0, 0);
  }
  const localMidnightGuess = new Date(`${key}T00:00:00`);
  const hourAtGuess = getZonedHour(timeZone, localMidnightGuess);
  const utc = new Date(localMidnightGuess.getTime() - hourAtGuess * 3600 * 1000);
  utc.setUTCMinutes(0, 0, 0);
  return utc;
}
