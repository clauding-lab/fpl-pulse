import React, { useState, useRef, useCallback, useEffect } from "react";
import { COLORS, POS_COLORS } from "../utils/theme";
import { Card, StatCard } from "./shared";
import { fetchSquad } from "../utils/api";
import { analyzeSquad } from "../utils/calculations";
import html2canvas from "html2canvas";

const FDR_MINI = { 1: "#00ff87", 2: "#00ff87", 3: "#e8a50a", 4: "#ff2882", 5: "#80072d" };

function RankChart({ rankHistory }) {
  const [hovIdx, setHovIdx] = useState(null);
  const chartRef = useRef(null);
  if (!rankHistory || rankHistory.length < 2) return null;

  const ranks = rankHistory.map((h) => h.rank);
  const pts = rankHistory.map((h) => h.pts);
  const maxRank = Math.max(...ranks);
  const minRank = Math.min(...ranks);
  const rankRange = maxRank - minRank || 1;
  const maxPts = Math.max(...pts, 1);
  const H = 150;

  const latest = rankHistory[rankHistory.length - 1];
  const prev = rankHistory[rankHistory.length - 2];
  const delta = prev.rank - latest.rank;
  const deltaColor = delta > 0 ? COLORS.green : delta < 0 ? COLORS.red : COLORS.textMuted;

  function formatRank(r) {
    if (r >= 1000000) return `${(r / 1000000).toFixed(1)}M`;
    if (r >= 1000) return `${(r / 1000).toFixed(0)}K`;
    return r.toLocaleString();
  }

  const hovered = hovIdx !== null ? rankHistory[hovIdx] : null;
  const n = rankHistory.length;

  // Build SVG polyline points for rank line (inverted: lower rank = higher Y position on chart)
  // We use a real pixel-based SVG that matches the container exactly
  const svgW = 600; // Fixed internal coordinate space
  const barW = svgW / n;
  const linePoints = rankHistory.map((h, i) => {
    const x = (i + 0.5) * barW;
    const yPct = (h.rank - minRank) / rankRange; // 0=best, 1=worst
    const y = 8 + yPct * (H - 20);
    return `${x},${y}`;
  }).join(" ");

  return (
    <Card style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <div style={{ fontSize: 14, letterSpacing: 1.5, color: COLORS.text, fontWeight: 700 }}>OVERALL RANK</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 20, fontWeight: 800, fontFamily: "monospace", color: COLORS.text }}>{formatRank(latest.rank)}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: deltaColor }}>
            {delta > 0 ? `▲ ${formatRank(Math.abs(delta))}` : delta < 0 ? `▼ ${formatRank(Math.abs(delta))}` : "—"}
          </span>
        </div>
      </div>
      <div style={{ display: "flex", gap: 14, fontSize: 9, color: COLORS.textMuted, marginBottom: 4 }}>
        <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: "#22c55e", marginRight: 4, verticalAlign: "middle" }} />Rank Gained</span>
        <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: "#ef4444", marginRight: 4, verticalAlign: "middle" }} />Rank Lost</span>
        <span><span style={{ display: "inline-block", width: 10, height: 3, borderRadius: 1, background: "#3b82f6", marginRight: 4, verticalAlign: "middle" }} />Overall Rank (line)</span>
      </div>

      {/* Fixed-height tooltip */}
      <div style={{ height: 26, marginBottom: 2 }}>
        {hovered && (
          <div style={{ display: "flex", gap: 16, fontSize: 11, fontWeight: 600, color: COLORS.text }}>
            <span>GW{hovered.gw}</span>
            <span>Pts: <span style={{ fontFamily: "monospace", color: "#3b82f6" }}>{hovered.pts}</span></span>
            <span>Rank: <span style={{ fontFamily: "monospace", color: "#3b82f6" }}>{hovered.rank.toLocaleString()}</span></span>
            <span>Total: <span style={{ fontFamily: "monospace", color: "#22c55e" }}>{hovered.total.toLocaleString()}</span></span>
          </div>
        )}
      </div>

      {/* Chart: bars (GW pts) + SVG line overlay (rank) */}
      <div
        ref={chartRef}
        style={{ position: "relative", height: H, cursor: "crosshair" }}
        onMouseLeave={() => setHovIdx(null)}
      >
        {/* Bar layer */}
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "flex-end", gap: 1 }}>
          {rankHistory.map((h, i) => {
            const barH = Math.max((h.pts / maxPts) * (H - 10), 3);
            const isHov = hovIdx === i;
            const prevRank = i > 0 ? rankHistory[i - 1].rank : h.rank;
            const gained = h.rank < prevRank; // lower rank number = better = gained
            const lost = h.rank > prevRank;
            const barColor = gained ? "#22c55e" : lost ? "#ef4444" : "#9ca3af";
            return (
              <div
                key={i}
                style={{ flex: 1, height: "100%", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
                onMouseEnter={() => setHovIdx(i)}
              >
                <div style={{
                  width: "65%", maxWidth: 14, height: barH, borderRadius: "3px 3px 0 0",
                  background: isHov ? barColor : `${barColor}70`,
                  opacity: hovIdx !== null && !isHov ? 0.3 : 1,
                }} />
              </div>
            );
          })}
        </div>

        {/* SVG line overlay for rank — uses viewBox matching internal coords */}
        <svg
          viewBox={`0 0 ${svgW} ${H}`}
          preserveAspectRatio="none"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
        >
          <polyline
            points={linePoints}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="3"
            vectorEffect="non-scaling-stroke"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {/* Dot on hovered point */}
          {hovIdx !== null && (() => {
            const x = (hovIdx + 0.5) * barW;
            const yPct = (rankHistory[hovIdx].rank - minRank) / rankRange;
            const y = 8 + yPct * (H - 20);
            return <circle cx={x} cy={y} r="5" fill="#22c55e" stroke={COLORS.bg} strokeWidth="2" vectorEffect="non-scaling-stroke" />;
          })()}
        </svg>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
        <span style={{ fontSize: 9, color: COLORS.textMuted }}>GW1</span>
        <span style={{ fontSize: 9, color: COLORS.textMuted }}>Best: {formatRank(minRank)}</span>
        <span style={{ fontSize: 9, color: COLORS.textMuted }}>GW{rankHistory.length}</span>
      </div>
    </Card>
  );
}

