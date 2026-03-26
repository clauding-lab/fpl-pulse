import { useState, useEffect, useMemo } from "react";
import { COLORS, POS_COLORS, POS_MAP, FDR_COLORS, FDR_TEXT } from "../utils/theme";
import { Card, PlayerTable, Sparkline } from "./shared";
import { fetchPlayerSummary, playerPhotoUrl } from "../utils/api";

/* ─── helpers ─── */
const Pill = ({ children, color }) => (
  <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 6, fontSize: 9, fontWeight: 700, background: `${color}18`, color, border: `1px solid ${color}30` }}>{children}</span>
);

const FdrMini = ({ fixture, tm }) => {
  if (!fixture) return null;
  const t = tm[fixture.opp];
  const bg = FDR_COLORS[fixture.fdr] || COLORS.amber;
  const fg = FDR_TEXT[fixture.fdr] || "#fff";
  return (
    <div style={{ width: 32, height: 20, borderRadius: 4, background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 700, color: fg }}>
      {t?.short_name?.slice(0, 3) || "?"}
    </div>
  );
};

const SectionTitle = ({ children, sub }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{ fontSize: 11, letterSpacing: 2, color: COLORS.textSecondary, fontWeight: 600 }}>{children}</div>
    {sub && <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 2 }}>{sub}</div>}
  </div>
);

/* ─── Sub-panel selector ─── */
const PANELS = [
  "Eye Test vs Data",
  "Bandwagon Monitor",
  "Fixture Proof",
  "Captain Roulette",
  "xG League Table",
  "Player Card",
  "GW Recap",
  "Head-to-Head",
];

/* ══════════════════════════════════════════════
   1. EYE TEST VS DATA
   ══════════════════════════════════════════════ */
