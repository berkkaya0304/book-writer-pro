"use client";

import { useEffect, useState, useCallback } from "react";
import { Server, Zap, Key, AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";

type Provider = "ollama" | "google";

const GOOGLE_MODELS = [
  { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro (En Güçlü)" },
  { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash (Hızlı & Güncel) ✓" },
  { value: "gemini-2.0-flash-lite", label: "Gemini 2.0 Flash Lite (En Hızlı) ✓" },
  { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro (Güçlü & Kapsamlı) ✓" },
  { value: "gemini-1.5-flash", label: "Gemini 1.5 Flash (Hızlı & Ekonomik) ✓" },
  { value: "gemini-2.5-pro-preview-03-25", label: "Gemini 2.5 Pro Preview (Erken Erişim)" },
  { value: "gemini-3.1-flash-lite-preview", label: "Gemini 3.1 Flash Lite Preview (Yeni)" },
];

export default function SettingsPage() {
  // Provider
  const [provider, setProvider] = useState<Provider>("ollama");

  // Ollama
  const [models, setModels] = useState<Array<{ name: string; size: number }>>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [modelsError, setModelsError] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [ollamaUrl, setOllamaUrl] = useState("http://127.0.0.1:11434");

  // Google
  const [googleApiKey, setGoogleApiKey] = useState("");
  const [googleModel, setGoogleModel] = useState("gemini-2.0-flash");
  const [showKey, setShowKey] = useState(false);

  // Preferences
  const [defaultLanguage, setDefaultLanguage] = useState("English");
  const [defaultTone, setDefaultTone] = useState("Neutral");
  const [theme, setTheme] = useState("dark");

  // Save state
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const savedProvider = (localStorage.getItem("aiProvider") || "ollama") as Provider;
    const savedModel = localStorage.getItem("defaultModel") || "";
    const savedUrl = localStorage.getItem("ollamaUrl") || "http://127.0.0.1:11434";
    const savedGoogleKey = localStorage.getItem("googleApiKey") || "";
    const savedGoogleModel = localStorage.getItem("googleModel") || "gemini-2.0-flash";
    const savedLang = localStorage.getItem("defaultLanguage") || "English";
    const savedTone = localStorage.getItem("defaultTone") || "Neutral";

    try {
      const savedSettings = JSON.parse(localStorage.getItem("writerSettings") || "{}");
      if (savedSettings.theme) setTheme(savedSettings.theme);
    } catch (e) { console.error(e); }

    setProvider(savedProvider);
    setSelectedModel(savedModel);
    setOllamaUrl(savedUrl);
    setGoogleApiKey(savedGoogleKey);
    setGoogleModel(savedGoogleModel);
    setDefaultLanguage(savedLang);
    setDefaultTone(savedTone);
  }, []);

  const fetchModels = useCallback(async () => {
    setModelsLoading(true);
    setModelsError("");
    try {
      const res = await fetch("/api/models");
      const data = await res.json();
      if (res.ok && data.models) {
        setModels(data.models);
        if (!selectedModel && data.models.length > 0) {
          setSelectedModel(data.models[0].name);
        }
      } else {
        setModelsError(data.error || "Failed to fetch models");
      }
    } catch (err) {
      setModelsError(err instanceof Error ? err.message : "Failed to connect");
    } finally {
      setModelsLoading(false);
    }
  }, [selectedModel]);

  // Only fetch Ollama models when on the Ollama tab
  useEffect(() => {
    if (provider === "ollama") {
      fetchModels();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider]);

  const handleSave = () => {
    localStorage.setItem("aiProvider", provider);
    localStorage.setItem("defaultModel", selectedModel);
    localStorage.setItem("ollamaUrl", ollamaUrl);
    localStorage.setItem("googleApiKey", googleApiKey);
    localStorage.setItem("googleModel", googleModel);
    localStorage.setItem("defaultLanguage", defaultLanguage);
    localStorage.setItem("defaultTone", defaultTone);

    const currentSettings = JSON.parse(localStorage.getItem("writerSettings") || "{}");
    localStorage.setItem("writerSettings", JSON.stringify({ ...currentSettings, theme }));

    document.documentElement.className = theme === "dark" ? "" : `theme-${theme}`;

    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Settings</h1>
      <p className="page-description">Configure your AI assistant and writing preferences.</p>

      {/* ── AI Provider Card ─────────────────────────────────────────── */}
      <div className="card" style={{ maxWidth: "660px", marginBottom: "24px" }}>
        <h2 style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
          <Zap size={20} color="var(--accent-color)" /> AI Provider
        </h2>

        {/* Provider Toggle */}
        <div style={{
          display: "flex",
          gap: "0",
          borderRadius: "10px",
          overflow: "hidden",
          border: "1px solid var(--border-color)",
          marginBottom: "24px",
          width: "fit-content",
        }}>
          {(["ollama", "google"] as Provider[]).map((p) => (
            <button
              key={p}
              onClick={() => setProvider(p)}
              style={{
                padding: "10px 28px",
                border: "none",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "14px",
                transition: "all 0.2s",
                background: provider === p ? "var(--accent-color)" : "var(--card-bg)",
                color: provider === p ? "#fff" : "var(--text-secondary)",
              }}
            >
              {p === "ollama" ? "🦙 Ollama (Local)" : "✨ Google Gemini"}
            </button>
          ))}
        </div>

        {/* ── Ollama Panel ── */}
        {provider === "ollama" && (
          <div>
            <div className="form-group">
              <label className="form-label">
                <Server size={14} style={{ marginRight: 6, verticalAlign: "middle" }} />
                Ollama API URL
              </label>
              <input
                type="text"
                className="input"
                value={ollamaUrl}
                onChange={(e) => setOllamaUrl(e.target.value)}
                placeholder="http://127.0.0.1:11434"
              />
              <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>
                The local address where Ollama is running.
              </p>
            </div>

            <div className="form-group" style={{ marginTop: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <label className="form-label" style={{ margin: 0 }}>Default Model</label>
                <button
                  className="btn btn-secondary"
                  style={{ padding: "4px 10px", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}
                  onClick={fetchModels}
                >
                  <RefreshCw size={12} /> Refresh
                </button>
              </div>

              {modelsLoading ? (
                <div style={{ color: "var(--text-secondary)", padding: "12px 0" }}>Loading models…</div>
              ) : modelsError ? (
                <div style={{ color: "var(--danger-color)", padding: "8px 0" }}>
                  {modelsError}
                  <button className="btn btn-secondary" style={{ marginLeft: "12px", padding: "4px 8px" }} onClick={fetchModels}>
                    Retry
                  </button>
                </div>
              ) : models.length === 0 ? (
                <div style={{ color: "var(--text-secondary)", padding: "8px 0" }}>
                  No models found. Run <code>ollama pull llama3</code> first.
                </div>
              ) : (
                <select className="input" value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}>
                  <option value="" disabled>Select a model</option>
                  {models.map((m) => (
                    <option key={m.name} value={m.name}>
                      {m.name} ({(m.size / 1024 / 1024 / 1024).toFixed(1)} GB)
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div style={{
              marginTop: "16px",
              padding: "12px",
              borderRadius: "8px",
              background: "rgba(var(--accent-rgb, 99, 102, 241), 0.08)",
              border: "1px solid rgba(var(--accent-rgb, 99, 102, 241), 0.2)",
              fontSize: "13px",
              color: "var(--text-secondary)",
            }}>
              💡 Ollama runs <strong>locally on your machine</strong> — no API key or internet required. Completely private.
            </div>
          </div>
        )}

        {/* ── Google Gemini Panel ── */}
        {provider === "google" && (
          <div>
            <div className="form-group">
              <label className="form-label">
                <Key size={14} style={{ marginRight: 6, verticalAlign: "middle" }} />
                Google Gemini API Key
              </label>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type={showKey ? "text" : "password"}
                  className="input"
                  value={googleApiKey}
                  onChange={(e) => setGoogleApiKey(e.target.value)}
                  placeholder="AIza..."
                  style={{ flex: 1, fontFamily: showKey ? "inherit" : "monospace" }}
                />
                <button
                  className="btn btn-secondary"
                  style={{ padding: "8px 14px", whiteSpace: "nowrap" }}
                  onClick={() => setShowKey((v) => !v)}
                >
                  {showKey ? "Hide" : "Show"}
                </button>
              </div>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>
                Get your key at{" "}
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-color)" }}>
                  aistudio.google.com
                </a>
                . Key is stored locally in your browser only.
              </p>
            </div>

            <div className="form-group" style={{ marginTop: "16px" }}>
              <label className="form-label">Google Model</label>
              <select className="input" value={googleModel} onChange={(e) => setGoogleModel(e.target.value)}>
                {GOOGLE_MODELS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>

            <div style={{
              marginTop: "16px",
              padding: "12px",
              borderRadius: "8px",
              background: "rgba(234, 153, 13, 0.08)",
              border: "1px solid rgba(234, 153, 13, 0.3)",
              fontSize: "13px",
              color: "var(--text-secondary)",
              display: "flex",
              gap: "8px",
            }}>
              <AlertTriangle size={16} color="#ea990d" style={{ flexShrink: 0, marginTop: 1 }} />
              <span>
                Google Gemini API has a <strong>usage quota</strong>. If you run out of credits, the app will warn you and suggest switching back to Ollama.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Writing Preferences Card ─────────────────────────────────── */}
      <div className="card" style={{ maxWidth: "660px" }}>
        <h2 style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
          <Zap size={20} color="var(--accent-color)" /> Writing Preferences
        </h2>

        <div style={{ display: "flex", gap: "16px" }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">Language</label>
            <select className="input" value={defaultLanguage} onChange={(e) => setDefaultLanguage(e.target.value)}>
              <option value="English">English</option>
              <option value="Turkish">Turkish (Türkçe)</option>
            </select>
          </div>

          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">Tone / Style</label>
            <select className="input" value={defaultTone} onChange={(e) => setDefaultTone(e.target.value)}>
              <option value="Neutral">Neutral (Tarafsız)</option>
              <option value="Friendly">Friendly (Dost Canlısı)</option>
              <option value="Professional">Professional (Profesyonel)</option>
              <option value="Dark and Gritty">Dark / Gritty (Karanlık)</option>
              <option value="Humorous">Humorous (Mizahi)</option>
              <option value="Academic">Academic (Akademik)</option>
              <option value="Poetic">Poetic (Şiirsel)</option>
            </select>
          </div>
        </div>

        <div className="form-group" style={{ marginTop: "16px" }}>
          <label className="form-label">Theme</label>
          <select
            className="input"
            value={theme}
            onChange={(e) => {
              const t = e.target.value;
              setTheme(t);
              document.documentElement.className = t === "dark" ? "" : `theme-${t}`;
            }}
          >
            <option value="dark">Dark (Varsayılan Karanlık)</option>
            <option value="sepia">Sepia (Sepya / Göz Yormayan)</option>
            <option value="dracula">Dracula (Alternatif Karanlık)</option>
          </select>
        </div>

        <div style={{ marginTop: "32px", display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "12px" }}>
          {saved && (
            <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--success-color, #22c55e)", fontSize: "14px" }}>
              <CheckCircle size={16} /> Saved!
            </span>
          )}
          <button className="btn btn-primary" onClick={handleSave}>
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
