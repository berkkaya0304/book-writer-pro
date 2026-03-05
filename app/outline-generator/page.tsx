"use client";

import { useState, useEffect } from "react";
import { Sparkles, ArrowRight, FileText, BookOpen, FlaskConical, Newspaper, Code2, Lightbulb } from "lucide-react";
import { useRouter } from "next/navigation";
import { getAiHeaders } from "@/lib/getAiHeaders";


// ─── Article Type Definitions ──────────────────────────────────────────────────
const ARTICLE_TYPES = [
  { value: "research-paper",   label: "Research Paper",         icon: FlaskConical,  description: "Introduction, Literature Review, Methodology, Results, Discussion, Conclusion" },
  { value: "technical-blog",   label: "Technical Blog Post",    icon: Code2,         description: "Hook, Problem, Solution, Implementation, Gotchas, Summary" },
  { value: "tutorial",         label: "Step-by-Step Tutorial",  icon: BookOpen,      description: "Prerequisites, Concepts, Guided Steps, Verification, Next Steps" },
  { value: "whitepaper",       label: "White Paper",            icon: FileText,      description: "Executive Summary, Problem Statement, Proposed Solution, Technical Details, ROI" },
  { value: "case-study",       label: "Case Study",             icon: Lightbulb,     description: "Background, Challenge, Solution, Implementation, Results, Lessons Learned" },
  { value: "newsletter",       label: "Technical Newsletter",   icon: Newspaper,     description: "Opening, Feature Topics, Deep Dive, Industry News, Takeaways" },
];

const AUDIENCES = [
  { value: "beginner",      label: "Beginner (No prior knowledge)" },
  { value: "intermediate",  label: "Intermediate (Some experience)" },
  { value: "advanced",      label: "Advanced (Expert practitioner)" },
  { value: "executive",     label: "Executive (Business decision-maker)" },
];

const DOMAINS = [
  "Software Engineering", "Machine Learning / AI", "DevOps & Cloud", "Cybersecurity",
  "Data Engineering", "Systems Architecture", "Frontend Development", "Backend Development",
  "Embedded Systems", "Networking & Protocols", "Database Administration", "Blockchain",
  "Robotics", "Quantum Computing", "Other",
];

const SECTION_PRESETS: Record<string, string[]> = {
  "research-paper": ["Abstract", "Introduction", "Related Work", "Methodology", "Implementation", "Results & Evaluation", "Discussion", "Conclusion & Future Work", "References"],
  "technical-blog": ["Introduction / Hook", "Problem Statement", "Core Concept Explained", "Implementation Walkthrough", "Edge Cases & Gotchas", "Performance Considerations", "Conclusion & Next Steps"],
  "tutorial": ["Prerequisites", "What You Will Build", "Core Concepts", "Environment Setup", "Step-by-Step Implementation", "Testing & Verification", "Troubleshooting", "Summary & Next Steps"],
  "whitepaper": ["Executive Summary", "Problem Statement", "Market Context", "Proposed Solution", "Technical Architecture", "Security & Compliance", "Implementation Roadmap", "ROI & Business Impact", "Conclusion"],
  "case-study": ["Executive Summary", "Company / Project Background", "The Challenge", "Solution Overview", "Technical Implementation", "Results & Metrics", "Lessons Learned", "Recommendations"],
  "newsletter": ["Editor's Note", "This Week's Focus", "Deep Dive Article", "Tool / Library Spotlight", "Industry News", "Community Picks", "Closing Thoughts"],
};

