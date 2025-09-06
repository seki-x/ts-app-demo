import { ref, onMounted } from "vue";

interface ToolInfo {
  name: string;
  description: string;
  example: string;
}

export function useToolDisplay() {
  const availableTools = ref<ToolInfo[]>([]);
  const isLoadingTools = ref(false);

  // Fetch available tools from backend
  const fetchAvailableTools = async () => {
    try {
      isLoadingTools.value = true;
      const response = await fetch("http://localhost:8000/api/tools");
      if (response.ok) {
        const data = await response.json();
        availableTools.value = data.tools || [];
      }
    } catch (error) {
      console.error("Failed to fetch tools:", error);
    } finally {
      isLoadingTools.value = false;
    }
  };

  // Helper to extract tool name from part type
  const getToolName = (partType: string): string => {
    return partType
      .replace("tool-", "")
      .replace(/([A-Z])/g, " $1")
      .trim();
  };

  // Helper to format tool names for display
  const formatToolName = (toolName: string): string => {
    const nameMap: Record<string, string> = {
      getWeather: "Weather Lookup",
      getCurrentTime: "Time Check",
      calculate: "Calculator",
    };
    return nameMap[toolName] || toolName;
  };

  // Helper to get tool icon
  const getToolIcon = (toolName: string): string => {
    const iconMap: Record<string, string> = {
      getWeather: "🌤️",
      getCurrentTime: "🕐",
      calculate: "🔢",
    };
    return iconMap[toolName] || "🛠️";
  };

  // Check if a message part is a tool call
  const isToolPart = (part: any): boolean => {
    return part.type && part.type.startsWith("tool-");
  };

  // Get tool data from a tool part
  const getToolData = (part: any) => {
    const toolName = part.type.replace("tool-", "");
    return {
      name: toolName,
      displayName: formatToolName(toolName),
      icon: getToolIcon(toolName),
      state: part.state || "completed",
      input: part.input,
      output: part.output,
      error: part.error,
    };
  };

  // Predefined example prompts
  const examplePrompts = [
    { text: "What's the weather in Tokyo?", icon: "🌤️" },
    { text: "What time is it in New York?", icon: "🕐" },
    { text: "Calculate 15 * 24 + 100", icon: "🔢" },
    {
      text: "Get the weather in London and current time in London",
      icon: "🌍",
    },
  ];

  onMounted(() => {
    fetchAvailableTools();
  });

  return {
    availableTools,
    isLoadingTools,
    examplePrompts,
    getToolName,
    formatToolName,
    getToolIcon,
    isToolPart,
    getToolData,
    fetchAvailableTools,
  };
}
