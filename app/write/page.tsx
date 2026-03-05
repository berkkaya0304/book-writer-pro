"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Save, Send, Bot, User as UserIcon, Plus, History as HistoryIcon, RotateCcw, Copy, Target, Play, Square, Settings2, StickyNote, Bold, Italic, Heading1, Heading2, Quote, List, ListOrdered, Undo, Redo, Underline as UnderlineIcon, Strikethrough, Highlighter, AlignLeft, AlignCenter, AlignRight, AlignJustify, Search, X, Type, Mic, MicOff, Volume2, AudioLines, BookOpenText, Code, Lightbulb, AlertTriangle, AlertOctagon, Info, Code2 } from "lucide-react";
import { getAllChapters, getChapterHistory, createSnapshot, updateChapter, Chapter, Snapshot, getGoals, updateGoals, updateDailyWordCount, getSettings, updateSettings, getScratchpad, updateScratchpad } from "@/lib/localStorageUtils";
import { getAiHeaders } from "@/lib/getAiHeaders";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import * as diff from 'diff';
import mermaid from 'mermaid';
import katex from 'katex';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    admonition: {
      setAdmonition: (type: string) => ReturnType;
      toggleAdmonition: (type: string) => ReturnType;
    };
    mermaid: {
      setMermaid: (code: string) => ReturnType;
      toggleMermaid: () => ReturnType;
    };
    math: {
      setMath: (formula: string) => ReturnType;
      toggleMath: () => ReturnType;
    };
  }
}

// Initialize mermaid
mermaid.initialize({ startOnLoad: false, theme: 'dark' });

// Initialize lowlight with common languages
const lowlight = createLowlight(common);

// Custom Admonition Component
const AdmonitionComponent = (props: any) => {
  const type = props.node.attrs.type;
  
  const getIcon = () => {
    switch (type) {
      case 'tip': return <Lightbulb size={20} color="var(--success-color, #10b981)" />;
      case 'warning': return <AlertTriangle size={20} color="var(--warning-color, #f59e0b)" />;
      case 'danger': return <AlertOctagon size={20} color="var(--error-color, #ef4444)" />;
      default: return <Info size={20} color="var(--info-color, #3b82f6)" />;
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'tip': return 'Tip';
      case 'warning': return 'Warning';
      case 'danger': return 'Danger';
      default: return 'Note';
    }
  };

  return (
    <NodeViewWrapper className={`admonition admonition-${type}`}>
      <div className="admonition-icon" contentEditable={false}>{getIcon()}</div>
      <div className="admonition-content">
        <div className="admonition-title" contentEditable={false}>{getTitle()}</div>
        <NodeViewContent className="admonition-body" />
      </div>
    </NodeViewWrapper>
  );
};

// Custom Admonition Extension
const Admonition = Node.create({
  name: 'admonition',
  group: 'block',
  content: 'block+',
  defining: true,

  addAttributes() {
    return {
      type: {
        default: 'note',
        parseHTML: element => element.getAttribute('data-type'),
        renderHTML: attributes => {
          return { 'data-type': attributes.type }
        },
      },
    };
  },

  parseHTML() {
    return [
      { tag: 'div[data-type="note"]' },
      { tag: 'div[data-type="tip"]' },
      { tag: 'div[data-type="warning"]' },
      { tag: 'div[data-type="danger"]' },
      { tag: 'div.admonition' }, // Fallback
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const type = HTMLAttributes['data-type'] || 'note';
    return ['div', mergeAttributes(HTMLAttributes, { class: `admonition admonition-${type}` }), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(AdmonitionComponent);
  },

  addCommands() {
    return {
      setAdmonition: (type: string) => ({ commands }: { commands: any }) => {
        return commands.setNode(this.name, { type });
      },
      toggleAdmonition: (type: string) => ({ commands }: { commands: any }) => {
        return commands.toggleNode(this.name, 'paragraph', { type });
      },
    };
  },
});

// Custom Mermaid Component
const MermaidComponent = (props: any) => {
  const [code, setCode] = useState(props.node.attrs.code || 'graph TD;\n  A-->B;');
  const [svg, setSvg] = useState('');
  const [isEditing, setIsEditing] = useState(props.node.attrs.code === '');

  useEffect(() => {
    let mounted = true;
    const renderDiagram = async () => {
      if (!code.trim()) {
        setSvg('');
        return;
      }
      try {
        const { svg: renderedSvg } = await mermaid.render(`mermaid-${Math.random().toString(36).substr(2, 9)}`, code);
        if (mounted) setSvg(renderedSvg);
      } catch (e) {
        if (mounted) setSvg(`<div style="color:var(--error-color, red); padding:10px;">Syntax Error in Diagram</div>`);
      }
    };
    renderDiagram();
    return () => { mounted = false; };
  }, [code]);

  return (
    <NodeViewWrapper className="mermaid-block" style={{ margin: '1.5rem 0', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
      <div style={{ padding: '8px', backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>MERMAID DIAGRAM</span>
        <button onClick={() => setIsEditing(!isEditing)} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px' }}>
          {isEditing ? 'Preview' : 'Edit'}
        </button>
      </div>
      {isEditing ? (
        <textarea 
          className="input"
          style={{ width: '100%', minHeight: '150px', border: 'none', borderRadius: 0, resize: 'vertical', fontFamily: 'monospace', fontSize: '14px', backgroundColor: '#1e1e1e', color: '#d4d4d4', padding: '16px' }}
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            props.updateAttributes({ code: e.target.value });
          }}
          placeholder="graph TD;\n  A-->B;"
        />
      ) : (
        <div style={{ padding: '16px', display: 'flex', justifyContent: 'center', backgroundColor: 'var(--bg-primary)' }} dangerouslySetInnerHTML={{ __html: svg || '<div style="color:var(--text-muted)">Empty Diagram</div>' }} />
      )}
    </NodeViewWrapper>
  );
};

const MermaidBlock = Node.create({
  name: 'mermaid',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      code: {
        default: '',
        parseHTML: element => element.getAttribute('data-code'),
        renderHTML: attributes => ({ 'data-code': attributes.code }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="mermaid"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    // Basic fallback render for outputting to static html later
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'mermaid', class: 'mermaid' }), HTMLAttributes.code || ''];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MermaidComponent);
  },

  addCommands() {
    return {
      toggleMermaid: () => ({ commands }: { commands: any }) => commands.insertContent({ type: this.name }),
    };
  },
});

// Custom Math Component (KaTeX)
const MathComponent = (props: any) => {
  const [formula, setFormula] = useState(props.node.attrs.formula || 'E = mc^2');
  const [html, setHtml] = useState('');
  const [isEditing, setIsEditing] = useState(props.node.attrs.formula === '');

  useEffect(() => {
    try {
      if (formula.trim()) {
        const rendered = katex.renderToString(formula, { displayMode: true, throwOnError: false });
        setHtml(rendered);
      } else {
         setHtml('');
      }
    } catch (e) {
        setHtml(`<div style="color:var(--error-color, red)">Error parsing math</div>`);
    }
  }, [formula]);

  return (
    <NodeViewWrapper className="math-block" style={{ margin: '1.5rem 0', padding: '8px', border: isEditing ? '1px dashed var(--accent-color)' : '1px solid transparent', borderRadius: 'var(--radius-md)' }}>
      {isEditing ? (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
          <textarea 
            className="input"
            style={{ flex: 1, minHeight: '60px', fontFamily: 'monospace', fontSize: '14px' }}
            value={formula}
            onChange={(e) => {
              setFormula(e.target.value);
              props.updateAttributes({ formula: e.target.value });
            }}
            placeholder="LaTeX formula..."
            autoFocus
          />
          <button onClick={() => setIsEditing(false)} className="btn btn-primary" style={{ padding: '8px 12px' }}>Done</button>
        </div>
      ) : (
        <div onClick={() => setIsEditing(true)} style={{ cursor: 'pointer', padding: '8px', textAlign: 'center', pointerEvents: 'auto' }} dangerouslySetInnerHTML={{ __html: html || '<span style="color:var(--text-muted)">Empty Math Block</span>' }} title="Click to edit formula" />
      )}
    </NodeViewWrapper>
  );
};

const MathBlock = Node.create({
  name: 'math',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      formula: {
        default: '',
        parseHTML: element => element.getAttribute('data-formula'),
        renderHTML: attributes => ({ 'data-formula': attributes.formula }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="math"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    // Used for HTML export, we can inject katex classes or just raw text
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'math', class: 'katex-display' }), `$$${HTMLAttributes.formula}$$`];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MathComponent);
  },

  addCommands() {
    return {
      toggleMath: () => ({ commands }: { commands: any }) => commands.insertContent({ type: this.name }),
    };
  },
});



