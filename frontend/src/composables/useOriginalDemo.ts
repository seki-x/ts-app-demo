import { ref } from "vue";

export function useOriginalDemo() {
  const message = ref<string>("Click the button!");

  const fetchMessage = async (): Promise<void> => {
    try {
      const response = await fetch("http://localhost:8000/api/hello");
      const data = await response.json();
      message.value = data.message;
    } catch (error) {
      console.error("Error fetching message:", error);
    }
  };

  return {
    message,
    fetchMessage,
  };
}
