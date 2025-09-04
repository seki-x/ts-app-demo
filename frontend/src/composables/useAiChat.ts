import { ref } from "vue";
import type { UIMessage } from "../types";

export function useAiChat() {
  const messages = ref<UIMessage[]>([]);
  const input = ref<string>("");
  const isLoading = ref<boolean>(false);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if (!input.value.trim() || isLoading.value) return;

    const userMessage = input.value.trim();

    // Add user message
    const userMsg: UIMessage = {
      role: "user",
      parts: [{ type: "text", text: userMessage }],
    };
    messages.value.push(userMsg);
    input.value = "";
    isLoading.value = true;

    try {
      const response = await fetch("http://localhost:8000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: messages.value,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      // Add empty assistant message
      const assistantMsg: UIMessage = {
        role: "assistant",
        parts: [{ type: "text", text: "" }],
      };
      messages.value.push(assistantMsg);
      const messageIndex = messages.value.length - 1;

      // Parse Server-Sent Events
      await parseSSEStream(response, messageIndex);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMsg: UIMessage = {
        role: "assistant",
        parts: [
          {
            type: "text",
            text: "Sorry, something went wrong. Please try again.",
          },
        ],
      };
      messages.value.push(errorMsg);
    } finally {
      isLoading.value = false;
    }
  };

  const parseSSEStream = async (response: Response, messageIndex: number) => {
    const reader = response.body?.getReader();
    if (!reader) throw new Error("No reader available");

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      // Add new chunk to buffer
      buffer += decoder.decode(value, { stream: true });

      // Process complete lines
      const lines = buffer.split("\n");
      buffer = lines.pop() || ""; // Keep incomplete line in buffer

      for (const line of lines) {
        // Parse SSE format: "data: {...}"
        if (line.startsWith("data: ")) {
          const dataStr = line.slice(6); // Remove "data: " prefix

          // Skip special markers
          if (dataStr === "[DONE]") {
            console.log("✅ Stream completed");
            continue;
          }

          try {
            const data = JSON.parse(dataStr);
            console.log("📨 SSE Event:", data.type, data);

            // Handle different event types
            switch (data.type) {
              case "text-delta":
                // Append text delta to the message
                messages.value[messageIndex].parts[0].text += data.delta;
                break;

              case "text-start":
                console.log("🟢 Text stream started");
                break;

              case "text-end":
                console.log("🔴 Text stream ended");
                break;

              case "finish":
                console.log("🏁 Generation finished");
                break;

              default:
                console.log("ℹ️ Other event:", data.type);
            }
          } catch (parseError) {
            console.warn("⚠️ Failed to parse SSE data:", dataStr, parseError);
          }
        }
      }
    }
  };

  return {
    messages,
    input,
    isLoading,
    handleSubmit,
  };
}
