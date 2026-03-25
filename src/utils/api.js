const CORS_PROXY = "https://corsproxy.io/?url=";
const BASE = "https://fantasy.premierleague.com/api";

const summaryCache = {};

export async function fetchPlayerSummary(playerId) {
  if (summaryCache[playerId]) return summaryCache[playerId];
  try {
    const r = await fetch(`${CORS_PROXY}${encodeURIComponent(`${BASE}/element-summary/${playerId}/`)}`);
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
    const [picksR, entryR] = await Promise.all([
      fetch(`${CORS_PROXY}${encodeURIComponent(`${BASE}/entry/${teamId}/event/${gw}/picks/`)}`),
      fetch(`${CORS_PROXY}${encodeURIComponent(`${BASE}/entry/${teamId}/`)}`),
    ]);
    if (!picksR.ok || !entryR.ok) throw new Error();
    return { picks: await picksR.json(), entry: await entryR.json() };
  } catch {
    return null;
  }
}

export function playerPhotoUrl(code) {
  return `https://resources.premierleague.com/premierleague/photos/players/110x140/p${code}.png`;
}
