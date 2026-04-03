const MEDALS = [
  { label: '1st', color: '#FFD700', glow: 'rgba(255,215,0,0.3)',  size: '2.2rem' },
  { label: '2nd', color: '#C0C0C0', glow: 'rgba(192,192,192,0.25)', size: '1.8rem' },
  { label: '3rd', color: '#CD7F32', glow: 'rgba(205,127,50,0.25)',  size: '1.6rem' },
];

export default function TopTeamsPanel({ teams }) {
  if (!teams || teams.length === 0) return null;

  const sorted = [...teams].sort((a, b) => b.total - a.total).slice(0, 3);

  return (
    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
      {sorted.map((team, i) => {
        const medal = MEDALS[i];
        return (
          <div key={team.name} style={{
            flex: '1 1 180px',
            maxWidth: 240,
            background: '#1a1d27',
            border: `1px solid ${medal.color}44`,
            borderRadius: 12,
            padding: '1.25rem 1rem',
            textAlign: 'center',
            boxShadow: `0 0 18px ${medal.glow}`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.4rem',
          }}>
            <div style={{ fontSize: medal.size, lineHeight: 1 }}>
              {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: medal.color, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {medal.label} place
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 600, color: '#f1f5f9', marginTop: '0.25rem' }}>
              {team.name}
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: medal.color }}>
              {team.total}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>total points</div>
          </div>
        );
      })}
    </div>
  );
}
