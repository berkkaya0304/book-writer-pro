/**
 * Returns AI-related headers to attach to every API fetch call.
 * Reads the active provider, model, and credentials from localStorage.
 */
export function getAiHeaders(): HeadersInit {
  if (typeof window === "undefined") return {};
  const provider = localStorage.getItem("aiProvider") || "ollama";
  const ollamaModel = localStorage.getItem("defaultModel") || "llama3";
  const googleModel =
    localStorage.getItem("googleModel") || "gemini-1.5-flash";
  const model = provider === "google" ? googleModel : ollamaModel;
  return {
    "Content-Type": "application/json",
    "X-AI-Provider": provider,
    "X-AI-Model": model,
    "X-Ollama-URL":
      localStorage.getItem("ollamaUrl") || "http://127.0.0.1:11434",
    "X-Google-API-Key": localStorage.getItem("googleApiKey") || "",
  };
}
