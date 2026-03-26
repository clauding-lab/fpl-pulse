// Vercel Serverless Function — Fixture-Proof players
// For the top 80 players by total_points, fetches per-GW history and
// splits returns into easy (FDR <= 2) vs hard (FDR >= 4) fixtures.
// Returns players with >= 5 hard games, sorted by hard/easy ratio descending.

const FPL = "https://fantasy.premierleague.com/api";
const UA = { "User-Agent": "FPL-Pulse/1.0" };
const TOP_N = 80;
const BATCH = 10;
const BATCH_DELAY = 200; // ms between batches

async function fetchJSON(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const r = await fetch(url, { headers: UA, signal: controller.signal });
    if (!r.ok) return null;
    return r.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    // 1. Fetch bootstrap-static and fixtures in parallel
    const [boot, fixtures] = await Promise.all([
      fetchJSON(`${FPL}/bootstrap-static/`),
      fetchJSON(`${FPL}/fixtures/`),
    ]);

    if (!boot) return res.status(502).json({ error: "Failed to fetch bootstrap" });
    if (!fixtures) return res.status(502).json({ error: "Failed to fetch fixtures" });

    // Build lookups
    const teamMap = {};
    boot.teams.forEach((t) => (teamMap[t.id] = t.short_name));
    const posMap = { 1: "GK", 2: "DEF", 3: "MID", 4: "FWD" };

    // Build fixture difficulty lookup: fixtureId -> { home_team, away_team, home_diff, away_diff }
    const fixtureLookup = {};
    fixtures.forEach((f) => {
      fixtureLookup[f.id] = {
        home_team: f.team_h,
        away_team: f.team_a,
        home_diff: f.team_h_difficulty,
        away_diff: f.team_a_difficulty,
      };
    });

    // Count remaining hard fixtures per team (unfinished fixtures with FDR >= 4)
    const remainingHardByTeam = {};
    boot.teams.forEach((t) => (remainingHardByTeam[t.id] = 0));
    fixtures.forEach((f) => {
      if (f.finished || f.finished_provisional) return;
      if (f.team_h_difficulty >= 4) remainingHardByTeam[f.team_h] = (remainingHardByTeam[f.team_h] || 0) + 1;
      if (f.team_a_difficulty >= 4) remainingHardByTeam[f.team_a] = (remainingHardByTeam[f.team_a] || 0) + 1;
    });

    // 2. Get top 80 players by total_points
    const topPlayers = [...boot.elements]
      .sort((a, b) => b.total_points - a.total_points)
      .slice(0, TOP_N);

    // 3. Fetch element-summary for each player (batched, 10 at a time)
    const playerSummaries = new Array(topPlayers.length).fill(null);

    for (let i = 0; i < topPlayers.length; i += BATCH) {
      const batch = topPlayers.slice(i, i + BATCH);
      const results = await Promise.allSettled(
        batch.map((p) => fetchJSON(`${FPL}/element-summary/${p.id}/`))
      );
      results.forEach((r, idx) => {
        if (r.status === "fulfilled" && r.value) {
          playerSummaries[i + idx] = r.value;
        }
      });
      if (i + BATCH < topPlayers.length) {
        await sleep(BATCH_DELAY);
      }
    }

    // 4. For each player, split GW history into easy / hard based on FDR
    const players = [];

    for (let i = 0; i < topPlayers.length; i++) {
      const p = topPlayers[i];
      const summary = playerSummaries[i];
      if (!summary?.history) continue;

      let easyTotal = 0;
      let easyGames = 0;
      let hardTotal = 0;
      let hardGames = 0;

      for (const gw of summary.history) {
        const fix = fixtureLookup[gw.fixture];
        if (!fix) continue;

        // Determine FDR for this player's team in this fixture
        const isHome = gw.was_home;
        const fdr = isHome ? fix.home_diff : fix.away_diff;

        if (fdr <= 2) {
          easyTotal += gw.total_points;
          easyGames++;
        } else if (fdr >= 4) {
          hardTotal += gw.total_points;
          hardGames++;
        }
        // FDR 3 is neutral — excluded from both buckets
      }

      if (hardGames < 5) continue; // filter: need >= 5 hard games

      const easyAvg = easyGames > 0 ? +(easyTotal / easyGames).toFixed(1) : 0;
      const hardAvg = +(hardTotal / hardGames).toFixed(1);
      const ratio = easyAvg > 0 ? +(hardAvg / easyAvg).toFixed(2) : 0;

      players.push({
        id: p.id,
        name: p.web_name,
        pos: posMap[p.element_type] || "?",
        team: teamMap[p.team] || "?",
        price: (p.now_cost / 10).toFixed(1),
        easyAvg,
        hardAvg,
        ratio,
        easyGames,
        hardGames,
        remainingHard: remainingHardByTeam[p.team] || 0,
      });
    }

    // Sort by ratio descending (best performers in hard fixtures relative to easy)
    players.sort((a, b) => b.ratio - a.ratio);

    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=7200");

    return res.status(200).json({
      players,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Fixture-proof error:", err);
    return res.status(502).json({ error: "Failed to compute fixture-proof data" });
  }
}
