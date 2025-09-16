import { anthropic } from "@ai-sdk/anthropic";
import { streamText, UIMessage, convertToModelMessages } from "ai";
import { config } from "dotenv";

config({ path: ".env.local" });

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const modelId = process.env.ANTHROPIC_MODEL || "claude-3-5-haiku-20241022";

  const result = streamText({
    model: anthropic(modelId),
    messages: convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
