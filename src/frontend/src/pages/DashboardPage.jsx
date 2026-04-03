import { useState, useEffect } from 'react';
import CourseSelector from '../components/CourseSelector';
import TeamTable from '../components/TeamTable';
import PointsBarChart from '../components/PointsBarChart';
import ProgressLineChart from '../components/ProgressLineChart';
import IncrementStatsChart from '../components/IncrementStatsChart';
import IncrementComparePanel from '../components/IncrementComparePanel';
import TopTeamsPanel from '../components/TopTeamsPanel';
import { animals } from 'unique-names-generator';
import { getStats } from '../api';

// Step by a prime so consecutive teams are spread across the alphabet
const STRIDE = 37;

function anonymise(teams) {
  return teams.map((t, i) => {
    const animal = animals[(i * STRIDE) % animals.length];
    return { ...t, name: 'Team ' + animal.charAt(0).toUpperCase() + animal.slice(1) };
  });
}

export default function DashboardPage() {
  const [courseId, setCourseId] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showNames, setShowNames] = useState(false);

  useEffect(() => {
    if (!courseId) { setStats(null); return; }
    setLoading(true);
    setError('');
    getStats(courseId)
      .then(setStats)
      .catch(() => setError('Failed to load stats'))
      .finally(() => setLoading(false));
  }, [courseId]);

  const teams = stats
    ? (showNames ? stats.teams : anonymise(stats.teams))
    : [];

  return (
    <div>
      <h2>Dashboard</h2>
      <CourseSelector value={courseId} onChange={setCourseId} />

      {loading && <p style={{ marginTop: '1.5rem', color: '#64748b' }}>Loading…</p>}
      {error && <div className="alert-error" style={{ marginTop: '1rem' }}>{error}</div>}

      {stats && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.5rem' }}>
            <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
              {teams.length} team{teams.length !== 1 ? 's' : ''}
            </span>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setShowNames(v => !v)}
              style={{ fontSize: '0.8rem', padding: '0.3rem 0.75rem' }}
            >
              {showNames ? 'Hide team names' : 'Show team names'}
            </button>
          </div>

          <p className="section-title">Increment Comparison</p>
          <div className="card">
            <IncrementComparePanel increments={stats.increments} teams={stats.teams} global={stats.global} maxPoints={stats.maxPoints} />
          </div>

          <p className="section-title">Top Teams</p>
          <div className="card">
            <TopTeamsPanel teams={teams} />
          </div>

          <p className="section-title">Team Leaderboard</p>
          <div className="card">
            <TeamTable increments={stats.increments} teams={teams} />
          </div>

          <p className="section-title">Total Points per Team</p>
          <div className="card">
            <PointsBarChart teams={teams} />
          </div>

          <p className="section-title">Points over Increments</p>
          <div className="card">
            <ProgressLineChart increments={stats.increments} teams={teams} />
          </div>

          <p className="section-title">Min / Mean / Max per Increment</p>
          <div className="card">
            <IncrementStatsChart increments={stats.increments} teams={teams} />
          </div>
        </>
      )}
    </div>
  );
}
