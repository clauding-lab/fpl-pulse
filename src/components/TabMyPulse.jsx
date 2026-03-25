import { useState, useRef, useCallback } from "react";
import { COLORS, POS_COLORS } from "../utils/theme";
import { Card, StatCard } from "./shared";
import { fetchSquad } from "../utils/api";
import { analyzeSquad } from "../utils/calculations";
import html2canvas from "html2canvas";

function SquadPlayer({ p }) {
  const borderColor = p.status === "green" ? COLORS.green : p.status === "amber" ? COLORS.amber : COLORS.red;
  return (
    <div
      style={{
        background: COLORS.bg,
        borderRadius: 8,
        padding: "8px 12px",
        border: `1px solid ${COLORS.border}`,
        borderLeft: `3px solid ${borderColor}`,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 8,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ color: POS_COLORS[p.pos], fontWeight: 700, fontSize: 9, width: 24 }}>{p.posL}</span>
        <span style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</span>
        {p.isCaptain && <span style={{ fontSize: 9, background: COLORS.amber, color: COLORS.bg, padding: "1px 5px", borderRadius: 3, fontWeight: 700 }}>C</span>}
        {p.isVice && <span style={{ fontSize: 9, background: COLORS.blue, color: COLORS.bg, padding: "1px 5px", borderRadius: 3, fontWeight: 700 }}>V</span>}
      </div>
      <div style={{ display: "flex", gap: 12, fontSize: 11 }}>
        <span style={{ color: COLORS.textSecondary }}>£{p.price}</span>
        <span style={{ color: p.form >= 5 ? COLORS.green : p.form >= 3 ? COLORS.amber : COLORS.red, fontWeight: 700, fontFamily: "monospace" }}>
          {p.form}
        </span>
        <span style={{ color: borderColor, fontWeight: 700, fontFamily: "monospace", width: 32, textAlign: "right" }}>
          {p.composite}
        </span>
      </div>
    </div>
  );
}

