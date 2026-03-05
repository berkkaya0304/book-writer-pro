"use client";

import { useState, useEffect } from "react";
import { Users2, Plus, Trash2, Copy, Check, X, RefreshCw } from "lucide-react";
import { getSettings, getContributionRoles, saveContributionRoles, ContributionRole } from "@/lib/localStorageUtils";

const CREDIT_ROLES = [
  { role: "Conceptualization", description: "Ideas; formulation or evolution of overarching research goals and aims." },
  { role: "Methodology", description: "Development or design of methodology; creation of models." },
  { role: "Software", description: "Programming, software development; designing computer programs; implementation." },
  { role: "Validation", description: "Verification, whether as a part of the activity or separate, of the overall replication/reproducibility of results/experiments." },
  { role: "Formal Analysis", description: "Application of statistical, mathematical, computational, or other formal techniques." },
  { role: "Investigation", description: "Conducting the research and investigation process, specifically performing the experiments." },
  { role: "Resources", description: "Provision of study materials, reagents, materials, patients, laboratory samples, animals, instrumentation, computing resources." },
  { role: "Data Curation", description: "Management activities to annotate, scrub data and maintain research data for initial use and later reuse." },
  { role: "Writing – Original Draft", description: "Preparation and/or creation of the published work by those from the original research group." },
  { role: "Writing – Review & Editing", description: "Critical review, commentary or revision – including pre- or post-publication stages." },
  { role: "Visualization", description: "Preparation, creation and/or presentation of the published work, specifically data presentation." },
  { role: "Supervision", description: "Oversight and leadership responsibility for the research activity planning and execution." },
  { role: "Project Administration", description: "Management and coordination responsibility for the research activity planning and execution." },
  { role: "Funding Acquisition", description: "Acquisition of the financial support for the project leading to this publication." },
];

export default function ContributionStatementPage() {
  const [roles, setRoles] = useState<ContributionRole[]>(() =>
    CREDIT_ROLES.map(r => ({ role: r.role, authors: [] }))
  );
  const [newAuthor, setNewAuthor] = useState<Record<string, string>>({});
  const [generated, setGenerated] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const s = getSettings();
    document.documentElement.className = s.theme === "dark" ? "" : `theme-${s.theme}`;
    const saved = getContributionRoles();
    if (saved.length > 0) {
      // Merge saved with all 14 standard roles
      const savedMap = Object.fromEntries(saved.map(r => [r.role, r.authors]));
      setRoles(CREDIT_ROLES.map(r => ({ role: r.role, authors: savedMap[r.role] || [] })));
    }
  }, []);

  const save = (updated: ContributionRole[]) => {
    setRoles(updated);
    saveContributionRoles(updated);
  };

  const addAuthor = (role: string) => {
    const name = (newAuthor[role] || "").trim();
    if (!name) return;
    const updated = roles.map(r => r.role === role ? { ...r, authors: [...r.authors, name] } : r);
    save(updated);
    setNewAuthor(prev => ({ ...prev, [role]: "" }));
  };

  const removeAuthor = (role: string, author: string) => {
    const updated = roles.map(r => r.role === role ? { ...r, authors: r.authors.filter(a => a !== author) } : r);
    save(updated);
  };

  const generate = () => {
    const lines = roles
      .filter(r => r.authors.length > 0)
      .map(r => `**${r.role}:** ${r.authors.join(", ")}.`);
    setGenerated(lines.join(" "));
  };

  const copyGenerated = () => {
    navigator.clipboard.writeText(generated);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => {
    const fresh = CREDIT_ROLES.map(r => ({ role: r.role, authors: [] }));
    save(fresh);
    setGenerated("");
  };

  const activeRoles = roles.filter(r => r.authors.length > 0).length;
  const totalAuthors = Array.from(new Set(roles.flatMap(r => r.authors)));

  return (
    <div className="page-container">
      <h1 className="page-title">Contribution Statement Builder</h1>
      <p className="page-description">
        Assign CRediT taxonomy roles to each author and generate a formatted contribution statement.
      </p>

      {/* Stats */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
        <div className="card" style={{ padding: "12px 20px", textAlign: "center", flex: 1 }}>
          <div style={{ fontSize: "22px", fontWeight: 700, color: "var(--accent-color)" }}>{activeRoles}</div>
          <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Active Roles</div>
        </div>
        <div className="card" style={{ padding: "12px 20px", textAlign: "center", flex: 1 }}>
          <div style={{ fontSize: "22px", fontWeight: 700, color: "#22c55e" }}>{totalAuthors.length}</div>
          <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Unique Authors</div>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button className="btn btn-secondary" onClick={reset}><RefreshCw size={14} /> Reset</button>
          <button className="btn btn-primary" onClick={generate}><Users2 size={14} /> Generate Statement</button>
        </div>
      </div>

      {/* Generated Output */}
      {generated && (
        <div className="card" style={{ marginBottom: "20px", borderLeft: "3px solid var(--accent-color)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--accent-color)" }}>CRediT Contribution Statement</span>
            <button className="btn btn-secondary" style={{ padding: "4px 10px", fontSize: "12px" }} onClick={copyGenerated}>
              {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
            </button>
          </div>
          <p style={{ fontSize: "13px", lineHeight: 1.8, color: "var(--text-primary)" }}>{generated}</p>
        </div>
      )}

      {/* Role Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "12px" }}>
        {CREDIT_ROLES.map(({ role, description }) => {
          const roleData = roles.find(r => r.role === role);
          const authors = roleData?.authors || [];
          return (
            <div key={role} className="card" style={{ borderLeft: authors.length > 0 ? "3px solid var(--accent-color)" : "3px solid var(--border-color)" }}>
              <div style={{ marginBottom: "8px" }}>
                <p style={{ fontWeight: 600, fontSize: "14px", marginBottom: "2px" }}>{role}</p>
                <p style={{ fontSize: "11px", color: "var(--text-muted)", lineHeight: 1.5 }}>{description}</p>
              </div>
              {/* Authors list */}
              {authors.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "8px" }}>
                  {authors.map(a => (
                    <span key={a} style={{
                      display: "flex", alignItems: "center", gap: "4px",
                      backgroundColor: "rgba(99,102,241,0.12)", color: "var(--accent-color)",
                      borderRadius: "12px", padding: "3px 10px", fontSize: "12px", fontWeight: 500,
                    }}>
                      {a}
                      <button onClick={() => removeAuthor(role, a)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {/* Add author */}
              <div style={{ display: "flex", gap: "6px" }}>
                <input
                  className="input"
                  placeholder="Author name…"
                  value={newAuthor[role] || ""}
                  onChange={e => setNewAuthor(prev => ({ ...prev, [role]: e.target.value }))}
                  onKeyDown={e => e.key === "Enter" && addAuthor(role)}
                  style={{ flex: 1, padding: "6px 10px", fontSize: "12px" }}
                />
                <button className="btn btn-secondary" style={{ padding: "6px 10px" }} onClick={() => addAuthor(role)}>
                  <Plus size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
