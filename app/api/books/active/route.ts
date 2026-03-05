import { NextResponse } from "next/server";
import { getActiveBookId, setActiveBookId } from "@/lib/dataUtils";

export async function GET() {
  try {
    const id = getActiveBookId();
    return NextResponse.json({ id });
  } catch (error) {
    console.error("GET /api/books/active error:", error);
    return NextResponse.json({ error: "Failed to get active book" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { id } = await req.json();
    if (!id) {
        return NextResponse.json({ error: "Id is required" }, { status: 400 });
    }
    setActiveBookId(id);
    return NextResponse.json({ id });
  } catch (error) {
    console.error("POST /api/books/active error:", error);
    return NextResponse.json({ error: "Failed to set active book" }, { status: 500 });
  }
}
