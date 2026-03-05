"use client";

import { useState, useEffect } from "react";
import { FileSearch, Sparkles, Copy, Check, RotateCcw, ChevronDown } from "lucide-react";
import { getSettings } from "@/lib/localStorageUtils";
import { getAiHeaders } from "@/lib/getAiHeaders";

const WORD_COUNT_OPTIONS = [150, 200, 250, 300];
const LANGUAGE_OPTIONS = ["English", "Turkish", "German", "French", "Spanish"];

export default function AbstractGeneratorPage() {
  const [content, setContent] = useState("");
  const [abstract, setAbstract] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [wordCount, setWordCount] = useState(200);
  const [language, setLanguage] = useState("English");
  const [error, setError] = useState("");

  useEffect(() => {
    const settings = getSettings();
    document.documentElement.className = settings.theme === "dark" ? "" : `theme-${settings.theme}`;
    setLanguage(settings.language || "English");
  }, []);

  const wordCountOf = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

  const handleGenerate = async () => {
    if (!content.trim()) { setError("Please paste your article content first."); return; }
    setError("");
    setLoading(true);
    setAbstract("");
    try {
      const res = await fetch("/api/generate-abstract", {
        method: "POST",
        headers: getAiHeaders(),
        body: JSON.stringify({ content, wordCount, language }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        if (errData.type === "quota_exceeded") {
          setError("⚠️ Google API krediniz doldu! Ayarlar'dan Ollama'ya geçin.");
          return;
        }
        throw new Error(errData.error || "Generation failed");
      }
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No stream");
      let result = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter((l) => l.trim());
        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);
            if (parsed.response) { result += parsed.response; setAbstract(result); }
          } catch { /* ignore */ }
        }
      }
    } catch (e) {
      setError(`Error: ${e instanceof Error ? e.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(abstract);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Abstract Generator</h1>
      <p className="page-description">
        Paste your article content and let AI generate a structured academic abstract (Background · Method · Results · Conclusion).
      </p>

      {/* Controls row */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <label className="form-label" style={{ margin: 0, whiteSpace: "nowrap" }}>Target Words</label>
          <div style={{ position: "relative" }}>
            <select className="input" style={{ width: "auto", paddingRight: "32px" }} value={wordCount} onChange={e => setWordCount(Number(e.target.value))}>
              {WORD_COUNT_OPTIONS.map(n => <option key={n} value={n}>{n} words</option>)}
            </select>
            <ChevronDown size={14} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--text-muted)" }} />
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <label className="form-label" style={{ margin: 0 }}>Language</label>
          <div style={{ position: "relative" }}>
            <select className="input" style={{ width: "auto", paddingRight: "32px" }} value={language} onChange={e => setLanguage(e.target.value)}>
              {LANGUAGE_OPTIONS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <ChevronDown size={14} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--text-muted)" }} />
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        {/* Input Panel */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "6px", margin: 0 }}>
              <FileSearch size={15} /> Article Content
            </label>
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{wordCountOf(content).toLocaleString()} words</span>
          </div>
          <textarea
            className="input"
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Paste your full article or section text here…"
            style={{ width: "100%", minHeight: "420px", resize: "vertical", fontFamily: "var(--font-mono, monospace)", fontSize: "13px", lineHeight: 1.6 }}
          />
          {error && <p style={{ color: "var(--danger-color, #ef4444)", fontSize: "13px", marginTop: "8px" }}>{error}</p>}
          <button
            className="btn btn-primary"
            onClick={handleGenerate}
            disabled={loading || !content.trim()}
            style={{ width: "100%", marginTop: "12px", justifyContent: "center" }}
          >
            {loading ? (
              <><span className="spinner" style={{ width: "14px", height: "14px", borderWidth: "2px", display: "inline-block", borderRadius: "50%", borderStyle: "solid", borderColor: "rgba(255,255,255,0.3)", borderTopColor: "#fff", animation: "spin 0.7s linear infinite" }} /> Generating…</>
            ) : (
              <><Sparkles size={15} /> Generate Abstract</>
            )}
          </button>
        </div>

        {/* Output Panel */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "6px", margin: 0 }}>
              <Sparkles size={15} color="var(--accent-color)" /> Generated Abstract
            </label>
            <div style={{ display: "flex", gap: "6px" }}>
              {abstract && (
                <>
                  <span style={{ fontSize: "12px", color: "var(--text-muted)", alignSelf: "center" }}>{wordCountOf(abstract)} words</span>
                  <button className="btn btn-secondary" style={{ padding: "4px 10px", fontSize: "12px" }} onClick={() => setAbstract("")}>
                    <RotateCcw size={12} /> Clear
                  </button>
                  <button className="btn btn-secondary" style={{ padding: "4px 10px", fontSize: "12px" }} onClick={handleCopy}>
                    {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
                  </button>
                </>
              )}
            </div>
          </div>
          <div
            style={{
              minHeight: "420px",
              padding: "16px",
              backgroundColor: "var(--bg-secondary)",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius)",
              fontSize: "14px",
              lineHeight: 1.8,
              color: abstract ? "var(--text-primary)" : "var(--text-muted)",
              whiteSpace: "pre-wrap",
              overflowY: "auto",
            }}
          >
            {abstract || (loading ? "Generating, please wait…" : "Your abstract will appear here.")}
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="card" style={{ marginTop: "24px", display: "flex", gap: "16px", flexWrap: "wrap" }}>
        {["Provide at least 500 words for best results.", "Include your methodology and results for a complete abstract.", "Review and edit for accuracy before submission."].map((tip, i) => (
          <div key={i} style={{ flex: 1, minWidth: "180px", fontSize: "12px", color: "var(--text-muted)", display: "flex", gap: "6px" }}>
            <span style={{ color: "var(--accent-color)", fontWeight: 700 }}>💡</span> {tip}
          </div>
        ))}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
