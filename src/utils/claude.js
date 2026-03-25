// Claude API client — calls our Vercel serverless proxy at /api/claude
// Responses are cached per GW to avoid unnecessary API calls.

const cache = {};

function cacheKey(type, id) {
  return `${type}:${id}`;
}

export async function fetchClaudeInsight(type, prompt, cacheId) {
  const key = cacheKey(type, cacheId);
  if (cache[key]) return cache[key];

  try {
    const res = await fetch("/api/claude", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, prompt }),
    });

    if (!res.ok) {
      console.warn("Claude API returned", res.status);
      return null;
    }

    const data = await res.json();
    if (data.text) {
      cache[key] = data.text;
      return data.text;
    }
    return null;
  } catch (err) {
    console.warn("Claude API fetch failed:", err);
    return null;
  }
}

// Build the Pulse Summary prompt from GW data
export function buildPulseSummaryPrompt(data) {
  const { gw, sAvg, r3, tH, flagged, dgwTeams, bgwTeams, pM, tRR } = data;
  const hasDGW = Object.keys(dgwTeams).some((g) => +g === gw);
  const hasBGW = Object.keys(bgwTeams).some((g) => +g === gw);
  const specialInfo = hasDGW ? `DGW${gw}: ${dgwTeams[gw]?.join(", ")}` : hasBGW ? `BGW${gw}: ${bgwTeams[gw]?.join(", ")} blank` : "Standard GW";
  const hotPos = pM.reduce((a, b) => (+a.v > +b.v ? a : b));
  const topSwing = tRR.filter((t) => t.swing > 0.3).slice(0, 3).map((t) => t.short_name).join(", ") || "None";

  return `You are an FPL briefing writer. Given this gameweek environment data, write exactly 3 sentences. Sentence 1: the overall state of play. Sentence 2: the key risk or opportunity this week. Sentence 3: one actionable implication for managers.

GW: ${gw}
Avg GW score (last 3): ${r3.toFixed(1)}
Season avg: ${sAvg.toFixed(1)}
Template health score: ${tH.toFixed(1)}/10
Flagged premiums (>10% owned, <75% chance): ${flagged.length > 0 ? flagged.map((p) => p.name).join(", ") : "None"}
DGW/BGW: ${specialInfo}
Top fixture swing teams: ${topSwing}
Position trending up: ${hotPos.label} (${hotPos.v} pts/£m)`;
}

// Build a Scouting Note prompt for a Hidden Gem player
export function buildScoutingNotePrompt(player) {
  const xGGap = (player.xG - player.goals).toFixed(1);
  const xAGap = (player.xA - player.assists).toFixed(1);

  return `You are an FPL analyst writing for experienced managers. Given these stats, write exactly 2 sentences. Sentence 1: what the numbers say. Sentence 2: what most managers are missing.

Player: ${player.name}, ${player.posL}, ${player.teamName}
Form (last 5 avg): ${player.form}
xGI per 90 (last 5): ${player.xGI90}
Goals vs xG: ${player.goals} actual / ${player.xG.toFixed(1)} expected (gap: ${xGGap})
Assists vs xA: ${player.assists} actual / ${player.xA.toFixed(1)} expected (gap: ${xAGap})
Upcoming FDR (next 4): ${player.aFDR.toFixed(1)}
Ownership: ${player.own}%
Season points: ${player.pts}
Price: £${player.price}m`;
}
