// Vercel Serverless Function — Captain Backtest
// For each completed GW, compares the "most-captained" pick (approximated as
// the highest-owned premium MID/FWD with >15% ownership) against the optimal
// captain (the actual highest scorer that GW). Shows points left on the table.

const FPL = "https://fantasy.premierleague.com/api";
const UA = { "User-Agent": "FPL-Pulse/1.0" };
const BATCH = 5;
const BATCH_DELAY = 200; // ms between batches
const OWNERSHIP_THRESHOLD = 15; // minimum % ownership to be considered "most-captained"

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
    // 1. Fetch bootstrap-static
    const boot = await fetchJSON(`${FPL}/bootstrap-static/`);
    if (!boot) return res.status(502).json({ error: "Failed to fetch bootstrap" });

    // Build player lookup
    const playerLookup = {};
    boot.elements.forEach((p) => {
      playerLookup[p.id] = {
        name: p.web_name,
        pos: p.element_type, // 3=MID, 4=FWD
        ownership: parseFloat(p.selected_by_percent) || 0,
      };
    });

    // Identify "most-captained" candidate: highest-owned MID/FWD with ownership > threshold
    // This is a season-level approximation since per-GW captaincy data isn't publicly available.
    const premiumCandidates = boot.elements
      .filter(
        (p) =>
          (p.element_type === 3 || p.element_type === 4) &&
          parseFloat(p.selected_by_percent) > OWNERSHIP_THRESHOLD
      )
      .sort((a, b) => parseFloat(b.selected_by_percent) - parseFloat(a.selected_by_percent));

    const mostCaptainedId = premiumCandidates.length > 0 ? premiumCandidates[0].id : null;
    const mostCaptainedName = mostCaptainedId ? playerLookup[mostCaptainedId].name : "Unknown";

    // 2. Get completed GWs
    const completedGWs = boot.events.filter((e) => e.finished);

    if (completedGWs.length === 0) {
      return res.status(200).json({
        gameweeks: [],
        totalLeft: 0,
        totalOptimal: 0,
        totalCrowd: 0,
        updatedAt: new Date().toISOString(),
      });
    }

    // 3. Fetch live data for all completed GWs (batched, 5 at a time)
    const gwLiveData = new Array(completedGWs.length).fill(null);

    for (let i = 0; i < completedGWs.length; i += BATCH) {
      const batch = completedGWs.slice(i, i + BATCH);
      const results = await Promise.allSettled(
        batch.map((e) => fetchJSON(`${FPL}/event/${e.id}/live/`))
      );
      results.forEach((r, idx) => {
        if (r.status === "fulfilled" && r.value) {
          gwLiveData[i + idx] = r.value;
        }
      });
      if (i + BATCH < completedGWs.length) {
        await sleep(BATCH_DELAY);
      }
    }

    // 4. For each GW, find optimal captain and most-captained score
    const gameweeks = [];
    let totalOptimal = 0;
    let totalCrowd = 0;

    for (let i = 0; i < completedGWs.length; i++) {
      const gw = completedGWs[i];
      const live = gwLiveData[i];
      if (!live?.elements) continue;

      // Find the highest scorer this GW (optimal captain)
      let bestId = null;
      let bestPts = -1;

      for (const el of live.elements) {
        const pts = el.stats?.total_points ?? 0;
        if (pts > bestPts) {
          bestPts = pts;
          bestId = el.id;
        }
      }

      const optimalName = bestId && playerLookup[bestId] ? playerLookup[bestId].name : "Unknown";

      // Find the most-captained player's score this GW
      let crowdPts = 0;
      if (mostCaptainedId) {
        const crowdEl = live.elements.find((el) => el.id === mostCaptainedId);
        crowdPts = crowdEl?.stats?.total_points ?? 0;
      }

      const optDoubled = bestPts * 2;
      const crowdDoubled = crowdPts * 2;
      const leftOnTable = optDoubled - crowdDoubled;

      totalOptimal += optDoubled;
      totalCrowd += crowdDoubled;

      gameweeks.push({
        gw: gw.id,
        mostCaptained: {
          name: mostCaptainedName,
          pts: crowdPts,
          doubled: crowdDoubled,
        },
        optimal: {
          name: optimalName,
          pts: bestPts,
          doubled: optDoubled,
        },
        leftOnTable,
      });
    }

    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=7200");

    return res.status(200).json({
      gameweeks,
      totalLeft: totalOptimal - totalCrowd,
      totalOptimal,
      totalCrowd,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Captain backtest error:", err);
    return res.status(502).json({ error: "Failed to compute captain backtest data" });
  }
}
