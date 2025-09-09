import { experimental_createMCPClient as createMCPClient } from "ai";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import dotenv from "dotenv";

dotenv.config();

export async function createNotionMCPClient() {
  if (!process.env.NOTION_API_KEY) {
    console.error("❌ NOTION_API_KEY is required in .env file");
    return null;
  }

  try {
    const transport = new StdioClientTransport({
      command: "npx",
      args: ["-y", "@notionhq/notion-mcp-server"],
      env: {
        ...process.env,
        OPENAPI_MCP_HEADERS: JSON.stringify({
          Authorization: `Bearer ${process.env.NOTION_API_KEY}`,
          "Notion-Version": "2022-06-28",
        }),
      },
    });

    const mcpClient = await createMCPClient({
      transport,
      name: "notion-mcp",
    });

    console.log("✅ Notion MCP client created successfully");
    return mcpClient;
  } catch (error) {
    console.error("❌ Failed to create Notion MCP client:", error);
    return null;
  }
}

// Get metadata about available Notion tools
export async function getNotionToolsInfo(client: any) {
  try {
    if (!client) {
      return [];
    }

    // Get tool list for metadata
    const toolsResult = await client.listTools();

    // Extract tools array from the result
    const toolsList = toolsResult?.tools;

    // Ensure toolsList is an array
    if (!toolsList || !Array.isArray(toolsList)) {
      console.warn(
        "⚠️ Notion MCP client.listTools() did not return tools array:",
        toolsResult
      );
      return [];
    }

    return toolsList.map((tool: any) => ({
      name: tool.name,
      description: tool.description || `Notion tool: ${tool.name}`,
      example:
        tool.name === "API-get-self"
          ? "Get my Notion user information"
          : `Use ${tool.name} tool`,
    }));
  } catch (error) {
    console.error("❌ Failed to get Notion tools info:", error);
    return [];
  }
}
