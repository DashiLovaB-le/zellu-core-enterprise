import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { MobileChatPage } from "@/components/pages/mobile/ChatPage";
import { DesktopChatPage } from "@/components/pages/desktop/ChatPage";
import { useRequireAuth } from "@/lib/use-require-auth";
import { useAuth } from "@/lib/auth-context";
import { Icon } from "@/components/Icon";
import {
  loadMessages,
  loadGreeting,
  sendMessage,
  type ChatContext,
} from "@/lib/services/chat-service";
import { getLatestCheckin } from "@/lib/api/checkin.server";
import { getProfile } from "@/lib/api/auth.server";
import { loadPreventiveAlert, type PreventiveAlert } from "@/lib/services/preventiva-service";
import { PreventiveAlertBanner } from "@/components/PreventiveAlertBanner";
import type { Msg } from "@/data";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "Chat" },
      { name: "description", content: "Converse com seu acompanhante de bem-estar." },
    ],
  }),
  component: ChatPage,
});

function ChatPage() {
  const { isAuthorized, loading: authLoading } = useRequireAuth("companion");
  const { session, user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [greeting, setGreeting] = useState("");
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [preventiveAlert, setPreventiveAlert] = useState<PreventiveAlert>({
    type: "none", severity: "none", message: "", suggestion: "",
    details: { sleepChange: 0, moodChange: 0, interactionChange: 0 },
  });
  const [todayContext, setTodayContext] = useState<ChatContext>({
    userName: user?.email?.split("@")[0] ?? "Ana",
  });

  const accessToken = session?.access_token ?? null;

  useEffect(() => {
    if (!accessToken || initialized) return;
    (async () => {
      const [latestCheckin, profile, alertResult] = await Promise.all([
        getLatestCheckin({ data: { accessToken } }),
        getProfile({ data: { accessToken } }),
        loadPreventiveAlert(accessToken),
      ]);
      setPreventiveAlert(alertResult);
      const context: ChatContext = {
        userName: profile?.display_name ?? user?.email?.split("@")[0] ?? "Ana",
        sleepHours: latestCheckin?.sleep_hours,
        sleepLabel: latestCheckin?.sleep_label,
        waterMl: latestCheckin?.water_ml,
        mood: latestCheckin?.mood,
        recentCheckin: latestCheckin
          ? `Check-in feito às ${new Date(latestCheckin.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
          : undefined,
        preventiveAlert: alertResult.type !== "none"
          ? {
              hasAlert: true,
              alertType: alertResult.type,
              alertSeverity: alertResult.severity,
              alertMessage: alertResult.message,
              alertSuggestion: alertResult.suggestion,
            }
          : { hasAlert: false },
      };
      setTodayContext(context);

      const msgs = await loadMessages(accessToken);
      setMessages(msgs);

      const g = await loadGreeting(accessToken, context);
      setGreeting(g);
      setInitialized(true);
    })();
  }, [accessToken, initialized, user]);

  const send = useCallback(
    async (text: string) => {
      if (!text.trim() || !accessToken || isAiThinking) return;

      const userMsg: Msg = { from: "user", text };
      setMessages((prev) => [...prev, userMsg]);
      setDraft("");
      setIsAiThinking(true);
      setAiSuggestion(null);

      const history = messages.map((m) => ({
        role: m.from as "user" | "assistant",
        content: m.text,
      }));

      try {
        const result = await sendMessage(accessToken, text, history, todayContext);
        const aiMsg: Msg = { from: "ai", text: result.reply };
        setMessages((prev) => [...prev, aiMsg]);
        if (result.suggestion) setAiSuggestion(result.suggestion);
      } catch {
        const fallback: Msg = {
          from: "ai",
          text: "Desculpe, não consegui processar agora. Pode tentar de novo?",
        };
        setMessages((prev) => [...prev, fallback]);
      } finally {
        setIsAiThinking(false);
      }
    },
    [accessToken, messages, isAiThinking, todayContext],
  );

  const handlePreventiveSuggestion = useCallback(
    (suggestion: string) => {
      const lower = suggestion.toLowerCase();
      if (lower.includes("respir") || lower.includes("respiração")) {
        navigate({ to: "/respiro" });
      } else if (lower.includes("convers") || lower.includes("conversar")) {
        navigate({ to: "/chat" });
      } else if (lower.includes("caminh") || lower.includes("along") || lower.includes("movimento")) {
        navigate({ to: "/meu-bem-estar" });
      } else if (lower.includes("pausa")) {
        navigate({ to: "/respiro" });
      } else {
        navigate({ to: "/chat" });
      }
    },
    [navigate],
  );

  const handleQuickReply = useCallback(
    (label: string) => {
      send(label);
    },
    [send],
  );

  if (authLoading || (!initialized && accessToken)) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <Icon name="sync" className="animate-spin text-3xl text-[var(--clay-title)]" />
      </div>
    );
  }

  return (
    <>
      <div className="block md:hidden">
        <MobileChatPage
          messages={messages}
          draft={draft}
          onDraftChange={setDraft}
          onSend={send}
          greeting={greeting}
          isAiThinking={isAiThinking}
          aiSuggestion={aiSuggestion}
          onQuickReply={handleQuickReply}
          preventiveAlert={preventiveAlert}
          onSuggestionClick={handlePreventiveSuggestion}
        />
      </div>
      <div className="hidden md:block">
        <DesktopChatPage
          messages={messages}
          draft={draft}
          onDraftChange={setDraft}
          onSend={send}
          greeting={greeting}
          isAiThinking={isAiThinking}
          aiSuggestion={aiSuggestion}
          onQuickReply={handleQuickReply}
          preventiveAlert={preventiveAlert}
          onSuggestionClick={handlePreventiveSuggestion}
        />
      </div>
    </>
  );
}
