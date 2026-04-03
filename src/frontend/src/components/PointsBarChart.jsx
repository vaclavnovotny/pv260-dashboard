import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#4f86c6', '#e05c5c', '#5cb85c', '#f0ad4e', '#9b59b6', '#1abc9c', '#e67e22', '#e74c3c'];

export default function PointsBarChart({ teams }) {
  if (!teams || teams.length === 0) return null;

  const data = [...teams]
    .sort((a, b) => b.total - a.total)
    .map(t => ({ name: t.name, total: t.total }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#252836" />
        <XAxis dataKey="name" stroke="#475569" tick={{ fill: '#94a3b8' }} />
        <YAxis stroke="#475569" tick={{ fill: '#94a3b8' }} />
        <Tooltip
          cursor={{ fill: 'rgba(255,255,255,0.05)' }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const { name, total } = payload[0].payload;
            return (
              <div style={{ background: '#1a1d27', border: '1px solid #252836', borderRadius: 8, padding: '0.5rem 0.85rem', color: '#e2e8f0', fontSize: '0.85rem' }}>
                <div style={{ fontWeight: 600, marginBottom: 2 }}>{name}</div>
                <div>Total: <b>{total}</b></div>
              </div>
            );
          }}
        />
        <Bar dataKey="total">
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