function EyeTestPanel({ data }) {
  // Find the most debated player: high underlying stats but poor recent form (or vice versa)
  const candidates = useMemo(() => {
    return data.pl
      .filter((p) => p.mins > 1350 && p.own > 5)
      .map((p) => {
        const formVsUnderlying = Math.abs(p.form - p.xGI90 * 8);
        const ppgVsForm = Math.abs(p.ppg - p.form);
        const debate = formVsUnderlying + ppgVsForm;
        return { ...p, debate };
      })
      .sort((a, b) => b.debate - a.debate)
      .slice(0, 5);
  }, [data.pl]);

  const [selected, setSelected] = useState(0);
  const p = candidates[selected];
  if (!p) return <Card><div style={{ color: COLORS.textMuted }}>Not enough data</div></Card>;

  const eyeTest = [];
  const dataTest = [];

  // Form narrative
  if (p.form < 3) eyeTest.push(`${p.form} form — looks off it`);
  else eyeTest.push(`${p.form} form — eye-catching recent run`);

  if (p.xGI90 >= 0.4) dataTest.push(`xGI/90 of ${p.xGI90} — top-tier underlying`);
  else dataTest.push(`xGI/90 of ${p.xGI90} — limited chance creation`);

  // Goals vs xG
  const xgGap = p.goals - p.xG;
  if (xgGap < -1) eyeTest.push(`Missing chances — ${p.goals}G from ${p.xG.toFixed(1)} xG`);
  else if (xgGap > 1) eyeTest.push(`Clinical finisher — ${p.goals}G from ${p.xG.toFixed(1)} xG`);
  else eyeTest.push(`${p.goals} goals this season`);

  dataTest.push(`BPS/90: ${p.bps90} ${p.bps90 >= 20 ? "(elite bonus magnet)" : p.bps90 >= 14 ? "(solid)" : "(poor)"}`);

  // Ownership
  if (p.pChg < 0) eyeTest.push("Price dropping — managers selling");
  else if (p.pChg > 0) eyeTest.push("Price rising — bandwagon forming");
  else eyeTest.push(`Stable at £${p.price}m`);

  dataTest.push(`${p.own}% ownership — ${p.own > 25 ? "template" : p.own > 10 ? "popular" : "differential"}`);

  // Fixtures
  const next3 = (data.uf[p.teamId] || []).slice(0, 3);
  const avgFdr = next3.length ? (next3.reduce((a, f) => a + f.fdr, 0) / next3.length).toFixed(1) : "?";
  eyeTest.push(`Next 3 avg FDR: ${avgFdr}`);
  dataTest.push(`Season PPG: ${p.ppg} (${p.ppg >= 5 ? "premium" : p.ppg >= 3.5 ? "mid-tier" : "budget"} output)`);

  return (
    <Card>
      <SectionTitle sub="What the eye test says vs what the numbers say">THE EYE TEST VS THE DATA</SectionTitle>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {candidates.map((c, i) => (
          <button key={c.id} onClick={() => setSelected(i)} style={{
            background: selected === i ? COLORS.surface : "transparent",
            boxShadow: selected === i ? COLORS.shadowRaised : "none",
            color: selected === i ? COLORS.text : COLORS.textSecondary,
            border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer",
          }}>
            {c.name}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
        <img src={playerPhotoUrl(p.code)} alt={p.name} style={{ width: 64, height: 82, objectFit: "cover", borderRadius: 10, background: COLORS.border }} onError={(e) => { e.target.style.display = "none"; }} />
        <div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>{p.name}</div>
          <div style={{ fontSize: 12, color: COLORS.textSecondary }}>{p.teamName} · <span style={{ color: POS_COLORS[p.pos] }}>{p.posL}</span> · £{p.price}m</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 240 }}>
          <div style={{ fontSize: 10, letterSpacing: 1.5, color: COLORS.amber, fontWeight: 700, marginBottom: 8 }}>EYE TEST</div>
          {eyeTest.map((t, i) => (
            <div key={i} style={{ padding: "8px 12px", marginBottom: 6, borderRadius: 8, background: `${COLORS.amber}08`, borderLeft: `3px solid ${COLORS.amber}`, fontSize: 12, color: COLORS.text }}>
              {t}
            </div>
          ))}
        </div>
        <div style={{ flex: 1, minWidth: 240 }}>
          <div style={{ fontSize: 10, letterSpacing: 1.5, color: COLORS.blue, fontWeight: 700, marginBottom: 8 }}>THE DATA</div>
          {dataTest.map((t, i) => (
            <div key={i} style={{ padding: "8px 12px", marginBottom: 6, borderRadius: 8, background: `${COLORS.blue}08`, borderLeft: `3px solid ${COLORS.blue}`, fontSize: 12, color: COLORS.text }}>
              {t}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

/* ══════════════════════════════════════════════
   2. BANDWAGON MONITOR (placeholder — needs Supabase snapshots)
   ══════════════════════════════════════════════ */
function BandwagonPanel({ data }) {
  // Without historical snapshots, approximate using price change as velocity proxy
  const risers = useMemo(() =>
    data.pl
      .filter((p) => p.mins > 900 && p.pChg > 0)
      .sort((a, b) => b.pChg - a.pChg || b.own - a.own)
      .slice(0, 10)
      .map((p) => ({ ...p, delta: `+${(p.pChg / 10).toFixed(1)}` })),
    [data.pl]
  );
  const fallers = useMemo(() =>
    data.pl
      .filter((p) => p.mins > 900 && p.pChg < 0)
      .sort((a, b) => a.pChg - b.pChg || b.own - a.own)
      .slice(0, 10)
      .map((p) => ({ ...p, delta: (p.pChg / 10).toFixed(1) })),
    [data.pl]
  );

  const cols = (isRiser) => [
    { header: "#", render: (_, i) => i + 1, style: () => ({ color: COLORS.textMuted }) },
    { header: "Player", render: (p) => p.name, style: () => ({ fontWeight: 600, whiteSpace: "nowrap" }) },
    { header: "Pos", render: (p) => <span style={{ color: POS_COLORS[p.pos], fontWeight: 700, fontSize: 10 }}>{p.posL}</span> },
    { header: "Team", render: (p) => p.team, style: () => ({ color: COLORS.textSecondary }) },
    { header: "Own%", render: (p) => `${p.own}%`, style: () => ({ fontFamily: "monospace" }) },
    { header: "£ Chg", render: (p) => p.delta, style: () => ({ fontWeight: 700, color: isRiser ? COLORS.green : COLORS.red, fontFamily: "monospace" }) },
    { header: "Form", render: (p) => p.form, style: (p) => ({ fontWeight: 700, color: p.form >= 5 ? COLORS.green : p.form >= 3 ? COLORS.amber : COLORS.red }) },
    { header: "xGI/90", render: (p) => p.xGI90, style: () => ({ fontFamily: "monospace", color: COLORS.blue }) },
  ];

  return (
    <Card>
      <SectionTitle sub="Price change as ownership velocity proxy. Full velocity tracking (via Supabase snapshots) coming soon.">BANDWAGON MONITOR</SectionTitle>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 300 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.green, marginBottom: 8 }}>Bandwagon Alert — Price Rising</div>
          <PlayerTable players={risers} columns={cols(true)} />
        </div>
        <div style={{ flex: 1, minWidth: 300 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.red, marginBottom: 8 }}>Sinking Ships — Price Falling</div>
          <PlayerTable players={fallers} columns={cols(false)} />
        </div>
      </div>
    </Card>
  );
}

/* ══════════════════════════════════════════════
   3. FIXTURE PROOF
   ══════════════════════════════════════════════ */
function FixtureProofPanel({ data }) {
  const [fpData, setFpData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const cached = sessionStorage.getItem("fpl_fixture_proof");
    if (cached) { setFpData(JSON.parse(cached)); return; }
    setLoading(true);
    fetch("/api/fixture-proof")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (!cancelled && d) { setFpData(d.players); sessionStorage.setItem("fpl_fixture_proof", JSON.stringify(d.players)); } })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <Card>
      <SectionTitle sub="Who returns regardless of fixture difficulty? Ratio near 1.0 = fixture-proof. Above 1.0 = big-game player.">THE FIXTURE PROOF</SectionTitle>
      {loading && <div style={{ textAlign: "center", padding: 24, color: COLORS.textMuted }}>Analysing per-game data for top 80 players... ~20s</div>}
      {fpData && (
        <PlayerTable
          players={fpData.slice(0, 20)}
          columns={[
            { header: "#", render: (_, i) => i + 1, style: () => ({ color: COLORS.textMuted }) },
            { header: "Player", render: (p) => p.name, style: () => ({ fontWeight: 600, whiteSpace: "nowrap" }) },
            { header: "Pos", render: (p) => <span style={{ color: POS_COLORS[{ GK: 1, DEF: 2, MID: 3, FWD: 4 }[p.pos]], fontWeight: 700, fontSize: 10 }}>{p.pos}</span> },
            { header: "Team", render: (p) => p.team, style: () => ({ color: COLORS.textSecondary }) },
            { header: "£", render: (p) => p.price, style: () => ({ fontFamily: "monospace" }) },
            { header: "Easy Avg", render: (p) => p.easyAvg?.toFixed(1), style: () => ({ color: COLORS.green, fontWeight: 600, fontFamily: "monospace" }) },
            { header: "Hard Avg", render: (p) => p.hardAvg?.toFixed(1), style: () => ({ color: COLORS.red, fontWeight: 600, fontFamily: "monospace" }) },
            { header: "Ratio", render: (p) => p.ratio?.toFixed(2), style: (p) => ({ fontWeight: 800, fontFamily: "monospace", color: p.ratio >= 0.9 ? COLORS.green : p.ratio >= 0.6 ? COLORS.amber : COLORS.red }) },
            { header: "Hard GMs", render: (p) => p.hardGames, style: () => ({ color: COLORS.textSecondary }) },
            { header: "Hard Left", render: (p) => p.remainingHard, style: (p) => ({ fontWeight: 600, color: p.remainingHard >= 3 ? COLORS.red : COLORS.green }) },
          ]}
        />
      )}
      {!loading && !fpData && <div style={{ textAlign: "center", padding: 24, color: COLORS.textMuted }}>Failed to load fixture proof data</div>}
    </Card>
  );
}

/* ══════════════════════════════════════════════
   4. CAPTAIN ROULETTE BACKTEST
   ══════════════════════════════════════════════ */
function CaptainRoulettePanel() {
  const [capData, setCapData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const cached = sessionStorage.getItem("fpl_captain_backtest");
    if (cached) { setCapData(JSON.parse(cached)); return; }
    setLoading(true);
    fetch("/api/captain-backtest")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (!cancelled && d) { setCapData(d); sessionStorage.setItem("fpl_captain_backtest", JSON.stringify(d)); } })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <Card>
      <SectionTitle sub="Who should you have captained each GW? How much did the crowd leave on the table?">CAPTAIN ROULETTE BACKTEST</SectionTitle>
      {loading && <div style={{ textAlign: "center", padding: 24, color: COLORS.textMuted }}>Backtesting all completed GWs... ~15s</div>}
      {capData && (
        <>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
            <div style={{ background: COLORS.surface, borderRadius: 12, padding: "12px 20px", boxShadow: COLORS.shadowInset, textAlign: "center", flex: 1, minWidth: 140 }}>
              <div style={{ fontSize: 9, color: COLORS.textMuted, letterSpacing: 1 }}>CROWD TOTAL</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: COLORS.amber }}>{capData.totalCrowd}</div>
            </div>
            <div style={{ background: COLORS.surface, borderRadius: 12, padding: "12px 20px", boxShadow: COLORS.shadowInset, textAlign: "center", flex: 1, minWidth: 140 }}>
              <div style={{ fontSize: 9, color: COLORS.textMuted, letterSpacing: 1 }}>OPTIMAL TOTAL</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: COLORS.green }}>{capData.totalOptimal}</div>
            </div>
            <div style={{ background: COLORS.surface, borderRadius: 12, padding: "12px 20px", boxShadow: COLORS.shadowInset, textAlign: "center", flex: 1, minWidth: 140 }}>
              <div style={{ fontSize: 9, color: COLORS.textMuted, letterSpacing: 1 }}>LEFT ON TABLE</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: COLORS.red }}>{capData.totalLeft}</div>
            </div>
          </div>
          <PlayerTable
            players={capData.gameweeks}
            columns={[
              { header: "GW", render: (g) => `GW${g.gw}`, style: () => ({ fontWeight: 600 }), sortKey: (g) => g.gw },
              { header: "Most Captained", render: (g) => g.mostCaptained?.name || "—", style: () => ({ whiteSpace: "nowrap" }) },
              { header: "Crowd Pts", render: (g) => g.mostCaptained?.doubled || 0, style: (g) => ({ fontFamily: "monospace", fontWeight: 600, color: COLORS.amber }), sortKey: (g) => g.mostCaptained?.doubled || 0 },
              { header: "Optimal Captain", render: (g) => g.optimal?.name || "—", style: () => ({ whiteSpace: "nowrap", color: COLORS.green }) },
              { header: "Optimal Pts", render: (g) => g.optimal?.doubled || 0, style: () => ({ fontFamily: "monospace", fontWeight: 700, color: COLORS.green }), sortKey: (g) => g.optimal?.doubled || 0 },
              { header: "Left on Table", render: (g) => g.leftOnTable || 0, style: (g) => ({ fontWeight: 700, color: g.leftOnTable > 10 ? COLORS.red : g.leftOnTable > 0 ? COLORS.amber : COLORS.green, fontFamily: "monospace" }), sortKey: (g) => g.leftOnTable },
            ]}
          />
        </>
      )}
      {!loading && !capData && <div style={{ textAlign: "center", padding: 24, color: COLORS.textMuted }}>Failed to load captain backtest data</div>}
    </Card>
  );
}

