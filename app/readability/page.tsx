"use client";

import { useEffect, useState, useMemo } from "react";
import { BookOpen, AlertTriangle, CheckCircle, Info, RefreshCw, ChevronDown } from "lucide-react";
import { getAllChapters, Chapter, getSettings } from "@/lib/localStorageUtils";

// ─── Readability Algorithms ───────────────────────────────────────────────────

function getTextStats(text: string) {
  // Strip HTML
  const div = typeof document !== "undefined" ? document.createElement("div") : null;
  if (div) div.innerHTML = text;
  const plain = div ? (div.textContent || "") : text.replace(/<[^>]+>/g, " ");

  const words = plain.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const charCount = words.join("").length;

  // Sentence detection
  const sentences = plain.split(/[.!?]+/).filter(s => s.trim().length > 2);
  const sentenceCount = Math.max(sentences.length, 1);

  // Syllable count (English heuristic)
  const syllableCount = words.reduce((acc, w) => acc + countSyllables(w), 0);

  return { plain, words, wordCount, sentenceCount, sentences, syllableCount, charCount };
}

function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, "");
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "").replace(/^y/, "");
  const matches = word.match(/[aeiouy]{1,2}/g);
  return matches ? matches.length : 1;
}

function fleschReadingEase(stats: ReturnType<typeof getTextStats>): number {
  if (stats.wordCount === 0) return 0;
  return 206.835 - 1.015 * (stats.wordCount / stats.sentenceCount) - 84.6 * (stats.syllableCount / stats.wordCount);
}

function fleschKincaidGrade(stats: ReturnType<typeof getTextStats>): number {
  if (stats.wordCount === 0) return 0;
  return 0.39 * (stats.wordCount / stats.sentenceCount) + 11.8 * (stats.syllableCount / stats.wordCount) - 15.59;
}

function gunningFog(stats: ReturnType<typeof getTextStats>): number {
  if (stats.wordCount === 0) return 0;
  const complexWords = stats.words.filter(w => countSyllables(w) >= 3).length;
  return 0.4 * ((stats.wordCount / stats.sentenceCount) + 100 * (complexWords / stats.wordCount));
}

// ─── Passive Voice Detection ──────────────────────────────────────────────────
const BE_VERBS = ["am","is","are","was","were","be","been","being"];
const PASSIVE_PATTERN = new RegExp(
  `\\b(${BE_VERBS.join("|")})\\s+(\\w+ed|\\w+en)\\b`, "gi"
);

function detectPassive(plain: string): string[] {
  const sentences = plain.split(/[.!?]+/).filter(s => s.trim().length > 2);
  return sentences.filter(s => PASSIVE_PATTERN.test(s)).map(s => s.trim());
}

// ─── Consistency Check ────────────────────────────────────────────────────────
function detectInconsistencies(chapters: Chapter[]): { word: string; variants: string[]; chapters: string[] }[] {
  const wordMap: Record<string, Set<string>> = {};
  const wordChapters: Record<string, Set<string>> = {};

  chapters.forEach(ch => {
    const div = typeof document !== "undefined" ? document.createElement("div") : null;
    if (div) div.innerHTML = ch.content || "";
    const plain = div ? (div.textContent || "") : "";
    const words = plain.match(/\b[A-Za-z][A-Za-z0-9_\-\.]+\b/g) || [];
    words.forEach(w => {
      const key = w.toLowerCase();
      if (!wordMap[key]) wordMap[key] = new Set();
      if (!wordChapters[key]) wordChapters[key] = new Set();
      wordMap[key].add(w);
      wordChapters[key].add(ch.title);
    });
  });

  return Object.entries(wordMap)
    .filter(([, variants]) => variants.size > 1)
    .filter(([key]) => key.length > 2)
    .map(([, variants]) => {
      const v = Array.from(variants);
      const key = v[0].toLowerCase();
      return { word: key, variants: v, chapters: Array.from(wordChapters[key]) };
    })
    .slice(0, 30);
}

// ─── Jargon Detection ─────────────────────────────────────────────────────────
const TECHNICAL_JARGON = [
  "api","sdk","cli","gui","oop","ioc","di","orm","sql","nosql","http","https","tcp","udp","dns","xml","json","yaml","toml","csv",
  "cicd","devops","microservice","containerization","orchestration","kubernetes","docker","terraform","ansible","prometheus","grafana",
  "latency","throughput","bandwidth","scalability","redundancy","idempotent","polymorphism","encapsulation","abstraction","inheritance",
  "recursion","memoization","concurrency","parallelism","asynchronous","synchronous","deadlock","mutex","semaphore",
  "jwt","oauth","saml","cors","csrf","xss","ssl","tls","hashing","encryption","decryption","tokenization","authentication","authorization",
  "webhook","endpoint","payload","middleware","daemon","cron","regex","xpath","dom","vdom","transpiler","bundler","polyfill",
  "heap","stack","queue","linked list","binary tree","graph","algorithm","complexity","big o","runtime","compile","interpret",
  "cdn","vpc","iam","acl","blob","bucket","lambda","serverless","faas","paas","saas","iaas","ha","dr",
];

