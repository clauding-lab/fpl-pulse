// Vercel Serverless Function — proxies FPL API requests to bypass CORS
// No third-party CORS proxy needed — this runs server-side on Vercel.

export default async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { endpoint } = req.query;

  if (!endpoint) {
    return res.status(400).json({ error: "Missing endpoint parameter" });
  }

  // Whitelist allowed FPL API endpoints
  const allowed = [
    "bootstrap-static/",
    "fixtures/",
  ];
  const isAllowed = allowed.some((a) => endpoint === a) ||
    /^element-summary\/\d+\/$/.test(endpoint) ||
    /^entry\/\d+\/event\/\d+\/picks\/$/.test(endpoint) ||
    /^entry\/\d+\/$/.test(endpoint) ||
    /^leagues-classic\/\d+\/standings\//.test(endpoint);

  if (!isAllowed) {
    return res.status(403).json({ error: "Endpoint not allowed" });
  }

  try {
    const url = `https://fantasy.premierleague.com/api/${endpoint}`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "FPL-Pulse/1.0",
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `FPL API returned ${response.status}` });
    }

    const data = await response.json();

    // Cache for 30 minutes on Vercel's CDN
    res.setHeader("Cache-Control", "s-maxage=1800, stale-while-revalidate=3600");

    return res.status(200).json(data);
  } catch (err) {
    console.error("FPL proxy error:", err);
    return res.status(502).json({ error: "Failed to fetch from FPL API" });
  }
}
