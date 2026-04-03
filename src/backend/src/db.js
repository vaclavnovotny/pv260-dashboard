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
  if (db) {
    db.close();
    db = null;
  }
}

function migrate(db) {
  // Initial schema — number is nullable so label-only increments are supported
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
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id  INTEGER NOT NULL REFERENCES courses(id),
      number     INTEGER,
      label      TEXT,
      max_points INTEGER,
      UNIQUE(course_id, number)
    );
    CREATE TABLE IF NOT EXISTS scores (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      team_id      INTEGER NOT NULL REFERENCES teams(id),
      increment_id INTEGER NOT NULL REFERENCES increments(id),
      points       REAL NOT NULL,
      extra_points REAL DEFAULT 0,
      UNIQUE(team_id, increment_id)
    );
  `);

  // If increments.number was created NOT NULL (old schema), recreate the table to make it nullable
  const numberCol = db.pragma('table_info(increments)').find(c => c.name === 'number');
  if (numberCol && numberCol.notnull) {
    db.pragma('foreign_keys = OFF');
    db.exec(`
      CREATE TABLE increments_new (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        course_id  INTEGER NOT NULL REFERENCES courses(id),
        number     INTEGER,
        label      TEXT,
        max_points INTEGER,
        UNIQUE(course_id, number)
      );
      INSERT INTO increments_new (id, course_id, number, max_points)
        SELECT id, course_id, number, max_points FROM increments;
      DROP TABLE increments;
      ALTER TABLE increments_new RENAME TO increments;
    `);
    db.pragma('foreign_keys = ON');
  }

  // Add any missing columns to existing databases
  const incCols = db.pragma('table_info(increments)').map(c => c.name);
  if (!incCols.includes('max_points')) {
    db.exec('ALTER TABLE increments ADD COLUMN max_points INTEGER');
  }
  if (!incCols.includes('label')) {
    db.exec('ALTER TABLE increments ADD COLUMN label TEXT');
  }
  db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_increments_course_label ON increments(course_id, label) WHERE label IS NOT NULL');

  const scoreCols = db.pragma('table_info(scores)').map(c => c.name);
  if (!scoreCols.includes('extra_points')) {
    db.exec('ALTER TABLE scores ADD COLUMN extra_points REAL DEFAULT 0');
  }
}

module.exports = { getDb, resetDb };
