"use client";

import { useState, useEffect } from "react";
import { FlaskConical, ChevronDown, ChevronRight } from "lucide-react";
import { getSettings, getReproducibilityItems, saveReproducibilityItems, ReproducibilityItem } from "@/lib/localStorageUtils";

const DEFAULT_CHECKLIST: Omit<ReproducibilityItem, 'checked' | 'notes'>[] = [
  // Experimental Setup
  { id: "es1", category: "Experimental Setup", label: "All hyperparameters and model configurations are reported." },
  { id: "es2", category: "Experimental Setup", label: "Random seeds used are specified for reproducibility." },
  { id: "es3", category: "Experimental Setup", label: "Compute resources (GPU, CPU, RAM) are documented." },
  { id: "es4", category: "Experimental Setup", label: "Training time and inference time are reported." },
  { id: "es5", category: "Experimental Setup", label: "Statistical significance tests are provided for all comparisons." },
  // Datasets
  { id: "ds1", category: "Datasets", label: "All datasets used are publicly available or access instructions are provided." },
  { id: "ds2", category: "Datasets", label: "Dataset split sizes (train/val/test) are specified." },
  { id: "ds3", category: "Datasets", label: "Any preprocessing applied to data is described in detail." },
  { id: "ds4", category: "Datasets", label: "License information for all datasets is included." },
  // Code
  { id: "c1", category: "Code", label: "Source code is made publicly available (GitHub/etc.)." },
  { id: "c2", category: "Code", label: "Code repository includes a README with setup instructions." },
  { id: "c3", category: "Code", label: "Requirements/dependencies are documented (requirements.txt, etc.)." },
  { id: "c4", category: "Code", label: "Code to reproduce all main results is included." },
  // Statistics
  { id: "st1", category: "Statistics", label: "Results are averaged over multiple runs (with standard deviation)." },
  { id: "st2", category: "Statistics", label: "Confidence intervals are reported where applicable." },
  { id: "st3", category: "Statistics", label: "Ablation studies cover all proposed components." },
  { id: "st4", category: "Statistics", label: "Negative results and failure cases are discussed." },
  // Compute
  { id: "cp1", category: "Compute", label: "Carbon footprint estimate is provided (or CO2 tracking tool used)." },
  { id: "cp2", category: "Compute", label: "Model size (parameters) is reported." },
  { id: "cp3", category: "Compute", label: "FLOP count or equivalent compute measure is included." },
  // Ethics
  { id: "et1", category: "Ethics", label: "Potential societal harms and limitations are discussed." },
  { id: "et2", category: "Ethics", label: "Use of AI tools (e.g., LLMs for writing) is disclosed." },
  { id: "et3", category: "Ethics", label: "Funding sources and conflicts of interest are declared." },
];

const CATEGORIES = Array.from(new Set(DEFAULT_CHECKLIST.map(i => i.category)));

