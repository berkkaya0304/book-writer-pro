# 📚 AI Writing Suite

> A powerful, privacy-first writing application for authors and technical writers — powered by your choice of **local Ollama** or **Google Gemini** AI.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![License](https://img.shields.io/badge/license-MIT-blue)
![AI](https://img.shields.io/badge/AI-Ollama%20%7C%20Google%20Gemini-purple)

---

## ✨ Features

### 📝 Writing
- **Rich Text Editor** — Tiptap-based editor with formatting, headings, lists, highlights, alignment
- **AI Chat Assistant** — Context-aware AI writing assistant in the editor sidebar
- **AI Text Tools** — Select text → expand, rewrite, summarize, grammar check
- **Dictation & TTS** — Speech-to-text input + text-to-speech read-back
- **Version History** — Snapshot-based chapter history with diff viewer
- **Focus Mode** — Distraction-free writing with ambient sound
- **Vocabulary Analyzer** — Detect overused words

### 🤖 AI Provider Switching
- Switch between **🦙 Ollama (local, private)** and **✨ Google Gemini (cloud)** in Settings
- Supports `gemini-2.0-flash`, `gemini-1.5-pro`, `gemini-2.5-pro` and more
- Automatic **quota warning** when Google API credits run out, with prompt to switch to Ollama
- API key stored **only in your browser** — never sent to any third-party server

### 📖 Book Management
- Chapter manager with ordering, outlines, and status tracking
- Kanban plot board for visual story planning
- Character database with relationship tracking
- Writing analytics with heatmap and word count trends
- Writing calendar and daily goals

### 🔬 Technical Writing Tools
- **Auto Outline Generator** — AI-generated outlines for research papers, tutorials, whitepapers, case studies
- **Abstract Generator** — Structured academic abstracts (Background · Method · Results · Conclusion)
- **Keyword Extractor** — Ranked keywords with relevance scores for SEO/indexing
- **Citation Formatter** — IEEE, ACS, and more
- **Equation Numbering** — LaTeX math blocks with KaTeX rendering
- **Code Blocks** — Syntax-highlighted code with 40+ languages
- **Mermaid Diagrams** — Inline diagram editor and renderer
- **Section Numbering** — Automatic chapter/section numbering
- **Figure & Table Captions** — Caption manager for figures and tables
- **Abbreviation Glossary** — Auto-tracked acronyms and abbreviations
- **Footnote Manager** — Inline footnotes with auto-numbering
- **Related Work Tracker** — Track citations and related papers
- **Reproducibility Checklist** — Ensure research is reproducible
- **Ethics Checklist** — Research ethics compliance
- **Contribution Statement** — Author contribution tracking (CRediT taxonomy)
- **Journal Submission Checker** — Pre-submission requirements checklist
- **Plagiarism Highlighter** — Highlight suspected duplicate passages
- **Peer Review Tracker** — Track reviewer comments and responses
- **Data Table Builder** — Rich table editor with CSV import
- **Reading Time Estimator** — Per-chapter and total reading time
- **Style Guide** — Custom writing rules and style reference
- **Dependency Graph** — Visual chapter dependency map
- **Errata Tracker** — Post-publication error tracking
- **Changelog** — Version history log

### 📤 Export & Publishing
- Export to **PDF**, **DOCX**, **EPUB**, **Markdown**, **JSON**, **LinkedIn Newsletter**
- **GitHub Sync** — Push manuscript to a GitHub repo
- **Side-by-Side Diff** — Visual revision comparison
- **Static Site Builder** — Export book as a Nextra/Docusaurus website
- **Template Library** — Pre-built chapter templates

---

## 🚀 Getting Started

### Prerequisites
- [Node.js 18+](https://nodejs.org)
- For local AI: [Ollama](https://ollama.com) installed and running

### Installation

```bash
git clone https://github.com/YOUR_USERNAME/book-writer.git
cd book-writer
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### AI Setup

**Option A — Ollama (free, private, local):**
1. Install Ollama: https://ollama.com
2. Pull a model: `ollama pull llama3`
3. In the app: Settings → 🦙 Ollama → Save

**Option B — Google Gemini (cloud):**
1. Get a free API key: https://aistudio.google.com/app/apikey
2. In the app: Settings → ✨ Google Gemini → paste your key → Save
3. Your key is stored only in your browser's localStorage

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Editor | Tiptap |
| AI (Local) | Ollama |
| AI (Cloud) | Google Gemini (`@google/generative-ai`) |
| Math | KaTeX |
| Diagrams | Mermaid.js |
| Charts | Recharts |
| Export | jsPDF, docx, epub-gen-memory |
| Drag & Drop | dnd-kit |

---

## 🔒 Privacy

- **Ollama mode**: all AI runs locally, no data leaves your machine
- **Gemini mode**: text is sent to Google's API using your own key; the key is stored only in your browser
- No analytics, no telemetry, no accounts required
- All book data stored locally in `.data/` (excluded from git)

---

## 📄 License

MIT — free to use, modify, and distribute.
