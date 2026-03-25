import { useState, useEffect, useRef } from "react";
import { fetchPlayerSummary } from "../utils/api";

/**
 * Fetches element-summary for a list of player IDs (batched, throttled).
 * Returns a map of playerId -> last 8 GW points array.
 */
export function usePlayerHistory(playerIds) {
  const [history, setHistory] = useState({});
  const fetched = useRef(new Set());

  useEffect(() => {
    if (!playerIds || playerIds.length === 0) return;
    let cancelled = false;

    const fetchBatch = async () => {
      const toFetch = playerIds.filter((id) => !fetched.current.has(id)).slice(0, 20);
      for (const id of toFetch) {
        if (cancelled) break;
        try {
          const data = await fetchPlayerSummary(id);
          if (data && data.history) {
            const last8 = data.history.slice(-8).map((gw) => gw.total_points);
            fetched.current.add(id);
            setHistory((prev) => ({ ...prev, [id]: last8 }));
          }
        } catch {
          // skip failed fetches
        }
        // Throttle: 150ms between requests to avoid rate limiting
        await new Promise((r) => setTimeout(r, 150));
      }
    };

    fetchBatch();
    return () => { cancelled = true; };
  }, [playerIds.join(",")]);

  return history;
}
