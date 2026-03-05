import { NextResponse } from "next/server";
import {
  getAiConfigFromHeaders,
  generateStream,
  QuotaExceededError,
} from "@/lib/aiProvider";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt, system, context } = body;

    const config = getAiConfigFromHeaders(req);

    // For Ollama we keep the context (session history) field
    if (config.provider === "ollama") {
      const OLLAMA_URL = config.ollamaUrl;
      const response = await fetch(`${OLLAMA_URL}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: config.model,
          prompt,
          system,
          context,
          stream: true,
        }),
      });
      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }
      return new NextResponse(response.body, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    // Google provider
    const stream = await generateStream(config, system || "", prompt);
    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat API Error:", error);
    if (error instanceof QuotaExceededError) {
      return NextResponse.json(
        { error: error.message, type: "quota_exceeded" },
        { status: 402 }
      );
    }
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
