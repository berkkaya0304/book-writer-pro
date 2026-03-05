"use client";

import React, { useState, useEffect } from "react";
import { 
  DndContext, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  DragOverlay,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent
} from "@dnd-kit/core";
import { 
  SortableContext, 
  arrayMove, 
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";
import { getAllChapters, updateChapter, Chapter, getSettings } from "@/lib/localStorageUtils";
import { LayoutDashboard } from "lucide-react";

// Kanban Columns Definitions
const COLUMNS = [
  { id: "Idea", title: "Idea" },
  { id: "Outline", title: "Outline" },
  { id: "Drafting", title: "Drafting" },
  { id: "Review", title: "Review" },
  { id: "Done", title: "Done" }
];

// Reusable Sortable Card Component
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function SortableChapterCard({ chapter }: { chapter: Chapter }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: chapter.id,
    data: {
      type: "Chapter",
      chapter
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    cursor: 'grab',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`card ${isDragging ? "dragging" : ""}`}
      title={chapter.outline || "No outline available"}
    >
      <div style={{ fontSize: "14px", fontWeight: 500, marginBottom: "8px" }}>
        {chapter.title}
      </div>
      {(chapter.outline || chapter.content) && (
        <div style={{ fontSize: "12px", color: "var(--text-secondary)", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {chapter.outline || (chapter.content ? chapter.content.replace(/<[^>]+>/g, '').substring(0, 100) + '...' : '')}
        </div>
      )}
    </div>
  );
}

function Column({ col, chapters }: { col: { id: string, title: string }, chapters: Chapter[] }) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      backgroundColor: "var(--bg-secondary)",
      borderRadius: "var(--radius-lg)",
      width: "280px",
      minWidth: "280px",
      maxHeight: "100%",
      flexShrink: 0
    }}>
      <div style={{
        padding: "16px",
        borderBottom: "1px solid var(--border-color)",
        fontWeight: 600,
        fontSize: "14px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        {col.title}
        <span style={{ 
          backgroundColor: "var(--bg-tertiary)", 
          padding: "2px 8px", 
          borderRadius: "12px", 
          fontSize: "12px",
          color: "var(--text-secondary)"
        }}>
          {chapters.length}
        </span>
      </div>
      
      <div style={{ padding: "12px", flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px" }}>
        <SortableContext items={chapters.map(c => c.id)} strategy={verticalListSortingStrategy}>
          {chapters.map(c => (
             <SortableChapterCard key={c.id} chapter={c} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

export default function PlotPage() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [activeChapter, setActiveChapter] = useState<Chapter | null>(null);

  useEffect(() => {
    fetchChapters();
    // Apply theme
    const savedTheme = getSettings().theme || 'dark';
    document.documentElement.className = savedTheme === 'dark' ? '' : `theme-${savedTheme}`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchChapters = () => {
    setChapters(getAllChapters().map(c => ({
      ...c,
      status: c.status || "Idea"
    })));
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const chapter = chapters.find(c => c.id === active.id);
    if (chapter) setActiveChapter(chapter);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveAChapter = active.data.current?.type === "Chapter";
    const isOverAChapter = over.data.current?.type === "Chapter";

    if (!isActiveAChapter) return;

    // Moving a chapter over another chapter
    if (isActiveAChapter && isOverAChapter) {
      setChapters(prev => {
        const activeIndex = prev.findIndex(t => t.id === activeId);
        const overIndex = prev.findIndex(t => t.id === overId);
        
        // If they are in different columns, move the chapter to the new column
        if (prev[activeIndex].status !== prev[overIndex].status) {
           const newChapters = [...prev];
           newChapters[activeIndex].status = prev[overIndex].status;
           return arrayMove(newChapters, activeIndex, overIndex);
        }
        
        // Same column reordering
        return arrayMove(prev, activeIndex, overIndex);
      });
    }

    // Moving over a column directly (if no chapters inside)
    const isOverAColumn = COLUMNS.some(c => c.id === overId);
    if (isActiveAChapter && isOverAColumn) {
       setChapters(prev => {
         const activeIndex = prev.findIndex(t => t.id === activeId);
         const newChapters = [...prev];
         newChapters[activeIndex].status = overId as string;
         return arrayMove(newChapters, activeIndex, activeIndex); // keeps it in place just changes status
       });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveChapter(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) {
      // Still need to trigger save incase status changed in DragOver but didn't actually swap index
      const updatedChapter = chapters.find(c => c.id === activeId);
      if (updatedChapter) {
        updateChapter(updatedChapter.id, { status: updatedChapter.status });
      }
      return;
    }

    const activeIndex = chapters.findIndex(t => t.id === activeId);
    const updatedChapter = chapters[activeIndex];

    // Save status change + reordering
    updateChapter(updatedChapter.id, { status: updatedChapter.status, order: activeIndex });
    
    // We update all orders simply to reflect the array move in localstorage
    chapters.forEach((c, i) => updateChapter(c.id, { order: i }));
  };

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <LayoutDashboard /> Plot Board
      </h1>
      <p className="page-description" style={{ flexShrink: 0 }}>Drag and drop chapters to visually track their progress from Idea to Done.</p>

      <div style={{ 
        flex: 1, 
        overflowX: "auto", 
        overflowY: "hidden", 
        paddingBottom: "16px",
        display: "flex"
      }}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div style={{ display: "flex", gap: "24px", height: "100%" }}>
            {COLUMNS.map(col => (
              <SortableContext key={col.id} items={[col.id]} strategy={verticalListSortingStrategy} id={col.id}>
                <Column 
                  col={col} 
                  chapters={chapters.filter(c => c.status === col.id)} 
                />
              </SortableContext>
            ))}
          </div>

          <DragOverlay>
            {activeChapter ? (
              <SortableChapterCard chapter={activeChapter} />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
