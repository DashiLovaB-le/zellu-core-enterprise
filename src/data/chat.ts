export type Msg = { from: "ai" | "user"; text: string };

export const INITIAL_MESSAGES: Msg[] = [
  {
    from: "ai",
    text: "Olá! Como você se sente em relação ao seu progresso esta semana?",
  },
  { from: "user", text: "Me sinto um pouco ansiosa com o trabalho." },
  {
    from: "ai",
    text: "Entendo. Em uma escala de intensidade, como você definiria essa ansiedade agora?",
  },
];

export const QUICK_REPLIES = ["Suave", "Médio", "Forte"];

export const AI_RESPONSE = "Obrigado por compartilhar. Vamos respirar juntos por um momento.";
