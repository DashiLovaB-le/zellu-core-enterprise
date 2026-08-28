import {
  listLandingLeads,
  updateLandingLead,
  deleteLandingLead,
  type LandingLead,
  type LandingLeadStatus,
} from "@/lib/api/leads.server";
import {
  getAdminKpis,
  listCompanies,
  upsertCompany,
  deleteCompany,
  listEmployees,
  updateEmployee,
  listTeams,
  upsertTeam,
  listLicenses,
  upsertLicense,
  listContracts,
  upsertContract,
  getUsageMetrics,
  getSentimentData,
  listAlertConfigs,
  upsertAlertConfig,
  evaluateAlerts,
  exportAdminCsv,
  exportAdminPdf,
  type AdminKpiData,
  type AdminCompany,
  type AdminEmployee,
  type AdminLicense,
  type AdminContract,
  type AdminUsageMetrics,
  type AdminSentimentData,
  type AdminAlertConfig,
  type AdminEvaluatedAlert,
} from "@/lib/api/admin.server";

export async function loadAdminKpis(): Promise<AdminKpiData | null> {
  try {
    const result = await getAdminKpis();
    return result.data ?? null;
  } catch {
    return null;
  }
}

export async function loadCompanies(): Promise<AdminCompany[]> {
  try {
    const result = await listCompanies();
    return result.data ?? [];
  } catch {
    return [];
  }
}

export async function saveCompany(
  payload: {
    id?: string;
    name: string;
    document?: string | null;
    industry?: string | null;
    contact_email?: string | null;
    contact_phone?: string | null;
    status?: "active" | "inactive" | "trial" | "churned";
    seats?: number;
    notes?: string | null;
  },
) {
  return upsertCompany({ data: { ...payload } });
}

export async function removeCompany(id: string) {
  return deleteCompany({ data: { id } });
}

export async function loadEmployees(
  companyId?: string,
): Promise<AdminEmployee[]> {
  try {
    const result = await listEmployees({ data: { companyId } });
    return result.data ?? [];
  } catch {
    return [];
  }
}

export async function saveEmployee(
  payload: {
    id: string;
    company_id?: string | null;
    team_id?: string | null;
    job_title?: string | null;
    role?: "companion" | "manager";
    is_active?: boolean;
    display_name?: string;
  },
) {
  return updateEmployee({ data: { ...payload } });
}

export async function loadTeams(companyId?: string) {
  try {
    const result = await listTeams({ data: { companyId } });
    return result.data ?? [];
  } catch {
    return [];
  }
}

export async function saveTeam(
  payload: {
    id?: string;
    company_id: string;
    name: string;
    description?: string | null;
  },
) {
  return upsertTeam({ data: { ...payload } });
}

export async function loadLicenses(): Promise<AdminLicense[]> {
  try {
    const result = await listLicenses();
    return result.data ?? [];
  } catch {
    return [];
  }
}

export async function saveLicense(
  payload: {
    id?: string;
    company_id: string;
    plan_name?: string;
    seats?: number;
    seats_used?: number;
    status?: "active" | "expired" | "suspended" | "trial";
    starts_at?: string;
    ends_at?: string | null;
  },
) {
  return upsertLicense({ data: { ...payload } });
}

export async function loadContracts(): Promise<AdminContract[]> {
  try {
    const result = await listContracts();
    return result.data ?? [];
  } catch {
    return [];
  }
}

export async function saveContract(
  payload: {
    id?: string;
    company_id: string;
    title: string;
    contract_type?: "saas" | "pilot" | "enterprise" | "renewal";
    value_brl?: number;
    status?: "draft" | "active" | "expired" | "cancelled";
    starts_at?: string | null;
    ends_at?: string | null;
    notes?: string | null;
  },
) {
  return upsertContract({ data: { ...payload } });
}

export async function loadUsageMetrics(): Promise<AdminUsageMetrics | null> {
  try {
    const result = await getUsageMetrics();
    return result.data ?? null;
  } catch {
    return null;
  }
}

export async function loadSentimentData(): Promise<AdminSentimentData | null> {
  try {
    const result = await getSentimentData();
    return result.data ?? null;
  } catch {
    return null;
  }
}

export async function loadAlertConfigs(): Promise<AdminAlertConfig[]> {
  try {
    const result = await listAlertConfigs();
    return result.data ?? [];
  } catch {
    return [];
  }
}

export async function saveAlertConfig(
  payload: {
    id?: string;
    company_id?: string | null;
    name: string;
    mood_negative_warn?: number;
    mood_negative_critical?: number;
    sleep_hours_min?: number;
    water_ml_min?: number;
    adhesion_min_pct?: number;
    enabled?: boolean;
  },
) {
  return upsertAlertConfig({ data: { ...payload } });
}

export async function loadEvaluatedAlerts(): Promise<AdminEvaluatedAlert[]> {
  try {
    const result = await evaluateAlerts();
    return result.data ?? [];
  } catch {
    return [];
  }
}

export async function downloadAdminCsv(
  periodDays = 30,
  reportType: "checkins" | "companies" | "employees" = "checkins",
): Promise<string> {
  const result = await exportAdminCsv({ data: { periodDays, reportType } });
  return result.csv ?? "";
}

export async function downloadAdminPdf(
  periodDays = 30,
): Promise<string> {
  const result = await exportAdminPdf({ data: { periodDays } });
  return result.pdfBase64 ?? "";
}

export async function loadLandingLeads(): Promise<LandingLead[]> {
  try {
    const result = await listLandingLeads();
    return result.data ?? [];
  } catch {
    return [];
  }
}

export async function saveLandingLead(payload: {
  id: string;
  status?: LandingLeadStatus;
  notes?: string | null;
}) {
  return updateLandingLead({ data: payload });
}

export async function removeLandingLead(id: string) {
  return deleteLandingLead({ data: { id } });
}

export type { LandingLead, LandingLeadStatus };
