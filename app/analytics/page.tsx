"use client";

import { useEffect, useState } from "react";
import { getSettings, getGoals } from "@/lib/localStorageUtils";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { format, subDays } from "date-fns";

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [weeklyData, setWeeklyData] = useState<{name: string, words: number, fullDate: string}[]>([]);
  const [yearlyData, setYearlyData] = useState<{date: Date, dateStr: string, words: number, level: number}[]>([]);
  const [totalWords, setTotalWords] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);

  useEffect(() => {
    // Apply theme
    const savedTheme = getSettings().theme || 'dark';
    document.documentElement.className = savedTheme === 'dark' ? '' : `theme-${savedTheme}`;

    const goals = getGoals();
    const progress = goals.dailyProgress || {};

    // 1. Calculate Last 7 Days Data
    const today = new Date();
    const week: {name: string, words: number, fullDate: string}[] = [];
    let sumWeekly = 0;
    
    // We want to show from 6 days ago up to today
    for (let i = 6; i >= 0; i--) {
      const d = subDays(today, i);
      const dateStr = format(d, "yyyy-MM-dd");
      const words = progress[dateStr] || 0;
      week.push({
        name: format(d, "EEE"), // Mon, Tue, etc.
        words: words,
        fullDate: dateStr
      });
      sumWeekly += words;
    }
    setWeeklyData(week);

    // 2. Generate Heatmap Data (last 365 days approx)
    let totalAllTime = 0;
    let streak = 0;

    // We'll generate a full year of data points for the heatmap
    const yearGrid: {date: Date, dateStr: string, words: number, level: number}[] = [];
    for (let i = 364; i >= 0; i--) {
      const d = subDays(today, i);
      const dateStr = format(d, "yyyy-MM-dd");
      const words = progress[dateStr] || 0;
      yearGrid.push({
        date: d,
        dateStr: dateStr,
        words: words,
        level: getHeatmapLevel(words, goals.target)
      });
      totalAllTime += words;
    }

    // Calculate Streak (going backwards from today)
    for (let i = 0; i < 365; i++) {
        const d = subDays(today, i);
        const dateStr = format(d, "yyyy-MM-dd");
        const words = progress[dateStr] || 0;
        
        if (words > 0) {
            streak++;
        } else if (i === 0) {
            // It's okay if they haven't written *today* yet, we still check yesterday
            continue; 
        } else {
            break;
        }
    }

    setYearlyData(yearGrid);
    setTotalWords(totalAllTime);
    setCurrentStreak(streak);
    
    setLoading(false);
  }, []);

  // Helper to determine color intensity based on words written vs goal
  const getHeatmapLevel = (words: number, target: number) => {
    if (words === 0) return 0;
    if (words >= target) return 4;
    if (words >= target * 0.75) return 3;
    if (words >= target * 0.5) return 2;
    return 1;
  };

  if (loading) return <div className="page-container">Loading analytics...</div>;

  return (
    <div className="page-container">
      <h1 className="page-title">Writing Analytics</h1>
      <p className="page-description">Track your progress, consistency, and daily writing habits.</p>

      {/* Stats Overview */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "24px", marginBottom: "32px" }}>
        
        <div className="card" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px" }}>
            <span style={{ fontSize: "14px", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "1px" }}>Total Words</span>
            <span style={{ fontSize: "42px", fontWeight: "bold", color: "var(--accent-color)", marginTop: "8px" }}>{totalWords.toLocaleString()}</span>
        </div>

        <div className="card" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px" }}>
            <span style={{ fontSize: "14px", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "1px" }}>Current Streak</span>
            <span style={{ fontSize: "42px", fontWeight: "bold", color: "var(--success-color, #22c55e)", marginTop: "8px" }}>{currentStreak} <span style={{fontSize: "20px"}}>Days</span></span>
        </div>

        <div className="card" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px" }}>
            <span style={{ fontSize: "14px", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "1px" }}>Weekly Words</span>
            <span style={{ fontSize: "42px", fontWeight: "bold", color: "var(--primary-color, #3b82f6)", marginTop: "8px" }}>
                {weeklyData.reduce((acc, curr) => acc + curr.words, 0).toLocaleString()}
            </span>
        </div>

      </div>

      {/* Charts Section */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "24px", marginBottom: "32px" }}>
        
        <div className="card">
            <h3 style={{ marginBottom: "24px", fontSize: "18px" }}>Last 7 Days (Words Written)</h3>
            <div style={{ width: "100%", height: "300px" }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                        <XAxis dataKey="name" stroke="var(--text-muted)" tick={{fill: 'var(--text-secondary)', fontSize: 12}} axisLine={false} tickLine={false} />
                        <YAxis stroke="var(--text-muted)" tick={{fill: 'var(--text-secondary)', fontSize: 12}} axisLine={false} tickLine={false} />
                        <Tooltip 
                            cursor={{fill: 'transparent'}}
                            contentStyle={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}
                            itemStyle={{ color: 'var(--accent-color)' }}
                        />
                        <Bar dataKey="words" fill="var(--accent-color)" radius={[4, 4, 0, 0]} maxBarSize={50} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

      </div>

      {/* Heatmap Section */}
      <div className="card">
        <h3 style={{ marginBottom: "16px", fontSize: "18px" }}>Activity Heatmap (Last 365 Days)</h3>
        
        <div style={{ overflowX: "auto", paddingBottom: "16px" }}>
            <div style={{ display: "flex", gap: "4px", minWidth: "max-content", 
                backgroundColor: "var(--bg-tertiary)", padding: "16px", borderRadius: "12px", border: "1px solid var(--border-color)"
            }}>
                {/* Organize the linear yearlyData into weeks columns (approx 52 cols, 7 rows) */}
                {(() => {
                    const weeks: {date: Date, dateStr: string, words: number, level: number}[][] = [];
                    let currentWeek: {date: Date, dateStr: string, words: number, level: number}[] = [];
                    // Start from the oldest date. Group by 7 days.
                    // For a true GitHub heatmap, we should align to weekdays, but this approximation works well for custom dashboards.
                    yearlyData.forEach((day, index) => {
                        currentWeek.push(day);
                        if (currentWeek.length === 7 || index === yearlyData.length - 1) {
                            weeks.push(currentWeek);
                            currentWeek = [];
                        }
                    });

                    return weeks.map((week, wIndex) => (
                        <div key={wIndex} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            {week.map((day: {dateStr: string, words: number, level: number}, dIndex: number) => {
                                // Provide colors based on level (0-4)
                                // Level 0: Empty/Bg
                                // Level 1: Lightest
                                // ...
                                // Level 4: Darkest/Goal reached
                                let bgColor = "var(--bg-primary)";
                                if (day.level === 1) bgColor = "rgba(99, 102, 241, 0.3)";
                                if (day.level === 2) bgColor = "rgba(99, 102, 241, 0.5)";
                                if (day.level === 3) bgColor = "rgba(99, 102, 241, 0.8)";
                                if (day.level === 4) bgColor = "var(--accent-color)";

                                return (
                                    <div 
                                        key={dIndex}
                                        title={`${day.dateStr}: ${day.words} words`}
                                        style={{
                                            width: "12px",
                                            height: "12px",
                                            borderRadius: "2px",
                                            backgroundColor: bgColor,
                                            border: day.level === 0 ? "1px solid var(--border-color)" : "none",
                                            transition: "transform 0.1s",
                                            cursor: "pointer"
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.2)"}
                                        onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                                    />
                                );
                            })}
                            {/* Empty cells to pad out the last week if it doesn't have 7 days */}
                            {week.length < 7 && Array.from({length: 7 - week.length}).map((_, i) => (
                                <div key={`pad-${i}`} style={{ width: "12px", height: "12px" }} />
                            ))}
                        </div>
                    ));
                })()}
            </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "8px", marginTop: "12px", fontSize: "12px", color: "var(--text-secondary)" }}>
            <span>Less</span>
            <div style={{ width: "12px", height: "12px", backgroundColor: "var(--bg-primary)", border: "1px solid var(--border-color)", borderRadius: "2px" }} />
            <div style={{ width: "12px", height: "12px", backgroundColor: "rgba(99, 102, 241, 0.3)", borderRadius: "2px" }} />
            <div style={{ width: "12px", height: "12px", backgroundColor: "rgba(99, 102, 241, 0.6)", borderRadius: "2px" }} />
            <div style={{ width: "12px", height: "12px", backgroundColor: "var(--accent-color)", borderRadius: "2px" }} />
            <span>More</span>
        </div>
      </div>

    </div>
  );
}
