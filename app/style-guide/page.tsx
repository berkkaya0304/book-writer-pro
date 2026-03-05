"use client";

import { useEffect, useState, useMemo } from "react";
import { getAllChapters, Chapter, getSettings } from "@/lib/localStorageUtils";
import { ShieldCheck, AlertTriangle, CheckCircle, ChevronDown, BarChart2 } from "lucide-react";

// ─── Style Guide Rules ────────────────────────────────────────────────────────

interface StyleIssue {
  rule: string;
  description: string;
  matches: string[];
  severity: "error" | "warning" | "info";
}

interface SentenceComplexity {
  text: string;
  wordCount: number;
  level: "simple" | "medium" | "complex";
}

interface HeadingError {
  from: number;
  to: number;
  context: string;
}

function stripHtml(html: string): string {
  if (typeof document === "undefined") return html.replace(/<[^>]+>/g, " ");
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || "";
}

function checkStyleGuide(plain: string): StyleIssue[] {
  const issues: StyleIssue[] = [];

  // Avoid vague words
  const vagueWords = ["simply", "just", "easy", "obvious", "clearly", "basically", "straightforward", "trivial"];
  const foundVague = vagueWords.filter(w => new RegExp(`\\b${w}\\b`, "gi").test(plain));
  if (foundVague.length > 0) {
    issues.push({ rule: "Avoid Minimizing Language", description: "Words like 'simply', 'just', 'easy' can frustrate readers who don't find it easy. Remove them.", matches: foundVague, severity: "warning" });
  }

  // Contractions (technical docs often avoid them)
  const contractions = plain.match(/\b\w+n't\b|\b\w+'ll\b|\b\w+'re\b|\b\w+'ve\b/gi) || [];
  if (contractions.length > 0) {
    issues.push({ rule: "Contractions in Formal Text", description: "Technical documentation may prefer expanded forms (e.g., 'do not' instead of 'don't').", matches: contractions.slice(0, 5), severity: "info" });
  }

  // Second person check ("the user" instead of "you")
  const thirdPersonUser = plain.match(/\bthe user\b/gi) || [];
  if (thirdPersonUser.length > 0) {
    issues.push({ rule: "Prefer Second Person", description: "Google style prefers 'you' over 'the user'. Speaks directly to the reader.", matches: [`Found ${thirdPersonUser.length}x "the user"`], severity: "info" });
  }

  // Passive voice fragments
  const passiveMatches = plain.match(/\b(is|are|was|were|be|been|being)\s+\w+ed\b/gi) || [];
  if (passiveMatches.length > 3) {
    issues.push({ rule: "Excessive Passive Voice", description: "Active voice is clearer and more direct. Rephrase passive constructions where possible.", matches: passiveMatches.slice(0, 4), severity: "warning" });
  }

  // Very long sentences
  const sentences = plain.split(/[.!?]+/).filter(s => s.trim().length > 5);
  const longSentences = sentences.filter(s => s.trim().split(/\s+/).length > 35);
  if (longSentences.length > 0) {
    issues.push({ rule: "Sentences Too Long (>35 words)", description: "Long sentences reduce readability. Break them into shorter, focused statements.", matches: longSentences.slice(0, 3).map(s => s.trim().slice(0, 80) + "…"), severity: "error" });
  }

  // Filler phrases
  const fillers = ["in order to", "it is important to note that", "it should be noted that", "as a matter of fact", "due to the fact that"];
  const foundFillers = fillers.filter(f => plain.toLowerCase().includes(f));
  if (foundFillers.length > 0) {
    issues.push({ rule: "Remove Filler Phrases", description: "These phrases add length without meaning. Replace with direct language.", matches: foundFillers, severity: "warning" });
  }

  // Number style: numbers 1-10 should be spelled out (simplified check)
  const lowNumbers = plain.match(/\b[1-9]\b(?!\s*[%$€£])/g) || [];
  if (lowNumbers.length > 0) {
    issues.push({ rule: "Spell Out Numbers 1–9", description: "Per Microsoft/Google style, spell out numbers one through nine in prose.", matches: lowNumbers.slice(0, 5).map(n => `"${n}"`), severity: "info" });
  }

  return issues;
}

function analyzeSentenceComplexity(plain: string): SentenceComplexity[] {
  const sentences = plain.split(/[.!?]+/).filter(s => s.trim().length > 5);
  return sentences.map(s => {
    const words = s.trim().split(/\s+/).length;
    return {
      text: s.trim(),
      wordCount: words,
      level: (words <= 12 ? "simple" : words <= 25 ? "medium" : "complex") as "simple" | "medium" | "complex"
    };
  }).slice(0, 60);
}

