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
      'API-get-self': 'Get Notion User Info'
    };
    return nameMap[toolName] || toolName.replace(/([A-Z])/g, ' $1').trim();
  };

  // Helper to get tool icon
  const getToolIcon = (toolName: string): string => {
    const iconMap: Record<string, string> = {
      getWeather: "🌤️",
      getCurrentTime: "🕐",
      calculate: "🔢",
      'API-get-self': '👤'
    };
    return iconMap[toolName] || "🛠️";
  };

  // Check if a message part is a tool call (handles both local and MCP tools)
  const isToolPart = (part: any): boolean => {
    return (part.type && part.type.startsWith("tool-")) || part.type === 'dynamic-tool';
  };

  // Get tool name for part (handles both local and MCP tools)
  const getToolNameForPart = (part: any): string => {
    if (part.type === 'dynamic-tool') {
      return formatToolName(part.toolName);
    }
    return formatToolName(part.type.replace('tool-', ''));
  };

  // Get tool icon for part (handles both local and MCP tools)
  const getToolIconForPart = (part: any): string => {
    if (part.type === 'dynamic-tool') {
      return getToolIcon(part.toolName);
    }
    return getToolIcon(part.type.replace('tool-', ''));
  };

  // Get tool state
  const getToolState = (part: any): string => {
    if (part.type === 'dynamic-tool') {
      return part.state || 'completed';
    }
    return part.state || 'completed';
  };

  // Get tool input
  const getToolInput = (part: any): any => {
    if (part.type === 'dynamic-tool') {
      return part.input || part.rawInput || {};
    }
    return part.input;
  };

  // Get tool output
  const getToolOutput = (part: any): any => {
    if (part.type === 'dynamic-tool') {
      return part.output;
    }
    return part.output;
  };

  // Get tool error
  const getToolError = (part: any): string | null => {
    if (part.type === 'dynamic-tool') {
      return part.errorText || part.error || null;
    }
    return part.error || null;
  };

  // Format tool output for display
  const formatToolOutput = (part: any): string => {
    const output = getToolOutput(part);
    if (!output) return '';
    
    if (part.type === 'dynamic-tool') {
      // For MCP tools, the actual data is in output.content[0].text as JSON string
      if (output.content && output.content[0] && output.content[0].text) {
        try {
          const jsonData = JSON.parse(output.content[0].text);
          return JSON.stringify(jsonData, null, 2);
        } catch (e) {
          return output.content[0].text;
        }
      }
      return JSON.stringify(output, null, 2);
    }
    
    // For local tools
    return JSON.stringify(output, null, 2);
  };

  // Get comprehensive tool data from a tool part (unified for local and MCP)
  const getToolData = (part: any) => {
    return {
      name: part.type === 'dynamic-tool' ? part.toolName : part.type.replace('tool-', ''),
      displayName: getToolNameForPart(part),
      icon: getToolIconForPart(part),
      state: getToolState(part),
      input: getToolInput(part),
      output: getToolOutput(part),
      formattedOutput: formatToolOutput(part),
      error: getToolError(part),
      isMCP: part.type === 'dynamic-tool'
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
    {
      text: "Get my Notion user information",
      icon: "👤",
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
    getToolNameForPart,
    getToolIconForPart,
    getToolState,
    getToolInput,
    getToolOutput,
    getToolError,
    formatToolOutput,
    fetchAvailableTools,
  };
}
