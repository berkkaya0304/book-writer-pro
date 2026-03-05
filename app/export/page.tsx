"use client";

import { useEffect, useState } from "react";
import { Download, FileText, CheckCircle2, FileArchive, Settings2, Linkedin, FileJson, FileImage, BookCopy, Globe, FileCode, FolderOpen, Building2, FileType } from "lucide-react";
import { getAllChapters, Chapter, getSettings, getAllFootnotes, getAllAbbreviations } from "@/lib/localStorageUtils";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";
import TurndownService from "turndown";
import { jsPDF } from "jspdf";

export default function ExportPage() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapterIds, setSelectedChapterIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Advanced DOCX Options
  const [includeTitlePage, setIncludeTitlePage] = useState(true);
  const [authorName, setAuthorName] = useState("");
  const [bookTitle, setBookTitle] = useState("My Book");
  const [includeDedication, setIncludeDedication] = useState(false);
  const [dedicationText, setDedicationText] = useState("Dedicated to...");
  
  // PDF Cover Options
  const [pdfSubtitle, setPdfSubtitle] = useState("");
  const [pdfCoverColor, setPdfCoverColor] = useState("#1e1b4b");
  const [pdfAccentColor, setPdfAccentColor] = useState("#6366f1");
  
  // Advanced Options Toggle
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    fetchChapters();
    // Apply theme
    const savedTheme = getSettings().theme || 'dark';
    document.documentElement.className = savedTheme === 'dark' ? '' : `theme-${savedTheme}`;
  }, []);

  const fetchChapters = () => {
    try {
      const data = getAllChapters();
      setChapters(data);
      setSelectedChapterIds(data.map(c => c.id));
    } catch(e) { console.error(e); } finally {
      setLoading(false);
    }
  };

  const handleExportText = () => {
    const chaptersToExport = chapters.filter(c => selectedChapterIds.includes(c.id));
    let content = `${bookTitle.toUpperCase()}\n\n`;
    if (authorName) content += `By ${authorName}\n\n`;
    
    chaptersToExport.forEach((c) => {
      content += `=== ${c.title} ===\n\n`;
      const tempDiv = window.document.createElement("div");
      tempDiv.innerHTML = c.content || "";
      content += tempDiv.textContent || tempDiv.innerText || "No content written yet.";
      content += `\n\n\n`;
    });

    downloadBlob(content, `${bookTitle.replace(/\s+/g, '_')}.txt`, "text/plain");
  };

  const handleExportMarkdown = () => {
    const chaptersToExport = chapters.filter(c => selectedChapterIds.includes(c.id));
    const turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced'
    });

    let content = `# ${bookTitle}\n\n`;
    if (authorName) content += `> By ${authorName}\n\n`;
    
    chaptersToExport.forEach((c) => {
      content += `## ${c.title}\n\n`;
      content += c.content ? turndownService.turndown(c.content) : "*No content written yet.*";
      content += `\n\n---\n\n`;
    });

    downloadBlob(content, `${bookTitle.replace(/\s+/g, '_')}.md`, "text/markdown");
  };
  
  const handleExportLinkedIn = () => {
    const chaptersToExport = chapters.filter(c => selectedChapterIds.includes(c.id));
    let content = `📰 **${bookTitle}**\n\n`;
    if (authorName) content += `*Author: ${authorName}*\n\n`;
    content += `Here is the latest from my new book project:\n\n---\n\n`;

    const turndownService = new TurndownService({ headingStyle: 'atx' });

    chaptersToExport.forEach((c) => {
      content += `### ${c.title}\n\n`;
      let textContent = c.content ? turndownService.turndown(c.content) : "";
      
      // LinkedIn doesn't support highly nested markdown, keep it simple
      content += textContent;
      content += `\n\n---\n\n`;
    });
    
    content += `\n*Enjoyed this piece? Subscribe for more updates!*`;

    downloadBlob(content, `${bookTitle.replace(/\s+/g, '_')}_LinkedIn.md`, "text/markdown");
    alert("Downloaded as Markdown tailored for LinkedIn Newsletters. You can copy the contents of this file and paste it into the LinkedIn article editor.");
  };

  const handleExportJson = () => {
     const chaptersToExport = chapters.filter(c => selectedChapterIds.includes(c.id));
     const turndownService = new TurndownService({ headingStyle: 'atx' });

     const exportData = {
       bookTitle,
       authorName,
       chapters: chaptersToExport.map(c => ({
         title: c.title,
         status: c.status || 'Idea',
         outline: c.outline,
         htmlContent: c.content,
         markdownContent: c.content ? turndownService.turndown(c.content) : ""
       }))
     };
     
     downloadBlob(JSON.stringify(exportData, null, 2), `${bookTitle.replace(/\s+/g, '_')}.json`, "application/json");
  };

  const handleExportDocx = async () => {
    const chaptersToExport = chapters.filter(c => selectedChapterIds.includes(c.id));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const docChildren: any[] = [];
    
    // 1. Title Page
    if (includeTitlePage) {
      docChildren.push(
        new Paragraph({
          text: bookTitle,
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER,
          spacing: { before: 2000, after: 400 }
        })
      );
      
      if (authorName) {
        docChildren.push(
          new Paragraph({
            text: `By ${authorName}`,
            heading: HeadingLevel.HEADING_2,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 }
          })
        );
      }
      
      // Add page break after title page
      docChildren.push(new Paragraph({ pageBreakBefore: true }));
    }
    
    // 2. Dedication Page
    if (includeDedication && dedicationText) {
      docChildren.push(
        new Paragraph({
          text: "Dedication",
          heading: HeadingLevel.HEADING_2,
          alignment: AlignmentType.CENTER,
          spacing: { before: 1000, after: 400 }
        })
      );
      docChildren.push(
        new Paragraph({
          children: [
            new TextRun({
              text: dedicationText,
              italics: true
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 }
        })
      );
      docChildren.push(new Paragraph({ pageBreakBefore: true }));
    }
    
    // 3. Chapters
    chaptersToExport.forEach((c, index) => {
      // Chapter Title
      docChildren.push(
        new Paragraph({
          text: c.title,
          heading: HeadingLevel.HEADING_1,
          pageBreakBefore: index !== 0 || includeTitlePage || includeDedication, // Break unless it's the very first page of the whole doc
          spacing: { after: 200 }
        })
      );
      
      // Basic HTML parsing for DOCX
      const tempDiv = window.document.createElement("div");
      tempDiv.innerHTML = c.content || "";
      
      const childNodes = Array.from(tempDiv.childNodes);
      
      if (childNodes.length === 0) {
        docChildren.push(new Paragraph({ text: "No content written yet." }));
      } else {
        childNodes.forEach(node => {
          if (node.nodeName === 'P' || node.nodeName === '#text') {
            const textContent = node.textContent?.trim();
            if (textContent) {
              docChildren.push(
                new Paragraph({
                  children: [new TextRun({ text: textContent, size: 24 /* 12pt */ })],
                  spacing: { after: 200 }
                })
              );
            }
          } else if (node.nodeName.match(/^H[1-6]$/)) {
            const hLevel = parseInt(node.nodeName.replace('H', ''));
            const textContent = node.textContent?.trim();
            if (textContent) {
              docChildren.push(
                new Paragraph({
                  text: textContent,
                  heading: (HeadingLevel as Record<string, string>)[`HEADING_${hLevel}`] as typeof HeadingLevel[keyof typeof HeadingLevel] || HeadingLevel.HEADING_2,
                  spacing: { before: 200, after: 200 }
                })
              );
            }
          } else if (node.nodeName === 'BLOCKQUOTE') {
            const textContent = node.textContent?.trim();
             if (textContent) {
              docChildren.push(
                new Paragraph({
                  children: [new TextRun({ text: textContent, size: 24, italics: true })],
                  indent: { left: 720 }, // 0.5 inch indent
                  spacing: { after: 200 }
                })
              );
            }
          } else if (node.nodeName === 'UL' || node.nodeName === 'OL') {
             const items = Array.from(node.childNodes).filter(n => n.nodeName === 'LI');
             items.forEach(item => {
                const textContent = item.textContent?.trim();
                if (textContent) {
                  docChildren.push(
                    new Paragraph({
                      text: textContent,
                      bullet: { level: 0 },
                      spacing: { after: 100 }
                    })
                  );
                }
             });
          }
        });
      }
    });

    const doc = new Document({
      creator: authorName || "Book Writer App",
      title: bookTitle,
      description: "A book exported from the Book Writer App",
      sections: [{
        properties: {},
        children: docChildren
      }]
    });

    try {
       const blob = await Packer.toBlob(doc);
       const url = URL.createObjectURL(blob);
       const a = document.createElement("a");
       a.href = url;
       a.download = `${bookTitle.replace(/\s+/g, '_')}.docx`;
       document.body.appendChild(a);
       a.click();
       document.body.removeChild(a);
       URL.revokeObjectURL(url);
    } catch(err) {
       console.error("Failed to generate DOCX", err);
       alert("Failed to export Word document.");
    }
  };

  const downloadBlob = (content: string, filename: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportLaTeX = () => {
    const chaptersToExport = chapters.filter(c => selectedChapterIds.includes(c.id));
    const allFootnotes = getAllFootnotes();
    const allAbbreviations = getAllAbbreviations();

    const escLaTeX = (str: string) =>
      str
        .replace(/\\/g, "\\textbackslash{}")
        .replace(/&/g, "\\&")
        .replace(/%/g, "\\%")
        .replace(/\$/g, "\\$")
        .replace(/#/g, "\\#")
        .replace(/_/g, "\\_")
        .replace(/\{/g, "\\{")
        .replace(/\}/g, "\\}")
        .replace(/~/g, "\\textasciitilde{}")
        .replace(/\^/g, "\\textasciicircum{}");

    const htmlToLatex = (html: string, chapterOrder: number) => {
      const tempDiv = window.document.createElement("div");
      tempDiv.innerHTML = html;
      let result = "";
      let eqCounter = 0;

      const processNode = (node: Node): string => {
        if (node.nodeType === Node.TEXT_NODE) {
          return escLaTeX(node.textContent || "");
        }
        const el = node as HTMLElement;
        const tag = el.tagName?.toLowerCase();
        const children = Array.from(el.childNodes).map(processNode).join("");

        switch (tag) {
          case "h1": return `\\section{${escLaTeX(el.textContent || "")}}\n`;
          case "h2": return `\\subsection{${escLaTeX(el.textContent || "")}}\n`;
          case "h3": return `\\subsubsection{${escLaTeX(el.textContent || "")}}\n`;
          case "p": return children ? `${children}\n\n` : "";
          case "strong": case "b": return `\\textbf{${children}}`;
          case "em": case "i": return `\\textit{${children}}`;
          case "u": return `\\underline{${children}}`;
          case "code": return `\\texttt{${escLaTeX(el.textContent || "")}}`;
          case "pre": {
            const codeEl = el.querySelector("code");
            const lang = codeEl?.className?.replace("language-", "") || "";
            const code = codeEl?.textContent || el.textContent || "";
            return `\n\\begin{lstlisting}[language=${lang || "text"}]\n${code}\n\\end{lstlisting}\n\n`;
          }
          case "blockquote": return `\n\\begin{quote}\n${children}\\end{quote}\n\n`;
          case "ul": return `\n\\begin{itemize}\n${children}\\end{itemize}\n\n`;
          case "ol": return `\n\\begin{enumerate}\n${children}\\end{enumerate}\n\n`;
          case "li": return `  \\item ${children}\n`;
          case "div": {
            const dataType = el.getAttribute("data-type");
            if (dataType === "math") {
              eqCounter++;
              const formula = el.getAttribute("data-formula") || el.textContent?.replace(/\$\$/g, "") || "";
              return `\n\\begin{equation}\n${formula} \\tag{${chapterOrder}.${eqCounter}}\n\\end{equation}\n\n`;
            }
            if (dataType === "mermaid") {
              return `\n% [Diagram: ${el.textContent?.trim() || "Mermaid diagram"}]\n% (Diagrams require manual conversion to TikZ)\n\n`;
            }
            const adType = el.getAttribute("data-type");
            if (["note", "tip", "warning", "danger"].includes(adType || "")) {
              return `\n\\begin{quote}\n\\textbf{${(adType || "note").toUpperCase()}:} ${children}\\end{quote}\n\n`;
            }
            return children;
          }
          default: return children || escLaTeX(el.textContent || "");
        }
      };

      Array.from(tempDiv.childNodes).forEach(n => { result += processNode(n); });
      return result;
    };

    const chapSections = chaptersToExport.map((c, i) => {
      const chFns = allFootnotes.filter(f => f.chapterId === c.id);
      const latexContent = htmlToLatex(c.content || "", c.order || (i + 1));
      const fnBlock = chFns.length > 0
        ? `\n\\begin{footnotesize}\n\\textbf{Footnotes:}\n\\begin{enumerate}\n${chFns.map(f => `  \\item ${escLaTeX(f.text)}`).join("\n")}\n\\end{enumerate}\n\\end{footnotesize}\n`
        : "";
      return `\\section{${escLaTeX(c.title)}}\n\n${latexContent}${fnBlock}`;
    }).join("\n\\newpage\n");

    const abbrBlock = allAbbreviations.length > 0
      ? `\\section*{List of Abbreviations}\n\\begin{description}\n${allAbbreviations.map(a => `  \\item[${escLaTeX(a.term)}] ${escLaTeX(a.definition)}`).join("\n")}\n\\end{description}\n\n\\newpage\n\n`
      : "";

    const tex = `\\documentclass[12pt,a4paper]{article}

% --- Packages ---
\\usepackage[T1]{fontenc}
\\usepackage[utf8]{inputenc}
\\usepackage{lmodern}
\\usepackage{geometry}
\\usepackage{setspace}
\\usepackage{hyperref}
\\usepackage{listings}
\\usepackage{amsmath}
\\usepackage{amssymb}
\\usepackage{graphicx}
\\usepackage{xcolor}

\\geometry{margin=2.5cm}
\\setstretch{1.5}

\\lstset{
  basicstyle=\\ttfamily\\small,
  breaklines=true,
  frame=single,
  backgroundcolor=\\color{gray!10},
  keywordstyle=\\color{blue},
  commentstyle=\\color{gray},
  stringstyle=\\color{orange},
}

\\hypersetup{
  colorlinks=true,
  linkcolor=blue,
  urlcolor=blue,
}

% --- Title ---
\\title{${escLaTeX(bookTitle)}}
\\author{${escLaTeX(authorName || "Author")}}
\\date{\\today}

\\begin{document}

\\maketitle
\\tableofcontents
\\newpage

${abbrBlock}${chapSections}

\\end{document}
`;

    downloadBlob(tex, `${bookTitle.replace(/\s+/g, "_")}.tex`, "text/plain");
  };


  const handleExportGitbook = async () => {
    const chaptersToExport = chapters.filter(c => selectedChapterIds.includes(c.id));
    const turndownService = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });
    let JSZipModule: { default: new () => { folder: (name: string) => { file: (name: string, content: string) => void } | null; file: (name: string, content: string) => void; generateAsync: (opts: { type: string }) => Promise<Blob> } };
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      JSZipModule = await import('jszip') as any;
    } catch {
      alert("JSZip not installed. Run: npm install jszip"); return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const zip = new (JSZipModule as any).default();
    const docsFolder = zip.folder("docs");
    const sidebarItems = chaptersToExport.map((c: Chapter) => `'${c.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}'`).join(',\n    ');
    docsFolder.file("index.md", `---\ntitle: ${bookTitle}\nslug: /\n---\n\n# ${bookTitle}\n\n${authorName ? `*By ${authorName}*\n\n` : ''}Welcome to this documentation.\n`);
    chaptersToExport.forEach((c: Chapter) => {
      const slug = c.title.replace(/[^a-z0-9]/gi, '-').toLowerCase();
      const md = c.content ? turndownService.turndown(c.content) : '*No content yet.*';
      docsFolder.file(`${slug}.md`, `---\ntitle: ${c.title}\nid: ${slug}\n---\n\n${md}\n`);
    });
    zip.file("docusaurus.config.js", `// @ts-check\nconst config = {\n  title: '${bookTitle.replace(/'/g, "\\'")}',\n  tagline: '${authorName ? `By ${authorName.replace(/'/g, "\\'")}` : 'Documentation'}',\n  url: 'https://your-site.com',\n  baseUrl: '/',\n  presets: [['classic', { docs: { sidebarPath: require.resolve('./sidebars.js'), routeBasePath: '/' } }]],\n};\nmodule.exports = config;\n`);
    zip.file("sidebars.js", `module.exports = {\n  tutorialSidebar: [\n    'index',\n    ${sidebarItems}\n  ],\n};\n`);
    zip.file("README.md", `# ${bookTitle}\n\nGenerated by Book Writer. Import the docs/ folder into your Docusaurus or GitBook project.\n`);
    const blob = await zip.generateAsync({ type: 'blob' });
    downloadBinaryBlob(blob, `${bookTitle.replace(/\s+/g, '_')}_docusaurus.zip`);
  };

  const handleExportConfluence = () => {
    const chaptersToExport = chapters.filter(c => selectedChapterIds.includes(c.id));
    const htmlToConfluence = (html: string): string => {
      if (typeof window === 'undefined') return '';
      const div = window.document.createElement('div');
      div.innerHTML = html;
      let result = '';
      div.childNodes.forEach(node => {
        const el = node as HTMLElement;
        const tag = el.tagName?.toLowerCase();
        const text = el.textContent?.trim() || '';
        if (!tag) { result += text + '\n'; return; }
        switch (tag) {
          case 'h1': result += `h1. ${text}\n\n`; break;
          case 'h2': result += `h2. ${text}\n\n`; break;
          case 'h3': result += `h3. ${text}\n\n`; break;
          case 'p': result += `${text}\n\n`; break;
          case 'code': result += `{{${text}}} `; break;
          case 'pre': result += `{code}\n${el.textContent}\n{code}\n\n`; break;
          case 'blockquote': result += `{quote}\n${text}\n{quote}\n\n`; break;
          case 'ul': Array.from(el.querySelectorAll('li')).forEach(li => { result += `* ${li.textContent?.trim()}\n`; }); result += '\n'; break;
          case 'ol': Array.from(el.querySelectorAll('li')).forEach(li => { result += `# ${li.textContent?.trim()}\n`; }); result += '\n'; break;
          case 'a': { const href = el.getAttribute('href') || ''; result += `[${text || href}|${href}] `; break; }
          default: result += text + ' ';
        }
      });
      return result;
    };
    let content = `h1. ${bookTitle}\n\n`;
    if (authorName) content += `_By ${authorName}_\n\n`;
    chaptersToExport.forEach(c => {
      content += `----\nh2. ${c.title}\n\n`;
      content += c.content ? htmlToConfluence(c.content) : '_No content yet._\n\n';
    });
    downloadBlob(content, `${bookTitle.replace(/\s+/g, '_')}_confluence.txt`, 'text/plain');
  };

  const handleExportNotion = () => {
    const chaptersToExport = chapters.filter(c => selectedChapterIds.includes(c.id));
    const turndownService = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });
    let content = `# ${bookTitle}\n\n`;
    if (authorName) content += `> By ${authorName}\n\n`;
    content += `---\n\n`;
    chaptersToExport.forEach(c => {
      content += `## ${c.title}\n\n`;
      content += c.content ? turndownService.turndown(c.content) : '*No content yet.*';
      content += `\n\n---\n\n`;
    });
    downloadBlob(content, `${bookTitle.replace(/\s+/g, '_')}_notion.md`, 'text/markdown');
  };

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

  const handleExportPDF = () => {
    const chaptersToExport = chapters.filter(c => selectedChapterIds.includes(c.id));
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageW = 210;
    const pageH = 297;
    const margin = 20;
    const contentW = pageW - margin * 2;

    // --- Cover Page ---
    // Background
    doc.setFillColor(pdfCoverColor);
    doc.rect(0, 0, pageW, pageH, 'F');

    // Accent bar
    doc.setFillColor(pdfAccentColor);
    doc.rect(0, pageH * 0.55, pageW, 4, 'F');

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(36);
    doc.setFont("helvetica", "bold");
    const titleLines = doc.splitTextToSize(bookTitle, contentW);
    doc.text(titleLines, pageW / 2, pageH * 0.38, { align: 'center' });

    // Subtitle
    if (pdfSubtitle) {
      doc.setFontSize(16);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(180, 180, 210);
      doc.text(pdfSubtitle, pageW / 2, pageH * 0.38 + titleLines.length * 14 + 8, { align: 'center' });
    }

    // Author
    if (authorName) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(200, 200, 220);
      doc.text(`by ${authorName}`, pageW / 2, pageH * 0.72, { align: 'center' });
    }

    // --- Chapters ---
    chaptersToExport.forEach((c) => {
      doc.addPage();

      // Chapter header bg strip
      doc.setFillColor(pdfAccentColor);
      doc.rect(0, 0, 8, pageH, 'F');

      let y = 24;
      // Chapter title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(40, 40, 60);
      const chTitleLines = doc.splitTextToSize(c.title, contentW - 4);
      doc.text(chTitleLines, margin + 4, y);
      y += chTitleLines.length * 9 + 6;

      // Divider
      doc.setDrawColor(pdfAccentColor);
      doc.setLineWidth(0.5);
      doc.line(margin + 4, y, pageW - margin, y);
      y += 8;

      // Body text
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(50, 50, 60);

      const tempDiv = window.document.createElement("div");
      tempDiv.innerHTML = c.content || "";
      const rawText = tempDiv.textContent || tempDiv.innerText || "No content written yet.";
      const lines = doc.splitTextToSize(rawText, contentW - 4);

      lines.forEach((line: string) => {
        if (y > pageH - margin) {
          doc.addPage();
          doc.setFillColor(pdfAccentColor);
          doc.rect(0, 0, 8, pageH, 'F');
          y = 24;
        }
        doc.text(line, margin + 4, y);
        y += 6.5;
      });
    });

    doc.save(`${bookTitle.replace(/\s+/g, '_')}.pdf`);
  };

  const handleExportEpub = async () => {
    const chaptersToExport = chapters.filter(c => selectedChapterIds.includes(c.id));

    const epubContent = chaptersToExport.map(c => ({
      title: c.title,
      content: c.content || '<p><em>No content written yet.</em></p>',
    }));

    const options = {
      title: bookTitle,
      author: authorName || 'Unknown Author',
      lang: 'en',
      css: `
        body { font-family: Georgia, serif; font-size: 1em; line-height: 1.8; margin: 2em 3em; color: #222; }
        h1, h2, h3 { font-family: 'Helvetica Neue', sans-serif; color: #1a1a2e; margin-top: 1.5em; }
        p { margin: 0.8em 0; text-indent: 1.2em; }
        blockquote { border-left: 4px solid #6366f1; padding-left: 1em; color: #555; font-style: italic; }
        code { background: #f4f4f4; padding: 0.2em 0.4em; border-radius: 3px; font-size: 0.9em; }
      `,
    };

    try {
      // Dynamic import to avoid SSR "window is not defined" crash
      const epubModule = await import('epub-gen-memory/bundle');
      const epubBlob: Blob = await epubModule.default(options, epubContent);
      downloadBinaryBlob(epubBlob, `${bookTitle.replace(/\s+/g, '_')}.epub`);
    } catch (err) {
      console.error("Failed to generate ePub", err);
      alert("Failed to generate ePub file.");
    }
  };

  const handleExportBlogHTML = () => {
    const chaptersToExport = chapters.filter(c => selectedChapterIds.includes(c.id));

    const chapterHTML = chaptersToExport.map(c => {
      const content = c.content || '<p><em>No content written yet.</em></p>';
      return `
      <article style="margin-bottom: 60px; padding-bottom: 40px; border-bottom: 1px solid #e5e7eb;">
        <h2 style="font-family: 'Georgia', serif; font-size: 28px; font-weight: 700; color: #111827; margin: 0 0 24px 0; line-height: 1.3;">${c.title}</h2>
        <div style="font-family: 'Georgia', serif; font-size: 18px; line-height: 1.9; color: #374151;">
          ${content}
        </div>
      </article>`;
    }).join('\n');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${bookTitle}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 0;
      background: #f9fafb;
      color: #111827;
    }
    .container {
      max-width: 720px;
      margin: 0 auto;
      padding: 60px 24px;
    }
    header {
      text-align: center;
      margin-bottom: 60px;
      padding-bottom: 40px;
      border-bottom: 3px solid #6366f1;
    }
    header h1 {
      font-family: 'Georgia', serif;
      font-size: 42px;
      font-weight: 700;
      color: #111827;
      margin: 0 0 12px 0;
    }
    header p.byline {
      font-family: 'Helvetica Neue', sans-serif;
      font-size: 16px;
      color: #6b7280;
      margin: 0;
    }
    article h2 { font-size: 28px; }
    article p { margin: 0 0 1.2em 0; }
    article ul, article ol { margin: 0 0 1.2em 1.5em; }
    article blockquote {
      border-left: 4px solid #6366f1;
      margin: 1.5em 0;
      padding: 0.5em 1.5em;
      color: #6b7280;
      font-style: italic;
    }
    article code {
      background: #f3f4f6;
      padding: 0.15em 0.4em;
      border-radius: 4px;
      font-size: 0.88em;
      font-family: 'Courier New', monospace;
    }
    article pre {
      background: #1e1b4b;
      color: #e0e7ff;
      padding: 20px;
      border-radius: 8px;
      overflow-x: auto;
      margin: 1.5em 0;
    }
    footer {
      text-align: center;
      margin-top: 60px;
      padding-top: 24px;
      border-top: 1px solid #e5e7eb;
      color: #9ca3af;
      font-family: 'Helvetica Neue', sans-serif;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>${bookTitle}</h1>
      ${authorName ? `<p class="byline">by ${authorName}</p>` : ''}
    </header>
    <main>
      ${chapterHTML}
    </main>
    <footer>
      <p>Created with Book Writer &mdash; ${new Date().getFullYear()}</p>
    </footer>
  </div>
</body>
</html>`;

    downloadBlob(html, `${bookTitle.replace(/\s+/g, '_')}_blog.html`, 'text/html');
  };

  const totalWords = chapters.reduce((acc, c) => acc + (c.content ? c.content.split(/\s+/).filter(Boolean).length : 0), 0);
  const emptyChapters = chapters.filter(c => !c.content || c.content.trim() === "").length;
  
  const toggleChapterSelection = (id: string) => {
    setSelectedChapterIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleAllChapters = () => {
    if (selectedChapterIds.length === chapters.length) {
      setSelectedChapterIds([]);
    } else {
      setSelectedChapterIds(chapters.map(c => c.id));
    }
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Export Your Book</h1>
      <p className="page-description">Generate the final manuscript from your chapters.</p>

      {loading ? (
        <p>Loading data...</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
          
          <div className="card">
            <h2 style={{ fontSize: "18px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
               <CheckCircle2 color="var(--accent-color)" size={20} />
               Manuscript Summary
            </h2>
            
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "12px", color: "var(--text-secondary)" }}>
               <li><strong>Total Chapters:</strong> <span style={{ color: "var(--text-primary)" }}>{chapters.length}</span></li>
               <li><strong>Total Word Count:</strong> <span style={{ color: "var(--text-primary)" }}>{totalWords.toLocaleString()}</span></li>
               <li><strong>Empty Chapters:</strong> <span style={{ color: emptyChapters > 0 ? "var(--danger-color)" : "var(--text-primary)" }}>{emptyChapters}</span></li>
            </ul>
            
            <hr style={{ borderColor: 'var(--border-color)', margin: '24px 0' }} />
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h3 style={{ fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Settings2 size={18} /> Advanced Options
                </h3>
                <button 
                  className="btn btn-secondary" 
                  style={{ padding: "4px 8px", fontSize: "12px" }} 
                  onClick={() => setShowAdvanced(!showAdvanced)}
                >
                    {showAdvanced ? "Hide" : "Show"}
                </button>
            </div>

            {showAdvanced && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px", backgroundColor: "var(--bg-tertiary)", padding: "16px", borderRadius: "12px" }}>
                    <div className="form-group">
                        <label className="form-label">Book Title</label>
                        <input type="text" className="input" value={bookTitle} onChange={e => setBookTitle(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Author Name</label>
                        <input type="text" className="input" placeholder="Optional" value={authorName} onChange={e => setAuthorName(e.target.value)} />
                    </div>
                    
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <input type="checkbox" id="titlePage" checked={includeTitlePage} onChange={e => setIncludeTitlePage(e.target.checked)} />
                        <label htmlFor="titlePage">Include Title Page (DOCX)</label>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <input type="checkbox" id="dedication" checked={includeDedication} onChange={e => setIncludeDedication(e.target.checked)} />
                        <label htmlFor="dedication">Include Dedication Page (DOCX)</label>
                    </div>
                    
                    {includeDedication && (
                        <div className="form-group" style={{ marginLeft: "24px" }}>
                            <textarea className="input" rows={3} value={dedicationText} onChange={e => setDedicationText(e.target.value)} />
                        </div>
                    )}
                </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <button className="btn btn-primary" onClick={handleExportText} style={{ width: "100%", justifyContent: "center" }} disabled={chapters.length === 0}>
                <FileText size={18} /> Export as .TXT
              </button>
              <button className="btn btn-secondary" onClick={handleExportMarkdown} style={{ width: "100%", justifyContent: "center", borderColor: "var(--accent-color)", color: "var(--accent-color)" }} disabled={chapters.length === 0}>
                <Download size={18} /> Export as .MD (Markdown)
              </button>
              <button className="btn btn-secondary" onClick={handleExportLinkedIn} style={{ width: "100%", justifyContent: "center", backgroundColor: "#0a66c2", color: "white", borderColor: "#0a66c2" }} disabled={chapters.length === 0}>
                <Linkedin size={18} /> Export for LinkedIn Newsletter
              </button>
              <button className="btn btn-secondary" onClick={handleExportJson} style={{ width: "100%", justifyContent: "center", borderColor: "#f59e0b", color: "#f59e0b" }} disabled={chapters.length === 0 || selectedChapterIds.length === 0}>
                <FileJson size={18} /> Export as .JSON
              </button>
              <button className="btn btn-primary" onClick={handleExportDocx} style={{ width: "100%", justifyContent: "center", backgroundColor: "var(--accent-color)", color: "white", borderColor: "var(--accent-color)" }} disabled={chapters.length === 0 || selectedChapterIds.length === 0}>
                <FileArchive size={18} /> Export as .DOCX (Word)
              </button>

              <hr style={{ borderColor: 'var(--border-color)', margin: '4px 0' }} />

              {/* PDF Cover Options */}
              {showAdvanced && (
                <div style={{ backgroundColor: 'var(--bg-tertiary)', padding: '12px', borderRadius: 'var(--radius-sm)', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '4px' }}>
                  <p style={{ fontSize: '12px', color: 'var(--accent-color)', fontWeight: 600, margin: 0 }}>PDF Cover Options</p>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '12px' }}>Subtitle</label>
                    <input className="input" placeholder="Optional subtitle" value={pdfSubtitle} onChange={e => setPdfSubtitle(e.target.value)} />
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label" style={{ fontSize: '12px' }}>Cover Background</label>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input type="color" value={pdfCoverColor} onChange={e => setPdfCoverColor(e.target.value)} style={{ width: '40px', height: '36px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'none', cursor: 'pointer' }} />
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{pdfCoverColor}</span>
                      </div>
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label" style={{ fontSize: '12px' }}>Accent Color</label>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input type="color" value={pdfAccentColor} onChange={e => setPdfAccentColor(e.target.value)} style={{ width: '40px', height: '36px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'none', cursor: 'pointer' }} />
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{pdfAccentColor}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <button className="btn btn-primary" onClick={handleExportPDF} style={{ width: "100%", justifyContent: "center", backgroundColor: "#dc2626", borderColor: "#dc2626", color: "white" }} disabled={chapters.length === 0 || selectedChapterIds.length === 0}>
                <FileImage size={18} /> Export as .PDF (with Cover)
              </button>
              <button className="btn btn-secondary" onClick={handleExportEpub} style={{ width: "100%", justifyContent: "center", borderColor: "#16a34a", color: "#16a34a" }} disabled={chapters.length === 0 || selectedChapterIds.length === 0}>
                <BookCopy size={18} /> Export as .ePub (E-Book)
              </button>
              <button className="btn btn-secondary" onClick={handleExportBlogHTML} style={{ width: "100%", justifyContent: "center", borderColor: "#ea580c", color: "#ea580c" }} disabled={chapters.length === 0 || selectedChapterIds.length === 0}>
                <Globe size={18} /> Export as Blog HTML
              </button>
              <button className="btn btn-secondary" onClick={handleExportLaTeX} style={{ width: "100%", justifyContent: "center", borderColor: "#7c3aed", color: "#7c3aed" }} disabled={chapters.length === 0 || selectedChapterIds.length === 0}>
                <FileCode size={18} /> Export as .tex (LaTeX / arXiv)
              </button>

              <hr style={{ borderColor: 'var(--border-color)', margin: '4px 0' }} />
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '0' }}>Developer & Publishing Platforms</p>

              <button className="btn btn-secondary" onClick={handleExportGitbook} style={{ width: "100%", justifyContent: "center", borderColor: "#0ea5e9", color: "#0ea5e9" }} disabled={chapters.length === 0 || selectedChapterIds.length === 0}>
                <FolderOpen size={18} /> Export for Gitbook (.zip)
              </button>
              <button className="btn btn-secondary" onClick={handleExportConfluence} style={{ width: "100%", justifyContent: "center", borderColor: "#1d4ed8", color: "#1d4ed8" }} disabled={chapters.length === 0 || selectedChapterIds.length === 0}>
                <Building2 size={18} /> Export for Confluence (Wiki Markup)
              </button>
              <button className="btn btn-secondary" onClick={handleExportNotion} style={{ width: "100%", justifyContent: "center", borderColor: "#6b7280", color: "var(--text-secondary)" }} disabled={chapters.length === 0 || selectedChapterIds.length === 0}>
                <FileType size={18} /> Export for Notion (Markdown)
              </button>
            </div>
          </div>

          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "18px" }}>Select Chapters</h2>
              <button className="btn btn-secondary" style={{ padding: "4px 8px", fontSize: "12px" }} onClick={toggleAllChapters}>
                {selectedChapterIds.length === chapters.length ? "Deselect All" : "Select All"}
              </button>
            </div>
            {chapters.length === 0 ? (
               <p style={{ color: "var(--text-muted)" }}>No chapters to export.</p>
            ) : (
               <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                 {includeTitlePage && showAdvanced && (
                     <div style={{ padding: "8px 12px", backgroundColor: "rgba(99, 102, 241, 0.1)", border: "1px dashed var(--accent-light)", borderRadius: "var(--radius-sm)", color: "var(--accent-color)", textAlign: "center" }}>
                        Cover Page: {bookTitle}
                     </div>
                 )}
                 {includeDedication && showAdvanced && (
                     <div style={{ padding: "8px 12px", backgroundColor: "rgba(99, 102, 241, 0.1)", border: "1px dashed var(--accent-light)", borderRadius: "var(--radius-sm)", color: "var(--accent-color)", textAlign: "center" }}>
                        Dedication Page
                     </div>
                 )}
                 {chapters.map((c, i) => (
                   <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", backgroundColor: selectedChapterIds.includes(c.id) ? "var(--bg-tertiary)" : "transparent", opacity: selectedChapterIds.includes(c.id) ? 1 : 0.5, borderRadius: "var(--radius-sm)", border: selectedChapterIds.includes(c.id) ? "1px solid var(--border-color)" : "1px dashed var(--border-color)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <input 
                          type="checkbox" 
                          checked={selectedChapterIds.includes(c.id)}
                          onChange={() => toggleChapterSelection(c.id)}
                        />
                        <span>{i+1}. {c.title}</span>
                      </div>
                      <span style={{ color: "var(--text-secondary)" }}>{c.content ? c.content.split(/\s+/).filter(Boolean).length + " words" : "Empty"}</span>
                   </div>
                 ))}
               </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
