import { useState, useMemo } from "react";
import { COLORS, POS_COLORS } from "../utils/theme";
import { SubBtn, PlayerTable, Card, Sparkline } from "./shared";
import { usePlayerHistory } from "../hooks/usePlayerHistory";
import { useXgiHistory } from "../hooks/useXgiHistory";

const GW_WINDOWS = [
  { label: "All Season", value: null },
  { label: "Last 3 GWs", value: 3 },
  { label: "Last 5 GWs", value: 5 },
  { label: "Last 8 GWs", value: 8 },
  { label: "Last 15 GWs", value: 15 },
];

export default function TabPlayerIntel({ data }) {
  const [subTab, setSubTab] = useState(0);
  const [posF, setPosF] = useState(0);
  const [gwWindow, setGwWindow] = useState(null);

  const fForm = posF === 0 ? data.fPl : data.fPl.filter((p) => p.pos === posF);

  // Fetch sparkline data for visible top 30 form players
  const sparklineIds = useMemo(() => fForm.slice(0, 30).map((p) => p.id), [fForm]);
  const sparkData = usePlayerHistory(subTab === 0 ? sparklineIds : []);

  // xGI Delta — fetch per-GW history for window filtering (only when on that panel)
  const xgiIds = useMemo(() => data.xgiDelta.slice(0, 60).map((p) => p.id), [data.xgiDelta]);
  const xgiHistory = useXgiHistory(subTab === 4 ? xgiIds : []);

  // Recompute xGI delta metrics for the selected GW window
  const filteredXgiDelta = useMemo(() => {
    if (!gwWindow) return data.xgiDelta; // All Season — use pre-computed full-season data

    return data.xgiDelta
      .map((p) => {
        const hist = xgiHistory[p.id];
        if (!hist || hist.length === 0) return null; // still loading
        const win = hist.slice(-gwWindow);
        if (win.length === 0) return null;

        const xG = win.reduce((s, gw) => s + parseFloat(gw.expected_goals || 0), 0);
        const xA = win.reduce((s, gw) => s + parseFloat(gw.expected_assists || 0), 0);
        const mins = win.reduce((s, gw) => s + (gw.minutes || 0), 0);
        const goals = win.reduce((s, gw) => s + (gw.goals_scored || 0), 0);
        const assists = win.reduce((s, gw) => s + (gw.assists || 0), 0);

        const p90 = mins > 0 ? 90 / mins : 0;
        const xGI = xG + xA;
        const xGI90 = +(xGI * p90).toFixed(2);

        // Scale pen contribution proportionally from full season
        const totalGWs = hist.length || 1;
        const windowRatio = win.length / totalGWs;
        const penXG = p.isPenTaker ? Math.min(xG, p.penXG * windowRatio) : 0;
        const npxG = Math.max(xG - penXG, 0);
        const npxGI = npxG + xA;
        const npxGI90 = +(npxGI * p90).toFixed(2);
        const xgiDeltaVal = +(xGI90 - npxGI90).toFixed(2);
        const depPct = xGI90 > 0 ? Math.round((xgiDeltaVal / xGI90) * 100) : 0;

        return { ...p, xG: +xG.toFixed(2), xA: +xA.toFixed(2), xGI90, npxG: +npxG.toFixed(2), npxGI90, xgiDeltaVal, depPct, goals, assists };
      })
      .filter(Boolean)
      .sort((a, b) => b.xgiDeltaVal - a.xgiDeltaVal);
  }, [gwWindow, data.xgiDelta, xgiHistory]);

  return (
    <div>
      <div
        style={{
          display: "flex",
          gap: 2,
          marginBottom: 16,
          overflowX: "auto",
          borderBottom: `1px solid ${COLORS.border}`,
          paddingBottom: 2,
        }}
      >
        {["Form Tracker", "Floor Kings", "Haul Hunters", "Risk Monitor", "xGI Delta", "Shot Stoppers"].map((s, i) => (
          <SubBtn key={i} label={s} active={subTab === i} onClick={() => setSubTab(i)} />
        ))}
      </div>

      {/* Form Tracker */}
      {subTab === 0 && (
        <div>
          <div style={{ display: "flex", gap: 4, marginBottom: 14 }}>
            {[
              { l: "ALL", v: 0 },
              { l: "GK", v: 1 },
              { l: "DEF", v: 2 },
              { l: "MID", v: 3 },
              { l: "FWD", v: 4 },
            ].map((f) => (
              <button
                key={f.v}
                onClick={() => setPosF(f.v)}
                style={{
                  background: posF === f.v ? COLORS.green : COLORS.surface,
                  color: posF === f.v ? COLORS.bg : COLORS.textSecondary,
                  border: `1px solid ${posF === f.v ? COLORS.green : COLORS.border}`,
                  borderRadius: 6,
                  padding: "4px 12px",
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {f.l}
              </button>
            ))}
          </div>
          <PlayerTable
            players={fForm.slice(0, 30)}
            columns={[
              { header: "#", render: (_, i) => i + 1, style: () => ({ color: COLORS.textMuted, fontSize: 11 }) },
              { header: "Player", render: (p) => p.name, style: () => ({ fontWeight: 600, whiteSpace: "nowrap" }) },
              {
                header: "Last 8",
                render: (p) => {
                  const d = sparkData[p.id];
                  return <Sparkline data={d} color={p.form >= 5 ? COLORS.green : p.form >= 3 ? COLORS.amber : COLORS.red} />;
                },
              },
              {
                header: "Pos",
                render: (p) => <span style={{ color: POS_COLORS[p.pos], fontWeight: 700, fontSize: 10 }}>{p.posL}</span>,
              },
              { header: "Team", render: (p) => p.team, style: () => ({ color: COLORS.textSecondary }) },
              { header: "£", render: (p) => p.price, style: () => ({ fontFamily: "monospace" }) },
              {
                header: "Form",
                render: (p) => p.form,
                style: (p) => ({
                  fontWeight: 700,
                  color: p.form >= 6 ? COLORS.green : p.form >= 4 ? COLORS.amber : COLORS.red,
                }),
              },
              { header: "Pts", render: (p) => p.pts, style: () => ({ fontWeight: 600 }) },
              {
                header: "xGI/90",
                render: (p) => p.xGI90,
                style: () => ({ fontWeight: 600, color: COLORS.blue, fontFamily: "monospace" }),
              },
              { header: "xG", render: (p) => p.xG.toFixed(1), style: () => ({ fontFamily: "monospace", color: COLORS.textSecondary }) },
              {
                header: "G",
                render: (p) => p.goals,
                style: (p) => ({
                  fontWeight: 600,
                  color: p.goals > p.xG ? COLORS.green : p.goals < p.xG * 0.7 ? COLORS.red : COLORS.text,
                }),
              },
              { header: "xA", render: (p) => p.xA.toFixed(1), style: () => ({ fontFamily: "monospace", color: COLORS.textSecondary }) },
              {
                header: "A",
                render: (p) => p.assists,
                style: (p) => ({ fontWeight: 600, color: p.assists > p.xA ? COLORS.green : COLORS.text }),
              },
              { header: "Own%", render: (p) => `${p.own}%`, style: () => ({ color: COLORS.textSecondary }) },
              {
                header: "Score",
                render: (p) => p.fScore,
                style: () => ({ fontWeight: 700, color: COLORS.green, fontFamily: "monospace" }),
              },
            ]}
          />
        </div>
      )}

      {/* Floor Kings */}
      {subTab === 1 && (
        <div>
          <p style={{ color: COLORS.textSecondary, fontSize: 12, marginBottom: 14 }}>
            Consistent 3-7 point producers. Low variance, high floor.
          </p>
          <PlayerTable
            players={data.fk}
            columns={[
              { header: "#", render: (_, i) => i + 1, style: () => ({ color: COLORS.textMuted, fontSize: 11 }) },
              { header: "Player", render: (p) => p.name, style: () => ({ fontWeight: 600 }) },
              {
                header: "Pos",
                render: (p) => <span style={{ color: POS_COLORS[p.pos], fontWeight: 700, fontSize: 10 }}>{p.posL}</span>,
              },
              { header: "Team", render: (p) => p.team, style: () => ({ color: COLORS.textSecondary }) },
              { header: "£", render: (p) => p.price, style: () => ({ fontFamily: "monospace" }) },
              { header: "PPG", render: (p) => p.ppg, style: () => ({ fontWeight: 700, color: COLORS.green }) },
              {
                header: "Distribution",
                render: (p) => {
                  // Approximate: blanks (~15%), floor 2-7 (~65%), hauls 8+ (~20%) based on PPG
                  const blankPct = Math.max(5, 30 - p.ppg * 4);
                  const haulPct = Math.max(5, (p.ppg - 3) * 8);
                  const floorPct = 100 - blankPct - haulPct;
                  return (
                    <div style={{ display: "flex", height: 10, borderRadius: 5, overflow: "hidden", width: 80, minWidth: 80 }}>
                      <div style={{ width: `${blankPct}%`, background: `${COLORS.red}60` }} title={`~${Math.round(blankPct)}% blanks`} />
                      <div style={{ width: `${floorPct}%`, background: `${COLORS.textSecondary}40` }} title={`~${Math.round(floorPct)}% floor (2-7)`} />
                      <div style={{ width: `${haulPct}%`, background: `${COLORS.green}60` }} title={`~${Math.round(haulPct)}% hauls (8+)`} />
                    </div>
                  );
                },
              },
              { header: "Pts", render: (p) => p.pts, style: () => ({ fontWeight: 600 }) },
              { header: "Apps", render: (p) => p.apps, style: () => ({ color: COLORS.textSecondary }) },
              { header: "Bonus", render: (p) => p.bonus, style: () => ({ color: COLORS.amber }) },
              { header: "Own%", render: (p) => `${p.own}%`, style: () => ({ color: COLORS.textSecondary }) },
              {
                header: "FDR",
                render: (p) => p.aFDR.toFixed(1),
                style: (p) => ({
                  fontWeight: 600,
                  color: p.aFDR <= 2.5 ? COLORS.green : p.aFDR <= 3.2 ? COLORS.amber : COLORS.red,
                }),
              },
            ]}
          />
        </div>
      )}

      {/* Haul Hunters */}
      {subTab === 2 && (
        <div>
          <p style={{ color: COLORS.textSecondary, fontSize: 12, marginBottom: 14 }}>
            Explosive ceiling players. When they haul, they haul big.
          </p>
          <PlayerTable
            players={data.hh}
            columns={[
              { header: "#", render: (_, i) => i + 1, style: () => ({ color: COLORS.textMuted, fontSize: 11 }) },
              { header: "Player", render: (p) => p.name, style: () => ({ fontWeight: 600 }) },
              {
                header: "Pos",
                render: (p) => <span style={{ color: POS_COLORS[p.pos], fontWeight: 700, fontSize: 10 }}>{p.posL}</span>,
              },
              { header: "Team", render: (p) => p.team, style: () => ({ color: COLORS.textSecondary }) },
              { header: "£", render: (p) => p.price, style: () => ({ fontFamily: "monospace" }) },
              {
                header: "Form",
                render: (p) => p.form,
                style: (p) => ({
                  fontWeight: 700,
                  color: p.form >= 6 ? COLORS.green : p.form >= 4 ? COLORS.amber : COLORS.red,
                }),
              },
              { header: "Pts", render: (p) => p.pts, style: () => ({ fontWeight: 600 }) },
              { header: "G+A", render: (p) => p.goals + p.assists, style: () => ({ fontWeight: 700, color: COLORS.green }) },
              { header: "xG", render: (p) => p.xG.toFixed(1), style: () => ({ fontFamily: "monospace", color: COLORS.textSecondary }) },
              { header: "xGI/90", render: (p) => p.xGI90, style: () => ({ fontWeight: 600, color: COLORS.blue }) },
              {
                header: "Ceiling",
                render: (p) => {
                  // Approximate ceiling score = xGI/90 * fixture rating
                  const ceiling = +(p.xGI90 * (1 + p.fR) * 5).toFixed(0);
                  return <span style={{ color: COLORS.amber, fontWeight: 700 }}>{ceiling}</span>;
                },
              },
              {
                header: "FDR",
                render: (p) => p.aFDR.toFixed(1),
                style: (p) => ({
                  fontWeight: 600,
                  color: p.aFDR <= 2.5 ? COLORS.green : p.aFDR <= 3.2 ? COLORS.amber : COLORS.red,
                }),
              },
              { header: "Own%", render: (p) => `${p.own}%`, style: () => ({ color: COLORS.textSecondary }) },
            ]}
          />
        </div>
      )}

      {/* Risk Monitor */}
      {subTab === 3 && (
        <div>
          <p style={{ color: COLORS.textSecondary, fontSize: 12, marginBottom: 14 }}>
            Popular players showing warning signals.
          </p>
          {data.risk.length === 0 ? (
            <Card>
              <p style={{ color: COLORS.textSecondary, textAlign: "center", padding: 20 }}>No major flags this week.</p>
            </Card>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
              {data.risk.map((p) => (
                <Card key={p.id} style={{ borderLeft: `3px solid ${p.rf[0]?.s === "red" ? COLORS.red : COLORS.amber}` }}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: COLORS.textSecondary, marginBottom: 8 }}>
                    {p.team} · {p.posL} · £{p.price} · {p.own}%
                  </div>
                  {p.rf.map((f, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, fontSize: 12 }}>
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: f.s === "red" ? COLORS.red : COLORS.amber,
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ color: f.s === "red" ? COLORS.red : COLORS.amber, fontWeight: 600 }}>{f.t}</span>
                      <span style={{ color: COLORS.textSecondary }}>{f.d}</span>
                    </div>
                  ))}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* xGI Delta — Penalty Dependency */}
      {subTab === 4 && (
        <div>
          <Card style={{ marginBottom: 14, padding: "12px 16px" }}>
            <div style={{ fontSize: 12, color: COLORS.textSecondary, lineHeight: 1.7 }}>
              <strong style={{ color: COLORS.text }}>What is xGI Delta?</strong> The gap between total xGI/90 and non-penalty xGI/90.
              High delta = player's expected output is inflated by penalties. If they lose penalty duty, their xGI collapses.
              <span style={{ color: COLORS.amber, fontWeight: 600 }}> PEN</span> = designated penalty taker.
            </div>
          </Card>

          {/* GW Window filter */}
          <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
            {GW_WINDOWS.map((w) => {
              const active = gwWindow === w.value;
              const loading = w.value !== null && gwWindow === w.value && filteredXgiDelta.length === 0;
              return (
                <button
                  key={w.label}
                  onClick={() => setGwWindow(w.value)}
                  style={{
                    background: active ? COLORS.blue : COLORS.surface,
                    color: active ? "#fff" : COLORS.textSecondary,
                    border: `1px solid ${active ? COLORS.blue : COLORS.border}`,
                    borderRadius: 6,
                    padding: "4px 12px",
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                    opacity: loading ? 0.6 : 1,
                  }}
                >
                  {loading ? "Loading…" : w.label}
                </button>
              );
            })}
          </div>

          <PlayerTable
            players={filteredXgiDelta.slice(0, 30)}
            columns={[
              { header: "#", render: (_, i) => i + 1, style: () => ({ color: COLORS.textMuted, fontSize: 11 }) },
              { header: "Player", render: (p) => (
                <span>
                  {p.name}
                  {p.isPenTaker && <span style={{ marginLeft: 4, fontSize: 8, background: COLORS.amber, color: COLORS.bg, padding: "1px 4px", borderRadius: 3, fontWeight: 700 }}>PEN</span>}
                </span>
              ), style: () => ({ fontWeight: 600, whiteSpace: "nowrap" }) },
              { header: "Pos", render: (p) => <span style={{ color: POS_COLORS[p.pos], fontWeight: 700, fontSize: 10 }}>{p.posL}</span> },
              { header: "Team", render: (p) => p.team, style: () => ({ color: COLORS.textSecondary }) },
              { header: "£", render: (p) => p.price, style: () => ({ fontFamily: "monospace" }) },
              { header: "xGI/90", render: (p) => p.xGI90, style: () => ({ fontFamily: "monospace", fontWeight: 600 }) },
              { header: "npxGI/90", render: (p) => p.npxGI90, style: () => ({ fontFamily: "monospace", color: COLORS.green, fontWeight: 600 }) },
              { header: "Delta", render: (p) => p.xgiDeltaVal > 0 ? `+${p.xgiDeltaVal}` : p.xgiDeltaVal, style: (p) => ({ fontFamily: "monospace", fontWeight: 800, color: p.xgiDeltaVal >= 0.15 ? COLORS.red : p.xgiDeltaVal >= 0.05 ? COLORS.amber : COLORS.green }) },
              { header: "Dep%", render: (p) => `${p.depPct}%`, style: (p) => ({ fontWeight: 700, color: p.depPct >= 30 ? COLORS.red : p.depPct >= 15 ? COLORS.amber : COLORS.green }), title: "Penalty dependency: % of xGI from penalties" },
              { header: "Goals", render: (p) => p.goals, style: () => ({ fontWeight: 600 }) },
              { header: "xG", render: (p) => p.xG.toFixed(1), style: () => ({ fontFamily: "monospace" }) },
              { header: "npxG", render: (p) => p.npxG.toFixed(1), style: () => ({ fontFamily: "monospace", color: COLORS.green }) },
              { header: "Form", render: (p) => p.form, style: (p) => ({ fontWeight: 700, color: p.form >= 5 ? COLORS.green : p.form >= 3 ? COLORS.amber : COLORS.red }) },
              { header: "Own%", render: (p) => `${p.own}%`, style: () => ({ color: COLORS.textSecondary }) },
            ]}
          />
          <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 10, fontStyle: "italic" }}>
            npxG estimated by removing ~0.76 xG per estimated penalty taken. Exact npxG requires FBref/xgstat data.
          </div>
        </div>
      )}

      {/* Shot Stoppers — GK Rankings */}
      {subTab === 5 && (
        <div>
          <Card style={{ marginBottom: 14, padding: "12px 16px" }}>
            <div style={{ fontSize: 12, color: COLORS.textSecondary, lineHeight: 1.7 }}>
              <strong style={{ color: COLORS.text }}>GK Value Score</strong> = Saves/90 (30%) + Save Pts/90 (25%) + CS Rate (25%) + Bonus/App (20%).
              <strong style={{ color: COLORS.green }}> xSaves</strong> = xGC minus actual GC. Positive = keeper saving more than expected (outperforming their defense).
            </div>
          </Card>
          <PlayerTable
            players={data.shotStoppers}
            columns={[
              { header: "#", render: (_, i) => i + 1, style: () => ({ color: COLORS.textMuted, fontSize: 11 }) },
              { header: "GK", render: (p) => p.name, style: () => ({ fontWeight: 600, whiteSpace: "nowrap" }) },
              { header: "Team", render: (p) => p.team, style: () => ({ color: COLORS.textSecondary }) },
              { header: "£", render: (p) => p.price, style: () => ({ fontFamily: "monospace" }) },
              { header: "Pts", render: (p) => p.pts, style: () => ({ fontWeight: 600 }) },
              { header: "Saves", render: (p) => p.saves, style: () => ({ fontWeight: 600 }) },
              { header: "Sv/90", render: (p) => p.savesPer90.toFixed(1), style: () => ({ fontFamily: "monospace", color: COLORS.blue }) },
              { header: "SvPts", render: (p) => p.savePoints, style: () => ({ fontWeight: 600 }), title: "Save points (1 per 3 saves)" },
              { header: "CS", render: (p) => p.cs, style: () => ({ fontWeight: 600 }) },
              { header: "CS%", render: (p) => `${(p.csRate * 100).toFixed(0)}%`, style: (p) => ({ color: p.csRate >= 0.35 ? COLORS.green : COLORS.textSecondary }) },
              { header: "Bon/App", render: (p) => p.bonusPerApp, style: () => ({ fontFamily: "monospace", color: COLORS.amber }) },
              { header: "GC", render: (p) => p.gc, style: () => ({ color: COLORS.textSecondary }) },
              { header: "xGC", render: (p) => p.xGC.toFixed(1), style: () => ({ fontFamily: "monospace", color: COLORS.textSecondary }) },
              { header: "xSaves", render: (p) => (p.xSaves >= 0 ? "+" : "") + p.xSaves, style: (p) => ({ fontWeight: 700, fontFamily: "monospace", color: p.xSaves >= 2 ? COLORS.green : p.xSaves <= -2 ? COLORS.red : COLORS.textSecondary }), title: "xGC minus actual GC. Positive = outperforming defense" },
              { header: "PenSvd", render: (p) => p.penSaved, style: () => ({ fontWeight: 600, color: COLORS.green }) },
              { header: "GK Value", render: (p) => p.gkValue, style: () => ({ fontWeight: 800, color: COLORS.green, fontFamily: "monospace" }) },
            ]}
          />
        </div>
      )}
    </div>
  );
}
