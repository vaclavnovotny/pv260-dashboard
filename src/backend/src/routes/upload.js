const express = require('express');
const router = express.Router();
const { getDb } = require('../db');

router.post('/:courseId/upload', (req, res) => {
  const { courseId } = req.params;
  const { increment, teams, maxPoints } = req.body;

  if (increment == null || typeof increment !== 'number') {
    return res.status(400).json({ error: 'increment must be a number' });
  }
  if (!Array.isArray(teams) || teams.length === 0) {
    return res.status(400).json({ error: 'teams must be a non-empty array' });
  }
  for (const t of teams) {
    if (!t.name || typeof t.name !== 'string') {
      return res.status(400).json({ error: 'each team must have a string name' });
    }
    if (typeof t.points !== 'number') {
      return res.status(400).json({ error: 'each team must have a numeric points value' });
    }
  }

  const db = getDb();
  const course = db.prepare('SELECT id FROM courses WHERE id = ?').get(courseId);
  if (!course) return res.status(404).json({ error: 'Course not found' });

  const upsertAll = db.transaction(() => {
    db.prepare('INSERT OR IGNORE INTO increments (course_id, number) VALUES (?, ?)').run(courseId, increment);
    const incrementRow = db.prepare('SELECT id FROM increments WHERE course_id = ? AND number = ?').get(courseId, increment);
    if (maxPoints != null && typeof maxPoints === 'number') {
      db.prepare('UPDATE increments SET max_points = ? WHERE id = ?').run(maxPoints, incrementRow.id);
    }

    // Delete all existing scores for this increment before inserting new ones
    db.prepare('DELETE FROM scores WHERE increment_id = ?').run(incrementRow.id);

    let count = 0;
    for (const { name, points } of teams) {
      db.prepare('INSERT OR IGNORE INTO teams (name, course_id) VALUES (?, ?)').run(name, courseId);
      const team = db.prepare('SELECT id FROM teams WHERE name = ? AND course_id = ?').get(name, courseId);
      db.prepare('INSERT INTO scores (team_id, increment_id, points) VALUES (?, ?, ?)').run(team.id, incrementRow.id, points);
      count++;
    }
    return count;
  });

  const upserted = upsertAll();
  res.json({ upserted });
});

// POST /:courseId/upload-results — accepts the new per-student format
router.post('/:courseId/upload-results', (req, res) => {
  const { courseId } = req.params;
  const records = req.body;

  if (!Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ error: 'Body must be a non-empty array of student records' });
  }

  // Group by increment label → teamName → { points, extraPoints }
  const incrementMap = {};
  for (const r of records) {
    if (!r.teamName || !Array.isArray(r.increments)) continue;
    for (const inc of r.increments) {
      if (!inc.name || typeof inc.points !== 'number') continue;
      if (!incrementMap[inc.name]) incrementMap[inc.name] = {};
      // Same team may appear multiple times (once per student); first write wins
      if (!incrementMap[inc.name][r.teamName]) {
        incrementMap[inc.name][r.teamName] = {
          points: inc.points,
          extraPoints: typeof inc.extraPoints === 'number' ? inc.extraPoints : 0,
        };
      }
    }
  }

  const db = getDb();
  const course = db.prepare('SELECT id FROM courses WHERE id = ?').get(courseId);
  if (!course) return res.status(404).json({ error: 'Course not found' });

  const upsertAll = db.transaction(() => {
    let count = 0;
    for (const [label, teams] of Object.entries(incrementMap)) {
      db.prepare('INSERT OR IGNORE INTO increments (course_id, label) VALUES (?, ?)').run(courseId, label);
      const incRow = db.prepare('SELECT id FROM increments WHERE course_id = ? AND label = ?').get(courseId, label);

      db.prepare('DELETE FROM scores WHERE increment_id = ?').run(incRow.id);

      for (const [teamName, { points, extraPoints }] of Object.entries(teams)) {
        db.prepare('INSERT OR IGNORE INTO teams (name, course_id) VALUES (?, ?)').run(teamName, courseId);
        const team = db.prepare('SELECT id FROM teams WHERE name = ? AND course_id = ?').get(teamName, courseId);
        db.prepare('INSERT INTO scores (team_id, increment_id, points, extra_points) VALUES (?, ?, ?, ?)').run(team.id, incRow.id, points, extraPoints);
        count++;
      }
    }
    return count;
  });

  const upserted = upsertAll();
  res.json({ upserted });
});

module.exports = router;
