export default function TeamTable({ increments, teams }) {
  if (!teams || teams.length === 0) return <p>No data yet. Upload some increment results first.</p>;

  const sorted = [...teams].sort((a, b) => b.total - a.total);

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 400 }}>
        <thead>
          <tr>
            <th style={th}>Rank</th>
            <th style={{ ...th, textAlign: 'left' }}>Team</th>
            {increments.map(n => (
              <th key={n} style={th}>{n}</th>
            ))}
            <th style={{ ...th, fontWeight: 'bold', background: '#1e2d4a', color: '#93c5fd' }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((team, idx) => (
            <tr key={team.name} style={{ background: idx % 2 === 0 ? '#1a1d27' : '#1e2230' }}>
              <td style={{ ...td, color: '#64748b' }}>{idx + 1}</td>
              <td style={{ ...td, textAlign: 'left', fontWeight: 500 }}>{team.name}</td>
              {increments.map(n => (
                <td key={n} style={td}>{team.scores[n] ?? '—'}</td>
              ))}
              <td style={{ ...td, fontWeight: 'bold', background: '#1e2d4a', color: '#93c5fd' }}>{team.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const th = { border: '1px solid #252836', padding: '0.5rem 1rem', background: '#13151f', color: '#94a3b8', textAlign: 'center' };
const td = { border: '1px solid #252836', padding: '0.5rem 1rem', textAlign: 'center', color: '#e2e8f0' };
