export interface TextPart {
  type: "text";
  text: string;
}

export interface UIMessage {
  id?: string;
  role: "user" | "assistant";
  parts: TextPart[];
}

export type ConnectionStatus =
  | "connected"
  | "disconnected"
  | "checking"
  | "error";
