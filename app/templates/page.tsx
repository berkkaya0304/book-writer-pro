"use client";

import { useEffect, useState, useMemo } from "react";
import { getAllCustomTemplates, createCustomTemplate, deleteCustomTemplate, CustomTemplate, getSettings } from "@/lib/localStorageUtils";
import { LayoutTemplate, Plus, Eye, Trash2, Tag, Copy, Check } from "lucide-react";


// ─── Built-in Templates ───────────────────────────────────────────────────────
const BUILT_IN_TEMPLATES: Omit<CustomTemplate, "id" | "createdAt">[] = [
  {
    name: "API Reference",
    category: "Technical",
    description: "Standard API endpoint documentation",
    content: `<h2>Endpoint Name</h2>
<p><code>GET /api/v1/resource</code></p>

<h3>Description</h3>
<p>Brief description of what this endpoint does.</p>

<h3>Authentication</h3>
<p>Requires Bearer token in the Authorization header.</p>

<h3>Parameters</h3>
<table>
  <tr><th>Name</th><th>Type</th><th>Required</th><th>Description</th></tr>
  <tr><td>id</td><td>string</td><td>Yes</td><td>Resource identifier</td></tr>
</table>

<h3>Request Example</h3>
<pre><code>curl -H "Authorization: Bearer TOKEN" https://api.example.com/api/v1/resource/123</code></pre>

<h3>Response</h3>
<pre><code>{
  "id": "123",
  "name": "Example Resource",
  "createdAt": "2024-01-01T00:00:00Z"
}</code></pre>

<h3>Error Codes</h3>
<table>
  <tr><th>Code</th><th>Meaning</th></tr>
  <tr><td>400</td><td>Bad Request — invalid parameters</td></tr>
  <tr><td>401</td><td>Unauthorized — missing or invalid token</td></tr>
  <tr><td>404</td><td>Not Found — resource doesn't exist</td></tr>
</table>`,
    isBuiltIn: true,
  },
  {
    name: "Step-by-Step Tutorial",
    category: "Tutorial",
    description: "Hands-on tutorial with prerequisites and steps",
    content: `<h2>Tutorial: [Topic Name]</h2>
<p>In this tutorial, you will learn how to [achieve goal]. By the end, you will be able to [outcome].</p>

<h3>Prerequisites</h3>
<ul>
  <li>Knowledge of [concept A]</li>
  <li>[Tool] version X.X or later installed</li>
  <li>An account on [service]</li>
</ul>

<h3>Estimated Time</h3>
<p>30 minutes</p>

<h3>Step 1: [First Action]</h3>
<p>Start by [doing something specific]. This is important because [reason].</p>
<pre><code>command --flag value</code></pre>

<h3>Step 2: [Second Action]</h3>
<p>Next, [do something else].</p>

<h3>Step 3: Verify</h3>
<p>To confirm everything is working, run:</p>
<pre><code>verify command</code></pre>

<h3>Troubleshooting</h3>
<p><strong>Problem:</strong> Error message XYZ<br><strong>Solution:</strong> Try doing ABC instead.</p>

<h3>Next Steps</h3>
<ul>
  <li>Explore [related topic]</li>
  <li>Read the [reference documentation]</li>
</ul>`,
    isBuiltIn: true,
  },
  {
    name: "How-To Guide",
    category: "Guide",
    description: "Goal-oriented guide for a specific task",
    content: `<h2>How to [Do Something Specific]</h2>
<p>This guide shows you how to [task]. Use this approach when [scenario].</p>

<h3>What You Need</h3>
<ul>
  <li>Item or access to [thing]</li>
  <li>Permissions to [action]</li>
</ul>

<h3>Steps</h3>
<ol>
  <li><strong>[Action 1]</strong> — Do this first because [reason].</li>
  <li><strong>[Action 2]</strong> — Then do this.</li>
  <li><strong>[Action 3]</strong> — Finally, [action].</li>
</ol>

<h3>Result</h3>
<p>After completing these steps, you should see [expected result].</p>

<h3>Related</h3>
<ul>
  <li>[Link to concept explanation]</li>
  <li>[Link to troubleshooting guide]</li>
</ul>`,
    isBuiltIn: true,
  },
  {
    name: "Concept Explanation",
    category: "Conceptual",
    description: "Deep-dive explanation of a concept or technology",
    content: `<h2>[Concept Name]</h2>
<p>[One-sentence definition of the concept].</p>

<h3>Overview</h3>
<p>Explain the concept at a high level. [Concept] is used when [use case]. It was introduced because [problem it solves].</p>

<h3>How It Works</h3>
<p>Describe the mechanism in plain language. Avoid jargon unless it has been previously defined.</p>

<h3>Key Components</h3>
<ul>
  <li><strong>Component A</strong> — its role and behavior</li>
  <li><strong>Component B</strong> — its role and behavior</li>
</ul>

<h3>Example</h3>
<p>Consider this real-world analogy: [analogy that makes the concept tangible].</p>
<pre><code>// Code example demonstrating the concept
example code here</code></pre>

<h3>When to Use It</h3>
<p>Use [concept] when: [conditions]. Avoid it when: [counter-conditions].</p>

<h3>Common Misconceptions</h3>
<p>People often confuse [concept] with [other concept]. The key difference is [distinction].</p>`,
    isBuiltIn: true,
  },
  {
    name: "Release Notes",
    category: "Release",
    description: "Changelog / release notes for a version update",
    content: `<h2>Version X.Y.Z — [Date]</h2>

<h3>🆕 New Features</h3>
<ul>
  <li><strong>Feature Name</strong> — Brief description of what's new and why it's useful.</li>
  <li><strong>Another Feature</strong> — Description.</li>
</ul>

<h3>🔧 Improvements</h3>
<ul>
  <li>Improved performance of [component] by X%.</li>
  <li>Updated [dependency] to version X.X for security fixes.</li>
</ul>

<h3>🐛 Bug Fixes</h3>
<ul>
  <li>Fixed an issue where [bug description]. (#issue-number)</li>
  <li>Resolved [other bug]. (#issue-number)</li>
</ul>

<h3>⚠️ Breaking Changes</h3>
<ul>
  <li><strong>[API name]</strong> — [What changed and migration path].</li>
</ul>

<h3>Deprecations</h3>
<ul>
  <li><code>oldFunction()</code> is deprecated. Use <code>newFunction()</code> instead. Will be removed in vX+1.</li>
</ul>`,
    isBuiltIn: true,
  },
  {
    name: "Troubleshooting Guide",
    category: "Support",
    description: "Structured troubleshooting for common errors",
    content: `<h2>Troubleshooting: [Product / Feature Name]</h2>
<p>Use this guide to diagnose and resolve common issues with [product/feature].</p>

<h3>Before You Begin</h3>
<ul>
  <li>Ensure you are on version [X.X] or later.</li>
  <li>Check the [status page] to confirm there are no ongoing incidents.</li>
  <li>Clear cache and retry before escalating.</li>
</ul>

<h3>Problem: [Error or Symptom]</h3>
<p><strong>Symptoms:</strong> User sees [error message or behavior].</p>
<p><strong>Cause:</strong> This happens when [root cause].</p>
<p><strong>Solution:</strong></p>
<ol>
  <li>First, try [action].</li>
  <li>If that doesn't work, [next action].</li>
  <li>As a last resort, [escalation path].</li>
</ol>

<h3>Problem: [Another Error]</h3>
<p><strong>Symptoms:</strong> [description]</p>
<p><strong>Solution:</strong> [resolution]</p>

<h3>Collecting Logs</h3>
<p>To gather diagnostic logs, run:</p>
<pre><code>app logs --level debug --output logs.txt</code></pre>

<h3>Contact Support</h3>
<p>If none of the above resolves your issue, contact support at <a href="mailto:support@example.com">support@example.com</a> with your log file attached.</p>`,
    isBuiltIn: true,
  },
];

