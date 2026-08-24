import {
  getManagerDashboard,
  getCheckinStats,
  exportCsv,
  getManagerTeamRoster,
  renameManagerTeam,
  assignManagerTeamMember,
  getRhMemberSummary,
  listRhMemberSignals,
} from "@/lib/api/manager.server";
import type { DashboardData, ManagerTeamRoster } from "@/lib/api/manager.server";
import type { RhMemberSignalRow, RhMemberSummary } from "@/lib/rh-member-summary";

export async function loadDashboard(): Promise<DashboardData | null> {
  try {
    const result = await getManagerDashboard();
    if ("data" in result && result.data) return result.data as DashboardData;
  } catch {
    // fallback
  }
  return null;
}

export async function loadCheckinStats(periodDays: number = 30) {
  try {
    const result = await getCheckinStats({ data: { periodDays } });
    return "data" in result ? (result.data ?? []) : [];
  } catch {
    return [];
  }
}

export async function downloadCsv(
  periodDays: number = 30,
): Promise<string | null> {
  try {
    const result = await exportCsv({ data: { periodDays } });
    if (result.error) return null;
    return (result as { csv: string }).csv ?? null;
  } catch {
    return null;
  }
}

export async function loadTeamRoster(): Promise<ManagerTeamRoster | null> {
  try {
    const result = await getManagerTeamRoster();
    if (result.error || !result.data) return null;
    return result.data;
  } catch {
    return null;
  }
}

export async function saveTeamName(teamId: string, name: string) {
  return renameManagerTeam({ data: { teamId, name } });
}

export async function setTeamMember(profileId: string, teamId: string | null) {
  return assignManagerTeamMember({ data: { profileId, teamId } });
}

export async function loadMemberSummary(profileId: string): Promise<RhMemberSummary | null> {
  try {
    const result = await getRhMemberSummary({ data: { profileId } });
    if (result.error || !result.data) return null;
    return result.data;
  } catch {
    return null;
  }
}

export async function loadMemberSignals(teamId?: string | null): Promise<RhMemberSignalRow[]> {
  try {
    const result = await listRhMemberSignals({ data: { teamId: teamId ?? null } });
    return result.data ?? [];
  } catch {
    return [];
  }
}
