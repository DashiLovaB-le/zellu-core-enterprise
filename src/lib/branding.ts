export interface BrandingConfig {
  appName: string;
  tagline: string;
  shortName: string;
  description: string;
  themeColor: string;
  socialImage: string;
  logoMark: string;
  logoIcon: string;
  fonts: {
    display: string;
    body: string;
  };
  poweredBy: string;
}

export const BRANDING: BrandingConfig = {
  appName: "Zēllu",
  tagline: "Cuidado emocional no ritmo do trabalho",
  shortName: "Zēllu",
  description:
    "Companion digital de bem-estar emocional corporativo — acompanha colaboradores no dia a dia e entrega sinais agregados para RH, com privacidade e isolamento por empresa.",
  themeColor: "#FDF8F4",
  socialImage: "/logo.svg",
  logoMark: "/logo.svg",
  logoIcon: "/favicon.svg",
  fonts: {
    display: "Quicksand",
    body: "Nunito Sans",
  },
  poweredBy: "Powered by Dashitecnology",
};
