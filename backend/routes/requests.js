// routes/requests.js - Pickup Request CRUD endpoints

const express = require('express');
const db      = require('../db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// ─── GET /api/requests ────────────────────────────────────────────────────────
// Resident: see own requests | Worker: see requests in their zone | Admin: see all
router.get('/', authenticate, (req, res) => {
  let rows;

  if (req.user.role === 'resident') {
    rows = db.prepare(`
      SELECT r.*, u.name AS resident_name, w.name AS worker_name
      FROM pickup_requests r
      JOIN users u ON u.id = r.resident_id
      LEFT JOIN users w ON w.id = r.worker_id
      WHERE r.resident_id = ?
      ORDER BY r.created_at DESC
    `).all(req.user.id);

  } else if (req.user.role === 'worker') {
    rows = db.prepare(`
      SELECT r.*, u.name AS resident_name, w.name AS worker_name
      FROM pickup_requests r
      JOIN users u ON u.id = r.resident_id
      LEFT JOIN users w ON w.id = r.worker_id
      WHERE r.zone = ? AND r.status IN ('pending', 'assigned')
      ORDER BY r.created_at DESC
    `).all(req.user.zone);

  } else {
    // Admin sees everything
    rows = db.prepare(`
      SELECT r.*, u.name AS resident_name, w.name AS worker_name
      FROM pickup_requests r
      JOIN users u ON u.id = r.resident_id
      LEFT JOIN users w ON w.id = r.worker_id
      ORDER BY r.created_at DESC
    `).all();
  }

  res.json(rows);
});

// ─── GET /api/requests/:id ───────────────────────────────────────────────────
router.get('/:id', authenticate, (req, res) => {
  const row = db.prepare(`
    SELECT r.*, u.name AS resident_name, w.name AS worker_name
    FROM pickup_requests r
    JOIN users u ON u.id = r.resident_id
    LEFT JOIN users w ON w.id = r.worker_id
    WHERE r.id = ?
  `).get(req.params.id);

  if (!row) return res.status(404).json({ error: 'Request not found' });

  // Residents can only see their own
  if (req.user.role === 'resident' && row.resident_id !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  res.json(row);
});

// ─── POST /api/requests ───────────────────────────────────────────────────────
// Only residents can create requests
router.post('/', authenticate, authorize('resident'), (req, res) => {
  const { address, waste_type, description } = req.body;

  if (!address || !waste_type) {
    return res.status(400).json({ error: 'address and waste_type are required' });
  }
  if (!['general', 'recyclable', 'hazardous', 'bulky'].includes(waste_type)) {
    return res.status(400).json({ error: 'Invalid waste_type' });
  }
  if (!req.user.zone) {
    return res.status(400).json({ error: 'Your account has no zone assigned. Contact admin.' });
  }

  const result = db.prepare(`
    INSERT INTO pickup_requests (resident_id, zone, address, waste_type, description)
    VALUES (?, ?, ?, ?, ?)
  `).run(req.user.id, req.user.zone, address, waste_type, description || null);

  const created = db.prepare('SELECT * FROM pickup_requests WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(created);
});

// ─── PATCH /api/requests/:id/status ──────────────────────────────────────────
// Workers can mark as completed | Admin can do anything
router.patch('/:id/status', authenticate, authorize('worker', 'admin'), (req, res) => {
  const { status, worker_notes } = req.body;
  const allowed = ['assigned', 'completed', 'rejected'];

  if (!allowed.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${allowed.join(', ')}` });
  }

  const request = db.prepare('SELECT * FROM pickup_requests WHERE id = ?').get(req.params.id);
  if (!request) return res.status(404).json({ error: 'Request not found' });

  // Workers can only update requests in their zone
  if (req.user.role === 'worker' && request.zone !== req.user.zone) {
    return res.status(403).json({ error: 'This request is outside your zone' });
  }

  db.prepare(`
    UPDATE pickup_requests
    SET status = ?, worker_id = ?, worker_notes = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(status, req.user.id, worker_notes || null, req.params.id);

  const updated = db.prepare('SELECT * FROM pickup_requests WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// ─── DELETE /api/requests/:id ─────────────────────────────────────────────────
// Residents can cancel their own pending requests; Admin can delete any
router.delete('/:id', authenticate, (req, res) => {
  const request = db.prepare('SELECT * FROM pickup_requests WHERE id = ?').get(req.params.id);
  if (!request) return res.status(404).json({ error: 'Request not found' });

  if (req.user.role === 'resident') {
    if (request.resident_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Can only cancel pending requests' });
    }
  } else if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }

  db.prepare('DELETE FROM pickup_requests WHERE id = ?').run(req.params.id);
  res.json({ message: 'Request deleted successfully' });
});

module.exports = router;
