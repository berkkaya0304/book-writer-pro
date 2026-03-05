"use client";

import { useState, useEffect } from "react";
import { Scale, Copy, Check, ChevronDown, ChevronRight } from "lucide-react";
import { getSettings, getEthicsAnswers, saveEthicsAnswers, EthicsAnswer } from "@/lib/localStorageUtils";

const SECTIONS: { title: string; emoji: string; questions: string[] }[] = [
  {
    title: "Human Subjects Research",
    emoji: "👥",
    questions: [
      "Was human subjects research conducted in this study?",
      "Was IRB (or equivalent ethics board) approval obtained?",
      "Did all participants provide informed consent?",
      "Is participant data stored securely and anonymized?",
    ],
  },
  {
    title: "Data Privacy",
    emoji: "🔒",
    questions: [
      "Does the study collect or use personally identifiable information (PII)?",
      "Is all data used in compliance with relevant data protection laws (GDPR, etc.)?",
      "Are data retention policies clearly defined?",
    ],
  },
  {
    title: "AI / LLM Use Disclosure",
    emoji: "🤖",
    questions: [
      "Were AI tools (e.g., ChatGPT, Copilot) used in writing or preparing this manuscript?",
      "Were AI tools used for data analysis or code generation?",
      "Is the extent of AI tool use clearly disclosed in the paper?",
    ],
  },
  {
    title: "Conflicts of Interest",
    emoji: "⚖️",
    questions: [
      "Do any authors have financial or personal interests that could influence this research?",
      "Are all potential conflicts of interest declared in the manuscript?",
      "Did any commercial entities influence the study design or interpretation?",
    ],
  },
  {
    title: "Funding & Acknowledgments",
    emoji: "💰",
    questions: [
      "Is the funding source(s) for this research clearly stated?",
      "Are all funding agencies and grant numbers included?",
      "Are non-financial contributions from individuals or organizations acknowledged?",
    ],
  },
];

const answerStyle = (val: string, selected: EthicsAnswer['answer']) => ({
  padding: "5px 14px",
  borderRadius: "20px",
  border: "1px solid",
  cursor: "pointer",
  fontSize: "12px",
  fontWeight: 600,
  transition: "all 0.15s",
  borderColor: selected === val
    ? val === "yes" ? "#22c55e" : val === "no" ? "var(--danger-color, #ef4444)" : "#6366f1"
    : "var(--border-color)",
  backgroundColor: selected === val
    ? val === "yes" ? "rgba(34,197,94,0.15)" : val === "no" ? "rgba(239,68,68,0.12)" : "rgba(99,102,241,0.12)"
    : "var(--bg-tertiary)",
  color: selected === val
    ? val === "yes" ? "#22c55e" : val === "no" ? "var(--danger-color, #ef4444)" : "#6366f1"
    : "var(--text-muted)",
});

function makeKey(section: string, q: string) { return `${section}::${q}`; }