const CATEGORIES = ["All", "Technical", "Tutorial", "Guide", "Conceptual", "Release", "Support", "Custom"];

export default function TemplatesPage() {
  const [customTemplates, setCustomTemplates] = useState<CustomTemplate[]>([]);
  const [preview, setPreview] = useState<CustomTemplate | null>(null);
  const [category, setCategory] = useState("All");
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCategory, setNewCategory] = useState("Custom");
  const [newContent, setNewContent] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    const savedTheme = getSettings().theme || "dark";
    document.documentElement.className = savedTheme === "dark" ? "" : `theme-${savedTheme}`;
    setCustomTemplates(getAllCustomTemplates());
  }, []);

  function refresh() { setCustomTemplates(getAllCustomTemplates()); }

  function handleSaveNew() {
    if (!newName.trim() || !newContent.trim()) return;
    createCustomTemplate({ name: newName.trim(), description: newDesc.trim(), category: newCategory, content: newContent });
    setShowNew(false); setNewName(""); setNewDesc(""); setNewContent(""); setNewCategory("Custom");
    refresh();
  }

  function handleDelete(id: string) {
    deleteCustomTemplate(id);
    refresh();
    if (preview?.id === id) setPreview(null);
  }

  function handleCopy(t: CustomTemplate) {
    navigator.clipboard.writeText(t.content).then(() => {
      setCopied(t.id);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  const allTemplates: CustomTemplate[] = [
    ...BUILT_IN_TEMPLATES.map((t, i) => ({ ...t, id: `builtin-${i}`, createdAt: "" })),
    ...customTemplates,
  ];

  const filtered = useMemo(() => category === "All" ? allTemplates : allTemplates.filter(t => t.category === category), [allTemplates, category]);

  const catColor = (c: string) => {
    const colors: Record<string, string> = { Technical: "#6366f1", Tutorial: "#22c55e", Guide: "#f59e0b", Conceptual: "#3b82f6", Release: "#8b5cf6", Support: "#ef4444", Custom: "#ec4899" };
    return colors[c] || "#6366f1";
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Section Templates</h1>
      <p className="page-description">Pre-built content structures for common technical writing patterns. Copy HTML to use in your chapters.</p>

      {/* Toolbar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {CATEGORIES.map(c => (
            <button key={c} className={`btn ${category === c ? "btn-primary" : "btn-secondary"}`} style={{ padding: "5px 12px", fontSize: "12px" }} onClick={() => setCategory(c)}>
              {c}
            </button>
          ))}
        </div>
        <button className="btn btn-primary" onClick={() => setShowNew(true)}>
          <Plus size={16} /> New Template
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: preview ? "1fr 1fr" : "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
        {/* Template Grid */}
        <div style={{ display: preview ? "flex" : "contents", flexDirection: "column", gap: "12px" }}>
          {filtered.map(t => (
            <div key={t.id} className="card"
              style={{ cursor: "pointer", borderColor: preview?.id === t.id ? "var(--accent-color)" : "var(--border-color)", transition: "border-color 0.2s" }}
              onClick={() => setPreview(t === preview ? null : t)}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "14px" }}>{t.name}</div>
                  <span style={{ padding: "2px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: 600, background: `${catColor(t.category)}22`, color: catColor(t.category), marginTop: "4px", display: "inline-block" }}>
                    <Tag size={9} style={{ marginRight: "3px" }} />{t.category}
                  </span>
                </div>
                {t.isBuiltIn ? (
                  <span style={{ fontSize: "10px", color: "var(--text-muted)", background: "var(--bg-tertiary)", padding: "2px 6px", borderRadius: "6px" }}>Built-in</span>
                ) : (
                  <button className="btn btn-secondary" style={{ padding: "2px 6px", color: "var(--danger-color)", borderColor: "transparent" }} onClick={e => { e.stopPropagation(); handleDelete(t.id); }}>
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "0 0 10px 0", lineHeight: 1.4 }}>{t.description}</p>
              <div style={{ display: "flex", gap: "6px" }}>
                <button className="btn btn-secondary" style={{ fontSize: "12px", padding: "4px 10px", flex: 1, justifyContent: "center" }} onClick={e => { e.stopPropagation(); setPreview(t); }}>
                  <Eye size={13} /> Preview
                </button>
                <button className="btn btn-primary" style={{ fontSize: "12px", padding: "4px 10px", flex: 1, justifyContent: "center" }} onClick={e => { e.stopPropagation(); handleCopy(t); }}>
                  {copied === t.id ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy HTML</>}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Preview Panel */}
        {preview && (
          <div className="card" style={{ position: "sticky", top: "16px", maxHeight: "80vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <h3 style={{ margin: 0, fontSize: "15px" }}>{preview.name}</h3>
              <div style={{ display: "flex", gap: "6px" }}>
                <button className="btn btn-primary" style={{ padding: "4px 10px", fontSize: "12px" }} onClick={() => handleCopy(preview)}>
                  {copied === preview.id ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy</>}
                </button>
                <button className="btn btn-secondary" style={{ padding: "4px 8px" }} onClick={() => setPreview(null)}>✕</button>
              </div>
            </div>
            <div style={{ fontSize: "13px", lineHeight: 1.7, color: "var(--text-secondary)" }} dangerouslySetInnerHTML={{ __html: preview.content }} />
          </div>
        )}
      </div>

      {/* New Template Modal */}
      {showNew && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div className="card" style={{ width: "580px", maxWidth: "95vw", maxHeight: "90vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: "14px" }}>
            <h2 style={{ margin: 0, fontSize: "18px", display: "flex", alignItems: "center", gap: "8px" }}><LayoutTemplate size={18} /> New Template</h2>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Name</label>
              <input className="input" value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Data Model Schema" />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Category</label>
              <select className="input" value={newCategory} onChange={e => setNewCategory(e.target.value)} style={{ appearance: "none" }}>
                {["Technical", "Tutorial", "Guide", "Conceptual", "Release", "Support", "Custom"].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Description</label>
              <input className="input" value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Short description" />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">HTML Content</label>
              <textarea className="input" rows={10} value={newContent} onChange={e => setNewContent(e.target.value)} placeholder="<h2>Section Title</h2><p>Content here...</p>" style={{ fontFamily: "monospace", fontSize: "12px", resize: "vertical" }} />
            </div>
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button className="btn btn-secondary" onClick={() => setShowNew(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveNew} disabled={!newName.trim() || !newContent.trim()}>
                <Plus size={16} /> Save Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
