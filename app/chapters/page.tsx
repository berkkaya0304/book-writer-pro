"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Book, Trash2, PenTool, Clock, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { getAllChapters, createChapter as createLocalChapter, deleteChapter as deleteLocalChapter, Chapter, updateChapterTechnicalStatus, TechnicalStatus } from "@/lib/localStorageUtils";

const STATUS_COLORS: Record<TechnicalStatus, { bg: string; text: string; border: string }> = {
  'Draft': { bg: 'rgba(100,116,139,0.15)', text: '#94a3b8', border: '#4b5563' },
  'Under Review': { bg: 'rgba(245,158,11,0.15)', text: '#f59e0b', border: '#f59e0b' },
  'Verified': { bg: 'rgba(34,197,94,0.15)', text: '#22c55e', border: '#22c55e' },
};

export default function ChaptersPage() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchChapters();
  }, []);

  const fetchChapters = () => {
    try {
      const data = getAllChapters();
      setChapters(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const createChapter = () => {
    try {
      const title = `Chapter ${chapters.length + 1}`;
      const newChap = createLocalChapter({ title, outline: "", content: "" });
      if (newChap && newChap.id) {
        router.push(`/chapters/${newChap.id}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const deleteChapter = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this chapter?")) return;
    
    try {
      deleteLocalChapter(id);
      setChapters(chapters.filter(c => c.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="page-container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
        <div>
          <h1 className="page-title">Chapters</h1>
          <p className="page-description" style={{ marginBottom: 0 }}>Organize your book structure.</p>
        </div>
        <button className="btn btn-primary" onClick={createChapter}>
          <Plus size={18} /> New Chapter
        </button>
      </div>

      {loading ? (
        <p>Loading chapters...</p>
      ) : chapters.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "48px 24px" }}>
          <Book size={48} color="var(--text-muted)" style={{ margin: "0 auto 16px" }} />
          <h3>No chapters yet</h3>
          <p style={{ color: "var(--text-secondary)", marginTop: "8px" }}>
            Create your first chapter to start writing your book.
          </p>
          <button className="btn btn-primary" onClick={createChapter} style={{ marginTop: "24px" }}>
            Add Chapter
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {chapters.map((chap, index) => (
            <div 
              key={chap.id}
              className="card" 
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", cursor: "pointer" }}
              onClick={() => router.push(`/chapters/${chap.id}`)}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{ 
                  width: "40px", height: "40px", 
                  borderRadius: "50%", 
                  backgroundColor: "var(--bg-tertiary)", 
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: "bold", color: "var(--text-secondary)"
                }}>
                  {chap.order || index + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: "16px", marginBottom: "4px" }}>{chap.title}</h3>
                  <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginBottom: "4px" }}>
                    {chap.outline ? (chap.outline.length > 60 ? chap.outline.substring(0, 60) + "..." : chap.outline) : "No outline provided"}
                  </p>
                  <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{ color: "var(--accent-color)", fontSize: "12px", fontWeight: "bold", display: "flex", alignItems: "center", gap: "4px" }}>
                      <Clock size={11} />
                      {(() => { const wc = chap.content ? chap.content.trim().split(/\s+/).filter((w: string) => w.length > 0).length : 0; return `${wc} words (~${Math.max(1, Math.ceil(wc / 200))} min)`; })()}
                    </span>
                    {/* Technical Status Badge */}
                    {(() => {
                      const status = (chap.technicalStatus || 'Draft') as TechnicalStatus;
                      const statuses: TechnicalStatus[] = ['Draft', 'Under Review', 'Verified'];
                      const nextStatus = statuses[(statuses.indexOf(status) + 1) % statuses.length];
                      const colors = STATUS_COLORS[status];
                      return (
                        <button
                          onClick={(e) => { e.stopPropagation(); updateChapterTechnicalStatus(chap.id, nextStatus); setChapters(getAllChapters()); }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '4px',
                            padding: '2px 8px', borderRadius: '999px', cursor: 'pointer',
                            border: `1px solid ${colors.border}`, backgroundColor: colors.bg,
                            color: colors.text, fontSize: '11px', fontWeight: 600
                          }}
                          title={`Click to change to: ${nextStatus}`}
                        >
                          <ShieldCheck size={10} /> {status}
                        </button>
                      );
                    })()}
                  </div>
                </div>
              </div>
              
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginLeft: "16px" }}>
                <Link href={`/write?chapterId=${chap.id}`} onClick={(e) => { e.stopPropagation(); }}>
                  <button 
                    className="btn btn-primary" 
                    style={{ padding: "6px 12px", fontSize: "14px" }}
                  >
                    <PenTool size={16} style={{ marginRight: "6px" }} /> Write
                  </button>
                </Link>
                <button 
                  className="btn btn-secondary" 
                  onClick={(e) => deleteChapter(chap.id, e)}
                  style={{ padding: "6px", color: "var(--danger-color)", borderColor: "transparent" }}
                  title="Delete Chapter"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
