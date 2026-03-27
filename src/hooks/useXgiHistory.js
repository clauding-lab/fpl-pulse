import { useState, useEffect, useRef } from "react";
import { fetchPlayerSummary } from "../utils/api";

/**
 * Fetches element-summary for a list of player IDs and returns
 * the full GW-by-GW history (expected_goals, expected_assists, minutes, etc.)
 */
export function useXgiHistory(playerIds) {
  const [historyMap, setHistoryMap] = useState({});
  const fetched = useRef(new Set());

  useEffect(() => {
    if (!playerIds || playerIds.length === 0) return;
    let cancelled = false;

    const fetchBatch = async () => {
      const toFetch = playerIds.filter((id) => !fetched.current.has(id));
      for (const id of toFetch) {
        if (cancelled) break;
        try {
          const res = await fetchPlayerSummary(id);
          if (res && res.history) {
            fetched.current.add(id);
            setHistoryMap((prev) => ({ ...prev, [id]: res.history }));
          }
        } catch {
          // skip failed fetches silently
        }
        await new Promise((r) => setTimeout(r, 150));
      }
    };

    fetchBatch();
    return () => { cancelled = true; };
  }, [playerIds.join(",")]);

  return historyMap;
}
