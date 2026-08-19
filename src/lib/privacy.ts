export const PRIVACY_CONSENT_VERSION = "3.0";

export const RETENTION_DAYS = {
  chat: 180,
  diary: 180,
  preventive: 180,
  checkins: 365,
  logs: 90,
} as const;

export const CLINICAL_DISCLAIMER =
  "Este aplicativo não substitui atendimento psicológico, psiquiátrico, terapia nem diagnóstico. É um companion de bem-estar e autocuidado, não um serviço clínico.";

export const PRIVACY_SUMMARY = {
  title: "Como usamos seus dados",
  collected: [
    "Check-ins (sono, hidratação, humor)",
    "Hábitos e plano de cuidado",
    "Diário e conversas com o companion (se você usar)",
    "Resumos curtos do companion (memória de médio/longo prazo, se a IA estiver autorizada)",
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

export const PRIVACY_AI_PROCESSING = {
  sent: [
    "O texto que você escreve no chat",
    "Contexto de bem-estar (humor, sono, hidratação, hábitos, plano de cuidado e alerta preventivo), sem nome ou e-mail",
    "Resumos curtos que o companion guarda para lembrar o que te ajuda (nunca o texto do diário)",
  ],
  neverSent: ["Nome", "E-mail", "Texto do diário", "Identificadores da empresa"],
  routing:
    "Com o opt-in de IA, o servidor envia esse contexto à OpenRouter, que roteia a um modelo. Pedimos explicitamente data_collection=deny (sem treino/armazenamento pelo provedor) e zero data retention (ZDR) — o prompt não deve ser retido após a resposta.",
  localFallback:
    "Sem o opt-in, o companion responde só com frases locais no nosso servidor. Nada é enviado a modelo externo.",
  ourRetention: `O histórico da conversa e os resumos do companion ficam na plataforma por ${RETENTION_DAYS.chat} dias e depois são apagados automaticamente.`,
  transfer: "O processamento da IA ocorre fora do Brasil (transferência internacional, art. 33 da LGPD), somente com o seu opt-in.",
} as const;

export const PRIVACY_OPERATORS = [
  {
    name: "Supabase",
    purpose: "Autenticação, banco e armazenamento da plataforma",
    location: "Infraestrutura do provedor (pode incluir servidores fora do Brasil)",
  },
  {
    name: "OpenRouter (modelos de IA)",
    purpose:
      "Gerar respostas do companion e insights — só com o seu opt-in de IA; sem treino e com retenção zero no provedor",
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
