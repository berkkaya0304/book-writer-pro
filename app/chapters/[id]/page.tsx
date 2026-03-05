"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, FileText } from "lucide-react";
import Link from "next/link";
import { getChapter, updateChapter, Chapter } from "@/lib/localStorageUtils";

export default function ChapterEditor({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [chapter, setChapter] = useState<Partial<Chapter>>({
    title: "",
    outline: "",
    content: ""
  });

  useEffect(() => {
    const fetchChapter = () => {
      try {
        const data = getChapter(id);
        if (data) {
          setChapter(data);
        } else {
          router.push("/chapters");
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchChapter();
  }, [id, router]);

  const handleSave = () => {
    setSaving(true);
    try {
      updateChapter(id, chapter);
      alert("Chapter saved!");
    } catch (e) {
      console.error(e);
      alert("Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setChapter(prev => ({ ...prev, [name]: value }));
  };

  if (loading) return <div className="page-container">Loading...</div>;

  return (
    <div className="page-container" style={{ display: "flex", flexDirection: "column", height: "100%", paddingBottom: "32px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "32px", flexShrink: 0 }}>
        <Link href="/chapters" className="btn btn-secondary" style={{ padding: "8px" }}>
          <ArrowLeft size={18} />
        </Link>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Edit Chapter Structure</h1>
        <div style={{ flex: 1 }}></div>
        <Link href={`/write?chapterId=${id}`} className="btn btn-secondary">
          <FileText size={18} /> Write Outline in Editor
        </Link>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          <Save size={18} /> {saving ? "Saving..." : "Save Chapter"}
        </button>
      </div>

      <div className="card" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div className="form-group">
          <label className="form-label">Chapter Title</label>
          <input 
            name="title"
            type="text" 
            className="input" 
            value={chapter.title || ""}
            onChange={handleChange}
            placeholder="e.g. Chapter 1: The Awakening"
          />
        </div>

        <div className="form-group" style={{ flex: 1, display: "flex", flexDirection: "column", marginBottom: 0 }}>
          <label className="form-label">Chapter Outline (Plan what happens here)</label>
          <textarea 
            name="outline"
            className="input" 
            value={chapter.outline || ""}
            onChange={handleChange}
            placeholder="Briefly describe the events of this chapter. The AI will use this as context when writing."
            style={{ flex: 1, minHeight: "200px", resize: "none" }}
          />
        </div>
      </div>
    </div>
  );
}
