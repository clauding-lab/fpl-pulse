const DARK = {
  bg: "#1a1d2e",
  surface: "#222640",
  border: "#2a2e4a",
  text: "#e8edf5",
  textSecondary: "#9ba3b8",
  textMuted: "#5a6178",
  green: "#00e676",
  red: "#ff5252",
  amber: "#ffab00",
  blue: "#448aff",
  fdr1: "#00e676",
  fdr2: "#66bb6a",
  fdr3: "#ffab00",
  fdr4: "#ff5252",
  fdr5: "#d50000",
  // Neumorphism shadows
  shadowRaised: "6px 6px 14px rgba(0,0,0,0.35), -4px -4px 10px rgba(255,255,255,0.04)",
  shadowInset: "inset 3px 3px 6px rgba(0,0,0,0.3), inset -2px -2px 5px rgba(255,255,255,0.03)",
  shadowHover: "4px 4px 10px rgba(0,0,0,0.3), -3px -3px 8px rgba(255,255,255,0.05), 0 0 0 1px rgba(255,255,255,0.04)",
};

const LIGHT_OVERRIDES = {
  bg: "#e8ecf1",
  surface: "#f0f3f8",
  border: "#d4d9e3",
  text: "#1a1d2e",
  textSecondary: "#5a6178",
  textMuted: "#8892a5",
  green: "#00c853",
  red: "#e53935",
  amber: "#ff8f00",
  blue: "#2979ff",
  shadowRaised: "6px 6px 14px rgba(0,0,0,0.08), -4px -4px 10px rgba(255,255,255,0.8)",
  shadowInset: "inset 3px 3px 6px rgba(0,0,0,0.06), inset -2px -2px 5px rgba(255,255,255,0.7)",
  shadowHover: "4px 4px 10px rgba(0,0,0,0.06), -3px -3px 8px rgba(255,255,255,0.9), 0 0 0 1px rgba(0,0,0,0.03)",
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
  1: "#1a1d2e",
  2: "#1a1d2e",
  3: "#1a1d2e",
  4: "#fff",
  5: "#fff",
};

export const POS_MAP = { 1: "GK", 2: "DEF", 3: "MID", 4: "FWD" };

export const POS_COLORS = {
  1: "#ffab00",
  2: "#00e676",
  3: "#448aff",
  4: "#ff5252",
};
