import { useState, useEffect } from "react";
import { COLORS, POS_COLORS, FDR_COLORS, FDR_TEXT } from "../utils/theme";
import { Card, PlayerTable, InteractiveBarChart } from "./shared";

function GlanceStat({ label, value, sub, color }) {
  return (
    <div style={{ textAlign: "center", minWidth: 90, flex: 1 }}>
      <div style={{ fontSize: 9, letterSpacing: 1.5, color: COLORS.textMuted, marginBottom: 4, fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: color || COLORS.text, fontFamily: "monospace" }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: COLORS.textSecondary, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function Countdown({ deadline }) {
  if (!deadline) return <span style={{ color: COLORS.textMuted }}>—</span>;
  const diff = new Date(deadline) - new Date();
  if (diff <= 0) return <span style={{ color: COLORS.red }}>LIVE</span>;
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  if (d > 0) return <span>{d}d {h}h</span>;
  const m = Math.floor((diff % 3600000) / 60000);
  return <span style={{ color: COLORS.red }}>{h}h {m}m</span>;
}

function FdrCell({ fixture, tm }) {
  if (!fixture) return <div style={{ width: 44, height: 22 }} />;
  const t = tm[fixture.opp];
  const bg = FDR_COLORS[fixture.fdr] || COLORS.amber;
  const fg = FDR_TEXT[fixture.fdr] || "#fff";
  return (
    <div style={{ width: 44, height: 22, borderRadius: 4, background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: fg }}>
      {t?.short_name || "?"}{fixture.home ? "" : "(A)"}
    </div>
  );
}

function SideBySide({ left, right }) {
  return (
    <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
      <div style={{ flex: 1, minWidth: 280 }}>{left}</div>
      <div style={{ flex: 1, minWidth: 280 }}>{right}</div>
    </div>
  );
}

function PitchFormation({ tpl }) {
  const byPos = { 1: [], 2: [], 3: [], 4: [] };
  tpl.forEach((p) => byPos[p.pos]?.push(p));
  // Exactly 1 GK, then fill outfield from most-owned
  const gk = byPos[1].slice(0, 1);
  // Start with minimums: 3 DEF, 3 MID, 1 FWD
  const def = byPos[2].slice(0, 3);
  const mid = byPos[3].slice(0, 3);
  const fwd = byPos[4].slice(0, 1);
  const placed = new Set([...gk, ...def, ...mid, ...fwd].map((p) => p.id));
  // remaining outfield players only — skip extra GKs (only 1 allowed)
  const remaining = tpl.filter((p) => !placed.has(p.id) && p.pos !== 1);
  while (gk.length + def.length + mid.length + fwd.length < 11 && remaining.length) {
    const p = remaining.shift();
    if (p.pos === 2 && def.length < 5) def.push(p);
    else if (p.pos === 3 && mid.length < 5) mid.push(p);
    else if (p.pos === 4 && fwd.length < 3) fwd.push(p);
    else if (def.length < 5) def.push(p);
    else if (mid.length < 5) mid.push(p);
  }

  const PlayerNode = ({ p }) => (
    <div style={{ textAlign: "center", minWidth: 70 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", textShadow: "0 1px 3px rgba(0,0,0,0.7)" }}>{p.name}</div>
      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.7)" }}>{p.own}%</div>
      <span style={{
        fontSize: 11, fontWeight: 700, fontFamily: "monospace",
        color: p.form >= 5 ? COLORS.green : p.form >= 3 ? COLORS.amber : COLORS.red,
      }}>
        {p.form}
      </span>
      {p.cop !== null && p.cop < 75 && <span style={{ marginLeft: 3, fontSize: 10 }} title={`${p.cop}% chance of playing`}>⚠</span>}
    </div>
  );

  const Row = ({ players }) => (
    <div style={{ display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
      {players.map((p) => <PlayerNode key={p.id} p={p} />)}
    </div>
  );

  const W = "rgba(255,255,255,0.18)";
  return (
    <div style={{
      background: "linear-gradient(180deg, #1a5c2e 0%, #237a3c 30%, #1a5c2e 60%, #237a3c 100%)",
      borderRadius: 12, padding: "28px 16px 20px", position: "relative", overflow: "hidden",
    }}>
      {/* Pitch outline */}
      <div style={{ position: "absolute", top: 8, left: 8, right: 8, bottom: 8, border: `2px solid ${W}`, borderRadius: 4 }} />
      {/* Halfway line */}
      <div style={{ position: "absolute", top: "50%", left: 8, right: 8, height: 0, borderTop: `2px solid ${W}` }} />
      {/* Centre circle */}
      <div style={{ position: "absolute", top: "50%", left: "50%", width: 80, height: 80, transform: "translate(-50%, -50%)", borderRadius: "50%", border: `2px solid ${W}` }} />
      {/* Centre spot */}
      <div style={{ position: "absolute", top: "50%", left: "50%", width: 6, height: 6, transform: "translate(-50%, -50%)", borderRadius: "50%", background: W }} />
      {/* Penalty box (bottom half = attacking end) */}
      <div style={{ position: "absolute", bottom: 8, left: "50%", width: "50%", height: "22%", transform: "translateX(-50%)", borderTop: `2px solid ${W}`, borderLeft: `2px solid ${W}`, borderRight: `2px solid ${W}` }} />
      {/* 6-yard box */}
      <div style={{ position: "absolute", bottom: 8, left: "50%", width: "24%", height: "10%", transform: "translateX(-50%)", borderTop: `2px solid ${W}`, borderLeft: `2px solid ${W}`, borderRight: `2px solid ${W}` }} />
      {/* Defensive half penalty box (top) */}
      <div style={{ position: "absolute", top: 8, left: "50%", width: "50%", height: "22%", transform: "translateX(-50%)", borderBottom: `2px solid ${W}`, borderLeft: `2px solid ${W}`, borderRight: `2px solid ${W}` }} />
      {/* Defensive 6-yard box */}
      <div style={{ position: "absolute", top: 8, left: "50%", width: "24%", height: "10%", transform: "translateX(-50%)", borderBottom: `2px solid ${W}`, borderLeft: `2px solid ${W}`, borderRight: `2px solid ${W}` }} />
      {/* Corner arcs */}
      <div style={{ position: "absolute", top: 2, left: 2, width: 16, height: 16, borderBottomRightRadius: 16, borderRight: `2px solid ${W}`, borderBottom: `2px solid ${W}` }} />
      <div style={{ position: "absolute", top: 2, right: 2, width: 16, height: 16, borderBottomLeftRadius: 16, borderLeft: `2px solid ${W}`, borderBottom: `2px solid ${W}` }} />
      <div style={{ position: "absolute", bottom: 2, left: 2, width: 16, height: 16, borderTopRightRadius: 16, borderRight: `2px solid ${W}`, borderTop: `2px solid ${W}` }} />
      <div style={{ position: "absolute", bottom: 2, right: 2, width: 16, height: 16, borderTopLeftRadius: 16, borderLeft: `2px solid ${W}`, borderTop: `2px solid ${W}` }} />
      {/* Grass stripe effect */}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <div key={i} style={{ position: "absolute", top: `${i * 12.5}%`, left: 0, right: 0, height: "6.25%", background: i % 2 === 0 ? "rgba(255,255,255,0.03)" : "transparent" }} />
      ))}
      {/* Players */}
      <div style={{ display: "flex", flexDirection: "column", gap: 22, position: "relative", zIndex: 1 }}>
        <Row players={fwd} />
        <Row players={mid} />
        <Row players={def} />
        <Row players={gk} />
      </div>
    </div>
  );
}

function DualBarChart({ gwA, sAvg, top100kAvgs }) {
  const [hovIdx, setHovIdx] = useState(null);
  const allVals = [...gwA.map((x) => x.avg), ...(top100kAvgs ? Object.values(top100kAvgs) : [])];
  const mx = Math.max(...allVals, 1);
  const topSeasonAvg = top100kAvgs
    ? +(Object.values(top100kAvgs).reduce((a, b) => a + b, 0) / Object.values(top100kAvgs).length).toFixed(1)
    : null;
  const H = 140;
  const hovered = hovIdx !== null ? gwA[hovIdx] : null;
  const hovTopAvg = hovIdx !== null ? top100kAvgs?.[gwA[hovIdx]?.gw] : null;

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, flexWrap: "wrap", gap: 8 }}>
        <div style={{ fontSize: 14, letterSpacing: 1.5, color: COLORS.text, fontWeight: 700 }}>AVERAGE MANAGER SCORE BY GW</div>
        <div style={{ display: "flex", gap: 14, fontSize: 9, color: COLORS.textSecondary }}>
          <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: "#22c55e", marginRight: 4, verticalAlign: "middle" }} />Above Avg</span>
          <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: "#ef4444", marginRight: 4, verticalAlign: "middle" }} />Below Avg</span>
          <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: "#3b82f6", marginRight: 4, verticalAlign: "middle" }} />Top 100 Elite{top100kAvgs ? "" : " (loading...)"}</span>
        </div>
      </div>
      <div style={{ fontSize: 9, color: COLORS.textMuted, marginBottom: 4 }}>
        Green = above season avg · Red = below · Blue = top 100 elite average
      </div>

      {/* Fixed-height tooltip — always rendered to prevent reflow */}
      <div style={{ height: 26, marginBottom: 4 }}>
        {hovered && (
          <div style={{ display: "flex", gap: 16, fontSize: 11, fontWeight: 600, color: COLORS.text }}>
            <span>GW{hovered.gw}</span>
            <span>All: <span style={{ color: hovered.avg >= sAvg ? "#22c55e" : "#ef4444", fontFamily: "monospace" }}>{hovered.avg.toFixed(1)}</span></span>
            {hovTopAvg != null && <span>Top 100: <span style={{ color: "#3b82f6", fontFamily: "monospace" }}>{hovTopAvg.toFixed(1)}</span></span>}
            {hovTopAvg != null && <span style={{ color: COLORS.textMuted }}>Gap: <span style={{ color: "#3b82f6", fontWeight: 700 }}>+{(hovTopAvg - hovered.avg).toFixed(1)}</span></span>}
          </div>
        )}
      </div>

      {/* Div-based bars — no SVG viewBox, no scaling artifacts */}
      <div
        style={{ display: "flex", alignItems: "flex-end", gap: 1, height: H, cursor: "crosshair" }}
        onMouseLeave={() => setHovIdx(null)}
      >
        {gwA.map((g, i) => {
          const topAvg = top100kAvgs?.[g.gw];
          const isHov = hovIdx === i;
          const allH = Math.max((g.avg / mx) * (H - 8), 3);
          const topH = topAvg ? Math.max((topAvg / mx) * (H - 8), 3) : 0;
          return (
            <div
              key={g.gw}
              style={{
                flex: 1, minWidth: 0, display: "flex", gap: 1, alignItems: "flex-end", justifyContent: "center",
                height: "100%",
                opacity: hovIdx !== null && !isHov ? 0.35 : 1,
              }}
              onMouseEnter={() => setHovIdx(i)}
            >
              <div style={{
                flex: 1, height: allH, maxWidth: 12,
                background: g.avg >= sAvg ? "#22c55e" : "#ef4444",
                borderRadius: "2px 2px 0 0",
              }} />
              {topH > 0 && (
                <div style={{
                  flex: 1, height: topH, maxWidth: 12,
                  background: "#3b82f6",
                  borderRadius: "2px 2px 0 0",
                }} />
              )}
            </div>
          );
        })}
      </div>
      <div style={{ height: 1, background: `${COLORS.amber}50`, marginTop: 2, marginBottom: 6 }} />
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontSize: 10, color: COLORS.textMuted }}>GW1</span>
        <span style={{ fontSize: 10, color: COLORS.amber }}>All Avg: {sAvg.toFixed(1)}{topSeasonAvg ? ` · Top 100 Avg: ${topSeasonAvg}` : ""}</span>
        <span style={{ fontSize: 10, color: COLORS.textMuted }}>GW{gwA.length}</span>
      </div>
    </Card>
  );
}

