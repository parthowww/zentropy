const express = require('express');
const router = express.Router();
const db = require('../database/db');

// GET aggregate overview metrics
router.get('/overview', (req, res) => {
  try {
    const totalServices = db.prepare('SELECT COUNT(*) as count FROM services').get().count;
    const healthyServices = db.prepare("SELECT COUNT(*) as count FROM services WHERE status = 'healthy'").get().count;
    const degradedServices = db.prepare("SELECT COUNT(*) as count FROM services WHERE status = 'degraded'").get().count;
    const downServices = db.prepare("SELECT COUNT(*) as count FROM services WHERE status = 'down'").get().count;
    
    const avgLatency = db.prepare('SELECT ROUND(AVG(latency_ms), 1) as avg FROM services').get().avg || 0;
    const avgUptime = db.prepare('SELECT ROUND(AVG(uptime_pct), 2) as avg FROM services').get().avg || 100.0;
    
    const openIncidents = db.prepare("SELECT COUNT(*) as count FROM incidents WHERE status != 'resolved'").get().count;

    res.json({
      success: true,
      data: {
        total_services: totalServices,
        healthy_services: healthyServices,
        degraded_services: degradedServices,
        down_services: downServices,
        overall_status: downServices > 0 ? 'critical' : degradedServices > 0 ? 'degraded' : 'operational',
        avg_latency_ms: avgLatency,
        avg_uptime_pct: avgUptime,
        active_incidents: openIncidents
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
