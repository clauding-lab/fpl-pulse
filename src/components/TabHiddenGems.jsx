import { useState, useEffect } from "react";
import { COLORS, POS_COLORS } from "../utils/theme";
import { Card } from "./shared";
import { playerPhotoUrl } from "../utils/api";
import { fetchClaudeInsight, buildScoutingNotePrompt } from "../utils/claude";

export default function TabHiddenGems({ data }) {
  const [copied, setCopied] = useState(false);
  const [scoutNotes, setScoutNotes] = useState({});

  // Fetch scouting notes for top 5 gems
  useEffect(() => {
    let cancelled = false;
    const fetchNotes = async () => {
      const top5 = data.gems.slice(0, 5);
      for (const p of top5) {
        if (cancelled) break;
        const prompt = buildScoutingNotePrompt(p);
        const text = await fetchClaudeInsight("scouting_note", prompt, `gem-${p.id}-gw${data.gw}`);
        if (!cancelled && text) {
          setScoutNotes((prev) => ({ ...prev, [p.id]: text }));
        }
      }
    };
    fetchNotes();
    return () => { cancelled = true; };
  }, [data.gw]);

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
        <div style={{ fontSize: 10, letterSpacing: 2, color: COLORS.textSecondary, fontWeight: 500 }}>
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
              {/* Claude AI Scouting Note */}
              {scoutNotes[p.id] && (
                <div style={{ marginTop: 12, padding: "10px 12px", background: `${COLORS.blue}08`, border: `1px solid ${COLORS.blue}15`, borderRadius: 8 }}>
                  <div style={{ fontSize: 8, letterSpacing: 1.5, color: COLORS.blue, fontWeight: 700, marginBottom: 4, display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ width: 4, height: 4, borderRadius: "50%", background: COLORS.blue, display: "inline-block" }} />
                    SCOUT NOTE
                  </div>
                  <div style={{ fontSize: 11, color: COLORS.textSecondary, lineHeight: 1.6 }}>{scoutNotes[p.id]}</div>
                </div>
              )}
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
