import { useState } from "react";
import { COLORS } from "../utils/theme";

const SECTIONS = [
  {
    tab: "Season Pulse",
    panels: [
      {
        name: "GW at a Glance",
        metrics: [
          { label: "Last GW Avg", formula: "events[gw].average_entry_score", desc: "Average points scored by ALL FPL managers in the last completed gameweek." },
          { label: "Season Avg", formula: "mean(all completed GW averages)", desc: "Mean of all gameweek averages across the season." },
          { label: "Most Captained", formula: "Top-owned MID/FWD with >15% ownership", desc: "Approximated as the highest-owned attacking player — the most likely captain pick." },
          { label: "Highest Score", formula: "events[gw].highest_score", desc: "The single highest individual manager score in the last completed GW." },
        ],
      },
      {
        name: "Template Tracker",
        metrics: [
          { label: "Template XI", formula: "Top 11 players by selected_by_percent", desc: "The 11 most-owned players across all FPL managers. Arranged in a pitch formation." },
          { label: "Avg Form", formula: "mean(template XI form values)", desc: "Average of FPL's 30-day rolling form stat across the template XI." },
        ],
      },
      {
        name: "Price Movers",
        metrics: [
          { label: "Risers", formula: "cost_change_event > 0", desc: "Players whose price rose in the current GW window. Sorted by biggest rise." },
          { label: "Fallers", formula: "cost_change_event < 0", desc: "Players whose price fell. Sorted by biggest drop." },
        ],
      },
      {
        name: "DEFCON Leaders",
        metrics: [
          { label: "DefCon (raw)", formula: "defensive_contribution from bootstrap-static", desc: "Cumulative tackles + blocks + clearances + interceptions (+ recoveries for MID/FWD) across the season." },
          { label: "DC/90", formula: "defensive_contribution × (90 / minutes)", desc: "Defensive contribution rate per 90 minutes played." },
          { label: "DC Pts", formula: "SUM(2 if game_dc >= threshold else 0)", desc: "Actual FPL points earned from defensive contributions. Per game: DEF/GK need 10+ for 2pts, MID/FWD need 12+. Capped at 2/game. Fetched from element-summary per-game data." },
          { label: "Hit%", formula: "(games hitting threshold / total games) × 100", desc: "Percentage of games where the player earned the 2 defensive contribution FPL points." },
          { label: "CS%", formula: "clean_sheets / appearances × 100", desc: "Clean sheet rate — percentage of games the player's team kept a clean sheet while they played." },
        ],
      },
      {
        name: "Best Value",
        metrics: [
          { label: "Pts/£M (Season)", formula: "total_points / (now_cost / 10)", desc: "Total season points divided by current price. Higher = better long-term value." },
          { label: "Form/£M (Recent)", formula: "form / (now_cost / 10)", desc: "Recent form per million. Players in the right table but not the left are currently underpriced by the market." },
        ],
      },
      {
        name: "Smart Money",
        metrics: [
          { label: "Top 500 Own%", formula: "Sampled from top overall league managers", desc: "Ownership percentage among the top ~500 ranked managers globally, calculated by fetching their actual squads." },
          { label: "Gap", formula: "top_own% - overall_own%", desc: "Smart Buys: elite own more than the field (positive gap). Casual Traps: field over-owns vs elite (negative gap)." },
        ],
      },
      {
        name: "Score by GW Chart",
        metrics: [
          { label: "Green bar", formula: "GW avg >= season avg", desc: "Gameweeks where the average manager scored above the season average." },
          { label: "Red bar", formula: "GW avg < season avg", desc: "Below-average scoring gameweeks." },
          { label: "Blue bar", formula: "Top 100 managers' avg score that GW", desc: "Average score of the top 100 ranked managers. Shows the elite performance gap." },
        ],
      },
    ],
  },
  {
    tab: "Fixture Engine",
    panels: [
      {
        name: "Fixture Run-Ins",
        metrics: [
          { label: "RUN score", formula: "Weighted avg of next-N FDR values (weights: 0.25, 0.20, 0.16, 0.13, 0.10...)", desc: "Lower = easier run. Weights front-load upcoming fixtures — the next match matters most." },
          { label: "ATK (Attack Run)", formula: "Avg opponent xGC/90 across upcoming fixtures", desc: "How many goals opponents concede per 90. Higher = easier to score against." },
          { label: "DEF (Defense Run)", formula: "Avg opponent xG/90 across upcoming fixtures", desc: "How many goals opponents create per 90. Lower = easier to keep clean sheets." },
          { label: "FDR cells", formula: "FPL's official Fixture Difficulty Rating (1-5)", desc: "Color-coded: dark green (1-2) = easy, yellow (3) = medium, red (4) = hard, dark red (5) = very hard." },
        ],
      },
    ],
  },
  {
    tab: "Player Intel",
    panels: [
      {
        name: "Form Tracker",
        metrics: [
          { label: "Form", formula: "FPL's points_per_game over last 30 days", desc: "Official FPL rolling average — not a custom calculation." },
          { label: "xGI/90", formula: "(expected_goals + expected_assists) × (90 / minutes)", desc: "Expected goal involvement per 90 minutes. Measures underlying attacking quality." },
          { label: "BPS/90", formula: "bps × (90 / minutes)", desc: "Bonus Point System score per 90. High BPS/90 = likely to earn bonus points consistently." },
          { label: "Sparkline", formula: "Last 8 GW points from element-summary", desc: "Visual trend of recent GW-by-GW points. Shows form trajectory at a glance." },
          { label: "Composite Score", formula: "form×0.35 + xGI90×2.5 + bps90×0.005 + fixtureRating×2 + ppg×0.3", desc: "Weighted composite combining form, underlying stats, bonus potential, fixtures, and season average." },
        ],
      },
      {
        name: "Floor Kings",
        metrics: [
          { label: "Selection criteria", formula: "appearances > 20, PPG between 3.5 and 6.5", desc: "Consistent mid-range scorers — rarely haul but rarely blank. Reliable floor." },
          { label: "Sort", formula: "(bonus / appearances) + points_per_game", desc: "Bonus consistency plus steady scoring. The ultimate 'set and forget' picks." },
        ],
      },
      {
        name: "Haul Hunters",
        metrics: [
          { label: "Selection criteria", formula: "minutes > 1080, total_points > 80, form > 4", desc: "High-ceiling players who are currently in form with enough minutes to prove it." },
          { label: "Sort", formula: "form×0.4 + xGI90×3 + fixtureRating×2", desc: "Weighted toward underlying attacking output and favorable upcoming fixtures." },
        ],
      },
    ],
  },
  {
    tab: "Deep Dive",
    panels: [
      {
        name: "Hidden Gems",
        metrics: [
          { label: "Criteria", formula: "ownership < 7%, ownership > 0.1%, form > median, minutes > 720", desc: "Low-owned players outperforming the median form with enough playing time to be reliable." },
          { label: "Sort", formula: "Composite score (same as Form Tracker)", desc: "Ranked by the same weighted composite — form, xGI, BPS, fixtures, PPG." },
          { label: "xG gap", formula: "goals_scored - expected_goals", desc: "Positive = overperforming xG. Negative = underperforming (due a correction)." },
          { label: "xA gap", formula: "assists - expected_assists", desc: "Same concept for assists. Positive = creating more than models predict." },
        ],
      },
      {
        name: "Eye Test vs Data",
        metrics: [
          { label: "Debate Score", formula: "|form - xGI90×8| + |ppg - form|", desc: "Measures how much a player's eye test (form, blanks) contradicts their underlying numbers." },
          { label: "Eye Test column", formula: "Recent blanks, price drops, ownership changes", desc: "What the casual FPL community sees — the surface-level narrative." },
          { label: "Data column", formula: "xGI/90, shot volume, BPS/90 trends", desc: "What the numbers actually say — underlying quality metrics." },
        ],
      },
      {
        name: "Bandwagon Monitor",
        metrics: [
          { label: "Ownership Velocity", formula: "current_ownership - ownership_4_weeks_ago", desc: "How fast ownership is changing. Requires Supabase weekly snapshots (placeholder until enough data)." },
          { label: "Bandwagon Alert", formula: "Top 10 by positive velocity", desc: "Players with the fastest ownership gains — are managers late or early?" },
          { label: "Sinking Ships", formula: "Top 10 by negative velocity", desc: "Mass sells. Are managers right to dump them, or is this a buy-low window?" },
        ],
      },
      {
        name: "Fixture Proof",
        metrics: [
          { label: "Easy Fixture Avg", formula: "avg points when FDR ≤ 2", desc: "Average FPL points in games rated easy by FPL's difficulty system." },
          { label: "Hard Fixture Avg", formula: "avg points when FDR ≥ 4", desc: "Average FPL points in games rated hard or very hard." },
          { label: "Fixture-Proof Ratio", formula: "hard_avg / easy_avg", desc: "Near 1.0 = same output regardless of opponent. Below 0.5 = only scores against weak teams. Above 1.0 = big-game player." },
        ],
      },
      {
        name: "Captain Roulette",
        metrics: [
          { label: "Most Captained", formula: "Highest-owned MID/FWD each GW (proxy)", desc: "Approximated as the most-owned attacking player that GW — the crowd's captain." },
          { label: "Optimal Captain", formula: "Highest actual scorer each GW × 2", desc: "Who you should have captained with perfect hindsight." },
          { label: "Points Left on Table", formula: "optimal_captain_pts - most_captained_pts", desc: "How much the crowd lost by following the template captain." },
        ],
      },
      {
        name: "xG League Table",
        metrics: [
          { label: "Team xG", formula: "SUM(expected_goals) for all players in team", desc: "Total expected goals created by the team, aggregated from individual player xG." },
          { label: "Team xGA", formula: "SUM(opponent xG) from fixture data", desc: "Expected goals against — how many goals the team should have conceded." },
          { label: "xPts", formula: "Simulated points from xG/xGA differentials", desc: "Where the team should sit in the league based purely on expected metrics. Teams above their xPts position are overperforming (regression risk)." },
        ],
      },
    ],
  },
  {
    tab: "My Team",
    panels: [
      {
        name: "Rank Details",
        metrics: [
          { label: "Overall Rank", formula: "entry.summary_overall_rank from /entry/{id}/", desc: "Your current position among all FPL managers worldwide." },
          { label: "Rank Change", formula: "previous_gw_rank - current_rank", desc: "How many places you moved since last GW. Green arrow = climbed, Red = dropped." },
          { label: "% Improvement", formula: "(rank_change / previous_rank) × 100", desc: "Percentage rank improvement from the previous gameweek." },
          { label: "GW Points", formula: "From /entry/{id}/event/{gw}/picks/ entry_history", desc: "Your actual GW score including captain multiplier and hit costs." },
          { label: "Bench Points", formula: "points_on_bench from entry_history", desc: "Points scored by your bench players that GW — wasted points." },
        ],
      },
      {
        name: "Overall Rank Chart",
        metrics: [
          { label: "Green bars", formula: "GW points when rank improved", desc: "GWs where you climbed in overall rank. Taller = higher score." },
          { label: "Red bars", formula: "GW points when rank dropped", desc: "GWs where you fell in rank." },
          { label: "Blue line", formula: "Overall rank per GW (inverted scale)", desc: "Rank trajectory — higher on chart = better rank. Shows your season-long journey." },
        ],
      },
      {
        name: "Starting XI",
        metrics: [
          { label: "Own%", formula: "selected_by_percent", desc: "What percentage of all FPL managers own this player." },
          { label: "GW Pts", formula: "event_points (last completed GW)", desc: "Points scored in the most recent gameweek." },
          { label: "Form", formula: "FPL's 30-day rolling points_per_game", desc: "Recent form — official FPL calculation." },
          { label: "Next 5 Fixtures", formula: "FDR-coloured upcoming opponent badges", desc: "Color-coded by difficulty: green = easy, red = hard." },
        ],
      },
      {
        name: "Squad Health",
        metrics: [
          { label: "Health Score", formula: "mean(squad composite scores) × 10, out of 100", desc: "Average composite score across your 15 players, scaled to 100." },
          { label: "Status", formula: "Green ≥ 4.5, Amber ≥ 3, Red < 3", desc: "Traffic light system based on composite score. Reds are transfer priorities." },
        ],
      },
      {
        name: "Chip Strategist",
        metrics: [
          { label: "Chips Available", formula: "Fetched from /entry/{id}/history/ chips array", desc: "2025/26: every chip available twice (GW1-18 and GW19+). Shows which second-half chips remain." },
          { label: "Bench Boost GW", formula: "GW with highest total (6 - FDR) across all 15 players", desc: "The upcoming GW where your full squad has the easiest combined fixtures." },
          { label: "Triple Captain GW", formula: "GW where captain's form × (6 - FDR) is highest", desc: "Best GW to triple-captain based on your captain pick's form and fixture." },
          { label: "Free Hit GW", formula: "GW with lowest total (6 - FDR) across squad", desc: "Your worst fixture GW — when you'd benefit most from a completely different team." },
          { label: "Wildcard", formula: "CONSIDER if 4+ players are Red status", desc: "Suggests considering a wildcard when a significant portion is underperforming." },
        ],
      },
      {
        name: "Best XI & Captain",
        metrics: [
          { label: "Best XI", formula: "Top 11 by composite in valid formation (1GK, 3+DEF, 2+MID, 1+FWD)", desc: "Optimal starting lineup from your 15 players." },
          { label: "Captain Pick", formula: "Highest composite in Best XI", desc: "Best combination of form and fixtures for the upcoming GW." },
        ],
      },
      {
        name: "Mini Leagues",
        metrics: [
          { label: "League standings", formula: "/leagues-classic/{id}/standings/", desc: "Live standings for any classic mini-league your team is part of." },
          { label: "Rank Change", formula: "rank - last_rank", desc: "Green arrow = climbed since last GW, Red = dropped. Dash = unchanged." },
          { label: "Expanded team", formula: "Per-manager /event/{gw}/picks/", desc: "Tap any row to see their full GW squad with captain pts doubled." },
        ],
      },
    ],
  },
];

