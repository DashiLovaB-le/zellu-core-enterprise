export const PRIVACY_CONSENT_VERSION = "2.0";

export const RETENTION_DAYS = {
  chat: 180,
  diary: 180,
  preventive: 180,
  checkins: 365,
  logs: 90,
} as const;

export const PRIVACY_SUMMARY = {
  title: "Como usamos seus dados",
  collected: [
    "Check-ins (sono, hidratação, humor)",
    "Hábitos e plano de cuidado",
    "Diário e conversas com o companion (se você usar)",
  ],
  rhSees: [
    "Só indicadores agregados por equipe, e somente se você autorizar o compartilhamento com o RH",
    "Alertas de tendência quando o time tem pelo menos 5 pessoas que autorizaram",
  ],
  rhNeverSees: [
    "Texto do diário",
    "Mensagens do chat",
    "Seu humor, sono ou hidratação identificados",
  ],
};

export const PRIVACY_OPERATORS = [
  {
    name: "Supabase",
    purpose: "Autenticação, banco e armazenamento da plataforma",
    location: "Infraestrutura do provedor (pode incluir servidores fora do Brasil)",
  },
  {
    name: "OpenRouter (modelos de IA)",
    purpose: "Gerar respostas do companion e insights — só com o seu opt-in de IA",
    location: "Fora do Brasil (transferência internacional, art. 33)",
  },
  {
    name: "Resend",
    purpose: "E-mail de lembrete de check-in — só com o seu opt-in de e-mail",
    location: "Fora do Brasil",
  },
] as const;

export const PRIVACY_RIGHTS = [
  "Acesso e cópia dos seus dados (exportar JSON no Perfil)",
  "Correção de nome, e-mail e preferências",
  "Eliminação da conta e dos dados vinculados",
  "Revogar consentimento (incluindo IA, RH e e-mail) sem perder o companion essencial",
  "Informação sobre compartilhamentos e transferências",
] as const;

export const PRIVACY_CONTACTS = {
  operatorName: "Mundo Mental Care (operadora da plataforma)",
  controllerNote:
    "A empresa que contratou o acesso é a controladora dos dados dos colaboradores. A Mundo Mental opera a plataforma por instrução da controladora.",
  dpoEmail: "privacidade@mundomental.care",
  incidentEmail: "privacidade@mundomental.care",
} as const;
