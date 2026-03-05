"use client";

import { useEffect, useState } from "react";
import { Type, Plus, Trash2, Edit2, X, Check, Search } from "lucide-react";
import {
  Abbreviation, getAllAbbreviations, createAbbreviation,
  updateAbbreviation, deleteAbbreviation, getSettings
} from "@/lib/localStorageUtils";

export default function AbbreviationsPage() {
  const [abbrs, setAbbrs] = useState<Abbreviation[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [term, setTerm] = useState("");
  const [definition, setDefinition] = useState("");
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    const s = getSettings();
    document.documentElement.className = s.theme === "dark" ? "" : `theme-${s.theme}`;
    setAbbrs(getAllAbbreviations());
  }, []);

  const handleSave = () => {
    if (!term.trim() || !definition.trim()) return;
    if (editingId) {
      updateAbbreviation(editingId, { term: term.trim(), definition: definition.trim() });
    } else {
      createAbbreviation(term.trim(), definition.trim());
    }
    setAbbrs(getAllAbbreviations());
    resetForm();
    setSaved("Saved!");
    setTimeout(() => setSaved(null), 1500);
  };

  const handleEdit = (a: Abbreviation) => {
    setEditingId(a.id);
    setTerm(a.term);
    setDefinition(a.definition);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    deleteAbbreviation(id);
    setAbbrs(getAllAbbreviations());
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setTerm("");
    setDefinition("");
  };

  const filtered = abbrs.filter(a =>
    !search ||
    a.term.toLowerCase().includes(search.toLowerCase()) ||
    a.definition.toLowerCase().includes(search.toLowerCase())
  );

  // Group alphabetically
  const grouped: Record<string, Abbreviation[]> = {};
  filtered.forEach(a => {
    const letter = a.term[0]?.toUpperCase() || "#";
    if (!grouped[letter]) grouped[letter] = [];
    grouped[letter].push(a);
  });

  return (
    <div className="page-container">
      <h1 className="page-title">Abbreviations & Acronyms</h1>
      <p className="page-description">Manage technical terms, acronyms and abbreviations used throughout your book.</p>

      {/* Toolbar */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "24px", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1 }}>
          <Search size={15} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input className="input" placeholder="Search terms..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: "36px" }} />
        </div>
        <span style={{ color: "var(--text-muted)", fontSize: "13px", whiteSpace: "nowrap" }}>{abbrs.length} terms</span>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus size={16} /> Add Term
        </button>
      </div>

      {/* Inline Form */}
      {showForm && (
        <div className="card" style={{ marginBottom: "24px", borderLeft: "3px solid var(--accent-color)" }}>
          <h3 style={{ fontSize: "16px", marginBottom: "16px" }}>{editingId ? "Edit Term" : "Add New Term"}</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "12px", marginBottom: "16px" }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Abbreviation / Acronym</label>
              <input className="input" placeholder="e.g. API" value={term} onChange={e => setTerm(e.target.value)} autoFocus />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Full Definition</label>
              <input className="input" placeholder="e.g. Application Programming Interface" value={definition} onChange={e => setDefinition(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleSave(); }} />
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
            <button className="btn btn-secondary" onClick={resetForm}><X size={14} /> Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={!term.trim() || !definition.trim()}>
              <Check size={14} /> {editingId ? "Update" : "Add"}
            </button>
          </div>
        </div>
      )}

      {saved && (
        <div style={{ marginBottom: "12px", padding: "8px 16px", backgroundColor: "rgba(34,197,94,0.15)", border: "1px solid #22c55e", borderRadius: "var(--radius-sm)", color: "#22c55e", fontSize: "14px" }}>
          {saved}
        </div>
      )}

      {/* Alphabetical List */}
      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "48px", color: "var(--text-muted)" }}>
          <Type size={48} style={{ margin: "0 auto 16px", opacity: 0.3 }} />
          <p>{abbrs.length === 0 ? "No abbreviations yet. Add your first term!" : "No terms match your search."}</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {Object.keys(grouped).sort().map(letter => (
            <div key={letter}>
              <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", color: "var(--accent-color)", marginBottom: "8px", borderBottom: "1px solid var(--border-color)", paddingBottom: "4px" }}>
                — {letter} —
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {grouped[letter].map(a => (
                  <div key={a.id} className="card" style={{ padding: "12px 16px", display: "flex", alignItems: "baseline", gap: "16px" }}>
                    <span style={{
                      fontWeight: 700, fontSize: "15px", color: "var(--accent-color)",
                      minWidth: "80px", fontFamily: "monospace", flexShrink: 0
                    }}>{a.term}</span>
                    <span style={{ flex: 1, color: "var(--text-secondary)", fontSize: "14px" }}>{a.definition}</span>
                    <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
                      <button className="btn btn-secondary" style={{ padding: "4px 8px" }} onClick={() => handleEdit(a)} title="Edit">
                        <Edit2 size={13} />
                      </button>
                      <button className="btn btn-secondary" style={{ padding: "4px 8px", color: "var(--danger-color)" }} onClick={() => handleDelete(a.id)} title="Delete">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Export preview */}
      {abbrs.length > 0 && (
        <div className="card" style={{ marginTop: "32px", backgroundColor: "var(--bg-tertiary)" }}>
          <h3 style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "12px" }}>📋 LaTeX Preview (for export)</h3>
          <pre style={{ fontFamily: "monospace", fontSize: "12px", color: "var(--text-secondary)", whiteSpace: "pre-wrap", lineHeight: 1.8 }}>
            {`\\section*{List of Abbreviations}\n\\begin{description}\n${abbrs.map(a => `  \\item[${a.term}] ${a.definition}`).join("\n")}\n\\end{description}`}
          </pre>
        </div>
      )}
    </div>
  );
}
