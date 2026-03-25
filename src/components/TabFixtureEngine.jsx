import { COLORS, FDR_COLORS, FDR_TEXT } from "../utils/theme";
import { Card } from "./shared";

export default function TabFixtureEngine({ data }) {
  const { tRR, tm, gw, dgwTeams, bgwTeams } = data;

  // Fixture swing teams (delta > 0.4)
  const swingBuy = tRR.filter((t) => t.swing > 0.4).slice(0, 5);
  const swingSell = tRR.filter((t) => t.swing < -0.4).sort((a, b) => a.swing - b.swing).slice(0, 5);

  const hasDGW = Object.keys(dgwTeams).length > 0;
  const hasBGW = Object.keys(bgwTeams).length > 0;

  return (
    <div>
      {/* DGW/BGW Alerts */}
      {(hasDGW || hasBGW) && (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
          {Object.entries(dgwTeams).map(([gwNum, teams]) => (
            <Card key={`dgw-${gwNum}`} style={{ flex: 1, minWidth: 200, borderLeft: `3px solid ${COLORS.green}`, padding: 14 }}>
              <div style={{ fontSize: 10, letterSpacing: 2, color: COLORS.green, fontWeight: 700, marginBottom: 4 }}>DOUBLE GW{gwNum}</div>
              <div style={{ fontSize: 12, color: COLORS.text }}>{teams.join(", ")}</div>
            </Card>
          ))}
          {Object.entries(bgwTeams).map(([gwNum, teams]) => (
            <Card key={`bgw-${gwNum}`} style={{ flex: 1, minWidth: 200, borderLeft: `3px solid ${COLORS.red}`, padding: 14 }}>
              <div style={{ fontSize: 10, letterSpacing: 2, color: COLORS.red, fontWeight: 700, marginBottom: 4 }}>BLANK GW{gwNum}</div>
              <div style={{ fontSize: 12, color: COLORS.text }}>{teams.join(", ")}</div>
            </Card>
          ))}
        </div>
      )}

      {/* Fixture Grid */}
      <div style={{ fontSize: 10, letterSpacing: 2, color: COLORS.textSecondary, marginBottom: 14, fontWeight: 500 }}>
        FIXTURE RUN-INS · EASIEST RUN FIRST
      </div>
      <div style={{ overflowX: "auto", borderRadius: 12, border: `1px solid ${COLORS.border}`, marginBottom: 20 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: COLORS.surface }}>
              <th style={{ padding: "10px 12px", textAlign: "left", color: COLORS.textSecondary, fontWeight: 600, fontSize: 10, position: "sticky", left: 0, background: COLORS.surface, zIndex: 2 }}>TEAM</th>
              <th style={{ padding: "10px 6px", textAlign: "center", color: COLORS.textSecondary, fontWeight: 600, fontSize: 10 }}>RUN</th>
              {(tRR[0]?.fixtures || []).map((_, i) => (
                <th key={i} style={{ padding: "10px 2px", textAlign: "center", color: COLORS.textSecondary, fontWeight: 600, fontSize: 9, minWidth: 52 }}>GW{gw + i}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tRR.map((t, idx) => (
              <tr key={t.id} style={{ borderTop: `1px solid ${COLORS.border}`, background: idx % 2 ? `${COLORS.surface}30` : "transparent" }}>
                <td style={{ padding: "8px 12px", fontWeight: 600, whiteSpace: "nowrap", position: "sticky", left: 0, background: idx % 2 ? COLORS.surface : COLORS.bg, zIndex: 1, fontSize: 13 }}>
                  {t.short_name}
                  {t.swing > 0.4 && <span style={{ color: COLORS.green, fontSize: 9, marginLeft: 4 }}>▲</span>}
                  {t.swing < -0.4 && <span style={{ color: COLORS.red, fontSize: 9, marginLeft: 4 }}>▼</span>}
                </td>
                <td style={{ padding: "8px 6px", textAlign: "center", fontWeight: 700, color: t.rr <= 2.5 ? COLORS.green : t.rr <= 3 ? COLORS.amber : COLORS.red, fontFamily: "monospace", fontSize: 12 }}>
                  {t.rr.toFixed(2)}
                </td>
                {t.fixtures.map((f, i) => {
                  const o = tm[f.opp];
                  return (
                    <td key={i} style={{ padding: "3px 2px", textAlign: "center" }}>
                      <div style={{ background: FDR_COLORS[f.fdr] || COLORS.border, color: FDR_TEXT[f.fdr] || COLORS.text, borderRadius: 6, padding: "6px 2px", fontSize: 11, fontWeight: 700, lineHeight: 1.3 }}>
                        {o?.short_name || "?"}
                        <br />
                        <span style={{ fontSize: 9, fontWeight: 400, opacity: 0.7 }}>{f.home ? "H" : "A"}</span>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Fixture Swing Detector */}
      {(swingBuy.length > 0 || swingSell.length > 0) && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Card>
            <div style={{ fontSize: 10, letterSpacing: 2, color: COLORS.green, marginBottom: 10, fontWeight: 700 }}>FIXTURE SWING: BUY</div>
            <div style={{ fontSize: 11, color: COLORS.textSecondary, marginBottom: 10 }}>Upcoming fixtures significantly easier than season average</div>
            {swingBuy.length === 0 ? (
              <div style={{ fontSize: 12, color: COLORS.textMuted }}>No major positive swings</div>
            ) : (
              swingBuy.map((t) => (
                <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: `1px solid ${COLORS.border}` }}>
                  <span style={{ fontWeight: 600 }}>{t.short_name}</span>
                  <div style={{ display: "flex", gap: 12, fontSize: 11 }}>
                    <span style={{ color: COLORS.textMuted }}>Past: {t.pastAvg.toFixed(1)}</span>
                    <span style={{ color: COLORS.green }}>Next: {t.futAvg.toFixed(1)}</span>
                    <span style={{ color: COLORS.green, fontWeight: 700 }}>+{t.swing.toFixed(1)}</span>
                  </div>
                </div>
              ))
            )}
          </Card>
          <Card>
            <div style={{ fontSize: 10, letterSpacing: 2, color: COLORS.red, marginBottom: 10, fontWeight: 700 }}>FIXTURE SWING: SELL</div>
            <div style={{ fontSize: 11, color: COLORS.textSecondary, marginBottom: 10 }}>Upcoming fixtures significantly harder than season average</div>
            {swingSell.length === 0 ? (
              <div style={{ fontSize: 12, color: COLORS.textMuted }}>No major negative swings</div>
            ) : (
              swingSell.map((t) => (
                <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: `1px solid ${COLORS.border}` }}>
                  <span style={{ fontWeight: 600 }}>{t.short_name}</span>
                  <div style={{ display: "flex", gap: 12, fontSize: 11 }}>
                    <span style={{ color: COLORS.textMuted }}>Past: {t.pastAvg.toFixed(1)}</span>
                    <span style={{ color: COLORS.red }}>Next: {t.futAvg.toFixed(1)}</span>
                    <span style={{ color: COLORS.red, fontWeight: 700 }}>{t.swing.toFixed(1)}</span>
                  </div>
                </div>
              ))
            )}
          </Card>
        </div>
      )}

      {/* Watermark */}
      <div style={{ textAlign: "center", marginTop: 20, fontSize: 10, color: COLORS.textMuted }}>
        FPL Pulse · @adnanrashid
      </div>
    </div>
  );
}