export default function EthicsChecklistPage() {
  const [answers, setAnswers] = useState<Map<string, EthicsAnswer>>(new Map());
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [generated, setGenerated] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const s = getSettings();
    document.documentElement.className = s.theme === "dark" ? "" : `theme-${s.theme}`;
    const saved = getEthicsAnswers();
    const map = new Map(saved.map(a => [makeKey(a.section, a.question), a]));
    setAnswers(map);
  }, []);

  const setAnswer = (section: string, question: string, answer: EthicsAnswer['answer'], explanation: string) => {
    const key = makeKey(section, question);
    const updated = new Map(answers);
    updated.set(key, { section, question, answer, explanation });
    setAnswers(updated);
    saveEthicsAnswers(Array.from(updated.values()));
  };

  const getAns = (section: string, q: string) => answers.get(makeKey(section, q));

  const totalQs = SECTIONS.reduce((acc, s) => acc + s.questions.length, 0);
  const answered = Array.from(answers.values()).filter(a => !!a.answer).length;
  const pct = Math.round((answered / totalQs) * 100);

  const toggleCollapse = (title: string) => setCollapsed(s => { const n = new Set(s); n.has(title) ? n.delete(title) : n.add(title); return n; });

  const generateStatement = () => {
    const parts: string[] = [];
    for (const sec of SECTIONS) {
      const sAnswers = sec.questions.map(q => getAns(sec.title, q)).filter(Boolean);
      if (sAnswers.some(a => a?.answer)) {
        let block = `${sec.title}: `;
        const lines = sAnswers.filter(a => a?.answer).map(a => {
          const ans = a!.answer === "yes" ? "Yes" : a!.answer === "no" ? "No" : "N/A";
          return `${a!.question} [${ans}]${a!.explanation ? ` — ${a!.explanation}` : ""}`;
        });
        block += lines.join(". ");
        parts.push(block);
      }
    }
    setGenerated(parts.join("\n\n"));
  };

  const copyGenerated = () => { navigator.clipboard.writeText(generated); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <div className="page-container">
      <h1 className="page-title">Ethics Checklist</h1>
      <p className="page-description">Complete ethical compliance questionnaire and generate a formal ethics statement.</p>

      {/* Progress */}
      <div className="card" style={{ marginBottom: "24px", display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: "28px", fontWeight: 700, color: pct === 100 ? "#22c55e" : "var(--accent-color)" }}>{pct}%</div>
          <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{answered}/{totalQs} answered</div>
        </div>
        <div style={{ flex: 1, height: "8px", backgroundColor: "var(--bg-tertiary)", borderRadius: "4px", minWidth: "120px" }}>
          <div style={{ width: `${pct}%`, height: "100%", backgroundColor: pct === 100 ? "#22c55e" : "var(--accent-color)", borderRadius: "4px", transition: "width 0.3s ease" }} />
        </div>
        <button className="btn btn-primary" onClick={generateStatement}><Scale size={14} /> Generate Ethics Statement</button>
      </div>

      {/* Generated */}
      {generated && (
        <div className="card" style={{ marginBottom: "20px", borderLeft: "3px solid #22c55e" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
            <span style={{ fontWeight: 600, color: "#22c55e", fontSize: "13px" }}>Ethics & Compliance Statement</span>
            <button className="btn btn-secondary" style={{ padding: "4px 10px", fontSize: "12px" }} onClick={copyGenerated}>
              {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
            </button>
          </div>
          <pre style={{ fontSize: "13px", lineHeight: 1.7, whiteSpace: "pre-wrap", wordBreak: "break-word", color: "var(--text-primary)", margin: 0 }}>{generated}</pre>
        </div>
      )}

      {/* Sections */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {SECTIONS.map(sec => {
          const isCollapsed = collapsed.has(sec.title);
          const secAnswered = sec.questions.filter(q => getAns(sec.title, q)?.answer).length;
          return (
            <div key={sec.title} className="card">
              <button
                onClick={() => toggleCollapse(sec.title)}
                style={{ width: "100%", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", padding: 0 }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "20px" }}>{sec.emoji}</span>
                  <span style={{ fontWeight: 600, fontSize: "15px" }}>{sec.title}</span>
                  <span style={{
                    fontSize: "12px", padding: "2px 8px", borderRadius: "10px",
                    backgroundColor: secAnswered === sec.questions.length ? "rgba(34,197,94,0.15)" : "var(--bg-tertiary)",
                    color: secAnswered === sec.questions.length ? "#22c55e" : "var(--text-muted)"
                  }}>{secAnswered}/{sec.questions.length}</span>
                </div>
                {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
              </button>
              {!isCollapsed && (
                <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "14px" }}>
                  {sec.questions.map((q, qi) => {
                    const ans = getAns(sec.title, q);
                    return (
                      <div key={qi}>
                        <p style={{ fontSize: "14px", marginBottom: "8px", fontWeight: 500 }}>{q}</p>
                        <div style={{ display: "flex", gap: "8px", marginBottom: "8px", flexWrap: "wrap" }}>
                          {(["yes", "no", "na"] as const).map(v => (
                            <button
                              key={v}
                              style={answerStyle(v, ans?.answer || "")}
                              onClick={() => setAnswer(sec.title, q, v, ans?.explanation || "")}
                            >
                              {v === "yes" ? "✅ Yes" : v === "no" ? "❌ No" : "➖ N/A"}
                            </button>
                          ))}
                        </div>
                        {ans?.answer && (
                          <input
                            className="input"
                            placeholder="Explanation (optional)…"
                            value={ans.explanation || ""}
                            onChange={e => setAnswer(sec.title, q, ans.answer, e.target.value)}
                            style={{ fontSize: "12px", padding: "6px 10px" }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
