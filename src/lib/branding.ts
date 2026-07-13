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
  appName: "Mundo Mental Companion",
  tagline: "Saúde emocional para o seu dia a dia",
  shortName: "MM Companion",
  description: "Um espaço que acolhe sua mente, dia após dia.",
  themeColor: "#F3EEE1",
  socialImage: "https://storage.googleapis.com/gpt-engineer-file-uploads/S6Ob3zuOa9dZQVmS1FswMevIGHq1/social-images/social-1780500243249-Chico.webp",
  fonts: {
    display: "Quicksand",
    body: "Nunito Sans",
  },
  poweredBy: "Powered by Zellu",
};
