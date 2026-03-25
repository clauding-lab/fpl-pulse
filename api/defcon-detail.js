// Vercel Serverless Function — fetches per-game defensive contribution for top players
// Calculates actual FPL points earned from DefCon (2 or 0 per game based on threshold)
// DEF/GK threshold: 10 CBIT, MID/FWD threshold: 12 CBIRT

const FPL_BASE = "https://fantasy.premierleague.com/api";

async function fetchJSON(url) {
  const r = await fetch(url, { headers: { "User-Agent": "FPL-Pulse/1.0" } });
  if (!r.ok) throw new Error(`FPL API ${r.status}: ${url}`);
  return r.json();
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=1800");

  try {
    const playerIds = (req.query.ids || "").split(",").filter(Boolean).map(Number);
    if (!playerIds.length || playerIds.length > 30) {
      return res.status(400).json({ error: "Provide 1-30 comma-separated player IDs via ?ids=" });
    }

    // Fetch bootstrap to get element_type (position) for each player
    const bootstrap = await fetchJSON(`${FPL_BASE}/bootstrap-static/`);
    const elementMap = {};
    bootstrap.elements.forEach((e) => { elementMap[e.id] = e; });

    // Fetch element-summary for each player in parallel (batches of 10)
    const results = [];
    for (let i = 0; i < playerIds.length; i += 10) {
      const batch = playerIds.slice(i, i + 10);
      const summaries = await Promise.all(
        batch.map((id) => fetchJSON(`${FPL_BASE}/element-summary/${id}/`).catch(() => null))
      );
      for (let j = 0; j < batch.length; j++) {
        const id = batch[j];
        const el = elementMap[id];
        const summary = summaries[j];
        if (!el || !summary) continue;

        const pos = el.element_type; // 1=GK, 2=DEF, 3=MID, 4=FWD
        const threshold = (pos === 1 || pos === 2) ? 10 : 12;

        let dcFplPts = 0;
        let gamesHit = 0;
        let gamesPlayed = 0;
        const perGw = [];

        for (const gw of summary.history) {
          if (gw.minutes === 0) continue;
          gamesPlayed++;
          const dc = gw.defensive_contribution || 0;
          const earned = dc >= threshold ? 2 : 0;
          if (earned > 0) gamesHit++;
          dcFplPts += earned;
          perGw.push({ gw: gw.round, dc, earned });
        }

        results.push({
          id,
          name: el.web_name,
          pos,
          dcFplPts,
          gamesHit,
          gamesPlayed,
          hitRate: gamesPlayed > 0 ? +(gamesHit / gamesPlayed * 100).toFixed(0) : 0,
          threshold,
          perGw,
        });
      }
    }

    res.status(200).json({ players: results });
  } catch (err) {
    console.error("defcon-detail error:", err);
    res.status(500).json({ error: err.message });
  }
}
