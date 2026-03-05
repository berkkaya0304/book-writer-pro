import { NextResponse } from "next/server";
import { getFile, saveFile, getAllFiles } from "@/lib/dataUtils";

// GET all snapshots for a specific chapter
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: chapterId } = await params;
    
    // We store snapshots in `.data/history/{chapterId}_{timestamp}.json`
    // but the `dataUtils` isn't perfectly structured for subfolders without some tweaks.
    // Let's use a simpler approach: `.data/history/{chapterId}/` subfolder.
    // However, our dataUtils assumes a flat structure inside collections.
    // So we will store it as collection: `history_chapterId`
    
    const snapshots = getAllFiles(`history_${chapterId}`);
    // Sort by timestamp descending
    snapshots.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return NextResponse.json(snapshots);
  } catch (error) {
    console.error("GET /api/chapters/[id]/history error:", error);
    return NextResponse.json({ error: "Failed to load history" }, { status: 500 });
  }
}

// POST a new snapshot for a chapter
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: chapterId } = await params;
    const { content } = await req.json();

    const chapter = getFile("chapters", chapterId);
    if (!chapter) return NextResponse.json({ error: "Chapter not found" }, { status: 404 });

    const snapshotId = Date.now().toString();
    const newSnapshot = {
      id: snapshotId,
      chapterId: chapterId,
      content,
      createdAt: new Date().toISOString()
    };

    saveFile(`history_${chapterId}`, snapshotId, newSnapshot);
    
    return NextResponse.json(newSnapshot);
  } catch (error) {
    console.error("POST /api/chapters/[id]/history error:", error);
    return NextResponse.json({ error: "Failed to save snapshot" }, { status: 500 });
  }
}
