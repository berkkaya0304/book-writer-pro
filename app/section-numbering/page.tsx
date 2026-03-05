"use client";

import { useState, useEffect } from "react";
import { ListOrdered, Copy, Check, Trash2 } from "lucide-react";
import { getSettings } from "@/lib/localStorageUtils";

function parseAndNumber(text: string): string {
  const lines = text.split("\n");
  const counters: number[] = [];
  const result: string[] = [];

  for (const rawLine of lines) {
    if (!rawLine.trim()) { result.push(""); continue; }
    // Count leading spaces (each 2 spaces = 1 level)
    const indentMatch = rawLine.match(/^(\s*)/);
    const indent = indentMatch ? indentMatch[1].length : 0;
    const level = Math.floor(indent / 2);
    const label = rawLine.trim().replace(/^[\d.]+\s*/, ""); // strip existing numbers

    // Adjust counters array size
    while (counters.length <= level) counters.push(0);
    counters[level]++;
    counters.splice(level + 1); // reset deeper levels

    const number = counters.slice(0, level + 1).join(".");
    result.push(`${"  ".repeat(level)}${number} ${label}`);
  }
  return result.join("\n");
}

const EXAMPLE = `Introduction
  Background
  Motivation
  Contributions
Related Work
  Prior Approaches
  Limitations of Existing Methods
Methodology
  Problem Formulation
  Proposed Algorithm
    Core Module
    Loss Function
Experiments
  Datasets
  Results
Conclusion`;

export default function SectionNumberingPage() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const s = getSettings();
    document.documentElement.className = s.theme === "dark" ? "" : `theme-${s.theme}`;
  }, []);

  const handleInput = (val: string) => {
    setInput(val);
    setOutput(parseAndNumber(val));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Section Numbering</h1>
      <p className="page-description">
        Paste your outline (use 2 spaces per indent level). Get hierarchical numbering (1. / 1.1 / 1.1.1) instantly.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        {/* Input */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <label className="form-label" style={{ margin: 0, display: "flex", alignItems: "center", gap: "6px" }}>
              <ListOrdered size={15} /> Raw Outline
            </label>
            <button className="btn btn-secondary" style={{ padding: "4px 10px", fontSize: "12px" }} onClick={() => handleInput(EXAMPLE)}>
              Load Example
            </button>
          </div>
          <textarea
            className="input"
            value={input}
            onChange={e => handleInput(e.target.value)}
            placeholder={`Type or paste outline…\n(use 2 spaces per indent level)\n\nExample:\nIntroduction\n  Background\n  Motivation\nMethod`}
            style={{ width: "100%", minHeight: "420px", resize: "vertical", fontFamily: "var(--font-mono, monospace)", fontSize: "13px", lineHeight: 1.7 }}
          />
          <button className="btn btn-secondary" onClick={() => handleInput("")} style={{ marginTop: "8px", fontSize: "12px" }}>
            <Trash2 size={12} /> Clear
          </button>
        </div>

        {/* Output */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <label className="form-label" style={{ margin: 0 }}>Numbered Outline</label>
            {output && (
              <button className="btn btn-secondary" style={{ padding: "4px 10px", fontSize: "12px" }} onClick={handleCopy}>
                {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
              </button>
            )}
          </div>
          <pre style={{
            minHeight: "420px",
            backgroundColor: "var(--bg-secondary)",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--radius)",
            padding: "16px",
            fontSize: "13px",
            lineHeight: 1.7,
            fontFamily: "var(--font-mono, monospace)",
            color: output ? "var(--text-primary)" : "var(--text-muted)",
            overflowX: "auto",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            margin: 0,
          }}>
            {output || "Numbered sections will appear here…"}
          </pre>
        </div>
      </div>

      {/* Info */}
      <div className="card" style={{ marginTop: "20px" }}>
        <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>
          <strong style={{ color: "var(--text-primary)" }}>How it works:</strong> Each 2 spaces of indentation adds one level.
          Supports up to 4 levels (1 → 1.1 → 1.1.1 → 1.1.1.1). Existing numbers in the input are automatically stripped.
        </p>
      </div>
    </div>
  );
}
