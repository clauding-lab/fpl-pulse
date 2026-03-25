// Vercel Serverless Function — aggregates Top 1K manager picks
// Fetches standings from the Overall league, then each manager's picks
// Returns ownership % for Top 1K vs overall (from bootstrap-static)
//
// Called on-demand from the frontend, cached aggressively on Vercel CDN.
// ~20 pages of standings (50 each) + ~1000 picks calls = ~1020 fetches
// Vercel serverless has 60s max on hobby — we fetch top 500 to stay safe.

const FPL = "https://fantasy.premierleague.com/api";
const UA = { "User-Agent": "FPL-Pulse/1.0" };
const MANAGER_COUNT = 500; // top 500 managers (10 pages × 50)
const PAGES = Math.ceil(MANAGER_COUNT / 50);
const BATCH = 25; // concurrent picks fetches

async function fetchJSON(url) {
  const r = await fetch(url, { headers: UA });
  if (!r.ok) return null;
  return r.json();
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    // 1. Get current GW from bootstrap-static
    const boot = await fetchJSON(`${FPL}/bootstrap-static/`);
    if (!boot) return res.status(502).json({ error: "Failed to fetch bootstrap" });

    const currentGW = boot.events.find((e) => e.is_current);
    const gw = currentGW?.id;
    if (!gw) return res.status(404).json({ error: "No current GW found" });

    // Build player lookup: id -> { name, team, pos, overall_own }
    const teamMap = {};
    boot.teams.forEach((t) => (teamMap[t.id] = t.short_name));
    const posMap = { 1: "GK", 2: "DEF", 3: "MID", 4: "FWD" };

    const playerLookup = {};
    boot.elements.forEach((p) => {
      playerLookup[p.id] = {
        id: p.id,
        name: p.web_name,
        team: teamMap[p.team] || "?",
        pos: posMap[p.element_type] || "?",
        posN: p.element_type,
        price: (p.now_cost / 10).toFixed(1),
        overall_own: parseFloat(p.selected_by_percent) || 0,
        form: parseFloat(p.form) || 0,
        pts: p.total_points,
      };
    });

    // 2. Get top manager IDs from Overall league (league 314)
    const managerIds = [];
    for (let page = 1; page <= PAGES; page++) {
      const data = await fetchJSON(`${FPL}/leagues-classic/314/standings/?page_standings=${page}`);
      if (!data?.standings?.results) break;
      data.standings.results.forEach((r) => managerIds.push(r.entry));
      if (data.standings.results.length < 50) break;
    }

    if (managerIds.length === 0) {
      return res.status(404).json({ error: "No managers found in standings" });
    }

    // 3. Fetch each manager's picks for this GW (batched)
    const pickCounts = {}; // player_id -> count of managers who own them
    let successCount = 0;

    for (let i = 0; i < managerIds.length; i += BATCH) {
      const batch = managerIds.slice(i, i + BATCH);
      const results = await Promise.allSettled(
        batch.map((id) => fetchJSON(`${FPL}/entry/${id}/event/${gw}/picks/`))
      );
      results.forEach((r) => {
        if (r.status === "fulfilled" && r.value?.picks) {
          successCount++;
          r.value.picks.forEach((pick) => {
            pickCounts[pick.element] = (pickCounts[pick.element] || 0) + 1;
          });
        }
      });
    }

    if (successCount === 0) {
      return res.status(502).json({ error: "Failed to fetch any manager picks" });
    }

    // 4. Calculate top-N ownership and find gaps
    const players = Object.entries(pickCounts).map(([id, count]) => {
      const p = playerLookup[+id];
      if (!p) return null;
      const topOwn = +((count / successCount) * 100).toFixed(1);
      return {
        ...p,
        top_own: topOwn,
        gap: +(topOwn - p.overall_own).toFixed(1),
      };
    }).filter(Boolean);

    // Smart Money Buys: players elite managers own MORE than the field
    const smartBuys = [...players]
      .filter((p) => p.gap > 2 && p.top_own > 10)
      .sort((a, b) => b.gap - a.gap)
      .slice(0, 10);

    // Casual Traps: players the field owns MORE than elite managers
    const casualTraps = [...players]
      .filter((p) => p.gap < -2 && p.overall_own > 10)
      .sort((a, b) => a.gap - b.gap)
      .slice(0, 10);

    // Cache for 2 hours on Vercel CDN (this data doesn't change often within a GW)
    res.setHeader("Cache-Control", "s-maxage=7200, stale-while-revalidate=14400");

    return res.status(200).json({
      gw,
      managersScanned: successCount,
      totalManagers: managerIds.length,
      smartBuys,
      casualTraps,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Smart money error:", err);
    return res.status(502).json({ error: "Failed to aggregate smart money data" });
  }
}