export default function WritePage() {
  return (
    <Suspense fallback={<div className="page-container">Loading workspace...</div>}>
      <WritePageContent />
    </Suspense>
  );
}

function WritePageContent() {
  const searchParams = useSearchParams();
  const initialChapterId = searchParams?.get("chapterId");

  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(initialChapterId || null);
  
  // Editor state
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  // Chat state
  const [prompt, setPrompt] = useState("");
  const [chatHistory, setChatHistory] = useState<{role: string, content: string}[]>([]);
  const [generating, setGenerating] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const [selection, setSelection] = useState<{start: number, end: number, text: string, top: number, left: number} | null>(null);
  const [toolLoading, setToolLoading] = useState(false);

  // Focus Mode state
  const [focusMode, setFocusMode] = useState(false);

  // Search & Replace state
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [replaceTerm, setReplaceTerm] = useState("");

  // Typography state
  const [showTypography, setShowTypography] = useState(false);
  const [fontFamily, setFontFamily] = useState("var(--font-sans)");
  const [fontSize, setFontSize] = useState(18);
  const [lineHeight, setLineHeight] = useState(1.8);

  const editor = useEditor({
    extensions: [
      StarterKit, 
      Image,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight.configure({ multicolor: true }),
      TextStyle,
      Color,
      CodeBlockLowlight.configure({
        lowlight,
      }),
      Admonition,
      MermaidBlock,
      MathBlock,
    ],
    content: content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const text = editor.getText();
      handleContentChange(html, text);
    },
    onSelectionUpdate: ({ editor }) => {
      const { empty, from, to } = editor.state.selection;
      if (!empty) {
        const text = editor.state.doc.textBetween(from, to, ' ');
        if (text.trim().length > 10) {
           setSelection({
             start: from, end: to, text,
             top: 100, // naive positioning
             left: 0
           });
           return;
        }
      }
      setSelection(null);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base focus:outline-none max-w-none tiptap-editor-custom',
        style: 'min-height: 500px; padding: 24px; color: var(--text-primary);'
      },
    },
  });

  // History state
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<Snapshot[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Stats & Goals state
  const [showGoals, setShowGoals] = useState(false);
  const [goals, setGoals] = useState({ target: 1000, dailyProgress: {} as Record<string, number> });
  const [sessionWordCount, setSessionWordCount] = useState(0);
  const initialWordCountRef = useRef(0);

  // Ambient sound state
  const [ambientSound, setAmbientSound] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Scratchpad state
  const [showScratchpad, setShowScratchpad] = useState(false);
  const [scratchpadText, setScratchpadText] = useState("");

  // Speech Tools & Vocabulary State
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  
  const [showVocab, setShowVocab] = useState(false);
  const [vocabData, setVocabData] = useState<{word:string, count:number}[]>([]);

  // ... (keep existing effects and handlers)

  useEffect(() => {
    fetchChapters();
    setGoals(getGoals());
    setScratchpadText(getScratchpad());

    // Apply saved theme and typography settings
    const settings = getSettings();
    const savedTheme = settings.theme || 'dark';
    document.documentElement.className = savedTheme === 'dark' ? '' : `theme-${savedTheme}`;
    if (settings.fontFamily) setFontFamily(settings.fontFamily);
    if (settings.fontSize) setFontSize(settings.fontSize);
    if (settings.lineHeight) setLineHeight(settings.lineHeight);
    
    return () => {
      window.speechSynthesis.cancel();
      if (recognitionRef.current) recognitionRef.current.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update CSS Variables for custom typography
  useEffect(() => {
    document.documentElement.style.setProperty('--editor-font-size', `${fontSize}px`);
    document.documentElement.style.setProperty('--editor-line-height', lineHeight.toString());
    document.documentElement.style.setProperty('--editor-font-family', fontFamily);
  }, [fontSize, lineHeight, fontFamily]);

  // Keyboard shortcut for Search & Replace
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+F or Cmd+F
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setShowSearch(prev => !prev);
        setShowTypography(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (selectedChapterId) {
      const chapter = chapters.find(c => c.id === selectedChapterId);
      if (chapter) {
         setContent(chapter.content || "");
         editor?.commands.setContent(chapter.content || "");
         
         // extract raw text for word count
         const rawText = getRawTextFromHTML(chapter.content || "");
         initialWordCountRef.current = rawText.trim().split(/\s+/).filter(w => w.length > 0).length;
         setSessionWordCount(0); // Reset session count for new chapter
      }
      if (showHistory) fetchHistory(selectedChapterId); // reload history if panel is open
    } else {
      setContent("");
      editor?.commands.setContent("");
      setHistory([]);
      setShowHistory(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChapterId, chapters]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const fetchChapters = () => {
    try {
      const data = getAllChapters();
      setChapters(data);
      if (!selectedChapterId && data.length > 0) {
        setSelectedChapterId(data[0].id);
      }
    } catch(e) { console.error(e); }
  };


  const fetchHistory = (chapterId: string) => {
    setLoadingHistory(true);
    try {
      const data = getChapterHistory(chapterId);
      setHistory(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingHistory(false);
    }
  };

  const saveSnapshot = (name?: string) => {
    if (!selectedChapterId) return;
    try {
      createSnapshot(selectedChapterId, content, name);
      if (showHistory) fetchHistory(selectedChapterId);
    } catch (e) {
      console.error(e);
    }
  };

  const saveChapter = () => {
    if (!selectedChapterId) return;
    setSaving(true);
    try {
      updateChapter(selectedChapterId, { content });
      setChapters(prev => prev.map(c => c.id === selectedChapterId ? { ...c, content } : c));
      
      // Auto-save a snapshot on manual save
      saveSnapshot();

      // Update daily goal
      const today = new Date().toISOString().split('T')[0];
      const todayDelta = sessionWordCount; 
      if (todayDelta > 0) {
        updateDailyWordCount(today, todayDelta);
        setGoals(getGoals());
        // Reset session count relative to this new save point
        const rawText = getRawTextFromHTML(content);
        initialWordCountRef.current = rawText.trim().split(/\s+/).filter(w => w.length > 0).length;
        setSessionWordCount(0);
      }
      
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleSendPrompt = async () => {
    if (!prompt.trim() || generating) return;
    
    const userMessage = prompt;
    setPrompt("");
    setChatHistory(prev => [...prev, { role: "user", content: userMessage }]);
    setChatHistory(prev => [...prev, { role: "assistant", content: "" }]); 
    setGenerating(true);

    try {
      const currentChapter = chapters.find(c => c.id === selectedChapterId);
      const language = localStorage.getItem("defaultLanguage") || "English";
      const tone = localStorage.getItem("defaultTone") || "Neutral";

      let systemPrompt = `You are an expert novel writing assistant. Help the author write the book chapters. 
Please communicate and generate text in the following language: ${language}. 
Your tone and writing style should be: ${tone}. `;
      if (currentChapter?.outline) {
        systemPrompt += `\n\nChapter Outline Context: ${currentChapter.outline}`;
      }
      systemPrompt += `\n\nCurrent Chapter Content Context: ...${content.slice(-2000)}`;

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: getAiHeaders(),
        body: JSON.stringify({
          prompt: userMessage,
          system: systemPrompt,
          context: []
        })
      });

      // Check for quota error (non-streaming JSON response)
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        if (errData.type === "quota_exceeded") {
          setChatHistory(prev => {
            const newHistory = [...prev];
            newHistory[newHistory.length - 1].content = "⚠️ **Google API krediniz doldu!** Ayarlar sayfasından Ollama'ya geçebilirsiniz: [Ayarlar'a git](/settings)";
            return newHistory;
          });
          return;
        }
        throw new Error(errData.error || "AI request failed");
      }

      if (!res.body) throw new Error("No stream body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantResponse = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter(l => l.trim() !== "");
        
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.response) {
              assistantResponse += data.response;
              setChatHistory(prev => {
                const newHistory = [...prev];
                newHistory[newHistory.length - 1].content = assistantResponse;
                return newHistory;
              });
            }
          } catch {}
        }
      }
    } catch(e) {
      console.error(e);
      setChatHistory(prev => {
        const newHistory = [...prev];
        newHistory[newHistory.length - 1].content = "Error generating response. Please check your AI provider settings.";
        return newHistory;
      });
    } finally {
      setGenerating(false);
    }
  };

  const insertToEditor = (text: string) => {
    if (editor) {
      editor.commands.insertContent(text);
    } else {
      setContent(prev => prev + (prev ? "\n\n" : "") + text);
    }
  };

  const getRawTextFromHTML = (html: string) => {
    // Guard against SSR — DOMParser is only available in the browser
    if (typeof window === 'undefined') {
      return html.replace(/<[^>]*>/g, ' ');
    }
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || "";
  };

  const applyTextTool = async (action: string, additionalContext?: string) => {
    if (!selection) return;
    setToolLoading(true);
    
    try {
      const language = localStorage.getItem("defaultLanguage") || "English";
      const tone = localStorage.getItem("defaultTone") || "Neutral";
      
      const res = await fetch("/api/text-tools", {
        method: "POST",
        headers: getAiHeaders(),
        body: JSON.stringify({ action, text: selection.text, additionalContext, language, tone })
      });
      
      const data = await res.json();
      if (data.type === "quota_exceeded") {
        alert("⚠️ Google API krediniz doldu! Ayarlar'dan Ollama'ya geçebilirsiniz.");
        return;
      }
      if (data.result) {
        if (action === "grammar-check") {
          setChatHistory(prev => [...prev, { role: "assistant", content: `**Grammar & Style Check for selected text:**\n\n"${selection.text.substring(0, 50)}..."\n\n${data.result}` }]);
          setSelection(null);
        } else {
          editor?.commands.insertContent(data.result);
          setSelection(null);
        }
      } else {
        alert(data.error || "Failed to process text.");
      }
    } catch(e) {
      console.error(e);
      alert("Error contacting AI provider. Check your Settings.");
    } finally {
      setToolLoading(false);
    }
  };

  const getWordCount = () => {
    const rawText = getRawTextFromHTML(content);
    return rawText.trim().split(/\s+/).filter(w => w.length > 0).length;
  };

  const handleContentChange = (htmlVal: string, textVal: string) => {
    setContent(htmlVal);
    
    // Update session word count difference relative to last save
    const currentCount = textVal.trim().split(/\s+/).filter(w => w.length > 0).length;
    const delta = currentCount - initialWordCountRef.current;
    if (delta > 0) {
       setSessionWordCount(delta);
    }
  };

  const toggleSound = (sound: string) => {
    if (ambientSound === sound) {
      setAmbientSound(null);
      if (audioRef.current) audioRef.current.pause();
    } else {
      setAmbientSound(sound);
      if (!audioRef.current) {
        audioRef.current = new Audio();
        audioRef.current.loop = true;
      }
      // Placeholder URLs for sounds (using free reliable sources or standard names if placed in public folder)
      // Since we don't have local sound files, we'll try to just show the UI for now or use a mock.
      // E.g. /sounds/rain.mp3 -> needs to be provided by user later
      audioRef.current.src = sound === 'rain' ? 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3?filename=heavy-rain-nature-sounds-8186.mp3' : 'https://cdn.pixabay.com/download/audio/2021/08/09/audio_d14bd7023c.mp3?filename=cafe-background-noise-10113.mp3';
      audioRef.current.play().catch(e => console.error("Audio playback failed", e));
    }
  };

  // --- Speech Tools ---
  const toggleSpeech = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      let textToRead = "";
      if (selection && selection.text) {
        textToRead = selection.text;
      } else {
        textToRead = getRawTextFromHTML(content);
      }
      
      if (!textToRead.trim()) return;

      const utterance = new SpeechSynthesisUtterance(textToRead);
      const lang = localStorage.getItem("defaultLanguage") || "Türkçe";
      utterance.lang = lang.includes("Türkçe") ? "tr-TR" : "en-US";
      
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleDictation = () => {
    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition isn't supported in your browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    const lang = localStorage.getItem("defaultLanguage") || "Türkçe";
    recognition.lang = lang.includes("Türkçe") ? "tr-TR" : "en-US";
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((res: any) => res[0].transcript)
        .join("");
        
      if (editor) {
        editor.commands.insertContent(" " + transcript);
      }
    };
    recognition.onerror = (event: any) => {
      console.error(event.error);
      setIsListening(false);
    };
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
  };

  // --- Vocabulary Analyzer ---
  const analyzeVocabulary = () => {
    const rawText = getRawTextFromHTML(content);
    if (!rawText.trim()) return;

    const words = rawText.toLowerCase().match(/[a-zğüşöçıîâ]+/g) || [];
    const stopWords = new Set([
      've', 'ile', 'ama', 'fakat', 'lakin', 'ancak', 'için', 'bir', 'bu', 'şu', 'o',
      'da', 'de', 'ki', 'mı', 'mi', 'mu', 'mü', 'gibi', 'kadar', 'çok', 'daha', 'en',
      'her', 'hiç', 'ne', 'olan', 'olarak', 'sonra', 'önce', 'göre', 'yok', 'var', 'değil',
      'evet', 'hayır', 'ben', 'sen', 'biz', 'siz', 'onlar', 'bana', 'sana', 'ona', 'bize',
      'size', 'onlara', 'beni', 'seni', 'onu', 'bizi', 'sizi', 'onları', 'the', 'a', 'an',
      'and', 'or', 'but', 'is', 'are', 'was', 'were', 'in', 'on', 'at', 'to', 'for', 'with',
      'it', 'of', 'that', 'this', 'he', 'she', 'they', 'you', 'i', 'my', 'his', 'her', 'their'
    ]);

    const counts: Record<string, number> = {};
    for (const w of words) {
      if (!stopWords.has(w) && w.length > 2) {
        counts[w] = (counts[w] || 0) + 1;
      }
    }

    const sorted = Object.entries(counts)
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 50);
    
    setVocabData(sorted);
    setShowVocab(true);
    setShowGoals(false);
    setShowHistory(false);
    setShowScratchpad(false);
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const todayProgress = (goals.dailyProgress[todayStr] || 0) + sessionWordCount;
  const progressPercent = Math.min(100, (todayProgress / goals.target) * 100);

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden", position: focusMode ? "fixed" : "relative", top: 0, left: 0, right: 0, bottom: 0, zIndex: focusMode ? 9999 : 1, backgroundColor: "var(--bg-primary)" }}>
      
      {/* Chapter Selection Column - Hidden in Focus Mode */}
      {!focusMode && (
        <div style={{ width: "220px", borderRight: "1px solid var(--border-color)", display: "flex", flexDirection: "column", backgroundColor: "var(--bg-secondary)" }}>
          <div style={{ padding: "16px", borderBottom: "1px solid var(--border-color)" }}>
            <h3 style={{ fontSize: "14px", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "1px" }}>Workspace</h3>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              CHAPTERS
            </div>
            {chapters.length === 0 ? (
               <div style={{ fontSize: "13px", color: "var(--text-muted)", padding: "8px 0" }}>No chapters created yet.</div>
            ) : chapters.map(c => (
               <div 
                 key={c.id}
                 onClick={() => setSelectedChapterId(c.id)}
                 style={{ 
                   padding: "8px 12px", 
                   borderRadius: "var(--radius-sm)", 
                   cursor: "pointer",
                   fontSize: "14px",
                   marginBottom: "4px",
                   backgroundColor: c.id === selectedChapterId ? "var(--bg-tertiary)" : "transparent",
                   color: c.id === selectedChapterId ? "var(--accent-color)" : "var(--text-primary)",
                   fontWeight: c.id === selectedChapterId ? 500 : 400
                 }}
               >
                 {c.title}
               </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Editor Column */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", backgroundColor: "var(--bg-primary)", margin: focusMode ? "0 auto" : 0, maxWidth: focusMode ? "900px" : "100%", transition: "all 0.3s ease" }}>
         <div style={{ padding: "16px 24px", borderBottom: focusMode ? "none" : "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: focusMode ? "var(--bg-primary)" : "var(--bg-secondary)" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 500, opacity: focusMode ? 0.5 : 1 }}>
              {selectedChapterId ? chapters.find(c => c.id === selectedChapterId)?.title : "Editor"}
            </h2>
            <div style={{ display: "flex", gap: "12px" }}>
              {!focusMode && (
                <>
                  <button 
                    className={showScratchpad ? "btn btn-primary" : "btn btn-secondary"} 
                    onClick={() => {
                      const next = !showScratchpad;
                      setShowScratchpad(next);
                      if (next) {
                        setShowGoals(false);
                        setShowHistory(false);
                      }
                    }}
                    title="Scratchpad"
                  >
                    <StickyNote size={16} /> 
                  </button>
                  <button 
                    className={showGoals ? "btn btn-primary" : "btn btn-secondary"} 
                    onClick={() => {
                       const next = !showGoals;
                       setShowGoals(next);
                       if (next) {
                         setShowHistory(false);
                         setShowScratchpad(false);
                       }
                    }}
                    title="Word Goals"
                  >
                    <Target size={16} /> 
                  </button>
                  <button 
                    className={showHistory ? "btn btn-primary" : "btn btn-secondary"} 
                    onClick={() => {
                      const next = !showHistory;
                      setShowHistory(next);
                      if (next) {
                        setShowGoals(false);
                        setShowScratchpad(false);
                      }
                      if (next && selectedChapterId) fetchHistory(selectedChapterId);
                    }}
                  >
                    <HistoryIcon size={16} /> History
                  </button>
                </>
              )}
              <button 
                className={focusMode ? "btn btn-secondary" : "btn btn-secondary"} 
                onClick={() => setFocusMode(!focusMode)}
                style={{ opacity: focusMode ? 0.3 : 1, transition: "opacity 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.opacity = "1"}
                onMouseLeave={e => e.currentTarget.style.opacity = focusMode ? "0.3" : "1"}
              >
                {focusMode ? "Exit Focus Mode" : "Focus Mode"}
              </button>
               <button className="btn btn-primary" onClick={saveChapter} disabled={saving || !selectedChapterId}>
                <Save size={16} /> {saving ? "Saving..." : "Save Content"}
              </button>
            </div>
         </div>
         
         {/* TipTap Toolbar */}
         {editor && selectedChapterId && !focusMode && (
           <div style={{ display: 'flex', gap: '8px', padding: '8px 24px', backgroundColor: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)', alignItems: 'center', flexWrap: "wrap" }}>
             <button onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} className="btn btn-secondary" style={{ padding: '6px' }} title="Undo"><Undo size={16} /></button>
             <button onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} className="btn btn-secondary" style={{ padding: '6px' }} title="Redo"><Redo size={16} /></button>
             <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-color)', margin: '0 4px' }}></div>
             
             <button onClick={() => editor.chain().focus().toggleBold().run()} className={`btn btn-secondary ${editor.isActive('bold') ? 'active-tool' : ''}`} style={{ padding: '6px' }} title="Bold"><Bold size={16} /></button>
             <button onClick={() => editor.chain().focus().toggleItalic().run()} className={`btn btn-secondary ${editor.isActive('italic') ? 'active-tool' : ''}`} style={{ padding: '6px' }} title="Italic"><Italic size={16} /></button>
             <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={`btn btn-secondary ${editor.isActive('underline') ? 'active-tool' : ''}`} style={{ padding: '6px' }} title="Underline"><UnderlineIcon size={16} /></button>
             <button onClick={() => editor.chain().focus().toggleStrike().run()} className={`btn btn-secondary ${editor.isActive('strike') ? 'active-tool' : ''}`} style={{ padding: '6px' }} title="Strikethrough"><Strikethrough size={16} /></button>
             <button onClick={() => editor.chain().focus().toggleHighlight({ color: '#fef08a' }).run()} className={`btn btn-secondary ${editor.isActive('highlight', { color: '#fef08a' }) ? 'active-tool' : ''}`} style={{ padding: '6px' }} title="Highlight"><Highlighter size={16} /></button>
             <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-color)', margin: '0 4px' }}></div>
             
             <button onClick={toggleSpeech} className={`btn btn-secondary ${isSpeaking ? 'active-tool' : ''}`} style={{ padding: '6px' }} title="Read Aloud">
               {isSpeaking ? <Square size={16} /> : <Volume2 size={16} />}
             </button>
             <button onClick={toggleDictation} className={`btn btn-secondary ${isListening ? 'active-tool' : ''}`} style={{ padding: '6px', color: isListening ? 'var(--error-color, #ef4444)' : 'inherit' }} title="Dictate (Speech to Text)">
               {isListening ? <MicOff size={16} /> : <Mic size={16} />}
             </button>
             <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-color)', margin: '0 4px' }}></div>
             
             <button onClick={() => editor.chain().focus().setTextAlign('left').run()} className={`btn btn-secondary ${editor.isActive({ textAlign: 'left' }) ? 'active-tool' : ''}`} style={{ padding: '6px' }} title="Align Left"><AlignLeft size={16} /></button>
             <button onClick={() => editor.chain().focus().setTextAlign('center').run()} className={`btn btn-secondary ${editor.isActive({ textAlign: 'center' }) ? 'active-tool' : ''}`} style={{ padding: '6px' }} title="Align Center"><AlignCenter size={16} /></button>
             <button onClick={() => editor.chain().focus().setTextAlign('right').run()} className={`btn btn-secondary ${editor.isActive({ textAlign: 'right' }) ? 'active-tool' : ''}`} style={{ padding: '6px' }} title="Align Right"><AlignRight size={16} /></button>
             <button onClick={() => editor.chain().focus().setTextAlign('justify').run()} className={`btn btn-secondary ${editor.isActive({ textAlign: 'justify' }) ? 'active-tool' : ''}`} style={{ padding: '6px' }} title="Justify"><AlignJustify size={16} /></button>
             <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-color)', margin: '0 4px' }}></div>
             
             <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={`btn btn-secondary ${editor.isActive('heading', { level: 1 }) ? 'active-tool' : ''}`} style={{ padding: '6px' }} title="Heading 1"><Heading1 size={16} /></button>
             <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`btn btn-secondary ${editor.isActive('heading', { level: 2 }) ? 'active-tool' : ''}`} style={{ padding: '6px' }} title="Heading 2"><Heading2 size={16} /></button>
             <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-color)', margin: '0 4px' }}></div>
             
             <button onClick={() => editor.chain().focus().toggleCodeBlock().run()} className={`btn btn-secondary ${editor.isActive('codeBlock') ? 'active-tool' : ''}`} style={{ padding: '6px' }} title="Code Block"><Code size={16} /></button>
             <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-color)', margin: '0 4px' }}></div>
             
             {/* Admonitions & Visual Blocks */}
             <button onClick={() => editor.chain().focus().toggleAdmonition('note').run()} className={`btn btn-secondary ${editor.isActive('admonition', { type: 'note' }) ? 'active-tool' : ''}`} style={{ padding: '6px', color: 'var(--info-color, #3b82f6)' }} title="Note Box"><Info size={16} /></button>
             <button onClick={() => editor.chain().focus().toggleAdmonition('tip').run()} className={`btn btn-secondary ${editor.isActive('admonition', { type: 'tip' }) ? 'active-tool' : ''}`} style={{ padding: '6px', color: 'var(--success-color, #10b981)' }} title="Tip Box"><Lightbulb size={16} /></button>
             <button onClick={() => editor.chain().focus().toggleAdmonition('warning').run()} className={`btn btn-secondary ${editor.isActive('admonition', { type: 'warning' }) ? 'active-tool' : ''}`} style={{ padding: '6px', color: 'var(--warning-color, #f59e0b)' }} title="Warning Box"><AlertTriangle size={16} /></button>
             <button onClick={() => editor.chain().focus().toggleAdmonition('danger').run()} className={`btn btn-secondary ${editor.isActive('admonition', { type: 'danger' }) ? 'active-tool' : ''}`} style={{ padding: '6px', color: 'var(--error-color, #ef4444)' }} title="Danger Box"><AlertOctagon size={16} /></button>
             
             <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-color)', margin: '0 4px' }}></div>
             <button onClick={() => editor.chain().focus().toggleMermaid().run()} className={`btn btn-secondary ${editor.isActive('mermaid') ? 'active-tool' : ''}`} style={{ padding: '6px' }} title="Mermaid Diagram">
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.29 7.03 12 12.03 20.71 7.03"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
             </button>
             <button onClick={() => editor.chain().focus().toggleMath().run()} className={`btn btn-secondary ${editor.isActive('math') ? 'active-tool' : ''}`} style={{ padding: '6px' }} title="Math Formula (LaTeX)">
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m19 5-3-3-3 3"/><path d="m13 19 3 3 3-3"/><path d="M16 2v20"/><path d="M2 13.5v-3c0-1.1.9-2 2-2h1.5a1.5 1.5 0 0 0 1-2.4L2 2h7"/></svg>
             </button>
             <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-color)', margin: '0 4px' }}></div>

             <button onClick={() => editor.chain().focus().toggleBlockquote().run()} className={`btn btn-secondary ${editor.isActive('blockquote') ? 'active-tool' : ''}`} style={{ padding: '6px' }} title="Quote"><Quote size={16} /></button>
             <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={`btn btn-secondary ${editor.isActive('bulletList') ? 'active-tool' : ''}`} style={{ padding: '6px' }} title="Bullet List"><List size={16} /></button>
             <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`btn btn-secondary ${editor.isActive('orderedList') ? 'active-tool' : ''}`} style={{ padding: '6px' }} title="Numbered List"><ListOrdered size={16} /></button>
             <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-color)', margin: '0 4px' }}></div>
             <button onClick={() => {
                const url = window.prompt("Enter image URL:");
                if (url) {
                  editor.chain().focus().setImage({ src: url }).run();
                }
             }} className="btn btn-secondary" style={{ padding: '6px' }} title="Add Image">
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
             </button>
             
             <div style={{ flex: 1 }}></div>
             
             {/* Text Tools */}
             <div style={{ display: 'flex', gap: '8px', position: 'relative' }}>
               <button 
                 onClick={() => {
                   setShowTypography(!showTypography);
                   setShowSearch(false);
                 }} 
                 className={`btn btn-secondary ${showTypography ? 'active-tool' : ''}`} 
                 style={{ padding: '6px' }} 
                 title="Typography"
               >
                 <Type size={16} />
               </button>
               <button 
                 onClick={() => {
                   setShowSearch(!showSearch);
                   setShowTypography(false);
                 }} 
                 className={`btn btn-secondary ${showSearch ? 'active-tool' : ''}`} 
                 style={{ padding: '6px' }} 
                 title="Find and Replace"
               >
                 <Search size={16} />
               </button>
               
               {/* Typography Dropdown */}
               {showTypography && (
                 <div style={{ position: 'absolute', top: '100%', right: '40px', marginTop: '8px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '16px', boxShadow: 'var(--shadow-lg)', zIndex: 100, minWidth: '240px' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                     <h4 style={{ fontSize: '14px', fontWeight: 600 }}>Typography</h4>
                     <button onClick={() => setShowTypography(false)} className="btn btn-secondary" style={{ padding: '4px' }}><X size={14} /></button>
                   </div>
                   
                   <div className="form-group" style={{ marginBottom: '12px' }}>
                     <label className="form-label">Font Family</label>
                     <select 
                       className="input" 
                       value={fontFamily} 
                       onChange={e => {
                         setFontFamily(e.target.value);
                         updateSettings({ fontFamily: e.target.value });
                       }}
                       style={{ width: '100%', fontSize: '13px', padding: '6px 10px' }}
                     >
                       <option value="var(--font-sans)">Sans-serif</option>
                       <option value="'Times New Roman', Times, serif">Times New Roman</option>
                       <option value="ui-serif, Georgia, Cambria, Times, serif">Serif (e.g. Merriweather)</option>
                       <option value="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace">Monospace</option>
                     </select>
                   </div>
                   
                   <div className="form-group" style={{ marginBottom: '12px' }}>
                     <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                       <span>Font Size</span>
                       <span>{fontSize}px</span>
                     </label>
                     <input 
                       type="range" 
                       min="12" 
                       max="32" 
                       value={fontSize} 
                       onChange={e => {
                         const val = parseInt(e.target.value);
                         setFontSize(val);
                         updateSettings({ fontSize: val });
                       }}
                       style={{ width: '100%' }}
                     />
                   </div>
                   
                   <div className="form-group" style={{ marginBottom: '8px' }}>
                     <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                       <span>Line Height</span>
                       <span>{lineHeight}</span>
                     </label>
                     <input 
                       type="range" 
                       min="1" 
                       max="2.5" 
                       step="0.1"
                       value={lineHeight} 
                       onChange={e => {
                         const val = parseFloat(e.target.value);
                         setLineHeight(val);
                         updateSettings({ lineHeight: val });
                       }}
                       style={{ width: '100%' }}
                     />
                   </div>
                 </div>
               )}
             </div>
           </div>
         )}
         
         {/* Search & Replace Bar */}
         {showSearch && !focusMode && (
           <div style={{ display: 'flex', gap: '8px', padding: '8px 24px', backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', alignItems: 'center' }}>
             <Search size={14} color="var(--text-secondary)" />
             <input 
               type="text" 
               className="input" 
               placeholder="Find..." 
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
               style={{ padding: '4px 8px', fontSize: '13px', width: '200px' }}
             />
             <input 
               type="text" 
               className="input" 
               placeholder="Replace with..." 
               value={replaceTerm}
               onChange={e => setReplaceTerm(e.target.value)}
               style={{ padding: '4px 8px', fontSize: '13px', width: '200px' }}
             />
             <button 
               className="btn btn-secondary" 
               style={{ padding: '4px 12px', fontSize: '12px' }}
               onClick={() => {
                 if (!editor || !searchTerm) return;
                 // Tiptap doesn't have a native global search and replace without an extension.
                 // We can manually manipulate the HTML as a quick workaround, or use prose-mirror methods.
                 // The simplest robust workaround for text replacement without a custom plugin:
                 const text = editor.getHTML();
                 // regex to replace term keeping case sensitivity logic, simple global replace for now
                 // taking care of HTML tags is tricky, this is a basic naive replace for plain usage
                 const escapedSearch = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                 const regex = new RegExp(`(?![^<]*>)(${escapedSearch})`, 'g'); // Replace only outside HTML tags
                 
                 const newContent = text.replace(regex, replaceTerm);
                 editor.commands.setContent(newContent);
               }}
             >
               Replace All
             </button>
             <div style={{ flex: 1 }}></div>
             <button onClick={() => setShowSearch(false)} className="btn btn-secondary" style={{ padding: '4px' }}><X size={14} /></button>
           </div>
         )}
         
         <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: focusMode ? "48px" : "0px", overflow: "hidden", position: "relative" }}>
           
           {/* Revision History Panel */}
           {showHistory && (
             <div style={{
               position: "absolute",
               top: 0, bottom: 0, right: 0,
               width: "300px",
               backgroundColor: "var(--bg-secondary)",
               borderLeft: "1px solid var(--border-color)",
               zIndex: 40,
               display: "flex",
               flexDirection: "column",
               boxShadow: "-4px 0 15px rgba(0,0,0,0.1)"
             }}>
               <div style={{ padding: "16px", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                 <h3 style={{ fontSize: "14px", fontWeight: 600 }}>Snapshots</h3>
                 <button className="btn btn-secondary" style={{ padding: "4px 8px", fontSize: "12px" }} onClick={() => {
                   const name = window.prompt("Enter a name for this snapshot (e.g., 'Draft 1', 'Before Edits'):");
                   if (name !== null) {
                     saveSnapshot(name || undefined);
                   }
                 }}>Take Now</button>
               </div>
               <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
                 {loadingHistory ? (
                   <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>Loading...</div>
                 ) : history.length === 0 ? (
                   <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>No snapshots. Save chapter to auto-create one.</div>
                 ) : (
                   <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                     {history.map(snap => {
                        const currentText = getRawTextFromHTML(content || "");
                        const snapText = getRawTextFromHTML(snap.content || "");
                        const diffLog = diff.diffWords(snapText, currentText);

                        return (
                          <div key={snap.id} className="card" style={{ padding: "12px", border: "1px solid var(--border-color)", cursor: "default" }}>
                            <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ fontWeight: snap.name ? 600 : 400, color: snap.name ? "var(--text-primary)" : "var(--text-secondary)" }}>
                                {snap.name || "Auto-save"}
                              </span>
                              <span>{new Date(snap.createdAt).toLocaleString()}</span>
                            </div>
                            <div style={{ 
                               fontSize: "12px", 
                               overflow: "hidden", 
                               display: "-webkit-box", 
                               WebkitLineClamp: 4, 
                               WebkitBoxOrient: "vertical", 
                               marginBottom: "12px",
                               lineHeight: 1.4,
                               backgroundColor: "var(--bg-primary)",
                               padding: "8px",
                               borderRadius: "var(--radius-sm)"
                            }}>
                              {diffLog.map((part, index) => (
                                <span key={index} style={{ 
                                  backgroundColor: part.added ? "rgba(34, 197, 94, 0.2)" : part.removed ? "rgba(239, 68, 68, 0.2)" : "transparent",
                                  color: part.added ? "#4ade80" : part.removed ? "#f87171" : "var(--text-muted)",
                                  textDecoration: part.removed ? "line-through" : "none"
                                }}>
                                  {part.value}
                                </span>
                              ))}
                              {snapText === currentText && <span style={{color: "var(--text-muted)"}}>No changes.</span>}
                            </div>
                            <button 
                              className="btn btn-secondary" 
                              style={{ width: "100%", padding: "4px 0", fontSize: "12px", display: "flex", justifyContent: "center" }}
                              onClick={() => {
                                if (confirm("Restore this snapshot? Current unsaved changes will be lost.")) {
                                  setContent(snap.content || "");
                                  editor?.commands.setContent(snap.content || "");
                                  setShowHistory(false);
                                }
                              }}
                            >
                              <RotateCcw size={12} style={{ marginRight: "4px" }} /> Restore
                            </button>
                          </div>
                        );
                      })}
                   </div>
                 )}
               </div>
             </div>
           )}

           {/* Goals Panel */}
           {showGoals && !focusMode && (
             <div style={{
               position: "absolute",
               top: 0, bottom: 0, right: 0,
               width: "300px",
               backgroundColor: "var(--bg-secondary)",
               borderLeft: "1px solid var(--border-color)",
               zIndex: 40,
               display: "flex",
               flexDirection: "column",
               boxShadow: "-4px 0 15px rgba(0,0,0,0.1)",
               padding: "24px"
             }}>
                <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "24px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Target size={18} color="var(--accent-color)" /> Daily Word Goal
                </h3>
                
                <div style={{ marginBottom: "24px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "8px" }}>
                    <span style={{ color: "var(--text-secondary)" }}>Progress Today</span>
                    <span style={{ fontWeight: "bold" }}>{todayProgress} / {goals.target}</span>
                  </div>
                  <div style={{ width: "100%", height: "8px", backgroundColor: "var(--bg-tertiary)", borderRadius: "4px", overflow: "hidden" }}>
                    <div style={{ width: `${progressPercent}%`, height: "100%", backgroundColor: progressPercent >= 100 ? "var(--success-color, #22c55e)" : "var(--accent-color)", transition: "width 0.3s ease" }}></div>
                  </div>
                  {progressPercent >= 100 && (
                     <p style={{ color: "var(--success-color, #22c55e)", fontSize: "12px", marginTop: "8px", textAlign: "center" }}>Goal reached! Great job 🌟</p>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Set Daily Target</label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input 
                      type="number" 
                      className="input" 
                      value={goals.target}
                      onChange={e => {
                         const val = parseInt(e.target.value) || 0;
                         setGoals(prev => ({ ...prev, target: val }));
                      }}
                    />
                    <button 
                      className="btn btn-primary"
                      onClick={() => {
                        updateGoals(goals.target);
                        alert("Goal updated");
                      }}
                    >
                      Save
                    </button>
                  </div>
                </div>
             </div>
           )}

           {/* Vocabulary Panel */}
           {showVocab && !focusMode && (
             <div style={{
               position: "absolute",
               top: 0, bottom: 0, right: 0,
               width: "300px",
               backgroundColor: "var(--bg-secondary)",
               borderLeft: "1px solid var(--border-color)",
               zIndex: 40,
               display: "flex",
               flexDirection: "column",
               boxShadow: "-4px 0 15px rgba(0,0,0,0.1)",
               padding: "24px"
             }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                  <h3 style={{ fontSize: "16px", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}>
                    <BookOpenText size={18} color="var(--accent-color)" /> Vocabulary Analysis
                  </h3>
                  <button onClick={() => setShowVocab(false)} className="btn btn-secondary" style={{ padding: '4px' }}><X size={14} /></button>
                </div>

                <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "16px", lineHeight: 1.5 }}>
                  Words used most frequently in the text (excluding common stop words). High counts might indicate repetition.
                </p>
                
                <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
                  {vocabData.length === 0 ? (
                    <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>Not enough text to analyze.</div>
                  ) : vocabData.map((v, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", alignItems: "center", backgroundColor: "var(--bg-tertiary)", padding: "8px 12px", borderRadius: "var(--radius-sm)" }}>
                      <span style={{ fontWeight: 500, color: v.count > 10 ? "var(--error-color, #ef4444)" : "var(--text-primary)" }}>{v.word}</span>
                      <span style={{ backgroundColor: "var(--bg-secondary)", padding: "2px 8px", borderRadius: "12px", fontSize: "11px" }}>{v.count}</span>
                    </div>
                  ))}
                </div>
             </div>
           )}

           {/* Scratchpad Panel */}
           {showScratchpad && !focusMode && (
             <div style={{
               position: "absolute",
               top: 0, bottom: 0, right: 0,
               width: "300px",
               backgroundColor: "var(--bg-secondary)",
               borderLeft: "1px solid var(--border-color)",
               zIndex: 40,
               display: "flex",
               flexDirection: "column",
               boxShadow: "-4px 0 15px rgba(0,0,0,0.1)"
             }}>
                <div style={{ padding: "16px", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={{ fontSize: "14px", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}>
                    <StickyNote size={16} color="var(--accent-color)" /> Scratchpad
                  </h3>
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "12px" }}>
                  <textarea 
                    className="input"
                    style={{ flex: 1, resize: "none", backgroundColor: "var(--bg-tertiary)", fontSize: "14px", lineHeight: 1.6 }}
                    placeholder="Jot down quick ideas, world-building facts, or scenes you want to remember..."
                    value={scratchpadText}
                    onChange={e => {
                      setScratchpadText(e.target.value);
                      updateScratchpad(e.target.value);
                    }}
                  />
                </div>
             </div>
           )}
           
           {/* Floating Toolbar */}
           {selection && (
             <div style={{
               position: "absolute",
               top: "16px",
               left: "50%",
               transform: "translateX(-50%)",
               backgroundColor: "var(--bg-tertiary)",
               padding: "8px",
               borderRadius: "var(--radius-lg)",
               boxShadow: "var(--shadow-lg)",
               display: "flex",
               gap: "8px",
               zIndex: 50,
               border: "1px solid var(--accent-light)"
             }}>
               {toolLoading ? (
                 <span style={{ padding: "4px 12px", fontSize: "14px", color: "var(--text-secondary)" }}>AI is rewriting...</span>
               ) : (
                 <>
                   <button className="btn btn-secondary" style={{ padding: "6px 12px", fontSize: "13px" }} onClick={() => applyTextTool("expand")}>Expand</button>
                   <button className="btn btn-secondary" style={{ padding: "6px 12px", fontSize: "13px" }} onClick={() => applyTextTool("rewrite")}>Rewrite</button>
                   <button className="btn btn-secondary" style={{ padding: "6px 12px", fontSize: "13px" }} onClick={() => applyTextTool("summarize")}>Summarize</button>
                   <button className="btn btn-secondary" style={{ padding: "6px 12px", fontSize: "13px" }} onClick={() => applyTextTool("grammar-check")}>Check Grammar</button>
                   <button className="btn btn-secondary" style={{ padding: "6px 12px", fontSize: "13px", color: "var(--danger-color)", borderColor: "var(--danger-color)" }} onClick={() => setSelection(null)}>X</button>
                 </>
               )}
             </div>
           )}

            {selectedChapterId ? (
              <div style={{ flex: 1, overflowY: "auto", position: 'relative', backgroundColor: 'var(--bg-secondary)' }}>
                 <EditorContent editor={editor} style={{ minHeight: "100%", width: '100%', outline: 'none' }} />
              </div>
            ) : (
               <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
                 Select or create a chapter to start writing.
               </div>
            )}
           
           {focusMode && (
             <div style={{ position: "absolute", top: "24px", right: "24px", display: "flex", gap: "8px", zIndex: 10 }}>
                <button 
                   className="btn btn-secondary" 
                   style={{ padding: "8px", borderRadius: "50%", opacity: ambientSound === 'rain' ? 1 : 0.5, backgroundColor: ambientSound === 'rain' ? 'var(--accent-light)' : 'var(--bg-secondary)' }}
                   onClick={() => toggleSound('rain')}
                   title="Rain Sounds"
                >
                   {ambientSound === 'rain' ? <Square size={16} color="var(--accent-color)" /> : <Play size={16} />}
                </button>
                <button 
                   className="btn btn-secondary" 
                   style={{ padding: "8px", borderRadius: "50%", opacity: ambientSound === 'cafe' ? 1 : 0.5, backgroundColor: ambientSound === 'cafe' ? 'var(--accent-light)' : 'var(--bg-secondary)' }}
                   onClick={() => toggleSound('cafe')}
                   title="Cafe Sounds"
                >
                   {ambientSound === 'cafe' ? <Square size={16} color="var(--accent-color)" /> : <Settings2 size={16} />} 
                </button>
             </div>
           )}

           <div style={{ 
              position: "absolute", 
              bottom: focusMode ? "24px" : "12px", 
              right: focusMode ? "48px" : "24px", 
              fontSize: "12px", 
              color: "var(--text-muted)", 
              backgroundColor: "var(--bg-secondary)", 
              padding: "4px 8px", 
              borderRadius: "12px", 
              opacity: 0.7,
              display: "flex",
              gap: "12px"
           }}>
             <span>{getWordCount()} words</span>
             {todayProgress > 0 && <span style={{ color: "var(--accent-color)" }}>+{sessionWordCount} today</span>}
           </div>
         </div>
      </div>

      {/* AI Assistant Chat Column - Hidden in Focus Mode */}
      {!focusMode && (
        <div style={{ width: "350px", borderLeft: "1px solid var(--border-color)", display: "flex", flexDirection: "column", backgroundColor: "var(--bg-secondary)" }}>
           <div style={{ padding: "16px", borderBottom: "1px solid var(--border-color)", display: "flex", alignItems: "center", gap: "8px" }}>
             <Bot size={20} color="var(--accent-color)" />
             <h2 style={{ fontSize: "16px", fontWeight: 500 }}>AI Assistant</h2>
           </div>
           
           {/* Chat Feed */}
           <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
              {chatHistory.length === 0 ? (
                <div style={{ textAlign: "center", marginTop: "40px", color: "var(--text-muted)" }}>
                   <Bot size={40} style={{ opacity: 0.5, margin: "0 auto 16px" }} />
                   <p style={{ fontSize: "14px" }}>Ask the assistant to generate dialogue, describe scenes, or brainstorm ideas based on your outline.</p>
                </div>
              ) : chatHistory.map((msg, i) => (
                <div key={i} style={{ display: "flex", gap: "12px", flexDirection: msg.role === "user" ? "row-reverse" : "row" }}>
                   <div style={{ 
                     width: "32px", height: "32px", borderRadius: "50%", 
                     backgroundColor: msg.role === "user" ? "var(--bg-tertiary)" : "rgba(99, 102, 241, 0.2)",
                     display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                   }}>
                      {msg.role === "user" ? <UserIcon size={16} /> : <Bot size={16} color="var(--accent-color)" />}
                   </div>
                   <div style={{ 
                     backgroundColor: msg.role === "user" ? "var(--bg-tertiary)" : "var(--bg-primary)",
                     padding: "12px 16px",
                     borderRadius: "var(--radius-lg)",
                     borderTopRightRadius: msg.role === "user" ? 0 : "var(--radius-lg)",
                     borderTopLeftRadius: msg.role === "assistant" ? 0 : "var(--radius-lg)",
                     fontSize: "14px",
                     lineHeight: 1.5,
                     color: "var(--text-primary)",
                     border: msg.role === "assistant" ? "1px solid var(--border-color)" : "none",
                     maxWidth: "85%"
                   }}>
                     <span style={{ whiteSpace: "pre-wrap" }}>{msg.content}</span>
                     
                     {msg.role === "assistant" && msg.content.trim() && !generating && (
                       <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                         <button 
                           className="btn btn-secondary" 
                           style={{ flex: 1, padding: "6px" }}
                           onClick={() => insertToEditor(msg.content)}
                         >
                           <Plus size={14} /> Insert
                         </button>
                         <button 
                           className="btn btn-secondary" 
                           style={{ padding: "6px" }}
                           onClick={() => {
                             navigator.clipboard.writeText(msg.content);
                             alert("Copied to clipboard!");
                           }}
                           title="Copy"
                         >
                           <Copy size={14} />
                         </button>
                       </div>
                     )}
                   </div>
                </div>
              ))}
              <div ref={chatEndRef} />
           </div>

           {/* Chat Input */}
           <div style={{ padding: "16px", borderTop: "1px solid var(--border-color)", backgroundColor: "var(--bg-primary)" }}>
               <div style={{ display: "flex", gap: "8px", position: "relative" }}>
                  <textarea 
                    className="input"
                    placeholder={generating ? "AI is typing..." : "Prompt the AI..."}
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendPrompt();
                      }
                    }}
                    disabled={generating}
                    style={{ minHeight: "80px", resize: "none", paddingRight: "48px" }}
                  />
                  <button 
                    style={{
                      position: "absolute",
                      bottom: "12px",
                      right: "12px",
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      backgroundColor: prompt.trim() && !generating ? "var(--accent-color)" : "var(--bg-tertiary)",
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: prompt.trim() && !generating ? "pointer" : "default",
                      transition: "all 0.2s"
                    }}
                    onClick={handleSendPrompt}
                    disabled={!prompt.trim() || generating}
                  >
                    <Send size={14} style={{ marginLeft: "2px" }} />
                  </button>
               </div>
               <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "8px", textAlign: "center" }}>
                 Shift + Enter for new line.
               </div>
           </div>
        </div>
      )}

    </div>
  );
}
