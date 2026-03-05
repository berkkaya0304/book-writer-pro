"use client";

import { useEffect, useState, useMemo } from "react";
import { getAllChapters, getChapterHistory, createSnapshot, Chapter, Snapshot, getSettings } from "@/lib/localStorageUtils";
import { GitCommit, Plus, Diff, ChevronDown, Clock, SplitSquareHorizontal, Rows4 } from "lucide-react";

// ─── Word-level Diff ──────────────────────────────────────────────────────────
function stripHtml(html: string): string {
  if (typeof document === "undefined") return html.replace(/<[^>]+>/g, " ");
  const d = document.createElement("div");
  d.innerHTML = html;
  return d.textContent || "";
}

function wordDiff(oldText: string, newText: string): { text: string; type: "same" | "add" | "remove" }[] {
  const oldWords = oldText.split(/(\s+)/);
  const newWords = newText.split(/(\s+)/);
  const result: { text: string; type: "same" | "add" | "remove" }[] = [];

  // Simple LCS-based diff
  const m = oldWords.length, n = newWords.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--)
    for (let j = n - 1; j >= 0; j--)
      dp[i][j] = oldWords[i] === newWords[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);

  let i = 0, j = 0;
  while (i < m && j < n) {
    if (oldWords[i] === newWords[j]) {
      result.push({ text: oldWords[i], type: "same" });
      i++; j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      result.push({ text: oldWords[i], type: "remove" });
      i++;
    } else {
      result.push({ text: newWords[j], type: "add" });
      j++;
    }
  }
  while (i < m) { result.push({ text: oldWords[i++], type: "remove" }); }
  while (j < n) { result.push({ text: newWords[j++], type: "add" }); }

  return result.slice(0, 2000); // Limit for performance
}