function SquadPlayer({ p, tm }) {
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
        gap: 6,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flex: 1 }}>
        <span style={{ color: POS_COLORS[p.pos], fontWeight: 700, fontSize: 9, width: 24, flexShrink: 0 }}>{p.posL}</span>
        <span style={{ fontWeight: 600, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</span>
        {p.isCaptain && <span style={{ fontSize: 9, background: COLORS.amber, color: COLORS.bg, padding: "1px 5px", borderRadius: 3, fontWeight: 700, flexShrink: 0 }}>C</span>}
        {p.isVice && <span style={{ fontSize: 9, background: COLORS.blue, color: COLORS.bg, padding: "1px 5px", borderRadius: 3, fontWeight: 700, flexShrink: 0 }}>V</span>}
      </div>
      <div style={{ display: "flex", gap: 6, fontSize: 11, alignItems: "center", flexShrink: 0 }}>
        <span style={{ fontFamily: "monospace", width: 30, textAlign: "right", color: COLORS.textSecondary }}>{p.own}%</span>
        <span style={{ color: p.lastGwPts != null && p.lastGwPts >= 6 ? COLORS.green : p.lastGwPts != null && p.lastGwPts <= 2 ? COLORS.red : COLORS.textSecondary, fontWeight: 700, fontFamily: "monospace", width: 28, textAlign: "right" }}>
          {p.lastGwPts != null ? p.lastGwPts : "—"}
        </span>
        <span style={{ fontFamily: "monospace", width: 34, textAlign: "right", fontWeight: 600 }}>{p.pts}</span>
        <span style={{ color: p.form >= 5 ? COLORS.green : p.form >= 3 ? COLORS.amber : COLORS.red, fontWeight: 700, fontFamily: "monospace", width: 22, textAlign: "right" }}>
          {p.form}
        </span>
        <div style={{ display: "flex", gap: 2 }}>
          {(p.next5 || []).map((f, i) => (
            <div key={i} title={`GW${f.gw}: ${tm?.[f.opp]?.short_name || "?"} ${f.home ? "(H)" : "(A)"}`} style={{
              width: 22, height: 18, borderRadius: 3,
              background: FDR_MINI[f.fdr] || COLORS.amber,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 7, fontWeight: 700, color: f.fdr >= 4 ? "#fff" : "#111",
            }}>
              {tm?.[f.opp]?.short_name?.slice(0, 3) || "?"}
            </div>
          ))}
        </div>
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
      <div style={{ fontSize: 14, letterSpacing: 1.5, color: COLORS.text, marginBottom: 12, fontWeight: 700 }}>
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

function MiniLeagues({ entryData, myEntryId, plMap, lastFinishedGW, selectedLeague, setSelectedLeague, standings, setStandings }) {
  const [leagueLoading, setLeagueLoading] = useState(false);
  const [expandedEntry, setExpandedEntry] = useState(null);
  const [expandedPicks, setExpandedPicks] = useState(null);
  const [picksLoading, setPicksLoading] = useState(false);

  const leagues = (entryData?.leagues?.classic || []).filter((l) => l.id !== 314 && l.id !== 276 && l.id !== 333);

  const handleLeagueChange = async (leagueId) => {
    setSelectedLeague(leagueId);
    setExpandedEntry(null);
    setExpandedPicks(null);
    if (!leagueId) { setStandings(null); return; }
    setLeagueLoading(true);
    try {
      const r = await fetch(`/api/fpl?endpoint=leagues-classic/${leagueId}/standings/`);
      if (!r.ok) throw new Error();
      setStandings(await r.json());
    } catch {
      setStandings(null);
    }
    setLeagueLoading(false);
  };

  const handleRowClick = async (entryId) => {
    if (expandedEntry === entryId) { setExpandedEntry(null); setExpandedPicks(null); return; }
    setExpandedEntry(entryId);
    setExpandedPicks(null);
    setPicksLoading(true);
    try {
      const gw = lastFinishedGW || 31;
      const r = await fetch(`/api/fpl?endpoint=entry/${entryId}/event/${gw}/picks/`);
      if (!r.ok) throw new Error();
      const d = await r.json();
      setExpandedPicks(d);
    } catch {
      setExpandedPicks(null);
    }
    setPicksLoading(false);
  };

  function RankChange({ rank, lastRank }) {
    if (!lastRank || lastRank === rank) return <span style={{ fontSize: 9, color: COLORS.textMuted }}>—</span>;
    const diff = lastRank - rank; // positive = moved up
    if (diff > 0) return <span style={{ fontSize: 9, fontWeight: 700, color: COLORS.green }}>▲{diff}</span>;
    return <span style={{ fontSize: 9, fontWeight: 700, color: COLORS.red }}>▼{Math.abs(diff)}</span>;
  }

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 14, letterSpacing: 1.5, color: COLORS.text, marginBottom: 12, fontWeight: 700 }}>CHOOSE YOUR MINI-LEAGUE</div>
        <select
          value={selectedLeague}
          onChange={(e) => handleLeagueChange(e.target.value)}
          style={{
            width: "100%", padding: "10px 14px", borderRadius: 8,
            background: COLORS.surface, color: COLORS.text, border: `1px solid ${COLORS.border}`,
            fontSize: 14, cursor: "pointer", outline: "none",
          }}
        >
          <option value="">Select a league...</option>
          {leagues.map((l) => (
            <option key={l.id} value={l.id}>{l.name} (Rank: {l.entry_rank?.toLocaleString() || "—"})</option>
          ))}
        </select>
      </Card>

      {leagueLoading && (
        <Card><div style={{ textAlign: "center", padding: 20, color: COLORS.textMuted }}>Loading standings...</div></Card>
      )}

      {standings && !leagueLoading && (
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontSize: 14, letterSpacing: 1.5, color: COLORS.text, fontWeight: 700 }}>{standings.league?.name}</div>
            <div style={{ fontSize: 10, color: COLORS.textMuted }}>{standings.standings?.results?.length || 0} managers · tap row to expand</div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                  {["#", "", "Manager", "Team", "GW", "Total"].map((h) => (
                    <th key={h} style={{ padding: "8px 6px", textAlign: h === "#" || h === "" || h === "GW" || h === "Total" ? "center" : "left", color: COLORS.textSecondary, fontWeight: 600, fontSize: 10, letterSpacing: 1 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(standings.standings?.results || []).map((s) => {
                  const isMe = String(s.entry) === String(myEntryId);
                  const isExpanded = expandedEntry === s.entry;
                  return (
                    <React.Fragment key={s.entry}>
                      <tr
                        onClick={() => handleRowClick(s.entry)}
                        style={{
                          borderBottom: isExpanded ? "none" : `1px solid ${COLORS.border}`,
                          background: isMe ? `${COLORS.green}12` : isExpanded ? `${COLORS.blue}08` : "transparent",
                          cursor: "pointer",
                        }}
                      >
                        <td style={{ padding: "10px 6px", textAlign: "center", fontWeight: 700, fontFamily: "monospace", color: isMe ? COLORS.green : COLORS.text }}>{s.rank}</td>
                        <td style={{ padding: "10px 2px", textAlign: "center", width: 28 }}><RankChange rank={s.rank} lastRank={s.last_rank} /></td>
                        <td style={{ padding: "10px 6px", fontWeight: isMe ? 700 : 400, color: isMe ? COLORS.green : COLORS.text }}>{s.player_name}</td>
                        <td style={{ padding: "10px 6px", color: COLORS.textSecondary, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.entry_name}</td>
                        <td style={{ padding: "10px 6px", textAlign: "center", fontFamily: "monospace", fontWeight: 600 }}>{s.event_total}</td>
                        <td style={{ padding: "10px 6px", textAlign: "center", fontFamily: "monospace", fontWeight: 700, color: isMe ? COLORS.green : COLORS.text }}>{s.total}</td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={6} style={{ padding: "0 6px 12px", background: `${COLORS.blue}08`, borderBottom: `1px solid ${COLORS.border}` }}>
                            {picksLoading && <div style={{ padding: 12, textAlign: "center", color: COLORS.textMuted, fontSize: 11 }}>Loading team...</div>}
                            {expandedPicks && !picksLoading && (
                              <div style={{ padding: "8px 4px" }}>
                                <div style={{ fontSize: 10, color: COLORS.textMuted, marginBottom: 6, fontWeight: 600, letterSpacing: 1 }}>
                                  GW{expandedPicks.entry_history?.event} — {s.event_total} pts
                                  {expandedPicks.entry_history?.event_transfers_cost > 0 && <span style={{ color: COLORS.red }}> (−{expandedPicks.entry_history.event_transfers_cost} hits)</span>}
                                  {expandedPicks.active_chip && <span style={{ color: COLORS.amber }}> · {expandedPicks.active_chip}</span>}
                                </div>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                                  {(expandedPicks.picks || []).map((pk) => {
                                    const p = plMap?.[pk.element];
                                    if (!p) return null;
                                    const isBench = pk.position > 11;
                                    return (
                                      <div key={pk.element} style={{
                                        display: "flex", alignItems: "center", gap: 4, padding: "3px 8px",
                                        background: isBench ? `${COLORS.textMuted}10` : COLORS.surface,
                                        border: `1px solid ${COLORS.border}`,
                                        borderRadius: 6, fontSize: 11, opacity: isBench ? 0.6 : 1,
                                      }}>
                                        <span style={{ color: POS_COLORS[p.pos], fontWeight: 700, fontSize: 9 }}>{p.posL}</span>
                                        <span style={{ fontWeight: 600 }}>{p.name}</span>
                                        {pk.is_captain && <span style={{ fontSize: 8, background: COLORS.amber, color: COLORS.bg, padding: "0 3px", borderRadius: 2, fontWeight: 700 }}>C</span>}
                                        {pk.is_vice_captain && <span style={{ fontSize: 8, background: COLORS.blue, color: COLORS.bg, padding: "0 3px", borderRadius: 2, fontWeight: 700 }}>V</span>}
                                        <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 10, color: p.evPts >= 6 ? COLORS.green : p.evPts <= 2 ? COLORS.red : COLORS.textSecondary }}>{p.evPts}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                            {!expandedPicks && !picksLoading && <div style={{ padding: 12, textAlign: "center", color: COLORS.red, fontSize: 11 }}>Could not load team</div>}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          {standings.standings?.has_next && (
            <div style={{ textAlign: "center", marginTop: 10, fontSize: 10, color: COLORS.textMuted }}>
              Showing top {standings.standings.results.length} managers. Full standings on the FPL app.
            </div>
          )}
        </Card>
      )}

      {!selectedLeague && !leagueLoading && (
        <Card style={{ textAlign: "center", padding: "40px 20px" }}>
          <div style={{ fontSize: 13, color: COLORS.textMuted }}>Select a league above to view standings</div>
        </Card>
      )}
    </div>
  );
}

const SAVED_TEAM_KEY = "fpl_pulse_team_id";

export default function TabMyPulse({ data }) {
  const [teamId, setTeamId] = useState(() => localStorage.getItem(SAVED_TEAM_KEY) || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [managerName, setManagerName] = useState("");
  const [entryData, setEntryData] = useState(null);
  const [mySubTab, setMySubTab] = useState(0);
  const [selectedLeague, setSelectedLeague] = useState("");
  const [leagueStandings, setLeagueStandings] = useState(null);
  const shareRef = useRef(null);
  const [exporting, setExporting] = useState(false);
  const autoFetched = useRef(false);

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
      link.download = `fpl-pulse-squad-GW${data.gw}.png`;
      link.href = canvas.toDataURL();
      link.click();
    } catch (err) {
      console.error("Share export failed:", err);
    }
    setExporting(false);
  }, [data.gw]);

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
    setEntryData(result.entry);
    localStorage.setItem(SAVED_TEAM_KEY, teamId.trim());
    const lastGwEntry = result.history?.current?.length ? result.history.current[result.history.current.length - 1] : null;
    setAnalysis({ ...analyzeSquad(result.picks, data, result.history, result.liveGwPts), lastGwEntry });
    setMySubTab(0);
    setLoading(false);
  };

  // Auto-fetch saved team on mount
  useEffect(() => {
    if (autoFetched.current || analysis) return;
    const saved = localStorage.getItem(SAVED_TEAM_KEY);
    if (saved && data.plMap) {
      autoFetched.current = true;
      setTeamId(saved);
      // Trigger fetch
      (async () => {
        setLoading(true);
        const result = await fetchSquad(saved, data.lastFinishedGW || data.gw);
        if (result) {
          setManagerName(`${result.entry.player_first_name} ${result.entry.player_last_name}`);
          setEntryData(result.entry);
          const lastGwEntry = result.history?.current?.length ? result.history.current[result.history.current.length - 1] : null;
          setAnalysis({ ...analyzeSquad(result.picks, data, result.history, result.liveGwPts), lastGwEntry });
        }
        setLoading(false);
      })();
    }
  }, [data.plMap]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const { squad, healthScore, weakest, bestXI, capPick, vicePick, chips, lastGwEntry, rankHistory } = analysis;
  const starters = squad.filter((p) => !p.isBench);
  const bench = squad.filter((p) => p.isBench);

  const teamName = entryData?.name || managerName;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{managerName}</div>
          <div style={{ fontSize: 12, color: COLORS.textSecondary }}>GW{data.gw} Squad Analysis</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={handleShare} disabled={exporting} style={{ background: COLORS.green, color: COLORS.bg, border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: exporting ? "wait" : "pointer", opacity: exporting ? 0.6 : 1 }}>
            {exporting ? "Exporting..." : "📸 Share My Pulse"}
          </button>
          <button onClick={() => { setAnalysis(null); setEntryData(null); setSelectedLeague(""); setLeagueStandings(null); localStorage.removeItem(SAVED_TEAM_KEY); autoFetched.current = false; }} style={{ background: COLORS.surface, color: COLORS.textSecondary, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "6px 14px", fontSize: 12, cursor: "pointer" }}>
            Change Team
          </button>
        </div>
      </div>

      {/* Sub-tabs: My Team / Mini Leagues */}
      <div style={{ display: "flex", gap: 2, marginBottom: 16, borderBottom: `1px solid ${COLORS.border}`, paddingBottom: 2 }}>
        {[teamName || "My Team", "Mini Leagues"].map((label, i) => (
          <button
            key={i}
            onClick={() => setMySubTab(i)}
            style={{
              background: mySubTab === i ? COLORS.green : "transparent",
              color: mySubTab === i ? COLORS.bg : COLORS.textSecondary,
              border: "none", borderRadius: "6px 6px 0 0",
              padding: "8px 20px", fontSize: 12, fontWeight: 600, cursor: "pointer",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Mini Leagues Tab */}
      {mySubTab === 1 && <MiniLeagues entryData={entryData} myEntryId={teamId} plMap={data.plMap} lastFinishedGW={data.lastFinishedGW} selectedLeague={selectedLeague} setSelectedLeague={setSelectedLeague} standings={leagueStandings} setStandings={setLeagueStandings} />}

      {/* My Team Tab */}
      {mySubTab === 0 && <>
      {/* Screenshot Zone */}
      <div ref={shareRef} style={{ background: COLORS.bg, padding: 4 }}>

      {/* Rank Details Panel */}
      {(() => {
        const curr = rankHistory?.length ? rankHistory[rankHistory.length - 1] : null;
        const prev = rankHistory?.length >= 2 ? rankHistory[rankHistory.length - 2] : null;
        const rankDelta = prev && curr ? prev.rank - curr.rank : 0; // positive = improved
        const pctImprove = prev && prev.rank > 0 ? ((rankDelta / prev.rank) * 100) : 0;
        const gwAvg = data.gwA?.length ? data.gwA[data.gwA.length - 1]?.avg || 0 : 0;
        const safety = curr ? curr.pts - gwAvg : 0;
        const bench = lastGwEntry?.points_on_bench || 0;
        const teamValue = lastGwEntry ? (lastGwEntry.value / 10).toFixed(1) : "—";
        const bank = lastGwEntry ? (lastGwEntry.bank / 10).toFixed(1) : "—";

        function fmtRank(r) {
          if (!r) return "—";
          if (r >= 1000000) return `${(r / 1000000).toFixed(1)}M`;
          if (r >= 1000) return `${Math.round(r / 1000)}K`;
          return r.toLocaleString();
        }

        return (
          <div style={{ marginBottom: 20 }}>
            {/* Rank hero */}
            <Card style={{ textAlign: "center", padding: "20px 16px", marginBottom: 12, border: `1px solid ${rankDelta >= 0 ? COLORS.green : COLORS.red}30`, background: `${rankDelta >= 0 ? COLORS.green : COLORS.red}06` }}>
              <div style={{ fontSize: 10, letterSpacing: 2, color: COLORS.textSecondary, marginBottom: 6, fontWeight: 600 }}>OVERALL RANK</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
                <span style={{ fontSize: 32, fontWeight: 800, fontFamily: "monospace", color: COLORS.text }}>{curr ? curr.rank.toLocaleString() : "—"}</span>
                {rankDelta !== 0 && (
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 20, fontSize: 13, fontWeight: 700,
                    background: rankDelta > 0 ? `${COLORS.green}18` : `${COLORS.red}18`,
                    color: rankDelta > 0 ? COLORS.green : COLORS.red,
                  }}>
                    {rankDelta > 0 ? "▲" : "▼"} {fmtRank(Math.abs(rankDelta))}
                  </span>
                )}
              </div>
              {prev && rankDelta !== 0 && (
                <div style={{ fontSize: 11, color: COLORS.textSecondary, marginTop: 4 }}>
                  {rankDelta > 0 ? "▲" : "▼"} {Math.abs(pctImprove).toFixed(1)}% {rankDelta > 0 ? "improvement" : "drop"} from {prev.rank.toLocaleString()}
                </div>
              )}
              {curr?.percentile_rank != null && (
                <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 2 }}>Top {100 - (lastGwEntry?.percentile_rank || curr.percentile_rank || 50)}%</div>
              )}
            </Card>

            {/* Stat grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 8 }}>
              <StatCard label="GW SCORE" value={curr?.pts || "—"} color={curr && curr.pts >= 60 ? COLORS.green : curr && curr.pts >= 40 ? COLORS.amber : COLORS.red} />
              <StatCard label="TOTAL" value={curr ? curr.total.toLocaleString() : "—"} />
              <StatCard label="BENCH PTS" value={bench} color={bench >= 10 ? COLORS.amber : COLORS.textSecondary} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              <StatCard label="SAFETY" value={safety >= 0 ? `+${Math.round(safety)}` : Math.round(safety)} sub="vs GW avg" color={safety >= 0 ? COLORS.green : COLORS.red} />
              <StatCard label="TEAM VALUE" value={`£${teamValue}`} />
              <StatCard label="IN THE BANK" value={`£${bank}`} />
            </div>
          </div>
        );
      })()}

      {/* Overall Rank Chart */}
      <RankChart rankHistory={rankHistory} />

      {/* Squad List */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 14, letterSpacing: 1.5, color: COLORS.text, marginBottom: 8, fontWeight: 700 }}>STARTING XI</div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 6, padding: "0 12px 6px", fontSize: 7, color: COLORS.textMuted, fontWeight: 600, letterSpacing: 0.5 }}>
          <span style={{ width: 30, textAlign: "right" }}>Own%</span>
          <span style={{ width: 28, textAlign: "right" }}>GW Pts</span>
          <span style={{ width: 34, textAlign: "right" }}>Total Pts</span>
          <span style={{ width: 22, textAlign: "right" }}>Form</span>
          <span style={{ width: 120, textAlign: "center" }}>Next 5 Fixtures</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {starters.map((p) => <SquadPlayer key={p.id} p={p} tm={data.tm} />)}
        </div>
        {bench.length > 0 && (
          <>
            <div style={{ fontSize: 14, letterSpacing: 1.5, color: COLORS.text, marginTop: 16, marginBottom: 8, fontWeight: 700 }}>BENCH</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {bench.map((p) => <SquadPlayer key={p.id} p={p} tm={data.tm} />)}
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
          <div style={{ fontSize: 14, letterSpacing: 1.5, color: COLORS.text, marginBottom: 10, fontWeight: 700 }}>WEAKEST LINK</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.red }}>{weakest.name}</div>
            <div style={{ fontSize: 11, color: COLORS.textSecondary }}>{weakest.team} · {weakest.posL} · £{weakest.price} · {weakest.form} form · Score: {weakest.composite}</div>
          </div>
        </Card>
      )}

      {/* Best XI */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 14, letterSpacing: 1.5, color: COLORS.text, marginBottom: 10, fontWeight: 700 }}>OPTIMAL XI SUGGESTION</div>
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
        <div style={{ fontSize: 14, letterSpacing: 1.5, color: COLORS.text, marginBottom: 12, fontWeight: 700 }}>CHIP STRATEGIST</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
          {/* Bench Boost */}
          <div style={{ background: COLORS.bg, borderRadius: 8, padding: 12, border: `1px solid ${COLORS.border}`, textAlign: "center", opacity: chips.available.bboost ? 1 : 0.4 }}>
            <div style={{ fontSize: 9, color: COLORS.textSecondary, letterSpacing: 1, marginBottom: 4 }}>BENCH BOOST</div>
            {!chips.available.bboost ? (
              <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.textMuted }}>USED</div>
            ) : chips.benchBoost ? (
              <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.green }}>GW{chips.benchBoost}</div>
            ) : (
              <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.textMuted }}>AVAILABLE</div>
            )}
          </div>
          {/* Triple Captain */}
          <div style={{ background: COLORS.bg, borderRadius: 8, padding: 12, border: `1px solid ${COLORS.border}`, textAlign: "center", opacity: chips.available["3xc"] ? 1 : 0.4 }}>
            <div style={{ fontSize: 9, color: COLORS.textSecondary, letterSpacing: 1, marginBottom: 4 }}>TRIPLE CAPTAIN</div>
            {!chips.available["3xc"] ? (
              <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.textMuted }}>USED</div>
            ) : chips.tripleCaptain ? (
              <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.amber }}>GW{chips.tripleCaptain}</div>
            ) : (
              <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.textMuted }}>AVAILABLE</div>
            )}
          </div>
          {/* Free Hit */}
          <div style={{ background: COLORS.bg, borderRadius: 8, padding: 12, border: `1px solid ${COLORS.border}`, textAlign: "center", opacity: chips.available.freehit ? 1 : 0.4 }}>
            <div style={{ fontSize: 9, color: COLORS.textSecondary, letterSpacing: 1, marginBottom: 4 }}>FREE HIT</div>
            {!chips.available.freehit ? (
              <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.textMuted }}>USED</div>
            ) : chips.freeHit ? (
              <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.blue }}>GW{chips.freeHit}</div>
            ) : (
              <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.textMuted }}>AVAILABLE</div>
            )}
          </div>
          {/* Wildcard */}
          <div style={{ background: COLORS.bg, borderRadius: 8, padding: 12, border: `1px solid ${chips.wildcard ? COLORS.red : COLORS.border}`, textAlign: "center", opacity: chips.available.wildcard ? 1 : 0.4 }}>
            <div style={{ fontSize: 9, color: COLORS.textSecondary, letterSpacing: 1, marginBottom: 4 }}>WILDCARD</div>
            {!chips.available.wildcard ? (
              <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.textMuted }}>USED</div>
            ) : (
              <div style={{ fontSize: 14, fontWeight: 700, color: chips.wildcard ? COLORS.red : COLORS.green }}>
                {chips.wildcard ? "CONSIDER" : "HOLD"}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Watermark */}
      <div style={{ textAlign: "center", marginTop: 16, fontSize: 10, color: COLORS.textMuted }}>
        FPL Pulse
      </div>

      </div>{/* end screenshot zone */}
      </>}
    </div>
  );
}
