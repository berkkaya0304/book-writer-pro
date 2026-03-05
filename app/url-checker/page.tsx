"use client";

import { useEffect, useState } from "react";
import { getAllChapters, Chapter, getSettings } from "@/lib/localStorageUtils";
import { Link2, RefreshCw, CheckCircle2, AlertCircle, Clock, ExternalLink, Copy } from "lucide-react";

interface LinkItem {
  url: string;
  chapterTitle: string;
  anchorText: string;
  status: "pending" | "ok" | "error" | "timeout" | "cors";
  statusCode?: number;
}

function extractLinks(html: string, chapterTitle: string): LinkItem[] {
  if (typeof document === "undefined") return [];
  const div = document.createElement("div");
  div.innerHTML = html;
  const anchors = Array.from(div.querySelectorAll("a[href]"));
  return anchors
    .filter(a => {
      const href = a.getAttribute("href") || "";
      return href.startsWith("http://") || href.startsWith("https://");
    })
    .map(a => ({
      url: a.getAttribute("href") || "",
      chapterTitle,
      anchorText: a.textContent?.trim() || a.getAttribute("href") || "",
      status: "pending" as const,
    }));
}

async function checkUrl(url: string): Promise<{ status: "ok" | "error" | "timeout" | "cors"; code?: number }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch(url, { method: "HEAD", signal: controller.signal, mode: "no-cors" });
    clearTimeout(timer);
    // no-cors means we always get opaque response (status 0), treat as reachable
    if (res.type === "opaque" || res.ok) return { status: "ok", code: res.status || 200 };
    return { status: "error", code: res.status };
  } catch (err) {
    clearTimeout(timer);
    const e = err as Error;
    if (e.name === "AbortError") return { status: "timeout" };
    // CORS or network errors are treated as "cors" (site may still be alive)
    return { status: "cors" };
  }
}

const STATUS_META = {
  pending: { icon: Clock,        color: "var(--text-muted)",    label: "Pending",     bg: "var(--bg-tertiary)" },
  ok:      { icon: CheckCircle2, color: "#22c55e",              label: "OK",          bg: "rgba(34,197,94,0.1)" },
  error:   { icon: AlertCircle,  color: "var(--danger-color)",  label: "Error",       bg: "rgba(239,68,68,0.1)" },
  timeout: { icon: Clock,        color: "#f59e0b",              label: "Timeout",     bg: "rgba(245,158,11,0.1)" },
  cors:    { icon: CheckCircle2, color: "#6366f1",              label: "Likely OK*",  bg: "rgba(99,102,241,0.1)" },
};

