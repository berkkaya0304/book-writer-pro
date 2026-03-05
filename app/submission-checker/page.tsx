"use client";

import { useState, useEffect } from "react";
import { ClipboardCheck, CheckCircle, XCircle, AlertCircle, ChevronDown } from "lucide-react";
import { getSettings } from "@/lib/localStorageUtils";

interface Rule { label: string; max?: number; min?: number; unit: string; }
interface Profile { name: string; rules: Record<string, Rule>; }

const PROFILES: Record<string, Profile> = {
  "IEEE Trans.": {
    name: "IEEE Transactions (Double-column)",
    rules: {
      words: { label: "Word Count", max: 8000, unit: "words" },
      abstract: { label: "Abstract", max: 250, unit: "words" },
      keywords: { label: "Keywords", min: 3, max: 10, unit: "keywords" },
      references: { label: "References", max: 50, unit: "refs" },
      figures: { label: "Figures + Tables", max: 12, unit: "items" },
    },
  },
  "NeurIPS": {
    name: "NeurIPS (8 pages + refs)",
    rules: {
      words: { label: "Word Count", max: 9500, unit: "words" },
      abstract: { label: "Abstract", max: 300, unit: "words" },
      keywords: { label: "Keywords", min: 3, max: 5, unit: "keywords" },
      references: { label: "References", max: 60, unit: "refs" },
      figures: { label: "Figures", max: 10, unit: "items" },
    },
  },
  "ICML": {
    name: "ICML (8+9 pages)",
    rules: {
      words: { label: "Word Count", max: 9000, unit: "words" },
      abstract: { label: "Abstract", max: 250, unit: "words" },
      keywords: { label: "Keywords", min: 2, max: 6, unit: "keywords" },
      references: { label: "References", max: 50, unit: "refs" },
      figures: { label: "Figures", max: 10, unit: "items" },
    },
  },
  "ACL / EMNLP": {
    name: "ACL / EMNLP (8 pages)",
    rules: {
      words: { label: "Word Count", max: 9000, unit: "words" },
      abstract: { label: "Abstract", max: 200, unit: "words" },
      keywords: { label: "Keywords", min: 3, max: 5, unit: "keywords" },
      references: { label: "References", max: 70, unit: "refs" },
      figures: { label: "Figures", max: 8, unit: "items" },
    },
  },
  "Nature": {
    name: "Nature / Nature Methods",
    rules: {
      words: { label: "Word Count (excl. methods)", max: 3000, unit: "words" },
      abstract: { label: "Abstract", max: 150, unit: "words" },
      keywords: { label: "Keywords", min: 3, max: 10, unit: "keywords" },
      references: { label: "References", max: 50, unit: "refs" },
      figures: { label: "Figures + Tables", max: 6, unit: "items" },
    },
  },
  "Science": {
    name: "Science (Research Article)",
    rules: {
      words: { label: "Body Word Count", max: 4500, unit: "words" },
      abstract: { label: "Abstract", max: 125, unit: "words" },
      keywords: { label: "Keywords", min: 3, max: 8, unit: "keywords" },
      references: { label: "References", max: 40, unit: "refs" },
      figures: { label: "Figures", max: 5, unit: "items" },
    },
  },
};

type FieldKey = "words" | "abstract" | "keywords" | "references" | "figures";

