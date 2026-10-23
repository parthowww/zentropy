const express = require('express');
const router = express.Router();
const db = require('../database/db');

// GET all incidents
router.get('/', (req, res) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT i.*, s.name as service_name 
      FROM incidents i
      JOIN services s ON i.service_id = s.id
      WHERE 1=1
    `;
    const params = [];
    if (status) {
      query += ' AND i.status = ?';
      params.push(status);
    }
    query += ' ORDER BY i.created_at DESC';

    const incidents = db.prepare(query).all(...params);
    res.json({ success: true, count: incidents.length, data: incidents });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST create incident
router.post('/', (req, res) => {
  try {
    const { service_id, title, severity = 'minor', status = 'investigating', message } = req.body;
    if (!service_id || !title || !message) {
      return res.status(400).json({ success: false, message: 'service_id, title, and message are required' });
    }

    const stmt = db.prepare(`
      INSERT INTO incidents (service_id, title, severity, status, message)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(service_id, title, severity, status, message);
    const incident = db.prepare('SELECT * FROM incidents WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: incident });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH resolve an incident
router.patch('/:id/resolve', (req, res) => {
  try {
    const result = db.prepare(`
      UPDATE incidents 
      SET status = 'resolved', resolved_at = datetime('now')
      WHERE id = ?
    `).run(req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: 'Incident not found' });
    }

    const incident = db.prepare('SELECT * FROM incidents WHERE id = ?').get(req.params.id);
    res.json({ success: true, data: incident });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
