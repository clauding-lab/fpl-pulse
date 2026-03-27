import { POS_MAP } from "./theme";

const RUN_WEIGHTS = [0.25, 0.20, 0.16, 0.13, 0.10, 0.07, 0.05, 0.04];

export function computeAll(apiData) {
  const { bootstrap: d, fixtures: fx } = apiData;

  // Use is_next (upcoming GW) for forward-looking analysis; fall back to is_current, then last GW
  const nextGW = d.events.find((e) => e.is_next);
  const currentGW = d.events.find((e) => e.is_current);
  const cGW = nextGW || currentGW || d.events[d.events.length - 1];
  const gw = cGW?.id || 1;
  const lastFinishedGW = currentGW?.finished ? currentGW.id : (currentGW?.id || 1) - 1;

  const done = d.events.filter((e) => e.finished);
  const gwA = done.map((e) => ({ gw: e.id, avg: e.average_entry_score || 0 }));
  const sAvg = gwA.length ? gwA.reduce((a, b) => a + b.avg, 0) / gwA.length : 50;
  const r3 = gwA.length >= 3 ? gwA.slice(-3).reduce((a, b) => a + b.avg, 0) / 3 : sAvg;

  const tm = {};
  d.teams.forEach((t) => (tm[t.id] = t));

  // Past fixtures per team (for swing detection)
  const pastFx = {};
  d.teams.forEach((t) => (pastFx[t.id] = []));
  fx.filter((f) => f.event < gw && f.finished)
    .forEach((f) => {
      pastFx[f.team_h]?.push(f.team_h_difficulty || 3);
      pastFx[f.team_a]?.push(f.team_a_difficulty || 3);
    });

  // Upcoming fixtures per team (next 8 GWs)
  const uf = {};
  d.teams.forEach((t) => (uf[t.id] = []));
  fx.filter((f) => f.event >= gw && !f.finished)
    .sort((a, b) => a.event - b.event)
    .forEach((f) => {
      if (uf[f.team_h]?.length < 8)
        uf[f.team_h].push({ gw: f.event, opp: f.team_a, home: true, fdr: f.team_h_difficulty || 3 });
      if (uf[f.team_a]?.length < 8)
        uf[f.team_a].push({ gw: f.event, opp: f.team_h, home: false, fdr: f.team_a_difficulty || 3 });
    });

  // DGW/BGW detection
  const gwFixtureCounts = {};
  fx.filter((f) => f.event >= gw && !f.finished).forEach((f) => {
    const e = f.event;
    if (!gwFixtureCounts[e]) gwFixtureCounts[e] = {};
    gwFixtureCounts[e][f.team_h] = (gwFixtureCounts[e][f.team_h] || 0) + 1;
    gwFixtureCounts[e][f.team_a] = (gwFixtureCounts[e][f.team_a] || 0) + 1;
  });
  const dgwTeams = {};
  const bgwTeams = {};
  Object.entries(gwFixtureCounts).forEach(([gwNum, counts]) => {
    const dgw = [];
    const allTeamsInGw = new Set(Object.keys(counts).map(Number));
    d.teams.forEach((t) => {
      if ((counts[t.id] || 0) >= 2) dgw.push(t.short_name);
      if (!allTeamsInGw.has(t.id)) {
        if (!bgwTeams[gwNum]) bgwTeams[gwNum] = [];
        bgwTeams[gwNum].push(t.short_name);
      }
    });
    if (dgw.length) dgwTeams[gwNum] = dgw;
  });

  // Compute team-level xG and xGC for Attack/Defense Run ratings
  // xG: sum of all players' expected_goals = team total xG for the season
  // xGC: use expected_goals_conceded from ONE player per team (e.g. highest-mins player)
  //       since xGC is the same for all players on the pitch in a given match
  const teamXGtotals = {};
  const teamXGCtotals = {};
  d.teams.forEach((t) => { teamXGtotals[t.id] = 0; teamXGCtotals[t.id] = { xgc: 0, mins: 0 }; });
  d.elements.forEach((p) => {
    const m = p.minutes || 0;
    if (m < 90) return;
    teamXGtotals[p.team] += parseFloat(p.expected_goals) || 0;
  });
  // For xGC, pick the player with most minutes per team (their xGC = team xGC)
  const teamTopPlayer = {};
  d.elements.forEach((p) => {
    const m = p.minutes || 0;
    if (!teamTopPlayer[p.team] || m > teamTopPlayer[p.team].minutes) {
      teamTopPlayer[p.team] = p;
    }
  });
  d.teams.forEach((t) => {
    const top = teamTopPlayer[t.id];
    if (top) {
      teamXGCtotals[t.id] = { xgc: parseFloat(top.expected_goals_conceded) || 0, mins: top.minutes || 0 };
    }
  });

  // Calculate per-90 rates
  // Team matches played ≈ finished GWs (each team plays ~1 game per GW)
  const matchesPlayed = done.length || 1;
  const teamXGper90 = {};
  const teamXGCper90 = {};
  d.teams.forEach((t) => {
    // xG per 90: total team xG / matches played (already team-level sum)
    teamXGper90[t.id] = +(teamXGtotals[t.id] / matchesPlayed).toFixed(2);
    // xGC per 90: from top player's xGC (= team xGC) / their 90s played
    const xgcD = teamXGCtotals[t.id];
    teamXGCper90[t.id] = xgcD.mins > 0 ? +((xgcD.xgc / xgcD.mins) * 90).toFixed(2) : 1.2;
  });

  // Team Run Ratings with swing detection + attack/defense run
  const tRR = d.teams
    .map((t) => {
      const f = uf[t.id] || [];
      const rr = f.reduce((s, v, i) => s + v.fdr * (RUN_WEIGHTS[i] || 0.02), 0);
      const pastAvg = pastFx[t.id]?.length ? pastFx[t.id].reduce((a, b) => a + b, 0) / pastFx[t.id].length : 3;
      const futAvg = f.length ? f.reduce((a, v) => a + v.fdr, 0) / f.length : 3;
      const swing = pastAvg - futAvg; // positive = upcoming easier

      // Attack Run: avg opponent xGC/90 (higher = easier to score against)
      const atkOppXGC = f.slice(0, 6).map((fx) => teamXGCper90[fx.opp] || 1.2);
      const atkRun = atkOppXGC.length ? atkOppXGC.reduce((a, b) => a + b, 0) / atkOppXGC.length : 1.2;
      // Defense Run: avg opponent xG/90 (lower = easier to keep CS)
      const defOppXG = f.slice(0, 6).map((fx) => teamXGper90[fx.opp] || 1.2);
      const defRun = defOppXG.length ? defOppXG.reduce((a, b) => a + b, 0) / defOppXG.length : 1.2;

      return { ...t, fixtures: f, rr, pastAvg, futAvg, swing, atkRun, defRun };
    })
    .sort((a, b) => a.rr - b.rr);

  // Player enrichment
  const pl = d.elements.map((p) => {
    const team = tm[p.team];
    const m = p.minutes || 0;
    const p90 = m > 0 ? 90 / m : 0;
    const xG = parseFloat(p.expected_goals) || 0;
    const xA = parseFloat(p.expected_assists) || 0;
    const xGI = xG + xA;
    const xGI90 = +(xGI * p90).toFixed(2);
    const bps90 = +((p.bps || 0) * p90).toFixed(1);
    const form = parseFloat(p.form) || 0;
    const tf = uf[p.team] || [];
    const aFDR = tf.length ? tf.slice(0, 4).reduce((a, f) => a + f.fdr, 0) / Math.min(tf.length, 4) : 3;
    const fR = 1 - (aFDR - 1) / 4;
    const ppg = parseFloat(p.points_per_game) || 0;
    const cs = p.clean_sheets || 0;
    const nowCost = p.now_cost;

    return {
      id: p.id,
      name: p.web_name,
      team: team?.short_name || "?",
      teamId: p.team,
      teamName: team?.name || "",
      pos: p.element_type,
      posL: POS_MAP[p.element_type],
      price: (nowCost / 10).toFixed(1),
      nowCost,
      form,
      pts: p.total_points,
      ppg,
      mins: m,
      goals: p.goals_scored,
      assists: p.assists,
      xG, xA, xGI, xGI90,
      bps: p.bps || 0, bps90,
      bonus: p.bonus || 0,
      own: parseFloat(p.selected_by_percent) || 0,
      cop: p.chance_of_playing_next_round,
      pChg: p.cost_change_event || 0,
      yc: p.yellow_cards || 0,
      code: p.code,
      cs, fR, aFDR,
      defCon: p.defensive_contribution || 0,
      defCon90: parseFloat(p.defensive_contribution_per_90) || 0,
      apps: Math.max(Math.floor(m / 45), 1),
      fScore: +(form * 0.35 + xGI90 * 2.5 + bps90 * 0.005 + fR * 2 + ppg * 0.3).toFixed(2),
      // Penalty / xGI delta fields
      penOrder: p.penalties_order,
      penMissed: p.penalties_missed || 0,
      // GK-specific fields
      saves: p.saves || 0,
      savesPer90: parseFloat(p.saves_per_90) || 0,
      penSaved: p.penalties_saved || 0,
      gc: p.goals_conceded || 0,
      gcPer90: parseFloat(p.goals_conceded_per_90) || 0,
      xGC: parseFloat(p.expected_goals_conceded) || 0,
      xGCper90: parseFloat(p.expected_goals_conceded_per_90) || 0,
      csPer90: parseFloat(p.clean_sheets_per_90) || 0,
    };
  });

  const plMap = {};
  pl.forEach((p) => (plMap[p.id] = p));

  // Template XI
  const tpl = [...pl].sort((a, b) => b.own - a.own).slice(0, 11);
  const tH = tpl.reduce((a, p) => a + p.form, 0) / tpl.length;

  // Position meta
  const pM = [1, 2, 3, 4].map((pos) => {
    const pp = pl.filter((p) => p.pos === pos && p.mins > 450);
    return {
      pos,
      label: POS_MAP[pos],
      v: pp.length ? (pp.reduce((a, p) => a + p.ppg / +p.price, 0) / pp.length).toFixed(2) : "0",
      color: pos === 1 ? "#e8a50a" : pos === 2 ? "#4ade80" : pos === 3 ? "#38bdf8" : "#ff2882",
    };
  });

  const flagged = pl.filter((p) => p.own > 10 && p.cop !== null && p.cop < 75);

  // --- Panel 1: GW at a Glance ---
  const nextEvent = d.events.find((e) => e.is_next);
  const lastEvent = done.length ? done[done.length - 1] : null;
  const glance = {
    gw,
    deadline: nextEvent?.deadline_time || null,
    lastAvg: lastEvent?.average_entry_score || 0,
    lastHighest: lastEvent?.highest_score || 0,
    sAvg,
    lastVsSeason: lastEvent ? lastEvent.average_entry_score - sAvg : 0,
    mostCaptained: [...pl].filter((p) => p.pos >= 3 && p.own > 15).sort((a, b) => b.own - a.own)[0]?.name || "—",
  };

  // --- Panel 2: DEFCON Leaders ---
  // FPL rules: DEF/GK need 10 CBIT per game for 2 FPL pts; MID/FWD need 12 CBIRT for 2 FPL pts (capped at 2/game)
  // defensive_contribution from bootstrap = raw cumulative stat count
  // Actual FPL pts fetched from /api/defcon-detail (per-game element-summary)
  const defcon = pl
    .filter((p) => p.mins >= 1500 && p.defCon > 0)
    .map((p) => {
      const csRate = p.apps > 0 ? +(p.cs / p.apps).toFixed(2) : 0;
      const threshold = (p.pos === 1 || p.pos === 2) ? 10 : 12;
      return { ...p, csRate, threshold, dcFplPts: null }; // null = fetched async
    })
    .sort((a, b) => b.defCon - a.defCon);

  // --- Panel 3: Best Value ---
  const valueAll = pl.filter((p) => p.mins > 900 && +p.price > 0);
  const seasonValue = [...valueAll]
    .map((p) => ({ ...p, ptsPM: +(p.pts / +p.price).toFixed(1) }))
    .sort((a, b) => b.ptsPM - a.ptsPM)
    .slice(0, 10);
  const formValue = [...valueAll]
    .filter((p) => p.form > 0)
    .map((p) => ({ ...p, formPM: +(p.form / +p.price).toFixed(2) }))
    .sort((a, b) => b.formPM - a.formPM)
    .slice(0, 10);

  // --- Panel 7: Price Movers ---
  const risers = pl.filter((p) => p.pChg > 0).sort((a, b) => b.pChg - a.pChg).slice(0, 5);
  const fallers = pl.filter((p) => p.pChg < 0).sort((a, b) => a.pChg - b.pChg).slice(0, 5);

  // Form players
  const fPl = pl.filter((p) => p.mins > 900 && p.form > 0).sort((a, b) => b.fScore - a.fScore);

  const mArr = [...pl.filter((p) => p.mins > 450)].sort((a, b) => a.form - b.form);
  const mF = mArr.length ? mArr[Math.floor(mArr.length / 2)].form : 2;

  const gems = pl
    .filter((p) => p.own < 7 && p.own > 0.1 && p.form > mF && p.mins > 720)
    .sort((a, b) => b.fScore - a.fScore)
    .slice(0, 12);

  const hh = pl
    .filter((p) => p.mins > 1080 && p.pts > 80 && p.form > 4)
    .sort((a, b) => b.form * 0.4 + b.xGI90 * 3 + b.fR * 2 - (a.form * 0.4 + a.xGI90 * 3 + a.fR * 2))
    .slice(0, 25);

  const fk = pl
    .filter((p) => p.apps > 20 && p.ppg >= 3.5 && p.ppg <= 6.5)
    .sort((a, b) => b.bonus / b.apps + b.ppg - (a.bonus / a.apps + a.ppg))
    .slice(0, 25);

  const risk = pl
    .filter((p) => p.own >= 10)
    .map((p) => {
      const f = [];
      if (p.cop !== null && p.cop < 75) f.push({ t: "Injury Risk", s: "red", d: `${p.cop}% chance` });
      if (p.yc >= 9) f.push({ t: "Suspension", s: "amber", d: `${p.yc} yellows` });
      if (p.pChg < 0) f.push({ t: "Price Drop", s: "amber", d: "Fell this GW" });
      if (p.form < 2 && p.ppg > 4) f.push({ t: "Form Collapse", s: "red", d: `${p.form} form vs ${p.ppg} PPG` });
      return f.length ? { ...p, rf: f } : null;
    })
    .filter(Boolean);

  // --- xGI Delta: penalty dependency analysis ---
  // Estimate penalty xG: each penalty taken ≈ 0.76 xG
  // Approximate pens taken from: player is on penalties + (goals - open play contribution)
  const xgiDelta = pl
    .filter((p) => p.pos >= 2 && p.mins > 900 && p.xGI > 0)
    .map((p) => {
      const isPenTaker = p.penOrder && p.penOrder <= 2;
      // Estimate pens taken: for designated takers, estimate from xG surplus over npxG norms
      // Simple heuristic: if on pens, estimate ~0.76 xG per pen scored (goals that look like pen contributions)
      const estPensTaken = isPenTaker ? Math.max(Math.round(p.goals * 0.25), 1) : 0; // rough: ~25% of goals from pens for designated takers
      const penXG = estPensTaken * 0.76;
      const npxG = Math.max(p.xG - penXG, 0);
      const npxGI = npxG + p.xA;
      const p90 = p.mins > 0 ? 90 / p.mins : 0;
      const npxGI90 = +(npxGI * p90).toFixed(2);
      const xgiDeltaVal = +(p.xGI90 - npxGI90).toFixed(2); // penalty dependency
      const depPct = p.xGI90 > 0 ? Math.round((xgiDeltaVal / p.xGI90) * 100) : 0;
      return { ...p, isPenTaker, estPensTaken, penXG: +penXG.toFixed(2), npxG: +npxG.toFixed(2), npxGI: +npxGI.toFixed(2), npxGI90, xgiDeltaVal, depPct };
    })
    .sort((a, b) => b.xgiDeltaVal - a.xgiDeltaVal);

  // --- Shot Stoppers: GK composite ranking ---
  const shotStoppers = pl
    .filter((p) => p.pos === 1 && p.mins >= 1350) // GKs with 15+ starts
    .map((p) => {
      const savePoints = Math.floor(p.saves / 3); // FPL: 1 pt per 3 saves
      const savePtsPer90 = p.mins > 0 ? +(savePoints * 90 / p.mins).toFixed(2) : 0;
      const csRate = p.apps > 0 ? +(p.cs / p.apps).toFixed(2) : 0;
      const bonusPerApp = p.apps > 0 ? +(p.bonus / p.apps).toFixed(2) : 0;
      // xSaves: difference between xGC and actual GC (positive = outperforming defense)
      const xSaves = +(p.xGC - p.gc).toFixed(1); // positive = saved more than expected
      // GK composite value
      const gkValue = +(p.savesPer90 * 0.30 + savePtsPer90 * 0.25 + csRate * 0.25 + bonusPerApp * 0.20).toFixed(2);
      return { ...p, savePoints, savePtsPer90, csRate, bonusPerApp, xSaves, gkValue };
    })
    .sort((a, b) => b.gkValue - a.gkValue);

  return {
    gw, lastFinishedGW, gwA, sAvg, r3, tRR, tm, pl, plMap, tpl, tH, pM, flagged, fPl, gems, hh, fk, risk,
    dgwTeams, bgwTeams, uf,
    // Season Pulse panels
    glance, defcon, seasonValue, formValue, risers, fallers,
    // Player Intel sub-tabs
    xgiDelta, shotStoppers,
  };
}

