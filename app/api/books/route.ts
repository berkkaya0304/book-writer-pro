import { NextResponse } from "next/server";
import { getAllBooks, createBook } from "@/lib/dataUtils";

export async function GET() {
  try {
    const books = getAllBooks();
    return NextResponse.json(books);
  } catch (error) {
    console.error("GET /api/books error:", error);
    return NextResponse.json({ error: "Failed to load books" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { title } = await req.json();
    if (!title) {
        return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    const book = createBook(title);
    return NextResponse.json(book);
  } catch (error) {
    console.error("POST /api/books error:", error);
    return NextResponse.json({ error: "Failed to create book" }, { status: 500 });
  }
}
