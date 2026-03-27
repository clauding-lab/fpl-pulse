// Use our own Vercel serverless proxy — no third-party CORS proxy needed
const FPL_PROXY = "/api/fpl?endpoint=";

const summaryCache = {};

export async function fetchPlayerSummary(playerId) {
  if (summaryCache[playerId]) return summaryCache[playerId];
  try {
    const r = await fetch(`${FPL_PROXY}element-summary/${playerId}/`);
    if (!r.ok) throw new Error();
    const data = await r.json();
    summaryCache[playerId] = data;
    return data;
  } catch {
    return null;
  }
}

export async function fetchSquad(teamId, gw) {
  try {
    const [picksR, entryR, historyR, liveR] = await Promise.all([
      fetch(`${FPL_PROXY}entry/${teamId}/event/${gw}/picks/`),
      fetch(`${FPL_PROXY}entry/${teamId}/`),
      fetch(`${FPL_PROXY}entry/${teamId}/history/`),
      fetch(`${FPL_PROXY}event/${gw}/live/`),
    ]);
    if (!picksR.ok || !entryR.ok) throw new Error();
    const history = historyR.ok ? await historyR.json() : null;
    // Build per-player GW points map from live data
    const liveGwPts = {};
    if (liveR.ok) {
      const liveData = await liveR.json();
      (liveData.elements || []).forEach((el) => { liveGwPts[el.id] = el.stats?.total_points ?? null; });
    }
    return { picks: await picksR.json(), entry: await entryR.json(), history, liveGwPts };
  } catch {
    return null;
  }
}

export function playerPhotoUrl(code) {
  return `https://resources.premierleague.com/premierleague/photos/players/110x140/p${code}.png`;
}
