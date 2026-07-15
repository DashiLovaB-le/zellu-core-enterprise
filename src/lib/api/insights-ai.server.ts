import { createServerFn } from "@tanstack/react-start";
import { logEvent } from "@/lib/api/logs.server";
import { getActiveLlmConfig, callLlmWithFallback } from "@/lib/api/llm-config.server";
import type { ChatMessage } from "@/lib/api/llm-config.server";

interface InsightContext {
  // Dados agregados do usuário
  userName: string;
  daysTracked: number;
  
  // Humor
  predominantMood?: string;
  moodDistribution?: Record<string, number>; // { "Feliz": 5, "Ansioso": 3, ... }
  moodTrend?: "melhorando" | "piorando" | "estável";
  anxiousCount?: number;
  happyCount?: number;
  
  // Sono
  avgSleep?: number;
  sleepTrend?: "melhorando" | "piorando" | "estável";
  goodSleepCount?: number;
  
  // Hidratação
  avgWater?: number;
  waterTrend?: "melhorando" | "piorando" | "estável";
  
  // Movimento
  avgMovement?: number;
  movementTrend?: "melhorando" | "piorando" | "estável";
  
  // Energia
  avgEnergy?: number;
  energyTrend?: "melhorando" | "piorando" | "estável";
  
  // Padrões identificados
  patterns?: string[];
  
  // Contexto específico
  contextType: "timeline" | "dashboard" | "chat" | "anxiety-change" | "sleep-quality" | "weekly-summary";
  
  // Dados específicos por contexto
  anxietyChangePercent?: number;
  weeklyComparison?: {
    sleep: { current: number; previous: number };
    water: { current: number; previous: number };
    movement: { current: number; previous: number };
  };
}

interface InsightResponse {
  insight: string;
  suggestion?: string;
}



function buildSystemPrompt(contextType: string): string {
  const basePrompt = `Você é um assistente de bem-estar empático e profissional.
Sua missão é gerar insights personalizados baseados em dados de saúde mental e bem-estar do usuário.

DIRETRIZES:
- Use linguagem natural, acolhedora e corporativa (não infantil)
- Seja específico e baseado em dados concretos
- Correlacione variáveis quando relevante (sono ↔ humor, movimento ↔ energia)
- Seja breve (1-2 frases, máximo 150 caracteres quando possível)
- Use tom encorajador, nunca crítico
- Evite jargões médicos ou psicológicos complexos
- Foque em observações, não em diagnósticos`;

  const contextPrompts: Record<string, string> = {
    timeline: `
CONTEXTO: Timeline/Diário
FORMATO: Uma frase observacional sobre a evolução recente do usuário, destacando padrões ou progressos.
EXEMPLO: "Nas últimas duas semanas, você demonstrou mais tranquilidade após dias com sono acima de 7h."`,

    dashboard: `
CONTEXTO: Dashboard Emocional
FORMATO: Insight sobre métricas agregadas, correlacionando variáveis quando possível.
EXEMPLO: "Seus dias com melhor humor coincidem com noites de sono de qualidade e movimento regular."`,

    "anxiety-change": `
CONTEXTO: Mudança no nível de ansiedade
FORMATO: Observação sobre a mudança percentual, com contexto e encorajamento ou sugestão gentil.
EXEMPLO: "Você teve 18% menos dias ansiosos esta semana — continue cultivando seus hábitos de sono e movimento."`,

    "sleep-quality": `
CONTEXTO: Qualidade do sono
FORMATO: Correlação entre sono e outras métricas de bem-estar.
EXEMPLO: "Suas 7 horas de sono médias têm refletido em dias com mais energia e equilíbrio emocional."`,

    "weekly-summary": `
CONTEXTO: Resumo semanal comparativo
FORMATO: Observação sobre mudanças semanais, destacando progressos e oportunidades.
EXEMPLO: "Esta semana você melhorou em movimento e hidratação — que tal manter esse ritmo?"`,

    chat: `
CONTEXTO: Conversa no chat
FORMATO: Observação contextual e personalizada sobre o estado atual ou recente do usuário.
EXEMPLO: "Percebi que você tem dormido melhor nos últimos dias. Como está se sentindo em relação a isso?"`,
  };

  return basePrompt + "\n\n" + (contextPrompts[contextType] || contextPrompts.timeline);
}

