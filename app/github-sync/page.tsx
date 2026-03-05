"use client";

import { useState, useEffect } from "react";
import { GitPullRequestDraft, Github, Save, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { getAllChapters, Chapter, getSettings } from "@/lib/localStorageUtils";
import TurndownService from "turndown";

export default function GitHubSyncPage() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [token, setToken] = useState("");
  const [repo, setRepo] = useState(""); // e.g. "username/repo"
  const [branch, setBranch] = useState("main");
  const [commitMessage, setCommitMessage] = useState("Update manuscript via Book Writer");
  
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<{type: "info"|"success"|"error", message: string}[]>([]);

  useEffect(() => {
    const savedTheme = getSettings().theme || "dark";
    document.documentElement.className = savedTheme === "dark" ? "" : `theme-${savedTheme}`;
    setChapters(getAllChapters());

    // Load saved github settings if available
    const savedGithub = localStorage.getItem("github_sync_settings");
    if (savedGithub) {
      try {
        const parsed = JSON.parse(savedGithub);
        if (parsed.token) setToken(parsed.token);
        if (parsed.repo) setRepo(parsed.repo);
        if (parsed.branch) setBranch(parsed.branch);
      } catch (e) {
        console.error("Failed to parse github settings", e);
      }
    }
  }, []);

  const addLog = (type: "info"|"success"|"error", message: string) => {
    setLogs(prev => [...prev, { type, message }]);
  };

  const saveSettings = () => {
    localStorage.setItem("github_sync_settings", JSON.stringify({ token, repo, branch }));
    addLog("success", "Settings saved locally.");
  };

  const handleSync = async () => {
    if (!token || !repo) {
       addLog("error", "GitHub Token and Repository are required.");
       return;
    }

    setLoading(true);
    setLogs([]);
    addLog("info", `Starting sync to ${repo}@${branch}...`);
    
    const turndownService = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });

    try {
      for (const chapter of chapters) {
        if (!chapter.content) continue;

        const slug = chapter.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
        const filePath = `manuscript/${slug}.md`;
        const contentMarkdown = turndownService.turndown(chapter.content);
        
        // Add frontmatter
        const finalContent = `---
title: ${chapter.title}
description: ${chapter.outline || ""}
status: ${chapter.status || "Draft"}
---

# ${chapter.title}

${contentMarkdown}
`;

        const encodedContent = btoa(unescape(encodeURIComponent(finalContent)));

        // 1. Check if file exists to get its SHA
        let sha = null;
        try {
          const checkRes = await fetch(`https://api.github.com/repos/${repo}/contents/${filePath}?ref=${branch}`, {
            headers: {
              "Authorization": `token ${token}`,
              "Accept": "application/vnd.github.v3+json"
            }
          });
          if (checkRes.ok) {
            const fileData = await checkRes.json();
            sha = fileData.sha;
          }
        } catch (e) {
          // File might not exist, which is fine
        }

        // 2. Create or Update file
        const body: any = {
          message: `${commitMessage} - ${chapter.title}`,
          content: encodedContent,
          branch: branch
        };

        if (sha) {
          body.sha = sha;
        }

        const updateRes = await fetch(`https://api.github.com/repos/${repo}/contents/${filePath}`, {
          method: "PUT",
          headers: {
            "Authorization": `token ${token}`,
            "Accept": "application/vnd.github.v3+json",
            "Content-Type": "application/json"
          },
          body: JSON.stringify(body)
        });

        if (!updateRes.ok) {
          const errorData = await updateRes.json();
          addLog("error", `Failed syncing ${chapter.title}: ${errorData.message}`);
        } else {
          addLog("success", `Successfully synced ${chapter.title} -> ${filePath}`);
        }
      }
      addLog("success", "Sync process completed.");

    } catch (err: any) {
       addLog("error", `Network or validation error: ${err.message}`);
    } finally {
       setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <h1 className="page-title"><Github size={24} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} /> GitHub Sync</h1>
      <p className="page-description">Automatically sync your manuscript chapters to a GitHub repository as Markdown files.</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        
        <div className="card">
          <h2 style={{ fontSize: "16px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
             <GitPullRequestDraft size={18} color="var(--accent-color)" /> Configuration
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Personal Access Token (PAT) <span style={{ color: "var(--danger-color)" }}>*</span></label>
              <input 
                type="password" 
                className="input" 
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx" 
                value={token} 
                onChange={e => setToken(e.target.value)} 
              />
              <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>Requires 'repo' scope. Tokens are stored locally in your browser.</p>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Repository <span style={{ color: "var(--danger-color)" }}>*</span></label>
              <input 
                type="text" 
                className="input" 
                placeholder="username/repository-name" 
                value={repo} 
                onChange={e => setRepo(e.target.value)} 
              />
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <div className="form-group" style={{ margin: 0, flex: 1 }}>
                <label className="form-label">Branch</label>
                <input 
                  type="text" 
                  className="input" 
                  placeholder="main" 
                  value={branch} 
                  onChange={e => setBranch(e.target.value)} 
                />
              </div>
              <div className="form-group" style={{ margin: 0, flex: 2 }}>
                <label className="form-label">Commit Message Prefix</label>
                <input 
                  type="text" 
                  className="input" 
                  value={commitMessage} 
                  onChange={e => setCommitMessage(e.target.value)} 
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
              <button className="btn btn-secondary" onClick={saveSettings} style={{ flex: 1, justifyContent: "center" }}>
                <Save size={16} /> Save Config
              </button>
              <button className="btn btn-primary" onClick={handleSync} disabled={loading} style={{ flex: 2, justifyContent: "center", backgroundColor: "#2ea043", borderColor: "#2ea043", color: "white" }}>
                {loading ? <RefreshCw size={16} className="spin" /> : <Github size={16} />} 
                {loading ? "Syncing..." : "Push to GitHub"}
              </button>
            </div>
          </div>
        </div>

        <div className="card">
           <h2 style={{ fontSize: "16px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
             <RefreshCw size={18} color="var(--text-secondary)" /> Sync Logs
          </h2>
          
          <div style={{ 
            backgroundColor: "var(--bg-tertiary)", 
            borderRadius: "var(--radius-md)", 
            padding: "16px", 
            minHeight: "300px",
            maxHeight: "400px",
            overflowY: "auto",
            fontFamily: "var(--font-mono)",
            fontSize: "12px",
            display: "flex",
            flexDirection: "column",
            gap: "8px"
           }}>
             {logs.length === 0 ? (
               <div style={{ color: "var(--text-muted)", textAlign: "center", marginTop: "auto", marginBottom: "auto" }}>
                 Ready to sync {chapters.filter(c => c.content).length} chapters.
               </div>
             ) : (
               logs.map((log, index) => (
                 <div key={index} style={{ 
                   display: "flex", 
                   alignItems: "flex-start", 
                   gap: "8px", 
                   color: log.type === "error" ? "var(--danger-color)" : log.type === "success" ? "#2ea043" : "var(--text-primary)" 
                 }}>
                    {log.type === "error" ? <AlertCircle size={14} style={{ marginTop: "2px", flexShrink: 0 }} /> : 
                     log.type === "success" ? <CheckCircle2 size={14} style={{ marginTop: "2px", flexShrink: 0 }} /> : 
                     <span style={{ opacity: 0.5 }}>•</span>}
                    <span>{log.message}</span>
                 </div>
               ))
             )}
          </div>
        </div>

      </div>
    </div>
  );
}
