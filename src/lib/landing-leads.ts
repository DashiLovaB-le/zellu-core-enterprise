export const COMPANY_SIZES = ["ate-50", "51-200", "201-500", "501-1000", "mais-1000"] as const;
export type CompanySize = (typeof COMPANY_SIZES)[number];

export const COMPANY_SIZE_LABEL: Record<CompanySize, string> = {
  "ate-50": "Até 50 colaboradores",
  "51-200": "51 a 200 colaboradores",
  "201-500": "201 a 500 colaboradores",
  "501-1000": "501 a 1.000 colaboradores",
  "mais-1000": "Mais de 1.000 colaboradores",
};

export function companySizeLabel(size: string | null | undefined): string | null {
  if (!size) return null;
  return (COMPANY_SIZE_LABEL as Record<string, string>)[size] ?? null;
}
