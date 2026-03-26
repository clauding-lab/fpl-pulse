import { useState, useCallback } from "react";
import { COLORS, setThemeMode } from "./utils/theme";
import { useFplData } from "./hooks/useFplData";
import { TabBtn } from "./components/shared";
import TabSeasonPulse from "./components/TabSeasonPulse";
import TabFixtureEngine from "./components/TabFixtureEngine";
import TabPlayerIntel from "./components/TabPlayerIntel";
import TabHiddenGems from "./components/TabHiddenGems";
import TabMyPulse from "./components/TabMyPulse";
import TabDeepDive from "./components/TabDeepDive";
import ScoreExplainer from "./components/ScoreExplainer";

const TABS = ["Season Pulse", "Fixture Engine", "Player Intel", "Hidden Gems", "Deep Dive", "My Pulse"];

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
  const [darkMode, setDarkMode] = useState(() => { setThemeMode(false); return false; });
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
              GW{data.gw} {usingMock && <span style={{ color: COLORS.amber }}>· Demo Mode</span>} · FPL Pulse
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
            <button
              onClick={toggleTheme}
              title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              style={{
                width: 36, height: 36, borderRadius: 10, cursor: "pointer",
                background: COLORS.surface,
                boxShadow: COLORS.shadowRaised,
                border: "none",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "box-shadow 0.2s, transform 0.15s",
              }}
              onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.92)"; e.currentTarget.style.boxShadow = COLORS.shadowInset; }}
              onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = COLORS.shadowRaised; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = COLORS.shadowRaised; }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={darkMode ? COLORS.amber : COLORS.blue} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {darkMode ? (
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                ) : (
                  <>
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Desktop tab bar (top) */}
      <div className="desktop-tab-bar" style={{ padding: "6px 20px", overflowX: "auto" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", gap: 6, background: COLORS.bg, borderRadius: 12, padding: 4, boxShadow: COLORS.shadowInset }}>
          {TABS.map((t, i) => (
            <TabBtn key={i} label={t} active={tab === i} onClick={() => setTab(i)} />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="app-content" style={{ maxWidth: 1100, margin: "0 auto", padding: "20px 20px 40px" }}>
        {tab === 0 && <TabSeasonPulse data={data} />}
        {tab === 1 && <TabFixtureEngine data={data} />}
        {tab === 2 && <TabPlayerIntel data={data} />}
        {tab === 3 && <TabHiddenGems data={data} />}
        {tab === 4 && <TabDeepDive data={data} />}
        {tab === 5 && <TabMyPulse data={data} />}
      </div>

      {/* Score Explainer Modal */}
      {showExplainer && <ScoreExplainer onClose={() => setShowExplainer(false)} />}

      {/* Footer (desktop only — hidden on mobile by bottom bar overlap) */}
      <div className="desktop-tab-bar" style={{ maxWidth: 1100, margin: "0 auto", padding: "0 20px 40px" }}>
        <div style={{ paddingTop: 20, borderTop: `1px solid ${COLORS.border}`, textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: COLORS.green }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary }}>FPL PULSE</span>
          </div>
          <div style={{ fontSize: 11, color: COLORS.textMuted }}>
            Powered by Claude AI · Data from Fantasy Premier League API
          </div>
        </div>
      </div>

      {/* Mobile bottom tab bar */}
      <div
        className="mobile-tab-bar"
        style={{
          display: "none",
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 999,
          background: COLORS.surface,
          boxShadow: "0 -2px 16px rgba(0,0,0,0.15)",
          paddingBottom: "env(safe-area-inset-bottom, 8px)",
          paddingTop: 6,
          justifyContent: "space-around", alignItems: "center",
        }}
      >
        {[
          { icon: "📊", label: "Season" },
          { icon: "📅", label: "Fixtures" },
          { icon: "⚡", label: "Players" },
          { icon: "💎", label: "Gems" },
          { icon: "🔬", label: "Deep Dive" },
          { icon: "👤", label: "My Pulse" },
        ].map((t, i) => (
          <button
            key={i}
            onClick={() => setTab(i)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
              padding: "4px 8px", minWidth: 0, flex: 1,
              opacity: tab === i ? 1 : 0.5,
              transition: "opacity 0.15s",
            }}
          >
            <span style={{ fontSize: 18 }}>{t.icon}</span>
            <span style={{
              fontSize: 9, fontWeight: tab === i ? 700 : 500,
              color: tab === i ? COLORS.green : COLORS.textSecondary,
              letterSpacing: 0.3,
            }}>
              {t.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