function buildUserPrompt(context: InsightContext): string {
  const {
    userName,
    daysTracked,
    predominantMood,
    moodDistribution,
    avgSleep,
    avgWater,
    avgMovement,
    avgEnergy,
    anxietyChangePercent,
    weeklyComparison,
    patterns = [],
    contextType,
  } = context;

  let prompt = `Gere um insight personalizado para ${userName}.\n\n`;
  prompt += `DADOS DO USUÁRIO:\n`;
  prompt += `- Dias rastreados: ${daysTracked}\n`;

  if (predominantMood) {
    prompt += `- Humor predominante: ${predominantMood}\n`;
  }

  if (moodDistribution) {
    const moods = Object.entries(moodDistribution)
      .sort(([, a], [, b]) => b - a)
      .map(([mood, count]) => `${mood} (${count}x)`)
      .join(", ");
    prompt += `- Distribuição de humor: ${moods}\n`;
  }

  if (avgSleep !== undefined) {
    prompt += `- Sono médio: ${avgSleep.toFixed(1)}h/noite\n`;
  }

  if (avgWater !== undefined) {
    prompt += `- Hidratação média: ${avgWater.toFixed(0)}ml/dia\n`;
  }

  if (avgMovement !== undefined) {
    prompt += `- Movimento médio: ${avgMovement.toFixed(0)}min/dia\n`;
  }

  if (avgEnergy !== undefined) {
    prompt += `- Energia média: ${avgEnergy.toFixed(0)}/100\n`;
  }

  if (anxietyChangePercent !== undefined) {
    const direction = anxietyChangePercent <= 0 ? "redução" : "aumento";
    prompt += `- Mudança na ansiedade: ${Math.abs(anxietyChangePercent)}% de ${direction} vs semana anterior\n`;
  }

  if (weeklyComparison) {
    prompt += `\nCOMPARAÇÃO SEMANAL:\n`;
    if (weeklyComparison.sleep) {
      const diff = weeklyComparison.sleep.current - weeklyComparison.sleep.previous;
      prompt += `- Sono: ${diff > 0 ? "+" : ""}${diff.toFixed(1)}h\n`;
    }
    if (weeklyComparison.water) {
      const diff = weeklyComparison.water.current - weeklyComparison.water.previous;
      prompt += `- Água: ${diff > 0 ? "+" : ""}${diff.toFixed(0)}ml\n`;
    }
    if (weeklyComparison.movement) {
      const diff = weeklyComparison.movement.current - weeklyComparison.movement.previous;
      prompt += `- Movimento: ${diff > 0 ? "+" : ""}${diff.toFixed(0)}min\n`;
    }
  }

  if (patterns.length > 0) {
    prompt += `\nPADRÕES IDENTIFICADOS:\n`;
    patterns.forEach((p) => (prompt += `- ${p}\n`));
  }

  prompt += `\nTIPO DE INSIGHT: ${contextType}\n`;
  prompt += `\nGere um insight naturalístico, específico e encorajador baseado nesses dados.`;

  return prompt;
}

export const generateInsight = createServerFn({ method: "POST" })
  .inputValidator((data: { accessToken: string; context: InsightContext }) => data)
  .handler(async ({ data }) => {
    const { context } = data;

    try {
      const config = await getActiveLlmConfig();
      if (!config.api_key) {
        await logEvent("info", "insights-ai.generateInsight", `Insight baseado em regras (sem API key): ${context.contextType}`, { contextType: context.contextType, userName: context.userName });
        return { insight: generateRuleBasedInsight(context) };
      }

      const systemContent = buildSystemPrompt(context.contextType);
      const userContent = buildUserPrompt(context);

      const messages: ChatMessage[] = [
        { role: "system", content: systemContent },
        { role: "user", content: userContent },
      ];

      const result = await callLlmWithFallback(messages, config, "insights-ai.generateInsight");

      if ("error" in result) {
        await logEvent("error", "insights-ai.generateInsight", `Todos os modelos falharam: ${context.contextType}`, { contextType: context.contextType, error: result.error });
        return { insight: generateRuleBasedInsight(context) };
      }

      const insight = result.content.trim();
      await logEvent("info", "insights-ai.generateInsight", `Insight gerado via ${result.model}: ${context.contextType}`, { contextType: context.contextType, model: result.model, userName: context.userName });
      return {
        insight: insight || generateRuleBasedInsight(context),
      };
    } catch (error) {
      console.error("Error generating AI insight:", error);
      await logEvent("error", "insights-ai.generateInsight", `Erro ao gerar insight via IA: ${context.contextType}`, { contextType: context.contextType, error: String(error) });
      return { insight: generateRuleBasedInsight(context) };
    }
  });

// Fallback baseado em regras quando a IA não está disponível
function generateRuleBasedInsight(context: InsightContext): string {
  const {
    userName,
    predominantMood,
    avgSleep,
    anxietyChangePercent,
    contextType,
    daysTracked,
  } = context;

  if (contextType === "anxiety-change" && anxietyChangePercent !== undefined) {
    const abs = Math.abs(anxietyChangePercent);
    if (anxietyChangePercent <= 0) {
      return `Você teve ${abs}% menos ansiedade esta semana. ${avgSleep && avgSleep >= 7 ? "Seu sono de qualidade está fazendo diferença!" : "Continue assim!"}`;
    }
    return `Percebi ${abs}% mais dias de ansiedade esta semana. ${avgSleep && avgSleep < 6.5 ? "Melhorar o sono pode ajudar." : "Que tal pausas de respiração ao longo do dia?"}`;
  }

  if (contextType === "timeline") {
    if (predominantMood === "Feliz") {
      return `${userName}, você tem cultivado mais dias de tranquilidade recentemente. Continue nutrindo esses hábitos!`;
    }
    if (predominantMood === "Ansioso") {
      return `Percebi que a ansiedade tem aparecido com mais frequência. ${avgSleep && avgSleep < 7 ? "Melhorar o sono pode fazer diferença." : "Lembre-se de fazer pausas ao longo do dia."}`;
    }
    return `${userName}, você tem ${daysTracked} dias registrados. Essa consistência é um passo importante no autocuidado.`;
  }

  if (contextType === "dashboard") {
    if (avgSleep && avgSleep >= 7 && predominantMood === "Feliz") {
      return `Seus dias com melhor humor coincidem com noites de sono de qualidade. Continue priorizando o descanso!`;
    }
    if (avgSleep && avgSleep < 6.5) {
      return `Melhorar seu sono pode refletir positivamente no seu humor e energia ao longo do dia.`;
    }
    return `Você está construindo um histórico valioso de autocuidado. Continue assim!`;
  }

  return `Continue registrando seu dia a dia — isso ajuda você e a IA a identificar padrões importantes.`;
}