export default function ReproducibilityPage() {
  const [items, setItems] = useState<ReproducibilityItem[]>([]);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());

  useEffect(() => {
    const s = getSettings();
    document.documentElement.className = s.theme === "dark" ? "" : `theme-${s.theme}`;
    const saved = getReproducibilityItems();
    if (saved.length === 0) {
      // Initialize with defaults
      const defaults = DEFAULT_CHECKLIST.map(d => ({ ...d, checked: false, notes: "" }));
      setItems(defaults);
      saveReproducibilityItems(defaults);
    } else {
      // Merge: keep saved answers, add any new default items
      const savedMap = Object.fromEntries(saved.map(s => [s.id, s]));
      const merged = DEFAULT_CHECKLIST.map(d => savedMap[d.id] || { ...d, checked: false, notes: "" });
      setItems(merged);
    }
  }, []);

  const toggle = (id: string) => {
    const updated = items.map(i => i.id === id ? { ...i, checked: !i.checked } : i);
    setItems(updated);
    saveReproducibilityItems(updated);
  };

  const updateNotes = (id: string, notes: string) => {
    const updated = items.map(i => i.id === id ? { ...i, notes } : i);
    setItems(updated);
    saveReproducibilityItems(updated);
  };

  const toggleCollapse = (cat: string) => setCollapsed(s => { const n = new Set(s); n.has(cat) ? n.delete(cat) : n.add(cat); return n; });
  const toggleNotes = (id: string) => setExpandedNotes(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const total = items.length;
  const checked = items.filter(i => i.checked).length;
  const pct = total > 0 ? Math.round((checked / total) * 100) : 0;

  const statusColor = pct >= 80 ? "#22c55e" : pct >= 50 ? "#f59e0b" : "var(--danger-color, #ef4444)";

  return (
    <div className="page-container">
      <h1 className="page-title">Reproducibility Checklist</h1>
      <p className="page-description">Inspired by NeurIPS/ICML checklists. Track reproducibility requirements for your paper.</p>

      {/* Progress */}
      <div className="card" style={{ marginBottom: "24px", display: "flex", alignItems: "center", gap: "20px" }}>
        <div style={{ position: "relative", width: "72px", height: "72px", flexShrink: 0 }}>
          <svg viewBox="0 0 36 36" style={{ width: "72px", height: "72px", transform: "rotate(-90deg)" }}>
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--bg-tertiary)" strokeWidth="3" />
            <circle cx="18" cy="18" r="15.9" fill="none" stroke={statusColor} strokeWidth="3"
              strokeDasharray={`${pct} ${100 - pct}`} strokeLinecap="round" style={{ transition: "stroke-dasharray 0.4s ease" }}
            />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 700, color: statusColor }}>
            {pct}%
          </div>
        </div>
        <div>
          <div style={{ fontSize: "20px", fontWeight: 700 }}>{checked} / {total} <span style={{ fontSize: "14px", fontWeight: 400, color: "var(--text-muted)" }}>items completed</span></div>
          <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>
            {pct >= 80 ? "✅ Great reproducibility score!" : pct >= 50 ? "⚠️ Consider completing more items." : "❌ Many items require attention."}
          </div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: "12px", flexWrap: "wrap" }}>
          {CATEGORIES.map(cat => {
            const catItems = items.filter(i => i.category === cat);
            const catChecked = catItems.filter(i => i.checked).length;
            return (
              <div key={cat} style={{ textAlign: "center", fontSize: "12px" }}>
                <div style={{ fontWeight: 600 }}>{catChecked}/{catItems.length}</div>
                <div style={{ color: "var(--text-muted)", fontSize: "11px" }}>{cat}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Checklist by Category */}
      {CATEGORIES.map(cat => {
        const catItems = items.filter(i => i.category === cat);
        const catChecked = catItems.filter(i => i.checked).length;
        const isCollapsed = collapsed.has(cat);
        return (
          <div key={cat} className="card" style={{ marginBottom: "12px" }}>
            <button
              onClick={() => toggleCollapse(cat)}
              style={{ width: "100%", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", padding: 0 }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <FlaskConical size={16} color="var(--accent-color)" />
                <span style={{ fontWeight: 600, fontSize: "15px" }}>{cat}</span>
                <span style={{
                  fontSize: "12px", padding: "2px 8px", borderRadius: "10px",
                  backgroundColor: catChecked === catItems.length ? "rgba(34,197,94,0.15)" : "var(--bg-tertiary)",
                  color: catChecked === catItems.length ? "#22c55e" : "var(--text-muted)"
                }}>{catChecked}/{catItems.length}</span>
              </div>
              {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
            </button>
            {!isCollapsed && (
              <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                {catItems.map(item => (
                  <div key={item.id}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={() => toggle(item.id)}
                        style={{ marginTop: "3px", accentColor: "var(--accent-color)", width: "16px", height: "16px", cursor: "pointer", flexShrink: 0 }}
                      />
                      <div style={{ flex: 1 }}>
                        <p style={{
                          margin: 0, fontSize: "14px",
                          textDecoration: item.checked ? "line-through" : "none",
                          color: item.checked ? "var(--text-muted)" : "var(--text-primary)",
                          transition: "all 0.2s",
                        }}>
                          {item.label}
                        </p>
                        <button
                          onClick={() => toggleNotes(item.id)}
                          style={{ background: "none", border: "none", cursor: "pointer", fontSize: "11px", color: "var(--text-muted)", padding: "2px 0", marginTop: "2px" }}
                        >
                          {expandedNotes.has(item.id) ? "▲ Hide notes" : "▼ Add notes"}
                          {item.notes && !expandedNotes.has(item.id) && " ✏️"}
                        </button>
                        {expandedNotes.has(item.id) && (
                          <textarea
                            className="input"
                            value={item.notes}
                            onChange={e => updateNotes(item.id, e.target.value)}
                            placeholder="Notes, references, or justification…"
                            rows={2}
                            style={{ marginTop: "6px", fontSize: "12px", width: "100%", resize: "vertical" }}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