function checkHeadingHierarchy(html: string): HeadingError[] {
  if (typeof document === "undefined") return [];
  const div = document.createElement("div");
  div.innerHTML = html;
  const headings = Array.from(div.querySelectorAll("h1,h2,h3,h4,h5,h6"));
  const errors: HeadingError[] = [];
  for (let i = 1; i < headings.length; i++) {
    const prev = parseInt(headings[i - 1].tagName[1]);
    const curr = parseInt(headings[i].tagName[1]);
    if (curr > prev + 1) {
      errors.push({ from: prev, to: curr, context: headings[i].textContent?.slice(0, 60) || "" });
    }
  }
  return errors;
}

// ─── Filter/Stats Summary ─────────────────────────────────────────────────────

function ComplexityBar({ data }: { data: SentenceComplexity[] }) {
  const simple = data.filter(s => s.level === "simple").length;
  const medium = data.filter(s => s.level === "medium").length;
  const complex = data.filter(s => s.level === "complex").length;
  const total = data.length || 1;

  return (
    <div>
      <div style={{ display: "flex", height: "28px", borderRadius: "8px", overflow: "hidden", gap: "2px" }}>
        <div style={{ flex: simple / total, background: "#22c55e", minWidth: simple > 0 ? "4px" : 0 }} title={`Simple: ${simple}`} />
        <div style={{ flex: medium / total, background: "#f59e0b", minWidth: medium > 0 ? "4px" : 0 }} title={`Medium: ${medium}`} />
        <div style={{ flex: complex / total, background: "#ef4444", minWidth: complex > 0 ? "4px" : 0 }} title={`Complex: ${complex}`} />
      </div>
      <div style={{ display: "flex", gap: "16px", marginTop: "8px", fontSize: "12px" }}>
        <span style={{ color: "#22c55e" }}>● Simple ≤12w: {simple}</span>
        <span style={{ color: "#f59e0b" }}>● Medium 13–25w: {medium}</span>
        <span style={{ color: "#ef4444" }}>● Complex &gt;25w: {complex}</span>
      </div>
    </div>
  );
}

