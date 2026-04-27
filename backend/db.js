// db.js - Database setup using SQLite (better-sqlite3)
// SQLite is chosen for simplicity; swap to PostgreSQL/MongoDB for production

const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'waste_portal.db'));

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');

// ─── Create Tables ────────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('resident', 'worker', 'admin')),
    zone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS zones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS pickup_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    resident_id INTEGER NOT NULL,
    zone TEXT NOT NULL,
    address TEXT NOT NULL,
    waste_type TEXT NOT NULL CHECK(waste_type IN ('general', 'recyclable', 'hazardous', 'bulky')),
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'assigned', 'completed', 'rejected')),
    worker_id INTEGER,
    worker_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (resident_id) REFERENCES users(id),
    FOREIGN KEY (worker_id) REFERENCES users(id)
  );
`);

module.exports = db;
