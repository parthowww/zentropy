const express = require('express');
const router = express.Router();
const db = require('../database/db');

// GET all services with optional filter
router.get('/', (req, res) => {
  try {
    const { status, environment } = req.query;
    let query = 'SELECT * FROM services WHERE 1=1';
    const params = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    if (environment) {
      query += ' AND environment = ?';
      params.push(environment);
    }
    query += ' ORDER BY id ASC';

    const services = db.prepare(query).all(...params);
    res.json({ success: true, count: services.length, data: services });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET single service by id
router.get('/:id', (req, res) => {
  try {
    const service = db.prepare('SELECT * FROM services WHERE id = ?').get(req.params.id);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    const recentLogs = db.prepare('SELECT * FROM latency_logs WHERE service_id = ? ORDER BY recorded_at DESC LIMIT 20').all(req.params.id);
    res.json({ success: true, data: { ...service, recent_logs: recentLogs } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST add a new service
router.post('/', (req, res) => {
  try {
    const { name, url, environment = 'production', category = 'api' } = req.body;
    if (!name || !url) {
      return res.status(400).json({ success: false, message: 'Name and URL are required' });
    }

    const initialLatency = Math.floor(Math.random() * 40) + 15;
    const stmt = db.prepare(`
      INSERT INTO services (name, url, environment, category, status, latency_ms, uptime_pct)
      VALUES (?, ?, ?, ?, 'healthy', ?, 100.0)
    `);
    const result = stmt.run(name, url, environment, category, initialLatency);
    const newService = db.prepare('SELECT * FROM services WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({ success: true, data: newService });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH ping/check a service status
router.patch('/:id/ping', (req, res) => {
  try {
    const service = db.prepare('SELECT * FROM services WHERE id = ?').get(req.params.id);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    // Simulate jitter latency
    const newLatency = Math.max(12, service.latency_ms + (Math.floor(Math.random() * 15) - 7));
    const newStatus = newLatency > 250 ? 'degraded' : 'healthy';

    db.prepare(`
      UPDATE services 
      SET latency_ms = ?, status = ?, last_checked = datetime('now')
      WHERE id = ?
    `).run(newLatency, newStatus, req.params.id);

    db.prepare(`
      INSERT INTO latency_logs (service_id, latency_ms, status_code)
      VALUES (?, ?, 200)
    `).run(req.params.id, newLatency);

    const updated = db.prepare('SELECT * FROM services WHERE id = ?').get(req.params.id);
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE a service
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM services WHERE id = ?').run(req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    res.json({ success: true, message: 'Service removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