/* ══════════════════════════════════════════════
   5. xG LEAGUE TABLE
   ══════════════════════════════════════════════ */
function XgTablePanel({ data }) {
  const xgTable = useMemo(() => {
    const teams = {};
    data.pl.forEach((p) => {
      if (!teams[p.teamId]) teams[p.teamId] = { id: p.teamId, name: p.team, fullName: p.teamName, xG: 0, xGA: 0, goals: 0, goalsA: 0 };
      teams[p.teamId].xG += p.xG;
      teams[p.teamId].goals += p.goals;
    });
    // xGA: sum of xG of opponents. Approximate from fixtures: sum xG of players from opposing teams
    // Simpler: use clean sheets and goals conceded concept — but we don't have team-level xGA
    // Best approximation: for each team, sum xG of all OTHER teams' players in fixtures against them
    // Too complex without match-level data. Use actual league table position and just show xG table.
    const arr = Object.values(teams).sort((a, b) => b.xG - a.xG);
    // Assign xG rank
    arr.forEach((t, i) => { t.xgRank = i + 1; });
    // Get actual positions from data.tRR (sorted by actual league performance)
    const actualOrder = [...(data.tRR || [])];
    actualOrder.forEach((t, i) => {
      const match = arr.find((x) => x.id === t.id);
      if (match) match.actualRank = i + 1;
    });
    return arr;
  }, [data.pl, data.tRR]);

  return (
    <Card>
      <SectionTitle sub="Teams ranked by total expected goals. Compare to actual league position — big gaps suggest regression or improvement ahead.">EXPECTED GOALS TABLE</SectionTitle>
      <PlayerTable
        players={xgTable}
        columns={[
          { header: "xG Rank", render: (t) => t.xgRank, style: () => ({ fontWeight: 700 }), sortKey: (t) => t.xgRank },
          { header: "Team", render: (t) => t.name, style: () => ({ fontWeight: 600 }) },
          { header: "xG", render: (t) => t.xG.toFixed(1), style: () => ({ fontFamily: "monospace", color: COLORS.green, fontWeight: 700 }), sortKey: (t) => t.xG },
          { header: "Goals", render: (t) => t.goals, style: () => ({ fontFamily: "monospace" }), sortKey: (t) => t.goals },
          { header: "xG Diff", render: (t) => { const d = t.goals - t.xG; return `${d >= 0 ? "+" : ""}${d.toFixed(1)}`; }, style: (t) => { const d = t.goals - t.xG; return { fontWeight: 700, color: d > 3 ? COLORS.green : d < -3 ? COLORS.red : COLORS.textSecondary, fontFamily: "monospace" }; }, sortKey: (t) => t.goals - t.xG },
          { header: "Actual Pos", render: (t) => t.actualRank || "—", style: () => ({ fontFamily: "monospace" }), sortKey: (t) => t.actualRank || 99 },
          { header: "Gap", render: (t) => { const g = (t.actualRank || 0) - t.xgRank; return g > 0 ? `+${g}` : `${g}`; }, style: (t) => { const g = (t.actualRank || 0) - t.xgRank; return { fontWeight: 800, color: Math.abs(g) >= 3 ? (g > 0 ? COLORS.red : COLORS.green) : COLORS.textMuted, fontFamily: "monospace" }; }, sortKey: (t) => (t.actualRank || 0) - t.xgRank },
        ]}
      />
      <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 10, fontStyle: "italic" }}>
        Gap: positive = underperforming (actual worse than xG suggests) — buy their players. Negative = overperforming — regression risk.
      </div>
    </Card>
  );
}

