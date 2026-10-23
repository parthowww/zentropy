const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Real HTTP ping engine
async function executeLivePing(url) {
  const startTime = performance.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6500);

    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Zentropy-Telemetry-Probe/1.0 (+https://zentropy.io/bot)'
      }
    });
    clearTimeout(timeout);

    const latencyMs = Math.round(performance.now() - startTime);
    const statusCode = response.status;
    let status = 'healthy';

    if (statusCode >= 500) {
      status = 'down';
    } else if (statusCode >= 400 || latencyMs > 600) {
      status = 'degraded';
    }

    return {
      success: true,
      statusCode,
      latencyMs,
      status,
      error: null
    };
  } catch (err) {
    const latencyMs = Math.round(performance.now() - startTime);
    const errorMsg = err.name === 'AbortError' ? 'Connection Timeout (>6.5s)' : (err.message || 'Network Unreachable');
    return {
      success: false,
      statusCode: 0,
      latencyMs,
      status: 'down',
      error: errorMsg
    };
  }
}

// GET all services
router.get('/', (req, res) => {
  try {
    const services = db.prepare('SELECT * FROM services ORDER BY id ASC').all();
    res.json({ success: true, count: services.length, data: services });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST add service (and immediately ping it with a real check)
router.post('/', async (req, res) => {
  try {
    let { name, url, category = 'api' } = req.body;
    if (!name || !url) {
      return res.status(400).json({ success: false, message: 'Name and URL are required' });
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    // Run real live check
    const pingResult = await executeLivePing(url);

    const stmt = db.prepare(`
      INSERT INTO services (name, url, category, status, last_status_code, latency_ms, uptime_pct, last_checked)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);
    const initialUptime = pingResult.status === 'down' ? 0.0 : 100.0;
    const result = stmt.run(name, url, category, pingResult.status, pingResult.statusCode, pingResult.latencyMs, initialUptime);
    const serviceId = result.lastInsertRowid;

    // Log check
    db.prepare(`
      INSERT INTO latency_logs (service_id, latency_ms, status_code, success)
      VALUES (?, ?, ?, ?)
    `).run(serviceId, pingResult.latencyMs, pingResult.statusCode, pingResult.success ? 1 : 0);

    // If down, create incident
    if (pingResult.status === 'down') {
      db.prepare(`
        INSERT INTO incidents (service_id, title, severity, status, message, error_details)
        VALUES (?, ?, 'critical', 'open', ?, ?)
      `).run(
        serviceId,
        `Service unreachable on initial probe: ${name}`,
        `Probe attempted GET on ${url} and failed with error.`,
        pingResult.error
      );
    }

    const created = db.prepare('SELECT * FROM services WHERE id = ?').get(serviceId);
    res.status(201).json({ success: true, data: created, liveCheck: pingResult });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST ping single service with real network fetch
router.post('/:id/ping', async (req, res) => {
  try {
    const service = db.prepare('SELECT * FROM services WHERE id = ?').get(req.params.id);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    const ping = await executeLivePing(service.url);

    // Update service
    db.prepare(`
      UPDATE services
      SET status = ?, last_status_code = ?, latency_ms = ?, last_checked = datetime('now')
      WHERE id = ?
    `).run(ping.status, ping.statusCode, ping.latencyMs, service.id);

    // Record log
    db.prepare(`
      INSERT INTO latency_logs (service_id, latency_ms, status_code, success)
      VALUES (?, ?, ?, ?)
    `).run(service.id, ping.latencyMs, ping.statusCode, ping.success ? 1 : 0);

    // If status became down and no open incident exists, create one
    if (ping.status === 'down') {
      const openInc = db.prepare("SELECT id FROM incidents WHERE service_id = ? AND status != 'resolved'").get(service.id);
      if (!openInc) {
        db.prepare(`
          INSERT INTO incidents (service_id, title, severity, status, message, error_details)
          VALUES (?, ?, 'critical', 'open', ?, ?)
        `).run(
          service.id,
          `HTTP failure on ${service.name}`,
          `Real ping failed against ${service.url} (Status: ${ping.statusCode})`,
          ping.error
        );
      }
    } else if (ping.status === 'healthy') {
      // Auto-resolve any existing incident
      db.prepare(`
        UPDATE incidents 
        SET status = 'resolved', resolved_at = datetime('now')
        WHERE service_id = ? AND status != 'resolved'
      `).run(service.id);
    }

    const updated = db.prepare('SELECT * FROM services WHERE id = ?').get(service.id);
    res.json({ success: true, data: updated, ping });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST check all services simultaneously
router.post('/check-all', async (req, res) => {
  try {
    const services = db.prepare('SELECT * FROM services').all();
    const results = await Promise.all(services.map(async (svc) => {
      const ping = await executeLivePing(svc.url);
      db.prepare(`
        UPDATE services
        SET status = ?, last_status_code = ?, latency_ms = ?, last_checked = datetime('now')
        WHERE id = ?
      `).run(ping.status, ping.statusCode, ping.latencyMs, svc.id);

      db.prepare(`
        INSERT INTO latency_logs (service_id, latency_ms, status_code, success)
        VALUES (?, ?, ?, ?)
      `).run(svc.id, ping.latencyMs, ping.statusCode, ping.success ? 1 : 0);

      return { id: svc.id, name: svc.name, ping };
    }));

    const updatedServices = db.prepare('SELECT * FROM services ORDER BY id ASC').all();
    res.json({ success: true, count: updatedServices.length, data: updatedServices, checks: results });
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
    res.json({ success: true, message: 'Service deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
