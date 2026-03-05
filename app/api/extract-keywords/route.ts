import { NextRequest, NextResponse } from "next/server";
import {
  getAiConfigFromHeaders,
  generateText,
  QuotaExceededError,
} from "@/lib/aiProvider";

export async function POST(req: NextRequest) {
  try {
    const { content, count = 10 } = await req.json();
    if (!content?.trim())
      return NextResponse.json({ error: "No content" }, { status: 400 });

    const config = getAiConfigFromHeaders(req);

    const prompt = `Extract exactly ${count} keywords/keyphrases from the following academic article text. For each keyword, assign a relevance score between 0.0 and 1.0.

Respond ONLY with a valid JSON array in this exact format, with no extra text or explanation:
[{"keyword": "machine learning", "relevance": 0.95}, {"keyword": "neural networks", "relevance": 0.87}, ...]

Article text:
---
${content.slice(0, 5000)}
---`;

    const responseText = await generateText(config, "", prompt);

    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return NextResponse.json({ keywords: [] });

    const keywords = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ keywords });
  } catch (error) {
    if (error instanceof QuotaExceededError) {
      return NextResponse.json(
        { error: error.message, type: "quota_exceeded" },
        { status: 402 }
      );
    }
    return NextResponse.json(
      { error: "Failed to extract keywords" },
      { status: 503 }
    );
  }
}