/* ══════════════════════════════════════════════
   6. PLAYER CARD
   ══════════════════════════════════════════════ */
function PlayerCardPanel({ data }) {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const suggestions = search.length >= 2
    ? data.pl.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.teamName.toLowerCase().includes(search.toLowerCase())).slice(0, 8)
    : [];

  const p = selectedId ? data.plMap[selectedId] : null;
  const next3 = p ? (data.uf[p.teamId] || []).slice(0, 3) : [];

  return (
    <Card>
      <SectionTitle sub="Search any player for a magazine-style stat card">PLAYER IN NUMBERS</SectionTitle>
      <div style={{ position: "relative", maxWidth: 340, marginBottom: 16 }}>
        <input
          type="text" placeholder="Search player..." value={search}
          onChange={(e) => { setSearch(e.target.value); setSelectedId(null); }}
          style={{ width: "100%", background: COLORS.bg, border: "none", borderRadius: 10, padding: "10px 14px", color: COLORS.text, fontSize: 13, boxShadow: COLORS.shadowInset, outline: "none" }}
        />
        {suggestions.length > 0 && !selectedId && (
          <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: COLORS.surface, borderRadius: 10, boxShadow: COLORS.shadowRaised, zIndex: 10, marginTop: 4, overflow: "hidden" }}>
            {suggestions.map((s) => (
              <div key={s.id} onClick={() => { setSelectedId(s.id); setSearch(s.name); }}
                style={{ padding: "8px 14px", cursor: "pointer", fontSize: 12, display: "flex", justifyContent: "space-between", borderBottom: `1px solid ${COLORS.border}20` }}>
                <span style={{ fontWeight: 600 }}>{s.name}</span>
                <span style={{ color: COLORS.textMuted }}>{s.team} · <span style={{ color: POS_COLORS[s.pos] }}>{s.posL}</span></span>
              </div>
            ))}
          </div>
        )}
      </div>
      {p && (
        <div style={{ background: COLORS.bg, borderRadius: 16, padding: 24, boxShadow: COLORS.shadowRaised, maxWidth: 500 }}>
          <div style={{ display: "flex", gap: 16, marginBottom: 16, alignItems: "center" }}>
            <img src={playerPhotoUrl(p.code)} alt={p.name} style={{ width: 72, height: 92, objectFit: "cover", borderRadius: 12, background: COLORS.border }} onError={(e) => { e.target.style.display = "none"; }} />
            <div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{p.name}</div>
              <div style={{ fontSize: 12, color: COLORS.textSecondary }}>{p.teamName} · <span style={{ color: POS_COLORS[p.pos] }}>{p.posL}</span> · £{p.price}m</div>
              <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
                {next3.map((f, i) => <FdrMini key={i} fixture={f} tm={data.tm} />)}
              </div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
            {[
              { label: "Total Pts", value: p.pts, color: COLORS.text },
              { label: "Form", value: p.form, color: p.form >= 5 ? COLORS.green : p.form >= 3 ? COLORS.amber : COLORS.red },
              { label: "xGI/90", value: p.xGI90, color: COLORS.blue },
              { label: "Own%", value: `${p.own}%`, color: COLORS.textSecondary },
              { label: "Goals", value: p.goals, color: COLORS.green },
              { label: "xG", value: p.xG.toFixed(1), color: COLORS.textMuted },
              { label: "Assists", value: p.assists, color: COLORS.green },
              { label: "xA", value: p.xA.toFixed(1), color: COLORS.textMuted },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: "center", padding: 8, borderRadius: 10, boxShadow: COLORS.shadowInset }}>
                <div style={{ fontSize: 8, color: COLORS.textMuted, letterSpacing: 1, marginBottom: 3 }}>{s.label}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: s.color, fontFamily: "monospace" }}>{s.value}</div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 12, fontSize: 9, color: COLORS.textMuted }}>FPL Pulse · @adnanrashid</div>
        </div>
      )}
    </Card>
  );
}

