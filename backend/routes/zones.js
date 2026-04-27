// routes/zones.js - Zone management + Admin stats

const express = require('express');
const db      = require('../db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// ─── GET /api/zones ───────────────────────────────────────────────────────────
router.get('/', authenticate, (req, res) => {
  const zones = db.prepare('SELECT * FROM zones ORDER BY name').all();
  res.json(zones);
});

// ─── GET /api/zones/stats ─────────────────────────────────────────────────────
// Admin dashboard stats per zone
router.get('/stats', authenticate, authorize('admin'), (req, res) => {
  const stats = db.prepare(`
    SELECT 
      zone,
      COUNT(*) AS total,
      SUM(CASE WHEN status = 'pending'   THEN 1 ELSE 0 END) AS pending,
      SUM(CASE WHEN status = 'assigned'  THEN 1 ELSE 0 END) AS assigned,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed,
      SUM(CASE WHEN status = 'rejected'  THEN 1 ELSE 0 END) AS rejected
    FROM pickup_requests
    GROUP BY zone
    ORDER BY zone
  `).all();

  const overall = db.prepare(`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN status = 'pending'   THEN 1 ELSE 0 END) AS pending,
      SUM(CASE WHEN status = 'assigned'  THEN 1 ELSE 0 END) AS assigned,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed,
      SUM(CASE WHEN status = 'rejected'  THEN 1 ELSE 0 END) AS rejected
    FROM pickup_requests
  `).get();

  res.json({ overall, by_zone: stats });
});

// ─── POST /api/zones ──────────────────────────────────────────────────────────
router.post('/', authenticate, authorize('admin'), (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });

  try {
    const result = db.prepare(
      'INSERT INTO zones (name, description) VALUES (?, ?)'
    ).run(name, description || null);
    const zone = db.prepare('SELECT * FROM zones WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(zone);
  } catch {
    res.status(409).json({ error: 'Zone with this name already exists' });
  }
});

// ─── GET /api/zones/workers ───────────────────────────────────────────────────
// Admin: list all workers with their zones
router.get('/workers', authenticate, authorize('admin'), (req, res) => {
  const workers = db.prepare(`
    SELECT id, name, email, zone,
      (SELECT COUNT(*) FROM pickup_requests WHERE worker_id = users.id AND status = 'completed') AS completed_count
    FROM users WHERE role = 'worker'
    ORDER BY zone
  `).all();
  res.json(workers);
});

module.exports = router;
