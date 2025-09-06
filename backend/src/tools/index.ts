import { tool } from "ai";
import { z } from "zod";

export const weatherTool = tool({
  description: "Get current weather for a location",
  inputSchema: z.object({
    location: z
      .string()
      .describe('The city and country, e.g. "San Francisco, CA"'),
  }),
  execute: async ({ location }) => {
    console.log(`🌤️ Getting weather for: ${location}`);

    // Simulate weather data (in real app, call weather API)
    const weatherData = {
      location,
      temperature: Math.round(Math.random() * 30 + 10), // 10-40°C
      condition: ["sunny", "cloudy", "rainy", "snowy"][
        Math.floor(Math.random() * 4)
      ],
      humidity: Math.round(Math.random() * 100),
      windSpeed: Math.round(Math.random() * 20),
      timestamp: new Date().toISOString(),
    };

    console.log(`🌤️ Weather data:`, weatherData);
    return weatherData;
  },
});

export const timeTool = tool({
  description: "Get the current date and time",
  inputSchema: z.object({
    timezone: z
      .string()
      .optional()
      .describe('Timezone (optional), e.g. "UTC", "America/New_York"'),
  }),
  execute: async ({ timezone = "UTC" }) => {
    console.log(`🕐 Getting current time for timezone: ${timezone}`);

    const now = new Date();
    const timeData = {
      timestamp: now.toISOString(),
      timezone,
      localTime:
        timezone === "UTC"
          ? now.toUTCString()
          : now.toLocaleString("en-US", { timeZone: timezone }),
      unixTimestamp: now.getTime(),
    };

    console.log(`🕐 Time data:`, timeData);
    return timeData;
  },
});

export const calculatorTool = tool({
  description: "Perform basic mathematical calculations",
  inputSchema: z.object({
    expression: z
      .string()
      .describe(
        'Mathematical expression to evaluate, e.g. "2 + 2" or "10 * 5"'
      ),
  }),
  execute: async ({ expression }) => {
    console.log(`🔢 Calculating: ${expression}`);

    try {
      // Simple evaluation (in production, use a proper math library)
      const result = Function(`"use strict"; return (${expression})`)();

      const calculationData = {
        expression,
        result,
        timestamp: new Date().toISOString(),
      };

      console.log(`🔢 Calculation result:`, calculationData);
      return calculationData;
    } catch (error) {
      console.error(`❌ Calculation error:`, error);
      return {
        expression,
        error: "Invalid mathematical expression",
        timestamp: new Date().toISOString(),
      };
    }
  },
});

// Export all tools as a collection
export const allTools = {
  getWeather: weatherTool,
  getCurrentTime: timeTool,
  calculate: calculatorTool,
};

// Export tool metadata for documentation
export const toolInfo = [
  {
    name: "getWeather",
    description: "Get weather information for any location",
    example: "What's the weather in Tokyo?",
  },
  {
    name: "getCurrentTime",
    description: "Get current time in any timezone",
    example: "What time is it in New York?",
  },
  {
    name: "calculate",
    description: "Perform mathematical calculations",
    example: "Calculate 15 * 24 + 100",
  },
];