/* ══════════════════════════════════════════════
   7. GW RECAP CARD
   ══════════════════════════════════════════════ */
function GwRecapPanel({ data }) {
  const lastGw = data.gwA.length ? data.gwA[data.gwA.length - 1] : null;
  if (!lastGw) return <Card><div style={{ color: COLORS.textMuted }}>No completed GW data</div></Card>;

  const gwNum = lastGw.gw;
  const avg = lastGw.avg;
  const highest = data.glance.lastHighest;
  const mostCap = data.glance.mostCaptained;

  // Best differential: highest points among low-owned
  const bestDiff = data.pl
    .filter((p) => p.own < 5 && p.form > 0)
    .sort((a, b) => b.form - a.form)[0];

  return (
    <Card>
      <SectionTitle sub={`Auto-generated summary of Gameweek ${gwNum}`}>GW{gwNum} RECAP</SectionTitle>
      <div style={{ background: COLORS.bg, borderRadius: 16, padding: 24, boxShadow: COLORS.shadowRaised, maxWidth: 500 }}>
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: COLORS.green }}>GW{gwNum}</div>
          <div style={{ fontSize: 10, color: COLORS.textMuted }}>in one image</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div style={{ textAlign: "center", padding: 12, borderRadius: 10, boxShadow: COLORS.shadowInset }}>
            <div style={{ fontSize: 8, color: COLORS.textMuted, letterSpacing: 1 }}>AVG SCORE</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: avg >= data.sAvg ? COLORS.green : COLORS.red }}>{avg.toFixed(1)}</div>
          </div>
          <div style={{ textAlign: "center", padding: 12, borderRadius: 10, boxShadow: COLORS.shadowInset }}>
            <div style={{ fontSize: 8, color: COLORS.textMuted, letterSpacing: 1 }}>HIGHEST</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.green }}>{highest}</div>
          </div>
          <div style={{ textAlign: "center", padding: 12, borderRadius: 10, boxShadow: COLORS.shadowInset }}>
            <div style={{ fontSize: 8, color: COLORS.textMuted, letterSpacing: 1 }}>MOST CAPTAINED</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.amber }}>{mostCap}</div>
          </div>
          <div style={{ textAlign: "center", padding: 12, borderRadius: 10, boxShadow: COLORS.shadowInset }}>
            <div style={{ fontSize: 8, color: COLORS.textMuted, letterSpacing: 1 }}>BEST DIFFERENTIAL</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: COLORS.blue }}>{bestDiff?.name || "—"}</div>
            <div style={{ fontSize: 10, color: COLORS.textMuted }}>{bestDiff ? `${bestDiff.own}% · ${bestDiff.form} form` : ""}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
          {data.risers[0] && (
            <div style={{ flex: 1, textAlign: "center", padding: 10, borderRadius: 10, boxShadow: COLORS.shadowInset }}>
              <div style={{ fontSize: 8, color: COLORS.textMuted, letterSpacing: 1 }}>TOP RISER</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.green }}>{data.risers[0].name}</div>
            </div>
          )}
          {data.fallers[0] && (
            <div style={{ flex: 1, textAlign: "center", padding: 10, borderRadius: 10, boxShadow: COLORS.shadowInset }}>
              <div style={{ fontSize: 8, color: COLORS.textMuted, letterSpacing: 1 }}>TOP FALLER</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.red }}>{data.fallers[0].name}</div>
            </div>
          )}
        </div>
        <div style={{ textAlign: "center", marginTop: 12, fontSize: 9, color: COLORS.textMuted }}>FPL Pulse · @adnanrashid</div>
      </div>
    </Card>
  );
}

