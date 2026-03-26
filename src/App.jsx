import { useState, useCallback } from "react";
import { COLORS, setThemeMode } from "./utils/theme";
import { useFplData } from "./hooks/useFplData";
import { TabBtn } from "./components/shared";
import TabSeasonPulse from "./components/TabSeasonPulse";
import TabFixtureEngine from "./components/TabFixtureEngine";
import TabPlayerIntel from "./components/TabPlayerIntel";
import TabHiddenGems from "./components/TabHiddenGems";
import TabMyPulse from "./components/TabMyPulse";
import ScoreExplainer from "./components/ScoreExplainer";

const TABS = ["Season Pulse", "Fixture Engine", "Player Intel", "Hidden Gems", "My Pulse"];

function LoadingScreen() {
  return (
    <div
      style={{
        background: COLORS.bg,
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 16,
        color: COLORS.textSecondary,
      }}
    >
      <div style={{ display: "flex", gap: 6 }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: COLORS.green,
              animation: `pd 1.2s ease ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>
      <div style={{ fontSize: 13 }}>Loading FPL data...</div>
      <style>{`@keyframes pd{0%,80%,100%{opacity:.3;transform:scale(.8)}40%{opacity:1;transform:scale(1.2)}}`}</style>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState(0);
  const [darkMode, setDarkMode] = useState(true);
  const [showExplainer, setShowExplainer] = useState(false);
  const { loading, usingMock, data } = useFplData();

  const toggleTheme = useCallback(() => {
    const next = !darkMode;
    setDarkMode(next);
    setThemeMode(next);
  }, [darkMode]);

  if (loading) return <LoadingScreen />;
  if (!data) return null;

  return (
    <div style={{ background: COLORS.bg, minHeight: "100vh", color: COLORS.text, fontFamily: "'Inter', system-ui, sans-serif", transition: "background 0.3s, color 0.3s" }}>

      {/* Header */}
      <div style={{ padding: "14px 20px" }}>
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: COLORS.green,
                boxShadow: `0 0 12px ${COLORS.green}60`,
              }}
            />
            <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>FPL PULSE</span>
            <span
              style={{
                fontSize: 9,
                color: COLORS.bg,
                background: COLORS.amber,
                padding: "2px 8px",
                borderRadius: 4,
                fontWeight: 700,
                letterSpacing: 1,
              }}
            >
              BETA
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ fontSize: 11, color: COLORS.textSecondary }}>
              GW{data.gw} {usingMock && <span style={{ color: COLORS.amber }}>· Demo Mode</span>} · Built by Adnan Rashid
            </div>
            <button
              onClick={() => setShowExplainer(true)}
              style={{
                background: COLORS.surface,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 6,
                padding: "4px 10px",
                cursor: "pointer",
                fontSize: 10,
                fontWeight: 600,
                color: COLORS.blue,
                letterSpacing: 0.5,
              }}
              title="How scores are calculated"
            >
              ?
            </button>
            <div
              onClick={toggleTheme}
              title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              style={{
                width: 44, height: 24, borderRadius: 12, cursor: "pointer",
                background: darkMode ? COLORS.green : COLORS.border,
                position: "relative", transition: "background 0.2s",
              }}
            >
              <div style={{
                width: 18, height: 18, borderRadius: "50%",
                background: "#fff",
                position: "absolute", top: 3,
                left: darkMode ? 23 : 3,
                transition: "left 0.2s",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 10, lineHeight: 1,
              }}>
                {darkMode ? "🌙" : "☀️"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ padding: "6px 20px", overflowX: "auto" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", gap: 6, background: COLORS.bg, borderRadius: 12, padding: 4, boxShadow: COLORS.shadowInset }}>
          {TABS.map((t, i) => (
            <TabBtn key={i} label={t} active={tab === i} onClick={() => setTab(i)} />
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "20px 20px 40px" }}>
        {tab === 0 && <TabSeasonPulse data={data} />}
        {tab === 1 && <TabFixtureEngine data={data} />}
        {tab === 2 && <TabPlayerIntel data={data} />}
        {tab === 3 && <TabHiddenGems data={data} />}
        {tab === 4 && <TabMyPulse data={data} />}
      </div>

      {/* Score Explainer Modal */}
      {showExplainer && <ScoreExplainer onClose={() => setShowExplainer(false)} />}

      {/* Footer */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 20px 40px" }}>
        <div style={{ paddingTop: 20, borderTop: `1px solid ${COLORS.border}`, textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: COLORS.green }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary }}>FPL PULSE</span>
          </div>
          <div style={{ fontSize: 11, color: COLORS.textMuted }}>
            Built by Adnan Rashid · Powered by Claude AI · Data from Fantasy Premier League API
          </div>
        </div>
      </div>
    </div>
  );
}
