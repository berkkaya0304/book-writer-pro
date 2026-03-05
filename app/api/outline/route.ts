import { NextResponse } from "next/server";
import fs from "fs";
import {
  getAiConfigFromHeaders,
  generateText,
  QuotaExceededError,
} from "@/lib/aiProvider";

export async function POST(req: Request) {
  try {
    const { premise, chapterCount, language, tone, articleType, audience } =
      await req.json();

    const config = getAiConfigFromHeaders(req);

    const systemPrompt = `You are an expert technical writing specialist with deep experience in software engineering, computer science, and technical documentation. Generate a detailed, actionable section outline for a technical article.

ARTICLE TYPE: ${articleType || "Technical Article"}
TARGET AUDIENCE: ${audience || "Intermediate practitioners"}
LANGUAGE: ${language || "English"} — write entirely in this language.
TONE: ${tone || "Professional"}
SECTION COUNT: Generate exactly ${chapterCount} sections.

GUIDELINES FOR EACH SECTION:
- title: Clear, specific heading with context (not just "Introduction")
- outline: 2-4 sentences explaining EXACTLY what this section covers, what the reader will learn, which specific subtopics, code examples, diagrams, or benchmarks to include. Be concrete and technical. Do NOT be vague.

WARNING: Return ONLY valid JSON array. No markdown fences. No text outside the JSON.

Format:
[
  { "title": "Section Title", "outline": "Specific 2-4 sentence description." }
]`;

    const responseText = await generateText(
      config,
      systemPrompt,
      `Premise: ${premise}`
    );

    let outlineArray: Array<{ title: string; outline: string }> = [];

    try {
      let parsed = null;

      const arrayMatch = responseText.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        try {
          parsed = JSON.parse(arrayMatch[0]);
        } catch {}
      }

      if (!parsed) {
        const objectMatch = responseText.match(/\{[\s\S]*\}/);
        if (objectMatch) {
          try {
            parsed = JSON.parse(objectMatch[0]);
          } catch {}
        }
      }

      if (!parsed) {
        parsed = JSON.parse(responseText);
      }

      if (
        parsed &&
        typeof parsed === "object" &&
        !Array.isArray(parsed) &&
        parsed.error
      ) {
        throw new Error(parsed.error);
      }

      if (Array.isArray(parsed)) {
        outlineArray = parsed;
      } else if (parsed && typeof parsed === "object") {
        const arrayValue = Object.values(parsed).find((v) =>
          Array.isArray(v)
        );
        if (arrayValue) {
          outlineArray = arrayValue as typeof outlineArray;
        } else if (
          typeof parsed.title === "string" &&
          typeof parsed.outline === "string"
        ) {
          outlineArray = [parsed];
        } else {
          throw new Error("No array or valid chapter object found in the parsed JSON.");
        }
      } else {
        throw new Error("Decoded JSON is not an array or object.");
      }
    } catch (e) {
      console.error(
        "Failed to parse AI JSON response. Raw response was:\n",
        responseText
      );
      try {
        fs.writeFileSync(
          process.cwd() + "/.data/last_error.txt",
          responseText || "No response"
        );
      } catch {}

      const errorObj = e instanceof Error ? e : new Error(String(e));
      const errorMessage =
        errorObj.message &&
        errorObj.message !== "Unexpected end of JSON input" &&
        !errorObj.message.includes("Unexpected token")
          ? errorObj.message
          : "AI returned an invalid or completely malformed format.";

      return NextResponse.json(
        { error: errorMessage, rawResponse: responseText },
        { status: 500 }
      );
    }

    return NextResponse.json({ outline: outlineArray });
  } catch (error) {
    console.error("Outline API Error:", error);
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
