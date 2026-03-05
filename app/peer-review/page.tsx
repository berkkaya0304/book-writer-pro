"use client";

import { useEffect, useState } from "react";
import { getAllChapters, Chapter, getAllPeerReviews, createPeerReview, updatePeerReview, deletePeerReview, PeerReview, getSettings } from "@/lib/localStorageUtils";
import { MessageSquare, Plus, Check, X, Trash2, ChevronDown } from "lucide-react";

const STATUS_META: Record<string, { color: string; bg: string; label: string }> = {
  Open:     { color: "#f59e0b",              bg: "rgba(245,158,11,0.15)",  label: "Open" },
  Resolved: { color: "#6366f1",              bg: "rgba(99,102,241,0.15)",  label: "Resolved" },
  Approved: { color: "#22c55e",              bg: "rgba(34,197,94,0.15)",   label: "Approved" },
};

export default function PeerReviewPage() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [reviews, setReviews] = useState<PeerReview[]>([]);
  const [filter, setFilter] = useState<"All" | "Open" | "Resolved" | "Approved">("All");
  const [selectedChapterId, setSelectedChapterId] = useState<string>("");
  const [author, setAuthor] = useState("");
  const [comment, setComment] = useState("");

  useEffect(() => {
    const savedTheme = getSettings().theme || "dark";
    document.documentElement.className = savedTheme === "dark" ? "" : `theme-${savedTheme}`;
    setChapters(getAllChapters());
    setReviews(getAllPeerReviews());
  }, []);

  function refresh() { setReviews(getAllPeerReviews()); }

  function handleAdd() {
    if (!selectedChapterId || !comment.trim()) return;
    createPeerReview(selectedChapterId, author.trim() || "Anonymous", comment.trim());
    setComment("");
    refresh();
  }

  function handleStatus(id: string, status: PeerReview["status"]) {
    updatePeerReview(id, { status });
    refresh();
  }

  function handleDelete(id: string) {
    deletePeerReview(id);
    refresh();
  }

  const filtered = reviews.filter(r => filter === "All" || r.status === filter);
  const chapterMap = Object.fromEntries(chapters.map(c => [c.id, c.title]));

  const counts = { Open: reviews.filter(r => r.status === "Open").length, Resolved: reviews.filter(r => r.status === "Resolved").length, Approved: reviews.filter(r => r.status === "Approved").length };

  return (
    <div className="page-container">
      <h1 className="page-title">Peer Review</h1>
      <p className="page-description">Add comments, suggestions, and approval status to chapters.</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "24px" }}>
        {/* Add Review Form */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <h2 style={{ fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Plus size={18} color="var(--accent-color)" /> Add Comment
          </h2>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Chapter</label>
            <div style={{ position: "relative" }}>
              <select className="input" value={selectedChapterId} onChange={e => setSelectedChapterId(e.target.value)} style={{ appearance: "none", paddingRight: "36px" }}>
                <option value="">Select chapter…</option>
                {chapters.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
              <ChevronDown size={16} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--text-muted)" }} />
            </div>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Reviewer Name</label>
            <input className="input" placeholder="Anonymous" value={author} onChange={e => setAuthor(e.target.value)} />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Comment</label>
            <textarea className="input" rows={5} placeholder="Your comment, suggestion, or issue…" value={comment} onChange={e => setComment(e.target.value)} style={{ resize: "vertical" }} />
          </div>

          <button className="btn btn-primary" onClick={handleAdd} disabled={!selectedChapterId || !comment.trim()}>
            <MessageSquare size={16} /> Add Review
          </button>

          {/* Stats */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "12px", background: "var(--bg-tertiary)", borderRadius: "var(--radius-sm)" }}>
            {(["Open", "Resolved", "Approved"] as const).map(s => (
              <div key={s} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                <span style={{ color: STATUS_META[s].color }}>● {s}</span>
                <strong>{counts[s]}</strong>
              </div>
            ))}
          </div>
        </div>

        {/* Reviews List */}
        <div>
          {/* Filter Tabs */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
            {(["All", "Open", "Resolved", "Approved"] as const).map(f => (
              <button key={f} className={`btn ${filter === f ? "btn-primary" : "btn-secondary"}`} style={{ padding: "6px 14px", fontSize: "13px" }} onClick={() => setFilter(f)}>
                {f} {f !== "All" && <span style={{ marginLeft: "4px" }}>({counts[f as keyof typeof counts] ?? reviews.length})</span>}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: "48px", color: "var(--text-muted)" }}>
              No {filter !== "All" ? filter.toLowerCase() : ""} reviews yet.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {filtered.map(r => {
                const meta = STATUS_META[r.status];
                return (
                  <div key={r.id} className="card" style={{ padding: "16px", borderLeft: `3px solid ${meta.color}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                      <div>
                        <span style={{ fontWeight: 700, fontSize: "14px" }}>{r.author}</span>
                        <span style={{ marginLeft: "8px", fontSize: "12px", color: "var(--text-muted)" }}>on <em>{chapterMap[r.chapterId] || "Unknown chapter"}</em></span>
                      </div>
                      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                        <span style={{ background: meta.bg, color: meta.color, padding: "2px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: 700 }}>{meta.label}</span>
                        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{new Date(r.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <p style={{ fontSize: "14px", color: "var(--text-secondary)", margin: "0 0 12px 0", lineHeight: 1.6 }}>{r.comment}</p>
                    <div style={{ display: "flex", gap: "8px" }}>
                      {r.status !== "Approved" && (
                        <button className="btn btn-secondary" style={{ padding: "4px 10px", fontSize: "12px", color: "#22c55e", borderColor: "#22c55e" }} onClick={() => handleStatus(r.id, "Approved")}>
                          <Check size={13} /> Approve
                        </button>
                      )}
                      {r.status === "Open" && (
                        <button className="btn btn-secondary" style={{ padding: "4px 10px", fontSize: "12px", color: "#6366f1", borderColor: "#6366f1" }} onClick={() => handleStatus(r.id, "Resolved")}>
                          <Check size={13} /> Resolve
                        </button>
                      )}
                      {r.status !== "Open" && (
                        <button className="btn btn-secondary" style={{ padding: "4px 10px", fontSize: "12px", color: "#f59e0b", borderColor: "#f59e0b" }} onClick={() => handleStatus(r.id, "Open")}>
                          <X size={13} /> Reopen
                        </button>
                      )}
                      <button className="btn btn-secondary" style={{ padding: "4px 10px", fontSize: "12px", color: "var(--danger-color)", borderColor: "transparent", marginLeft: "auto" }} onClick={() => handleDelete(r.id)}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
