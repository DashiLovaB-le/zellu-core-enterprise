import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface UserContext {
  sleepHours?: number;
  sleepLabel?: string;
  waterMl?: number;
  mood?: string;
  userName?: string;
  recentCheckin?: string;
}

const SYSTEM_PROMPT = `Você é um assistente de bem-estar emocional corporativo. Seu tom é acolhedor, profissional e maduro — nunca infantil.

Diretrizes:
- Use linguagem calorosa porém profissional, como um coach de bem-estar.
- Referencie dados do usuário (sono, hidratação, humor) de forma natural.
- Sugira ações práticas: respiração, pausa, alongamento, hidratação.
- Mantenha respostas concisas (2-4 frases).
- Nunca finja ser um terapeuta ou médico. Se algo parecer grave, sugira buscar apoio profissional.
- Se o usuário parecer ansioso ou estressado, sugira o exercício de respiração.
- Use occasionalmente uma pergunta ao final para manter o diálogo.
- Varie as saudações conforme o período do dia (bom dia, boa tarde, boa noite).`;

export const sendChatMessage = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    accessToken: z.string(),
    text: z.string().min(1),
    history: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() })),
    context: z.object({
      sleepHours: z.number().optional(),
      sleepLabel: z.string().optional(),
      waterMl: z.number().optional(),
      mood: z.string().optional(),
      userName: z.string().optional(),
      recentCheckin: z.string().optional(),
    }),
  }))
  .handler(async ({ data }: {
    data: {
      accessToken: string;
      text: string;
      history: { role: "user" | "assistant"; content: string }[];
      context: {
        sleepHours?: number;
        sleepLabel?: string;
        waterMl?: number;
        mood?: string;
        userName?: string;
        recentCheckin?: string;
      };
    };
  }) => {
    const supabase = await createClient(data.accessToken);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const apiKey = import.meta.env.OPENROUTER_API_KEY;
    if (!apiKey) return { error: "OpenRouter não configurado" };

    const name = data.context.userName ?? user.email?.split("@")[0] ?? "Ana";
    const greeting = getGreeting();

    const systemContent = `${SYSTEM_PROMPT}

Contexto do usuário:
- Nome: ${name}
- Sono: ${data.context.sleepLabel ?? "não informado"} (${data.context.sleepHours ? `${data.context.sleepHours}h` : "n/d"})
- Água: ${data.context.waterMl ? `${data.context.waterMl}ml hoje` : "não informado"}
- Humor: ${data.context.mood ?? "não informado"}
- Check-in recente: ${data.context.recentCheckin ?? "não informado"}

${greeting}`;

    const messages: ChatMessage[] = [
      { role: "system", content: systemContent },
      ...data.history.slice(-10).map((m: { role: "user" | "assistant"; content: string }) => ({ role: m.role, content: m.content })),
      { role: "user", content: data.text },
    ];

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://zellu.app",
          "X-Title": "Mundo Mental Companion",
        },
        body: JSON.stringify({
          model: "openai/gpt-4o-mini",
          messages,
          max_tokens: 300,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errBody = await response.text();
        console.error("OpenRouter error:", response.status, errBody);
        return { error: "Erro ao contactar a IA" };
      }

      const json = await response.json();
      const reply = json.choices?.[0]?.message?.content ?? "Não entendi. Pode repetir?";

      await supabase.from("chat_messages").insert([
        { user_id: user.id, text: data.text, from: "user" },
        { user_id: user.id, text: reply, from: "ai" },
      ]);

      const suggestion = extractSuggestion(reply);

      return { reply, suggestion };
    } catch (err) {
      console.error("OpenRouter fetch error:", err);
      return { error: "Erro de conexão com a IA" };
    }
  });

export const getContextualGreeting = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    accessToken: z.string(),
    context: z.object({
      sleepHours: z.number().optional(),
      sleepLabel: z.string().optional(),
      waterMl: z.number().optional(),
      userName: z.string().optional(),
    }),
  }))
  .handler(async ({ data }: {
    data: {
      accessToken: string;
      context: {
        sleepHours?: number;
        sleepLabel?: string;
        waterMl?: number;
        userName?: string;
      };
    };
  }) => {
    const supabase = await createClient(data.accessToken);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { greeting: `Bom dia! Que bom ter você aqui hoje.` };

    const apiKey = import.meta.env.OPENROUTER_API_KEY;
    if (!apiKey) return { greeting: `Bom dia! Que bom ter você aqui hoje.` };

    const name = data.context.userName ?? user.email?.split("@")[0] ?? "Ana";
    const greeting = getGreeting();

    const prompt = `Você é um assistente de bem-estar. Gere uma saudação curta (1 frase) e calorosa para ${name} neste ${greeting.toLowerCase()}.

Contexto:
- Sono: ${data.context.sleepLabel ?? "não informado"} (${data.context.sleepHours ? `${data.context.sleepHours}h` : "n/d"})
- Água: ${data.context.waterMl ? `${data.context.waterMl}ml hoje` : "não informado"}

Se houver dados de sono, mencione-os de forma natural. Seja acolhedor mas profissional.`;

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "openai/gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 80,
          temperature: 0.8,
        }),
      });

      if (!response.ok) return { greeting: `Bom dia, ${name}! Que bom ter você aqui hoje.` };

      const json = await response.json();
      const reply = json.choices?.[0]?.message?.content ?? `Bom dia, ${name}! Que bom ter você aqui hoje.`;
      return { greeting: reply };
    } catch {
      return { greeting: `Bom dia, ${name}! Que bom ter você aqui hoje.` };
    }
  });

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

function extractSuggestion(text: string): string | null {
  const lower = text.toLowerCase();
  if (lower.includes("respir") || lower.includes("respiração")) return "respirar";
  if (lower.includes("água") || lower.includes("hidrat")) return "agua";
  if (lower.includes("pausa") || lower.includes("descans")) return "pausa";
  if (lower.includes("along") || lower.includes("movimento") || lower.includes("caminh")) return "movimento";
  if (lower.includes("humor") || lower.includes("humor") || lower.includes("emoç")) return "humor";
  if (lower.includes("sono") || lower.includes("dorm")) return "sono";
  return null;
}
