"use client";

import { useEffect, useState } from "react";
import { GitFork, RefreshCw } from "lucide-react";
import { getAllChapters, Chapter, getSettings } from "@/lib/localStorageUtils";
import mermaid from "mermaid";

mermaid.initialize({ startOnLoad: false, theme: "dark", securityLevel: "loose" });

function getRawText(html: string): string {
  if (typeof window === "undefined") return html.replace(/<[^>]*>/g, " ");
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent || "";
}

// Detect references to other chapters in content
function findReferences(chapters: Chapter[], source: Chapter): string[] {
  const rawText = getRawText(source.content || "");
  const refs: string[] = [];

  chapters.forEach(target => {
    if (target.id === source.id) return;
    // Look for "Chapter X", "see Chapter X", "Chapter N" by title keywords
    const titleWords = target.title.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const textLower = rawText.toLowerCase();

    // Match chapter title keywords or "Chapter N" pattern
    const orderMatch = new RegExp(`chapter\\s+${target.order}\\b`, "i").test(rawText);
    const titleMatch = titleWords.length > 0 && titleWords.some(w => textLower.includes(w));
    const explicitMatch = rawText.includes(`[[${target.title}]]`) || rawText.includes(`[[Chapter ${target.order}]]`);

    if (orderMatch || explicitMatch || (titleMatch && titleWords[0].length > 5)) {
      refs.push(target.id);
    }
  });

  return refs;
}

export default function DependencyGraphPage() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [svg, setSvg] = useState("");
  const [loading, setLoading] = useState(false);
  const [edgeCount, setEdgeCount] = useState(0);

  useEffect(() => {
    const s = getSettings();
    document.documentElement.className = s.theme === "dark" ? "" : `theme-${s.theme}`;
    const chs = getAllChapters();
    setChapters(chs);
    if (chs.length > 0) generateGraph(chs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generateGraph = async (chs: Chapter[]) => {
    setLoading(true);
    setSvg("");

    const edges: [string, string][] = [];
    chs.forEach(ch => {
      const refs = findReferences(chs, ch);
      refs.forEach(targetId => edges.push([ch.id, targetId]));
    });
    setEdgeCount(edges.length);

    if (chs.length === 0) { setLoading(false); return; }

    // Build Mermaid diagram
    const nodeLines = chs.map(c => {
      const label = `${c.order}. ${c.title.replace(/"/g, "'")}`;
      const status = c.technicalStatus;
      const style = status === "Verified" ? ":::verified" : status === "Under Review" ? ":::review" : "";
      return `  C${c.id.replace(/\D/g, "").slice(-6)}["${label}"]${style}`;
    });

    const edgeLines = edges.map(([src, tgt]) =>
      `  C${src.replace(/\D/g, "").slice(-6)} --> C${tgt.replace(/\D/g, "").slice(-6)}`
    );

    const code = `graph TD\n${nodeLines.join("\n")}\n${edgeLines.join("\n")}\n  classDef verified fill:#166534,stroke:#22c55e,color:#dcfce7\n  classDef review fill:#78350f,stroke:#f59e0b,color:#fef3c7`;

    try {
      const id = `dep-graph-${Date.now()}`;
      const { svg: rendered } = await mermaid.render(id, code);
      setSvg(rendered);
    } catch (e) {
      console.error("Mermaid render error:", e);
      setSvg(`<div style="color:var(--danger-color);padding:20px">Graph render error. Check console.</div>`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Chapter Dependency Graph</h1>
      <p className="page-description">
        Visualize which chapters reference each other. References are detected automatically from chapter content.
        Use <code style={{ backgroundColor: "var(--bg-tertiary)", padding: "1px 6px", borderRadius: "4px" }}>{"[[Chapter N]]"}</code> for explicit links.
      </p>

      {/* Stats */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
        <div className="card" style={{ flex: 1, padding: "16px", textAlign: "center" }}>
          <div style={{ fontSize: "28px", fontWeight: 700, color: "var(--accent-color)" }}>{chapters.length}</div>
          <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Chapters</div>
        </div>
        <div className="card" style={{ flex: 1, padding: "16px", textAlign: "center" }}>
          <div style={{ fontSize: "28px", fontWeight: 700, color: "var(--accent-color)" }}>{edgeCount}</div>
          <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>References Detected</div>
        </div>
        <div className="card" style={{ flex: 1, padding: "16px", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <button className="btn btn-secondary" onClick={() => generateGraph(chapters)} disabled={loading} style={{ width: "100%", justifyContent: "center" }}>
            <RefreshCw size={15} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} /> Regenerate
          </button>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "16px", fontSize: "12px", color: "var(--text-secondary)" }}>
        <span>Legend:</span>
        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: "12px", height: "12px", borderRadius: "3px", backgroundColor: "#166534", border: "1px solid #22c55e", display: "inline-block" }} /> Verified
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: "12px", height: "12px", borderRadius: "3px", backgroundColor: "#78350f", border: "1px solid #f59e0b", display: "inline-block" }} /> Under Review
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: "12px", height: "12px", borderRadius: "3px", backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-color)", display: "inline-block" }} /> Draft
        </span>
      </div>

      {/* Graph */}
      <div className="card" style={{ minHeight: "400px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {loading ? (
          <div style={{ color: "var(--text-muted)", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
            <RefreshCw size={32} style={{ animation: "spin 1s linear infinite", opacity: 0.5 }} />
            <span>Analyzing chapter dependencies...</span>
          </div>
        ) : chapters.length === 0 ? (
          <div style={{ textAlign: "center", color: "var(--text-muted)" }}>
            <GitFork size={48} style={{ margin: "0 auto 16px", opacity: 0.3 }} />
            <p>No chapters yet. Create some chapters to see the dependency graph.</p>
          </div>
        ) : svg ? (
          <div
            dangerouslySetInnerHTML={{ __html: svg }}
            style={{ width: "100%", overflowX: "auto" }}
          />
        ) : (
          <div style={{ textAlign: "center", color: "var(--text-muted)" }}>
            <GitFork size={48} style={{ margin: "0 auto 16px", opacity: 0.3 }} />
            <p>No inter-chapter references detected yet.<br />Reference other chapters in your content to see connections.</p>
          </div>
        )}
      </div>

      {/* Chapter list with detected refs */}
      {chapters.length > 0 && (
        <div className="card" style={{ marginTop: "24px" }}>
          <h3 style={{ fontSize: "14px", marginBottom: "12px", color: "var(--text-secondary)" }}>Chapter Reference Summary</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {chapters.map(ch => {
              const refs = findReferences(chapters, ch);
              return (
                <div key={ch.id} style={{ display: "flex", gap: "12px", alignItems: "center", fontSize: "13px", padding: "6px 0", borderBottom: "1px solid var(--border-color)" }}>
                  <span style={{ minWidth: "24px", color: "var(--text-muted)" }}>{ch.order}.</span>
                  <span style={{ flex: 1 }}>{ch.title}</span>
                  {refs.length > 0 ? (
                    <span style={{ color: "var(--accent-color)", fontSize: "12px" }}>
                      → {refs.map(id => chapters.find(c => c.id === id)?.title).join(", ")}
                    </span>
                  ) : (
                    <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>no references</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
