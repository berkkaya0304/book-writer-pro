"use client";

import { useEffect, useState } from "react";
import { BookOpen, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { getAllBooks, getActiveBookId, setActiveBookId as setLocalActiveBookId, createBook, deleteBook, Book } from "@/lib/localStorageUtils";

export default function Home() {
  const [books, setBooks] = useState<Book[]>([]);
  const [activeBookId, setActiveBookId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");

  function handleCreateBook() {
    if (!newTitle.trim()) return;
    try {
      const newBook = createBook(newTitle);
      setNewTitle("");
      setBooks([newBook, ...books]);
      handleSetActive(newBook.id);
    } catch(e) { console.error(e); }
  }

  function handleSetActive(id: string) {
    try {
      setLocalActiveBookId(id);
      setActiveBookId(id);
    } catch(e) { console.error(e); }
  }

  function handleDeleteBook(e: React.MouseEvent, id: string, title: string) {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to completely delete "${title}"? This cannot be undone.`)) return;
    
    try {
      const success = deleteBook(id);
      if (success) {
        setBooks(prev => prev.filter(b => b.id !== id));
        if (activeBookId === id) {
          const newActive = getActiveBookId();
          setActiveBookId(newActive !== "default" ? newActive : null);
        }
      } else {
        alert("Failed to delete book.");
      }
    } catch (e) {
      console.error(e);
      alert("Error deleting book.");
    }
  }

  useEffect(() => {
    const fetchBooks = () => {
      try {
        const data = getAllBooks();
        setBooks(data);
        
        const activeId = getActiveBookId();
        if (activeId && activeId !== "default") {
          setActiveBookId(activeId);
        } else if (data.length > 0) {
          // Fallback to first book if none active
          handleSetActive(data[0].id);
        }
      } catch(e) { console.error(e); }
    };
    
    fetchBooks();
  }, []);

  return (
    <div className="page-container">
      <h1 className="page-title">Projects Dashboard</h1>
      <p className="page-description">Manage your books and start writing your story.</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        
        {/* Books List Panel */}
        <div className="card" style={{ gridColumn: "span 2" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3>Your Books</h3>
            <div style={{ display: "flex", gap: "8px" }}>
              <input 
                type="text" 
                className="input" 
                style={{ width: "200px" }}
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="New book title..."
                onKeyDown={e => {
                  if (e.key === "Enter") handleCreateBook();
                }}
              />
              <button className="btn btn-primary" onClick={handleCreateBook}>
                <Plus size={16} /> Create
              </button>
            </div>
          </div>
          
          {books.length === 0 ? (
            <div style={{ padding: "32px", textAlign: "center", border: "1px dashed var(--border-color)", borderRadius: "var(--radius-lg)", color: "var(--text-muted)" }}>
              No books created yet. Create one to get started!
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
              {books.map(book => (
                 <div 
                   key={book.id} 
                   className="card" 
                   style={{ 
                     display: "flex", 
                     flexDirection: "column",
                     border: activeBookId === book.id ? "2px solid var(--accent-color)" : "1px solid var(--border-color)",
                     cursor: "pointer",
                     position: "relative",
                     padding: "20px"
                   }}
                   onClick={() => handleSetActive(book.id)}
                 >
                   {activeBookId === book.id && (
                     <div style={{ position: "absolute", top: "12px", right: "12px", background: "var(--accent-color)", color: "white", padding: "2px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: "bold" }}>
                       ACTIVE
                     </div>
                   )}
                   <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                     <div style={{ background: "var(--bg-tertiary)", padding: "10px", borderRadius: "10px", color: "var(--accent-color)" }}>
                       <BookOpen size={24} />
                     </div>
                     <h4 style={{ fontSize: "16px", margin: 0 }}>{book.title}</h4>
                   </div>
                   <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto" }}>
                     <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                       Created: {new Date(book.createdAt).toLocaleDateString()}
                     </div>
                     <button
                       className="btn btn-secondary"
                       style={{ padding: "6px", color: "var(--danger-color)", borderColor: "transparent" }}
                       onClick={(e) => handleDeleteBook(e, book.id, book.title)}
                       title="Delete Book"
                     >
                       <Trash2 size={16} />
                     </button>
                   </div>
                 </div>
              ))}
            </div>
          )}
        </div>

        {activeBookId && (
          <div className="card" style={{ gridColumn: "span 2", marginTop: "12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <h3 style={{ margin: "0 0 8px 0" }}>Start Working</h3>
              <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "14px" }}>Jump right into your currently active book.</p>
            </div>
            <div style={{ display: "flex", gap: "16px" }}>
              <Link href="/chapters" className="btn btn-secondary">View Chapters</Link>
              <Link href="/write" className="btn btn-primary">Start Writing</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
