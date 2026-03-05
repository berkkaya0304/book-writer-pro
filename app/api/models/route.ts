import { NextResponse } from "next/server";

export async function GET() {
  try {
    // In a real app we might read this from a config or env
    const OLLAMA_URL = process.env.OLLAMA_URL || "http://127.0.0.1:11434";
    
    console.log(`Fetching models from ${OLLAMA_URL}/api/tags`);
    const res = await fetch(`${OLLAMA_URL}/api/tags`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      // Important to catch connection refused
    });

    if (!res.ok) {
      throw new Error(`Ollama returned status ${res.status}`);
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching Ollama models:", error);
    return NextResponse.json(
      { error: "Failed to connect to Ollama. Is it running?" },
      { status: 500 }
    );
  }
}