function detectJargon(plain: string): string[] {
  const found = new Set<string>();
  const words = plain.toLowerCase().split(/\W+/);
  words.forEach(w => { if (TECHNICAL_JARGON.includes(w)) found.add(w.toUpperCase()); });
  return Array.from(found);
}

// ─── Component ────────────────────────────────────────────────────────────────

function ScoreGauge({ value, min, max, label, goodHigh }: { value: number; min: number; max: number; label: string; goodHigh: boolean }) {
  const clampedVal = Math.max(min, Math.min(max, value));
  const pct = ((clampedVal - min) / (max - min)) * 100;
  const isGood = goodHigh ? pct > 60 : pct < 40;
  const isMedium = !isGood && (goodHigh ? pct > 30 : pct < 70);
  const color = isGood ? "var(--success-color, #22c55e)" : isMedium ? "#f59e0b" : "var(--danger-color, #ef4444)";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{label}</span>
        <span style={{ fontSize: "18px", fontWeight: 700, color }}>{Math.round(value * 10) / 10}</span>
      </div>
      <div style={{ height: "8px", background: "var(--bg-tertiary)", borderRadius: "4px", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: "4px", transition: "width 0.6s ease" }} />
      </div>
    </div>
  );
}

export default function ReadabilityPage() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedId, setSelectedId] = useState<string>("all");

  useEffect(() => {
    const savedTheme = getSettings().theme || "dark";
    document.documentElement.className = savedTheme === "dark" ? "" : `theme-${savedTheme}`;
    const data = getAllChapters();
    setChapters(data);
    if (data.length > 0) setSelectedId(data[0].id);
  }, []);

  const selectedChapter = useMemo(() =>
    selectedId === "all" ? null : chapters.find(c => c.id === selectedId) || null,
    [chapters, selectedId]
  );

  const analysisData = useMemo(() => {
    const chaptersToAnalyze = selectedChapter ? [selectedChapter] : chapters;
    const combined = chaptersToAnalyze.map(c => c.content || "").join(" ");
    const stats = getTextStats(combined);
    const fre = fleschReadingEase(stats);
    const fkg = fleschKincaidGrade(stats);
    const fog = gunningFog(stats);
    const passive = detectPassive(stats.plain).slice(0, 10);
    const jargon = detectJargon(stats.plain);
    const inconsistencies = detectInconsistencies(chaptersToAnalyze);
    return { stats, fre, fkg, fog, passive, jargon, inconsistencies };
  }, [selectedChapter, chapters]);

  const freLabel = (v: number) => v >= 70 ? "Very Easy" : v >= 60 ? "Easy" : v >= 50 ? "Fairly Easy" : v >= 30 ? "Difficult" : "Very Difficult";
  const fkgLabel = (v: number) => v <= 6 ? "Elementary" : v <= 9 ? "Middle School" : v <= 12 ? "High School" : v <= 16 ? "University" : "Professional";

  return (
    <div className="page-container">
      <h1 className="page-title">Readability Analysis</h1>
      <p className="page-description">Flesch-Kincaid, Gunning Fog, passive voice, jargon & consistency checks.</p>

      {/* Chapter Selector */}
      <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "24px", flexWrap: "wrap" }}>
        <div style={{ position: "relative" }}>
          <select
            className="input"
            value={selectedId}
            onChange={e => setSelectedId(e.target.value)}
            style={{ paddingRight: "36px", appearance: "none", minWidth: "200px" }}
          >
            {chapters.map(c => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
          <ChevronDown size={16} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--text-muted)" }} />
        </div>
        <button className="btn btn-secondary" onClick={() => {
          const data = getAllChapters();
          setChapters(data);
        }}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {chapters.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "48px", color: "var(--text-muted)" }}>
          <BookOpen size={48} style={{ margin: "0 auto 16px auto", display: "block", opacity: 0.3 }} />
          No chapters found. Write some content first.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>

          {/* Scores */}
          <div className="card">
            <h2 style={{ fontSize: "16px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
              <CheckCircle size={18} color="var(--accent-color)" /> Readability Scores
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <ScoreGauge value={analysisData.fre} min={0} max={100} label={`Flesch Reading Ease — ${freLabel(analysisData.fre)}`} goodHigh={true} />
              <ScoreGauge value={analysisData.fkg} min={1} max={20} label={`Flesch-Kincaid Grade — ${fkgLabel(analysisData.fkg)}`} goodHigh={false} />
              <ScoreGauge value={analysisData.fog} min={1} max={20} label={`Gunning Fog Index — ${fkgLabel(analysisData.fog)}`} goodHigh={false} />
            </div>
            <div style={{ marginTop: "24px", padding: "12px", background: "var(--bg-tertiary)", borderRadius: "var(--radius-sm)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "13px", color: "var(--text-secondary)" }}>
              <span>Words: <strong style={{ color: "var(--text-primary)" }}>{analysisData.stats.wordCount.toLocaleString()}</strong></span>
              <span>Sentences: <strong style={{ color: "var(--text-primary)" }}>{analysisData.stats.sentenceCount}</strong></span>
              <span>Syllables: <strong style={{ color: "var(--text-primary)" }}>{analysisData.stats.syllableCount.toLocaleString()}</strong></span>
              <span>Avg words/sentence: <strong style={{ color: "var(--text-primary)" }}>{analysisData.stats.sentenceCount > 0 ? Math.round(analysisData.stats.wordCount / analysisData.stats.sentenceCount) : 0}</strong></span>
            </div>
          </div>

          {/* Jargon */}
          <div className="card">
            <h2 style={{ fontSize: "16px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <AlertTriangle size={18} color="#f59e0b" /> Technical Jargon Detected
            </h2>
            {analysisData.jargon.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>No technical jargon detected.</p>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {analysisData.jargon.map(j => (
                  <span key={j} style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b", padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: 600, border: "1px solid rgba(245,158,11,0.3)" }}>
                    {j}
                  </span>
                ))}
              </div>
            )}
            <p style={{ marginTop: "12px", fontSize: "12px", color: "var(--text-muted)" }}>
              These terms may be unfamiliar to general readers. Consider adding explanations or linking to your glossary.
            </p>
          </div>

          {/* Passive Voice */}
          <div className="card">
            <h2 style={{ fontSize: "16px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Info size={18} color="#6366f1" /> Passive Voice Sentences
              <span style={{ marginLeft: "auto", background: analysisData.passive.length > 5 ? "rgba(239,68,68,0.15)" : "rgba(99,102,241,0.15)", color: analysisData.passive.length > 5 ? "var(--danger-color)" : "var(--accent-color)", padding: "2px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: 600 }}>
                {analysisData.passive.length} found
              </span>
            </h2>
            {analysisData.passive.length === 0 ? (
              <p style={{ color: "#22c55e", fontSize: "14px" }}>✓ No passive sentences detected. Great writing!</p>
            ) : (
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "8px" }}>
                {analysisData.passive.map((s, i) => (
                  <li key={i} style={{ fontSize: "13px", color: "var(--text-secondary)", padding: "8px 12px", background: "var(--bg-tertiary)", borderRadius: "var(--radius-sm)", borderLeft: "3px solid #6366f1" }}>
                    &ldquo;{s.slice(0, 120)}{s.length > 120 ? "…" : ""}&rdquo;
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Consistency */}
          <div className="card">
            <h2 style={{ fontSize: "16px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <AlertTriangle size={18} color="var(--danger-color)" /> Consistency Issues
              <span style={{ marginLeft: "auto", background: analysisData.inconsistencies.length > 0 ? "rgba(239,68,68,0.15)" : "rgba(34,197,94,0.15)", color: analysisData.inconsistencies.length > 0 ? "var(--danger-color)" : "#22c55e", padding: "2px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: 600 }}>
                {analysisData.inconsistencies.length} issues
              </span>
            </h2>
            {analysisData.inconsistencies.length === 0 ? (
              <p style={{ color: "#22c55e", fontSize: "14px" }}>✓ No inconsistencies detected.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "280px", overflowY: "auto" }}>
                {analysisData.inconsistencies.map((item, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "var(--bg-tertiary)", borderRadius: "var(--radius-sm)", borderLeft: "3px solid var(--danger-color)" }}>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      {item.variants.map(v => (
                        <code key={v} style={{ background: "rgba(239,68,68,0.1)", color: "var(--danger-color)", padding: "2px 6px", borderRadius: "4px", fontSize: "12px" }}>{v}</code>
                      ))}
                    </div>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)", marginLeft: "8px", whiteSpace: "nowrap" }}>{item.chapters.length} ch.</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
