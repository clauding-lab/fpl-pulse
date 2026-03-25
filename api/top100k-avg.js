// Vercel Serverless Function — fetches top managers' per-GW averages
// Samples top 100 managers from the Overall league, fetches each history,
// and returns per-GW average scores for this elite group.

const FPL_BASE = "https://fantasy.premierleague.com/api";

async function fetchJSON(url) {
  const r = await fetch(url, {
    headers: { "User-Agent": "FPLPulse/1.0" },
  });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.json();
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    // Step 1: Fetch top 100 managers from Overall league (2 pages × 50)
    const [page1, page2] = await Promise.all([
      fetchJSON(`${FPL_BASE}/leagues-classic/314/standings/?page_new_entries=1&page_standings=1`),
      fetchJSON(`${FPL_BASE}/leagues-classic/314/standings/?page_new_entries=1&page_standings=2`),
    ]);

    const managers = [
      ...(page1.standings?.results || []),
      ...(page2.standings?.results || []),
    ].slice(0, 100);

    if (!managers.length) {
      return res.status(500).json({ error: "No managers found" });
    }

    // Step 2: Fetch each manager's GW history (batched, 10 at a time)
    const histories = [];
    const batchSize = 10;
    for (let i = 0; i < managers.length; i += batchSize) {
      const batch = managers.slice(i, i + batchSize);
      const results = await Promise.allSettled(
        batch.map((m) => fetchJSON(`${FPL_BASE}/entry/${m.entry}/history/`))
      );
      results.forEach((r) => {
        if (r.status === "fulfilled") histories.push(r.value);
      });
    }

    if (!histories.length) {
      return res.status(500).json({ error: "No history data fetched" });
    }

    // Step 3: Calculate per-GW averages
    const gwTotals = {}; // { gw: { total: N, count: N } }
    histories.forEach((h) => {
      (h.current || []).forEach((gw) => {
        if (!gwTotals[gw.event]) gwTotals[gw.event] = { total: 0, count: 0 };
        gwTotals[gw.event].total += gw.points;
        gwTotals[gw.event].count += 1;
      });
    });

    const gwAvgs = Object.entries(gwTotals)
      .map(([gw, d]) => ({
        gw: parseInt(gw),
        avg: +(d.total / d.count).toFixed(1),
        count: d.count,
      }))
      .sort((a, b) => a.gw - b.gw);

    // Cache for 4 hours
    res.setHeader("Cache-Control", "s-maxage=14400, stale-while-revalidate=3600");
    return res.status(200).json({
      managersScanned: histories.length,
      gwAvgs,
    });
  } catch (err) {
    console.error("Top 100K avg error:", err);
    return res.status(500).json({ error: err.message });
  }
}

export const config = {
  maxDuration: 60,
};
