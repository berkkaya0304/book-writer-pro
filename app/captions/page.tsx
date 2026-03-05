"use client";

import { useState, useEffect } from "react";
import { Image as ImageIcon, Table2, Plus, Trash2, Edit2, Copy, Check, X, ChevronDown } from "lucide-react";
import {
  Caption, CaptionType, getAllCaptions, createCaption,
  updateCaption, deleteCaption, getAllChapters, Chapter, getSettings
} from "@/lib/localStorageUtils";

const emptyForm = (): Omit<Caption, 'id' | 'number' | 'createdAt'> => ({
  type: "figure", title: "", description: "", chapterId: "",
});

export default function CaptionsPage() {
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [activeTab, setActiveTab] = useState<CaptionType>("figure");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const s = getSettings();
    document.documentElement.className = s.theme === "dark" ? "" : `theme-${s.theme}`;
    setCaptions(getAllCaptions());
    setChapters(getAllChapters());
  }, []);

  const filtered = captions.filter(c => c.type === activeTab);
  const chapterMap = Object.fromEntries(chapters.map(c => [c.id, c.title]));

  const handleSave = () => {
    if (!form.title) return;
    if (editingId) updateCaption(editingId, form);
    else createCaption({ ...form, type: activeTab });
    setCaptions(getAllCaptions());
    setShowForm(false); setEditingId(null); setForm(emptyForm());
  };

  const handleEdit = (c: Caption) => {
    setEditingId(c.id);
    setForm({ type: c.type, title: c.title, description: c.description, chapterId: c.chapterId });
    setShowForm(true);
  };

  const handleDelete = (id: string) => { deleteCaption(id); setCaptions(getAllCaptions()); };

  const handleCopy = (c: Caption) => {
    const prefix = c.type === "figure" ? "Fig." : "Table";
    navigator.clipboard.writeText(`${prefix} ${c.number}: ${c.title}${c.description ? `. ${c.description}` : ""}`);
    setCopiedId(c.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const exportList = () => {
    const figures = captions.filter(c => c.type === "figure");
    const tables = captions.filter(c => c.type === "table");
    let text = "";
    if (figures.length) {
      text += "LIST OF FIGURES\n\n";
      figures.forEach(c => { text += `Fig. ${c.number}: ${c.title}\n`; });
      text += "\n";
    }
    if (tables.length) {
      text += "LIST OF TABLES\n\n";
      tables.forEach(c => { text += `Table ${c.number}: ${c.title}\n`; });
    }
    navigator.clipboard.writeText(text);
  };

  const tabStyle = (tab: CaptionType) => ({
    padding: "10px 24px",
    borderRadius: "var(--radius)",
    fontWeight: 600,
    fontSize: "14px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    transition: "all 0.2s",
    backgroundColor: activeTab === tab ? "var(--accent-color)" : "var(--bg-secondary)",
    color: activeTab === tab ? "#fff" : "var(--text-secondary)",
    border: "none",
  });

  return (
    <div className="page-container">
      <h1 className="page-title">Figure & Table Caption Manager</h1>
      <p className="page-description">Centrally manage all figures and tables with automatic numbering.</p>

      {/* Tabs + Actions */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "24px", alignItems: "center", flexWrap: "wrap" }}>
        <button style={tabStyle("figure")} onClick={() => setActiveTab("figure")}>
          <ImageIcon size={15} /> Figures ({captions.filter(c => c.type === "figure").length})
        </button>
        <button style={tabStyle("table")} onClick={() => setActiveTab("table")}>
          <Table2 size={15} /> Tables ({captions.filter(c => c.type === "table").length})
        </button>
        <div style={{ marginLeft: "auto", display: "flex", gap: "8px" }}>
          <button className="btn btn-secondary" onClick={exportList} title="Copy List of Figures/Tables to clipboard">
            <Copy size={14} /> Export List
          </button>
          <button className="btn btn-primary" onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyForm()); }}>
            <Plus size={14} /> Add {activeTab === "figure" ? "Figure" : "Table"}
          </button>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div className="card" style={{ width: "520px", maxWidth: "95vw" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "18px" }}>{editingId ? "Edit" : "Add"} {activeTab === "figure" ? "Figure" : "Table"}</h2>
              <button className="btn btn-secondary" style={{ padding: "4px" }} onClick={() => setShowForm(false)}><X size={15} /></button>
            </div>
            <div className="form-group">
              <label className="form-label">Title *</label>
              <input className="input" placeholder="e.g. Architecture overview of the proposed system" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Caption / Description</label>
              <textarea className="input" rows={3} placeholder="Detailed caption text…" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Chapter</label>
              <div style={{ position: "relative" }}>
                <select className="input" value={form.chapterId} onChange={e => setForm(f => ({ ...f, chapterId: e.target.value }))}>
                  <option value="">— No chapter —</option>
                  {chapters.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
                <ChevronDown size={14} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--text-muted)" }} />
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "16px" }}>
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={!form.title}>{editingId ? "Update" : "Save"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Caption List */}
      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "48px", color: "var(--text-muted)" }}>
          {activeTab === "figure" ? <ImageIcon size={48} style={{ margin: "0 auto 16px", opacity: 0.3 }} /> : <Table2 size={48} style={{ margin: "0 auto 16px", opacity: 0.3 }} />}
          <p>No {activeTab}s yet. Add your first {activeTab}!</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {filtered.map(c => (
            <div key={c.id} className="card" style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
              <div style={{
                width: "52px", height: "52px", borderRadius: "10px", backgroundColor: "var(--bg-tertiary)",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                flexShrink: 0, border: "1px solid var(--border-color)"
              }}>
                {c.type === "figure" ? <ImageIcon size={18} color="var(--accent-color)" /> : <Table2 size={18} color="var(--accent-color)" />}
                <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--accent-color)" }}>#{c.number}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 600, marginBottom: "2px" }}>
                  <span style={{ color: "var(--accent-color)" }}>{c.type === "figure" ? "Fig." : "Table"} {c.number}:</span> {c.title}
                </p>
                {c.description && <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{c.description}</p>}
                {c.chapterId && chapterMap[c.chapterId] && (
                  <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>📄 {chapterMap[c.chapterId]}</p>
                )}
              </div>
              <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                <button className="btn btn-secondary" style={{ padding: "6px" }} onClick={() => handleCopy(c)}>
                  {copiedId === c.id ? <Check size={14} color="#22c55e" /> : <Copy size={14} />}
                </button>
                <button className="btn btn-secondary" style={{ padding: "6px" }} onClick={() => handleEdit(c)}><Edit2 size={14} /></button>
                <button className="btn btn-secondary" style={{ padding: "6px", color: "var(--danger-color, #ef4444)" }} onClick={() => handleDelete(c.id)}><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
