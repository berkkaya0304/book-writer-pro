"use client";

import { useEffect, useState } from "react";
import { Hash, Plus, Trash2, Edit2, X, Check } from "lucide-react";
import {
  Footnote, getAllFootnotes, createFootnote, updateFootnote,
  deleteFootnote, getAllChapters, Chapter, getSettings
} from "@/lib/localStorageUtils";

export default function FootnotesPage() {
  const [footnotes, setFootnotes] = useState<Footnote[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [filterChapterId, setFilterChapterId] = useState<string>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newChapterId, setNewChapterId] = useState("");
  const [newText, setNewText] = useState("");

  useEffect(() => {
    const s = getSettings();
    document.documentElement.className = s.theme === "dark" ? "" : `theme-${s.theme}`;
    load();
  }, []);

  const load = () => {
    setFootnotes(getAllFootnotes());
    const chs = getAllChapters();
    setChapters(chs);
    if (chs.length > 0 && !newChapterId) setNewChapterId(chs[0].id);
  };

  const handleAdd = () => {
    if (!newText.trim() || !newChapterId) return;
    createFootnote(newChapterId, newText.trim());
    setNewText("");
    setShowAddForm(false);
    load();
  };

  const handleUpdate = (id: string) => {
    if (!editText.trim()) return;
    updateFootnote(id, editText.trim());
    setEditingId(null);
    load();
  };

  const handleDelete = (id: string) => {
    deleteFootnote(id);
    load();
  };

  const filtered = footnotes.filter(f => filterChapterId === "all" || f.chapterId === filterChapterId);

  // Group by chapter
  const grouped: Record<string, Footnote[]> = {};
  filtered.forEach(f => {
    if (!grouped[f.chapterId]) grouped[f.chapterId] = [];
    grouped[f.chapterId].push(f);
  });

  return (
    <div className="page-container">
      <h1 className="page-title">Footnote Manager</h1>
      <p className="page-description">Manage all footnotes across your book chapters. Each footnote is numbered per chapter.</p>

      {/* Toolbar */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "24px", alignItems: "center" }}>
        <select className="input" style={{ width: "auto", flex: 1 }} value={filterChapterId} onChange={e => setFilterChapterId(e.target.value)}>
          <option value="all">All Chapters ({footnotes.length} total)</option>
          {chapters.map(c => (
            <option key={c.id} value={c.id}>{c.title} ({footnotes.filter(f => f.chapterId === c.id).length})</option>
          ))}
        </select>
        <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>
          <Plus size={16} /> Add Footnote
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="card" style={{ marginBottom: "24px", borderLeft: "3px solid var(--accent-color)" }}>
          <h3 style={{ fontSize: "16px", marginBottom: "16px" }}>Add Footnote</h3>
          <div className="form-group">
            <label className="form-label">Chapter</label>
            <select className="input" value={newChapterId} onChange={e => setNewChapterId(e.target.value)}>
              {chapters.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Footnote Text</label>
            <textarea className="input" rows={2} placeholder="Footnote content..." value={newText} onChange={e => setNewText(e.target.value)} autoFocus />
          </div>
          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
            <button className="btn btn-secondary" onClick={() => { setShowAddForm(false); setNewText(""); }}><X size={14} /> Cancel</button>
            <button className="btn btn-primary" onClick={handleAdd} disabled={!newText.trim() || !newChapterId}><Check size={14} /> Add</button>
          </div>
        </div>
      )}

      {/* List grouped by chapter */}
      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "48px", color: "var(--text-muted)" }}>
          <Hash size={48} style={{ margin: "0 auto 16px", opacity: 0.3 }} />
          <p>{footnotes.length === 0 ? "No footnotes yet. Add your first footnote!" : "No footnotes for this filter."}</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {Object.keys(grouped).map(chapterId => {
            const chapter = chapters.find(c => c.id === chapterId);
            const fns = grouped[chapterId];
            return (
              <div key={chapterId}>
                <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--accent-color)", marginBottom: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Hash size={14} /> {chapter?.title || "Unknown Chapter"} — {fns.length} footnote{fns.length !== 1 ? "s" : ""}
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {fns.map(fn => (
                    <div key={fn.id} className="card" style={{ padding: "12px 16px", display: "flex", gap: "12px", alignItems: "flex-start" }}>
                      <span style={{
                        minWidth: "28px", height: "28px", borderRadius: "50%",
                        backgroundColor: "var(--accent-color)", color: "white",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontWeight: 700, fontSize: "12px", flexShrink: 0
                      }}>{fn.number}</span>
                      <div style={{ flex: 1 }}>
                        {editingId === fn.id ? (
                          <div style={{ display: "flex", gap: "8px" }}>
                            <textarea
                              className="input"
                              style={{ flex: 1, minHeight: "60px" }}
                              value={editText}
                              onChange={e => setEditText(e.target.value)}
                              autoFocus
                            />
                            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                              <button className="btn btn-primary" style={{ padding: "4px 8px" }} onClick={() => handleUpdate(fn.id)}><Check size={13} /></button>
                              <button className="btn btn-secondary" style={{ padding: "4px 8px" }} onClick={() => setEditingId(null)}><X size={13} /></button>
                            </div>
                          </div>
                        ) : (
                          <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.6 }}>{fn.text}</p>
                        )}
                      </div>
                      {editingId !== fn.id && (
                        <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
                          <button className="btn btn-secondary" style={{ padding: "4px 8px" }} onClick={() => { setEditingId(fn.id); setEditText(fn.text); }}>
                            <Edit2 size={13} />
                          </button>
                          <button className="btn btn-secondary" style={{ padding: "4px 8px", color: "var(--danger-color)" }} onClick={() => handleDelete(fn.id)}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
