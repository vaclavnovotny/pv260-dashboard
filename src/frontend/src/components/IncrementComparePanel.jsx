function round2(n) {
  return Math.round(n * 100) / 100;
}

// Absolute heatmap: ratio 0→1 maps hue 0 (red) → 120 (green)
function heatFromRatio(ratio) {
  const r = Math.max(0, Math.min(1, ratio));
  const hue = Math.round(r * 120);
  return {
    background: `hsl(${hue}, 40%, 22%)`,
    color: hue < 30 ? '#fca5a5' : hue > 90 ? '#86efac' : '#cbd5e1',
  };
}

// Relative heatmap: value's position within [minVal, maxVal]
function heatFromRange(value, minVal, maxVal) {
  if (maxVal === minVal) return { background: '#1e2230', color: '#94a3b8' };
  return heatFromRatio((value - minVal) / (maxVal - minVal));
}

const ROWS = [
  { key: 'total',  label: 'Total points', higherIsBetter: true },
  { key: 'mean',   label: 'Mean',         higherIsBetter: true },
  { key: 'median', label: 'Median',       higherIsBetter: true },
  { key: 'max',    label: 'Max',          higherIsBetter: true },
  { key: 'min',    label: 'Min',          higherIsBetter: true },
];

export default function IncrementComparePanel({ increments, teams, global, maxPoints }) {
  if (!increments || increments.length < 2) return null;

  const cols = increments.map(n => {
    const scores = teams.map(t => t.scores[n]).filter(v => v != null).sort((a, b) => a - b);
    const count = scores.length;
    if (count === 0) return { n, count: 0, total: 0, mean: 0, median: 0, max: 0, min: 0 };
    const total = global[n] ?? scores.reduce((a, b) => a + b, 0);
    const mean = round2(total / count);
    const mid = Math.floor(count / 2);
    const median = count % 2 === 0 ? round2((scores[mid - 1] + scores[mid]) / 2) : scores[mid];
    return { n, count, total, mean, median, max: scores[count - 1], min: scores[0] };
  });

  const th = { padding: '0.5rem 1rem', textAlign: 'center', background: '#13151f', color: '#94a3b8', fontWeight: 600, fontSize: '0.875rem', border: '1px solid #252836' };
  const td = { padding: '0.5rem 1rem', textAlign: 'center', border: '1px solid #252836' };

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th style={{ ...th, textAlign: 'left', minWidth: 140 }}>Metric</th>
            {cols.map(c => (
              <th key={c.n} style={th}>{c.n} (max points: {maxPoints?.[c.n] ?? 9})</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map(row => {
            const values = cols.map(c => c[row.key]);
            const lo = Math.min(...values);
            const hi = Math.max(...values);

            return (
              <tr key={row.key}>
                <td style={{ ...td, textAlign: 'left', fontWeight: 500, color: '#94a3b8', fontSize: '0.875rem' }}>
                  {row.label}
                </td>
                {cols.map(c => {
                  const value = c[row.key];
                  const mp = maxPoints?.[c.n] ?? 9;

                  // Coloring: absolute (% of max) when maxPoints available, else relative across increments
                  let cellStyle;
                  if (mp != null) {
                    const ratio = row.key === 'total'
                      ? value / (mp * c.count)
                      : value / mp;
                    cellStyle = heatFromRatio(row.higherIsBetter ? ratio : 1 - ratio);
                  } else {
                    cellStyle = row.higherIsBetter
                      ? heatFromRange(value, lo, hi)
                      : heatFromRange(hi - value + lo, lo, hi);
                  }

                  const divisor = row.key === 'total' ? mp * c.count : mp;
                  const label = `${Math.round((value / divisor) * 100)}%`;

                  return (
                    <td key={c.n} style={{ ...td, ...cellStyle, fontWeight: 600, fontSize: '0.9rem' }}>
                      {label}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      <p style={{ fontSize: '0.75rem', color: '#475569', marginTop: '0.5rem', marginBottom: 0 }}>
        Colors show absolute % of max possible points (default max: 9)
      </p>
    </div>
  );
}
