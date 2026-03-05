import { GoogleGenerativeAI } from "@google/generative-ai";

export type AiProvider = "ollama" | "google";

export interface AiConfig {
  provider: AiProvider;
  model: string;
  ollamaUrl: string;
  googleApiKey: string;
}

export class QuotaExceededError extends Error {
  type = "quota_exceeded";
  constructor() {
    super("Google API quota exceeded. Please switch to Ollama or add credits.");
    this.name = "QuotaExceededError";
  }
}

/** Extract AI config from incoming request headers */
export function getAiConfigFromHeaders(req: Request): AiConfig {
  const provider = (req.headers.get("X-AI-Provider") || "ollama") as AiProvider;
  const model =
    req.headers.get("X-AI-Model") ||
    (provider === "google" ? "gemini-1.5-flash" : "llama3");
  const ollamaUrl =
    req.headers.get("X-Ollama-URL") || "http://127.0.0.1:11434";
  const googleApiKey = req.headers.get("X-Google-API-Key") || "";
  return { provider, model, ollamaUrl, googleApiKey };
}

/** Generate text (non-streaming) using either Ollama or Google */
export async function generateText(
  config: AiConfig,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  if (config.provider === "google") {
    return generateTextGoogle(config, systemPrompt, userPrompt);
  }
  return generateTextOllama(config, systemPrompt, userPrompt);
}

async function generateTextOllama(
  config: AiConfig,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const res = await fetch(`${config.ollamaUrl}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: config.model,
      prompt: userPrompt,
      system: systemPrompt,
      stream: false,
    }),
  });
  if (!res.ok) throw new Error(`Ollama error: ${res.statusText}`);
  const data = await res.json();
  return data.response as string;
}

async function generateTextGoogle(
  config: AiConfig,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  if (!config.googleApiKey) throw new Error("Google API key is not set.");
  try {
    const genAI = new GoogleGenerativeAI(config.googleApiKey);
    const model = genAI.getGenerativeModel({
      model: config.model,
      systemInstruction: systemPrompt,
    });
    const result = await model.generateContent(userPrompt);
    return result.response.text();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    // Quota / billing errors
    if (
      msg.includes("RESOURCE_EXHAUSTED") ||
      msg.includes("quota") ||
      msg.includes("429") ||
      msg.includes("billing")
    ) {
      throw new QuotaExceededError();
    }
    throw err;
  }
}

/** Generate a streaming response for Ollama. For Google we fall back to non-streaming. */
export async function generateStream(
  config: AiConfig,
  systemPrompt: string,
  userPrompt: string
): Promise<ReadableStream<Uint8Array>> {
  if (config.provider === "google") {
    // Google streaming: wrap into a text/event-stream compatible ReadableStream
    return generateStreamGoogle(config, systemPrompt, userPrompt);
  }
  return generateStreamOllama(config, systemPrompt, userPrompt);
}

async function generateStreamOllama(
  config: AiConfig,
  systemPrompt: string,
  userPrompt: string
): Promise<ReadableStream<Uint8Array>> {
  const res = await fetch(`${config.ollamaUrl}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: config.model,
      prompt: userPrompt,
      system: systemPrompt,
      stream: true,
    }),
  });
  if (!res.ok) throw new Error(`Ollama error: ${res.statusText}`);
  return res.body!;
}

async function generateStreamGoogle(
  config: AiConfig,
  systemPrompt: string,
  userPrompt: string
): Promise<ReadableStream<Uint8Array>> {
  if (!config.googleApiKey) throw new Error("Google API key is not set.");

  const encoder = new TextEncoder();
  const enqueueText = (controller: ReadableStreamDefaultController<Uint8Array>, text: string) => {
    controller.enqueue(encoder.encode(JSON.stringify({ response: text, done: false }) + "\n"));
  };

  const isQuotaError = (msg: string) =>
    msg.includes("RESOURCE_EXHAUSTED") ||
    msg.includes("quota") ||
    msg.includes("429") ||
    msg.includes("billing") ||
    msg.includes("Too Many Requests") ||
    msg.includes("RATE_LIMIT") ||
    msg.includes("rate limit");

  // Keep this strict — only real 404 / NOT_FOUND model errors
  const isModelNotFound = (msg: string) =>
    msg.includes("NOT_FOUND") ||
    msg.includes("ListModels") ||
    /\b404\b/.test(msg);

  try {
    const genAI = new GoogleGenerativeAI(config.googleApiKey);
    const model = genAI.getGenerativeModel({
      model: config.model,
      systemInstruction: systemPrompt || undefined,
    });

    // Try streaming first
    let streamResult: Awaited<ReturnType<typeof model.generateContentStream>> | null = null;
    try {
      streamResult = await model.generateContentStream(userPrompt);
    } catch (streamErr: unknown) {
      const msg = streamErr instanceof Error ? streamErr.message : String(streamErr);
      if (isQuotaError(msg)) throw new QuotaExceededError();
      if (isModelNotFound(msg)) {
        throw new Error(`Model "${config.model}" bulunamadı. Lütfen Ayarlar'dan geçerli bir model seçin (ör. gemini-2.0-flash).`);
      }

      // Other streaming error — try non-streaming fallback
      try {
        const fallbackResult = await model.generateContent(userPrompt);
        const text = fallbackResult.response.text();
        return new ReadableStream<Uint8Array>({
          start(controller) {
            enqueueText(controller, text);
            controller.enqueue(encoder.encode(JSON.stringify({ response: "", done: true }) + "\n"));
            controller.close();
          },
        });
      } catch (fallbackErr: unknown) {
        const fmsg = fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr);
        if (isModelNotFound(fmsg)) throw new Error(`Model "${config.model}" bulunamadı. Lütfen Ayarlar'dan geçerli bir model seçin.`);
        if (isQuotaError(fmsg)) throw new QuotaExceededError();
        throw fallbackErr;
      }
    }

    // Return streaming response
    return new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const chunk of streamResult!.stream) {
            const text = chunk.text();
            if (text) enqueueText(controller, text);
          }
          controller.enqueue(
            encoder.encode(JSON.stringify({ response: "", done: true }) + "\n")
          );
          controller.close();
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          if (isQuotaError(msg)) {
            controller.error(new QuotaExceededError());
          } else {
            controller.error(err);
          }
        }
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (isQuotaError(msg)) throw new QuotaExceededError();
    throw err;
  }
}

