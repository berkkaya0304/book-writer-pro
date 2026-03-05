"use client";

import { useState, useEffect } from "react";
import { ScanSearch, AlertTriangle } from "lucide-react";
import { getSettings } from "@/lib/localStorageUtils";

function getNgrams(text: string, n: number): Set<string> {
  const words = text.toLowerCase().replace(/[^\w\s]/g, "").trim().split(/\s+/).filter(Boolean);
  const ngrams = new Set<string>();
  for (let i = 0; i <= words.length - n; i++) {
    ngrams.add(words.slice(i, i + n).join(" "));
  }
  return ngrams;
}

interface Match { phrase: string; start: number; end: number; }

function findMatches(source: string, target: string, minWords: number): Match[] {
  const normalizeWord = (w: string) => w.toLowerCase().replace(/[^\w]/g, "");
  const sourceWords = source.replace(/[^\w\s]/g, " ").trim().split(/\s+/).filter(Boolean).map(normalizeWord);
  const sourceSet = getNgrams(source, minWords);
  const targetWords = target.trim().split(/\s+/).filter(Boolean);
  const matches: Match[] = [];

  let i = 0;
  // Build a map from raw index to char position in target
  let pos = 0;
  const wordPositions: { word: string; start: number; end: number }[] = [];
  for (const w of targetWords) {
    const idx = target.indexOf(w, pos);
    wordPositions.push({ word: w, start: idx, end: idx + w.length });
    pos = idx + w.length;
  }

  while (i <= targetWords.length - minWords) {
    const chunk = targetWords.slice(i, i + minWords).map(w => normalizeWord(w)).join(" ");
    if (sourceSet.has(chunk)) {
      let j = i + minWords;
      while (j < targetWords.length) {
        const ext = targetWords.slice(i, j + 1).map(normalizeWord).join(" ");
        if (sourceSet.has(ext) || /* extend greedily */ sourceWords.join(" ").includes(ext)) j++;
        else break;
      }
      const phrase = targetWords.slice(i, j).join(" ");
      const start = wordPositions[i]?.start ?? 0;
      const end = wordPositions[j - 1]?.end ?? target.length;
      matches.push({ phrase, start, end });
      i = j;
    } else {
      i++;
    }
  }
  return matches;
}

function highlightText(text: string, matches: Match[]) {
  if (matches.length === 0) return <>{text}</>;
  const parts: React.ReactNode[] = [];
  let last = 0;
  for (const m of matches) {
    if (m.start > last) parts.push(<span key={`t${last}`}>{text.slice(last, m.start)}</span>);
    parts.push(
      <mark key={`m${m.start}`} style={{ backgroundColor: "rgba(239,68,68,0.25)", color: "var(--text-primary)", borderRadius: "3px", padding: "1px 2px" }}>
        {text.slice(m.start, m.end)}
      </mark>
    );
    last = m.end;
  }
  parts.push(<span key="tend">{text.slice(last)}</span>);
  return <>{parts}</>;
}

export default function PlagiarismCheckPage() {
  const [source, setSource] = useState("");
  const [target, setTarget] = useState("");
  const [matches, setMatches] = useState<Match[]>([]);
  const [minWords, setMinWords] = useState(5);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const s = getSettings();
    document.documentElement.className = s.theme === "dark" ? "" : `theme-${s.theme}`;
  }, []);

  const handleCheck = () => {
    const found = findMatches(source, target, minWords);
    setMatches(found);
    setChecked(true);
  };

  const totalMatchWords = matches.reduce((sum, m) => sum + m.phrase.split(/\s+/).length, 0);
  const targetWords = target.trim().split(/\s+/).filter(Boolean).length;
  const matchPct = targetWords > 0 ? Math.round((totalMatchWords / targetWords) * 100) : 0;

  return (
    <div className="page-container">
      <h1 className="page-title">Plagiarism Highlight</h1>
      <p className="page-description">
        Compare your text against a source locally (no external API). Matching phrases of {minWords}+ words are highlighted.
      </p>

      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px", flexWrap: "wrap" }}>
        <label className="form-label" style={{ margin: 0 }}>Min matching words:</label>
        {[4, 5, 6, 7, 8].map(n => (
          <button key={n} onClick={() => setMinWords(n)} className={`btn ${minWords === n ? "btn-primary" : "btn-secondary"}`} style={{ padding: "4px 14px", fontSize: "13px" }}>{n}</button>
        ))}
        <button className="btn btn-primary" style={{ marginLeft: "auto" }} onClick={handleCheck} disabled={!source.trim() || !target.trim()}>
          <ScanSearch size={14} /> Check
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        {/* Source */}
        <div>
          <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            📄 Source Text <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>(original paper / reference)</span>
          </label>
          <textarea
            className="input"
            value={source}
            onChange={e => { setSource(e.target.value); setChecked(false); }}
            placeholder="Paste the original source text here…"
            style={{ width: "100%", minHeight: "360px", fontSize: "13px", lineHeight: 1.6, resize: "vertical" }}
          />
        </div>

        {/* Your Text */}
        <div>
          <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            ✏️ Your Text <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>(text to check)</span>
          </label>
          {checked ? (
            <div style={{
              minHeight: "360px", padding: "12px 14px",
              backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)",
              borderRadius: "var(--radius)", fontSize: "13px", lineHeight: 1.7,
              overflowY: "auto", whiteSpace: "pre-wrap", wordBreak: "break-word"
            }}>
              {highlightText(target, matches)}
            </div>
          ) : (
            <textarea
              className="input"
              value={target}
              onChange={e => { setTarget(e.target.value); setChecked(false); }}
              placeholder="Paste the text you want to check…"
              style={{ width: "100%", minHeight: "360px", fontSize: "13px", lineHeight: 1.6, resize: "vertical" }}
            />
          )}
          {checked && <button className="btn btn-secondary" style={{ marginTop: "8px", fontSize: "12px" }} onClick={() => setChecked(false)}>Edit Text</button>}
        </div>
      </div>

      {/* Results */}
      {checked && (
        <div className="card" style={{ marginTop: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {matchPct === 0
                ? <span style={{ color: "#22c55e", fontWeight: 700 }}>✅ No matches found!</span>
                : <><AlertTriangle size={18} color="#f59e0b" /><span style={{ fontWeight: 700, color: matchPct > 20 ? "var(--danger-color, #ef4444)" : "#f59e0b" }}>Match rate: {matchPct}%</span></>
              }
            </div>
            <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
              {matches.length} phrase{matches.length !== 1 ? "s" : ""} matched · {totalMatchWords} out of {targetWords} words
            </div>
          </div>
          {matches.length > 0 && (
            <div style={{ marginTop: "12px" }}>
              <p style={{ fontSize: "13px", fontWeight: 600, marginBottom: "8px" }}>Matched phrases:</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {matches.map((m, i) => (
                  <span key={i} style={{ fontSize: "12px", backgroundColor: "rgba(239,68,68,0.12)", color: "var(--danger-color, #ef4444)", borderRadius: "4px", padding: "3px 8px" }}>
                    &ldquo;{m.phrase.length > 50 ? m.phrase.slice(0, 50) + "…" : m.phrase}&rdquo;
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