export default function OutlineGeneratorPage() {
  const router = useRouter();

  // Form state
  const [articleType, setArticleType] = useState("technical-blog");
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("intermediate");
  const [domain, setDomain] = useState("Software Engineering");
  const [language, setLanguage] = useState("English");
  const [tone, setTone] = useState("Professional");
  const [wordTarget, setWordTarget] = useState(3000);
  const [keywords, setKeywords] = useState("");
  const [constraints, setConstraints] = useState("");
  const [customSections, setCustomSections] = useState<string[]>([]);
  const [useCustomSections, setUseCustomSections] = useState(false);

  // Output state
  const [generating, setGenerating] = useState(false);
  const [outline, setOutline] = useState<Array<{ title: string; outline: string }>>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const savedLang = localStorage.getItem("defaultLanguage");
    const savedTone = localStorage.getItem("defaultTone");
    if (savedLang) setLanguage(savedLang);
    if (savedTone) setTone(savedTone);
  }, []);

  // When article type changes, pre-fill custom sections from preset
  useEffect(() => {
    setCustomSections(SECTION_PRESETS[articleType] || []);
  }, [articleType]);

  const selectedType = ARTICLE_TYPES.find(t => t.value === articleType)!;
  const chapterCount = useCustomSections ? customSections.length : SECTION_PRESETS[articleType]?.length || 7;

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setGenerating(true);
    setOutline([]);

    const sectionsHint = useCustomSections
      ? `The article MUST have exactly these sections in this order: ${customSections.join(", ")}.`
      : `Follow the standard structure for a ${selectedType.label}: ${SECTION_PRESETS[articleType]?.join(", ")}.`;

    const keywordHint = keywords.trim()
      ? `Important keywords/concepts to cover: ${keywords}.`
      : "";

    const constraintHint = constraints.trim()
      ? `Additional constraints: ${constraints}.`
      : "";

    const prompt = `
Topic: "${topic}"
Article Type: ${selectedType.label}
Target Audience: ${AUDIENCES.find(a => a.value === audience)?.label}
Domain: ${domain}
Approximate Word Count Target: ${wordTarget} words
${keywordHint}
${constraintHint}
${sectionsHint}
`;

    try {
      const res = await fetch("/api/outline", {
        method: "POST",
        headers: getAiHeaders(),
        body: JSON.stringify({
          premise: prompt,
          chapterCount,
          language,
          tone,
          mode: "technical",
          articleType: selectedType.label,
          audience: AUDIENCES.find(a => a.value === audience)?.label,
        }),
      });

      const data = await res.json();
      if (data.type === "quota_exceeded") {
        alert("⚠️ Google API krediniz doldu! Ayarlar'dan Ollama'ya geçebilirsiniz.");
        return;
      }
      if (data.error) throw new Error(data.error);
      if (data.outline && Array.isArray(data.outline)) {
        setOutline(data.outline);
      } else {
        alert("AI returned malformed data.");
      }
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "Failed to generate outline.");
    } finally {
      setGenerating(false);
    }
  };

  const handleCreateChapters = async () => {
    if (outline.length === 0) return;
    setSaving(true);
    try {
      for (const chapter of outline) {
        await fetch("/api/chapters", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: chapter.title, outline: chapter.outline, content: "" }),
        });
      }
      router.push("/chapters");
    } catch (e) {
      console.error(e);
      alert("Failed to save chapters.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
        <Sparkles size={28} color="var(--accent-color)" />
        <div>
          <h1 className="page-title" style={{ marginBottom: 0 }}>Technical Article Outline Generator</h1>
          <p className="page-description" style={{ marginBottom: 0 }}>
            AI-powered structure generator tailored for technical writing — research papers, tutorials, whitepapers & more.
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "24px", alignItems: "start" }}>

        {/* ── Left Panel: Form ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* Article Type Picker */}
          <div className="card" style={{ padding: "16px" }}>
            <h2 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "12px" }}>
              Article Type
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              {ARTICLE_TYPES.map(t => {
                const Icon = t.icon;
                const active = articleType === t.value;
                return (
                  <button
                    key={t.value}
                    onClick={() => setArticleType(t.value)}
                    style={{
                      display: "flex", alignItems: "center", gap: "8px",
                      padding: "10px 12px", borderRadius: "var(--radius-md)",
                      border: `1px solid ${active ? "var(--accent-color)" : "var(--border-color)"}`,
                      background: active ? "var(--accent-light)" : "var(--bg-tertiary)",
                      color: active ? "var(--accent-color)" : "var(--text-secondary)",
                      cursor: "pointer", textAlign: "left", fontSize: "13px", fontWeight: 500,
                      transition: "all 0.15s ease",
                    }}
                  >
                    <Icon size={15} style={{ flexShrink: 0 }} />
                    {t.label}
                  </button>
                );
              })}
            </div>
            {selectedType && (
              <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "10px", lineHeight: 1.5, padding: "8px 10px", background: "var(--bg-tertiary)", borderRadius: "6px" }}>
                📋 {selectedType.description}
              </p>
            )}
          </div>

          {/* Topic & Domain */}
          <div className="card" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "14px" }}>
            <h2 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>
              Topic & Context
            </h2>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Article Topic / Title Idea</label>
              <textarea
                className="input"
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="e.g. Implementing a Circuit Breaker Pattern in Go microservices for fault-tolerant APIs"
                style={{ minHeight: "100px", resize: "vertical" }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Domain</label>
                <select className="input" value={domain} onChange={e => setDomain(e.target.value)} style={{ appearance: "none" }}>
                  {DOMAINS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Target Audience</label>
                <select className="input" value={audience} onChange={e => setAudience(e.target.value)} style={{ appearance: "none" }}>
                  {AUDIENCES.map(a => <option key={a.value} value={a.value}>{a.label.split(" (")[0]}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Language</label>
                <select className="input" value={language} onChange={e => setLanguage(e.target.value)} style={{ appearance: "none" }}>
                  <option value="English">English</option>
                  <option value="Turkish">Turkish</option>
                </select>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Writing Tone</label>
                <select className="input" value={tone} onChange={e => setTone(e.target.value)} style={{ appearance: "none" }}>
                  <option>Professional</option>
                  <option>Neutral</option>
                  <option>Friendly</option>
                  <option>Academic</option>
                  <option>Concise</option>
                </select>
              </div>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Target Word Count</label>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <input type="range" min={500} max={20000} step={500} value={wordTarget} onChange={e => setWordTarget(Number(e.target.value))} style={{ flex: 1 }} />
                <span style={{ whiteSpace: "nowrap", fontWeight: 600, color: "var(--accent-color)", fontSize: "14px", minWidth: "60px" }}>~{wordTarget.toLocaleString()}w</span>
              </div>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Key Terms / Technologies to Cover</label>
              <input
                className="input"
                value={keywords}
                onChange={e => setKeywords(e.target.value)}
                placeholder="e.g. Redis, exponential backoff, idempotency, gRPC"
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Extra Constraints (optional)</label>
              <input
                className="input"
                value={constraints}
                onChange={e => setConstraints(e.target.value)}
                placeholder="e.g. Avoid vendor lock-in, include code examples in Python"
              />
            </div>
          </div>

          {/* Custom Sections */}
          <div className="card" style={{ padding: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <h2 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>
                Section Structure
              </h2>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", cursor: "pointer" }}>
                <input type="checkbox" checked={useCustomSections} onChange={e => setUseCustomSections(e.target.checked)} />
                Customize
              </label>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {(useCustomSections ? customSections : SECTION_PRESETS[articleType] || []).map((s, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", width: "20px", textAlign: "right" }}>{i + 1}.</span>
                  {useCustomSections ? (
                    <input
                      className="input"
                      value={s}
                      onChange={e => {
                        const arr = [...customSections];
                        arr[i] = e.target.value;
                        setCustomSections(arr);
                      }}
                      style={{ padding: "6px 10px", fontSize: "12px" }}
                    />
                  ) : (
                    <span style={{ fontSize: "13px", color: "var(--text-secondary)", padding: "6px 10px", background: "var(--bg-tertiary)", borderRadius: "6px", flex: 1 }}>{s}</span>
                  )}
                  {useCustomSections && (
                    <button
                      onClick={() => setCustomSections(customSections.filter((_, j) => j !== i))}
                      style={{ color: "var(--danger-color)", background: "none", border: "none", cursor: "pointer", padding: "2px" }}
                    >✕</button>
                  )}
                </div>
              ))}
              {useCustomSections && (
                <button
                  className="btn btn-secondary"
                  style={{ marginTop: "6px", fontSize: "12px", padding: "5px 10px" }}
                  onClick={() => setCustomSections([...customSections, "New Section"])}
                >
                  + Add Section
                </button>
              )}
            </div>
          </div>

          {/* Generate Button */}
          <button
            className="btn btn-primary"
            style={{ width: "100%", justifyContent: "center", padding: "14px" }}
            onClick={handleGenerate}
            disabled={generating || !topic.trim()}
          >
            <Sparkles size={18} />
            {generating ? "AI is generating structure…" : "Generate Technical Outline"}
          </button>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", textAlign: "center", lineHeight: 1.5 }}>
            Uses your local Ollama model. Make sure a capable model (llama3, mistral) is selected in Settings.
          </p>
        </div>

        {/* ── Right Panel: Output ── */}
        <div className="card" style={{ minHeight: "600px", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <div>
              <h2 style={{ fontSize: "18px", margin: 0 }}>Generated Structure</h2>
              {outline.length > 0 && (
                <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "4px 0 0 0" }}>
                  {outline.length} sections · {selectedType?.label} · {AUDIENCES.find(a => a.value === audience)?.label.split(" (")[0]}
                </p>
              )}
            </div>
            {outline.length > 0 && (
              <button
                className="btn btn-secondary"
                onClick={handleCreateChapters}
                disabled={saving}
                style={{ backgroundColor: "var(--accent-light)", color: "var(--accent-color)", borderColor: "transparent" }}
              >
                {saving ? "Saving…" : "Save as Chapters"} <ArrowRight size={16} />
              </button>
            )}
          </div>

          {generating ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)", gap: "12px" }}>
              <Sparkles size={40} style={{ opacity: 0.3, animation: "pulse 2s infinite" }} />
              <p>Building your technical outline…</p>
              <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>This may take 30–60s depending on your model</p>
            </div>
          ) : outline.length === 0 ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", gap: "16px" }}>
              <FileText size={56} style={{ opacity: 0.15 }} />
              <div style={{ textAlign: "center" }}>
                <p style={{ fontWeight: 500 }}>No outline generated yet</p>
                <p style={{ fontSize: "13px", marginTop: "4px" }}>Fill in the topic and click Generate</p>
              </div>
              <div style={{ padding: "12px 20px", background: "var(--bg-tertiary)", borderRadius: "var(--radius-md)", maxWidth: "320px" }}>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: 0, lineHeight: 1.6 }}>
                  💡 <strong>Tip:</strong> The more specific your topic and keywords, the more accurate the section summaries will be.
                </p>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {outline.map((ch, idx) => (
                <div key={idx} style={{
                  padding: "14px 16px",
                  borderRadius: "var(--radius-md)",
                  background: "var(--bg-tertiary)",
                  borderLeft: "3px solid var(--accent-color)",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 800, color: "var(--accent-color)", background: "var(--accent-light)", padding: "2px 8px", borderRadius: "10px" }}>
                      §{idx + 1}
                    </span>
                    <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                      {ch.title}
                    </h3>
                  </div>
                  <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>
                    {ch.outline}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
