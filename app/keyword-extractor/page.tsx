"use client";

import { useState, useEffect } from "react";
import { Tags, Sparkles, Copy, Check, X } from "lucide-react";
import { getSettings } from "@/lib/localStorageUtils";
import { getAiHeaders } from "@/lib/getAiHeaders";

interface Keyword { keyword: string; relevance: number; }

export default function KeywordExtractorPage() {
  const [content, setContent] = useState("");
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState(10);
  const [copiedAll, setCopiedAll] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const s = getSettings();
    document.documentElement.className = s.theme === "dark" ? "" : `theme-${s.theme}`;
  }, []);

  const handleExtract = async () => {
    if (!content.trim()) { setError("Please paste your article content."); return; }
    setError("");
    setLoading(true);
    setKeywords([]);
    try {
      const res = await fetch("/api/extract-keywords", {
        method: "POST",
        headers: getAiHeaders(),
        body: JSON.stringify({ content, count }),
      });
      const data = await res.json();
      if (data.type === "quota_exceeded") {
        setError("⚠️ Google API krediniz doldu! Ayarlar'dan Ollama'ya geçin.");
        return;
      }
      if (!res.ok) throw new Error(data.error || "Extraction failed");
      setKeywords(data.keywords || []);
    } catch (e) {
      setError(`Error: ${e instanceof Error ? e.message : "Unknown"}`);
    } finally {
      setLoading(false);
    }
  };

  const copyAll = () => {
    navigator.clipboard.writeText(keywords.map(k => k.keyword).join(", "));
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const removeKeyword = (idx: number) => setKeywords(k => k.filter((_, i) => i !== idx));

  const getColor = (relevance: number) => {
    if (relevance >= 0.8) return "var(--accent-color, #6366f1)";
    if (relevance >= 0.5) return "#22c55e";
    return "var(--text-muted)";
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Keyword Extractor</h1>
      <p className="page-description">Extract ranked keywords from your article for SEO and journal indexing.</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        {/* Input */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <label className="form-label" style={{ margin: 0, display: "flex", alignItems: "center", gap: "6px" }}>
              <Tags size={15} /> Article Content
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <label className="form-label" style={{ margin: 0, fontSize: "12px" }}>Keywords:</label>
              <select className="input" style={{ width: "70px", padding: "4px 8px", fontSize: "13px" }} value={count} onChange={e => setCount(Number(e.target.value))}>
                {[5, 10, 15, 20].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>
          <textarea
            className="input"
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Paste your article text here…"
            style={{ width: "100%", minHeight: "320px", resize: "vertical", fontSize: "13px", lineHeight: 1.6 }}
          />
          {error && <p style={{ color: "var(--danger-color, #ef4444)", fontSize: "13px", marginTop: "6px" }}>{error}</p>}
          <button
            className="btn btn-primary"
            onClick={handleExtract}
            disabled={loading || !content.trim()}
            style={{ width: "100%", marginTop: "12px", justifyContent: "center" }}
          >
            {loading ? "Extracting…" : <><Sparkles size={14} /> Extract Keywords</>}
          </button>
        </div>

        {/* Output */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <label className="form-label" style={{ margin: 0 }}>Extracted Keywords</label>
            {keywords.length > 0 && (
              <button className="btn btn-secondary" style={{ fontSize: "12px", padding: "4px 10px" }} onClick={copyAll}>
                {copiedAll ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy All</>}
              </button>
            )}
          </div>
          <div style={{ minHeight: "320px", backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "var(--radius)", padding: "16px", display: "flex", flexWrap: "wrap", gap: "10px", alignContent: "flex-start" }}>
            {keywords.length === 0 && !loading && (
              <p style={{ color: "var(--text-muted)", fontSize: "14px", margin: "auto" }}>Keywords will appear here.</p>
            )}
            {keywords.map((kw, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: "6px",
                backgroundColor: "var(--bg-tertiary)", border: `1px solid ${getColor(kw.relevance)}`,
                borderRadius: "20px", padding: "5px 12px", fontSize: "13px", fontWeight: 500,
                color: getColor(kw.relevance), transition: "all 0.2s"
              }}>
                <span>{kw.keyword}</span>
                <span style={{ fontSize: "10px", opacity: 0.7 }}>{Math.round(kw.relevance * 100)}%</span>
                <button onClick={() => removeKeyword(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 0, display: "flex" }}>
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div style={{ display: "flex", gap: "16px", marginTop: "12px", fontSize: "11px", color: "var(--text-muted)" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "var(--accent-color)" }} /> High (≥80%)</span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#22c55e" }} /> Medium (50-79%)</span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "var(--text-muted)" }} /> Low (&lt;50%)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
