import { ref, computed, watch } from "vue";
import { Chat } from "@ai-sdk/vue";
import { DefaultChatTransport } from "ai";

export function useAiChat() {
  const input = ref<string>("");
  const messages = ref<any[]>([]);

  const chat = new Chat({
    transport: new DefaultChatTransport({
      api: "http://localhost:8000/api/chat",
      headers: {
        "Content-Type": "application/json",
      },
    }),
  });

  // Watch for message changes and sync to reactive ref
  watch(
    () => chat.messages,
    (newMessages) => {
      messages.value = [...newMessages];
    },
    { deep: true, immediate: true }
  );

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if (!input.value.trim()) return;

    const messageText = input.value;
    input.value = "";

    try {
      await chat.sendMessage({ text: messageText });
    } catch (error) {
      console.error("Error in sendMessage:", error);
    }
  };

  const isLoading = computed(() => {
    return chat.status === "submitted" || chat.status === "streaming";
  });

  return {
    messages,
    input,
    isLoading,
    handleSubmit,
    status: chat.status,
    chat,
  };
}