export default function StyleGuidePage() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");

  useEffect(() => {
    const savedTheme = getSettings().theme || "dark";
    document.documentElement.className = savedTheme === "dark" ? "" : `theme-${savedTheme}`;
    const data = getAllChapters();
    setChapters(data);
    if (data.length > 0) setSelectedId(data[0].id);
  }, []);

  const selected = chapters.find(c => c.id === selectedId);
  const plain = useMemo(() => selected ? stripHtml(selected.content || "") : "", [selected]);

  const styleIssues = useMemo(() => plain ? checkStyleGuide(plain) : [], [plain]);
  const complexity = useMemo(() => plain ? analyzeSentenceComplexity(plain) : [], [plain]);
  const headingErrors = useMemo(() => selected?.content ? checkHeadingHierarchy(selected.content) : [], [selected]);

  const errorCount = styleIssues.filter(i => i.severity === "error").length;
  const warnCount = styleIssues.filter(i => i.severity === "warning").length;

  const severityColor = (s: string) => s === "error" ? "var(--danger-color)" : s === "warning" ? "#f59e0b" : "#6366f1";
  const severityBg = (s: string) => s === "error" ? "rgba(239,68,68,0.1)" : s === "warning" ? "rgba(245,158,11,0.1)" : "rgba(99,102,241,0.1)";

  return (
    <div className="page-container">
      <h1 className="page-title">Style Guide & Complexity</h1>
      <p className="page-description">Microsoft & Google Writing Style rules, sentence complexity map, and heading hierarchy check.</p>

      {/* Chapter Selector */}
      <div style={{ marginBottom: "24px", display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{ position: "relative" }}>
          <select className="input" value={selectedId} onChange={e => setSelectedId(e.target.value)} style={{ appearance: "none", paddingRight: "36px", minWidth: "220px" }}>
            {chapters.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
          <ChevronDown size={16} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--text-muted)" }} />
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          {errorCount > 0 && <span style={{ background: "rgba(239,68,68,0.15)", color: "var(--danger-color)", padding: "4px 12px", borderRadius: "12px", fontSize: "12px", fontWeight: 700 }}>{errorCount} errors</span>}
          {warnCount > 0 && <span style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b", padding: "4px 12px", borderRadius: "12px", fontSize: "12px", fontWeight: 700 }}>{warnCount} warnings</span>}
          {styleIssues.length === 0 && plain && <span style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e", padding: "4px 12px", borderRadius: "12px", fontSize: "12px", fontWeight: 700 }}>✓ All clear</span>}
        </div>
      </div>

      {chapters.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "48px", color: "var(--text-muted)" }}>
          No chapters found. Write some content first.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>

          {/* Style Issues */}
          <div className="card" style={{ gridColumn: "span 2" }}>
            <h2 style={{ fontSize: "16px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <ShieldCheck size={18} color="var(--accent-color)" /> Style Guide Issues
            </h2>
            {styleIssues.length === 0 ? (
              <p style={{ color: "#22c55e" }}>✓ No style issues found for this chapter.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {styleIssues.map((issue, i) => (
                  <div key={i} style={{ padding: "12px 16px", borderRadius: "var(--radius-sm)", background: severityBg(issue.severity), borderLeft: `3px solid ${severityColor(issue.severity)}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                      <strong style={{ fontSize: "14px", color: severityColor(issue.severity) }}>{issue.rule}</strong>
                      <span style={{ fontSize: "11px", textTransform: "uppercase", fontWeight: 700, color: severityColor(issue.severity), opacity: 0.8 }}>{issue.severity}</span>
                    </div>
                    <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "0 0 8px 0" }}>{issue.description}</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {issue.matches.map((m, j) => (
                        <code key={j} style={{ fontSize: "12px", background: "var(--bg-tertiary)", padding: "2px 8px", borderRadius: "4px", color: "var(--text-primary)" }}>{m}</code>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sentence Complexity Map */}
          <div className="card">
            <h2 style={{ fontSize: "16px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <BarChart2 size={18} color="#f59e0b" /> Sentence Complexity Map
            </h2>
            <ComplexityBar data={complexity} />
            <div style={{ marginTop: "16px", maxHeight: "280px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "4px" }}>
              {complexity.map((s, i) => (
                <div key={i} style={{
                  padding: "6px 10px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  color: "var(--text-secondary)",
                  borderLeft: `3px solid ${s.level === "simple" ? "#22c55e" : s.level === "medium" ? "#f59e0b" : "#ef4444"}`,
                  background: s.level === "complex" ? "rgba(239,68,68,0.05)" : "transparent"
                }}>
                  <span style={{ fontWeight: 600, color: s.level === "simple" ? "#22c55e" : s.level === "medium" ? "#f59e0b" : "#ef4444", marginRight: "8px" }}>{s.wordCount}w</span>
                  {s.text.slice(0, 90)}{s.text.length > 90 ? "…" : ""}
                </div>
              ))}
            </div>
          </div>

          {/* Heading Hierarchy */}
          <div className="card">
            <h2 style={{ fontSize: "16px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <AlertTriangle size={18} color="var(--danger-color)" /> Heading Hierarchy Check
              <span style={{ marginLeft: "auto", background: headingErrors.length > 0 ? "rgba(239,68,68,0.15)" : "rgba(34,197,94,0.15)", color: headingErrors.length > 0 ? "var(--danger-color)" : "#22c55e", padding: "2px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: 600 }}>
                {headingErrors.length} errors
              </span>
            </h2>
            {headingErrors.length === 0 ? (
              <div>
                <p style={{ color: "#22c55e", fontSize: "14px" }}>✓ Heading hierarchy is correct.</p>
                {/* Show heading tree */}
                {selected?.content && (() => {
                  if (typeof document === "undefined") return null;
                  const div2 = document.createElement("div");
                  div2.innerHTML = selected.content;
                  const headings = Array.from(div2.querySelectorAll("h1,h2,h3,h4,h5,h6"));
                  if (headings.length === 0) return <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>No headings found in this chapter.</p>;
                  return (
                    <ul style={{ listStyle: "none", marginTop: "12px", display: "flex", flexDirection: "column", gap: "4px" }}>
                      {headings.map((h, i) => {
                        const level = parseInt(h.tagName[1]);
                        return (
                          <li key={i} style={{ paddingLeft: `${(level - 1) * 16}px`, fontSize: "13px", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "6px" }}>
                            <span style={{ color: "var(--accent-color)", fontWeight: 700, fontSize: "11px", width: "24px" }}>H{level}</span>
                            {h.textContent?.slice(0, 60)}
                          </li>
                        );
                      })}
                    </ul>
                  );
                })()}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {headingErrors.map((err, i) => (
                  <div key={i} style={{ padding: "10px 14px", borderRadius: "var(--radius-sm)", background: "rgba(239,68,68,0.1)", borderLeft: "3px solid var(--danger-color)" }}>
                    <strong style={{ fontSize: "13px", color: "var(--danger-color)" }}>H{err.from} → H{err.to} (skipped H{err.from + 1})</strong>
                    <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "4px 0 0 0" }}>&ldquo;{err.context}&rdquo;</p>
                  </div>
                ))}
              </div>
            )}
            {!selected?.content && (
              <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>Select a chapter to check headings.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
