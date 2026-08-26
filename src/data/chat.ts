import type { CompanionMessageKind } from "@/lib/companions";

export type Msg = {
  from: "ai" | "user";
  text: string;
  kind?: CompanionMessageKind;
};
