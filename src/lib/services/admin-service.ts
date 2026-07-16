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

export async function loadAdminKpis(accessToken: string): Promise<AdminKpiData | null> {
  try {
    const result = await getAdminKpis({ data: { accessToken } });
    return result.data ?? null;
  } catch {
    return null;
  }
}

export async function loadCompanies(accessToken: string): Promise<AdminCompany[]> {
  try {
    const result = await listCompanies({ data: { accessToken } });
    return result.data ?? [];
  } catch {
    return [];
  }
}

export async function saveCompany(
  accessToken: string,
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
  return upsertCompany({ data: { accessToken, ...payload } });
}

export async function removeCompany(accessToken: string, id: string) {
  return deleteCompany({ data: { accessToken, id } });
}

export async function loadEmployees(
  accessToken: string,
  companyId?: string,
): Promise<AdminEmployee[]> {
  try {
    const result = await listEmployees({ data: { accessToken, companyId } });
    return result.data ?? [];
  } catch {
    return [];
  }
}

export async function saveEmployee(
  accessToken: string,
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
  return updateEmployee({ data: { accessToken, ...payload } });
}

export async function loadTeams(accessToken: string, companyId?: string) {
  try {
    const result = await listTeams({ data: { accessToken, companyId } });
    return result.data ?? [];
  } catch {
    return [];
  }
}

export async function saveTeam(
  accessToken: string,
  payload: {
    id?: string;
    company_id: string;
    name: string;
    description?: string | null;
  },
) {
  return upsertTeam({ data: { accessToken, ...payload } });
}

export async function loadLicenses(accessToken: string): Promise<AdminLicense[]> {
  try {
    const result = await listLicenses({ data: { accessToken } });
    return result.data ?? [];
  } catch {
    return [];
  }
}

export async function saveLicense(
  accessToken: string,
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
  return upsertLicense({ data: { accessToken, ...payload } });
}

export async function loadContracts(accessToken: string): Promise<AdminContract[]> {
  try {
    const result = await listContracts({ data: { accessToken } });
    return result.data ?? [];
  } catch {
    return [];
  }
}

export async function saveContract(
  accessToken: string,
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
  return upsertContract({ data: { accessToken, ...payload } });
}

export async function loadUsageMetrics(accessToken: string): Promise<AdminUsageMetrics | null> {
  try {
    const result = await getUsageMetrics({ data: { accessToken } });
    return result.data ?? null;
  } catch {
    return null;
  }
}

export async function loadSentimentData(accessToken: string): Promise<AdminSentimentData | null> {
  try {
    const result = await getSentimentData({ data: { accessToken } });
    return result.data ?? null;
  } catch {
    return null;
  }
}

export async function loadAlertConfigs(accessToken: string): Promise<AdminAlertConfig[]> {
  try {
    const result = await listAlertConfigs({ data: { accessToken } });
    return result.data ?? [];
  } catch {
    return [];
  }
}

export async function saveAlertConfig(
  accessToken: string,
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
  return upsertAlertConfig({ data: { accessToken, ...payload } });
}

export async function loadEvaluatedAlerts(
  accessToken: string,
): Promise<AdminEvaluatedAlert[]> {
  try {
    const result = await evaluateAlerts({ data: { accessToken } });
    return result.data ?? [];
  } catch {
    return [];
  }
}

export async function downloadAdminCsv(
  accessToken: string,
  periodDays = 30,
  reportType: "checkins" | "companies" | "employees" = "checkins",
): Promise<string> {
  const result = await exportAdminCsv({ data: { accessToken, periodDays, reportType } });
  return result.csv ?? "";
}

export async function downloadAdminPdf(
  accessToken: string,
  periodDays = 30,
): Promise<string> {
  const result = await exportAdminPdf({ data: { accessToken, periodDays } });
  return result.pdfBase64 ?? "";
}
