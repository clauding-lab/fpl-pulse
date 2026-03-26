import { useState } from "react";
import { COLORS, POS_COLORS, FDR_COLORS, FDR_TEXT } from "../utils/theme";
import { Card } from "./shared";
import { playerPhotoUrl } from "../utils/api";
import { usePlayerHistory } from "../hooks/usePlayerHistory";

// Mini line chart for last 3 GW points
function Last3Chart({ points }) {
  if (!points || points.length < 2) return <span style={{ color: COLORS.textMuted, fontSize: 9 }}>—</span>;
  const last3 = points.slice(-3);
  const w = 100, h = 50, topPad = 14, botPad = 4;
  const mx = Math.max(...last3, 1);
  const mn = Math.min(...last3, 0);
  const range = mx - mn || 1;
  const chartH = h - topPad - botPad;
  const pts = last3.map((v, i) => {
    const x = 12 + (i / (last3.length - 1)) * (w - 24);
    const y = topPad + chartH - ((v - mn) / range) * chartH;
    return { x, y, v };
  });
  const line = pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const area = `${pts[0].x.toFixed(1)},${h - botPad} ${line} ${pts[pts.length - 1].x.toFixed(1)},${h - botPad}`;
  return (
    <svg width={w} height={h} style={{ overflow: "visible" }}>
      <polygon points={area} fill={`${COLORS.green}15`} />
      <polyline points={line} fill="none" stroke={COLORS.green} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={3} fill={COLORS.green} />
          <text x={p.x} y={p.y - 8} textAnchor="middle" fill={COLORS.text} fontSize={10} fontWeight={700}>{p.v}</text>
        </g>
      ))}
    </svg>
  );
}

