"use client";

import { useState, useEffect } from "react";
import { Table2, Plus, Trash2, Copy, Check, AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import { getSettings } from "@/lib/localStorageUtils";

type Align = "left" | "center" | "right";

export default function TableBuilderPage() {
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [cells, setCells] = useState<string[][]>(() => Array.from({ length: 3 }, () => Array(3).fill("")));
  const [aligns, setAligns] = useState<Align[]>(Array(3).fill("left"));
  const [hasHeader, setHasHeader] = useState(true);
  const [copied, setCopied] = useState(false);
  const [csvCopied, setCsvCopied] = useState(false);

  useEffect(() => {
    const s = getSettings();
    document.documentElement.className = s.theme === "dark" ? "" : `theme-${s.theme}`;
  }, []);

  const updateCell = (r: number, c: number, val: string) => {
    setCells(prev => prev.map((row, ri) => ri === r ? row.map((cell, ci) => ci === c ? val : cell) : row));
  };

  const addRow = () => {
    setCells(prev => [...prev, Array(cols).fill("")]);
    setRows(r => r + 1);
  };

  const removeRow = (r: number) => {
    if (rows <= 1) return;
    setCells(prev => prev.filter((_, i) => i !== r));
    setRows(r => r - 1);
  };

  const addCol = () => {
    setCells(prev => prev.map(row => [...row, ""]));
    setAligns(a => [...a, "left"]);
    setCols(c => c + 1);
  };

  const removeCol = (c: number) => {
    if (cols <= 1) return;
    setCells(prev => prev.map(row => row.filter((_, i) => i !== c)));
    setAligns(a => a.filter((_, i) => i !== c));
    setCols(c => c - 1);
  };

  const setAlign = (c: number, a: Align) => setAligns(prev => prev.map((v, i) => i === c ? a : v));

  const toMarkdown = () => {
    const alignChar = (a: Align) => a === "center" ? ":---:" : a === "right" ? "---:" : ":---";
    const lines = cells.map((row, ri) => "| " + row.map(c => c || " ").join(" | ") + " |");
    if (hasHeader) {
      const sep = "| " + aligns.map(alignChar).join(" | ") + " |";
      lines.splice(1, 0, sep);
    }
    return lines.join("\n");
  };

  const toCsv = () => cells.map(row => row.map(c => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");

  const copyMd = () => { navigator.clipboard.writeText(toMarkdown()); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const copyCsv = () => { navigator.clipboard.writeText(toCsv()); setCsvCopied(true); setTimeout(() => setCsvCopied(false), 2000); };

  const AlignBtn = ({ idx, a }: { idx: number; a: Align }) => {
    const Icon = a === "left" ? AlignLeft : a === "center" ? AlignCenter : AlignRight;
    return (
      <button onClick={() => setAlign(idx, a)} style={{
        padding: "3px 5px", borderRadius: "4px", border: "none", cursor: "pointer",
        backgroundColor: aligns[idx] === a ? "var(--accent-color)" : "var(--bg-tertiary)",
        color: aligns[idx] === a ? "#fff" : "var(--text-muted)"
      }}><Icon size={12} /></button>
    );
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Data Table Builder</h1>
      <p className="page-description">Build result tables visually and export as Markdown or CSV.</p>

      {/* Controls */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
        <button className="btn btn-secondary" onClick={addRow}><Plus size={14} /> Row</button>
        <button className="btn btn-secondary" onClick={addCol}><Plus size={14} /> Column</button>
        <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", cursor: "pointer" }}>
          <input type="checkbox" checked={hasHeader} onChange={e => setHasHeader(e.target.checked)} />
          First row as header
        </label>
        <div style={{ marginLeft: "auto", display: "flex", gap: "8px" }}>
          <button className="btn btn-secondary" onClick={copyCsv}>{csvCopied ? <><Check size={14} /> CSV Copied!</> : <><Copy size={14} /> Copy CSV</>}</button>
          <button className="btn btn-primary" onClick={copyMd}>{copied ? <><Check size={14} /> Markdown Copied!</> : <><Table2 size={14} /> Copy Markdown</>}</button>
        </div>
      </div>

      {/* Table Editor */}
      <div style={{ overflowX: "auto" }}>
        {/* Alignment row */}
        <div style={{ display: "flex", gap: "2px", marginBottom: "4px", paddingLeft: "24px" }}>
          {Array.from({ length: cols }, (_, ci) => (
            <div key={ci} style={{ flex: 1, minWidth: "100px", display: "flex", gap: "3px", justifyContent: "center" }}>
              <AlignBtn idx={ci} a="left" />
              <AlignBtn idx={ci} a="center" />
              <AlignBtn idx={ci} a="right" />
            </div>
          ))}
          <div style={{ width: "28px" }} />
        </div>

        {/* Grid */}
        {cells.map((row, ri) => (
          <div key={ri} style={{ display: "flex", gap: "2px", marginBottom: "2px", alignItems: "center" }}>
            {row.map((cell, ci) => (
              <input
                key={ci}
                value={cell}
                onChange={e => updateCell(ri, ci, e.target.value)}
                placeholder={ri === 0 && hasHeader ? `Header ${ci + 1}` : `R${ri + 1}C${ci + 1}`}
                style={{
                  flex: 1, minWidth: "100px",
                  padding: "8px 10px",
                  backgroundColor: ri === 0 && hasHeader ? "var(--bg-tertiary)" : "var(--bg-secondary)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "4px",
                  color: "var(--text-primary)",
                  fontSize: "13px",
                  fontWeight: ri === 0 && hasHeader ? 600 : 400,
                  textAlign: aligns[ci],
                  outline: "none",
                }}
                onFocus={e => (e.target.style.borderColor = "var(--accent-color)")}
                onBlur={e => (e.target.style.borderColor = "var(--border-color)")}
              />
            ))}
            <button onClick={() => removeCol(cols - 1)} style={{ padding: "6px", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", opacity: cols > 1 ? 1 : 0.3 }} title="Remove last column">
              <Trash2 size={13} />
            </button>
          </div>
        ))}

        {/* Remove row button */}
        <div style={{ display: "flex", marginTop: "4px" }}>
          <button onClick={() => removeRow(rows - 1)} className="btn btn-secondary" style={{ fontSize: "12px", padding: "4px 12px", opacity: rows > 1 ? 1 : 0.3 }}>
            <Trash2 size={12} /> Remove Last Row
          </button>
        </div>
      </div>

      {/* Markdown Preview */}
      <div style={{ marginTop: "24px" }}>
        <label className="form-label">Markdown Preview</label>
        <pre style={{
          backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)",
          borderRadius: "var(--radius)", padding: "16px", fontSize: "13px",
          fontFamily: "var(--font-mono, monospace)", overflowX: "auto",
          whiteSpace: "pre-wrap", wordBreak: "break-all", color: "var(--text-primary)"
        }}>
          {toMarkdown()}
        </pre>
      </div>
    </div>
  );
}
