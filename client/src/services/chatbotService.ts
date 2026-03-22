import { makeRequest } from "./apiClient";

export type ProductivityLabel =
  | "HIGH_MOTIVATION"
  | "CONSISTENT_PRODUCTIVITY"
  | "LOW_ENERGY"
  | "WORK_OVERLOAD"
  | "DISTRACTION"
  | "PROCRASTINATION"
  | "POOR_PLANNING"
  | "FORGETFULNESS";

export interface MessageClassification {
  label: ProductivityLabel;
  confidence: number;
}

export type ChatbotIntent =
  | "COMMAND_OVERDUE"
  | "COMMAND_SUMMARY"
  | "COMMAND_HELP"
  | "STATEMENT";

export interface ChatbotMessageResponse {
  reply: string;
  intent: ChatbotIntent;
  classification: MessageClassification | null;
}

export async function sendChatbotMessage(payload: {
  message: string;
  taskId?: string;
}): Promise<ChatbotMessageResponse> {
  return makeRequest<ChatbotMessageResponse>("/chatbot/message", {
    method: "POST",
    data: payload,
  });
}
