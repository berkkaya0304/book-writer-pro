import { NextResponse } from "next/server";
import { getFile, saveFile, deleteFile } from "@/lib/dataUtils";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const chapter = getFile("chapters", id);
    if (!chapter) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(chapter);
  } catch (error) {
    console.error("GET /api/chapters/[id] error:", error);
    return NextResponse.json({ error: "Failed to load chapter" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await req.json();
    
    const existing = getFile("chapters", id);
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updated = { ...existing, ...data };
    saveFile("chapters", id, updated);
    
    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/chapters/[id] error:", error);
    return NextResponse.json({ error: "Failed to update chapter" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const success = deleteFile("chapters", id);
    if (!success) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/chapters/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete chapter" }, { status: 500 });
  }
}
