import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { streamText, convertToModelMessages } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { allTools, toolInfo } from "./tools"; // Import tools

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

const MODEL_ID = process.env.ANTHROPIC_MODEL;

// Health check endpoint
app.get("/api/health", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    model: MODEL_ID,
    anthropicKeySet: !!process.env.ANTHROPIC_API_KEY,
    toolsAvailable: Object.keys(allTools).length,
  });
});

// Tools info endpoint
app.get("/api/tools", (req: Request, res: Response) => {
  res.json({
    tools: toolInfo,
    count: toolInfo.length,
  });
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

    const result = await streamText({
      model: anthropic(MODEL_ID),
      messages: convertToModelMessages(messages),
      maxOutputTokens: 1000,
      temperature: 0.7,
      tools: allTools, // Use imported tools
    });

    console.log(
      `📡 Streaming response with ${Object.keys(allTools).length} tools enabled`
    );
    result.pipeUIMessageStreamToResponse(res);
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
  console.log(`🛠️ Tools enabled: ${Object.keys(allTools).join(", ")}`);
  console.log(`🩺 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔧 Tools info: http://localhost:${PORT}/api/tools`);
});
