import { useState, useEffect } from "react";
import { COLORS, POS_COLORS, FDR_COLORS, FDR_TEXT } from "../utils/theme";
import { Card, PlayerTable } from "./shared";

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
  const gk = byPos[1].slice(0, 1);
  const def = byPos[2].slice(0, 4);
  const mid = byPos[3].slice(0, 4);
  const fwd = byPos[4].slice(0, 2);
  const placed = new Set([...gk, ...def, ...mid, ...fwd].map((p) => p.id));
  const remaining = tpl.filter((p) => !placed.has(p.id));
  while (gk.length + def.length + mid.length + fwd.length < 11 && remaining.length) {
    const p = remaining.shift();
    if (p.pos === 2 && def.length < 5) def.push(p);
    else if (p.pos === 3 && mid.length < 5) mid.push(p);
    else if (p.pos === 4 && fwd.length < 3) fwd.push(p);
    else mid.push(p);
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

  return (
    <div style={{
      background: "linear-gradient(180deg, #1a472a 0%, #2d6a3e 40%, #1a472a 100%)",
      borderRadius: 12, padding: "24px 16px", position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", top: "50%", left: "10%", right: "10%", height: 1, background: "rgba(255,255,255,0.15)" }} />
      <div style={{ position: "absolute", top: "35%", left: "25%", right: "25%", bottom: "35%", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6 }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 20, position: "relative", zIndex: 1 }}>
        <Row players={fwd} />
        <Row players={mid} />
        <Row players={def} />
        <Row players={gk} />
      </div>
    </div>
  );
}

export default function TabSeasonPulse({ data }) {
  const { glance, gwA, sAvg, defcon, seasonValue, formValue, tpl, tH, risers, fallers, tm, uf } = data;

  // Smart Money: fetch Top 500 ownership on mount
  const [smartMoney, setSmartMoney] = useState(null);
  const [smLoading, setSmLoading] = useState(false);
  const [smError, setSmError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const cacheKey = `fpl_smart_money_gw${glance.gw}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) { setSmartMoney(JSON.parse(cached)); return; }

    setSmLoading(true);
    fetch("/api/smart-money")
      .then((r) => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); })
      .then((d) => { if (!cancelled) { setSmartMoney(d); sessionStorage.setItem(cacheKey, JSON.stringify(d)); } })
      .catch((e) => { if (!cancelled) setSmError(e.message); })
      .finally(() => { if (!cancelled) setSmLoading(false); });
    return () => { cancelled = true; };
  }, [glance.gw]);

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
          <div style={{ fontSize: 10, letterSpacing: 2, color: COLORS.textSecondary, fontWeight: 500 }}>TEMPLATE TRACKER</div>
          <div style={{ fontSize: 12, color: COLORS.amber, fontWeight: 700 }}>{tH.toFixed(1)} avg form</div>
        </div>
        <PitchFormation tpl={tpl} />
        <div style={{ textAlign: "center", marginTop: 12, fontSize: 10, color: COLORS.textMuted }}>
          FPL Pulse · @adnanrashid
        </div>
      </Card>

      {/* Panel 3: Price Movers */}
      <Card>
        <div style={{ fontSize: 10, letterSpacing: 2, color: COLORS.textSecondary, marginBottom: 14, fontWeight: 500 }}>PRICE MOVERS</div>
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
        <div style={{ fontSize: 10, letterSpacing: 2, color: COLORS.textSecondary, marginBottom: 14, fontWeight: 500 }}>DEFCON LEADERS — DEFENSIVE CONTRIBUTION</div>
        <PlayerTable
          players={defcon.slice(0, 15)}
          columns={[
            { header: "#", render: (_, i) => i + 1, style: () => ({ color: COLORS.textMuted, fontSize: 11 }) },
            { header: "Player", render: (p) => p.name, style: () => ({ fontWeight: 600, whiteSpace: "nowrap" }) },
            { header: "Pos", render: (p) => <span style={{ color: POS_COLORS[p.pos], fontWeight: 700, fontSize: 10 }}>{p.posL}</span> },
            { header: "Team", render: (p) => p.team, style: () => ({ color: COLORS.textSecondary }) },
            { header: "£", render: (p) => p.price, style: () => ({ fontFamily: "monospace" }) },
            { header: "CS", render: (p) => p.cs, style: () => ({ fontWeight: 600 }) },
            { header: "CS%", render: (p) => `${(p.csRate * 100).toFixed(0)}%`, style: (p) => ({ color: p.csRate >= 0.35 ? COLORS.green : COLORS.textSecondary }) },
            { header: "DefCon", render: (p) => p.defCon, style: () => ({ fontWeight: 800, color: COLORS.green, fontFamily: "monospace" }), title: "Defensive Contribution pts (max 2/game)" },
            { header: "DC/90", render: (p) => p.defCon90, style: () => ({ fontFamily: "monospace", color: COLORS.blue }), title: "Defensive Contribution per 90 mins" },
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
          FPL Pulse · @adnanrashid
        </div>
      </Card>

      {/* Panel 5: Best Value */}
      <Card>
        <div style={{ fontSize: 10, letterSpacing: 2, color: COLORS.textSecondary, marginBottom: 14, fontWeight: 500 }}>BEST VALUE — POINTS PER MILLION</div>
        <SideBySide
          left={
            <>
              <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.text, marginBottom: 8 }}>Season Value Kings</div>
              <PlayerTable
                players={seasonValue}
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
                players={formValue}
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontSize: 10, letterSpacing: 2, color: COLORS.textSecondary, fontWeight: 500 }}>SMART MONEY — TOP 500 VS ALL MANAGERS</div>
          {smartMoney && (
            <div style={{ fontSize: 9, color: COLORS.textMuted }}>
              {smartMoney.managersScanned} managers scanned
            </div>
          )}
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
                  players={smartMoney.smartBuys}
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
                  players={smartMoney.casualTraps}
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

      {/* Panel 5: Average Manager Score by GW */}
      <Card>
        <div style={{ fontSize: 10, letterSpacing: 2, color: COLORS.textSecondary, marginBottom: 14, fontWeight: 500 }}>AVERAGE MANAGER SCORE BY GW</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 100, paddingTop: 18 }}>
          {gwA.map((g) => {
            const mx = Math.max(...gwA.map((x) => x.avg), 1);
            const mn = Math.min(...gwA.map((x) => x.avg));
            const isMax = g.avg === mx;
            const isMin = g.avg === mn;
            return (
              <div key={g.gw} style={{ flex: 1, minWidth: 0, position: "relative" }}>
                <div
                  title={`GW${g.gw}: ${g.avg}pts`}
                  style={{
                    height: Math.max((g.avg / mx) * 88, 3),
                    background: g.avg >= sAvg ? `${COLORS.green}50` : `${COLORS.red}35`,
                    borderRadius: "3px 3px 0 0",
                  }}
                />
                {(isMax || isMin) && (
                  <div style={{
                    position: "absolute", top: -16, left: "50%", transform: "translateX(-50%)",
                    fontSize: 8, fontWeight: 700, whiteSpace: "nowrap",
                    color: isMax ? COLORS.green : COLORS.red,
                  }}>
                    {Math.round(g.avg)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div style={{ height: 1, background: `${COLORS.amber}50`, marginBottom: 6 }} />
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 10, color: COLORS.textMuted }}>GW1</span>
          <span style={{ fontSize: 10, color: COLORS.amber }}>Avg: {sAvg.toFixed(1)}</span>
          <span style={{ fontSize: 10, color: COLORS.textMuted }}>GW{gwA.length}</span>
        </div>
        <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 8, fontStyle: "italic" }}>
          Top 100K comparison coming soon
        </div>
      </Card>

    </div>
  );
}
