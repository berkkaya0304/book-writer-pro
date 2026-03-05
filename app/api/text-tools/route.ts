import { NextResponse } from "next/server";
import {
  getAiConfigFromHeaders,
  generateText,
  generateStream,
  QuotaExceededError,
} from "@/lib/aiProvider";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, text, additionalContext, language, tone } = body;

    const config = getAiConfigFromHeaders(req);

    let systemPrompt =
      "You are an expert novel editor. Reply ONLY with the modified text. Do not add conversational filler like 'Here is the text'.";
    let userPrompt = "";
    const langInstructions = language ? `Write in ${language}. ` : "";
    const toneInstructions = tone ? `Use a ${tone} tone. ` : "";

    switch (action) {
      case "expand":
        userPrompt = `Please expand the following text, adding more descriptive detail, sensory information, and depth. ${langInstructions}${toneInstructions}Maintain the core meaning.\n\nText:\n${text}`;
        break;
      case "summarize":
        userPrompt = `Please summarize the following text into a concise paragraph. ${langInstructions}${toneInstructions}\n\nText:\n${text}`;
        break;
      case "rewrite":
        userPrompt = `Please rewrite the following text to make it more engaging, fluid, and professionally written. Improve vocabulary and sentence structure. ${langInstructions}${toneInstructions}\n\nText:\n${text}`;
        break;
      case "tone":
        userPrompt = `Please rewrite the following text to have a ${
          additionalContext || tone || "different"
        } tone. Maintain the core meaning but change the delivery style. ${langInstructions}\n\nText:\n${text}`;
        break;
      case "grammar-check":
        systemPrompt =
          "You are an expert editor. Provide a detailed critique of spelling, grammar, and style errors in the text, and give suggestions. Reply directly with the helpful feedback. Write your response in the same language as the requested language.";
        userPrompt = `Please review the following text for any spelling, grammar, or stylistic issues. Suggest improvements. ${langInstructions}\n\nText:\n${text}`;
        break;
      default:
        throw new Error("Invalid text tool action");
    }

    if (config.provider === "google") {
      // Google: non-streaming for text tools
      const result = await generateText(config, systemPrompt, userPrompt);
      return NextResponse.json({ result });
    }

    // Ollama: keep existing non-streaming path
    const response = await fetch(`${config.ollamaUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: config.model,
        prompt: userPrompt,
        system: systemPrompt,
        stream: false,
      }),
    });
    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }
    const data = await response.json();
    return NextResponse.json({ result: data.response });
  } catch (error) {
    console.error("Text Tools API Error:", error);
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

// Also expose a streaming endpoint for generate-abstract compatibility
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { systemPrompt, userPrompt } = body;
    const config = getAiConfigFromHeaders(req);
    const stream = await generateStream(config, systemPrompt, userPrompt);
    return new NextResponse(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (error) {
    if (error instanceof QuotaExceededError) {
      return NextResponse.json(
        { error: error.message, type: "quota_exceeded" },
        { status: 402 }
      );
    }
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
