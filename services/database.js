const sqlite3 = require('sqlite3').verbose();

let db;

function initializeDatabase() {
  db = new sqlite3.Database('./data/iResults.db', (err) => {
    if (err) {
      console.error('Error connecting to SQLite database:', err.message);
    } else {
      console.log('[SQL] Connected to database.');
      createTables();
    }
  });
}

function createTables() {
  db.run(`CREATE TABLE IF NOT EXISTS tracked_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    channel_id TEXT NOT NULL,
    driver_id TEXT NOT NULL UNIQUE,
    last_race_id TEXT
  )`, (err) => {
    if (err) {
      console.error('Error creating tracked_data table:', err.message);
    } else {
      db.run(`ALTER TABLE tracked_data ADD COLUMN last_race_id TEXT`, (alterErr) => {
        if (alterErr && !alterErr.message.includes("duplicate column name")) {
          console.error('Error adding last_race_id column:', alterErr.message);
        }
      });
    }
  });

  db.run(`CREATE TABLE IF NOT EXISTS guild_settings (
    guild_id TEXT PRIMARY KEY,
    channel_id TEXT NOT NULL
  )`);
}

function getDb() {
  return db;
}

module.exports = {
  initializeDatabase,
  getDb
};