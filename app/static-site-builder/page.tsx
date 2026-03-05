"use client";

import { useEffect, useState } from "react";
import { Globe, Download, Settings, ShieldAlert, CheckCircle2, Box, Layers, Play } from "lucide-react";
import { getAllChapters, Chapter, getSettings } from "@/lib/localStorageUtils";
import TurndownService from "turndown";

export default function StaticSiteBuilderPage() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(false);
  const [framework, setFramework] = useState<"nextra" | "docusaurus">("nextra");
  
  // Site Metadata
  const [siteName, setSiteName] = useState("My Technical Book");
  const [authorName, setAuthorName] = useState("");
  const [description, setDescription] = useState("A comprehensive guide.");
  const [githubUrl, setGithubUrl] = useState("https://github.com/myusername/my-book");

  useEffect(() => {
    const savedTheme = getSettings().theme || 'dark';
    document.documentElement.className = savedTheme === 'dark' ? '' : `theme-${savedTheme}`;
    setChapters(getAllChapters());
    
    const savedSiteName = localStorage.getItem("current_book_title");
    if (savedSiteName) setSiteName(savedSiteName);
  }, []);

  const downloadBinaryBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleGenerateZip = async () => {
    setLoading(true);
    try {
      let JSZipModule: any;
      try {
        JSZipModule = await import('jszip');
      } catch (e) {
        alert("JSZip not installed. Run: npm install jszip");
        return;
      }

      const JSZip = JSZipModule.default || JSZipModule;
      const zip = new JSZip();
      const turndownService = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });

      if (framework === "nextra") {
        await generateNextraZip(zip, turndownService);
      } else {
        await generateDocusaurusZip(zip, turndownService);
      }

      const blob = await zip.generateAsync({ type: 'blob' });
      downloadBinaryBlob(blob, `${siteName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-${framework}.zip`);

    } catch (err: any) {
      console.error(err);
      alert("Failed to generate site bundle: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateNextraZip = async (zip: any, turndownService: TurndownService) => {
    // 1. package.json
    zip.file("package.json", JSON.stringify({
      name: siteName.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase(),
      version: "1.0.0",
      description: description,
      scripts: {
        dev: "next dev",
        build: "next build",
        start: "next start"
      },
      dependencies: {
        next: "^14.2.0",
        react: "^18.3.1",
        "react-dom": "^18.3.1",
        nextra: "^2.13.4",
        "nextra-theme-docs": "^2.13.4"
      }
    }, null, 2));

    // 2. next.config.js
    zip.file("next.config.js", `const withNextra = require('nextra')({
  theme: 'nextra-theme-docs',
  themeConfig: './theme.config.jsx',
})
module.exports = withNextra()`);

    // 3. theme.config.jsx
    zip.file("theme.config.jsx", `export default {
  logo: <span><b>${siteName}</b></span>,
  project: {
    link: '${githubUrl}',
  },
  docsRepositoryBase: '${githubUrl}',
  footer: {
    text: '${siteName} © ${new Date().getFullYear()} ${authorName}',
  },
}`);

    // 4. Pages Folder
    const pages = zip.folder("pages");
    
    const metaJson: Record<string, string> = { "index": "Introduction" };
    pages.file("index.mdx", `# ${siteName}\n\n${description}\n\n*By ${authorName}*\n\nWelcome to the documentation site for this book. Use the sidebar to navigate through the chapters.`);

    chapters.forEach((c) => {
      const slug = c.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase() || `chapter-${c.id}`;
      metaJson[slug] = c.title;
      const mkd = turndownService.turndown(c.content || 'No content yet.');
      pages.file(`${slug}.mdx`, `# ${c.title}\n\n${mkd}`);
    });

    pages.file("_meta.json", JSON.stringify(metaJson, null, 2));
  };

  const generateDocusaurusZip = async (zip: any, turndownService: TurndownService) => {
    // 1. package.json
    zip.file("package.json", JSON.stringify({
      name: siteName.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase(),
      version: "1.0.0",
      description: description,
      scripts: {
        start: "docusaurus start",
        build: "docusaurus build",
        swizzle: "docusaurus swizzle",
        deploy: "docusaurus deploy",
        clear: "docusaurus clear",
        serve: "docusaurus serve"
      },
      dependencies: {
        "@docusaurus/core": "3.3.2",
        "@docusaurus/preset-classic": "3.3.2",
        "@mdx-js/react": "^3.0.0",
        "clsx": "^2.0.0",
        "prism-react-renderer": "^2.3.0",
        "react": "^18.2.0",
        "react-dom": "^18.2.0"
      },
      browserslist: {
        production: [">0.5%", "not dead", "not op_mini all"],
        development: ["last 1 chrome version", "last 1 firefox version", "last 1 safari version"]
      }
    }, null, 2));

    // 2. docusaurus.config.js
    zip.file("docusaurus.config.js", `module.exports = {
  title: '${siteName}',
  tagline: '${description}',
  url: 'https://example.com',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',
  organizationName: '${authorName.replace(/\\s+/g, '') || 'Author'}', // Usually your GitHub org/user name.
  projectName: '${siteName.replace(/\\s+/g, '-')}', // Usually your repo name.

  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          routeBasePath: '/', // Serve the docs at the site's root
        },
        blog: false, // Optional: disable the blog plugin
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      },
    ],
  ],

  themeConfig: {
    navbar: {
      title: '${siteName}',
      items: [
        {
          type: 'doc',
          docId: 'intro',
          position: 'left',
          label: 'Book Contents',
        },
        {
          href: '${githubUrl}',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      copyright: \`Copyright © \${new Date().getFullYear()} \${siteName}. Built with Docusaurus.\`,
    },
  },
};`);

    // 3. sidebars.js
    zip.file("sidebars.js", `module.exports = {
  tutorialSidebar: [{type: 'autogenerated', dirName: '.'}],
};`);

    // 4. Docs Folder
    const docs = zip.folder("docs");
    docs.file("intro.md", `---
sidebar_position: 1
---

# Introduction

Welcome to **${siteName}**.

${description}

By *${authorName}*
`);

    chapters.forEach((c, i) => {
      const slug = c.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase() || `chapter-${c.id}`;
      const mkd = turndownService.turndown(c.content || 'No content yet.');
      docs.file(`${slug}.md`, `---
sidebar_position: ${i + 2}
title: ${c.title}
---

# ${c.title}

${mkd}`);
    });

    // 5. Barebones src
    const srcCss = zip.folder("src")?.folder("css");
    if (srcCss) {
        srcCss.file("custom.css", `/* Custom CSS for Docusaurus */\n:root {\n  --ifm-color-primary: #2e8555;\n  --ifm-color-primary-dark: #29784c;\n  --ifm-color-primary-darker: #277148;\n  --ifm-color-primary-darkest: #205d3b;\n  --ifm-color-primary-light: #33925d;\n  --ifm-color-primary-lighter: #359962;\n  --ifm-color-primary-lightest: #3cad6e;\n}`);
    }
  };

  return (
    <div className="page-container">
      <h1 className="page-title"><Globe size={28} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} /> Static Site Builder</h1>
      <p className="page-description">Generate a complete, deployable static documentation website (Nextra or Docusaurus) from your manuscript.</p>

      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "24px" }}>
        
        {/* Settings Panel */}
        <div className="card">
          <h2 style={{ fontSize: "16px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
             <Settings size={18} color="var(--accent-color)" /> Project Configuration
          </h2>

          <div style={{ display: "flex", gap: "16px", marginBottom: "24px" }}>
            <div 
                style={{ flex: 1, padding: "16px", border: `2px solid ${framework === 'nextra' ? 'var(--accent-color)' : 'var(--border-color)'}`, borderRadius: "var(--radius-lg)", cursor: "pointer", display: "flex", flexDirection: "column", gap: "8px", background: framework === 'nextra' ? "var(--bg-secondary)" : "transparent" }}
                onClick={() => setFramework('nextra')}
            >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 700 }}>
                        <Box size={20} color={framework === 'nextra' ? 'var(--accent-color)' : 'var(--text-muted)'} /> Nextra
                    </div>
                    {framework === "nextra" && <CheckCircle2 size={18} color="var(--accent-color)" />}
                </div>
                <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>Lightweight framework on top of Next.js. Markdown-centric.</p>
            </div>
            
            <div 
                style={{ flex: 1, padding: "16px", border: `2px solid ${framework === 'docusaurus' ? '#2e8555' : 'var(--border-color)'}`, borderRadius: "var(--radius-lg)", cursor: "pointer", display: "flex", flexDirection: "column", gap: "8px", background: framework === 'docusaurus' ? "rgba(46, 133, 85, 0.05)" : "transparent" }}
                onClick={() => setFramework('docusaurus')}
            >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, color: framework === 'docusaurus' ? '#2e8555' : 'inherit' }}>
                        <Layers size={20} color={framework === 'docusaurus' ? '#2e8555' : 'var(--text-muted)'} /> Docusaurus
                    </div>
                    {framework === "docusaurus" && <CheckCircle2 size={18} color="#2e8555" />}
                </div>
                <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>Meta's robust framework. Great for deep technical docs.</p>
            </div>
          </div>

          <div className="form-group">
             <label className="form-label">Site / Book Title</label>
             <input type="text" className="input" value={siteName} onChange={(e) => setSiteName(e.target.value)} />
          </div>

          <div style={{ display: "flex", gap: "16px" }}>
            <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Author Name</label>
                <input type="text" className="input" value={authorName} onChange={(e) => setAuthorName(e.target.value)} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">GitHub Repository URL</label>
                <input type="text" className="input" placeholder="https://github.com/..." value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} />
            </div>
          </div>

          <div className="form-group">
             <label className="form-label">Short Description</label>
             <textarea className="input" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

        </div>

        {/* Action Panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div className="card" style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", gap: "16px" }}>
                <Globe size={48} color={framework === 'nextra' ? "var(--accent-color)" : "#2e8555"} style={{ opacity: 0.8 }} />
                <div>
                   <h3 style={{ fontSize: "18px", marginBottom: "8px", fontWeight: 600 }}>Ready to Build</h3>
                   <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>This will generate a ZIP containing <strong>{chapters.length}</strong> chapters converted to Markdown, along with all necessary configuration files to run a full {framework === 'nextra' ? 'Nextra' : 'Docusaurus'} site.</p>
                </div>
                
                <button 
                  className="btn btn-primary" 
                  style={{ width: "100%", justifyContent: "center", padding: "12px 24px", fontSize: "15px", backgroundColor: framework === 'docusaurus' ? '#2e8555' : 'var(--accent-color)', borderColor: framework === 'docusaurus' ? '#2e8555' : 'var(--accent-color)' }}
                  onClick={handleGenerateZip}
                  disabled={loading || chapters.length === 0}
                >
                   {loading ? "Generating..." : <><Download size={18} /> Download Project Bundle</>}
                </button>
            </div>

            <div className="card" style={{ backgroundColor: "var(--bg-tertiary)", borderColor: "transparent" }}>
               <h3 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Play size={14} /> Next Steps After Download
               </h3>
               <ol style={{ paddingLeft: "20px", margin: 0, fontSize: "12px", color: "var(--text-secondary)", display: "flex", flexDirection: "column", gap: "8px" }}>
                   <li>Extract the downloaded <code>.zip</code> file to a folder.</li>
                   <li>Open your terminal and <code>cd</code> into the folder.</li>
                   <li>Run <code>npm install</code> to install dependencies.</li>
                   <li>Run <code>npm run dev</code> (or <code>npm run start</code> for Docusaurus) to start the local server.</li>
                   <li>Deploy the folder using Vercel, Netlify, or GitHub Pages.</li>
               </ol>
            </div>
        </div>

      </div>
    </div>
  );
}
