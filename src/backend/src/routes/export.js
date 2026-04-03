const express = require('express');
const router = express.Router();
const { getDb } = require('../db');

// GET /api/export
router.get('/', (req, res) => {
  const db = getDb();

  const courses = db.prepare('SELECT id, name FROM courses ORDER BY name').all();

  const data = courses.map(course => {
    const increments = db
      .prepare('SELECT id, number, label, max_points FROM increments WHERE course_id = ? ORDER BY COALESCE(label, CAST(number AS TEXT))')
      .all(course.id);

    const incrementsOut = increments.map(inc => {
      const scores = db.prepare(`
        SELECT t.name AS team, s.points, COALESCE(s.extra_points, 0) AS extra_points
        FROM scores s
        JOIN teams t ON t.id = s.team_id
        WHERE s.increment_id = ?
        ORDER BY t.name
      `).all(inc.id);

      return {
        number: inc.number,
        label: inc.label ?? null,
        maxPoints: inc.max_points ?? null,
        teams: scores.map(s => ({ name: s.team, points: s.points, extraPoints: s.extra_points })),
      };
    });

    return { name: course.name, increments: incrementsOut };
  });

  res.json({ version: 1, exportedAt: new Date().toISOString(), courses: data });
});

// POST /api/import
router.post('/', (req, res) => {
  const { version, courses } = req.body;

  if (version !== 1 || !Array.isArray(courses)) {
    return res.status(400).json({ error: 'Invalid export format' });
  }

  const db = getDb();

  const importAll = db.transaction(() => {
    let coursesImported = 0;
    let scoresImported = 0;

    for (const course of courses) {
      if (!course.name || !Array.isArray(course.increments)) continue;

      // Upsert course
      db.prepare('INSERT OR IGNORE INTO courses (name) VALUES (?)').run(course.name);
      const courseRow = db.prepare('SELECT id FROM courses WHERE name = ?').get(course.name);

      for (const inc of course.increments) {
        if (inc.number == null && inc.label == null) continue;

        // Upsert increment — prefer label-based lookup when label present
        let incRow;
        if (inc.label != null) {
          db.prepare('INSERT OR IGNORE INTO increments (course_id, label) VALUES (?, ?)').run(courseRow.id, inc.label);
          incRow = db.prepare('SELECT id FROM increments WHERE course_id = ? AND label = ?').get(courseRow.id, inc.label);
        } else {
          db.prepare('INSERT OR IGNORE INTO increments (course_id, number) VALUES (?, ?)').run(courseRow.id, inc.number);
          incRow = db.prepare('SELECT id FROM increments WHERE course_id = ? AND number = ?').get(courseRow.id, inc.number);
        }

        if (inc.maxPoints != null) {
          db.prepare('UPDATE increments SET max_points = ? WHERE id = ?').run(inc.maxPoints, incRow.id);
        }

        if (!Array.isArray(inc.teams) || inc.teams.length === 0) continue;

        // Full replace of scores for this increment
        db.prepare('DELETE FROM scores WHERE increment_id = ?').run(incRow.id);

        for (const t of inc.teams) {
          if (!t.name || t.points == null) continue;
          db.prepare('INSERT OR IGNORE INTO teams (name, course_id) VALUES (?, ?)').run(t.name, courseRow.id);
          const teamRow = db.prepare('SELECT id FROM teams WHERE name = ? AND course_id = ?').get(t.name, courseRow.id);
          const extraPoints = typeof t.extraPoints === 'number' ? t.extraPoints : 0;
          db.prepare('INSERT INTO scores (team_id, increment_id, points, extra_points) VALUES (?, ?, ?, ?)').run(teamRow.id, incRow.id, t.points, extraPoints);
          scoresImported++;
        }
      }
      coursesImported++;
    }

    return { coursesImported, scoresImported };
  });

  const result = importAll();
  res.json(result);
});

module.exports = router;