function PosFilter({ value, onChange }) {
  const opts = [
    { l: "ALL", v: 0 },
    { l: "GK", v: 1 },
    { l: "DEF", v: 2 },
    { l: "MID", v: 3 },
    { l: "FWD", v: 4 },
  ];
  return (
    <div style={{ display: "flex", gap: 3 }}>
      {opts.map((o) => (
        <button
          key={o.v}
          onClick={() => onChange(o.v)}
          style={{
            background: value === o.v ? COLORS.green : COLORS.surface,
            color: value === o.v ? COLORS.bg : COLORS.textSecondary,
            border: `1px solid ${value === o.v ? COLORS.green : COLORS.border}`,
            borderRadius: 6, padding: "3px 10px", fontSize: 10, fontWeight: 600, cursor: "pointer",
          }}
        >
          {o.l}
        </button>
      ))}
    </div>
  );
}

function filterByPos(arr, pos, limit = 10) {
  const filtered = !pos ? arr : arr.filter((p) => p.pos === pos || p.posN === pos);
  return filtered.slice(0, limit);
}

export default function TabSeasonPulse({ data }) {
  const { glance, gwA, sAvg, defcon, seasonValue, formValue, tpl, tH, risers, fallers, tm, uf } = data;
  const [bestValPos, setBestValPos] = useState(0);
  const [smartPos, setSmartPos] = useState(0);

  // Top 100K GW averages
  const [top100kAvgs, setTop100kAvgs] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const cacheKey = `fpl_top100k_avg_gw${glance.gw}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) { setTop100kAvgs(JSON.parse(cached)); return; }

    fetch("/api/top100k-avg")
      .then((r) => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); })
      .then((d) => {
        if (!cancelled) {
          const map = {};
          d.gwAvgs.forEach((g) => { map[g.gw] = g.avg; });
          setTop100kAvgs(map);
          sessionStorage.setItem(cacheKey, JSON.stringify(map));
        }
      })
      .catch(() => { /* silently fail — chart still works without top100k */ });
    return () => { cancelled = true; };
  }, [glance.gw]);

  // Smart Money: fetch Top 500 ownership on mount
  const [smartMoney, setSmartMoney] = useState(null);
  const [smLoading, setSmLoading] = useState(false);
  const [smError, setSmError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const cacheKey = `fpl_smart_money_v2_gw${glance.gw}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) { setSmartMoney(JSON.parse(cached)); return; }

    setSmLoading(true);
    fetch("/api/smart-money?v=2")
      .then((r) => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); })
      .then((d) => { if (!cancelled) { setSmartMoney(d); sessionStorage.setItem(cacheKey, JSON.stringify(d)); } })
      .catch((e) => { if (!cancelled) setSmError(e.message); })
      .finally(() => { if (!cancelled) setSmLoading(false); });
    return () => { cancelled = true; };
  }, [glance.gw]);

  // DEFCON: fetch actual per-game FPL pts for top 30 candidates
  const [dcData, setDcData] = useState(null);
  const [dcLoading, setDcLoading] = useState(false);

  useEffect(() => {
    if (!defcon.length) return;
    let cancelled = false;
    const cacheKey = `fpl_defcon_detail_gw${glance.gw}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) { setDcData(JSON.parse(cached)); return; }

    const top30Ids = defcon.slice(0, 30).map((p) => p.id).join(",");
    setDcLoading(true);
    fetch(`/api/defcon-detail?ids=${top30Ids}`)
      .then((r) => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); })
      .then((d) => {
        if (!cancelled) {
          setDcData(d.players);
          sessionStorage.setItem(cacheKey, JSON.stringify(d.players));
        }
      })
      .catch(() => { /* silently fail — table still works with raw defCon */ })
      .finally(() => { if (!cancelled) setDcLoading(false); });
    return () => { cancelled = true; };
  }, [defcon, glance.gw]);

  // Merge actual FPL pts into defcon list and sort by dcFplPts
  const defconMerged = defcon.slice(0, 30).map((p) => {
    const detail = dcData?.find((d) => d.id === p.id);
    return detail
      ? { ...p, dcFplPts: detail.dcFplPts, gamesHit: detail.gamesHit, gamesPlayed: detail.gamesPlayed, hitRate: detail.hitRate }
      : p;
  }).sort((a, b) => (b.dcFplPts ?? -1) - (a.dcFplPts ?? -1));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Panel 1: GW at a Glance */}
      <Card>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-around", alignItems: "center" }}>
          <GlanceStat label="GAMEWEEK" value={`GW${glance.gw}`} sub={<Countdown deadline={glance.deadline} />} />
          <GlanceStat
            label="LAST GW AVG"
            value={glance.lastAvg.toFixed(1)}
            sub={`${glance.lastVsSeason >= 0 ? "▲" : "▼"} ${Math.abs(glance.lastVsSeason).toFixed(1)} vs avg`}
            color={glance.lastVsSeason >= 0 ? COLORS.green : COLORS.red}
          />
          <GlanceStat label="SEASON AVG" value={glance.sAvg.toFixed(1)} />
          <GlanceStat label="MOST CAPTAINED" value={glance.mostCaptained} color={COLORS.amber} />
          <GlanceStat label="HIGHEST SCORE" value={glance.lastHighest} color={COLORS.green} />
        </div>
      </Card>

      {/* Panel 2: Template Tracker — Pitch Formation */}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontSize: 14, letterSpacing: 1.5, color: COLORS.text, fontWeight: 700 }}>TEMPLATE TRACKER</div>
          <div style={{ fontSize: 12, color: COLORS.amber, fontWeight: 700 }}>{tH.toFixed(1)} avg form</div>
        </div>
        <PitchFormation tpl={tpl} />
        <div style={{ textAlign: "center", marginTop: 12, fontSize: 10, color: COLORS.textMuted }}>
          FPL Pulse
        </div>
      </Card>

      {/* Panel 3: Price Movers */}
      <Card>
        <div style={{ fontSize: 14, letterSpacing: 1.5, color: COLORS.text, marginBottom: 14, fontWeight: 700 }}>PRICE MOVERS</div>
        <SideBySide
          left={
            <>
              <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.green, marginBottom: 8 }}>Risers ▲</div>
              {risers.length === 0 ? (
                <div style={{ fontSize: 12, color: COLORS.textMuted, padding: 12 }}>No price rises this GW</div>
              ) : (
                risers.map((p) => (
                  <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: `1px solid ${COLORS.border}` }}>
                    <span style={{ color: POS_COLORS[p.pos], fontWeight: 700, fontSize: 9, width: 24 }}>{p.posL}</span>
                    <span style={{ fontWeight: 600, fontSize: 13, flex: 1 }}>{p.name}</span>
                    <span style={{ fontSize: 11, color: COLORS.textSecondary }}>{p.team}</span>
                    <span style={{ fontSize: 12, fontFamily: "monospace", fontWeight: 600 }}>£{p.price}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.green }}>+{(p.pChg / 10).toFixed(1)}</span>
                    <span style={{ fontSize: 10, color: COLORS.textMuted }}>{p.own}%</span>
                  </div>
                ))
              )}
            </>
          }
          right={
            <>
              <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.red, marginBottom: 8 }}>Fallers ▼</div>
              {fallers.length === 0 ? (
                <div style={{ fontSize: 12, color: COLORS.textMuted, padding: 12 }}>No price drops this GW</div>
              ) : (
                fallers.map((p) => (
                  <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: `1px solid ${COLORS.border}` }}>
                    <span style={{ color: POS_COLORS[p.pos], fontWeight: 700, fontSize: 9, width: 24 }}>{p.posL}</span>
                    <span style={{ fontWeight: 600, fontSize: 13, flex: 1 }}>{p.name}</span>
                    <span style={{ fontSize: 11, color: COLORS.textSecondary }}>{p.team}</span>
                    <span style={{ fontSize: 12, fontFamily: "monospace", fontWeight: 600 }}>£{p.price}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.red }}>{(p.pChg / 10).toFixed(1)}</span>
                    <span style={{ fontSize: 10, color: COLORS.textMuted }}>{p.own}%</span>
                  </div>
                ))
              )}
            </>
          }
        />
      </Card>

      {/* Panel 4: DEFCON Leaders */}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontSize: 14, letterSpacing: 1.5, color: COLORS.text, fontWeight: 700 }}>DEFCON LEADERS — DEFENSIVE CONTRIBUTION</div>
          {dcLoading && <div style={{ fontSize: 9, color: COLORS.blue }}>Loading per-game data...</div>}
          {dcData && <div style={{ fontSize: 9, color: COLORS.textMuted }}>Sorted by actual FPL pts from DefCon</div>}
        </div>
        <div style={{ fontSize: 9, color: COLORS.textMuted, marginBottom: 10 }}>
          DEF/GK: 10+ defensive actions per game = 2 FPL pts · MID/FWD: 12+ = 2 FPL pts (capped at 2/game)
        </div>
        <PlayerTable
          players={defconMerged.slice(0, 10)}
          columns={[
            { header: "#", render: (_, i) => i + 1, style: () => ({ color: COLORS.textMuted, fontSize: 11 }) },
            { header: "Player", render: (p) => p.name, style: () => ({ fontWeight: 600, whiteSpace: "nowrap" }) },
            { header: "Pos", render: (p) => <span style={{ color: POS_COLORS[p.pos], fontWeight: 700, fontSize: 10 }}>{p.posL}</span> },
            { header: "Team", render: (p) => p.team, style: () => ({ color: COLORS.textSecondary }) },
            { header: "£", render: (p) => p.price, style: () => ({ fontFamily: "monospace" }) },
            { header: "Pts", render: (p) => p.pts, style: () => ({ fontWeight: 700 }) },
            {
              header: "DC Pts",
              render: (p) => p.dcFplPts !== null ? p.dcFplPts : "—",
              style: (p) => ({ fontWeight: 800, color: COLORS.green, fontFamily: "monospace", fontSize: 13 }),
              title: "Actual FPL points earned from defensive contributions (2 or 0 per game)"
            },
            {
              header: "Hit%",
              render: (p) => p.hitRate !== undefined ? `${p.hitRate}%` : "—",
              style: (p) => ({ color: (p.hitRate || 0) >= 60 ? COLORS.green : (p.hitRate || 0) >= 40 ? COLORS.amber : COLORS.textSecondary }),
              title: "% of games where DefCon threshold was hit"
            },
            { header: "DefCon", render: (p) => p.defCon, style: () => ({ fontFamily: "monospace", color: COLORS.blue }), title: "Raw cumulative defensive contribution stat" },
            { header: "DC/90", render: (p) => p.defCon90, style: () => ({ fontFamily: "monospace", color: COLORS.textSecondary }), title: "Defensive contribution per 90 mins" },
            { header: "CS", render: (p) => p.cs, style: () => ({ fontWeight: 600 }) },
            { header: "Form", render: (p) => p.form, style: (p) => ({ fontWeight: 700, color: p.form >= 5 ? COLORS.green : p.form >= 3 ? COLORS.amber : COLORS.red }) },
            {
              header: "Next 3",
              render: (p) => {
                const fx = uf[p.teamId]?.slice(0, 3) || [];
                return (
                  <div style={{ display: "flex", gap: 2 }}>
                    {fx.map((f, i) => <FdrCell key={i} fixture={f} tm={tm} />)}
                  </div>
                );
              },
            },
          ]}
        />
        <div style={{ textAlign: "center", marginTop: 12, fontSize: 10, color: COLORS.textMuted }}>
          FPL Pulse
        </div>
      </Card>

      {/* Panel 5: Best Value */}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
          <div style={{ fontSize: 14, letterSpacing: 1.5, color: COLORS.text, fontWeight: 700 }}>BEST VALUE — POINTS PER MILLION</div>
          <PosFilter value={bestValPos} onChange={setBestValPos} />
        </div>
        <SideBySide
          left={
            <>
              <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.text, marginBottom: 8 }}>Season Value Kings</div>
              <PlayerTable
                players={filterByPos(seasonValue, bestValPos)}
                columns={[
                  { header: "#", render: (_, i) => i + 1, style: () => ({ color: COLORS.textMuted, fontSize: 11 }) },
                  { header: "Player", render: (p) => p.name, style: () => ({ fontWeight: 600, whiteSpace: "nowrap" }) },
                  { header: "Pos", render: (p) => <span style={{ color: POS_COLORS[p.pos], fontWeight: 700, fontSize: 10 }}>{p.posL}</span> },
                  { header: "Team", render: (p) => p.team, style: () => ({ color: COLORS.textSecondary }) },
                  { header: "£", render: (p) => p.price, style: () => ({ fontFamily: "monospace" }) },
                  { header: "Pts", render: (p) => p.pts, style: () => ({ fontWeight: 600 }) },
                  { header: "Pts/£M", render: (p) => p.ptsPM, style: () => ({ fontWeight: 800, color: COLORS.green, fontFamily: "monospace" }) },
                ]}
              />
            </>
          }
          right={
            <>
              <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.text, marginBottom: 8 }}>Recent Form Value</div>
              <PlayerTable
                players={filterByPos(formValue, bestValPos)}
                columns={[
                  { header: "#", render: (_, i) => i + 1, style: () => ({ color: COLORS.textMuted, fontSize: 11 }) },
                  { header: "Player", render: (p) => p.name, style: () => ({ fontWeight: 600, whiteSpace: "nowrap" }) },
                  { header: "Pos", render: (p) => <span style={{ color: POS_COLORS[p.pos], fontWeight: 700, fontSize: 10 }}>{p.posL}</span> },
                  { header: "Team", render: (p) => p.team, style: () => ({ color: COLORS.textSecondary }) },
                  { header: "£", render: (p) => p.price, style: () => ({ fontFamily: "monospace" }) },
                  { header: "Form", render: (p) => p.form, style: (p) => ({ fontWeight: 700, color: p.form >= 5 ? COLORS.green : p.form >= 3 ? COLORS.amber : COLORS.red }) },
                  { header: "Form/£M", render: (p) => p.formPM, style: () => ({ fontWeight: 800, color: COLORS.green, fontFamily: "monospace" }) },
                ]}
              />
            </>
          }
        />
        <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 10, fontStyle: "italic" }}>
          Players in the right table but not the left are underpriced by the market.
        </div>
      </Card>

      {/* Panel 4: Smart Money */}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
          <div style={{ fontSize: 14, letterSpacing: 1.5, color: COLORS.text, fontWeight: 700 }}>SMART MONEY — TOP 500 VS ALL MANAGERS</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {smartMoney && <div style={{ fontSize: 9, color: COLORS.textMuted }}>{smartMoney.managersScanned} managers scanned</div>}
            <PosFilter value={smartPos} onChange={setSmartPos} />
          </div>
        </div>
        {smLoading && (
          <div style={{ textAlign: "center", padding: "24px 0", color: COLORS.textMuted, fontSize: 12 }}>
            Scanning top managers' picks... this takes ~15s
          </div>
        )}
        {smError && (
          <div style={{ textAlign: "center", padding: "24px 0", color: COLORS.red, fontSize: 12 }}>
            Failed to load smart money data ({smError})
          </div>
        )}
        {smartMoney && (
          <SideBySide
            left={
              <>
                <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.green, marginBottom: 8 }}>Smart Buys — Elite own more</div>
                <PlayerTable
                  players={filterByPos(smartMoney.smartBuys, smartPos)}
                  columns={[
                    { header: "#", render: (_, i) => i + 1, style: () => ({ color: COLORS.textMuted, fontSize: 11 }) },
                    { header: "Player", render: (p) => p.name, style: () => ({ fontWeight: 600, whiteSpace: "nowrap" }) },
                    { header: "Pos", render: (p) => <span style={{ color: POS_COLORS[p.posN], fontWeight: 700, fontSize: 10 }}>{p.pos}</span> },
                    { header: "Team", render: (p) => p.team, style: () => ({ color: COLORS.textSecondary }) },
                    { header: "£", render: (p) => p.price, style: () => ({ fontFamily: "monospace" }) },
                    { header: "Top%", render: (p) => `${p.top_own}%`, style: () => ({ fontWeight: 600, color: COLORS.green }) },
                    { header: "All%", render: (p) => `${p.overall_own}%`, style: () => ({ color: COLORS.textSecondary }) },
                    { header: "Gap", render: (p) => `+${p.gap}`, style: () => ({ fontWeight: 800, color: COLORS.green, fontFamily: "monospace" }) },
                  ]}
                />
              </>
            }
            right={
              <>
                <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.red, marginBottom: 8 }}>Casual Traps — Field over-owns</div>
                <PlayerTable
                  players={filterByPos(smartMoney.casualTraps, smartPos)}
                  columns={[
                    { header: "#", render: (_, i) => i + 1, style: () => ({ color: COLORS.textMuted, fontSize: 11 }) },
                    { header: "Player", render: (p) => p.name, style: () => ({ fontWeight: 600, whiteSpace: "nowrap" }) },
                    { header: "Pos", render: (p) => <span style={{ color: POS_COLORS[p.posN], fontWeight: 700, fontSize: 10 }}>{p.pos}</span> },
                    { header: "Team", render: (p) => p.team, style: () => ({ color: COLORS.textSecondary }) },
                    { header: "£", render: (p) => p.price, style: () => ({ fontFamily: "monospace" }) },
                    { header: "Top%", render: (p) => `${p.top_own}%`, style: () => ({ color: COLORS.textSecondary }) },
                    { header: "All%", render: (p) => `${p.overall_own}%`, style: () => ({ fontWeight: 600, color: COLORS.red }) },
                    { header: "Gap", render: (p) => `${p.gap}`, style: () => ({ fontWeight: 800, color: COLORS.red, fontFamily: "monospace" }) },
                  ]}
                />
              </>
            }
          />
        )}
        {!smLoading && !smError && !smartMoney && (
          <div style={{ textAlign: "center", padding: "24px 0", color: COLORS.textMuted, fontSize: 12 }}>
            Smart money data loading...
          </div>
        )}
      </Card>

      {/* Panel 5: Average Manager Score by GW — Interactive Dual Bar */}
      <DualBarChart gwA={gwA} sAvg={sAvg} top100kAvgs={top100kAvgs} />

    </div>
  );
}
