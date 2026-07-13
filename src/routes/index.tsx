import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileChatPage } from "@/components/pages/mobile/ChatPage";
import { DesktopChatPage } from "@/components/pages/desktop/ChatPage";
import { INITIAL_MESSAGES, AI_RESPONSE } from "@/data";
import type { Msg } from "@/data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Chat — Sereno" },
      { name: "description", content: "Converse com seu acompanhante de saúde mental." },
    ],
  }),
  component: ChatPage,
});

function ChatPage() {
  const isMobile = useIsMobile();
  const [messages, setMessages] = useState<Msg[]>(INITIAL_MESSAGES);
  const [draft, setDraft] = useState("");

  const send = (text: string) => {
    if (!text.trim()) return;
    setMessages((m) => [...m, { from: "user", text }]);
    setDraft("");
    setTimeout(() => {
      setMessages((m) => [...m, { from: "ai", text: AI_RESPONSE }]);
    }, 700);
  };

  if (isMobile) {
    return (
      <MobileChatPage messages={messages} draft={draft} onDraftChange={setDraft} onSend={send} />
    );
  }

  return (
    <DesktopChatPage messages={messages} draft={draft} onDraftChange={setDraft} onSend={send} />
  );
}
