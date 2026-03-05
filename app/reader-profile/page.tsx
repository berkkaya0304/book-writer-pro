"use client";

import { useEffect, useState } from "react";
import { Users, Sparkles, Tag, X, Save, Brain } from "lucide-react";
import { getReaderProfile, updateReaderProfile, ReaderProfile, getSettings } from "@/lib/localStorageUtils";

const INTEREST_SUGGESTIONS = [
  'Fantasy', 'Science Fiction', 'Mystery', 'Romance', 'Thriller', 'Horror',
  'Historical Fiction', 'Non-fiction', 'Self-help', 'Biography', 'Science',
  'Technology', 'Philosophy', 'Psychology', 'Business', 'Travel', 'Poetry',
  'Children', 'Young Adult', 'Literary Fiction', 'Adventure', 'Dystopian'
];

const AGE_RANGES = ['Under 18', '18-25', '26-35', '36-50', '51-65', '65+'];
const READING_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

export default function ReaderProfilePage() {
  const [profile, setProfile] = useState<ReaderProfile>({
    ageRange: '26-35',
    readingLevel: 'Intermediate',
    interests: [],
    goals: '',
    preferredLanguage: 'English',
  });
  const [saved, setSaved] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    const savedTheme = getSettings().theme || 'dark';
    document.documentElement.className = savedTheme === 'dark' ? '' : `theme-${savedTheme}`;
    const p = getReaderProfile();
    if (p) setProfile(p);
  }, []);

  const handleSave = () => {
    updateReaderProfile(profile);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const addInterest = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !profile.interests.includes(trimmed)) {
      setProfile(p => ({ ...p, interests: [...p.interests, trimmed] }));
    }
    setTagInput('');
  };

  const removeInterest = (tag: string) => {
    setProfile(p => ({ ...p, interests: p.interests.filter(i => i !== tag) }));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addInterest(tagInput);
    }
  };

  const getAISuggestions = async () => {
    setAiLoading(true);
    setAiSuggestion('');

    const ollamaUrl = localStorage.getItem('ollamaUrl') || 'http://127.0.0.1:11434';
    const model = localStorage.getItem('defaultModel') || 'llama3';

    const prompt = `You are a writing coach. Based on the following reader profile, give 5 specific writing tips and style suggestions for the author.

Reader Profile:
- Age Range: ${profile.ageRange}
- Reading Level: ${profile.readingLevel}
- Interests: ${profile.interests.join(', ') || 'General'}
- Reader Goals: ${profile.goals || 'Not specified'}
- Preferred Language: ${profile.preferredLanguage}

Provide concrete, actionable suggestions. Be concise. Format as a numbered list.`;

    try {
      const res = await fetch(`${ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, prompt, stream: false }),
      });
      const data = await res.json();
      setAiSuggestion(data.response || 'No suggestions generated.');
    } catch (e) {
      console.error(e);
      setAiSuggestion('Could not connect to Ollama. Please ensure it is running on your machine.');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Reader Profile</h1>
      <p className="page-description">Define your target audience so you can tailor your writing style and get personalized AI suggestions.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

        {/* Profile Form */}
        <div className="card">
          <h2 style={{ fontSize: '18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={20} color="var(--accent-color)" /> Audience Profile
          </h2>

          {/* Age Range */}
          <div className="form-group">
            <label className="form-label">Target Age Range</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {AGE_RANGES.map(range => (
                <button
                  key={range}
                  onClick={() => setProfile(p => ({ ...p, ageRange: range }))}
                  className={`btn ${profile.ageRange === range ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '6px 14px', fontSize: '13px' }}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          {/* Reading Level */}
          <div className="form-group">
            <label className="form-label">Reading Level</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {READING_LEVELS.map(level => (
                <button
                  key={level}
                  onClick={() => setProfile(p => ({ ...p, readingLevel: level }))}
                  className={`btn ${profile.readingLevel === level ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1, justifyContent: 'center', fontSize: '13px', padding: '8px' }}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Preferred Language */}
          <div className="form-group">
            <label className="form-label">Preferred Language</label>
            <select
              className="input"
              value={profile.preferredLanguage}
              onChange={e => setProfile(p => ({ ...p, preferredLanguage: e.target.value }))}
            >
              <option>English</option>
              <option>Turkish (Türkçe)</option>
              <option>Spanish (Español)</option>
              <option>French (Français)</option>
              <option>German (Deutsch)</option>
              <option>Arabic (العربية)</option>
              <option>Portuguese (Português)</option>
            </select>
          </div>

          {/* Reader Goals */}
          <div className="form-group">
            <label className="form-label">What does your reader want to achieve?</label>
            <textarea
              className="input"
              rows={3}
              placeholder="e.g. Learn new skills, be entertained, gain scientific knowledge, explore new worlds..."
              value={profile.goals}
              onChange={e => setProfile(p => ({ ...p, goals: e.target.value }))}
            />
          </div>

          {/* Save Button */}
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleSave}>
            {saved ? <><X size={16} /> Saved!</> : <><Save size={16} /> Save Profile</>}
          </button>
        </div>

        {/* Interests + AI */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Interests / Tags */}
          <div className="card">
            <h2 style={{ fontSize: '18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Tag size={20} color="var(--accent-color)" /> Interests & Genres
            </h2>

            {/* Tag Input */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <input
                className="input"
                placeholder="Add interest (press Enter or comma)"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={handleKeyDown}
                style={{ flex: 1 }}
              />
              <button className="btn btn-secondary" onClick={() => addInterest(tagInput)}>
                <Tag size={15} />
              </button>
            </div>

            {/* Selected Tags */}
            {profile.interests.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                {profile.interests.map(tag => (
                  <span key={tag} style={{
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                    padding: '4px 10px', borderRadius: '999px',
                    backgroundColor: 'var(--accent-color)', color: 'white',
                    fontSize: '13px', fontWeight: 500
                  }}>
                    {tag}
                    <button
                      onClick={() => removeInterest(tag)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.8)', display: 'flex', padding: 0 }}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Suggestions */}
            <div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>Quick add:</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {INTEREST_SUGGESTIONS.filter(s => !profile.interests.includes(s)).map(tag => (
                  <button
                    key={tag}
                    onClick={() => addInterest(tag)}
                    className="btn btn-secondary"
                    style={{ padding: '4px 10px', fontSize: '12px', borderRadius: '999px' }}
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* AI Suggestions Panel */}
          <div className="card">
            <h2 style={{ fontSize: '18px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Brain size={20} color="var(--accent-color)" /> AI Writing Suggestions
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Get personalized writing tips based on your reader profile from your local Ollama AI.
            </p>

            <button
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginBottom: '16px' }}
              onClick={getAISuggestions}
              disabled={aiLoading}
            >
              {aiLoading ? (
                <><Sparkles size={16} style={{ animation: 'spin 1s linear infinite' }} /> Generating...</>
              ) : (
                <><Sparkles size={16} /> Get AI Suggestions</>
              )}
            </button>

            {aiSuggestion && (
              <div style={{
                padding: '16px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)',
                borderLeft: '3px solid var(--accent-color)', whiteSpace: 'pre-wrap',
                fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7
              }}>
                {aiSuggestion}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
