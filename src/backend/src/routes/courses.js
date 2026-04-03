const express = require('express');
const router = express.Router();
const { getDb } = require('../db');

router.get('/', (req, res) => {
  const rows = getDb().prepare('SELECT * FROM courses ORDER BY name').all();
  res.json(rows);
});

router.post('/', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  try {
    const result = getDb().prepare('INSERT INTO courses (name) VALUES (?)').run(name);
    res.status(201).json({ id: result.lastInsertRowid, name });
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(409).json({ error: 'Course already exists' });
    throw e;
  }
});

router.put('/:id', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  const db = getDb();
  const course = db.prepare('SELECT id FROM courses WHERE id = ?').get(req.params.id);
  if (!course) return res.status(404).json({ error: 'Course not found' });
  try {
    db.prepare('UPDATE courses SET name = ? WHERE id = ?').run(name, req.params.id);
    res.json({ id: Number(req.params.id), name });
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(409).json({ error: 'Course name already exists' });
    throw e;
  }
});

router.delete('/:id', (req, res) => {
  const db = getDb();
  const course = db.prepare('SELECT id FROM courses WHERE id = ?').get(req.params.id);
  if (!course) return res.status(404).json({ error: 'Course not found' });
  db.transaction(() => {
    // delete scores for all teams in this course
    db.prepare(`DELETE FROM scores WHERE team_id IN (SELECT id FROM teams WHERE course_id = ?)`).run(req.params.id);
    // delete scores for all increments in this course (belt-and-suspenders)
    db.prepare(`DELETE FROM scores WHERE increment_id IN (SELECT id FROM increments WHERE course_id = ?)`).run(req.params.id);
    db.prepare('DELETE FROM teams WHERE course_id = ?').run(req.params.id);
    db.prepare('DELETE FROM increments WHERE course_id = ?').run(req.params.id);
    db.prepare('DELETE FROM courses WHERE id = ?').run(req.params.id);
  })();
  res.status(204).end();
});

router.get('/:id/increments', (req, res) => {
  const db = getDb();
  const course = db.prepare('SELECT id FROM courses WHERE id = ?').get(req.params.id);
  if (!course) return res.status(404).json({ error: 'Course not found' });
  const rows = db.prepare(
    'SELECT id, number, label, max_points FROM increments WHERE course_id = ? ORDER BY COALESCE(label, CAST(number AS TEXT))'
  ).all(req.params.id);
  res.json(rows);
});

router.patch('/:id/increments/:incrementId/max-points', (req, res) => {
  const { maxPoints } = req.body;
  if (maxPoints == null || typeof maxPoints !== 'number') {
    return res.status(400).json({ error: 'maxPoints must be a number' });
  }
  const db = getDb();
  const inc = db.prepare('SELECT id FROM increments WHERE id = ? AND course_id = ?').get(req.params.incrementId, req.params.id);
  if (!inc) return res.status(404).json({ error: 'Increment not found' });
  db.prepare('UPDATE increments SET max_points = ? WHERE id = ?').run(maxPoints, inc.id);
  res.json({ ok: true });
});

module.exports = router;