// Squad analysis for My Pulse
export function analyzeSquad(picks, data, history, liveGwPts) {
  const { pl, plMap, uf } = data;

  const squad = picks.picks.map((pk) => {
    const p = plMap[pk.element];
    if (!p) return null;
    const composite = +(p.form * 0.4 + p.fR * 3 + p.ppg * 0.3).toFixed(2);
    const status = composite >= 4.5 ? "green" : composite >= 3 ? "amber" : "red";
    const next5 = (uf[p.teamId] || []).slice(0, 5);
    // Per-player GW points from live endpoint
    const lastGwPts = liveGwPts?.[pk.element] ?? null;
    return {
      ...p, multiplier: pk.multiplier, isCaptain: pk.is_captain, isVice: pk.is_vice_captain,
      isBench: pk.position > 11, composite, status, next5, lastGwPts,
    };
  }).filter(Boolean);

  const healthScore = squad.length
    ? Math.round((squad.reduce((a, p) => a + p.composite, 0) / squad.length) * 10)
    : 0;

  // Transfer priority — weakest link (no replacement suggestion)
  const starters = squad.filter((p) => !p.isBench);
  const weakest = starters.length ? starters.reduce((a, b) => (a.composite < b.composite ? a : b)) : null;

  // Best XI — valid formation (1GK, 3+ DEF, 2+ MID, 1+ FWD)
  const sorted = [...squad].sort((a, b) => b.composite - a.composite);
  const byPos = { 1: [], 2: [], 3: [], 4: [] };
  sorted.forEach((p) => byPos[p.pos]?.push(p));
  const bestGK = byPos[1][0];
  const bestDEF = byPos[2].slice(0, 3);
  const bestFWD = byPos[4].slice(0, 1);
  const remaining = sorted.filter((p) => p !== bestGK && !bestDEF.includes(p) && !bestFWD.includes(p));
  const fill = remaining.slice(0, 11 - 1 - 3 - 1);
  const validXI = bestGK ? [bestGK, ...bestDEF, ...fill, ...bestFWD] : sorted.slice(0, 11);

  // Captain pick
  const capPick = validXI.length ? validXI.reduce((a, b) => (a.composite > b.composite ? a : b)) : null;
  const vicePick = validXI.length > 1
    ? validXI.filter((p) => p !== capPick).reduce((a, b) => (a.composite > b.composite ? a : b))
    : null;

  // Chip strategy — check which chips are still available
  // 2025/26 season: every chip is available TWICE — once for GW1-18, once for GW19+
  const allChipNames = ["wildcard", "freehit", "bboost", "3xc"];
  const usedChipsList = history?.chips || [];
  const chipsLeft = {};
  allChipNames.forEach((c) => {
    const usedFirst = usedChipsList.some((u) => u.name === c && u.event <= 18);
    const usedSecond = usedChipsList.some((u) => u.name === c && u.event >= 19);
    // We're in GW19+ territory now, so only the second-half chip matters
    chipsLeft[c] = !usedSecond;
  });

  const chips = {
    available: chipsLeft,
    benchBoost: null,
    tripleCaptain: null,
    freeHit: null,
    wildcard: chipsLeft.wildcard && squad.filter((p) => p.status === "red").length >= 4,
  };

  // Only suggest chip timing for chips that are still available
  const upcomingGWs = [...new Set(Object.values(uf).flat().map((f) => f.gw))].sort();
  if (upcomingGWs.length) {
    let bestBBgw = upcomingGWs[0], bestBBscore = 0;
    let bestTCgw = upcomingGWs[0], bestTCscore = 0;
    let worstFHgw = upcomingGWs[0], worstFHscore = Infinity;

    upcomingGWs.slice(0, 6).forEach((gwNum) => {
      const squadFDR = squad.reduce((sum, p) => {
        const teamFix = uf[p.teamId]?.find((f) => f.gw === gwNum);
        return sum + (teamFix ? 6 - teamFix.fdr : 3);
      }, 0);
      if (squadFDR > bestBBscore) { bestBBscore = squadFDR; bestBBgw = gwNum; }
      if (squadFDR < worstFHscore) { worstFHscore = squadFDR; worstFHgw = gwNum; }

      const capFDR = capPick ? (uf[capPick.teamId]?.find((f) => f.gw === gwNum)?.fdr || 3) : 3;
      const tcScore = capPick ? (capPick.form * (6 - capFDR)) : 0;
      if (tcScore > bestTCscore) { bestTCscore = tcScore; bestTCgw = gwNum; }
    });

    if (chipsLeft.bboost) chips.benchBoost = bestBBgw;
    if (chipsLeft["3xc"]) chips.tripleCaptain = bestTCgw;
    if (chipsLeft.freehit) chips.freeHit = worstFHgw;
  }

  // Rank history for chart
  const rankHistory = (history?.current || []).map((h) => ({
    gw: h.event,
    rank: h.overall_rank,
    pts: h.points,
    total: h.total_points,
  }));

  return { squad, healthScore, weakest, bestXI: validXI, capPick, vicePick, chips, rankHistory };
}