export default function UrlCheckerPage() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [checking, setChecking] = useState(false);
  const [progress, setProgress] = useState(0);
  const [filter, setFilter] = useState<"all" | "ok" | "error" | "timeout" | "cors" | "pending">("all");

  useEffect(() => {
    const savedTheme = getSettings().theme || "dark";
    document.documentElement.className = savedTheme === "dark" ? "" : `theme-${savedTheme}`;
    const data = getAllChapters();
    setChapters(data);

    // Extract all links on load
    const allLinks: LinkItem[] = [];
    data.forEach(ch => {
      allLinks.push(...extractLinks(ch.content || "", ch.title));
    });
    // Deduplicate by URL+chapter
    const seen = new Set<string>();
    const deduped = allLinks.filter(l => {
      const key = l.url + "|" + l.chapterTitle;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    setLinks(deduped);
  }, []);

  async function handleCheck() {
    if (links.length === 0) return;
    setChecking(true);
    setProgress(0);
    const working: LinkItem[] = links.map(l => ({ ...l, status: "pending" as LinkItem["status"] }));
    setLinks([...working]);

    for (let i = 0; i < working.length; i++) {
      const result = await checkUrl(working[i].url);
      working[i] = { ...working[i], status: result.status, statusCode: result.code };
      setLinks([...working]);
      setProgress(Math.round(((i + 1) / working.length) * 100));
    }
    setChecking(false);
  }

  const filtered = filter === "all" ? links : links.filter(l => l.status === filter);
  const counts = {
    all: links.length,
    ok: links.filter(l => l.status === "ok").length,
    cors: links.filter(l => l.status === "cors").length,
    error: links.filter(l => l.status === "error").length,
    timeout: links.filter(l => l.status === "timeout").length,
    pending: links.filter(l => l.status === "pending").length,
  };

  return (
    <div className="page-container">
      <h1 className="page-title">URL Validity Checker</h1>
      <p className="page-description">Scan all links across your chapters and verify they are reachable.</p>

      {/* Controls */}
      <div className="card" style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <p style={{ margin: "0 0 4px 0", fontWeight: 600 }}>Found {links.length} unique links across {chapters.length} chapters</p>
            <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)" }}>
              * &quot;Likely OK&quot; means the site blocked CORS preflight, but is probably accessible in a browser.
            </p>
          </div>
          <button className="btn btn-primary" onClick={handleCheck} disabled={checking || links.length === 0}>
            <RefreshCw size={16} style={{ animation: checking ? "spin 1s linear infinite" : "none" }} />
            {checking ? `Checking… ${progress}%` : "Check All Links"}
          </button>
        </div>
        {checking && (
          <div style={{ marginTop: "12px", height: "6px", background: "var(--bg-tertiary)", borderRadius: "4px", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${progress}%`, background: "var(--accent-color)", transition: "width 0.3s" }} />
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
        {(["all", "ok", "cors", "error", "timeout", "pending"] as const).map(f => {
          const meta = f === "all" ? { color: "var(--text-primary)", label: "All" } : STATUS_META[f];
          return (
            <button key={f} className={`btn ${filter === f ? "btn-primary" : "btn-secondary"}`} style={{ padding: "5px 12px", fontSize: "12px" }} onClick={() => setFilter(f)}>
              {meta.label} <span style={{ marginLeft: "4px", fontWeight: 700 }}>({counts[f]})</span>
            </button>
          );
        })}
      </div>

      {/* Links Table */}
      {links.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "48px", color: "var(--text-muted)" }}>
          <Link2 size={48} style={{ margin: "0 auto 16px auto", display: "block", opacity: 0.3 }} />
          No external links found in your chapters.
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--bg-tertiary)", fontSize: "12px", color: "var(--text-muted)" }}>
                  <th style={{ padding: "10px 14px", textAlign: "left" }}>Status</th>
                  <th style={{ padding: "10px 14px", textAlign: "left" }}>URL</th>
                  <th style={{ padding: "10px 14px", textAlign: "left" }}>Chapter</th>
                  <th style={{ padding: "10px 14px", textAlign: "left" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((link, i) => {
                  const meta = STATUS_META[link.status];
                  const Icon = meta.icon;
                  return (
                    <tr key={i} style={{ borderTop: "1px solid var(--border-color)", background: i % 2 === 0 ? "transparent" : "var(--bg-secondary)" }}>
                      <td style={{ padding: "10px 14px" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: "6px", background: meta.bg, padding: "4px 10px", borderRadius: "12px", width: "fit-content", whiteSpace: "nowrap" }}>
                          <Icon size={13} color={meta.color} />
                          <span style={{ color: meta.color, fontSize: "12px", fontWeight: 600 }}>{meta.label}{link.statusCode && link.statusCode > 0 ? ` (${link.statusCode})` : ""}</span>
                        </span>
                      </td>
                      <td style={{ padding: "10px 14px", maxWidth: "320px" }}>
                        <div style={{ fontSize: "13px", color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={link.url}>
                          {link.anchorText !== link.url ? (
                            <><span style={{ fontWeight: 500 }}>{link.anchorText}</span><br /><span style={{ color: "var(--text-muted)", fontSize: "11px" }}>{link.url}</span></>
                          ) : link.url}
                        </div>
                      </td>
                      <td style={{ padding: "10px 14px", fontSize: "13px", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{link.chapterTitle}</td>
                      <td style={{ padding: "10px 14px" }}>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <a href={link.url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: "4px 8px", fontSize: "12px" }}>
                            <ExternalLink size={13} />
                          </a>
                          <button className="btn btn-secondary" style={{ padding: "4px 8px", fontSize: "12px" }} onClick={() => navigator.clipboard.writeText(link.url)}>
                            <Copy size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
