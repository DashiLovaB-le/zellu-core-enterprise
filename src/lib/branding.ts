export interface BrandingConfig {
  appName: string;
  tagline: string;
  shortName: string;
  description: string;
  themeColor: string;
  socialImage: string;
  fonts: {
    display: string;
    body: string;
  };
  poweredBy: string;
}

export const BRANDING: BrandingConfig = {
  appName: "Mundo Mental Care",
  tagline: "Cuidado emocional no ritmo do trabalho",
  shortName: "Mundo Mental Care",
  description:
    "Companion de bem-estar emocional que amplia o cuidado da Mundo Mental no dia a dia das equipes.",
  themeColor: "#F3EEE1",
  socialImage: "/logo.png",
  fonts: {
    display: "Quicksand",
    body: "Nunito Sans",
  },
  poweredBy: "Powered by Zellu",
};
