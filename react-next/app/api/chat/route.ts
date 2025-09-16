import { anthropic } from "@ai-sdk/anthropic";
import { streamText, UIMessage, convertToModelMessages, tool } from "ai";
import { config } from "dotenv";
import { z } from "zod";

config({ path: ".env.local" });

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const modelId = process.env.ANTHROPIC_MODEL || "claude-3-5-haiku-20241022";

  const result = streamText({
    model: anthropic(modelId),
    messages: convertToModelMessages(messages),
    tools: {
      weather: tool({
        description: "Get the weather in a location (fahrenheit)",
        inputSchema: z.object({
          location: z.string().describe("The location to get the weather for"),
        }),
        execute: async ({ location }) => {
          const temperature = Math.round(Math.random() * (90 - 32) + 32);
          return {
            location,
            temperature,
          };
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
