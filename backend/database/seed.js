const db = require('./db');

function seedDatabase() {
  // Check if services exist
  const existing = db.prepare('SELECT COUNT(*) as count FROM services').get();
  if (existing.count > 0) {
    console.log('Database already seeded.');
    return;
  }

  console.log('Seeding PulseOps database...');

  const insertService = db.prepare(`
    INSERT INTO services (name, url, environment, category, status, latency_ms, uptime_pct, last_checked)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `);

  const services = [
    ['Auth & Session Gateway', 'https://auth.internal.ops/v1/health', 'production', 'auth', 'healthy', 28, 99.99],
    ['Primary Postgres Read-Replica', 'postgres://db-replica-01.ops:5432', 'production', 'database', 'healthy', 12, 100.0],
    ['Payments & Billing Webhook', 'https://pay.internal.ops/health', 'production', 'api', 'healthy', 42, 99.95],
    ['Vector Search Cluster', 'https://search-v2.internal.ops/ready', 'production', 'api', 'degraded', 285, 98.70],
    ['Realtime WebSocket Bridge', 'wss://ws.internal.ops/stream', 'production', 'gateway', 'healthy', 19, 99.98],
    ['Async Task Scheduler', 'https://queue.internal.ops/status', 'production', 'worker', 'healthy', 34, 99.94],
    ['Notification Dispatcher (SES/Twilio)', 'https://notify.internal.ops/ping', 'staging', 'worker', 'healthy', 55, 99.88]
  ];

  for (const s of services) {
    insertService.run(...s);
  }

  const insertIncident = db.prepare(`
    INSERT INTO incidents (service_id, title, severity, status, message, created_at, resolved_at)
    VALUES (?, ?, ?, ?, ?, datetime('now', ?), datetime('now', ?))
  `);

  insertIncident.run(
    4,
    'High p99 latency on vector indexing cluster',
    'major',
    'investigating',
    'Memory pressure detected on nodes vector-idx-03 and 04 during batch embeddings. Autoscaling group is adding 2 replicas.',
    '-35 minutes',
    null
  );

  insertIncident.run(
    3,
    'Intermittent webhook timeout with upstream payment provider',
    'minor',
    'resolved',
    'Provider resolved elevated error rates on their edge ingress. Retried queue cleared with 0 dropped events.',
    '-4 hours',
    '-3 hours'
  );

  insertIncident.run(
    1,
    'Scheduled routine SSL certificate renewal',
    'maintenance',
    'resolved',
    'Automated zero-downtime certificate rotation on ingress load balancer completed.',
    '-1 day',
    '-23 hours'
  );

  // Insert mock latency logs for history sparkline
  const insertLog = db.prepare(`
    INSERT INTO latency_logs (service_id, latency_ms, status_code, recorded_at)
    VALUES (?, ?, ?, datetime('now', ?))
  `);

  for (let sId = 1; sId <= 7; sId++) {
    for (let i = 24; i >= 0; i--) {
      const jitter = Math.floor(Math.random() * 20) - 10;
      const base = sId === 4 ? 240 : 30;
      insertLog.run(sId, Math.max(10, base + jitter), 200, `-${i * 10} minutes`);
    }
  }

  console.log('Seeding completed successfully.');
}

if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
