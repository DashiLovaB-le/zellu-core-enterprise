import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { MobileChatPage } from "@/components/pages/mobile/ChatPage";
import { DesktopChatPage } from "@/components/pages/desktop/ChatPage";
import { useRequireAuth } from "@/lib/use-require-auth";
import { useAuth } from "@/lib/auth-context";
import { Icon } from "@/components/Icon";
import { loadMessages, loadGreeting, sendMessage, type ChatContext } from "@/lib/services/chat-service";
import type { Msg } from "@/data";

export const Route = createFileRoute("/")({
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
  const { session } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [greeting, setGreeting] = useState("");
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  const accessToken = session?.access_token ?? null;

  const todayContext: ChatContext = {
    userName: "Ana",
    sleepHours: 7,
    sleepLabel: "Revigorante",
    waterMl: 1200,
  };

  useEffect(() => {
    if (!accessToken || initialized) return;
    (async () => {
      const msgs = await loadMessages(accessToken);
      setMessages(msgs);

      const g = await loadGreeting(accessToken, todayContext);
      setGreeting(g);
      setInitialized(true);
    })();
  }, [accessToken, initialized, todayContext]);

  const send = useCallback(async (text: string) => {
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
  }, [accessToken, messages, isAiThinking, todayContext]);

  const handleQuickReply = useCallback((label: string) => {
    send(label);
  }, [send]);

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
        />
      </div>
    </>
  );
}
