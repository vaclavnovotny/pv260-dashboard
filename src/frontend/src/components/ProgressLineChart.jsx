import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#4f86c6', '#e05c5c', '#5cb85c', '#f0ad4e', '#9b59b6', '#1abc9c', '#e67e22', '#e74c3c'];

export default function ProgressLineChart({ increments, teams }) {
  if (!teams || teams.length === 0 || !increments || increments.length === 0) return null;

  const data = increments.map(n => {
    const entry = { increment: String(n) };
    for (const t of teams) {
      entry[t.name] = t.scores[n] ?? null;
    }
    return entry;
  });

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#252836" />
        <XAxis dataKey="increment" stroke="#475569" tick={{ fill: '#94a3b8' }} />
        <YAxis stroke="#475569" tick={{ fill: '#94a3b8' }} />
        <Tooltip contentStyle={{ background: '#1a1d27', border: '1px solid #252836', borderRadius: 8, color: '#e2e8f0' }} />
        <Legend />
        {teams.map((t, i) => (
          <Line
            key={t.name}
            type="monotone"
            dataKey={t.name}
            stroke={COLORS[i % COLORS.length]}
            strokeWidth={2}
            dot={{ r: 4 }}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