export default function ScoreExplainer({ onClose }) {
  const [expandedTab, setExpandedTab] = useState(0);

  return (
    <div
      style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        background: "rgba(0,0,0,0.7)", zIndex: 9999,
        display: "flex", justifyContent: "center", alignItems: "flex-start",
        padding: "40px 20px", overflowY: "auto",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: COLORS.bg, borderRadius: 16, maxWidth: 800, width: "100%",
          border: `1px solid ${COLORS.border}`, maxHeight: "calc(100vh - 80px)",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: "20px 24px", borderBottom: `1px solid ${COLORS.border}`,
          display: "flex", justifyContent: "space-between", alignItems: "center",
          position: "sticky", top: 0, background: COLORS.bg, zIndex: 1, borderRadius: "16px 16px 0 0",
        }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.text }}>Score Explainer</div>
            <div style={{ fontSize: 11, color: COLORS.textSecondary, marginTop: 2 }}>How every metric in FPL Pulse is calculated</div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 8,
              padding: "6px 12px", cursor: "pointer", color: COLORS.text, fontSize: 13, fontWeight: 600,
            }}
          >
            Close
          </button>
        </div>

        {/* Tab selector */}
        <div style={{ padding: "12px 24px 0", display: "flex", gap: 6, flexWrap: "wrap" }}>
          {SECTIONS.map((s, i) => (
            <button
              key={i}
              onClick={() => setExpandedTab(i)}
              style={{
                background: expandedTab === i ? COLORS.green : COLORS.surface,
                color: expandedTab === i ? COLORS.bg : COLORS.textSecondary,
                border: `1px solid ${expandedTab === i ? COLORS.green : COLORS.border}`,
                borderRadius: 6, padding: "6px 14px", fontSize: 11, fontWeight: 600,
                cursor: "pointer", letterSpacing: 0.5,
              }}
            >
              {s.tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ padding: "16px 24px 24px" }}>
          {SECTIONS[expandedTab].panels.map((panel, pi) => (
            <div key={pi} style={{ marginBottom: 20 }}>
              <div style={{
                fontSize: 11, letterSpacing: 2, color: COLORS.amber, fontWeight: 600,
                marginBottom: 10, paddingBottom: 6, borderBottom: `1px solid ${COLORS.border}`,
              }}>
                {panel.name.toUpperCase()}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {panel.metrics.map((m, mi) => (
                  <div key={mi} style={{
                    background: COLORS.surface, borderRadius: 8, padding: "10px 14px",
                    border: `1px solid ${COLORS.border}`,
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.text }}>{m.label}</span>
                      <code style={{
                        fontSize: 9, color: COLORS.blue, background: `${COLORS.blue}10`,
                        padding: "2px 6px", borderRadius: 4, whiteSpace: "nowrap", flexShrink: 0,
                      }}>
                        {m.formula.length > 50 ? m.formula.slice(0, 47) + "..." : m.formula}
                      </code>
                    </div>
                    <div style={{ fontSize: 11, color: COLORS.textSecondary, lineHeight: 1.6 }}>{m.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          padding: "12px 24px 16px", borderTop: `1px solid ${COLORS.border}`,
          fontSize: 10, color: COLORS.textMuted, textAlign: "center",
        }}>
          All data sourced from fantasy.premierleague.com/api/ · No third-party data used except Top 100/500 manager sampling
        </div>
      </div>
    </div>
  );
}