function TransferMatrix({ squad }) {
  const starters = squad.filter((p) => !p.isBench);
  const maxForm = Math.max(...starters.map((p) => p.form), 1);
  const maxFR = Math.max(...starters.map((p) => p.fR), 1);

  return (
    <Card>
      <div style={{ fontSize: 10, letterSpacing: 2, color: COLORS.textSecondary, marginBottom: 12, fontWeight: 500 }}>
        TRANSFER PRIORITY MATRIX
      </div>
      <div style={{ position: "relative", height: 260, border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: "hidden" }}>
        {/* Quadrant labels */}
        <div style={{ position: "absolute", top: 8, left: 8, fontSize: 9, color: COLORS.amber, opacity: 0.6 }}>HOLD BUT WATCH</div>
        <div style={{ position: "absolute", top: 8, right: 8, fontSize: 9, color: COLORS.green, opacity: 0.6 }}>HOLD</div>
        <div style={{ position: "absolute", bottom: 8, left: 8, fontSize: 9, color: COLORS.red, opacity: 0.6 }}>SELL</div>
        <div style={{ position: "absolute", bottom: 8, right: 8, fontSize: 9, color: COLORS.textSecondary, opacity: 0.6 }}>ONE MORE WEEK</div>
        {/* Axes */}
        <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 1, background: `${COLORS.border}` }} />
        <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 1, background: `${COLORS.border}` }} />
        {/* Axis labels */}
        <div style={{ position: "absolute", bottom: 2, left: "50%", transform: "translateX(-50%)", fontSize: 8, color: COLORS.textMuted }}>Fixture Rating →</div>
        <div style={{ position: "absolute", left: 2, top: "50%", transform: "translateY(-50%) rotate(-90deg)", fontSize: 8, color: COLORS.textMuted }}>Form →</div>
        {/* Players */}
        {starters.map((p) => {
          const x = (p.fR / maxFR) * 80 + 10;
          const y = 90 - (p.form / maxForm) * 80;
          const dotColor = p.status === "green" ? COLORS.green : p.status === "amber" ? COLORS.amber : COLORS.red;
          return (
            <div
              key={p.id}
              title={`${p.name}: Form ${p.form}, FDR ${p.aFDR.toFixed(1)}`}
              style={{
                position: "absolute",
                left: `${x}%`,
                top: `${y}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: dotColor, border: "2px solid rgba(255,255,255,0.2)" }} />
              <div style={{ fontSize: 8, color: COLORS.text, textAlign: "center", marginTop: 2, whiteSpace: "nowrap", fontWeight: 600 }}>
                {p.name}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export default function TabMyPulse({ data }) {
  const [teamId, setTeamId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [managerName, setManagerName] = useState("");

  const handleFetch = async () => {
    if (!teamId.trim()) return;
    setLoading(true);
    setError(null);
    const result = await fetchSquad(teamId.trim(), data.lastFinishedGW || data.gw);
    if (!result) {
      setError("Could not fetch squad. Check your Team ID and try again.");
      setLoading(false);
      return;
    }
    setManagerName(`${result.entry.player_first_name} ${result.entry.player_last_name}`);
    setAnalysis(analyzeSquad(result.picks, data));
    setLoading(false);
  };

  if (!analysis) {
    return (
      <Card style={{ textAlign: "center", padding: "60px 20px" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: `${COLORS.green}10`, border: `2px solid ${COLORS.green}25`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 28 }}>
          📊
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>My Pulse</div>
        <div style={{ color: COLORS.textSecondary, fontSize: 13, lineHeight: 1.7, maxWidth: 420, margin: "0 auto 24px" }}>
          Enter your FPL Team ID for personalized squad analysis: transfer matrix, weakest link, chip strategy, and Best XI.
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", maxWidth: 340, margin: "0 auto" }}>
          <input
            type="text"
            placeholder="Team ID (e.g. 1234567)"
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleFetch()}
            style={{ flex: 1, background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "12px 16px", color: COLORS.text, fontSize: 14, outline: "none" }}
          />
          <button onClick={handleFetch} disabled={loading} style={{ background: COLORS.green, color: COLORS.bg, border: "none", borderRadius: 8, padding: "12px 24px", fontWeight: 700, cursor: loading ? "wait" : "pointer", fontSize: 14, opacity: loading ? 0.6 : 1 }}>
            {loading ? "..." : "Go"}
          </button>
        </div>
        {error && <div style={{ fontSize: 12, color: COLORS.red, marginTop: 12 }}>{error}</div>}
        <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 14 }}>
          Find your ID: fantasy.premierleague.com → My Team → URL
        </div>
      </Card>
    );
  }

  const { squad, healthScore, weakest, replacement, bestXI, capPick, vicePick, chips } = analysis;
  const starters = squad.filter((p) => !p.isBench);
  const bench = squad.filter((p) => p.isBench);
  const shareRef = useRef(null);
  const [exporting, setExporting] = useState(false);

  const handleShare = useCallback(async () => {
    if (!shareRef.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(shareRef.current, {
        backgroundColor: COLORS.bg,
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const link = document.createElement("a");
      link.download = `fpl-pulse-gw${data.gw}-${managerName.replace(/\s+/g, "-").toLowerCase()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("Export failed:", err);
    }
    setExporting(false);
  }, [data.gw, managerName]);

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{managerName}</div>
          <div style={{ fontSize: 12, color: COLORS.textSecondary }}>GW{data.gw} Squad Analysis</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={handleShare} disabled={exporting} style={{ background: COLORS.green, color: COLORS.bg, border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: exporting ? "wait" : "pointer", opacity: exporting ? 0.6 : 1 }}>
            {exporting ? "Exporting..." : "📸 Share My Pulse"}
          </button>
          <button onClick={() => setAnalysis(null)} style={{ background: COLORS.surface, color: COLORS.textSecondary, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "6px 14px", fontSize: 12, cursor: "pointer" }}>
            Change Team
          </button>
        </div>
      </div>

      {/* Screenshot Zone */}
      <div ref={shareRef} style={{ background: COLORS.bg, padding: 4 }}>

      {/* Health Score + Stats */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
        <StatCard label="SQUAD HEALTH" value={healthScore} sub="/ 100" color={healthScore >= 70 ? COLORS.green : healthScore >= 45 ? COLORS.amber : COLORS.red} />
        <StatCard label="GREENS" value={squad.filter((p) => p.status === "green").length} color={COLORS.green} />
        <StatCard label="AMBERS" value={squad.filter((p) => p.status === "amber").length} color={COLORS.amber} />
        <StatCard label="REDS" value={squad.filter((p) => p.status === "red").length} color={COLORS.red} />
      </div>

      {/* Squad List */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 10, letterSpacing: 2, color: COLORS.textSecondary, marginBottom: 12, fontWeight: 500 }}>STARTING XI</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {starters.map((p) => <SquadPlayer key={p.id} p={p} />)}
        </div>
        {bench.length > 0 && (
          <>
            <div style={{ fontSize: 10, letterSpacing: 2, color: COLORS.textSecondary, marginTop: 16, marginBottom: 8, fontWeight: 500 }}>BENCH</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {bench.map((p) => <SquadPlayer key={p.id} p={p} />)}
            </div>
          </>
        )}
      </Card>

      {/* Transfer Matrix */}
      <div style={{ marginBottom: 16 }}>
        <TransferMatrix squad={squad} />
      </div>

      {/* Weakest Link */}
      {weakest && (
        <Card style={{ marginBottom: 16, borderLeft: `3px solid ${COLORS.red}` }}>
          <div style={{ fontSize: 10, letterSpacing: 2, color: COLORS.textSecondary, marginBottom: 10, fontWeight: 500 }}>WEAKEST LINK</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.red }}>{weakest.name}</div>
              <div style={{ fontSize: 11, color: COLORS.textSecondary }}>{weakest.team} · {weakest.posL} · £{weakest.price} · {weakest.form} form · Score: {weakest.composite}</div>
            </div>
            {replacement && (
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 10, color: COLORS.textSecondary, marginBottom: 2 }}>SUGGESTED REPLACEMENT</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.green }}>{replacement.name}</div>
                <div style={{ fontSize: 11, color: COLORS.textSecondary }}>{replacement.team} · £{replacement.price} · {replacement.form} form · Score: {replacement.fScore}</div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Best XI */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 10, letterSpacing: 2, color: COLORS.textSecondary, marginBottom: 10, fontWeight: 500 }}>OPTIMAL XI SUGGESTION</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {bestXI.map((p) => (
            <div key={p.id} style={{ background: COLORS.bg, borderRadius: 6, padding: "5px 10px", fontSize: 12, display: "flex", alignItems: "center", gap: 6, border: `1px solid ${COLORS.border}` }}>
              <span style={{ color: POS_COLORS[p.pos], fontWeight: 700, fontSize: 9 }}>{p.posL}</span>
              <span style={{ fontWeight: 500 }}>{p.name}</span>
              {p === capPick && <span style={{ fontSize: 9, background: COLORS.amber, color: COLORS.bg, padding: "1px 5px", borderRadius: 3, fontWeight: 700 }}>C</span>}
              {p === vicePick && <span style={{ fontSize: 9, background: COLORS.blue, color: COLORS.bg, padding: "1px 5px", borderRadius: 3, fontWeight: 700 }}>V</span>}
            </div>
          ))}
        </div>
        {capPick && (
          <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 10 }}>
            Captain: <span style={{ color: COLORS.amber, fontWeight: 600 }}>{capPick.name}</span>
            {vicePick && <> · Vice: <span style={{ color: COLORS.blue, fontWeight: 600 }}>{vicePick.name}</span></>}
          </div>
        )}
      </Card>

      {/* Chip Strategist */}
      <Card>
        <div style={{ fontSize: 10, letterSpacing: 2, color: COLORS.textSecondary, marginBottom: 12, fontWeight: 500 }}>CHIP STRATEGIST</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
          {chips.benchBoost && (
            <div style={{ background: COLORS.bg, borderRadius: 8, padding: 12, border: `1px solid ${COLORS.border}`, textAlign: "center" }}>
              <div style={{ fontSize: 9, color: COLORS.textSecondary, letterSpacing: 1, marginBottom: 4 }}>BENCH BOOST</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.green }}>GW{chips.benchBoost}</div>
            </div>
          )}
          {chips.tripleCaptain && (
            <div style={{ background: COLORS.bg, borderRadius: 8, padding: 12, border: `1px solid ${COLORS.border}`, textAlign: "center" }}>
              <div style={{ fontSize: 9, color: COLORS.textSecondary, letterSpacing: 1, marginBottom: 4 }}>TRIPLE CAPTAIN</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.amber }}>GW{chips.tripleCaptain}</div>
            </div>
          )}
          {chips.freeHit && (
            <div style={{ background: COLORS.bg, borderRadius: 8, padding: 12, border: `1px solid ${COLORS.border}`, textAlign: "center" }}>
              <div style={{ fontSize: 9, color: COLORS.textSecondary, letterSpacing: 1, marginBottom: 4 }}>FREE HIT</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.blue }}>GW{chips.freeHit}</div>
            </div>
          )}
          <div style={{ background: COLORS.bg, borderRadius: 8, padding: 12, border: `1px solid ${chips.wildcard ? COLORS.red : COLORS.border}`, textAlign: "center" }}>
            <div style={{ fontSize: 9, color: COLORS.textSecondary, letterSpacing: 1, marginBottom: 4 }}>WILDCARD</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: chips.wildcard ? COLORS.red : COLORS.green }}>
              {chips.wildcard ? "CONSIDER" : "HOLD"}
            </div>
          </div>
        </div>
      </Card>

      {/* Watermark */}
      <div style={{ textAlign: "center", marginTop: 16, fontSize: 10, color: COLORS.textMuted }}>
        FPL Pulse · @adnanrashid
      </div>

      </div>{/* end screenshot zone */}
    </div>
  );
}
