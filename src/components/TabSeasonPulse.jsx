import { COLORS, POS_COLORS } from "../utils/theme";
import { Card, StatCard, PulseRating } from "./shared";

export default function TabSeasonPulse({ data }) {
  const { pr, sAvg, r3, flagged, gwA, pM, tpl, tH, capHitRate, dgwTeams, bgwTeams, gw } = data;

  const hasDGW = Object.keys(dgwTeams).some((g) => +g === gw);
  const hasBGW = Object.keys(bgwTeams).some((g) => +g === gw);

  return (
    <div>
      {/* DGW/BGW banner */}
      {(hasDGW || hasBGW) && (
        <Card style={{ marginBottom: 16, borderLeft: `3px solid ${hasDGW ? COLORS.green : COLORS.red}`, padding: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: hasDGW ? COLORS.green : COLORS.red }}>
            {hasDGW ? `Double Gameweek ${gw}` : `Blank Gameweek ${gw}`}
            <span style={{ fontWeight: 400, color: COLORS.textSecondary, marginLeft: 8 }}>
              {hasDGW && dgwTeams[gw] ? dgwTeams[gw].join(", ") : ""}
              {hasBGW && bgwTeams[gw] ? bgwTeams[gw].join(", ") + " have no fixture" : ""}
            </span>
          </div>
        </Card>
      )}

      {/* Pulse Rating */}
      <Card style={{ marginBottom: 20 }}>
        <PulseRating value={pr} />
        <p style={{ textAlign: "center", color: COLORS.textSecondary, fontSize: 13, lineHeight: 1.7, maxWidth: 560, margin: "0 auto" }}>
          Season avg: {sAvg.toFixed(1)} pts · Last 3 GWs: {r3.toFixed(1)} pts
          {flagged.length > 0 ? ` · ${flagged.length} premium${flagged.length > 1 ? "s" : ""} flagged` : " · No premium flags"}
        </p>
      </Card>

      {/* Scoring Environment */}
      <Card style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 10, letterSpacing: 2, color: COLORS.textSecondary, marginBottom: 14, fontWeight: 500 }}>SCORING ENVIRONMENT</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 80 }}>
          {gwA.map((g) => {
            const mx = Math.max(...gwA.map((x) => x.avg), 1);
            return (
              <div key={g.gw} title={`GW${g.gw}: ${g.avg}pts`} style={{ flex: 1, height: Math.max((g.avg / mx) * 72, 2), minWidth: 0, background: g.avg >= sAvg ? `${COLORS.green}50` : `${COLORS.red}35`, borderRadius: "3px 3px 0 0" }} />
            );
          })}
        </div>
        <div style={{ height: 1, background: `${COLORS.amber}50`, marginBottom: 6 }} />
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 10, color: COLORS.textMuted }}>GW1</span>
          <span style={{ fontSize: 10, color: COLORS.amber }}>Avg: {sAvg.toFixed(1)}</span>
          <span style={{ fontSize: 10, color: COLORS.textMuted }}>GW{gwA.length}</span>
        </div>
      </Card>

      {/* Position Meta + Captaincy */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
        {pM.map((p) => (
          <StatCard key={p.pos} label={p.label} value={p.v} sub="pts/£m" color={p.color} />
        ))}
        <StatCard label="CAP HIT RATE" value={`${capHitRate}%`} sub="premium delivery" color={capHitRate >= 60 ? COLORS.green : capHitRate >= 40 ? COLORS.amber : COLORS.red} />
      </div>

      {/* Template XI */}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontSize: 10, letterSpacing: 2, color: COLORS.textSecondary, fontWeight: 500 }}>TEMPLATE XI</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: tH >= 5 ? COLORS.green : tH >= 3 ? COLORS.amber : COLORS.red }}>{tH.toFixed(1)} form</div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {tpl.map((p) => (
            <div key={p.id} style={{ background: COLORS.bg, borderRadius: 8, padding: "6px 12px", fontSize: 12, display: "flex", alignItems: "center", gap: 8, border: `1px solid ${COLORS.border}` }}>
              <span style={{ color: POS_COLORS[p.pos], fontWeight: 700, fontSize: 9 }}>{p.posL}</span>
              <span style={{ fontWeight: 500 }}>{p.name}</span>
              <span style={{ color: p.form >= 5 ? COLORS.green : p.form >= 3 ? COLORS.amber : COLORS.red, fontWeight: 700, fontSize: 11, fontFamily: "monospace" }}>{p.form}</span>
              {p.cop !== null && p.cop < 75 && <span style={{ color: COLORS.red, fontSize: 9 }}>⚠</span>}
            </div>
          ))}
        </div>
      </Card>

      {/* Watermark */}
      <div style={{ textAlign: "center", marginTop: 20, fontSize: 10, color: COLORS.textMuted }}>
        FPL Pulse · @adnanrashid
      </div>
    </div>
  );
}
