const express = require('express');
const router = express.Router();
const { getDb } = require('../db');

router.get('/:courseId/stats', (req, res) => {
  const courseId = parseInt(req.params.courseId, 10);
  const db = getDb();

  const course = db.prepare('SELECT id FROM courses WHERE id = ?').get(courseId);
  if (!course) return res.status(404).json({ error: 'Course not found' });

  const incrementRows = db
    .prepare('SELECT id, number, label, max_points FROM increments WHERE course_id = ? ORDER BY COALESCE(label, CAST(number AS TEXT))')
    .all(courseId);
  const incKey = r => r.label != null ? r.label : r.number;
  const increments = incrementRows.map(incKey);
  const incMap = Object.fromEntries(incrementRows.map(r => [r.id, incKey(r)]));
  const maxPointsMap = Object.fromEntries(incrementRows.map(r => [incKey(r), r.max_points ?? null]));

  const teamRows = db
    .prepare('SELECT id, name FROM teams WHERE course_id = ? ORDER BY name')
    .all(courseId);

  const scoreRows = db.prepare(`
    SELECT s.team_id, s.increment_id, s.points, COALESCE(s.extra_points, 0) AS extra_points
    FROM scores s
    JOIN teams t ON t.id = s.team_id
    WHERE t.course_id = ?
  `).all(courseId);

  const teamScores = {};
  for (const { team_id, increment_id, points, extra_points } of scoreRows) {
    if (!teamScores[team_id]) teamScores[team_id] = {};
    teamScores[team_id][incMap[increment_id]] = points + extra_points;
  }

  const teams = teamRows.map(t => {
    const scores = teamScores[t.id] || {};
    const total = Object.values(scores).reduce((a, b) => a + b, 0);
    return { name: t.name, scores, total };
  });

  const global = {};
  for (const { increment_id, points, extra_points } of scoreRows) {
    const n = incMap[increment_id];
    global[n] = (global[n] || 0) + points + extra_points;
  }

  res.json({ increments, teams, global, maxPoints: maxPointsMap });
});

module.exports = router;