export default function SubmissionCheckerPage() {
  const [profileKey, setProfileKey] = useState("NeurIPS");
  const [values, setValues] = useState<Record<FieldKey, string>>({ words: "", abstract: "", keywords: "", references: "", figures: "" });
  const [pasteText, setPasteText] = useState("");
  const [showPaste, setShowPaste] = useState(false);

  useEffect(() => {
    const s = getSettings();
    document.documentElement.className = s.theme === "dark" ? "" : `theme-${s.theme}`;
  }, []);

  const profile = PROFILES[profileKey];

  const autoCount = () => {
    if (!pasteText.trim()) return;
    const words = pasteText.trim().split(/\s+/).filter(Boolean).length;
    setValues(v => ({ ...v, words: String(words) }));
  };

  const check = (key: FieldKey): { pass: boolean; message: string } => {
    const rule = profile.rules[key];
    if (!rule) return { pass: true, message: "" };
    const val = parseInt(values[key]);
    if (isNaN(val)) return { pass: false, message: "Not entered" };
    if (rule.max !== undefined && val > rule.max) return { pass: false, message: `${val} exceeds max ${rule.max} ${rule.unit}` };
    if (rule.min !== undefined && val < rule.min) return { pass: false, message: `${val} below min ${rule.min} ${rule.unit}` };
    return { pass: true, message: `${val} ${rule.unit} ✓` };
  };

  const results = (Object.keys(profile.rules) as FieldKey[]).map(key => ({ key, rule: profile.rules[key], ...check(key) }));
  const filled = results.filter(r => values[r.key] !== "");
  const passCount = filled.filter(r => r.pass).length;
  const score = filled.length > 0 ? Math.round((passCount / filled.length) * 100) : 0;

  return (
    <div className="page-container">
      <h1 className="page-title">Journal/Conference Submission Checker</h1>
      <p className="page-description">Validate your paper against official submission requirements.</p>

      {/* Profile selector */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "24px", alignItems: "center", flexWrap: "wrap" }}>
        <label className="form-label" style={{ margin: 0 }}>Venue:</label>
        <div style={{ position: "relative" }}>
          <select className="input" style={{ minWidth: "220px", paddingRight: "32px" }} value={profileKey} onChange={e => setProfileKey(e.target.value)}>
            {Object.keys(PROFILES).map(k => <option key={k} value={k}>{k}</option>)}
          </select>
          <ChevronDown size={14} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--text-muted)" }} />
        </div>
        <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>{profile.name}</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        {/* Input */}
        <div>
          <div className="card">
            <h3 style={{ fontSize: "15px", fontWeight: 600, marginBottom: "16px" }}>Enter Your Metrics</h3>
            {(Object.keys(profile.rules) as FieldKey[]).map(key => {
              const rule = profile.rules[key];
              return (
                <div className="form-group" key={key}>
                  <label className="form-label">
                    {rule.label}
                    <span style={{ fontSize: "11px", color: "var(--text-muted)", marginLeft: "8px" }}>
                      {rule.min !== undefined && rule.max !== undefined ? `${rule.min}–${rule.max} ${rule.unit}` :
                        rule.max !== undefined ? `max ${rule.max} ${rule.unit}` : `min ${rule.min} ${rule.unit}`}
                    </span>
                  </label>
                  <input
                    className="input"
                    type="number"
                    min={0}
                    placeholder={`Enter ${rule.unit}…`}
                    value={values[key]}
                    onChange={e => setValues(v => ({ ...v, [key]: e.target.value }))}
                  />
                </div>
              );
            })}

            <button className="btn btn-secondary" style={{ marginTop: "8px", fontSize: "13px" }} onClick={() => setShowPaste(!showPaste)}>
              {showPaste ? "Hide" : "Or paste full text to auto-count words"}
            </button>
            {showPaste && (
              <>
                <textarea className="input" rows={5} style={{ width: "100%", marginTop: "10px", fontSize: "12px" }} placeholder="Paste article text here…" value={pasteText} onChange={e => setPasteText(e.target.value)} />
                <button className="btn btn-primary" style={{ marginTop: "8px", fontSize: "13px" }} onClick={autoCount}>Auto-count Words</button>
              </>
            )}
          </div>
        </div>

        {/* Results */}
        <div>
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "15px", fontWeight: 600 }}>Validation Results</h3>
              {filled.length > 0 && (
                <div style={{
                  padding: "6px 14px", borderRadius: "20px", fontWeight: 700, fontSize: "14px",
                  backgroundColor: score === 100 ? "rgba(34,197,94,0.15)" : score >= 60 ? "rgba(245,158,11,0.15)" : "rgba(239,68,68,0.12)",
                  color: score === 100 ? "#22c55e" : score >= 60 ? "#f59e0b" : "var(--danger-color, #ef4444)",
                }}>
                  {score}% ready
                </div>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {results.map(r => {
                const notEntered = values[r.key] === "";
                return (
                  <div key={r.key} style={{
                    display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px",
                    backgroundColor: "var(--bg-tertiary)", borderRadius: "var(--radius-sm)",
                    border: `1px solid ${notEntered ? "var(--border-color)" : r.pass ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
                  }}>
                    {notEntered ? <AlertCircle size={18} color="var(--text-muted)" /> :
                      r.pass ? <CheckCircle size={18} color="#22c55e" /> : <XCircle size={18} color="var(--danger-color, #ef4444)" />}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: "13px" }}>{r.rule.label}</div>
                      <div style={{ fontSize: "12px", color: notEntered ? "var(--text-muted)" : r.pass ? "#22c55e" : "var(--danger-color, #ef4444)" }}>
                        {notEntered ? "Not entered" : r.message}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
