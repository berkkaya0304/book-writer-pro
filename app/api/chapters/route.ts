import { NextResponse } from "next/server";
import { getAllFiles, saveFile } from "@/lib/dataUtils";

export async function GET() {
  try {
    const chapters = getAllFiles("chapters");
    // Sort chapters by order or createdAt
    chapters.sort((a: { order?: number }, b: { order?: number }) => {
      return (a.order || 0) - (b.order || 0);
    });
    return NextResponse.json(chapters);
  } catch (error) {
    console.error("GET /api/chapters error:", error);
    return NextResponse.json({ error: "Failed to load chapters" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const id = Date.now().toString();
    
    // Determine the next order number
    const existing = getAllFiles("chapters");
    const nextOrder = existing.length > 0 
      ? Math.max(...existing.map((c: { order?: number }) => c.order || 0)) + 1 
      : 1;
    
    const newChapter = {
      id,
      title: data.title || `Chapter ${nextOrder}`,
      outline: data.outline || "",
      content: data.content || "",
      order: nextOrder,
      createdAt: new Date().toISOString()
    };

    saveFile("chapters", id, newChapter);
    
    return NextResponse.json(newChapter);
  } catch (error) {
    console.error("POST /api/chapters error:", error);
    return NextResponse.json({ error: "Failed to create chapter" }, { status: 500 });
  }
}
