import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';

function round2(n) {
  return Math.round(n * 100) / 100;
}

export default function IncrementStatsChart({ increments, teams }) {
  if (!teams || teams.length === 0 || !increments || increments.length === 0) return null;

  const data = increments.map(n => {
    const scores = teams.map(t => t.scores[n]).filter(v => v != null);
    if (scores.length === 0) return { increment: String(n), min: null, max: null, mean: null, range: null };
    const min = Math.min(...scores);
    const max = Math.max(...scores);
    const mean = round2(scores.reduce((a, b) => a + b, 0) / scores.length);
    return { increment: String(n), min, max, mean, range: [min, max] };
  });

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || payload.length === 0) return null;
    const d = data.find(r => r.increment === label);
    if (!d) return null;
    return (
      <div style={{
        background: '#1a1d27', border: '1px solid #252836', borderRadius: 8,
        padding: '0.6rem 0.9rem', fontSize: '0.85rem', lineHeight: 1.8,
        boxShadow: '0 2px 8px rgba(0,0,0,0.4)', color: '#e2e8f0'
      }}>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
        <div style={{ color: '#f87171' }}>Max: <b>{d.max ?? '—'}</b></div>
        <div style={{ color: '#60a5fa' }}>Mean: <b>{d.mean ?? '—'}</b></div>
        <div style={{ color: '#4ade80' }}>Min: <b>{d.min ?? '—'}</b></div>
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#252836" />
        <XAxis dataKey="increment" stroke="#475569" tick={{ fill: '#94a3b8' }} />
        <YAxis stroke="#475569" tick={{ fill: '#94a3b8' }} />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={v => ({ min: 'Min', max: 'Max', mean: 'Mean' }[v] ?? v)}
        />
        {/* shaded min–max band */}
        <Area
          type="monotone"
          dataKey="range"
          fill="#4f86c620"
          stroke="none"
          legendType="none"
          connectNulls
          isAnimationActive={false}
        />
        <Line type="monotone" dataKey="max"  stroke="#f87171" strokeWidth={2} strokeDasharray="5 3" dot={{ r: 4 }} connectNulls />
        <Line type="monotone" dataKey="mean" stroke="#60a5fa" strokeWidth={2.5} dot={{ r: 5 }} connectNulls />
        <Line type="monotone" dataKey="min"  stroke="#4ade80" strokeWidth={2} strokeDasharray="5 3" dot={{ r: 4 }} connectNulls />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
