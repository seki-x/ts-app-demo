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
  let retryTimeoutId: number | null = null;
  let retryAttempts = 0;
  const maxRetries = 5;

  const checkConnection = async (isRetry: boolean = false): Promise<void> => {
    if (isRetry) {
      console.log(`🔄 Retry attempt ${retryAttempts}/${maxRetries}`);
    } else {
      console.log("🔍 Starting connection check...");
      retryAttempts = 0;
    }

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

        console.log("✅ API Health Check Success:", data);
        status.value = "connected";
        lastChecked.value = new Date();
        retryAttempts = 0; // Reset retry counter on success

        // Clear any pending retries
        if (retryTimeoutId) {
          clearTimeout(retryTimeoutId);
          retryTimeoutId = null;
        }
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
      console.log("💥 API Health Check Exception:", error.message);

      lastChecked.value = new Date();

      if (error.name === "AbortError") {
        errorMessage.value = "Connection timeout";
      } else if (
        error.message.includes("fetch") ||
        error.message.includes("CONNECTION_REFUSED")
      ) {
        errorMessage.value = "Unable to reach server";

        // 🚀 Smart retry logic for initial connection failures
        if (retryAttempts < maxRetries) {
          retryAttempts++;
          const retryDelay = Math.min(
            1000 * Math.pow(2, retryAttempts - 1),
            10000
          ); // Exponential backoff, max 10s

          console.log(
            `🔄 Will retry in ${retryDelay}ms (attempt ${retryAttempts}/${maxRetries})`
          );
          status.value = "checking"; // Keep checking status during retries
          errorMessage.value = `Retrying... (${retryAttempts}/${maxRetries})`;

          retryTimeoutId = setTimeout(() => {
            checkConnection(true);
          }, retryDelay);

          return; // Don't set status to disconnected yet
        }
      } else {
        errorMessage.value = error.message;
      }

      // Only set disconnected if all retries failed
      status.value = "disconnected";
    }

    console.log("🏁 Connection check finished. Final status:", status.value);
  };

  const startMonitoring = (): void => {
    console.log("🚀 Starting connection monitoring...");

    // ✨ Start with immediate check (with retries)
    checkConnection();

    // Then check every 30 seconds
    intervalId = setInterval(() => checkConnection(), 30000);
  };

  const stopMonitoring = (): void => {
    console.log("🛑 Stopping connection monitoring...");

    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }

    if (retryTimeoutId !== null) {
      clearTimeout(retryTimeoutId);
      retryTimeoutId = null;
    }

    retryAttempts = 0;
  };

  const forceCheck = (): void => {
    console.log("👆 Manual connection check triggered");

    // Clear any pending retries
    if (retryTimeoutId) {
      clearTimeout(retryTimeoutId);
      retryTimeoutId = null;
    }

    checkConnection();
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
        return retryAttempts > 0
          ? `Retrying... (${retryAttempts}/${maxRetries})`
          : "Checking...";
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
        return retryAttempts > 0 ? "🔄" : "🟡";
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
    checkConnection: forceCheck, // Expose manual check
    startMonitoring,
    stopMonitoring,
    getStatusColor,
    getStatusText,
    getStatusIcon,
  };
}
