import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { streamText, convertToModelMessages } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { getLocalTools, getAllToolsInfo } from "./tools"; // Import tools
import { createNotionMCPClient } from "./mcp/notion-client.js";

// Load environment variables
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Validate environment variables
if (!process.env.ANTHROPIC_API_KEY) {
  console.error("❌ ANTHROPIC_API_KEY is required in .env file");
  process.exit(1);
}
if (!process.env.ANTHROPIC_MODEL) {
  console.error("❌ ANTHROPIC_MODEL is required in .env file");
  process.exit(1);
}
if (!process.env.NOTION_API_KEY) {
  console.warn("⚠️ NOTION_API_KEY is missing - Notion MCP tool will not work");
}

const MODEL_ID = process.env.ANTHROPIC_MODEL;

// Load tools dynamically (removed - now handled per request)

// Health check endpoint
app.get("/api/health", (req: Request, res: Response) => {
  const localTools = getLocalTools();
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    model: MODEL_ID,
    anthropicKeySet: !!process.env.ANTHROPIC_API_KEY,
    notionKeySet: !!process.env.NOTION_API_KEY,
    toolsAvailable: Object.keys(localTools).length + (process.env.NOTION_API_KEY ? 1 : 0),
  });
});

// Tools info endpoint
app.get("/api/tools", async (req: Request, res: Response) => {
  try {
    const toolInfo = await getAllToolsInfo();
    res.json({
      tools: toolInfo,
      count: toolInfo.length,
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to get tools info",
      tools: [],
      count: 0,
    });
  }
});

app.get("/api/hello", (req: Request, res: Response) => {
  res.json({ message: "Hello from Express + TypeScript!" });
});

