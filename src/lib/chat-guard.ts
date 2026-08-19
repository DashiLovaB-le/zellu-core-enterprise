export type ChatTurn = { role: "user" | "assistant"; content: string };

export type ServerChatContext = {
  sleepHours?: number;
  sleepLabel?: string;
  waterMl?: number;
  mood?: string;
  userName?: string;
  recentCheckin?: string;
  preventiveLine: string;
  planGoal?: string;
};

/** Cliente pode enviar history/context; o servidor ignora e usa só o banco. */
export function selectTrustedChatHistory(
  _clientHistory: unknown,
  dbHistory: ChatTurn[],
  limit = 10,
): ChatTurn[] {
  void _clientHistory;
  return dbHistory.slice(-limit);
}

export function selectTrustedChatContext(
  _clientContext: unknown,
  serverContext: ServerChatContext,
): ServerChatContext {
  void _clientContext;
  return serverContext;
}
