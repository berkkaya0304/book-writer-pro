"use client";

import { useEffect, useState } from "react";
import { getAllChapters, Chapter, getAllCalendarItems, createCalendarItem, deleteCalendarItem, CalendarItem, getSettings } from "@/lib/localStorageUtils";
import { Calendar, Plus, Trash2, Clock, CheckSquare, AlertTriangle, ChevronDown } from "lucide-react";

function daysDiff(deadline: string) {
  const d = new Date(deadline);
  const now = new Date();
  d.setHours(0,0,0,0); now.setHours(0,0,0,0);
  return Math.round((d.getTime() - now.getTime()) / 86400000);
}

function DeadlineBadge({ deadline }: { deadline: string }) {
  const diff = daysDiff(deadline);
  const color = diff < 0 ? "var(--danger-color)" : diff <= 3 ? "#f59e0b" : diff <= 7 ? "#6366f1" : "#22c55e";
  const bg = diff < 0 ? "rgba(239,68,68,0.15)" : diff <= 3 ? "rgba(245,158,11,0.15)" : diff <= 7 ? "rgba(99,102,241,0.15)" : "rgba(34,197,94,0.15)";
  const label = diff < 0 ? `${Math.abs(diff)}d overdue` : diff === 0 ? "Today!" : `${diff}d left`;
  return <span style={{ background: bg, color, padding: "2px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: 700 }}>{label}</span>;
}

interface ChapterWithCalendar extends Chapter {
  calendarItem?: CalendarItem;
}

export default function CalendarPage() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [calendarItems, setCalendarItems] = useState<CalendarItem[]>([]);
  const [editingChapterId, setEditingChapterId] = useState<string>("");
  const [deadline, setDeadline] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [selectedChapterId, setSelectedChapterId] = useState<string>("");

  useEffect(() => {
    const savedTheme = getSettings().theme || "dark";
    document.documentElement.className = savedTheme === "dark" ? "" : `theme-${savedTheme}`;
    setChapters(getAllChapters());
    setCalendarItems(getAllCalendarItems());
  }, []);

  function refresh() { setCalendarItems(getAllCalendarItems()); }

  function handleSave() {
    if (!editingChapterId || !deadline) return;
    createCalendarItem(editingChapterId, deadline, note.trim());
    setEditingChapterId(""); setDeadline(""); setNote("");
    refresh();
  }

  function handleRemove(chapterId: string) {
    deleteCalendarItem(chapterId);
    refresh();
  }

  const calendarMap = Object.fromEntries(calendarItems.map(i => [i.chapterId, i]));

  const chaptersWithCalendar: ChapterWithCalendar[] = chapters.map(c => ({
    ...c, calendarItem: calendarMap[c.id]
  }));

  const withDeadline = chaptersWithCalendar.filter(c => c.calendarItem).sort((a, b) => (a.calendarItem!.deadline).localeCompare(b.calendarItem!.deadline));
  const withoutDeadline = chaptersWithCalendar.filter(c => !c.calendarItem);

  const overdue = withDeadline.filter(c => daysDiff(c.calendarItem!.deadline) < 0).length;
  const today = withDeadline.filter(c => daysDiff(c.calendarItem!.deadline) === 0).length;
  const upcoming = withDeadline.filter(c => daysDiff(c.calendarItem!.deadline) > 0).length;

  const chaptersWithoutDeadline = chapters.filter(c => !calendarMap[c.id]);

  return (
    <div className="page-container">
      <h1 className="page-title">Content Calendar</h1>
      <p className="page-description">Set deadlines for chapters and track progress visually.</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "24px" }}>
        {/* Form */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="card" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <h2 style={{ fontSize: "16px", display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
              <Plus size={18} color="var(--accent-color)" /> Set Deadline
            </h2>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Chapter</label>
              <div style={{ position: "relative" }}>
                <select className="input" value={editingChapterId} onChange={e => setEditingChapterId(e.target.value)} style={{ appearance: "none", paddingRight: "36px" }}>
                  <option value="">Select chapter…</option>
                  {chaptersWithoutDeadline.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  {chaptersWithoutDeadline.length === 0 && chapters.map(c => <option key={c.id} value={c.id}>{c.title} (update)</option>)}
                </select>
                <ChevronDown size={16} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--text-muted)" }} />
              </div>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Deadline</label>
              <input type="date" className="input" value={deadline} onChange={e => setDeadline(e.target.value)} />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Note (optional)</label>
              <input className="input" placeholder="e.g. 'Needs technical review first'" value={note} onChange={e => setNote(e.target.value)} />
            </div>

            <button className="btn btn-primary" onClick={handleSave} disabled={!editingChapterId || !deadline}>
              <Calendar size={16} /> Set Deadline
            </button>
          </div>

          {/* Summary Stats */}
          <div className="card" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <h3 style={{ fontSize: "14px", margin: 0, color: "var(--text-secondary)" }}>Summary</h3>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
              <span style={{ color: "var(--danger-color)", display: "flex", alignItems: "center", gap: "4px" }}>
                <AlertTriangle size={13} /> Overdue
              </span>
              <strong style={{ color: "var(--danger-color)" }}>{overdue}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
              <span style={{ color: "#f59e0b", display: "flex", alignItems: "center", gap: "4px" }}>
                <Clock size={13} /> Due Today
              </span>
              <strong style={{ color: "#f59e0b" }}>{today}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
              <span style={{ color: "#22c55e", display: "flex", alignItems: "center", gap: "4px" }}>
                <CheckSquare size={13} /> Upcoming
              </span>
              <strong style={{ color: "#22c55e" }}>{upcoming}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "var(--text-muted)" }}>
              <span>No deadline</span>
              <strong>{withoutDeadline.length}</strong>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="card">
          <h2 style={{ fontSize: "16px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Calendar size={18} color="var(--accent-color)" /> Chapter Timeline
          </h2>

          {withDeadline.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text-muted)" }}>
              <Calendar size={48} style={{ margin: "0 auto 12px auto", display: "block", opacity: 0.3 }} />
              No deadlines set yet. Add one from the left panel.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {withDeadline.map(c => {
                const item = c.calendarItem!;
                const diff = daysDiff(item.deadline);
                return (
                  <div key={c.id} style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px 16px",
                    borderRadius: "var(--radius-sm)",
                    background: "var(--bg-tertiary)",
                    borderLeft: `3px solid ${diff < 0 ? "var(--danger-color)" : diff <= 3 ? "#f59e0b" : "#22c55e"}`
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: "14px" }}>{c.title}</div>
                      <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                        📅 {new Date(item.deadline).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                        {item.note && <span style={{ marginLeft: "8px" }}>· {item.note}</span>}
                      </div>
                    </div>
                    <DeadlineBadge deadline={item.deadline} />
                    <button
                      className="btn btn-secondary"
                      style={{ padding: "4px 8px", color: "var(--danger-color)", borderColor: "transparent" }}
                      onClick={() => handleRemove(c.id)}
                      title="Remove deadline"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {withoutDeadline.length > 0 && (
            <div style={{ marginTop: "24px" }}>
              <h3 style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "10px" }}>No deadline assigned</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {withoutDeadline.map(c => (
                  <div key={c.id} style={{ padding: "8px 12px", borderRadius: "var(--radius-sm)", background: "var(--bg-tertiary)", fontSize: "13px", color: "var(--text-muted)", display: "flex", justifyContent: "space-between" }}>
                    <span>{c.title}</span>
                    <button className="btn btn-secondary" style={{ padding: "2px 10px", fontSize: "11px" }} onClick={() => { setEditingChapterId(c.id); setSelectedChapterId(c.id); }}>
                      Set
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {selectedChapterId && <span style={{display:"none"}}>{selectedChapterId}</span>}
        </div>
      </div>
    </div>
  );
}
