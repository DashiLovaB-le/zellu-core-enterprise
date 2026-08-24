import {
  getManagerDashboard,
  getCheckinStats,
  exportCsv,
  getRhReportPreview,
  getManagerTeamRoster,
  renameManagerTeam,
  assignManagerTeamMember,
  getRhMemberSummary,
  listRhMemberSignals,
  setManagerJobTitle,
} from "@/lib/api/manager.server";
import type { DashboardData, ManagerTeamRoster, RhDashboardData } from "@/lib/api/manager.server";
import type { RhMemberSignalRow, RhMemberSummary } from "@/lib/rh-member-summary";
import type {
  ReportPreviousSnapshot,
  ReportPreview,
  ReportType,
} from "@/lib/rh-reports";

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

export type RhReportExportParams = {
  periodDays: number;
  teamName?: string | null;
  reportType: ReportType;
};

export type RhReportPreviewPayload = {
  periodDays: number;
  teamName: string | null;
  reportType: ReportType;
  preview: ReportPreview;
  current: RhDashboardData;
  previous: ReportPreviousSnapshot | null;
};

export async function loadRhReportPreview(
  params: RhReportExportParams,
): Promise<RhReportPreviewPayload | null> {
  try {
    const result = await getRhReportPreview({
      data: {
        periodDays: params.periodDays,
        teamName: params.teamName ?? null,
        reportType: params.reportType,
      },
    });
    if (result.error || !result.data) return null;
    return result.data;
  } catch {
    return null;
  }
}

export async function downloadCsv(
  periodDays: number = 30,
  options?: { teamName?: string | null; reportType?: ReportType },
): Promise<string | null> {
  try {
    const result = await exportCsv({
      data: {
        periodDays,
        teamName: options?.teamName ?? null,
        reportType: options?.reportType ?? "teams",
      },
    });
    if (result.error) return null;
    return result.csv ?? null;
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

export async function saveMemberJobTitle(profileId: string, jobTitle: string) {
  return setManagerJobTitle({ data: { profileId, jobTitle } });
}