export default function ChangelogPage() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapterId, setSelectedChapterId] = useState<string>("");
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [snapshotName, setSnapshotName] = useState("");
  const [compareA, setCompareA] = useState<string>("");
  const [compareB, setCompareB] = useState<string>("");
  const [showDiff, setShowDiff] = useState(false);
  const [diffMode, setDiffMode] = useState<"inline"|"split">("split");

  useEffect(() => {
    const savedTheme = getSettings().theme || "dark";
    document.documentElement.className = savedTheme === "dark" ? "" : `theme-${savedTheme}`;
    const data = getAllChapters();
    setChapters(data);
    if (data.length > 0) setSelectedChapterId(data[0].id);
  }, []);

  useEffect(() => {
    if (selectedChapterId) {
      const snaps = getChapterHistory(selectedChapterId);
      setSnapshots(snaps);
      setCompareA(""); setCompareB(""); setShowDiff(false);
    }
  }, [selectedChapterId]);

  function handleCreateSnapshot() {
    const chapter = chapters.find(c => c.id === selectedChapterId);
    if (!chapter) return;
    const name = snapshotName.trim() || `Snapshot ${new Date().toLocaleString()}`;
    createSnapshot(selectedChapterId, chapter.content || "", name);
    setSnapshotName("");
    setSnapshots(getChapterHistory(selectedChapterId));
  }

  const snapshotA = snapshots.find(s => s.id === compareA);
  const snapshotB = snapshots.find(s => s.id === compareB);

  const diffResult = useMemo(() => {
    if (!snapshotA || !snapshotB) return [];
    return wordDiff(stripHtml(snapshotA.content), stripHtml(snapshotB.content));
  }, [snapshotA, snapshotB]);

  const addedWords = diffResult.filter(d => d.type === "add").length;
  const removedWords = diffResult.filter(d => d.type === "remove").length;

  return (
    <div className="page-container">
      <h1 className="page-title">Version Changelog</h1>
      <p className="page-description">Track named snapshots and compare versions with a visual diff viewer.</p>

      {/* chapter select + create snapshot */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap", alignItems: "flex-end" }}>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label" style={{ fontSize: "12px" }}>Chapter</label>
          <div style={{ position: "relative" }}>
            <select className="input" value={selectedChapterId} onChange={e => setSelectedChapterId(e.target.value)} style={{ appearance: "none", paddingRight: "36px", minWidth: "200px" }}>
              {chapters.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
            <ChevronDown size={16} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--text-muted)" }} />
          </div>
        </div>
        <div className="form-group" style={{ margin: 0, flex: 1 }}>
          <label className="form-label" style={{ fontSize: "12px" }}>Snapshot Name (optional)</label>
          <input className="input" placeholder='e.g. "v1.0-draft", "After review"' value={snapshotName} onChange={e => setSnapshotName(e.target.value)} onKeyDown={e => { if (e.key === "Enter") handleCreateSnapshot(); }} />
        </div>
        <button className="btn btn-primary" onClick={handleCreateSnapshot} style={{ whiteSpace: "nowrap" }}>
          <Plus size={16} /> Save Snapshot
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        {/* Snapshot List */}
        <div className="card">
          <h2 style={{ fontSize: "16px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <GitCommit size={18} color="var(--accent-color)" /> Snapshots ({snapshots.length}/10)
          </h2>
          {snapshots.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>No snapshots yet. Save the current version above.</p>
          ) : (
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "8px" }}>
              {snapshots.map((s, i) => (
                <li key={s.id} style={{ padding: "10px 14px", borderRadius: "var(--radius-sm)", background: "var(--bg-tertiary)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "14px" }}>{s.name || `Snapshot ${i + 1}`}</div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                      <Clock size={11} /> {new Date(s.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                    {stripHtml(s.content).split(/\s+/).filter(Boolean).length}w
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Diff Tool */}
        <div className="card">
          <h2 style={{ fontSize: "16px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Diff size={18} color="#f59e0b" /> Diff Viewer
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: "12px" }}>Version A (older)</label>
              <select className="input" value={compareA} onChange={e => setCompareA(e.target.value)} style={{ appearance: "none" }}>
                <option value="">Select version…</option>
                {snapshots.map((s, i) => <option key={s.id} value={s.id}>{s.name || `Snapshot ${i + 1}`} — {new Date(s.createdAt).toLocaleDateString()}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: "12px" }}>Version B (newer)</label>
              <select className="input" value={compareB} onChange={e => setCompareB(e.target.value)} style={{ appearance: "none" }}>
                <option value="">Select version…</option>
                {snapshots.map((s, i) => <option key={s.id} value={s.id}>{s.name || `Snapshot ${i + 1}`} — {new Date(s.createdAt).toLocaleDateString()}</option>)}
              </select>
            </div>
            <button className="btn btn-primary" onClick={() => setShowDiff(true)} disabled={!compareA || !compareB || compareA === compareB}>
              <Diff size={16} /> Compare Versions
            </button>
          </div>

          {showDiff && diffResult.length > 0 && (
            <div style={{ marginTop: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <div style={{ display: "flex", gap: "12px", fontSize: "12px" }}>
                  <span style={{ color: "#2ea043", fontWeight: 600 }}>+{addedWords} words added</span>
                  <span style={{ color: "var(--danger-color)", fontWeight: 600 }}>−{removedWords} words removed</span>
                </div>
                
                <div style={{ display: "flex", gap: "4px", backgroundColor: "var(--bg-tertiary)", padding: "2px", borderRadius: "var(--radius-sm)" }}>
                  <button 
                    onClick={() => setDiffMode("inline")}
                    style={{ 
                      display: "flex", alignItems: "center", gap: "4px", padding: "4px 8px", fontSize: "11px", 
                      border: "none", borderRadius: "var(--radius-sm)", cursor: "pointer",
                      backgroundColor: diffMode === "inline" ? "var(--bg-secondary)" : "transparent",
                      color: diffMode === "inline" ? "var(--text-primary)" : "var(--text-muted)",
                      fontWeight: diffMode === "inline" ? 600 : 400
                    }}
                  >
                    <Rows4 size={14} /> Inline
                  </button>
                  <button 
                    onClick={() => setDiffMode("split")}
                    style={{ 
                      display: "flex", alignItems: "center", gap: "4px", padding: "4px 8px", fontSize: "11px", 
                      border: "none", borderRadius: "var(--radius-sm)", cursor: "pointer",
                      backgroundColor: diffMode === "split" ? "var(--bg-secondary)" : "transparent",
                      color: diffMode === "split" ? "var(--text-primary)" : "var(--text-muted)",
                      fontWeight: diffMode === "split" ? 600 : 400
                    }}
                  >
                    <SplitSquareHorizontal size={14} /> Side-by-Side
                  </button>
                </div>
              </div>

              {diffMode === "inline" ? (
                <div style={{ padding: "12px", background: "var(--bg-tertiary)", borderRadius: "var(--radius-sm)", maxHeight: "400px", overflowY: "auto", lineHeight: 1.8, fontSize: "13px" }}>
                  {diffResult.map((token, i) => (
                    <span key={i} style={{
                      background: token.type === "add" ? "rgba(46, 160, 67, 0.25)" : token.type === "remove" ? "rgba(239, 68, 68, 0.25)" : "transparent",
                      color: token.type === "add" ? "#2ea043" : token.type === "remove" ? "var(--danger-color)" : "var(--text-primary)",
                      textDecoration: token.type === "remove" ? "line-through" : "none",
                      padding: token.type !== "same" ? "0 2px" : "0",
                      borderRadius: "2px"
                    }}>{token.text}</span>
                  ))}
                </div>
              ) : (
                <div style={{ display: "flex", gap: "8px", maxHeight: "400px" }}>
                  {/* Left Column (Removed / Same) */}
                  <div style={{ flex: 1, padding: "12px", background: "rgba(239, 68, 68, 0.05)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "var(--radius-sm)", overflowY: "auto", lineHeight: 1.8, fontSize: "13px" }}>
                    <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--danger-color)", marginBottom: "8px", textTransform: "uppercase" }}>Older Version</div>
                    {diffResult.filter(t => t.type !== "add").map((token, i) => (
                      <span key={`old-${i}`} style={{
                        background: token.type === "remove" ? "rgba(239, 68, 68, 0.25)" : "transparent",
                        color: token.type === "remove" ? "var(--danger-color)" : "var(--text-primary)",
                        padding: token.type === "remove" ? "0 2px" : "0",
                        borderRadius: "2px"
                      }}>{token.text}</span>
                    ))}
                  </div>
                  
                  {/* Right Column (Added / Same) */}
                  <div style={{ flex: 1, padding: "12px", background: "rgba(46, 160, 67, 0.05)", border: "1px solid rgba(46, 160, 67, 0.2)", borderRadius: "var(--radius-sm)", overflowY: "auto", lineHeight: 1.8, fontSize: "13px" }}>
                    <div style={{ fontSize: "11px", fontWeight: 600, color: "#2ea043", marginBottom: "8px", textTransform: "uppercase" }}>Newer Version</div>
                    {diffResult.filter(t => t.type !== "remove").map((token, i) => (
                      <span key={`new-${i}`} style={{
                        background: token.type === "add" ? "rgba(46, 160, 67, 0.25)" : "transparent",
                        color: token.type === "add" ? "#2ea043" : "var(--text-primary)",
                        padding: token.type === "add" ? "0 2px" : "0",
                        borderRadius: "2px"
                      }}>{token.text}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
