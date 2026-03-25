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
  const teamXG = {};
  const teamXGC = {};
  d.teams.forEach((t) => { teamXG[t.id] = { xg: 0, mins: 0 }; teamXGC[t.id] = { xgc: 0, mins: 0 }; });
  d.elements.forEach((p) => {
    const m = p.minutes || 0;
    if (m < 90) return;
    const xg = parseFloat(p.expected_goals) || 0;
    const xgc = parseFloat(p.expected_goals_conceded) || 0;
    teamXG[p.team].xg += xg;
    teamXG[p.team].mins += m;
    teamXGC[p.team].xgc += xgc;
    teamXGC[p.team].mins += m;
  });
  const teamXGper90 = {};
  const teamXGCper90 = {};
  d.teams.forEach((t) => {
    teamXGper90[t.id] = teamXG[t.id].mins > 0 ? (teamXG[t.id].xg / teamXG[t.id].mins) * 90 : 1.2;
    teamXGCper90[t.id] = teamXGC[t.id].mins > 0 ? (teamXGC[t.id].xgc / teamXGC[t.id].mins) * 90 * 11 : 1.2;
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
  // Uses the real FPL API field: defensive_contribution (max 2 pts/game for hitting tackle/block/interception thresholds)
  const defcon = pl
    .filter((p) => p.mins >= 1500 && p.defCon > 0)
    .map((p) => {
      const csRate = p.apps > 0 ? +(p.cs / p.apps).toFixed(2) : 0;
      return { ...p, csRate };
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

  return {
    gw, lastFinishedGW, gwA, sAvg, r3, tRR, tm, pl, plMap, tpl, tH, pM, flagged, fPl, gems, hh, fk, risk,
    dgwTeams, bgwTeams, uf,
    // Season Pulse panels
    glance, defcon, seasonValue, formValue, risers, fallers,
  };
}

// Squad analysis for My Pulse
export function analyzeSquad(picks, data) {
  const { pl, plMap, uf, tRR } = data;
  const squad = picks.picks.map((pk) => {
    const p = plMap[pk.element];
    if (!p) return null;
    const composite = +(p.form * 0.4 + p.fR * 3 + p.ppg * 0.3).toFixed(2);
    const status = composite >= 4.5 ? "green" : composite >= 3 ? "amber" : "red";
    return { ...p, multiplier: pk.multiplier, isCaptain: pk.is_captain, isVice: pk.is_vice_captain, isBench: pk.position > 11, composite, status };
  }).filter(Boolean);

  const healthScore = squad.length
    ? Math.round((squad.reduce((a, p) => a + p.composite, 0) / squad.length) * 10)
    : 0;

  // Transfer priority — weakest link
  const starters = squad.filter((p) => !p.isBench);
  const weakest = starters.length ? starters.reduce((a, b) => (a.composite < b.composite ? a : b)) : null;

  // Find replacement for weakest link
  let replacement = null;
  if (weakest) {
    const budget = +weakest.price + 0.5;
    replacement = pl
      .filter((p) => p.pos === weakest.pos && +p.price <= budget && p.fScore > weakest.fScore && !squad.some((s) => s.id === p.id))
      .sort((a, b) => b.fScore - a.fScore)[0] || null;
  }

  // Best XI — sort by composite, pick best formation
  const sorted = [...squad].sort((a, b) => b.composite - a.composite);
  const byPos = { 1: [], 2: [], 3: [], 4: [] };
  sorted.forEach((p) => byPos[p.pos]?.push(p));
  const bestXI = [
    ...byPos[1].slice(0, 1),
    ...byPos[2].slice(0, Math.min(byPos[2].length, 5)),
    ...byPos[3].slice(0, Math.min(byPos[3].length, 5)),
    ...byPos[4].slice(0, Math.min(byPos[4].length, 3)),
  ].slice(0, 11);
  // Ensure valid formation (at least 1GK, 3DEF, 2MID, 1FWD)
  const bestGK = byPos[1][0];
  const bestDEF = byPos[2].slice(0, 3);
  const bestFWD = byPos[4].slice(0, 1);
  const remaining = sorted.filter((p) => p !== bestGK && !bestDEF.includes(p) && !bestFWD.includes(p));
  const fill = remaining.slice(0, 11 - 1 - 3 - 1);
  const validXI = bestGK ? [bestGK, ...bestDEF, ...fill, ...bestFWD] : bestXI;

  // Captain pick — highest composite in XI
  const capPick = validXI.length ? validXI.reduce((a, b) => (a.composite > b.composite ? a : b)) : null;
  const vicePick = validXI.length > 1
    ? validXI.filter((p) => p !== capPick).reduce((a, b) => (a.composite > b.composite ? a : b))
    : null;

  // Chip strategy
  const chips = {
    benchBoost: null,
    tripleCaptain: null,
    freeHit: null,
    wildcard: squad.filter((p) => p.status === "red").length >= 4,
  };

  // Find best GW for bench boost (highest total floor across 15)
  const upcomingGWs = [...new Set(Object.values(uf).flat().map((f) => f.gw))].sort();
  if (upcomingGWs.length) {
    let bestBBgw = upcomingGWs[0];
    let bestBBscore = 0;
    let bestTCgw = upcomingGWs[0];
    let bestTCscore = 0;
    let worstFHgw = upcomingGWs[0];
    let worstFHscore = Infinity;

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

    chips.benchBoost = bestBBgw;
    chips.tripleCaptain = bestTCgw;
    chips.freeHit = worstFHgw;
  }

  return { squad, healthScore, weakest, replacement, bestXI: validXI, capPick, vicePick, chips };
}
