import { COLORS } from "../utils/theme";

export function Card({ children, style = {} }) {
  return (
    <div
      style={{
        background: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 12,
        padding: 20,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function StatCard({ label, value, sub, color = COLORS.text }) {
  return (
    <Card style={{ textAlign: "center", flex: "1 1 130px", minWidth: 110 }}>
      <div style={{ fontSize: 10, color: COLORS.textSecondary, letterSpacing: 1.5, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: COLORS.textSecondary, marginTop: 4 }}>{sub}</div>}
    </Card>
  );
}

export function TabBtn({ active, label, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? COLORS.surface : "transparent",
        color: active ? COLORS.green : COLORS.textSecondary,
        border: active ? `1px solid ${COLORS.border}` : "1px solid transparent",
        borderRadius: 8,
        padding: "8px 16px",
        fontSize: 13,
        fontWeight: active ? 700 : 500,
        cursor: "pointer",
        whiteSpace: "nowrap",
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

export function PlayerTable({ players, columns }) {
  return (
    <div style={{ overflowX: "auto", borderRadius: 12, border: `1px solid ${COLORS.border}` }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr style={{ background: COLORS.surface }}>
            {columns.map((c, i) => (
              <th
                key={i}
                style={{
                  padding: "10px 6px",
                  textAlign: i <= 1 ? "left" : "center",
                  color: COLORS.textSecondary,
                  fontWeight: 600,
                  fontSize: 10,
                  whiteSpace: "nowrap",
                }}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {players.map((p, idx) => (
            <tr
              key={p.id}
              style={{
                borderTop: `1px solid ${COLORS.border}`,
                background: idx % 2 ? `${COLORS.surface}25` : "transparent",
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
                  {c.render(p, idx)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
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
