import { NextResponse } from "next/server";
import { deleteBook } from "@/lib/dataUtils";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const success = deleteBook(id);
    if (success) {
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  } catch (error) {
    console.error("DELETE /api/books/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete book" }, { status: 500 });
  }
}
