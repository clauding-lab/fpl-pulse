import { useState } from "react";
import { COLORS } from "../utils/theme";

export function Card({ children, style = {}, inset = false }) {
  return (
    <div
      style={{
        background: COLORS.surface,
        borderRadius: 16,
        padding: 20,
        boxShadow: inset ? COLORS.shadowInset : COLORS.shadowRaised,
        border: "none",
        transition: "box-shadow 0.2s",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function StatCard({ label, value, sub, color = COLORS.text }) {
  return (
    <div
      style={{
        textAlign: "center", flex: "1 1 130px", minWidth: 110,
        background: COLORS.surface, borderRadius: 14, padding: "16px 12px",
        boxShadow: COLORS.shadowInset,
      }}
    >
      <div style={{ fontSize: 9, color: COLORS.textSecondary, letterSpacing: 1.5, marginBottom: 6, fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color, letterSpacing: -1 }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: COLORS.textSecondary, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

export function TabBtn({ active, label, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? COLORS.surface : "transparent",
        color: active ? COLORS.green : COLORS.textSecondary,
        border: "none",
        borderRadius: 10,
        padding: "8px 18px",
        fontSize: 13,
        fontWeight: active ? 700 : 500,
        cursor: "pointer",
        whiteSpace: "nowrap",
        boxShadow: active ? COLORS.shadowRaised : "none",
        transition: "all 0.2s",
      }}
    >
      {label}
    </button>
  );
}

export function SubBtn({ active, label, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? `${COLORS.green}12` : "transparent",
        color: active ? COLORS.green : COLORS.textSecondary,
        border: "none",
        borderBottom: active ? `2px solid ${COLORS.green}` : "2px solid transparent",
        padding: "8px 16px",
        fontSize: 12,
        fontWeight: active ? 600 : 400,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

// Extract a sortable numeric value from a rendered cell
function extractSortValue(player, col) {
  if (col.sortKey) return col.sortKey(player);
  const rendered = col.render(player, 0);
  if (typeof rendered === "number") return rendered;
  if (typeof rendered === "string") {
    const n = parseFloat(rendered.replace(/[^0-9.\-]/g, ""));
    if (!isNaN(n)) return n;
    return rendered.toLowerCase();
  }
  // Try to extract from React element's children
  if (rendered?.props?.children !== undefined) {
    const c = rendered.props.children;
    if (typeof c === "number") return c;
    if (typeof c === "string") {
      const n = parseFloat(c.replace(/[^0-9.\-]/g, ""));
      return isNaN(n) ? c.toLowerCase() : n;
    }
  }
  return 0;
}

export function PlayerTable({ players, columns }) {
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState("desc");

  const handleSort = (colIdx) => {
    if (colIdx === sortCol) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortCol(colIdx);
      setSortDir("desc");
    }
  };

  const sorted = sortCol !== null
    ? [...players].sort((a, b) => {
        const va = extractSortValue(a, columns[sortCol]);
        const vb = extractSortValue(b, columns[sortCol]);
        const cmp = typeof va === "string" ? va.localeCompare(vb) : va - vb;
        return sortDir === "desc" ? -cmp : cmp;
      })
    : players;

  return (
    <div style={{ overflowX: "auto", borderRadius: 14, boxShadow: COLORS.shadowInset }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr style={{ background: "transparent" }}>
            {columns.map((c, i) => {
              const isActive = sortCol === i;
              const arrow = isActive ? (sortDir === "desc" ? " ▼" : " ▲") : "";
              return (
                <th
                  key={i}
                  onClick={() => handleSort(i)}
                  title={c.title || `Sort by ${c.header}`}
                  style={{
                    padding: "10px 6px",
                    textAlign: i <= 1 ? "left" : "center",
                    color: isActive ? COLORS.green : COLORS.textSecondary,
                    fontWeight: 600,
                    fontSize: 10,
                    whiteSpace: "nowrap",
                    cursor: "pointer",
                    userSelect: "none",
                    transition: "color 0.15s",
                  }}
                >
                  {c.header}{arrow}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.map((p, idx) => (
            <tr
              key={p.id ?? idx}
              style={{
                borderTop: `1px solid ${COLORS.border}20`,
                background: idx % 2 ? `${COLORS.bg}40` : "transparent",
              }}
            >
              {columns.map((c, i) => (
                <td
                  key={i}
                  style={{
                    padding: "8px 6px",
                    textAlign: i <= 1 ? "left" : "center",
                    ...c.style?.(p),
                  }}
                >
                  {/* Re-render rank column based on sorted position */}
                  {c.header === "#" ? idx + 1 : c.render(p, idx)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function InteractiveBarChart({ data, labelKey, valueKey, avgLine, height = 100, colorFn, formatLabel, formatValue }) {
  const [hover, setHover] = useState(null);
  const mx = Math.max(...data.map((d) => d[valueKey]), 1);
  const mn = Math.min(...data.map((d) => d[valueKey]));

  return (
    <div style={{ position: "relative" }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height, paddingTop: 20 }}>
        {data.map((d, i) => {
          const v = d[valueKey];
          const isHover = hover === i;
          const barColor = colorFn ? colorFn(d, v, mn, mx) : (v >= (avgLine || 0) ? `${COLORS.green}50` : `${COLORS.red}35`);
          return (
            <div
              key={i}
              style={{ flex: 1, minWidth: 0, position: "relative", cursor: "pointer" }}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            >
              <div
                style={{
                  height: Math.max((v / mx) * (height - 12), 3),
                  background: barColor,
                  borderRadius: "3px 3px 0 0",
                  opacity: isHover ? 1 : 0.8,
                  transition: "opacity 0.15s, transform 0.15s",
                  transform: isHover ? "scaleY(1.05)" : "scaleY(1)",
                  transformOrigin: "bottom",
                }}
              />
              {isHover && (
                <div style={{
                  position: "absolute", bottom: "100%", left: "50%", transform: "translateX(-50%)",
                  background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 6,
                  padding: "4px 8px", fontSize: 10, whiteSpace: "nowrap", zIndex: 10,
                  boxShadow: COLORS.shadowRaised, marginBottom: 4, color: COLORS.text,
                }}>
                  <div style={{ fontWeight: 700 }}>{formatLabel ? formatLabel(d) : d[labelKey]}</div>
                  <div style={{ color: COLORS.textSecondary }}>{formatValue ? formatValue(d) : v}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {avgLine !== undefined && (
        <div style={{ height: 1, background: `${COLORS.amber}50`, marginBottom: 6 }} />
      )}
    </div>
  );
}

export function Sparkline({ data, width = 72, height = 24, color }) {
  if (!data || data.length < 2) return <span style={{ color: COLORS.textMuted, fontSize: 9 }}>—</span>;
  const c = color || COLORS.green;
  const mn = Math.min(...data);
  const mx = Math.max(...data);
  const range = mx - mn || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - 2 - ((v - mn) / range) * (height - 4);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const last = data[data.length - 1];
  const lx = width;
  const ly = height - 2 - ((last - mn) / range) * (height - 4);
  return (
    <svg width={width} height={height} style={{ verticalAlign: "middle" }}>
      <polyline points={pts.join(" ")} fill="none" stroke={c} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lx} cy={ly} r={2.5} fill={c} />
    </svg>
  );
}

export function PulseRating({ value }) {
  const color = value >= 7 ? COLORS.red : value >= 4 ? COLORS.amber : COLORS.green;
  const label = value >= 7 ? "HIGH ALERT" : value >= 4 ? "ACTIVE WEEK" : "STEADY STATE";
  return (
    <div style={{ textAlign: "center", padding: "28px 0" }}>
      <div style={{ fontSize: 11, letterSpacing: 3, color: COLORS.textSecondary, marginBottom: 8, fontWeight: 500 }}>
        GW PULSE RATING
      </div>
      <div style={{ fontSize: 80, fontWeight: 800, color, lineHeight: 1, textShadow: `0 0 40px ${color}30` }}>
        {value.toFixed(1)}
      </div>
      <div
        style={{
          display: "inline-block",
          marginTop: 12,
          fontSize: 11,
          letterSpacing: 2,
          color,
          fontWeight: 600,
          background: `${color}15`,
          padding: "4px 16px",
          borderRadius: 20,
          border: `1px solid ${color}30`,
        }}
      >
        {label}
      </div>
    </div>
  );
}