/* ══════════════════════════════════════════════
   8. HEAD-TO-HEAD COMPARATOR
   ══════════════════════════════════════════════ */
function H2HPanel({ data }) {
  const [searchA, setSearchA] = useState("");
  const [searchB, setSearchB] = useState("");
  const [idA, setIdA] = useState(null);
  const [idB, setIdB] = useState(null);

  const suggest = (q) => q.length >= 2
    ? data.pl.filter((p) => p.name.toLowerCase().includes(q.toLowerCase())).slice(0, 6)
    : [];

  const pA = idA ? data.plMap[idA] : null;
  const pB = idB ? data.plMap[idB] : null;

  const metrics = pA && pB ? [
    { label: "Total Pts", a: pA.pts, b: pB.pts },
    { label: "Form", a: pA.form, b: pB.form },
    { label: "xGI/90", a: pA.xGI90, b: pB.xGI90 },
    { label: "Goals", a: pA.goals, b: pB.goals },
    { label: "xG", a: +pA.xG.toFixed(1), b: +pB.xG.toFixed(1) },
    { label: "Assists", a: pA.assists, b: pB.assists },
    { label: "xA", a: +pA.xA.toFixed(1), b: +pB.xA.toFixed(1) },
    { label: "BPS/90", a: pA.bps90, b: pB.bps90 },
    { label: "PPG", a: pA.ppg, b: pB.ppg },
    { label: "Price", a: +pA.price, b: +pB.price, lower: true },
    { label: "Own%", a: pA.own, b: pB.own },
  ] : [];

  const winsA = metrics.filter((m) => m.lower ? m.a < m.b : m.a > m.b).length;
  const winsB = metrics.filter((m) => m.lower ? m.b < m.a : m.b > m.a).length;

  const SearchBox = ({ value, onChange, onSelect, exclude }) => (
    <div style={{ position: "relative", flex: 1 }}>
      <input type="text" placeholder="Search player..." value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ width: "100%", background: COLORS.bg, border: "none", borderRadius: 10, padding: "10px 14px", color: COLORS.text, fontSize: 13, boxShadow: COLORS.shadowInset, outline: "none" }}
      />
      {suggest(value).length > 0 && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: COLORS.surface, borderRadius: 10, boxShadow: COLORS.shadowRaised, zIndex: 10, marginTop: 4, overflow: "hidden" }}>
          {suggest(value).filter((s) => s.id !== exclude).map((s) => (
            <div key={s.id} onClick={() => { onSelect(s.id); onChange(s.name); }}
              style={{ padding: "8px 14px", cursor: "pointer", fontSize: 12, borderBottom: `1px solid ${COLORS.border}20` }}>
              <span style={{ fontWeight: 600 }}>{s.name}</span> <span style={{ color: COLORS.textMuted }}>{s.team}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <Card>
      <SectionTitle sub="Compare any two players head-to-head across every key metric">HEAD-TO-HEAD COMPARATOR</SectionTitle>
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <SearchBox value={searchA} onChange={(v) => { setSearchA(v); setIdA(null); }} onSelect={setIdA} exclude={idB} />
        <div style={{ fontSize: 14, fontWeight: 800, color: COLORS.textMuted, alignSelf: "center" }}>VS</div>
        <SearchBox value={searchB} onChange={(v) => { setSearchB(v); setIdB(null); }} onSelect={setIdB} exclude={idA} />
      </div>
      {pA && pB && (
        <>
          {/* Player headers */}
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <img src={playerPhotoUrl(pA.code)} alt="" style={{ width: 40, height: 52, borderRadius: 8, objectFit: "cover", background: COLORS.border }} onError={(e) => { e.target.style.display = "none"; }} />
              <div><div style={{ fontWeight: 700, fontSize: 14 }}>{pA.name}</div><div style={{ fontSize: 10, color: COLORS.textSecondary }}>{pA.team} · £{pA.price}</div></div>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center", textAlign: "right" }}>
              <div><div style={{ fontWeight: 700, fontSize: 14 }}>{pB.name}</div><div style={{ fontSize: 10, color: COLORS.textSecondary }}>{pB.team} · £{pB.price}</div></div>
              <img src={playerPhotoUrl(pB.code)} alt="" style={{ width: 40, height: 52, borderRadius: 8, objectFit: "cover", background: COLORS.border }} onError={(e) => { e.target.style.display = "none"; }} />
            </div>
          </div>
          {/* Metrics */}
          {metrics.map((m, i) => {
            const aWins = m.lower ? m.a < m.b : m.a > m.b;
            const bWins = m.lower ? m.b < m.a : m.b > m.a;
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", padding: "6px 0", borderBottom: `1px solid ${COLORS.border}20` }}>
                <div style={{ flex: 1, textAlign: "right", fontFamily: "monospace", fontWeight: 700, fontSize: 13, color: aWins ? COLORS.green : COLORS.textSecondary, paddingRight: 12 }}>{m.a}</div>
                <div style={{ width: 80, textAlign: "center", fontSize: 10, color: COLORS.textMuted, fontWeight: 600 }}>{m.label}</div>
                <div style={{ flex: 1, textAlign: "left", fontFamily: "monospace", fontWeight: 700, fontSize: 13, color: bWins ? COLORS.green : COLORS.textSecondary, paddingLeft: 12 }}>{m.b}</div>
              </div>
            );
          })}
          {/* Verdict bar */}
          <div style={{ marginTop: 12, borderRadius: 10, overflow: "hidden", height: 28, display: "flex", boxShadow: COLORS.shadowInset }}>
            <div style={{ width: `${(winsA / (winsA + winsB || 1)) * 100}%`, background: COLORS.green, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: COLORS.bg, transition: "width 0.3s" }}>
              {winsA > winsB ? `${pA.name} wins ${winsA}-${winsB}` : winsA}
            </div>
            <div style={{ flex: 1, background: COLORS.blue, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: COLORS.bg, transition: "width 0.3s" }}>
              {winsB > winsA ? `${pB.name} wins ${winsB}-${winsA}` : winsB}
            </div>
          </div>
        </>
      )}
    </Card>
  );
}

