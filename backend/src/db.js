const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data.db');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    migrate(db);
  }
  return db;
}

function resetDb() {
  db = null;
}

function migrate(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS courses (
      id   INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    );
    CREATE TABLE IF NOT EXISTS teams (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      name      TEXT NOT NULL,
      course_id INTEGER NOT NULL REFERENCES courses(id),
      UNIQUE(name, course_id)
    );
    CREATE TABLE IF NOT EXISTS increments (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL REFERENCES courses(id),
      number    INTEGER NOT NULL,
      UNIQUE(course_id, number)
    );
    CREATE TABLE IF NOT EXISTS scores (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      team_id      INTEGER NOT NULL REFERENCES teams(id),
      increment_id INTEGER NOT NULL REFERENCES increments(id),
      points       INTEGER NOT NULL,
      UNIQUE(team_id, increment_id)
    );
  `);
}

module.exports = { getDb, resetDb };
