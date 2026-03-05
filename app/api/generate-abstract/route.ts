import { NextRequest, NextResponse } from "next/server";
import {
  getAiConfigFromHeaders,
  generateStream,
  QuotaExceededError,
} from "@/lib/aiProvider";

export async function POST(req: NextRequest) {
  try {
    const { content, wordCount = 200, language = "English" } =
      await req.json();

    if (!content?.trim()) {
      return NextResponse.json(
        { error: "No content provided" },
        { status: 400 }
      );
    }

    const config = getAiConfigFromHeaders(req);

    const prompt = `You are an expert academic writing assistant. Write a structured academic abstract in ${language} for the following article content.

The abstract MUST be approximately ${wordCount} words and MUST follow this structure (use these labels):
- **Background:** 1-2 sentences on context and motivation.
- **Method:** 1-2 sentences on the approach used.
- **Results:** 1-2 sentences on key findings.
- **Conclusion:** 1 sentence on implications and significance.

Do NOT include a title. Do NOT add any extra commentary. Write ONLY the abstract text.

Article content:
---
${content.slice(0, 6000)}
---`;

    const stream = await generateStream(config, "", prompt);
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
    return NextResponse.json(
      { error: "Failed to connect to AI provider" },
      { status: 503 }
    );
  }
}
