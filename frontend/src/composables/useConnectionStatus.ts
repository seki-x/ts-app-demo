import { ref, onMounted, onUnmounted } from "vue";

export type ConnectionStatus =
  | "connected"
  | "disconnected"
  | "checking"
  | "error";

export function useConnectionStatus() {
  const status = ref<ConnectionStatus>("checking");
  const lastChecked = ref<Date | null>(null);
  const errorMessage = ref<string>("");

  let intervalId: number | null = null;

  const checkConnection = async (): Promise<void> => {
    console.log("🔍 Starting connection check...");

    try {
      status.value = "checking";
      errorMessage.value = "";

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch("http://localhost:8000/api/health", {
        signal: controller.signal,
        headers: {
          Accept: "application/json",
        },
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();

        // ✅ Add explicit status update with logging
        console.log("✅ API Health Check Success:", data);
        console.log("🔄 Updating status from", status.value, "to connected");

        status.value = "connected";
        lastChecked.value = new Date();

        console.log("📊 New status:", status.value);
        console.log("⏰ Last checked:", lastChecked.value);
      } else {
        console.log(
          "❌ API returned error status:",
          response.status,
          response.statusText
        );
        status.value = "error";
        errorMessage.value = `HTTP ${response.status}: ${response.statusText}`;
      }
    } catch (error: any) {
      console.log("💥 API Health Check Exception:", error);

      status.value = "disconnected";
      lastChecked.value = new Date();

      if (error.name === "AbortError") {
        errorMessage.value = "Connection timeout";
      } else if (error.message.includes("fetch")) {
        errorMessage.value = "Unable to reach server";
      } else {
        errorMessage.value = error.message;
      }
    }

    console.log("🏁 Connection check finished. Final status:", status.value);
  };

  const startMonitoring = (): void => {
    console.log("🚀 Starting connection monitoring...");
    checkConnection();
    intervalId = setInterval(checkConnection, 30000);
  };

  const stopMonitoring = (): void => {
    console.log("🛑 Stopping connection monitoring...");
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };

  const getStatusColor = (): string => {
    switch (status.value) {
      case "connected":
        return "#22c55e";
      case "disconnected":
        return "#ef4444";
      case "checking":
        return "#f59e0b";
      case "error":
        return "#f97316";
      default:
        return "#6b7280";
    }
  };

  const getStatusText = (): string => {
    switch (status.value) {
      case "connected":
        return "Connected";
      case "disconnected":
        return "Disconnected";
      case "checking":
        return "Checking...";
      case "error":
        return "Error";
      default:
        return "Unknown";
    }
  };

  const getStatusIcon = (): string => {
    switch (status.value) {
      case "connected":
        return "🟢";
      case "disconnected":
        return "🔴";
      case "checking":
        return "🟡";
      case "error":
        return "🟠";
      default:
        return "⚫";
    }
  };

  onMounted(() => {
    startMonitoring();
  });

  onUnmounted(() => {
    stopMonitoring();
  });

  return {
    status,
    lastChecked,
    errorMessage,
    checkConnection,
    startMonitoring,
    stopMonitoring,
    getStatusColor,
    getStatusText,
    getStatusIcon,
  };
}
