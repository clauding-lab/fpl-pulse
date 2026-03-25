import { useState } from "react";
import { COLORS, POS_COLORS } from "../utils/theme";
import { SubBtn, PlayerTable, Card } from "./shared";

export default function TabPlayerIntel({ data }) {
  const [subTab, setSubTab] = useState(0);
  const [posF, setPosF] = useState(0);

  const fForm = posF === 0 ? data.fPl : data.fPl.filter((p) => p.pos === posF);

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
        {["Form Tracker", "Floor Kings", "Haul Hunters", "Risk Monitor"].map((s, i) => (
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
    </div>
  );
}
