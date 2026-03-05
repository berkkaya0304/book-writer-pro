"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Plus, Check, X, Trash2, Filter } from "lucide-react";
import {
  ErrataItem, getAllErrata, createErrataItem, updateErrataItem,
  deleteErrataItem, getAllChapters, Chapter, getSettings
} from "@/lib/localStorageUtils";

export default function ErrataPage() {
  const [errata, setErrata] = useState<ErrataItem[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [filterStatus, setFilterStatus] = useState<"All" | "Open" | "Fixed">("All");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ version: "1.0", chapterId: "", description: "", status: "Open" as "Open" | "Fixed" });

  useEffect(() => {
    const s = getSettings();
    document.documentElement.className = s.theme === "dark" ? "" : `theme-${s.theme}`;
    setErrata(getAllErrata());
    setChapters(getAllChapters());
  }, []);

  const handleSave = () => {
    if (!form.description.trim()) return;
    createErrataItem({ version: form.version, chapterId: form.chapterId || undefined, description: form.description, status: form.status });
    setErrata(getAllErrata());
    setForm({ version: "1.0", chapterId: "", description: "", status: "Open" });
    setShowForm(false);
  };

  const toggleStatus = (id: string, current: "Open" | "Fixed") => {
    updateErrataItem(id, { status: current === "Open" ? "Fixed" : "Open" });
    setErrata(getAllErrata());
  };

  const handleDelete = (id: string) => {
    deleteErrataItem(id);
    setErrata(getAllErrata());
  };

  const filtered = errata.filter(e => filterStatus === "All" || e.status === filterStatus);
  const openCount = errata.filter(e => e.status === "Open").length;
  const fixedCount = errata.filter(e => e.status === "Fixed").length;

  return (
    <div className="page-container">
      <h1 className="page-title">Errata & Corrections</h1>
      <p className="page-description">Track errors, corrections, and updates across published versions of your book.</p>

      {/* Stats Row */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
        {[
          { label: "Total", count: errata.length, color: "var(--text-primary)" },
          { label: "Open", count: openCount, color: "#f59e0b" },
          { label: "Fixed", count: fixedCount, color: "#22c55e" },
        ].map(s => (
          <div key={s.label} className="card" style={{ flex: 1, padding: "16px", textAlign: "center" }}>
            <div style={{ fontSize: "28px", fontWeight: 700, color: s.color }}>{s.count}</div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "24px", alignItems: "center" }}>
        <div style={{ display: "flex", gap: "6px" }}>
          {(["All", "Open", "Fixed"] as const).map(s => (
            <button
              key={s}
              className={`btn ${filterStatus === s ? "btn-primary" : "btn-secondary"}`}
              style={{ padding: "6px 14px", fontSize: "13px" }}
              onClick={() => setFilterStatus(s)}
            >
              <Filter size={12} /> {s}
            </button>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={16} /> Log Correction
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card" style={{ marginBottom: "24px", borderLeft: "3px solid #f59e0b" }}>
          <h3 style={{ fontSize: "16px", marginBottom: "16px" }}>Log New Correction</h3>
          <div style={{ display: "grid", gridTemplateColumns: "120px 1fr 1fr", gap: "12px", marginBottom: "12px" }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Version</label>
              <input className="input" placeholder="1.0" value={form.version} onChange={e => setForm(f => ({ ...f, version: e.target.value }))} />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Chapter (optional)</label>
              <select className="input" value={form.chapterId} onChange={e => setForm(f => ({ ...f, chapterId: e.target.value }))}>
                <option value="">— General —</option>
                {chapters.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Initial Status</label>
              <select className="input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as "Open" | "Fixed" }))}>
                <option value="Open">Open</option>
                <option value="Fixed">Fixed</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Description *</label>
            <textarea className="input" rows={2} placeholder="Describe the error and the correction..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
            <button className="btn btn-secondary" onClick={() => setShowForm(false)}><X size={14} /> Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={!form.description.trim()}><Check size={14} /> Log</button>
          </div>
        </div>
      )}

      {/* List */}
      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "48px", color: "var(--text-muted)" }}>
          <AlertCircle size={48} style={{ margin: "0 auto 16px", opacity: 0.3 }} />
          <p>{errata.length === 0 ? "No corrections logged yet. Great job!" : "No items match the current filter."}</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {filtered.map(e => {
            const chap = chapters.find(c => c.id === e.chapterId);
            return (
              <div key={e.id} className="card" style={{ display: "flex", gap: "16px", alignItems: "flex-start", borderLeft: `3px solid ${e.status === "Open" ? "#f59e0b" : "#22c55e"}` }}>
                <button
                  onClick={() => toggleStatus(e.id, e.status)}
                  style={{
                    width: "28px", height: "28px", borderRadius: "50%", flexShrink: 0, cursor: "pointer",
                    border: `2px solid ${e.status === "Open" ? "#f59e0b" : "#22c55e"}`,
                    backgroundColor: e.status === "Fixed" ? "#22c55e" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}
                  title={e.status === "Open" ? "Mark as Fixed" : "Reopen"}
                >
                  {e.status === "Fixed" && <Check size={14} color="white" />}
                </button>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "4px" }}>
                    <span style={{
                      fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "999px",
                      backgroundColor: e.status === "Open" ? "rgba(245,158,11,0.15)" : "rgba(34,197,94,0.15)",
                      color: e.status === "Open" ? "#f59e0b" : "#22c55e"
                    }}>{e.status}</span>
                    <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>v{e.version}</span>
                    {chap && <span style={{ fontSize: "12px", color: "var(--accent-color)" }}>→ {chap.title}</span>}
                    <span style={{ fontSize: "12px", color: "var(--text-muted)", marginLeft: "auto" }}>
                      {new Date(e.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.5 }}>{e.description}</p>
                </div>
                <button className="btn btn-secondary" style={{ padding: "4px", color: "var(--danger-color)", flexShrink: 0 }} onClick={() => handleDelete(e.id)}>
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
