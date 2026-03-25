import { useState, useEffect, useMemo } from "react";
import { generateMockData } from "../utils/mockData";
import { computeAll } from "../utils/calculations";

// Use our own Vercel serverless proxy — no third-party CORS proxy needed
const FPL_PROXY = "/api/fpl?endpoint=";
const CACHE_KEY = "fpl_pulse_data";
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

function getCached() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) return null;
    return data;
  } catch {
    return null;
  }
}

function setCache(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
  } catch {
    // localStorage full or unavailable
  }
}

export function useFplData() {
  const [apiData, setApiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [usingMock, setUsingMock] = useState(false);

  useEffect(() => {
    (async () => {
      // Check cache first
      const cached = getCached();
      if (cached) {
        setApiData(cached);
        setLoading(false);
        return;
      }

      try {
        const [b, f] = await Promise.all([
          fetch(`${FPL_PROXY}bootstrap-static/`),
          fetch(`${FPL_PROXY}fixtures/`),
        ]);
        if (!b.ok || !f.ok) throw new Error("API fetch failed");
        const data = { bootstrap: await b.json(), fixtures: await f.json(), isMock: false };
        setCache(data);
        setApiData(data);
      } catch {
        setApiData(generateMockData());
        setUsingMock(true);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const computed = useMemo(() => {
    if (!apiData) return null;
    return computeAll(apiData);
  }, [apiData]);

  return { loading, usingMock, data: computed };
}