// AI chat endpoint with tools
app.post("/api/chat", async (req: Request, res: Response) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages array is required" });
    }

    console.log(`🤖 Using model: ${MODEL_ID}`);
    console.log(`💬 Processing ${messages.length} messages`);

    // Initialize tools - local tools plus Notion MCP if available
    const localTools = getLocalTools();
    console.log(`🔧 Local tools loaded:`, Object.keys(localTools));
    
    let notionMCPClient: any = null;
    let allTools = localTools;
    
    if (process.env.NOTION_API_KEY) {
      console.log(`📝 Attempting to load Notion MCP tools...`);
      try {
        notionMCPClient = await createNotionMCPClient();
        if (notionMCPClient) {
          const notionTools = await notionMCPClient.tools();
          console.log(`📝 Raw Notion tools:`, notionTools);
          console.log(`📝 Notion tool names:`, Object.keys(notionTools));
          
          // Test if tools are callable functions
          Object.entries(notionTools).forEach(([name, tool]) => {
            console.log(`🔍 Tool "${name}":`, {
              isFunction: typeof tool === 'function',
              hasExecute: tool && typeof tool.execute === 'function',
              toolObject: tool
            });
          });
          
          allTools = { ...localTools, ...notionTools };
          console.log(`📝 Successfully loaded ${Object.keys(notionTools).length} Notion MCP tools`);
        } else {
          console.warn('⚠️ Notion MCP client creation returned null');
        }
      } catch (error) {
        console.warn('⚠️ Failed to load Notion MCP tools, using local tools only:', error);
      }
    } else {
      console.log(`⚠️ No NOTION_API_KEY found, skipping Notion MCP tools`);
    }
    
    console.log(`🛠️ Final tools available:`, Object.keys(allTools));
    console.log(`🛠️ Total tools count: ${Object.keys(allTools).length}`);
    
    const result = await streamText({
      model: anthropic(MODEL_ID),
      messages: convertToModelMessages(messages),
      maxOutputTokens: 1000,
      temperature: 0.7,
      maxSteps: 10, // Increase steps to ensure continuation
      tools: allTools,
      experimental_continueSteps: true, // Force continuation after tool calls
      system: "You are a helpful assistant. When you use tools, always provide a final response to the user explaining what you found or accomplished. Never end with just tool calls - always give the user a summary of the results.",
      experimental_toolCallStreaming: true, // Enable tool call streaming
      onStepStart: ({ stepType, toolCalls, isContinued }) => {
        console.log(`\n🚀 Step starting - Type: ${stepType}, Continued: ${isContinued}`);
        
        if (stepType === 'initial') {
          console.log(`💭 Model is thinking about the request...`);
        } else if (stepType === 'continue') {
          console.log(`🔄 Model is continuing after tool results...`);
        }
        
        if (toolCalls && toolCalls.length > 0) {
          console.log(`🛠️ About to call ${toolCalls.length} tool(s):`);
          toolCalls.forEach((call, index) => {
            console.log(`  ${index + 1}. Tool: "${call.toolName}"`);
            console.log(`     Input:`, JSON.stringify(call.args, null, 2));
            
            // Check if tool exists
            if (allTools[call.toolName]) {
              console.log(`     ✅ Tool found in available tools`);
            } else {
              console.log(`     ❌ Tool NOT found in available tools!`);
              console.log(`     Available tools:`, Object.keys(allTools));
            }
          });
        } else if (stepType === 'tool-call') {
          console.log(`⚠️ Step type is 'tool-call' but no toolCalls provided!`);
        }
      },
      onStepFinish: ({ stepType, text, toolCalls, toolResults, usage, finishReason }) => {
        console.log(`\n🔍 Step finished - Type: ${stepType}`);
        
        if (text) {
          console.log(`📝 Generated text: "${text}"`);
        }
        
        if (toolCalls && toolCalls.length > 0) {
          console.log(`🛠️ Tool calls made (${toolCalls.length}):`);
          toolCalls.forEach((call, index) => {
            console.log(`  ${index + 1}. ${call.toolName}:`);
            console.log(`     Input:`, JSON.stringify(call.args, null, 2));
          });
        } else if (stepType === 'tool-call') {
          console.log(`⚠️ Step type was 'tool-call' but no toolCalls in results!`);
        }
        
        if (toolResults && toolResults.length > 0) {
          console.log(`📊 Tool results (${toolResults.length}):`);
          toolResults.forEach((result, index) => {
            console.log(`  ${index + 1}. ${result.toolName}:`);
            console.log(`     Raw result object:`, result);
            
            if (result.result) {
              console.log(`     ✅ Success - Output:`, JSON.stringify(result.result, null, 2));
            } else if (result.output) {
              // Handle MCP format results
              console.log(`     🔍 MCP Tool Output:`, JSON.stringify(result.output, null, 2));
              if (result.output.isError) {
                console.log(`     ❌ MCP Tool Error:`, result.output.content);
              } else {
                console.log(`     ✅ MCP Tool Success:`, result.output.content);
              }
            } else if (result.error) {
              console.log(`     ❌ Error:`, result.error);
            } else {
              console.log(`     ⚠️ No result or error - Tool may have failed silently`);
              console.log(`     Result keys:`, Object.keys(result));
            }
          });
        } else if (toolCalls && toolCalls.length > 0) {
          console.log(`⚠️ Tool calls were made but no toolResults returned!`);
        }
        
        if (usage) {
          console.log(`💰 Token usage:`, usage);
        }
        
        if (finishReason) {
          console.log(`🏁 Finish reason: ${finishReason}`);
          if (finishReason === 'tool-calls') {
            console.log(`ℹ️ Model wants to continue after tool results`);
          } else if (finishReason === 'stop') {
            console.log(`ℹ️ Conversation completed normally`);
          } else {
            console.log(`ℹ️ Unexpected finish reason: ${finishReason}`);
          }
        }
      },
      onFinish: async ({ text, toolCalls, toolResults, usage, finishReason }) => {
        console.log('\n🔄 Stream finished - Final Summary:');
        console.log(`📝 Final text: "${text}"`);
        console.log(`🛠️ Total tool calls: ${toolCalls?.length || 0}`);
        console.log(`📊 Total tool results: ${toolResults?.length || 0}`);
        console.log(`💰 Total usage:`, usage);
        console.log(`🏁 Final finish reason: ${finishReason}`);
        
        if (finishReason === 'tool-calls') {
          console.log('⚠️ WARNING: Stream ended with tool-calls reason - model may not have provided final response to user');
          console.log('💡 Consider adjusting maxSteps or model instructions');
        }
        
        // Close Notion MCP client if it was created
        if (notionMCPClient) {
          try {
            await notionMCPClient.close();
            console.log('✅ Notion MCP client closed');
          } catch (error) {
            console.error('❌ Error closing Notion MCP client:', error);
          }
        }
      }
    });

    console.log(
      `📡 Streaming response with ${Object.keys(allTools).length} tools enabled`
    );
    
    // Log what's being streamed to frontend
    const stream = result.pipeUIMessageStreamToResponse(res);
    
    // Debug: Log what's being sent to frontend
    console.log(`📤 Starting to pipe response to frontend...`);
  } catch (error: any) {
    console.error("❌ Chat error:", error);
    if (!res.headersSent) {
      res.status(500).json({
        error: "Failed to process chat request",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
});

const PORT = parseInt(process.env.PORT || "8000");

app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
  console.log(
    `🔑 Anthropic API Key: ${
      process.env.ANTHROPIC_API_KEY ? "Set ✅" : "Missing ❌"
    }`
  );
  console.log(`🤖 Model: ${MODEL_ID}`);
  
  const localTools = getLocalTools();
  const toolsMessage = process.env.NOTION_API_KEY 
    ? `${Object.keys(localTools).join(", ")} + Notion MCP tools (loaded per request)`
    : Object.keys(localTools).join(", ");
  console.log(`🛠️ Tools available: ${toolsMessage}`);
  
  console.log(`🩺 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔧 Tools info: http://localhost:${PORT}/api/tools`);
});
