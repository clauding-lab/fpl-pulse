const DARK = {
  bg: "#0a0e17",
  surface: "#131a2b",
  border: "#1e2a42",
  text: "#e8edf5",
  textSecondary: "#8892a5",
  textMuted: "#4a5568",
  green: "#00ff87",
  red: "#ff2882",
  amber: "#e8a50a",
  blue: "#38bdf8",
  fdr1: "#00ff87",
  fdr2: "#4ade80",
  fdr3: "#e8a50a",
  fdr4: "#f87171",
  fdr5: "#ff2882",
};

const LIGHT_OVERRIDES = {
  bg: "#f8fafc",
  surface: "#ffffff",
  border: "#e2e8f0",
  text: "#0f172a",
  textSecondary: "#64748b",
  textMuted: "#94a3b8",
};

// Mutable COLORS object — toggled by setThemeMode()
export const COLORS = { ...DARK };

export function setThemeMode(isDark) {
  const src = isDark ? DARK : { ...DARK, ...LIGHT_OVERRIDES };
  Object.assign(COLORS, src);
}

export const FDR_COLORS = {
  1: COLORS.fdr1,
  2: COLORS.fdr2,
  3: COLORS.fdr3,
  4: COLORS.fdr4,
  5: COLORS.fdr5,
};

export const FDR_TEXT = {
  1: "#0a0e17",
  2: "#0a0e17",
  3: "#0a0e17",
  4: "#fff",
  5: "#fff",
};

export const POS_MAP = { 1: "GK", 2: "DEF", 3: "MID", 4: "FWD" };

export const POS_COLORS = {
  1: "#e8a50a",
  2: "#4ade80",
  3: "#38bdf8",
  4: "#ff2882",
};
