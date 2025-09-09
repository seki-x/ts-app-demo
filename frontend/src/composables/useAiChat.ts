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
    onFinish: (message) => {
      console.log("🎯 Frontend: Chat finished", message);
    },
    onError: (error) => {
      console.error("❌ Frontend: Chat error", error);
    },
  });

  // Watch for message changes and sync to reactive ref
  watch(
    () => chat.messages,
    (newMessages) => {
      console.log("📝 Frontend: Messages updated", newMessages);
      console.log("📊 Frontend: Message count:", newMessages.length);
      
      // Log each message in detail
      newMessages.forEach((msg, index) => {
        console.log(`📨 Frontend: Message ${index}:`, {
          id: msg.id,
          role: msg.role,
          parts: msg.parts,
          text: msg.text || msg.content
        });
      });
      
      messages.value = [...newMessages];
    },
    { deep: true, immediate: true }
  );

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if (!input.value.trim()) return;

    const messageText = input.value;
    input.value = "";

    console.log("🚀 Frontend: Sending message:", messageText);

    try {
      console.log("📡 Frontend: Chat status before send:", chat.status);
      const result = await chat.sendMessage({ text: messageText });
      console.log("✅ Frontend: SendMessage result:", result);
      console.log("📡 Frontend: Chat status after send:", chat.status);
    } catch (error) {
      console.error("❌ Frontend: Error in sendMessage:", error);
    }
  };

  // Watch for status changes
  watch(
    () => chat.status,
    (newStatus, oldStatus) => {
      console.log(`📊 Frontend: Status changed from "${oldStatus}" to "${newStatus}"`);
    },
    { immediate: true }
  );

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
