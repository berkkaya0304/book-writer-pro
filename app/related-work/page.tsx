"use client";

import { useState, useEffect } from "react";
import {
  BookCopy, Plus, Trash2, Edit2, Search, Star,
  X, Tag, Filter, Sparkles, Copy, Check
} from "lucide-react";
import {
  RelatedWork, getAllRelatedWorks, createRelatedWork,
  updateRelatedWork, deleteRelatedWork, getSettings
} from "@/lib/localStorageUtils";

const emptyForm = (): Omit<RelatedWork, 'id' | 'createdAt'> => ({
  title: "", authors: "", year: new Date().getFullYear().toString(),
  venue: "", similarity: 3, notes: "", tags: [],
});

function StarRating({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div style={{ display: "flex", gap: "4px" }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} onClick={() => onChange(n)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          <Star size={18} fill={n <= value ? "#f59e0b" : "none"} color={n <= value ? "#f59e0b" : "var(--text-muted)"} />
        </button>
      ))}
    </div>
  );
}

export default function RelatedWorkPage() {
  const [works, setWorks] = useState<RelatedWork[]>([]);
  const [search, setSearch] = useState("");
  const [filterTag, setFilterTag] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [tagInput, setTagInput] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [model, setModel] = useState("llama3");

  useEffect(() => {
    const s = getSettings();
    document.documentElement.className = s.theme === "dark" ? "" : `theme-${s.theme}`;
    setModel(s.model || "llama3");
    setWorks(getAllRelatedWorks());
  }, []);

  const allTags = Array.from(new Set(works.flatMap(w => w.tags))).sort();

  const filtered = works.filter(w => {
    const q = search.toLowerCase();
    const matchSearch = !q || w.title.toLowerCase().includes(q) || w.authors.toLowerCase().includes(q) || w.venue.toLowerCase().includes(q);
    const matchTag = !filterTag || w.tags.includes(filterTag);
    return matchSearch && matchTag;
  });

  const handleSave = () => {
    if (!form.title) return;
    if (editingId) updateRelatedWork(editingId, form);
    else createRelatedWork(form);
    setWorks(getAllRelatedWorks());
    setShowForm(false); setEditingId(null); setForm(emptyForm()); setTagInput("");
  };

  const handleEdit = (w: RelatedWork) => {
    setEditingId(w.id);
    setForm({ title: w.title, authors: w.authors, year: w.year, venue: w.venue, similarity: w.similarity, notes: w.notes, tags: w.tags });
    setShowForm(true);
  };

  const handleDelete = (id: string) => { deleteRelatedWork(id); setWorks(getAllRelatedWorks()); };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !form.tags.includes(t)) setForm(f => ({ ...f, tags: [...f.tags, t] }));
    setTagInput("");
  };

  const copyCitation = (w: RelatedWork) => {
    const text = `${w.authors} (${w.year}). ${w.title}. ${w.venue}.`;
    navigator.clipboard.writeText(text);
    setCopiedId(w.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Related Work Tracker</h1>
      <p className="page-description">Organize and annotate papers relevant to your research.</p>

      {/* Toolbar */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
          <Search size={15} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input className="input" placeholder="Search papers…" value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: "32px" }} />
        </div>
        {allTags.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Filter size={14} color="var(--text-muted)" />
            <select className="input" style={{ width: "auto" }} value={filterTag} onChange={e => setFilterTag(e.target.value)}>
              <option value="">All Tags</option>
              {allTags.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        )}
        <button className="btn btn-primary" onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyForm()); }}>
          <Plus size={15} /> Add Paper
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
        {[
          { label: "Total Papers", value: works.length, color: "var(--accent-color)" },
          { label: "High Similarity (4-5★)", value: works.filter(w => w.similarity >= 4).length, color: "#f59e0b" },
          { label: "With Notes", value: works.filter(w => w.notes.trim()).length, color: "#22c55e" },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: "12px 20px", textAlign: "center", flex: 1, minWidth: "120px" }}>
            <div style={{ fontSize: "22px", fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div className="card" style={{ width: "620px", maxWidth: "95vw", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "18px", display: "flex", alignItems: "center", gap: "8px" }}>
                <BookCopy size={18} color="var(--accent-color)" /> {editingId ? "Edit Paper" : "Add Paper"}
              </h2>
              <button className="btn btn-secondary" style={{ padding: "4px" }} onClick={() => { setShowForm(false); setEditingId(null); }}><X size={15} /></button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div className="form-group" style={{ gridColumn: "1/-1" }}>
                <label className="form-label">Title *</label>
                <input className="input" placeholder="Paper title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Authors</label>
                <input className="input" placeholder="Author, A., Author, B." value={form.authors} onChange={e => setForm(f => ({ ...f, authors: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Year</label>
                <input className="input" placeholder="2024" value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} />
              </div>
              <div className="form-group" style={{ gridColumn: "1/-1" }}>
                <label className="form-label">Venue (Journal / Conference)</label>
                <input className="input" placeholder="NeurIPS 2024 / Nature / IEEE Trans." value={form.venue} onChange={e => setForm(f => ({ ...f, venue: e.target.value }))} />
              </div>
              <div className="form-group" style={{ gridColumn: "1/-1" }}>
                <label className="form-label">Similarity to your work</label>
                <StarRating value={form.similarity} onChange={n => setForm(f => ({ ...f, similarity: n }))} />
              </div>
              <div className="form-group" style={{ gridColumn: "1/-1" }}>
                <label className="form-label">Notes</label>
                <textarea className="input" rows={3} placeholder="Key findings, how it relates to your work…" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <div className="form-group" style={{ gridColumn: "1/-1" }}>
                <label className="form-label">Tags</label>
                <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                  <input className="input" placeholder="Add tag…" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addTag())} />
                  <button className="btn btn-secondary" onClick={addTag}><Tag size={14} /></button>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {form.tags.map(t => (
                    <span key={t} style={{ display: "flex", alignItems: "center", gap: "4px", backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "3px 10px", fontSize: "12px" }}>
                      {t} <button onClick={() => setForm(f => ({ ...f, tags: f.tags.filter(x => x !== t) }))} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}><X size={11} /></button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "20px" }}>
              <button className="btn btn-secondary" onClick={() => { setShowForm(false); setEditingId(null); }}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={!form.title}>{editingId ? "Update" : "Save"} Paper</button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "48px", color: "var(--text-muted)" }}>
          <BookCopy size={48} style={{ margin: "0 auto 16px", opacity: 0.3 }} />
          <p>{works.length === 0 ? "No papers yet. Add your first related work!" : "No papers match your filter."}</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {filtered.map(w => (
            <div key={w.id} className="card">
              <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 600, fontSize: "15px" }}>{w.title}</span>
                    <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{w.year}</span>
                    {Array.from({ length: w.similarity }, (_, i) => <Star key={i} size={13} fill="#f59e0b" color="#f59e0b" />)}
                  </div>
                  <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "4px" }}>{w.authors}</p>
                  {w.venue && <p style={{ fontSize: "12px", color: "var(--accent-color)", marginBottom: "4px" }}>{w.venue}</p>}
                  {w.notes && <p style={{ fontSize: "13px", color: "var(--text-secondary)", borderLeft: "2px solid var(--border-color)", paddingLeft: "10px", marginTop: "6px" }}>{w.notes}</p>}
                  {w.tags.length > 0 && (
                    <div style={{ display: "flex", gap: "6px", marginTop: "8px", flexWrap: "wrap" }}>
                      {w.tags.map(t => (
                        <span key={t} style={{ fontSize: "11px", backgroundColor: "rgba(99,102,241,0.12)", color: "var(--accent-color)", borderRadius: "10px", padding: "2px 8px" }}>{t}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                  <button className="btn btn-secondary" style={{ padding: "6px" }} onClick={() => copyCitation(w)} title="Copy citation">
                    {copiedId === w.id ? <Check size={14} color="#22c55e" /> : <Copy size={14} />}
                  </button>
                  <button className="btn btn-secondary" style={{ padding: "6px" }} onClick={() => handleEdit(w)}><Edit2 size={14} /></button>
                  <button className="btn btn-secondary" style={{ padding: "6px", color: "var(--danger-color, #ef4444)" }} onClick={() => handleDelete(w.id)}><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