// Mini FDR bar chart for next 3 fixtures
function Next3FdrChart({ fixtures, tm }) {
  if (!fixtures || !fixtures.length) return <span style={{ color: COLORS.textMuted, fontSize: 9 }}>—</span>;
  const next3 = fixtures.slice(0, 3);
  return (
    <div style={{ display: "flex", gap: 3, alignItems: "flex-end", height: 36 }}>
      {next3.map((f, i) => {
        const bg = FDR_COLORS[f.fdr] || COLORS.amber;
        const fg = FDR_TEXT[f.fdr] || "#fff";
        const t = tm[f.opp];
        // Bar height: FDR 1 = short (easy), FDR 5 = tall (hard) — inverted so easy = tall green
        const barH = 8 + (5 - f.fdr) * 6;
        return (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <div style={{
              width: 28, height: barH, borderRadius: 3, background: bg,
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "height 0.2s",
            }} />
            <div style={{ fontSize: 8, fontWeight: 700, color: fg === "#fff" ? COLORS.red : COLORS.green }}>
              {t?.short_name || "?"}{f.home ? "" : "(A)"}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function TabHiddenGems({ data }) {
  const [copied, setCopied] = useState(false);
  const gemIds = data.gems.map((p) => p.id);
  const sparkData = usePlayerHistory(gemIds);

  const generateThread = () => {
    const top5 = data.gems.slice(0, 5);
    const lines = [
      `🔍 5 FPL Hidden Gems under 7% ownership — GW${data.gw}\n`,
      ...top5.map((p, i) => {
        const xGG = (p.xG - p.goals).toFixed(1);
        return `${i + 1}. ${p.name} (${p.teamName}, £${p.price}m)\n` +
          `   Form: ${p.form} | xGI/90: ${p.xGI90} | xG gap: ${+xGG > 0 ? "+" : ""}${xGG}\n` +
          `   Own: ${p.own}% | FDR: ${p.aFDR.toFixed(1)}\n`;
      }),
      `\nData: FPL Pulse · Built by @adnanrashid`,
    ];
    return lines.join("\n");
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateThread());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
        <div style={{ fontSize: 14, letterSpacing: 1.5, color: COLORS.text, fontWeight: 700 }}>
          DIFFERENTIALS UNDER 7% OWNERSHIP
        </div>
        <button
          onClick={handleCopy}
          style={{
            background: copied ? COLORS.green : COLORS.surface,
            color: copied ? COLORS.bg : COLORS.green,
            border: `1px solid ${COLORS.green}`,
            borderRadius: 8,
            padding: "6px 16px",
            fontSize: 11,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {copied ? "Copied!" : "Copy Thread"}
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
        {data.gems.map((p) => {
          const xGG = (p.xG - p.goals).toFixed(1);
          const xAG = (p.xA - p.assists).toFixed(1);
          const fx = data.uf[p.teamId] || [];
          const history = sparkData[p.id];
          return (
            <Card key={p.id} style={{ position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, right: 0, background: `${COLORS.green}12`, padding: "4px 14px", borderRadius: "0 12px 0 10px", fontSize: 10, color: COLORS.green, fontWeight: 700 }}>
                {p.own}%
              </div>
              <div style={{ display: "flex", gap: 14 }}>
                <div style={{ width: 50, height: 50, borderRadius: "50%", overflow: "hidden", flexShrink: 0, background: `${POS_COLORS[p.pos]}15`, border: `2px solid ${POS_COLORS[p.pos]}35`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <img
                    src={playerPhotoUrl(p.code)}
                    alt={p.name}
                    style={{ width: 46, height: 46, objectFit: "cover", objectPosition: "top" }}
                    onError={(e) => { e.target.style.display = "none"; e.target.parentNode.innerHTML = `<span style="font-size:13px;font-weight:800;color:${POS_COLORS[p.pos]}">${p.posL}</span>`; }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 2 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: COLORS.textSecondary, marginBottom: 12 }}>{p.teamName} · £{p.price}m</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, fontSize: 11 }}>
                    <div><span style={{ color: COLORS.textMuted }}>Form </span><span style={{ color: COLORS.green, fontWeight: 700 }}>{p.form}</span></div>
                    <div><span style={{ color: COLORS.textMuted }}>xGI/90 </span><span style={{ color: COLORS.blue, fontWeight: 700 }}>{p.xGI90}</span></div>
                    <div><span style={{ color: COLORS.textMuted }}>xG gap </span><span style={{ color: +xGG > 0 ? COLORS.green : COLORS.red, fontWeight: 700 }}>{+xGG > 0 ? "+" : ""}{xGG}</span></div>
                    <div><span style={{ color: COLORS.textMuted }}>xA gap </span><span style={{ color: +xAG > 0 ? COLORS.green : COLORS.red, fontWeight: 700 }}>{+xAG > 0 ? "+" : ""}{xAG}</span></div>
                    <div><span style={{ color: COLORS.textMuted }}>FDR </span><span style={{ color: p.aFDR <= 2.5 ? COLORS.green : p.aFDR <= 3.2 ? COLORS.amber : COLORS.red, fontWeight: 700 }}>{p.aFDR.toFixed(1)}</span></div>
                    <div><span style={{ color: COLORS.textMuted }}>Pts </span><span style={{ fontWeight: 700 }}>{p.pts}</span></div>
                  </div>
                </div>
              </div>

              {/* Charts: Last 3 GW Points + Next 3 FDR */}
              <div style={{ display: "flex", gap: 12, marginTop: 14, paddingTop: 12, borderTop: `1px solid ${COLORS.border}` }}>
                <div style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ fontSize: 8, letterSpacing: 1.5, color: COLORS.textMuted, fontWeight: 600, marginBottom: 4 }}>LAST 3 GW PTS</div>
                  <Last3Chart points={history} />
                </div>
                <div style={{ width: 1, background: COLORS.border }} />
                <div style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ fontSize: 8, letterSpacing: 1.5, color: COLORS.textMuted, fontWeight: 600, marginBottom: 4 }}>NEXT 3 FIXTURES</div>
                  <Next3FdrChart fixtures={fx} tm={data.tm} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Watermark */}
      <div style={{ textAlign: "center", marginTop: 20, fontSize: 10, color: COLORS.textMuted }}>
        FPL Pulse · @adnanrashid
      </div>
    </div>
  );
}