/* ══════════════════════════════════════════════
   MAIN TAB COMPONENT
   ══════════════════════════════════════════════ */
export default function TabDeepDive({ data }) {
  const [panel, setPanel] = useState(0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Panel selector */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", padding: 4, borderRadius: 12, boxShadow: COLORS.shadowInset, background: COLORS.bg }}>
        {PANELS.map((p, i) => (
          <button key={i} onClick={() => setPanel(i)} style={{
            background: panel === i ? COLORS.surface : "transparent",
            boxShadow: panel === i ? COLORS.shadowRaised : "none",
            color: panel === i ? COLORS.green : COLORS.textSecondary,
            border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 11, fontWeight: panel === i ? 700 : 500, cursor: "pointer", transition: "all 0.15s",
          }}>
            {p}
          </button>
        ))}
      </div>

      {panel === 0 && <EyeTestPanel data={data} />}
      {panel === 1 && <BandwagonPanel data={data} />}
      {panel === 2 && <FixtureProofPanel data={data} />}
      {panel === 3 && <CaptainRoulettePanel />}
      {panel === 4 && <XgTablePanel data={data} />}
      {panel === 5 && <PlayerCardPanel data={data} />}
      {panel === 6 && <GwRecapPanel data={data} />}
      {panel === 7 && <H2HPanel data={data} />}
    </div>
  );
}
